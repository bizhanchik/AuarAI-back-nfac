# analyze_and_shop.py
import os, json, base64, mimetypes, requests, re, time
from typing import Dict, List, Tuple, Optional
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

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
MIN_REVIEWS = 500# ---------- УТИЛИТЫ ----------
def b64img(path: str) -> str:
    """Конвертирует изображение в base64 для OpenAI API"""
    mime = mimetypes.guess_type(path)[0] or "image/jpeg"
    with open(path, "rb") as f:
        return f"data:{mime};base64," + base64.b64encode(f.read()).decode()

def safe_api_call(func, *args, max_retries: int = 3, **kwargs):
    """Безопасный вызов API с повторными попытками"""
    for attempt in range(max_retries):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            print(f"⚠️ API ошибка (попытка {attempt + 1}/{max_retries}): {e}")
            time.sleep(2 ** attempt)  # экспоненциальная задержка

# ---------- ПОИСК И ФИЛЬТРАЦИЯ ----------
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
            print(f"⚠️ Ошибка поиска для бренда {bq}: {e}")
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

def parse_two_links(text: str) -> Tuple[str, str]:
    """Извлекает ссылки на верх и низ из ответа модели"""
    top = re.search(r"Верх:\s*(https?://\S+)", text)
    bottom = re.search(r"Низ:\s*(https?://\S+)", text)
    return (top.group(1).strip() if top else ""), (bottom.group(1).strip() if bottom else "")

# ---------- АНАЛИЗ ИЗОБРАЖЕНИЯ ----------
ANALYSIS_SCHEMA = {
    "gender_label": "men|women|unisex",
    "height_cm": "int|approx",
    "weight_kg": "int|approx", 
    "body_type": "one of: rectangle, inverted_triangle, triangle, hourglass, oval",
    "shoulder_hip_ratio": "low|balanced|high",
    "vertical_balance": "short_legged|balanced|long_legged",
    "style_goal": "casual|smart_casual|office|street",
    "fit_rules": {
        "top_fit": "e.g. slim/regular/relaxed; length guidance",
        "bottom_fit": "e.g. high-rise/straight/tapered/wide; inseam guidance", 
        "avoid": ["cuts/patterns/fabrics to avoid"],
        "prefer": ["cuts/patterns/fabrics to prefer"]
    },
    "color_palette": {
        "season": "cool_summer|cool_winter|warm_spring|warm_autumn|neutral",
        "best_colors": ["hex or names"],
        "avoid_colors": ["hex or names"]
    },
    "recommended_categories": {
        "top": ["1-3 categories (t-shirt, oxford shirt, blouse, polo, sweater, hoodie, etc.)"],
        "bottom": ["1-3 categories (jeans, chinos, trousers, skirt, shorts, etc.)"]
    },
    "size_hints": "notes like: likely XS-S for top, 27-29W for jeans (if visible guess); optional",
}

def analyze_image(image_path: str) -> Dict:
    """Глубокий анализ изображения для подбора одежды"""
    img = b64img(image_path)

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
        client.chat.completions.create,
        model="gpt-4o",
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

# ---------- ОСНОВНАЯ ЛОГИКА ----------
def analyze_and_recommend(image_path: str, max_items: int = 15) -> Dict:
    """
    Анализирует изображение и возвращает рекомендации в формате JSON
    
    Args:
        image_path: путь к изображению
        max_items: максимальное количество товаров каждого типа
    
    Returns:
        Dict с результатами анализа и рекомендациями
    """
    try:
        # 1) Детальный анализ
        analysis = analyze_image(image_path)
        
        # 2) Генерируем поисковые запросы и получаем бренды
        top_query, bottom_query, brands = build_queries_from_analysis(analysis)
        
        # 3) Ищем по Amazon через Tavily с брендами
        top_candidates = tavily_search_with_brands(top_query, brands, max_results=max_items)
        bottom_candidates = tavily_search_with_brands(bottom_query, brands, max_results=max_items)
        
        # Фолбэки если пусто
        if not top_candidates:
            fallback_query = f"{analysis['gender_label']} {analysis['recommended_categories']['top'][0]}"
            top_candidates = tavily_search_with_brands(fallback_query, brands[:2], max_results=max_items)
            
        if not bottom_candidates:
            fallback_query = f"{analysis['gender_label']} {analysis['recommended_categories']['bottom'][0]}"
            bottom_candidates = tavily_search_with_brands(fallback_query, brands[:2], max_results=max_items)
        
        # 4) Выбираем лучшие варианты
        selected_tops, selected_bottoms = select_best_items(analysis, top_candidates, bottom_candidates, max_items=max_items)
        
        # 5) Формируем итоговый результат
        result = {
            "success": True,
            "analysis": {
                "gender": analysis.get("gender_label", "unisex"),
                "body_type": analysis.get("body_type", "unknown"),
                "style_goal": analysis.get("style_goal", "casual"),
                "height_cm": analysis.get("height_cm", 0),
                "weight_kg": analysis.get("weight_kg", 0)
            },
            "ideal_fits": {
                "top_fit": analysis.get("fit_rules", {}).get("top_fit", "regular"),
                "bottom_fit": analysis.get("fit_rules", {}).get("bottom_fit", "straight"),
                "preferred_styles": analysis.get("fit_rules", {}).get("prefer", []),
                "avoid_styles": analysis.get("fit_rules", {}).get("avoid", []),
                "fit_description": f"Для типа фигуры '{analysis.get('body_type', 'unknown')}' рекомендуется {analysis.get('fit_rules', {}).get('top_fit', 'regular')} посадка для верха и {analysis.get('fit_rules', {}).get('bottom_fit', 'straight')} для низа"
            },
            "ideal_colors": {
                "best_colors": analysis.get("color_palette", {}).get("best_colors", []),
                "avoid_colors": analysis.get("color_palette", {}).get("avoid_colors", []),
                "color_description": f"Идеально подходящие цвета: {', '.join(analysis.get('color_palette', {}).get('best_colors', [])[:5])}"
            },
            "amazon_recommendations": {
                "tops": selected_tops,
                "bottoms": selected_bottoms,
                "total_found": {
                    "tops": len(selected_tops),
                    "bottoms": len(selected_bottoms)
                }
            },
            "metadata": {
                "recommended_brands": brands[:5],
                "search_queries": {
                    "top_query": top_query,
                    "bottom_query": bottom_query
                }
            }
        }
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "analysis": None,
            "ideal_fits": None,
            "ideal_colors": None,
            "amazon_recommendations": None
        }


def main():
    """Основная функция для демонстрации"""
    image_path = "person.jpg"  # положи фото рядом или укажи абсолютный путь
    
    print("🔍 Начинаю анализ изображения...")
    result = analyze_and_recommend(image_path, max_items=15)
    
    if result["success"]:
        print("🧠 Анализ завершен успешно!")
        
        # Красивый вывод результатов
        print("\n" + "="*60)
        print("✅ РЕЗУЛЬТАТ АНАЛИЗА")
        print("="*60)
        
        # 1. Идеальные фасоны
        print("\n🎯 1. ИДЕАЛЬНЫЕ ФАСОНЫ ПО ФОТО:")
        fits = result["ideal_fits"]
        print(f"   • Тип фигуры: {result['analysis']['body_type']}")
        print(f"   • Верх: {fits['top_fit']}")
        print(f"   • Низ: {fits['bottom_fit']}")
        if fits['preferred_styles']:
            print(f"   • Предпочитаемые стили: {', '.join(fits['preferred_styles'])}")
        if fits['avoid_styles']:
            print(f"   • Избегать: {', '.join(fits['avoid_styles'])}")
        
        # 2. Идеальные цвета
        print("\n🎨 2. ИДЕАЛЬНО ПОДХОДЯЩИЕ ЦВЕТА:")
        colors = result["ideal_colors"]
        print(f"   • Лучшие цвета: {', '.join(colors['best_colors'][:5])}")
        if colors['avoid_colors']:
            print(f"   • Избегать цвета: {', '.join(colors['avoid_colors'][:3])}")
        
        # 3. Товары с Amazon
        print("\n🛒 3. ВЕЩИ С AMAZON:")
        recs = result["amazon_recommendations"]
        
        print(f"\n🔝 ВЕРХ ({recs['total_found']['tops']} вариантов):")
        for i, link in enumerate(recs["tops"], 1):
            print(f"   {i:2d}. {link}")
        
        print(f"\n👖 НИЗ ({recs['total_found']['bottoms']} вариантов):")
        for i, link in enumerate(recs["bottoms"], 1):
            print(f"   {i:2d}. {link}")
        
        print("\n" + "="*60)
        print("📋 JSON для бэкенда сохранен в переменной 'result'")
        print("="*60)
        
        # Сохраняем JSON в файл для удобства
        with open("recommendation_result.json", "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print("💾 Результат также сохранен в файл 'recommendation_result.json'")
        
    else:
        print(f"❌ Ошибка: {result['error']}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
