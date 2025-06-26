import io
import logging
from typing import Tuple, Optional
from PIL import Image, ImageOps
import os

logger = logging.getLogger(__name__)

class ImageCompressionService:
    """Service for compressing images for storage and AI processing"""
    
    # Compression settings for storage
    STORAGE_MAX_WIDTH = 1200
    STORAGE_MAX_HEIGHT = 1200
    STORAGE_QUALITY = 85
    
    # Compression settings for AI processing (more aggressive)
    AI_MAX_WIDTH = 800
    AI_MAX_HEIGHT = 800
    AI_QUALITY = 75
    
    @staticmethod
    def _compress_image(
        image_bytes: bytes,
        max_width: int,
        max_height: int,
        quality: int,
        output_format: str = "JPEG"
    ) -> bytes:
        """
        Compress an image with specified parameters.
        
        Args:
            image_bytes: Original image bytes
            max_width: Maximum width in pixels
            max_height: Maximum height in pixels
            quality: JPEG quality (1-100)
            output_format: Output format (JPEG, PNG, WEBP)
            
        Returns:
            Compressed image bytes
        """
        try:
            # Open image from bytes
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert RGBA to RGB if saving as JPEG
            if output_format.upper() == "JPEG" and image.mode in ("RGBA", "LA", "P"):
                # Create white background
                background = Image.new("RGB", image.size, (255, 255, 255))
                if image.mode == "P":
                    image = image.convert("RGBA")
                background.paste(image, mask=image.split()[-1] if image.mode == "RGBA" else None)
                image = background
            
            # Auto-orient image based on EXIF data
            image = ImageOps.exif_transpose(image)
            
            # Calculate new dimensions while maintaining aspect ratio
            original_width, original_height = image.size
            
            # Only resize if image is larger than max dimensions
            if original_width > max_width or original_height > max_height:
                # Calculate scaling factor
                width_ratio = max_width / original_width
                height_ratio = max_height / original_height
                scale_factor = min(width_ratio, height_ratio)
                
                new_width = int(original_width * scale_factor)
                new_height = int(original_height * scale_factor)
                
                # Resize image with high-quality resampling
                image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
                
                logger.info(f"Image resized from {original_width}x{original_height} to {new_width}x{new_height}")
            
            # Save compressed image to bytes
            output_buffer = io.BytesIO()
            
            # Set compression parameters based on format
            save_kwargs = {}
            if output_format.upper() == "JPEG":
                save_kwargs = {
                    "quality": quality,
                    "optimize": True,
                    "progressive": True
                }
            elif output_format.upper() == "PNG":
                save_kwargs = {
                    "optimize": True,
                    "compress_level": 6
                }
            elif output_format.upper() == "WEBP":
                save_kwargs = {
                    "quality": quality,
                    "optimize": True,
                    "method": 6
                }
            
            image.save(output_buffer, format=output_format, **save_kwargs)
            compressed_bytes = output_buffer.getvalue()
            
            # Log compression results
            original_size = len(image_bytes)
            compressed_size = len(compressed_bytes)
            compression_ratio = (1 - compressed_size / original_size) * 100
            
            logger.info(f"Image compressed: {original_size} bytes -> {compressed_size} bytes "
                       f"({compression_ratio:.1f}% reduction)")
            
            return compressed_bytes
            
        except Exception as e:
            logger.error(f"Error compressing image: {str(e)}")
            raise Exception(f"Image compression failed: {str(e)}")
    
    @classmethod
    def compress_for_storage(cls, image_bytes: bytes, output_format: str = "JPEG") -> bytes:
        """
        Compress image for storage with balanced quality and file size.
        
        Args:
            image_bytes: Original image bytes
            output_format: Output format (JPEG, PNG, WEBP)
            
        Returns:
            Compressed image bytes suitable for storage
        """
        return cls._compress_image(
            image_bytes=image_bytes,
            max_width=cls.STORAGE_MAX_WIDTH,
            max_height=cls.STORAGE_MAX_HEIGHT,
            quality=cls.STORAGE_QUALITY,
            output_format=output_format
        )
    
    @classmethod
    def compress_for_ai_processing(cls, image_bytes: bytes, output_format: str = "JPEG") -> bytes:
        """
        Compress image for AI processing with smaller size to reduce costs.
        
        Args:
            image_bytes: Original image bytes
            output_format: Output format (JPEG, PNG, WEBP)
            
        Returns:
            Compressed image bytes suitable for AI processing
        """
        return cls._compress_image(
            image_bytes=image_bytes,
            max_width=cls.AI_MAX_WIDTH,
            max_height=cls.AI_MAX_HEIGHT,
            quality=cls.AI_QUALITY,
            output_format=output_format
        )
    
    @classmethod
    def get_image_info(cls, image_bytes: bytes) -> dict:
        """
        Get information about an image.
        
        Args:
            image_bytes: Image bytes
            
        Returns:
            Dictionary with image information
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            
            return {
                "width": image.width,
                "height": image.height,
                "format": image.format,
                "mode": image.mode,
                "size_bytes": len(image_bytes),
                "size_mb": round(len(image_bytes) / (1024 * 1024), 2)
            }
        except Exception as e:
            logger.error(f"Error getting image info: {str(e)}")
            return {}
    
    @classmethod
    def validate_image(cls, image_bytes: bytes) -> Tuple[bool, Optional[str]]:
        """
        Validate if bytes represent a valid image.
        
        Args:
            image_bytes: Image bytes to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            image.verify()  # Verify image integrity
            return True, None
        except Exception as e:
            return False, f"Invalid image: {str(e)}" 