import os
import re
import socket
import hashlib
import ipaddress
from typing import Optional, Dict, Any, Tuple
from urllib.parse import urljoin, urlparse
import asyncio
from datetime import datetime, timedelta

import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
import redis.asyncio as redis
from pydantic import BaseModel

# Configuration from environment variables
UNFURL_TIMEOUT = int(os.getenv("UNFURL_TIMEOUT", "8"))
UNFURL_CACHE_TTL = int(os.getenv("UNFURL_CACHE_TTL", "21600"))  # 6 hours
UNFURL_MAX_HTML_BYTES = int(os.getenv("UNFURL_MAX_HTML_BYTES", "2097152"))  # 2MB
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
UNFURL_USER_AGENT = os.getenv(
    "UNFURL_USER_AGENT",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

router = APIRouter(tags=["unfurl"])

# Response models
class UnfurlResponse(BaseModel):
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    image_proxy_url: Optional[str] = None
    site_name: Optional[str] = None
    favicon: Optional[str] = None
    source: str  # "og", "twitter", or "fallback"

# Global Redis client (lazy initialization)
_redis_client: Optional[redis.Redis] = None
_in_memory_cache: Dict[str, Tuple[Dict[str, Any], datetime]] = {}

async def get_redis_client() -> Optional[redis.Redis]:
    """Get Redis client with lazy initialization and fallback to in-memory cache."""
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(REDIS_URL)
            # Test connection
            await _redis_client.ping()
        except Exception:
            # Redis unavailable, use in-memory cache
            _redis_client = None
    return _redis_client

def is_public_url(url: str) -> bool:
    """Check if URL is safe from SSRF attacks."""
    try:
        parsed = urlparse(url)
        
        # Only allow http/https
        if parsed.scheme not in ["http", "https"]:
            return False
            
        # Reject .onion domains
        if parsed.hostname and parsed.hostname.endswith(".onion"):
            return False
            
        # Resolve hostname to IP
        hostname = parsed.hostname
        if not hostname:
            return False
            
        # Get all IP addresses for the hostname
        try:
            addr_info = socket.getaddrinfo(hostname, None)
            ips = [info[4][0] for info in addr_info]
        except socket.gaierror:
            return False
            
        # Check each IP address
        for ip_str in ips:
            try:
                ip = ipaddress.ip_address(ip_str)
                
                # Reject private/internal IPs
                if ip.is_private or ip.is_loopback or ip.is_link_local:
                    return False
                    
                # Reject multicast and reserved ranges
                if ip.is_multicast or ip.is_reserved:
                    return False
                    
                # Reject broadcast (IPv4 only)
                if isinstance(ip, ipaddress.IPv4Address) and ip.is_unspecified:
                    return False
                    
            except ValueError:
                return False
                
        return True
        
    except Exception:
        return False

async def fetch_html(url: str) -> Tuple[str, str, str]:
    """Fetch HTML content with size limits and redirects."""
    async with httpx.AsyncClient(
        timeout=httpx.Timeout(UNFURL_TIMEOUT),
        follow_redirects=True,
        max_redirects=5,
        headers={"User-Agent": UNFURL_USER_AGENT}
    ) as client:
        response = await client.get(url)
        response.raise_for_status()
        
        # Check content type
        content_type = response.headers.get("content-type", "")
        if not content_type.startswith("text/html"):
            raise HTTPException(status_code=400, detail="URL does not return HTML content")
            
        # Limit content size
        content = b""
        async for chunk in response.aiter_bytes(chunk_size=8192):
            content += chunk
            if len(content) > UNFURL_MAX_HTML_BYTES:
                break
                
        return str(response.url), content.decode("utf-8", errors="ignore"), content_type

def absolute_url(url: str, base_url: str) -> str:
    """Convert relative URL to absolute URL."""
    return urljoin(base_url, url)

def extract_metadata(html: str, base_url: str) -> Dict[str, Any]:
    """Extract metadata from HTML using priority rules."""
    soup = BeautifulSoup(html, "html.parser")
    result = {
        "title": None,
        "description": None,
        "image": None,
        "site_name": None,
        "favicon": None,
        "source": "fallback"
    }
    
    # Special handling for Amazon
    if "amazon." in base_url:
        return extract_amazon_metadata(soup, base_url)
    
    # Try Open Graph first
    og_title = soup.find("meta", property="og:title")
    og_description = soup.find("meta", property="og:description")
    og_image = soup.find("meta", property="og:image")
    og_site_name = soup.find("meta", property="og:site_name")
    
    if og_title or og_description or og_image:
        result["source"] = "og"
        if og_title:
            result["title"] = og_title.get("content")
        if og_description:
            result["description"] = og_description.get("content")
        if og_image:
            result["image"] = absolute_url(og_image.get("content"), base_url)
        if og_site_name:
            result["site_name"] = og_site_name.get("content")
    
    # Try Twitter cards if no OG data
    if result["source"] == "fallback":
        twitter_title = soup.find("meta", attrs={"name": "twitter:title"})
        twitter_description = soup.find("meta", attrs={"name": "twitter:description"})
        twitter_image = soup.find("meta", attrs={"name": "twitter:image"})
        
        if twitter_title or twitter_description or twitter_image:
            result["source"] = "twitter"
            if twitter_title:
                result["title"] = twitter_title.get("content")
            if twitter_description:
                result["description"] = twitter_description.get("content")
            if twitter_image:
                result["image"] = absolute_url(twitter_image.get("content"), base_url)
    
    # Fallback to standard HTML tags
    if not result["title"]:
        title_tag = soup.find("title")
        if title_tag:
            result["title"] = title_tag.get_text().strip()
    
    if not result["description"]:
        desc_meta = soup.find("meta", attrs={"name": "description"})
        if desc_meta:
            result["description"] = desc_meta.get("content")
    
    # Find large image if no image found
    if not result["image"]:
        images = soup.find_all("img")
        for img in images:
            src = img.get("src")
            if not src:
                continue
                
            # Check if image is large enough
            width = img.get("width")
            height = img.get("height")
            
            if width and height:
                try:
                    w, h = int(width), int(height)
                    if w >= 300 and h >= 200:
                        result["image"] = absolute_url(src, base_url)
                        break
                except ValueError:
                    pass
            else:
                # Accept any image if no dimensions
                result["image"] = absolute_url(src, base_url)
                break
    
    # Find favicon
    favicon_links = soup.find_all("link", rel=re.compile(r".*icon.*", re.I))
    if favicon_links:
        favicon_href = favicon_links[0].get("href")
        if favicon_href:
            result["favicon"] = absolute_url(favicon_href, base_url)
    
    return result

def extract_amazon_metadata(soup: BeautifulSoup, base_url: str) -> Dict[str, Any]:
    """Extract metadata specifically for Amazon product pages."""
    result = {
        "title": None,
        "description": None,
        "image": None,
        "site_name": "Amazon",
        "favicon": None,
        "source": "amazon"
    }
    
    # Extract title
    title_selectors = [
        "#productTitle",
        "h1.a-size-large",
        "h1 span",
        "title"
    ]
    
    for selector in title_selectors:
        title_elem = soup.select_one(selector)
        if title_elem:
            result["title"] = title_elem.get_text().strip()
            break
    
    # Extract description
    desc_selectors = [
        "#feature-bullets ul",
        "#productDescription",
        "meta[name='description']"
    ]
    
    for selector in desc_selectors:
        if selector.startswith("meta"):
            desc_elem = soup.select_one(selector)
            if desc_elem:
                result["description"] = desc_elem.get("content", "").strip()
                break
        else:
            desc_elem = soup.select_one(selector)
            if desc_elem:
                result["description"] = desc_elem.get_text().strip()[:200] + "..."
                break
    
    # Extract main product image
    image_selectors = [
        "#landingImage",
        "#imgBlkFront",
        "img[data-a-dynamic-image]",
        "img[data-old-hires]",
        "img[data-src]",
        ".imgTagWrapper img",
        "#main-image",
        "img[src*='images-amazon']"
    ]
    
    for selector in image_selectors:
        img_elem = soup.select_one(selector)
        if img_elem:
            # Try different image URL sources
            img_url = None
            
            # Check data-a-dynamic-image (JSON with different sizes)
            dynamic_image = img_elem.get("data-a-dynamic-image")
            if dynamic_image:
                try:
                    import json
                    image_data = json.loads(dynamic_image)
                    if image_data:
                        # Get the largest image
                        img_url = max(image_data.keys(), key=lambda x: sum(image_data[x]))
                except:
                    pass
            
            # Check other attributes
            if not img_url:
                img_url = (img_elem.get("data-old-hires") or 
                          img_elem.get("data-src") or 
                          img_elem.get("src"))
            
            if img_url:
                # Clean up the URL
                if img_url.startswith("//"):
                    img_url = "https:" + img_url
                elif img_url.startswith("/"):
                    img_url = "https://amazon.com" + img_url
                
                # Remove size restrictions to get full-size image
                if "._" in img_url:
                    img_url = img_url.split("._")[0] + ".jpg"
                
                result["image"] = img_url
                break
    
    # Fallback to any large image
    if not result["image"]:
        images = soup.find_all("img")
        for img in images:
            src = img.get("src") or img.get("data-src")
            if src and ("images-amazon" in src or "ssl-images-amazon" in src):
                if src.startswith("//"):
                    src = "https:" + src
                if "._" in src:
                    src = src.split("._")[0] + ".jpg"
                result["image"] = src
                break
    
    return result

async def check_image_accessibility(image_url: str) -> bool:
    """Quick HEAD check to see if image returns 403/401."""
    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(3.0),
            headers={"User-Agent": UNFURL_USER_AGENT}
        ) as client:
            response = await client.head(image_url)
            return response.status_code not in [401, 403]
    except Exception:
        return False

async def cache_get(key: str) -> Optional[Dict[str, Any]]:
    """Get value from cache (Redis or in-memory)."""
    redis_client = await get_redis_client()
    
    if redis_client:
        try:
            data = await redis_client.get(key)
            if data:
                import json
                return json.loads(data)
        except Exception:
            pass
    
    # Fallback to in-memory cache
    if key in _in_memory_cache:
        data, expiry = _in_memory_cache[key]
        if datetime.now() < expiry:
            return data
        else:
            del _in_memory_cache[key]
    
    return None

async def cache_set(key: str, value: Dict[str, Any], ttl: int) -> None:
    """Set value in cache (Redis or in-memory)."""
    redis_client = await get_redis_client()
    
    if redis_client:
        try:
            import json
            await redis_client.setex(key, ttl, json.dumps(value))
            return
        except Exception:
            pass
    
    # Fallback to in-memory cache
    expiry = datetime.now() + timedelta(seconds=ttl)
    _in_memory_cache[key] = (value, expiry)
    
    # Clean up old entries (simple cleanup)
    now = datetime.now()
    expired_keys = [k for k, (_, exp) in _in_memory_cache.items() if exp < now]
    for k in expired_keys:
        del _in_memory_cache[k]

@router.get("/unfurl", response_model=UnfurlResponse)
async def unfurl_url(url: str = Query(..., description="URL to unfurl")):
    """Extract metadata from a web page."""
    # Validate URL scheme
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Only http:// and https:// URLs are allowed")
    
    # SSRF protection
    if not is_public_url(url):
        raise HTTPException(status_code=400, detail="URL not allowed (private/internal IP or invalid domain)")
    
    try:
        # Check cache first
        cache_key = f"unfurl:{hashlib.sha256(url.encode()).hexdigest()}"
        cached_result = await cache_get(cache_key)
        if cached_result:
            return UnfurlResponse(**cached_result)
        
        # Fetch and parse
        final_url, html, content_type = await fetch_html(url)
        metadata = extract_metadata(html, final_url)
        
        # Check if image needs proxy
        image_proxy_url = None
        if metadata["image"]:
            if not await check_image_accessibility(metadata["image"]):
                from urllib.parse import quote
                image_proxy_url = f"/img-proxy?src={quote(metadata['image'])}"
        
        # Build response
        result = {
            "url": final_url,
            "title": metadata["title"],
            "description": metadata["description"],
            "image": metadata["image"],
            "image_proxy_url": image_proxy_url,
            "site_name": metadata["site_name"],
            "favicon": metadata["favicon"],
            "source": metadata["source"]
        }
        
        # Cache result
        await cache_set(cache_key, result, UNFURL_CACHE_TTL)
        
        return UnfurlResponse(**result)
        
    except httpx.HTTPStatusError as e:
        if e.response.status_code >= 500:
            raise HTTPException(status_code=502, detail="Upstream server error")
        else:
            raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {e.response.status_code}")
    except httpx.TimeoutException:
        raise HTTPException(status_code=400, detail="Request timeout")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process URL: {str(e)}")

@router.get("/img-proxy")
async def proxy_image(src: str = Query(..., description="Image URL to proxy")):
    """Proxy images to bypass CORS/403 issues."""
    # Validate URL scheme
    if not src.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Only http:// and https:// URLs are allowed")
    
    # SSRF protection
    if not is_public_url(src):
        raise HTTPException(status_code=400, detail="URL not allowed (private/internal IP or invalid domain)")
    
    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(UNFURL_TIMEOUT),
            follow_redirects=True,
            max_redirects=5,
            headers={"User-Agent": UNFURL_USER_AGENT}
        ) as client:
            response = await client.get(src)
            response.raise_for_status()
            
            # Only allow image content types
            content_type = response.headers.get("content-type", "")
            if not content_type.startswith("image/"):
                raise HTTPException(status_code=400, detail="URL does not return image content")
            
            # Stream the response
            async def generate():
                async for chunk in response.aiter_bytes(chunk_size=8192):
                    yield chunk
            
            return StreamingResponse(
                generate(),
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=86400",
                    "Content-Type": content_type
                }
            )
            
    except httpx.HTTPStatusError as e:
        if e.response.status_code >= 500:
            raise HTTPException(status_code=502, detail="Upstream server error")
        else:
            raise HTTPException(status_code=400, detail=f"Failed to fetch image: {e.response.status_code}")
    except httpx.TimeoutException:
        raise HTTPException(status_code=400, detail="Request timeout")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to proxy image: {str(e)}")