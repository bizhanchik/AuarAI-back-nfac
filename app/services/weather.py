from typing import Dict, Optional
import os
import requests
from datetime import datetime
import redis
import json
from dotenv import load_dotenv
import traceback
load_dotenv()


# Redis client for caching weather data
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "redis"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=0,
    decode_responses=True
)

WEATHER_CACHE_KEY = "weather:almaty"
WEATHER_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")
ALMATY_COORDS = {"lat": 43.2220, "lon": 76.8512}  # Almaty coordinates

def fetch_weather() -> Optional[Dict]:
    """Fetch current weather data from OpenWeatherMap API."""
    if not WEATHER_API_KEY:
        raise ValueError("OPENWEATHERMAP_API_KEY environment variable is not set")

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "lat": ALMATY_COORDS["lat"],
        "lon": ALMATY_COORDS["lon"],
        "appid": WEATHER_API_KEY,
        "units": "metric"  # Use Celsius for temperature
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Extract relevant weather information
        weather_data = {
            "temperature": data["main"]["temp"],
            "feels_like": data["main"]["feels_like"],
            "humidity": data["main"]["humidity"],
            "pressure": data["main"]["pressure"],
            "description": data["weather"][0]["description"],
            "wind_speed": data["wind"]["speed"],
            "last_updated": datetime.utcnow().isoformat()
        }
        
        # Store in Redis
        redis_client.set(WEATHER_CACHE_KEY, json.dumps(weather_data))
        return weather_data
    except Exception as e:
        print("🛑 Ошибка при получении погоды:", str(e))
        traceback.print_exc()  # 👈 чтобы видеть весь трейс
        return None

def get_cached_weather() -> Optional[Dict]:
    """Retrieve cached weather data from Redis."""
    try:
        cached_data = redis_client.get(WEATHER_CACHE_KEY)
        if cached_data:
            return json.loads(cached_data)
        return None
    except Exception as e:
        print(f"Error retrieving cached weather data: {str(e)}")
        return None 