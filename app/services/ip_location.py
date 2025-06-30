"""
IP-based Location Service for Backend
Uses ipinfo.io API to detect user location from IP address
"""

import os
import requests
import logging
from typing import Dict, Optional, Tuple
from functools import lru_cache
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class IPLocationService:
    """Service for IP-based geolocation using ipinfo.io API"""
    
    def __init__(self):
        self.api_url = "https://ipinfo.io"
        self.api_token = os.getenv("IPINFO_API_TOKEN")  # Optional for higher rate limits
        self.timeout = 5  # seconds
        self.cache_duration = 3600  # 1 hour in seconds
        
        # Default location (Almaty, Kazakhstan)
        self.default_location = {
            "city": "Almaty",
            "region": "Almaty",
            "country": "KZ",
            "country_name": "Kazakhstan",
            "lat": 43.2220,
            "lon": 76.8512,
            "timezone": "Asia/Almaty"
        }
    
    @lru_cache(maxsize=1000)
    def get_location_by_ip(self, ip_address: str) -> Dict:
        """
        Get location information for a specific IP address
        
        Args:
            ip_address (str): IP address to lookup
            
        Returns:
            Dict: Location information including city, region, country, coordinates
        """
        try:
            # Skip private/local IP addresses
            if self._is_private_ip(ip_address):
                logger.info(f"Private IP detected ({ip_address}), using default location")
                return self.default_location.copy()
            
            logger.info(f"Looking up location for IP: {ip_address}")
            
            # Prepare request URL and headers
            url = f"{self.api_url}/{ip_address}/json"
            headers = {"Accept": "application/json"}
            
            # Add auth token if available
            if self.api_token:
                headers["Authorization"] = f"Bearer {self.api_token}"
            
            # Make request to ipinfo.io
            response = requests.get(
                url,
                headers=headers,
                timeout=self.timeout
            )
            response.raise_for_status()
            
            data = response.json()
            
            # Parse coordinates
            lat, lon = self._parse_coordinates(data.get("loc", "43.2220,76.8512"))
            
            location = {
                "city": data.get("city", self.default_location["city"]),
                "region": data.get("region", self.default_location["region"]),
                "country": data.get("country", self.default_location["country"]),
                "country_name": self._get_country_name(data.get("country", "KZ")),
                "lat": lat,
                "lon": lon,
                "timezone": data.get("timezone", self.default_location["timezone"]),
                "postal": data.get("postal"),
                "org": data.get("org"),
                "ip": ip_address,
                "accuracy": 1000  # IP-based accuracy ~1km
            }
            
            logger.info(f"✅ Location found: {location['city']}, {location['country']}")
            return location
            
        except requests.exceptions.Timeout:
            logger.warning(f"⏱️ Timeout looking up IP {ip_address}")
        except requests.exceptions.RequestException as e:
            logger.warning(f"⚠️ Request failed for IP {ip_address}: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Unexpected error for IP {ip_address}: {str(e)}")
        
        # Return default location on any error
        logger.info("Using default location due to error")
        return self.default_location.copy()
    
    def get_location_from_request(self, request) -> Dict:
        """
        Extract user's location from FastAPI request object
        
        Args:
            request: FastAPI Request object
            
        Returns:
            Dict: Location information
        """
        # Extract IP from request
        ip_address = self._extract_ip_from_request(request)
        return self.get_location_by_ip(ip_address)
    
    def get_coordinates_from_request(self, request) -> Tuple[float, float]:
        """
        Get just the coordinates from request
        
        Args:
            request: FastAPI Request object
            
        Returns:
            Tuple[float, float]: (latitude, longitude)
        """
        location = self.get_location_from_request(request)
        return location["lat"], location["lon"]
    
    def _extract_ip_from_request(self, request) -> str:
        """Extract real IP address from request, considering proxies"""
        # Check for forwarded headers (common in production deployments)
        forwarded_ips = [
            request.headers.get("X-Forwarded-For", "").split(",")[0].strip(),
            request.headers.get("X-Real-IP", "").strip(),
            request.headers.get("CF-Connecting-IP", "").strip(),  # Cloudflare
            request.headers.get("X-Client-IP", "").strip(),
        ]
        
        # Use first valid IP found
        for ip in forwarded_ips:
            if ip and not self._is_private_ip(ip):
                return ip
        
        # Fallback to direct client IP
        client_ip = request.client.host if request.client else "127.0.0.1"
        return client_ip
    
    def _is_private_ip(self, ip: str) -> bool:
        """Check if IP address is private/local"""
        try:
            import ipaddress
            ip_obj = ipaddress.ip_address(ip)
            return ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local
        except ValueError:
            return True  # Invalid IP, treat as private
    
    def _parse_coordinates(self, loc_string: str) -> Tuple[float, float]:
        """Parse 'lat,lng' string into float tuple"""
        try:
            parts = loc_string.split(",")
            if len(parts) == 2:
                lat = float(parts[0].strip())
                lon = float(parts[1].strip())
                return lat, lon
        except (ValueError, AttributeError):
            pass
        
        # Return default coordinates
        return self.default_location["lat"], self.default_location["lon"]
    
    def _get_country_name(self, country_code: str) -> str:
        """Convert country code to full country name"""
        country_names = {
            "KZ": "Kazakhstan",
            "RU": "Russia", 
            "CN": "China",
            "KG": "Kyrgyzstan",
            "UZ": "Uzbekistan",
            "TJ": "Tajikistan",
            "TM": "Turkmenistan",
            "US": "United States",
            "GB": "United Kingdom",
            "DE": "Germany",
            "FR": "France",
            "IT": "Italy",
            "ES": "Spain",
            "JP": "Japan",
            "IN": "India",
            "BR": "Brazil",
            "CA": "Canada",
            "AU": "Australia",
            "NL": "Netherlands",
            "SE": "Sweden",
            "NO": "Norway",
            "FI": "Finland",
            "DK": "Denmark",
            "PL": "Poland",
            "CZ": "Czech Republic",
            "SK": "Slovakia",
            "HU": "Hungary",
            "RO": "Romania",
            "BG": "Bulgaria",
            "HR": "Croatia",
            "SI": "Slovenia",
            "EE": "Estonia",
            "LV": "Latvia",
            "LT": "Lithuania",
            "UA": "Ukraine",
            "BY": "Belarus",
            "MD": "Moldova",
            "GE": "Georgia",
            "AM": "Armenia",
            "AZ": "Azerbaijan",
            "TR": "Turkey",
            "GR": "Greece",
            "CY": "Cyprus",
            "MT": "Malta",
            "IS": "Iceland",
            "IE": "Ireland",
            "PT": "Portugal",
            "CH": "Switzerland",
            "AT": "Austria",
            "BE": "Belgium",
            "LU": "Luxembourg",
            "LI": "Liechtenstein",
            "MC": "Monaco",
            "SM": "San Marino",
            "VA": "Vatican City",
            "AD": "Andorra"
        }
        
        return country_names.get(country_code, country_code)


# Create singleton instance
ip_location_service = IPLocationService()

# Convenience functions
def get_location_by_ip(ip_address: str) -> Dict:
    """Get location for specific IP address"""
    return ip_location_service.get_location_by_ip(ip_address)

def get_location_from_request(request) -> Dict:
    """Get location from FastAPI request"""
    return ip_location_service.get_location_from_request(request)

def get_coordinates_from_request(request) -> Tuple[float, float]:
    """Get coordinates from FastAPI request"""
    return ip_location_service.get_coordinates_from_request(request) 