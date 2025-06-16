from fastapi import APIRouter, HTTPException
from ..services.weather import get_cached_weather

router = APIRouter()

@router.get("/almaty")
async def get_almaty_weather():
    """
    Get the current weather in Almaty.
    Returns the last fetched weather data and its timestamp.
    """
    weather_data = get_cached_weather()
    if not weather_data:
        raise HTTPException(
            status_code=503,
            detail="Weather data is not available. Please try again later."
        )
    return weather_data 