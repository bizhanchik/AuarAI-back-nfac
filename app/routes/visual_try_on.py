import os, io, json, requests
from enum import Enum
from typing import Tuple, Dict, Optional
from fastapi import APIRouter, File, Form, UploadFile, HTTPException, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from PIL import Image
from urllib.parse import urlparse
import os.path as osp
import logging
import uuid

import torch
from transformers import CLIPProcessor, CLIPModel   # загружается один раз

from ..gcs_uploader import gcs_uploader

logger = logging.getLogger(__name__)

load_dotenv()
TOKEN = os.getenv("REPLICATE_API_TOKEN")
if not TOKEN:
    raise RuntimeError("REPLICATE_API_TOKEN is not set")

MODEL = "cuuupid/idm-vton:0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985"

router = APIRouter(prefix="/visual-try-on", tags=["visual-try-on"])

# ---- CLIP init (один раз) ----
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
CANDIDATES = {
    "upper_body":  "photo of an upper-body garment (tops, t-shirt, shirt, hoodie, sweater, jacket)",
    "lower_body":  "photo of a lower-body garment (pants, jeans, trousers, shorts, skirt)",
    "dresses":     "photo of a dress or one-piece garment"
}

def is_http_url(s: str | None) -> bool:
    if not s:
        return False
    try:
        u = urlparse(s)
        return u.scheme in ("http", "https") and bool(u.netloc)
    except Exception:
        return False

def fetch_bytes_from_url(url: str, timeout: int = 20) -> tuple[bytes, str, str]:
    """
    Download bytes from a public URL. Returns (content, content_type, suggested_name).
    Raises HTTPException on failure.
    """
    if not is_http_url(url):
        raise HTTPException(status_code=400, detail="Invalid URL (must be http/https)")
    try:
        r = requests.get(url, timeout=timeout, stream=True)
        r.raise_for_status()
        content = r.content
        if not content:
            raise HTTPException(status_code=400, detail="Empty content at URL")
        ctype = r.headers.get("Content-Type", "application/octet-stream").split(";")[0].strip()
        # derive a filename from URL path
        path = urlparse(url).path
        name = osp.basename(path) or "download.bin"
        return content, ctype, name
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to download URL: {e}")

class Category(str, Enum):
    upper_body = "upper_body"
    lower_body = "lower_body"
    dresses    = "dresses"

# ---- эвристика по имени файла ----
def filename_guess(filename: str | None) -> Category | None:
    if not filename:
        return None
    name = filename.lower()
    if any(k in name for k in ["jeans","pants","trousers","shorts","skirt","slacks","chinos"]):
        return Category.lower_body
    if any(k in name for k in ["dress","gown","onepiece","one-piece"]):
        return Category.dresses
    if any(k in name for k in ["tee","tshirt","t-shirt","shirt","hoodie","sweater","jumper","jacket","coat","blouse","top"]):
        return Category.upper_body
    return None

# ---- быстрая эвристика по геометрии ----
def shape_hint(img: Image.Image) -> Category | None:
    w, h = img.size
    if h > w * 1.6:   # очень вытянуто по вертикали — часто платье
        return Category.dresses
    return None

# ---- zero-shot CLIP ----
def clip_guess(img: Image.Image) -> Tuple[Category, Dict[str, float]]:
    texts = list(CANDIDATES.values())
    inputs = clip_processor(text=texts, images=img, return_tensors="pt", padding=True)
    with torch.no_grad():
        outputs = clip_model(**inputs)
        # logits_per_image: [1, N]
        logits = outputs.logits_per_image.softmax(dim=-1).squeeze(0)  # probs
    probs = {k: float(logits[i]) for i, k in enumerate(CANDIDATES.keys())}
    # выбрать максимум
    best = max(probs.items(), key=lambda kv: kv[1])[0]
    return Category(best), probs

# ---- объединение: эвристики + CLIP ----
def auto_category(garment_bytes: bytes, filename: str | None) -> Tuple[Category, Dict[str, float]]:
    # 1) filename
    by_name = filename_guess(filename)
    # 2) изображение
    try:
        img = Image.open(io.BytesIO(garment_bytes)).convert("RGB")
    except Exception:
        # если вдруг не смогли открыть, вернём дефолт
        return Category.upper_body, {"upper_body": 1.0, "lower_body": 0.0, "dresses": 0.0}

    by_shape = shape_hint(img)
    by_clip, probs = clip_guess(img)

    # Простая логика с приоритетами
    # если filename и CLIP совпали — берём это
    if by_name and by_name == by_clip:
        return by_clip, probs
    # если форма явно указывает на dresses — усилим dresses
    if by_shape == Category.dresses and probs["dresses"] < 0.5:
        probs["dresses"] += 0.2  # подталкиваем
        probs = {k: max(min(v, 1.0), 0.0) for k, v in probs.items()}
        by_clip = max(probs.items(), key=lambda kv: kv[1])[0]
        return Category(by_clip), probs
    # если есть filename-хинт и у CLIP низкая уверенность (<0.5), доверимся имени
    if by_name and max(probs.values()) < 0.5:
        return by_name, probs
    # иначе доверимся CLIP
    return by_clip, probs

# ---- Репликейт аплоад (работает у тебя с полем "content") ----
async def replicate_upload(file: UploadFile) -> str:
    data = await file.read()
    if not data:
        raise HTTPException(400, f"Empty file: {file.filename}")
    r = requests.post(
        "https://api.replicate.com/v1/files",
        headers={"Authorization": f"Bearer {TOKEN}"},
        files={"content": (file.filename or "upload.png", data, file.content_type or "image/png")},
        timeout=120
    )
    if r.status_code >= 400:
        raise HTTPException(500, f"Replicate upload failed: {r.text}")
    try:
        return r.json()["urls"]["get"]
    except Exception:
        raise HTTPException(500, f"Unexpected upload response: {r.text}")

def replicate_predict(garm_url, human_url, *, category: str, steps=30, seed=42,
                      crop=False, force_dc=False, mask_only=False, garment_des: str | None = None):
    payload = {
        "version": MODEL,
        "input": {
            "garm_img": garm_url,
            "human_img": human_url,
            "category": category,           # "upper_body" | "lower_body" | "dresses"
            "steps": steps, "seed": seed,
            "crop": crop, "force_dc": force_dc, "mask_only": mask_only
        }
    }
    if garment_des:
        payload["input"]["garment_des"] = garment_des
    
    logger.info(f"🚀 Sending request to Replicate with payload: {json.dumps(payload, indent=2)}")
    
    r = requests.post(
        "https://api.replicate.com/v1/predictions",
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json", "Prefer": "wait"},
        data=json.dumps(payload), timeout=600
    )
    
    logger.info(f"📥 Replicate response status: {r.status_code}")
    logger.info(f"📥 Replicate response: {r.text}")
    
    if r.status_code >= 400:
        raise HTTPException(500, f"Replicate prediction failed: {r.text}")
    
    response_json = r.json()
    logger.info(f"✅ Replicate prediction result: {json.dumps(response_json, indent=2)}")
    
    return response_json

def download_and_upload_to_gcs(replicate_url: str) -> str:
    """
    Загружает изображение из Replicate URL и сохраняет в Google Cloud Storage.
    Возвращает публичный URL из GCS.
    """
    try:
        logger.info(f"📥 Downloading image from Replicate: {replicate_url}")
        
        # Загружаем изображение из Replicate с авторизацией
        headers = {"Authorization": f"Bearer {TOKEN}"}
        response = requests.get(replicate_url, headers=headers, timeout=30)
        response.raise_for_status()
        
        image_data = response.content
        logger.info(f"✅ Downloaded {len(image_data)} bytes from Replicate")
        
        # Генерируем уникальное имя файла
        filename = f"virtual_try_on/{uuid.uuid4()}.jpg"
        
        # Загружаем в Google Cloud Storage
        logger.info(f"☁️ Uploading to GCS: {filename}")
        public_url = gcs_uploader.upload_file(
            file_data=image_data,
            filename=filename,
            content_type="image/jpeg"
        )
        
        if not public_url:
            raise Exception("Failed to upload to GCS")
            
        logger.info(f"✅ Successfully uploaded to GCS: {public_url}")
        return public_url
        
    except Exception as e:
        logger.error(f"❌ Failed to download and upload image: {e}")
        raise HTTPException(500, f"Failed to process try-on result: {str(e)}")

@router.post("/try-on")
async def try_on(
    request: Request,
    # keep form params for non-file fields
    category: Optional[str] = Form(None),
    steps: int = Form(30),
    seed: int = Form(42),
    crop: bool = Form(False),
    force_dc: bool = Form(False),
    mask_only: bool = Form(False),
    garment_des: Optional[str] = Form(None),
):
    """
    Universal endpoint: accepts garment/human as file or URL (or mixture).
    We parse the multipart form manually to avoid Swagger sending 'string' for empty file inputs.
    Accepted form fields:
      - garment (file) or garment_url (string URL)
      - human (file)   or human_url (string URL)
    """
    form = await request.form()
    # read file-like entries safely
    garment_file = form.get("garment")
    human_file   = form.get("human")
    garment_url  = form.get("garment_url")
    human_url    = form.get("human_url")

    # --- Resolve garment: prefer URL if valid, otherwise file; ignore placeholder "string"
    garment_bytes: bytes | None = None
    garment_name_for_guess: str | None = None
    garment_source_url: Optional[str] = None

    if isinstance(garment_url, str) and garment_url.strip():
        if is_http_url(garment_url.strip()):
            garment_source_url = garment_url.strip()
            garment_bytes, _, g_name = fetch_bytes_from_url(garment_source_url)
            garment_name_for_guess = g_name
        else:
            raise HTTPException(400, "garment_url must be http/https")
    elif hasattr(garment_file, "filename") and getattr(garment_file, "filename", None):
        # UploadFile case
        upload: UploadFile = garment_file  # type: ignore[assignment]
        data = await upload.read()
        if not data:
            raise HTTPException(400, "Empty garment file")
        garment_bytes = data
        garment_name_for_guess = upload.filename
        await upload.seek(0)
    else:
        raise HTTPException(400, "Provide garment file or garment_url")

    # --- Resolve human: prefer URL if valid, otherwise file
    human_source_url: Optional[str] = None
    if isinstance(human_url, str) and human_url.strip():
        if is_http_url(human_url.strip()):
            human_source_url = human_url.strip()
        else:
            raise HTTPException(400, "human_url must be http/https")
    elif hasattr(human_file, "filename") and getattr(human_file, "filename", None):
        # ok, will upload below
        pass
    else:
        raise HTTPException(400, "Provide human file or human_url")

    if category is not None:
        category = category.strip()
        if category == "":
            category = None

    # --- Auto-category if needed ---
    if category is None:
        cat, probs = auto_category(garment_bytes, garment_name_for_guess)  # type: ignore[arg-type]
    else:
        val = category.lower()
        allowed = {"upper_body", "lower_body", "dresses"}
        if val not in allowed:
            raise HTTPException(status_code=422, detail="Input should be 'upper_body', 'lower_body' or 'dresses'")
        cat, probs = (Category(val), {})

    # --- Uploads / URLs resolution ---
    if garment_source_url:
        g_url = garment_source_url
    else:
        upload: UploadFile = form.get("garment")  # type: ignore[assignment]
        if not upload:
            raise HTTPException(400, "Garment is missing")
        g_url = await replicate_upload(upload)

    if human_source_url:
        h_url = human_source_url
    else:
        upload_h: UploadFile = form.get("human")  # type: ignore[assignment]
        if not upload_h:
            raise HTTPException(400, "Human is missing")
        h_url = await replicate_upload(upload_h)

    pred = replicate_predict(
        g_url, h_url,
        category=cat.value if isinstance(cat, Category) else cat,
        steps=steps, seed=seed, crop=crop, force_dc=force_dc,
        mask_only=mask_only, garment_des=garment_des,
    )

    # Получаем результат от Replicate
    replicate_output_url = pred.get("output")
    prediction_status = pred.get("status")
    gcs_output_url = None
    
    logger.info(f"🎯 Replicate prediction status: {prediction_status}")
    logger.info(f"🎯 Replicate output URL: {replicate_output_url}")
    
    # Если есть результат от Replicate, загружаем его в GCS
    if replicate_output_url and prediction_status == "succeeded":
        try:
            logger.info(f"🔄 Processing Replicate result: {replicate_output_url}")
            gcs_output_url = download_and_upload_to_gcs(replicate_output_url)
            logger.info(f"✅ Successfully processed and uploaded to GCS: {gcs_output_url}")
        except Exception as e:
            logger.error(f"❌ Failed to process Replicate result: {e}")
            # В случае ошибки возвращаем оригинальный URL
            gcs_output_url = replicate_output_url
    elif prediction_status != "succeeded":
        logger.error(f"❌ Replicate prediction failed with status: {prediction_status}")
        if pred.get("error"):
            logger.error(f"❌ Replicate error details: {pred.get('error')}")
    elif not replicate_output_url:
        logger.error(f"❌ No output URL received from Replicate")

    return JSONResponse({
        "category_used": cat.value if isinstance(cat, Category) else cat,
        "category_probs": probs,       # для дебага можно убрать
        "status": pred.get("status"),
        "output": gcs_output_url or replicate_output_url,  # Возвращаем GCS URL если доступен
        "prediction_id": pred.get("id"),
        "garment_url": g_url,
        "human_url": h_url,
        "original_replicate_url": replicate_output_url  # Для отладки
    })