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
import time
import asyncio

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
    # Всегда передаем garment_des как пустую строку, если он не задан, так как модель ожидает этот параметр
    if garment_des and garment_des.strip():
        payload["input"]["garment_des"] = garment_des
    else:
        payload["input"]["garment_des"] = ""
    
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


def poll_prediction_status(prediction_id: str, max_wait_time: int = 300, poll_interval: int = 5) -> dict:
    """
    Опрашивает статус предсказания Replicate до завершения или истечения времени ожидания.
    
    Args:
        prediction_id: ID предсказания Replicate
        max_wait_time: Максимальное время ожидания в секундах (по умолчанию 5 минут)
        poll_interval: Интервал между запросами в секундах (по умолчанию 5 секунд)
    
    Returns:
        dict: Финальный результат предсказания
    """
    start_time = time.time()
    
    while time.time() - start_time < max_wait_time:
        try:
            r = requests.get(
                f"https://api.replicate.com/v1/predictions/{prediction_id}",
                headers={"Authorization": f"Bearer {TOKEN}"},
                timeout=30
            )
            
            if r.status_code >= 400:
                logger.error(f"❌ Failed to poll prediction status: {r.text}")
                break
                
            result = r.json()
            status = result.get("status")
            
            logger.info(f"🔄 Polling prediction {prediction_id}, status: {status}")
            
            if status in ["succeeded", "failed", "canceled"]:
                logger.info(f"✅ Prediction {prediction_id} completed with status: {status}")
                return result
            
            # Ждем перед следующим запросом
            time.sleep(poll_interval)
            
        except Exception as e:
            logger.error(f"❌ Error polling prediction status: {e}")
            time.sleep(poll_interval)
    
    # Если время ожидания истекло, делаем последний запрос
    logger.warning(f"⏰ Polling timeout reached for prediction {prediction_id}")
    try:
        r = requests.get(
            f"https://api.replicate.com/v1/predictions/{prediction_id}",
            headers={"Authorization": f"Bearer {TOKEN}"},
            timeout=30
        )
        if r.status_code < 400:
            return r.json()
    except Exception as e:
        logger.error(f"❌ Final polling attempt failed: {e}")
    
    raise HTTPException(408, f"Prediction {prediction_id} did not complete within {max_wait_time} seconds")

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

    # Получаем начальный результат от Replicate
    prediction_id = pred.get("id")
    initial_status = pred.get("status")
    
    logger.info(f"🎯 Initial Replicate prediction status: {initial_status}")
    logger.info(f"🎯 Prediction ID: {prediction_id}")
    
    # Если предсказание еще не завершено, опрашиваем статус до завершения
    if initial_status in ["starting", "processing"]:
        logger.info(f"⏳ Prediction is {initial_status}, waiting for completion...")
        pred = poll_prediction_status(prediction_id, max_wait_time=300, poll_interval=5)
    
    # Получаем финальный результат
    replicate_output_url = pred.get("output")
    prediction_status = pred.get("status")
    gcs_output_url = None
    
    logger.info(f"🎯 Final Replicate prediction status: {prediction_status}")
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
    elif prediction_status == "failed":
        logger.error(f"❌ Replicate prediction failed with status: {prediction_status}")
        if pred.get("error"):
            logger.error(f"❌ Replicate error details: {pred.get('error')}")
        raise HTTPException(500, f"Virtual try-on failed: {pred.get('error', 'Unknown error')}")
    elif prediction_status == "canceled":
        logger.error(f"❌ Replicate prediction was canceled")
        raise HTTPException(500, "Virtual try-on was canceled")
    elif not replicate_output_url and prediction_status == "succeeded":
        logger.error(f"❌ No output URL received from Replicate despite success status")
        raise HTTPException(500, "No result received from virtual try-on service")

    # Формируем успешный ответ (так как мы дождались завершения)
    response_data = {
        "category_used": cat.value if isinstance(cat, Category) else cat,
        "category_probs": probs,
        "status": "succeeded",
        "prediction_id": prediction_id,
        "garment_url": g_url,
        "human_url": h_url,
        "output": gcs_output_url or replicate_output_url
    }
    
    # Для отладки добавляем дополнительную информацию
    if replicate_output_url and gcs_output_url != replicate_output_url:
        response_data["original_replicate_url"] = replicate_output_url
    
    logger.info(f"📤 Returning successful response with output: {response_data['output']}")
    return JSONResponse(response_data)


@router.post("/try-on-sequential")
async def try_on_sequential(
    request: Request,
    # keep form params for non-file fields
    steps: int = Form(30),
    seed: int = Form(42),
    crop: bool = Form(False),
    force_dc: bool = Form(False),
    mask_only: bool = Form(False),
    garment_des: Optional[str] = Form(None),
):
    """
    Sequential try-on endpoint: first tries on the top, then uses the result to try on the bottom.
    Accepted form fields:
      - top_garment (file) or top_garment_url (string URL)
      - bottom_garment (file) or bottom_garment_url (string URL)
      - human (file) or human_url (string URL)
    """
    form = await request.form()
    
    # Read file-like entries safely
    top_garment_file = form.get("top_garment")
    bottom_garment_file = form.get("bottom_garment")
    human_file = form.get("human")
    top_garment_url = form.get("top_garment_url")
    bottom_garment_url = form.get("bottom_garment_url")
    human_url = form.get("human_url")

    # --- Resolve top garment ---
    top_garment_bytes: bytes | None = None
    top_garment_name_for_guess: str | None = None
    top_garment_source_url: Optional[str] = None

    if isinstance(top_garment_url, str) and top_garment_url.strip():
        if is_http_url(top_garment_url.strip()):
            top_garment_source_url = top_garment_url.strip()
            top_garment_bytes, _, g_name = fetch_bytes_from_url(top_garment_source_url)
            top_garment_name_for_guess = g_name
        else:
            raise HTTPException(400, "top_garment_url must be http/https")
    elif hasattr(top_garment_file, "filename") and getattr(top_garment_file, "filename", None):
        upload: UploadFile = top_garment_file  # type: ignore[assignment]
        data = await upload.read()
        if not data:
            raise HTTPException(400, "Empty top garment file")
        top_garment_bytes = data
        top_garment_name_for_guess = upload.filename
        await upload.seek(0)
    else:
        raise HTTPException(400, "Provide top_garment file or top_garment_url")

    # --- Resolve bottom garment ---
    bottom_garment_bytes: bytes | None = None
    bottom_garment_name_for_guess: str | None = None
    bottom_garment_source_url: Optional[str] = None

    if isinstance(bottom_garment_url, str) and bottom_garment_url.strip():
        if is_http_url(bottom_garment_url.strip()):
            bottom_garment_source_url = bottom_garment_url.strip()
            bottom_garment_bytes, _, g_name = fetch_bytes_from_url(bottom_garment_source_url)
            bottom_garment_name_for_guess = g_name
        else:
            raise HTTPException(400, "bottom_garment_url must be http/https")
    elif hasattr(bottom_garment_file, "filename") and getattr(bottom_garment_file, "filename", None):
        upload: UploadFile = bottom_garment_file  # type: ignore[assignment]
        data = await upload.read()
        if not data:
            raise HTTPException(400, "Empty bottom garment file")
        bottom_garment_bytes = data
        bottom_garment_name_for_guess = upload.filename
        await upload.seek(0)
    else:
        raise HTTPException(400, "Provide bottom_garment file or bottom_garment_url")

    # --- Resolve human ---
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

    # --- Auto-category for garments ---
    top_cat, top_probs = auto_category(top_garment_bytes, top_garment_name_for_guess)  # type: ignore[arg-type]
    bottom_cat, bottom_probs = auto_category(bottom_garment_bytes, bottom_garment_name_for_guess)  # type: ignore[arg-type]
    
    # Validate categories
    if top_cat.value not in ["upper_body", "dresses"]:
        raise HTTPException(400, f"Top garment should be upper_body or dresses, got {top_cat.value}")
    if bottom_cat.value not in ["lower_body"]:
        raise HTTPException(400, f"Bottom garment should be lower_body, got {bottom_cat.value}")

    # --- Upload garments to Replicate ---
    if top_garment_source_url:
        top_g_url = top_garment_source_url
    else:
        upload: UploadFile = form.get("top_garment")  # type: ignore[assignment]
        if not upload:
            raise HTTPException(400, "Top garment is missing")
        top_g_url = await replicate_upload(upload)

    if bottom_garment_source_url:
        bottom_g_url = bottom_garment_source_url
    else:
        upload_b: UploadFile = form.get("bottom_garment")  # type: ignore[assignment]
        if not upload_b:
            raise HTTPException(400, "Bottom garment is missing")
        bottom_g_url = await replicate_upload(upload_b)

    if human_source_url:
        h_url = human_source_url
    else:
        upload_h: UploadFile = form.get("human")  # type: ignore[assignment]
        if not upload_h:
            raise HTTPException(400, "Human is missing")
        h_url = await replicate_upload(upload_h)

    logger.info(f"🎯 Starting sequential try-on: top={top_cat.value}, bottom={bottom_cat.value}")
    
    # --- STEP 1: Try on the top garment ---
    logger.info(f"👕 Step 1: Trying on top garment ({top_cat.value})")
    top_pred = replicate_predict(
        top_g_url, h_url,
        category=top_cat.value,
        steps=steps, seed=seed, crop=crop, force_dc=force_dc,
        mask_only=mask_only, garment_des=garment_des,
    )

    # Wait for top try-on completion
    top_prediction_id = top_pred.get("id")
    top_initial_status = top_pred.get("status")
    
    logger.info(f"🎯 Top garment prediction status: {top_initial_status}")
    
    if top_initial_status in ["starting", "processing"]:
        logger.info(f"⏳ Top prediction is {top_initial_status}, waiting for completion...")
        top_pred = poll_prediction_status(top_prediction_id, max_wait_time=300, poll_interval=5)
    
    top_replicate_output_url = top_pred.get("output")
    top_prediction_status = top_pred.get("status")
    
    logger.info(f"🎯 Top garment final status: {top_prediction_status}")
    
    if top_prediction_status != "succeeded" or not top_replicate_output_url:
        logger.error(f"❌ Top garment try-on failed with status: {top_prediction_status}")
        if top_pred.get("error"):
            logger.error(f"❌ Top garment error details: {top_pred.get('error')}")
        raise HTTPException(500, f"Top garment try-on failed: {top_pred.get('error', 'Unknown error')}")
    
    # Upload top result to GCS
    try:
        logger.info(f"🔄 Processing top garment result: {top_replicate_output_url}")
        top_gcs_output_url = download_and_upload_to_gcs(top_replicate_output_url)
        logger.info(f"✅ Top garment result uploaded to GCS: {top_gcs_output_url}")
    except Exception as e:
        logger.error(f"❌ Failed to process top garment result: {e}")
        top_gcs_output_url = top_replicate_output_url
    
    # --- STEP 2: Try on the bottom garment using the top result ---
    logger.info(f"👖 Step 2: Trying on bottom garment ({bottom_cat.value}) using top result")
    
    # Use the top result as the human image for bottom try-on
    bottom_pred = replicate_predict(
        bottom_g_url, top_gcs_output_url or top_replicate_output_url,
        category=bottom_cat.value,
        steps=steps, seed=seed, crop=crop, force_dc=force_dc,
        mask_only=mask_only, garment_des=garment_des,
    )

    # Wait for bottom try-on completion
    bottom_prediction_id = bottom_pred.get("id")
    bottom_initial_status = bottom_pred.get("status")
    
    logger.info(f"🎯 Bottom garment prediction status: {bottom_initial_status}")
    
    if bottom_initial_status in ["starting", "processing"]:
        logger.info(f"⏳ Bottom prediction is {bottom_initial_status}, waiting for completion...")
        bottom_pred = poll_prediction_status(bottom_prediction_id, max_wait_time=300, poll_interval=5)
    
    bottom_replicate_output_url = bottom_pred.get("output")
    bottom_prediction_status = bottom_pred.get("status")
    
    logger.info(f"🎯 Bottom garment final status: {bottom_prediction_status}")
    
    if bottom_prediction_status != "succeeded" or not bottom_replicate_output_url:
        logger.error(f"❌ Bottom garment try-on failed with status: {bottom_prediction_status}")
        if bottom_pred.get("error"):
            logger.error(f"❌ Bottom garment error details: {bottom_pred.get('error')}")
        raise HTTPException(500, f"Bottom garment try-on failed: {bottom_pred.get('error', 'Unknown error')}")
    
    # Upload final result to GCS
    try:
        logger.info(f"🔄 Processing final result: {bottom_replicate_output_url}")
        final_gcs_output_url = download_and_upload_to_gcs(bottom_replicate_output_url)
        logger.info(f"✅ Final result uploaded to GCS: {final_gcs_output_url}")
    except Exception as e:
        logger.error(f"❌ Failed to process final result: {e}")
        final_gcs_output_url = bottom_replicate_output_url

    # --- Return sequential try-on result ---
    response_data = {
        "status": "succeeded",
        "top_garment": {
            "category_used": top_cat.value,
            "category_probs": top_probs,
            "prediction_id": top_prediction_id,
            "garment_url": top_g_url,
            "output": top_gcs_output_url or top_replicate_output_url
        },
        "bottom_garment": {
            "category_used": bottom_cat.value,
            "category_probs": bottom_probs,
            "prediction_id": bottom_prediction_id,
            "garment_url": bottom_g_url,
            "output": final_gcs_output_url or bottom_replicate_output_url
        },
        "human_url": h_url,
        "final_output": final_gcs_output_url or bottom_replicate_output_url
    }
    
    logger.info(f"📤 Returning sequential try-on response with final output: {response_data['final_output']}")
    return JSONResponse(response_data)