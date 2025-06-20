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

WEATHER_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")
ALMATY_COORDS = {"lat": 43.2220, "lon": 76.8512}  # Almaty coordinates

def get_weather_cache_key(lat: float, lon: float) -> str:
    """Generate cache key for weather data based on coordinates."""
    return f"weather:{lat}:{lon}"

def fetch_weather_by_coordinates(lat: float, lon: float) -> Optional[Dict]:
    """Fetch current weather data from OpenWeatherMap API using coordinates."""
    if not WEATHER_API_KEY:
        raise ValueError("OPENWEATHERMAP_API_KEY environment variable is not set")

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": WEATHER_API_KEY,
        "units": "metric"  # Use Celsius for temperature
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Get city name and replace "Nur-Sultan" with "Astana"
        city_name = data.get("name", "Unknown")
        if city_name == "Nur-Sultan":
            city_name = "Astana"
        
        # Extract relevant weather information
        weather_data = {
            "temperature": data["main"]["temp"],
            "feels_like": data["main"]["feels_like"],
            "humidity": data["main"]["humidity"],
            "pressure": data["main"]["pressure"],
            "description": data["weather"][0]["description"],
            "condition": data["weather"][0]["main"],
            "wind_speed": data["wind"]["speed"],
            "city": city_name,
            "country": data["sys"]["country"],
            "coordinates": {"lat": lat, "lon": lon},
            "last_updated": datetime.utcnow().isoformat()
        }
        
        # Store in Redis with coordinate-based key
        cache_key = get_weather_cache_key(lat, lon)
        redis_client.setex(cache_key, 1800, json.dumps(weather_data))  # Cache for 30 minutes
        return weather_data
    except Exception as e:
        print("🛑 Ошибка при получении погоды:", str(e))
        traceback.print_exc()
        return None

def get_cached_weather_by_coordinates(lat: float, lon: float) -> Optional[Dict]:
    """Retrieve cached weather data from Redis by coordinates."""
    try:
        cache_key = get_weather_cache_key(lat, lon)
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return json.loads(cached_data)
        return None
    except Exception as e:
        print(f"Error retrieving cached weather data: {str(e)}")
        return None

def fetch_weather_forecast_by_coordinates(lat: float, lon: float, days: int = 5) -> Optional[Dict]:
    """Fetch weather forecast data from OpenWeatherMap API using coordinates."""
    if not WEATHER_API_KEY:
        raise ValueError("OPENWEATHERMAP_API_KEY environment variable is not set")

    # OpenWeatherMap 5-day forecast API
    url = "https://api.openweathermap.org/data/2.5/forecast"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": WEATHER_API_KEY,
        "units": "metric"  # Use Celsius for temperature
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Get city name and replace "Nur-Sultan" with "Astana"
        city_name = data["city"]["name"]
        if city_name == "Nur-Sultan":
            city_name = "Astana"
        
        # Process forecast data - group by day
        forecast_by_day = {}
        
        for item in data["list"]:
            # Get date from timestamp
            date_str = datetime.fromtimestamp(item["dt"]).strftime("%Y-%m-%d")
            
            if date_str not in forecast_by_day:
                forecast_by_day[date_str] = {
                    "date": date_str,
                    "date_formatted": datetime.fromtimestamp(item["dt"]).strftime("%A, %B %d"),
                    "temperatures": [],
                    "conditions": [],
                    "descriptions": [],
                    "humidity": [],
                    "wind_speeds": [],
                    "hourly_data": []
                }
            
            forecast_by_day[date_str]["temperatures"].append(item["main"]["temp"])
            forecast_by_day[date_str]["conditions"].append(item["weather"][0]["main"])
            forecast_by_day[date_str]["descriptions"].append(item["weather"][0]["description"])
            forecast_by_day[date_str]["humidity"].append(item["main"]["humidity"])
            forecast_by_day[date_str]["wind_speeds"].append(item["wind"]["speed"])
            forecast_by_day[date_str]["hourly_data"].append({
                "time": datetime.fromtimestamp(item["dt"]).strftime("%H:%M"),
                "temperature": item["main"]["temp"],
                "condition": item["weather"][0]["main"],
                "description": item["weather"][0]["description"]
            })
        
        # Calculate daily averages and ranges
        daily_forecasts = []
        for date_str, day_data in sorted(forecast_by_day.items()):
            temps = day_data["temperatures"]
            daily_forecast = {
                "date": day_data["date"],
                "date_formatted": day_data["date_formatted"],
                "temperature_min": round(min(temps)),
                "temperature_max": round(max(temps)),
                "temperature_avg": round(sum(temps) / len(temps)),
                "condition": max(set(day_data["conditions"]), key=day_data["conditions"].count),
                "description": max(set(day_data["descriptions"]), key=day_data["descriptions"].count),
                "humidity_avg": round(sum(day_data["humidity"]) / len(day_data["humidity"])),
                "wind_speed_avg": round(sum(day_data["wind_speeds"]) / len(day_data["wind_speeds"]), 1),
                "hourly_data": day_data["hourly_data"]
            }
            daily_forecasts.append(daily_forecast)
        
        # Limit to requested number of days
        daily_forecasts = daily_forecasts[:days]
        
        forecast_data = {
            "city": city_name,
            "country": data["city"]["country"],
            "coordinates": {"lat": lat, "lon": lon},
            "forecast_days": len(daily_forecasts),
            "daily_forecasts": daily_forecasts,
            "last_updated": datetime.utcnow().isoformat()
        }
        
        # Store in Redis with coordinate-based key
        cache_key = f"forecast:{lat}:{lon}:{days}"
        redis_client.setex(cache_key, 1800, json.dumps(forecast_data))  # Cache for 30 minutes
        return forecast_data
        
    except Exception as e:
        print("🛑 Ошибка при получении прогноза погоды:", str(e))
        traceback.print_exc()
        return None

def get_cached_weather_forecast_by_coordinates(lat: float, lon: float, days: int = 5) -> Optional[Dict]:
    """Retrieve cached weather forecast data from Redis by coordinates."""
    try:
        cache_key = f"forecast:{lat}:{lon}:{days}"
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return json.loads(cached_data)
        return None
    except Exception as e:
        print(f"Error retrieving cached forecast data: {str(e)}")
        return None

# Legacy functions for backward compatibility
def fetch_weather() -> Optional[Dict]:
    """Fetch current weather data from OpenWeatherMap API for Almaty (legacy)."""
    return fetch_weather_by_coordinates(ALMATY_COORDS["lat"], ALMATY_COORDS["lon"])

def get_cached_weather() -> Optional[Dict]:
    """Retrieve cached weather data from Redis for Almaty (legacy)."""
    return get_cached_weather_by_coordinates(ALMATY_COORDS["lat"], ALMATY_COORDS["lon"]) 