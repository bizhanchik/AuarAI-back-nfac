from fastapi import APIRouter, HTTPException, Query
from ..services.weather import (
    get_cached_weather, fetch_weather, 
    get_cached_weather_by_coordinates, fetch_weather_by_coordinates,
    get_cached_weather_forecast_by_coordinates, fetch_weather_forecast_by_coordinates
)

router = APIRouter()

@router.get("/almaty")
async def get_almaty_weather():
    weather_data = get_cached_weather()
    if not weather_data:
        weather_data = fetch_weather()
    
    if not weather_data:
        raise HTTPException(
            status_code=503,
            detail="Weather service is not available. Try again later."
        )

    return weather_data

@router.get("/coordinates")
async def get_weather_by_coordinates(
    lat: float = Query(..., description="Latitude coordinate"),
    lon: float = Query(..., description="Longitude coordinate")
):
    """Get weather data by coordinates"""
    # Validate coordinates
    if not (-90 <= lat <= 90):
        raise HTTPException(status_code=400, detail="Latitude must be between -90 and 90")
    if not (-180 <= lon <= 180):
        raise HTTPException(status_code=400, detail="Longitude must be between -180 and 180")
    
    weather_data = get_cached_weather_by_coordinates(lat, lon)
    if not weather_data:
        weather_data = fetch_weather_by_coordinates(lat, lon)
    
    if not weather_data:
        raise HTTPException(
            status_code=503,
            detail="Weather service is not available. Try again later."
        )

    return weather_data

@router.get("/forecast")
async def get_weather_forecast_by_coordinates(
    lat: float = Query(..., description="Latitude coordinate"),
    lon: float = Query(..., description="Longitude coordinate"),
    days: int = Query(5, description="Number of forecast days (1-5)", ge=1, le=5)
):
    """Get weather forecast by coordinates for specified number of days"""
    # Validate coordinates
    if not (-90 <= lat <= 90):
        raise HTTPException(status_code=400, detail="Latitude must be between -90 and 90")
    if not (-180 <= lon <= 180):
        raise HTTPException(status_code=400, detail="Longitude must be between -180 and 180")
    
    forecast_data = get_cached_weather_forecast_by_coordinates(lat, lon, days)
    if not forecast_data:
        forecast_data = fetch_weather_forecast_by_coordinates(lat, lon, days)
    
    if not forecast_data:
        raise HTTPException(
            status_code=503,
            detail="Weather forecast service is not available. Try again later."
        )

    return forecast_data
