from fastapi import APIRouter, HTTPException
from ..services.weather import get_cached_weather, fetch_weather

router = APIRouter()

@router.get("/almaty")
async def get_almaty_weather():
    """
    Get the current weather in Almaty.
    Returns cached data if available, otherwise fetches fresh one.
    """
    weather_data = get_cached_weather()
    if not weather_data:
        weather_data = fetch_weather()
    
    if not weather_data:
        raise HTTPException(
            status_code=503,
            detail="Weather service is not available. Try again later."
        )

    return weather_data
