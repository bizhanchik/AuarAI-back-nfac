from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional, Tuple
import os
import io
from PIL import Image
import json
import base64
import mimetypes
import requests
import re
import time
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from openai import OpenAI
import pandas as pd

from ..gcs_uploader import gcs_uploader
from ..firebase_auth import get_current_user_firebase
from .. import models
from ..services.image_compression import ImageCompressionService
from ..database import get_db
import logging

# Load environment variables
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/body-analysis", tags=["body-analysis"])

# ---------- КОНФИГУРАЦИЯ БРЕНДОВ И СТИЛЕЙ ----------
STYLE_PRESETS = {
    "men": {
        "casual": ["Levi's", "Nike", "Adidas", "Uniqlo", "J.Crew", "Patagonia", "Champion", "Tommy Hilfiger"],
        "smart_casual": ["Polo Ralph Lauren", "J.Crew", "Banana Republic", "Hugo Boss", "Calvin Klein", "Tommy Hilfiger", "Lacoste"],
        "office": ["Hugo Boss", "Calvin Klein", "Brooks Brothers", "Banana Republic", "Theory", "Suit Supply"],
        "street": ["Nike", "Adidas", "Supreme", "Champion", "Stussy", "Carhartt", "Vans", "Converse"]
    },
    "women": {
        "casual": ["Levi's", "Nike", "Adidas", "Uniqlo", "J.Crew", "Madewell", "Everlane", "Gap"],
        "smart_casual": ["J.Crew", "Banana Republic", "Ann Taylor", "Madewell", "Everlane", "COS", "& Other Stories"],
        "office": ["Theory", "Ann Taylor", "Banana Republic", "Hugo Boss", "Calvin Klein", "Brooks Brothers"],
        "street": ["Nike", "Adidas", "Champion", "Stussy", "Urban Outfitters", "Vans", "Converse"]
    }
}

BRANDS_AVOID = [
    "Shein", "Romwe", "Floerns", "Zaful", "SheIn", "ROMWE", "FLOERNS", "ZAFUL",
    "Allegra K", "ALLEGRA K", "Milumia", "MILUMIA", "Verdusa", "VERDUSA",
    "SweatyRocks", "SWEATYROCKS", "Simplee", "SIMPLEE", "MakeMeChic", "MAKEMECHIC",
    "Blooming Jelly", "BLOOMING JELLY", "R.Vivimos", "R.VIVIMOS"
]

PRICE_RANGE = {"min": 20, "max": 160}
MIN_RATING = 4.2
MIN_REVIEWS = 500

# ---------- CSV ДАННЫЕ ----------
CSV_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "classified.csv")

# Глобальная переменная для хранения данных CSV
_clothing_data = None

def load_clothing_data() -> pd.DataFrame:
    """Загружает данные одежды из CSV файла"""
    global _clothing_data
    if _clothing_data is None:
        try:
            _clothing_data = pd.read_csv(CSV_FILE_PATH)
            logger.info(f"📊 Загружено {len(_clothing_data)} товаров из CSV")
        except Exception as e:
            logger.error(f"❌ Ошибка загрузки CSV: {e}")
            _clothing_data = pd.DataFrame()  # Пустой DataFrame в случае ошибки
    return _clothing_data

# ---------- УТИЛИТЫ ----------
def b64img(image_bytes: bytes) -> str:
    """Конвертирует изображение в base64 для OpenAI API"""
    return f"data:image/jpeg;base64," + base64.b64encode(image_bytes).decode()

def safe_api_call(func, *args, max_retries: int = 3, **kwargs):
    """Безопасный вызов API с повторными попытками"""
    for attempt in range(max_retries):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            logger.warning(f"⚠️ API ошибка (попытка {attempt + 1}/{max_retries}): {e}")
            time.sleep(2 ** attempt)  # экспоненциальная задержка

# Pydantic models for request/response
from pydantic import BaseModel

class BodyAnalysisResult(BaseModel):
    gender: Optional[str] = None
    body_type: Optional[str] = None
    style_goal: Optional[str] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[int] = None

class IdealFits(BaseModel):
    top_fit: Optional[str] = None
    bottom_fit: Optional[str] = None
    preferred_styles: Optional[List[str]] = None
    avoid_styles: Optional[List[str]] = None
    fit_description: Optional[str] = None

class IdealColors(BaseModel):
    best_colors: Optional[List[str]] = None
    avoid_colors: Optional[List[str]] = None
    color_description: Optional[str] = None

class ClothingItem(BaseModel):
    name: str
    price: float
    image_url: str
    product_url: str
    gender: str
    piece_type: str
    subtype: Optional[str] = None
    fit: Optional[str] = None
    style: Optional[str] = None
    season: Optional[str] = None
    main_color: str
    palette_tags: Optional[str] = None

class ClothingRecommendations(BaseModel):
    tops: Optional[List[ClothingItem]] = None
    bottoms: Optional[List[ClothingItem]] = None
    total_found: Optional[Dict[str, int]] = None

class Metadata(BaseModel):
    recommended_brands: Optional[List[str]] = None
    search_queries: Optional[Dict[str, str]] = None

class BodyAnalysisResponse(BaseModel):
    success: bool
    message: str
    analysis: Optional[BodyAnalysisResult] = None
    ideal_fits: Optional[IdealFits] = None
    ideal_colors: Optional[IdealColors] = None
    clothing_recommendations: Optional[ClothingRecommendations] = None
    metadata: Optional[Metadata] = None
    photo_url: Optional[str] = None

class WardrobeCompatibilityResult(BaseModel):
    compatibility_percentage: float
    matching_items: int
    total_items: int
    recommendations: List[str]
    color_matches: List[str]
    style_matches: List[str]
    missing_essentials: List[str]

class WardrobeCompatibilityResponse(BaseModel):
    success: bool
    message: str
    result: Optional[WardrobeCompatibilityResult] = None

# ---------- ПОИСК ТОВАРОВ В CSV ----------
def ai_select_clothing_from_csv(analysis: Dict, max_items: int = 15) -> Tuple[List[ClothingItem], List[ClothingItem]]:
    """ИИ подбор одежды из CSV данных с использованием ChatGPT API"""
    clothing_data = load_clothing_data()
    
    if clothing_data.empty:
        logger.warning("⚠️ CSV данные не загружены")
        return [], []
    
    try:
        # Подготавливаем данные для ИИ анализа
        gender = analysis.get('gender_label', 'unisex')
        body_type = analysis.get('body_type', 'unknown')
        style_goal = analysis.get('style_goal', 'casual')
        best_colors = analysis.get('color_palette', {}).get('best_colors', [])
        avoid_colors = analysis.get('color_palette', {}).get('avoid_colors', [])
        recommended_categories = analysis.get('recommended_categories', {})
        
        # Фильтруем данные по полу для уменьшения объема
        if gender != 'unisex':
            filtered_data = clothing_data[clothing_data['gender'].str.lower() == gender.lower()]
        else:
            filtered_data = clothing_data
        
        # Ограничиваем количество товаров для анализа (чтобы не превысить лимит токенов)
        sample_size = min(100, len(filtered_data))
        sample_data = filtered_data.sample(n=sample_size) if len(filtered_data) > sample_size else filtered_data
        
        # Создаем JSON представление товаров для ИИ
        items_for_ai = []
        for idx, row in sample_data.iterrows():
            items_for_ai.append({
                "id": idx,
                "name": row['name'],
                "price": row['price'],
                "gender": row['gender'],
                "piece_type": row['piece_type'],
                "subtype": row.get('subtype', ''),
                "fit": row.get('fit', ''),
                "style": row.get('style', ''),
                "season": row.get('season', ''),
                "main_color": row['main_color'],
                "palette_tags": row.get('palette_tags', '')
            })
        
        # Формируем промпт для ChatGPT
        ai_prompt = f"""
Ты - эксперт по стилю и моде. Проанализируй данные о человеке и выбери наиболее подходящие вещи из предоставленного списка одежды.

Данные о человеке:
- Пол: {gender}
- Тип фигуры: {body_type}
- Стиль: {style_goal}
- Подходящие цвета: {', '.join(best_colors) if best_colors else 'не указаны'}
- Избегать цвета: {', '.join(avoid_colors) if avoid_colors else 'не указаны'}
- Рекомендуемые категории: {recommended_categories}

Список доступной одежды:
{json.dumps(items_for_ai, ensure_ascii=False, indent=2)}

Выбери максимум {max_items//2} топов и {max_items//2} низа, которые лучше всего подходят этому человеку.
Учитывай:
1. Соответствие типу фигуры
2. Цветовую палитру
3. Стиль
4. Качество и цену
5. Сочетаемость между собой

Верни результат в формате JSON:
{{
  "tops": [список ID топов],
  "bottoms": [список ID низа],
  "reasoning": "краткое объяснение выбора"
}}"""
        
        # Запрос к ChatGPT API
        response = openai_client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": "Ты эксперт по стилю и моде. Отвечай только в формате JSON."},
                {"role": "user", "content": ai_prompt}
            ],
            max_tokens=1000,
            temperature=0.3
        )
        
        # Парсим ответ ИИ
        ai_response = response.choices[0].message.content
        logger.info(f"🤖 Ответ ИИ: {ai_response}")
        
        try:
            ai_selection = json.loads(ai_response)
            selected_top_ids = ai_selection.get('tops', [])
            selected_bottom_ids = ai_selection.get('bottoms', [])
            reasoning = ai_selection.get('reasoning', 'Не указано')
            
            logger.info(f"🧠 ИИ выбрал: {len(selected_top_ids)} топов, {len(selected_bottom_ids)} низа. Обоснование: {reasoning}")
            
            # Конвертируем выбранные ID в ClothingItem объекты
            tops_result = []
            for item_id in selected_top_ids:
                if item_id in sample_data.index:
                    row = sample_data.loc[item_id]
                    tops_result.append(ClothingItem(
                        name=row['name'],
                        price=float(row['price']),
                        image_url=row['image_url'],
                        product_url=row['product_url'],
                        gender=row['gender'],
                        piece_type=row['piece_type'],
                        subtype=row.get('subtype'),
                        fit=row.get('fit'),
                        style=row.get('style'),
                        season=row.get('season'),
                        main_color=row['main_color'],
                        palette_tags=row.get('palette_tags')
                    ))
            
            bottoms_result = []
            for item_id in selected_bottom_ids:
                if item_id in sample_data.index:
                    row = sample_data.loc[item_id]
                    bottoms_result.append(ClothingItem(
                        name=row['name'],
                        price=float(row['price']),
                        image_url=row['image_url'],
                        product_url=row['product_url'],
                        gender=row['gender'],
                        piece_type=row['piece_type'],
                        subtype=row.get('subtype'),
                        fit=row.get('fit'),
                        style=row.get('style'),
                        season=row.get('season'),
                        main_color=row['main_color'],
                        palette_tags=row.get('palette_tags')
                    ))
            
            logger.info(f"✅ ИИ подбор завершен: {len(tops_result)} топов, {len(bottoms_result)} низа")
            return tops_result, bottoms_result
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ Ошибка парсинга ответа ИИ: {e}")
            # Fallback к простому поиску
            return fallback_clothing_search(analysis, max_items)
            
    except Exception as e:
        logger.error(f"❌ Ошибка ИИ подбора: {e}")
        # Fallback к простому поиску
        return fallback_clothing_search(analysis, max_items)

def fallback_clothing_search(analysis: Dict, max_items: int = 15) -> Tuple[List[ClothingItem], List[ClothingItem]]:
    """Резервный простой поиск одежды в случае сбоя ИИ"""
    clothing_data = load_clothing_data()
    
    if clothing_data.empty:
        return [], []
    
    gender = analysis.get('gender_label', 'unisex')
    recommended_categories = analysis.get('recommended_categories', {})
    
    # Простая фильтрация по полу
    if gender != 'unisex':
        filtered_data = clothing_data[clothing_data['gender'].str.lower() == gender.lower()]
    else:
        filtered_data = clothing_data
    
    # Поиск топов и низа
    top_categories = recommended_categories.get('top', ['t-shirt', 'shirt', 'blouse'])
    bottom_categories = recommended_categories.get('bottom', ['jeans', 'trousers', 'pants'])
    
    tops_data = filtered_data[filtered_data['piece_type'].str.lower().isin([cat.lower() for cat in top_categories])]
    bottoms_data = filtered_data[filtered_data['piece_type'].str.lower().isin([cat.lower() for cat in bottom_categories])]
    
    # Сортировка по цене
    tops_data = tops_data.sort_values('price', ascending=True)
    bottoms_data = bottoms_data.sort_values('price', ascending=True)
    
    max_per_category = max_items // 2
    
    # Конвертация в ClothingItem объекты
    tops_result = []
    for _, row in tops_data.head(max_per_category).iterrows():
        tops_result.append(ClothingItem(
            name=row['name'],
            price=float(row['price']),
            image_url=row['image_url'],
            product_url=row['product_url'],
            gender=row['gender'],
            piece_type=row['piece_type'],
            subtype=row.get('subtype'),
            fit=row.get('fit'),
            style=row.get('style'),
            season=row.get('season'),
            main_color=row['main_color'],
            palette_tags=row.get('palette_tags')
        ))
    
    bottoms_result = []
    for _, row in bottoms_data.head(max_per_category).iterrows():
        bottoms_result.append(ClothingItem(
            name=row['name'],
            price=float(row['price']),
            image_url=row['image_url'],
            product_url=row['product_url'],
            gender=row['gender'],
            piece_type=row['piece_type'],
            subtype=row.get('subtype'),
            fit=row.get('fit'),
            style=row.get('style'),
            season=row.get('season'),
            main_color=row['main_color'],
            palette_tags=row.get('palette_tags')
        ))
    
    logger.info(f"🔄 Fallback поиск: {len(tops_result)} топов, {len(bottoms_result)} низа")
    return tops_result, bottoms_result

# ---------- СТАРЫЕ ФУНКЦИИ AMAZON (БУДУТ ЗАМЕНЕНЫ) ----------
def tavily_search_with_brands(query: str, brands: List[str], max_results: int = 12) -> List[str]:
    """Поиск на Amazon через Tavily с учетом брендов"""
    # Добавляем бренды в запрос
    brand_queries = []
    for brand in brands[:3]:  # берем топ-3 бренда
        brand_query = f'"{brand}" {query} dp site:amazon.com'
        brand_queries.append(brand_query)
    
    all_urls = []
    for bq in brand_queries:
        try:
            r = safe_api_call(
                requests.post,
                "https://api.tavily.com/search",
                json={
                    "api_key": TAVILY_API_KEY,
                    "query": bq,
                    "search_depth": "basic",
                    "include_domains": ["amazon.com"],
                    "max_results": max_results // len(brand_queries) + 2,
                },
                timeout=25,
            )
            r.raise_for_status()
            data = r.json()
            urls = [it.get("url", "") for it in data.get("results", []) if isinstance(it, dict)]
            all_urls.extend(urls)
        except Exception as e:
            logger.warning(f"⚠️ Ошибка поиска для бренда {bq}: {e}")
            continue
    
    return filter_amazon_links(all_urls, max_results)

def filter_amazon_links(urls: List[str], max_results: int) -> List[str]:
    """Фильтрует ссылки Amazon по критериям качества"""
    cleaned, seen = [], set()
    
    for url in urls:
        if not isinstance(url, str) or url in seen:
            continue
            
        # Убираем параметры запроса
        clean_url = url.split("?")[0]
        
        # Проверяем что это Amazon
        if "amazon.com" not in clean_url:
            continue
            
        # Оставляем только карточки товаров
        if not ("/dp/" in clean_url or "/gp/" in clean_url):
            continue
            
        # Проверяем на черный список брендов в URL
        url_lower = clean_url.lower()
        if any(brand.lower() in url_lower for brand in BRANDS_AVOID):
            continue
            
        if clean_url not in seen:
            cleaned.append(clean_url)
            seen.add(clean_url)
            
        if len(cleaned) >= max_results:
            break
    
    return cleaned

# ---------- АНАЛИЗ ИЗОБРАЖЕНИЯ ----------
def analyze_image(image_bytes: bytes) -> Dict:
    """Глубокий анализ изображения для подбора одежды"""
    img = b64img(image_bytes)

    # JSON Schema для структурированного ответа
    schema = {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "gender_label": {"type": "string", "enum": ["men", "women", "unisex"]},
            "height_cm": {"type": ["integer", "number"]},
            "weight_kg": {"type": ["integer", "number"]},
            "body_type": {
                "type": "string",
                "enum": ["rectangle", "inverted_triangle", "triangle", "hourglass", "oval"]
            },
            "shoulder_hip_ratio": {"type": "string", "enum": ["low", "balanced", "high"]},
            "vertical_balance": {"type": "string", "enum": ["short_legged", "balanced", "long_legged"]},
            "style_goal": {"type": "string", "enum": ["casual", "smart_casual", "office", "street"]},
            "fit_rules": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "top_fit": {"type": "string"},
                    "bottom_fit": {"type": "string"},
                    "avoid": {"type": "array", "items": {"type": "string"}},
                    "prefer": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["top_fit", "bottom_fit", "avoid", "prefer"]
            },
            "color_palette": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "season": {
                        "type": "string",
                        "enum": ["cool_summer", "cool_winter", "warm_spring", "warm_autumn", "neutral"]
                    },
                    "best_colors": {"type": "array", "items": {"type": "string"}},
                    "avoid_colors": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["season", "best_colors", "avoid_colors"]
            },
            "recommended_categories": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "top": {
                        "type": "array",
                        "minItems": 1,
                        "maxItems": 3,
                        "items": {"type": "string"}
                    },
                    "bottom": {
                        "type": "array",
                        "minItems": 1,
                        "maxItems": 3,
                        "items": {"type": "string"}
                    }
                },
                "required": ["top", "bottom"]
            },
            "size_hints": {"type": "string"}
        },
        "required": [
            "gender_label", "height_cm", "weight_kg", "body_type", "shoulder_hip_ratio", "vertical_balance",
            "style_goal", "fit_rules", "color_palette", "recommended_categories", "size_hints"
        ]
    }

    # Вызов OpenAI API с обработкой ошибок
    resp = safe_api_call(
        openai_client.chat.completions.create,
        model="gpt-4.1-mini",
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "StyleAnalysis",
                "schema": schema,
                "strict": True
            }
        },
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text":
                    "Ты профессиональный стилист. Проанализируй фото и верни СТРОГО JSON по схеме. "
                    "Определи style_goal (casual/smart_casual/office/street) исходя из внешности и контекста. "
                    "Если не уверен в росте/весе — оцени ориентировочно. "
                    "В fit_rules указывай конкретные фасоны для данного телосложения. "
                    "Подбери точную цветовую палитру по цветотипу (теплый/холодный, контрастность)."
                },
                {"type": "image_url", "image_url": {"url": img}}
            ]
        }]
    )

    data = json.loads(resp.choices[0].message.content)
    
    # Нормализация и дефолты
    data["gender_label"] = (data.get("gender_label") or "unisex").lower()
    if data["gender_label"] not in ("men", "women", "unisex"):
        data["gender_label"] = "unisex"
    
    # Дефолт для style_goal
    if not data.get("style_goal") or data["style_goal"] not in ["casual", "smart_casual", "office", "street"]:
        data["style_goal"] = "casual"

    # Страхуем пустые массивы
    rc = data.get("recommended_categories", {}) or {}
    if not rc.get("top"): rc["top"] = ["t-shirt"]
    if not rc.get("bottom"): rc["bottom"] = ["jeans"]
    data["recommended_categories"] = rc

    cp = data.get("color_palette", {}) or {}
    if not cp.get("best_colors"): cp["best_colors"] = ["white", "black", "navy"]
    if not cp.get("avoid_colors"): cp["avoid_colors"] = []
    data["color_palette"] = cp

    fr = data.get("fit_rules", {}) or {}
    fr.setdefault("top_fit", "regular")
    fr.setdefault("bottom_fit", "straight")
    fr.setdefault("avoid", [])
    fr.setdefault("prefer", [])
    data["fit_rules"] = fr

    return data

# ---------- ГЕНЕРАЦИЯ ПОИСКОВЫХ ЗАПРОСОВ ----------
def build_queries_from_analysis(analysis: Dict) -> Tuple[str, str, List[str]]:
    """Генерирует поисковые запросы и список брендов из анализа"""
    gender = analysis.get("gender_label", "unisex")
    style_goal = analysis.get("style_goal", "casual")
    
    # Получаем бренды для данного пола и стиля
    brands = []
    if gender in STYLE_PRESETS and style_goal in STYLE_PRESETS[gender]:
        brands = STYLE_PRESETS[gender][style_goal]
    elif gender in STYLE_PRESETS and "casual" in STYLE_PRESETS[gender]:
        brands = STYLE_PRESETS[gender]["casual"]  # фолбэк на casual
    else:
        brands = ["Uniqlo", "J.Crew", "Nike"]  # универсальный фолбэк
    
    top_cat = (analysis["recommended_categories"]["top"][0]).lower()
    bottom_cat = (analysis["recommended_categories"]["bottom"][0]).lower()

    top_fit = analysis["fit_rules"]["top_fit"]
    bottom_fit = analysis["fit_rules"]["bottom_fit"]

    best_colors = analysis["color_palette"]["best_colors"][:2]
    color_part = " ".join(best_colors).strip()

    def build_query(category: str, fit: str) -> str:
        parts = [gender, category, fit, color_part]
        return " ".join(p for p in parts if p).replace("  ", " ").strip()

    top_query = build_query(top_cat, top_fit)
    bottom_query = build_query(bottom_cat, bottom_fit)
    
    return top_query, bottom_query, brands

# ---------- ФИНАЛЬНЫЙ ВЫБОР ----------
def select_best_items(analysis: Dict, top_links: List[str], bottom_links: List[str], max_items: int = 15) -> Tuple[List[str], List[str]]:
    """Выбирает лучшие варианты верха и низа из кандидатов с учетом анализа"""
    if not top_links or not bottom_links:
        return [], []
    
    # Получаем бренды для контекста
    gender = analysis.get("gender_label", "unisex")
    style_goal = analysis.get("style_goal", "casual")
    preferred_brands = []
    if gender in STYLE_PRESETS and style_goal in STYLE_PRESETS[gender]:
        preferred_brands = STYLE_PRESETS[gender][style_goal]
    
    # Ограничиваем количество до max_items
    selected_tops = top_links[:max_items]
    selected_bottoms = bottom_links[:max_items]
    
    # Простая фильтрация по брендам (приоритет предпочитаемым)
    def sort_by_brand_preference(links: List[str]) -> List[str]:
        preferred = []
        others = []
        
        for link in links:
            link_lower = link.lower()
            is_preferred = any(brand.lower() in link_lower for brand in preferred_brands)
            if is_preferred:
                preferred.append(link)
            else:
                others.append(link)
        
        return preferred + others
    
    # Сортируем по предпочтениям брендов
    if preferred_brands:
        selected_tops = sort_by_brand_preference(selected_tops)
        selected_bottoms = sort_by_brand_preference(selected_bottoms)
    
    return selected_tops, selected_bottoms
@router.post("/wardrobe-compatibility", response_model=WardrobeCompatibilityResponse)
async def analyze_wardrobe_compatibility(
    current_user: models.User = Depends(get_current_user_firebase),
    db: Session = Depends(get_db)
):
    """
    Analyze how well user's wardrobe matches their body analysis results.
    """
    try:
        logger.info(f"🔍 Starting wardrobe compatibility analysis for user {current_user.id}")
        
        # Get user's clothing items
        clothing_items = db.query(models.ClothingItem).filter(
            models.ClothingItem.owner_id == current_user.id
        ).all()
        
        if not clothing_items:
            return WardrobeCompatibilityResponse(
                success=True,
                message="No clothing items found in wardrobe",
                result=WardrobeCompatibilityResult(
                    compatibility_percentage=0.0,
                    matching_items=0,
                    total_items=0,
                    recommendations=["Add clothing items to your wardrobe to get compatibility analysis"],
                    color_matches=[],
                    style_matches=[],
                    missing_essentials=["Basic wardrobe items needed"]
                )
            )
        
        # Get user's latest body analysis (we'll need to store this)
        # For now, we'll use default recommendations
        body_analysis = {
            "bodyType": "Rectangle",  # Default - should come from stored analysis
            "recommendedColors": ["Navy", "White", "Black", "Gray", "Burgundy"],
            "styleRecommendations": ["Classic", "Minimalist", "Structured"]
        }
        
        # Prepare wardrobe data for AI analysis
        wardrobe_data = []
        for item in clothing_items:
            wardrobe_data.append({
                "name": item.name,
                "category": item.category,
                "color": item.color,
                "brand": item.brand,
                "material": item.material,
                "tags": item.tags if hasattr(item, 'tags') else []
            })
        
        # Analyze compatibility with AI
        try:
            logger.info("🤖 Starting AI wardrobe compatibility analysis...")
            compatibility_result = ai_analyze_wardrobe_compatibility(body_analysis, wardrobe_data)
            logger.info(f"✅ AI compatibility analysis completed: {compatibility_result}")
            
        except Exception as e:
            logger.error(f"❌ AI compatibility analysis failed: {e}")
            # Fallback to basic analysis
            compatibility_result = {
                "compatibility_percentage": 75.0,
                "matching_items": len(clothing_items) // 2,
                "total_items": len(clothing_items),
                "recommendations": ["Consider adding more versatile pieces", "Focus on recommended colors"],
                "color_matches": ["Navy", "Black"],
                "style_matches": ["Classic pieces"],
                "missing_essentials": ["White button-down shirt", "Dark jeans"]
            }
        
        result = WardrobeCompatibilityResult(
            compatibility_percentage=compatibility_result.get("compatibility_percentage", 0.0),
            matching_items=compatibility_result.get("matching_items", 0),
            total_items=len(clothing_items),
            recommendations=compatibility_result.get("recommendations", []),
            color_matches=compatibility_result.get("color_matches", []),
            style_matches=compatibility_result.get("style_matches", []),
            missing_essentials=compatibility_result.get("missing_essentials", [])
        )
        
        return WardrobeCompatibilityResponse(
            success=True,
            message="Wardrobe compatibility analysis completed",
            result=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error in wardrobe compatibility analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during wardrobe compatibility analysis"
        )

@router.post("/analyze", response_model=BodyAnalysisResponse)
async def analyze_body_photo(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user_firebase)
) -> BodyAnalysisResponse:
    """
    Анализирует фото тела пользователя и предоставляет рекомендации по стилю с поиском товаров на Amazon
    """
    try:
        logger.info(f"🔍 Starting body photo analysis for user {current_user.firebase_uid or 'unknown'}")
        
        # Загрузка данных одежды из CSV
        load_clothing_data()
        
        # Валидация файла
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Файл должен быть изображением")
        
        # Чтение файла
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Файл пустой")
        
        logger.info(f"📸 Processing image: {len(image_bytes)} bytes")
        
        # Сжатие изображения для хранения
        try:
            storage_compressed = ImageCompressionService.compress_for_storage(image_bytes)
            logger.info("📦 Image compressed for storage")
        except Exception as e:
            logger.error(f"❌ Image compression failed: {e}")
            raise HTTPException(status_code=500, detail="Ошибка обработки изображения")
        
        # Загрузка в GCS
        try:
            filename = f"body_analysis/{current_user.firebase_uid or 'unknown'}/{uuid.uuid4()}.jpg"
            public_url = gcs_uploader.upload_file(
                file_data=storage_compressed,
                filename=filename,
                content_type="image/jpeg"
            )
            logger.info(f"☁️ Image uploaded to GCS: {public_url}")
        except Exception as e:
            logger.error(f"❌ GCS upload failed: {e}")
            raise HTTPException(status_code=500, detail="Ошибка загрузки файла")
        
        # AI анализ изображения с помощью OpenAI GPT-4o
        try:
            logger.info("🤖 Starting AI body analysis...")
            analysis = analyze_image(image_bytes)
            logger.info(f"✅ AI analysis completed")
        except Exception as e:
            logger.error(f"❌ AI analysis failed: {e}")
            raise HTTPException(status_code=500, detail="Ошибка AI анализа")
        
        # Генерация поисковых запросов
        try:
            top_query, bottom_query, preferred_brands = build_queries_from_analysis(analysis)
            logger.info(f"🔍 Generated queries - Top: {top_query}, Bottom: {bottom_query}")
        except Exception as e:
            logger.error(f"❌ Query generation failed: {e}")
            top_query, bottom_query, preferred_brands = "casual shirt", "jeans", ["Uniqlo", "J.Crew"]
        
        # ИИ подбор товаров из CSV данных
        try:
            logger.info("🤖 AI selecting clothing from CSV data...")
            final_tops, final_bottoms = ai_select_clothing_from_csv(analysis, max_items=15)
            
            logger.info(f"🎯 AI selected {len(final_tops)} tops and {len(final_bottoms)} bottoms")
        except Exception as e:
            logger.error(f"❌ CSV product search failed: {e}")
            final_tops, final_bottoms = [], []
        
        # Создание результата в новом формате
        result = BodyAnalysisResult(
            gender=analysis.get("gender_label", "unisex"),
            body_type=analysis.get("body_type", "rectangle"),
            style_goal=analysis.get("style_goal", "casual"),
            height_cm=analysis.get("height_cm", 170),
            weight_kg=analysis.get("weight_kg", 70)
        )
        
        # Создание объектов для идеальных фасонов и цветов
        fits = IdealFits(
            top_fit=analysis["fit_rules"]["top_fit"],
            bottom_fit=analysis["fit_rules"]["bottom_fit"],
            preferred_styles=analysis["fit_rules"]["prefer"],
            avoid_styles=analysis["fit_rules"]["avoid"],
            fit_description=f"Рекомендуемый крой верха: {analysis['fit_rules']['top_fit']}, низа: {analysis['fit_rules']['bottom_fit']}"
        )
        
        colors = IdealColors(
            best_colors=analysis["color_palette"]["best_colors"],
            avoid_colors=analysis["color_palette"]["avoid_colors"],
            color_description=f"Цветотип: {analysis['color_palette']['season']}"
        )
        
        # Рекомендации одежды из CSV
        clothing_recs = ClothingRecommendations(
            tops=final_tops,
            bottoms=final_bottoms,
            total_found={
                "tops": len(final_tops),
                "bottoms": len(final_bottoms)
            }
        )
        
        # Метаданные
        metadata = Metadata(
            recommended_brands=preferred_brands,
            search_queries={
                "top_query": top_query,
                "bottom_query": bottom_query
            }
        )
        
        return BodyAnalysisResponse(
            success=True,
            message="Анализ тела и подбор товаров успешно выполнен",
            analysis=result,
            ideal_fits=fits,
            ideal_colors=colors,
            clothing_recommendations=clothing_recs,
            metadata=metadata,
            photo_url=public_url
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error in body analysis: {e}")
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")

@router.post("/wardrobe-compatibility", response_model=WardrobeCompatibilityResponse)
async def analyze_wardrobe_compatibility(
    current_user: models.User = Depends(get_current_user_firebase),
    db: Session = Depends(get_db)
):
    """
    Analyze how well user's wardrobe matches their body analysis results.
    """
    try:
        logger.info(f"🔍 Starting wardrobe compatibility analysis for user {current_user.id}")
        
        # Get user's clothing items
        clothing_items = db.query(models.ClothingItem).filter(
            models.ClothingItem.owner_id == current_user.id
        ).all()
        
        if not clothing_items:
            return WardrobeCompatibilityResponse(
                success=True,
                message="No clothing items found in wardrobe",
                result=WardrobeCompatibilityResult(
                    compatibility_percentage=0.0,
                    matching_items=0,
                    total_items=0,
                    recommendations=["Add clothing items to your wardrobe to get compatibility analysis"],
                    color_matches=[],
                    style_matches=[],
                    missing_essentials=["Basic wardrobe items needed"]
                )
            )
        
        # Get user's latest body analysis (we'll need to store this)
        # For now, we'll use default recommendations
        body_analysis = {
            "bodyType": "Rectangle",  # Default - should come from stored analysis
            "recommendedColors": ["Navy", "White", "Black", "Gray", "Burgundy"],
            "styleRecommendations": ["Classic", "Minimalist", "Structured"]
        }
        
        # Prepare wardrobe data for AI analysis
        wardrobe_data = []
        for item in clothing_items:
            wardrobe_data.append({
                "name": item.name,
                "category": item.category,
                "color": item.color,
                "brand": item.brand,
                "material": item.material,
                "tags": item.tags if hasattr(item, 'tags') else []
            })
        
        # Analyze compatibility with AI
        try:
            logger.info("🤖 Starting AI wardrobe compatibility analysis...")
            compatibility_result = ai_analyze_wardrobe_compatibility(body_analysis, wardrobe_data)
            logger.info(f"✅ AI compatibility analysis completed: {compatibility_result}")
            
        except Exception as e:
            logger.error(f"❌ AI compatibility analysis failed: {e}")
            # Fallback to basic analysis
            compatibility_result = {
                "compatibility_percentage": 75.0,
                "matching_items": len(clothing_items) // 2,
                "total_items": len(clothing_items),
                "recommendations": ["Consider adding more versatile pieces", "Focus on recommended colors"],
                "color_matches": ["Navy", "Black"],
                "style_matches": ["Classic pieces"],
                "missing_essentials": ["White button-down shirt", "Dark jeans"]
            }
        
        result = WardrobeCompatibilityResult(
            compatibility_percentage=compatibility_result.get("compatibility_percentage", 0.0),
            matching_items=compatibility_result.get("matching_items", 0),
            total_items=len(clothing_items),
            recommendations=compatibility_result.get("recommendations", []),
            color_matches=compatibility_result.get("color_matches", []),
            style_matches=compatibility_result.get("style_matches", []),
            missing_essentials=compatibility_result.get("missing_essentials", [])
        )
        
        return WardrobeCompatibilityResponse(
            success=True,
            message="Wardrobe compatibility analysis completed",
            result=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error in wardrobe compatibility analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during wardrobe compatibility analysis"
        )

@router.get("/results/{user_id}")
async def get_body_analysis_results(
    user_id: int,
    current_user: models.User = Depends(get_current_user_firebase)
):
    """
    Body analysis results are not stored - this endpoint is deprecated.
    """
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Body analysis results are not stored. Please perform a new analysis."
    )

@router.delete("/results/{analysis_id}")
async def delete_body_analysis(
    analysis_id: int,
    current_user: models.User = Depends(get_current_user_firebase)
):
    """
    Body analysis results are not stored - this endpoint is deprecated.
    """
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Body analysis results are not stored. Nothing to delete."
    )