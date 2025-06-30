"""
IP Location API Routes
Provides endpoints for IP-based geolocation
"""

from fastapi import APIRouter, Request, HTTPException
from typing import Dict
import logging

from ..services.ip_location import get_location_from_request, get_location_by_ip

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/location", tags=["location"])

@router.get("/detect")
async def detect_user_location(request: Request) -> Dict:
    """
    Detect user's location based on their IP address
    
    Returns:
        Dict: Location information including city, region, country, coordinates
    """
    try:
        location = get_location_from_request(request)
        
        logger.info(f"Location detected for request: {location['city']}, {location['country']}")
        
        return {
            "success": True,
            "location": location,
            "message": f"Location detected: {location['city']}, {location['country_name']}"
        }
        
    except Exception as e:
        logger.error(f"Failed to detect location: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to detect location"
        )

@router.get("/ip/{ip_address}")
async def get_location_for_ip(ip_address: str) -> Dict:
    """
    Get location information for a specific IP address
    
    Args:
        ip_address (str): IP address to lookup
        
    Returns:
        Dict: Location information
    """
    try:
        # Basic IP address validation
        import ipaddress
        ipaddress.ip_address(ip_address)
        
        location = get_location_by_ip(ip_address)
        
        logger.info(f"Location lookup for IP {ip_address}: {location['city']}, {location['country']}")
        
        return {
            "success": True,
            "ip": ip_address,
            "location": location,
            "message": f"Location found: {location['city']}, {location['country_name']}"
        }
        
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid IP address format"
        )
    except Exception as e:
        logger.error(f"Failed to lookup IP {ip_address}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to lookup IP location"
        )

@router.get("/info")
async def get_location_info() -> Dict:
    """
    Get information about the IP location service
    
    Returns:
        Dict: Service information and capabilities
    """
    return {
        "service": "IP-based Geolocation",
        "provider": "ipinfo.io",
        "accuracy": "City-level (~1km)",
        "privacy": "IP-based location detection - no GPS permission required",
        "features": [
            "Automatic location detection",
            "No user permission required",
            "Works globally",
            "Cached for performance",
            "Fallback to default location"
        ],
        "default_location": {
            "city": "Almaty",
            "country": "Kazakhstan",
            "reason": "Default fallback location"
        }
    } 