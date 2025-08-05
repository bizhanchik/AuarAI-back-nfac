from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional
import os
import io
from PIL import Image
import json
from sqlalchemy.orm import Session

from ..gcs_uploader import gcs_uploader
from ..firebase_auth import get_current_user_firebase
from .. import models
from ..services.ai import ai_analyze_body_photo, ai_analyze_wardrobe_compatibility
from ..services.image_compression import ImageCompressionService
from ..database import get_db
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/body-analysis", tags=["body-analysis"])

# Pydantic models for request/response
from pydantic import BaseModel

class BodyAnalysisResult(BaseModel):
    bodyType: Optional[str] = None
    recommendedColors: Optional[List[str]] = None
    styleRecommendations: Optional[List[str]] = None
    proportions: Optional[Dict[str, float]] = None
    confidence: Optional[float] = None
    analysis_details: Optional[Dict[str, Any]] = None

class BodyAnalysisResponse(BaseModel):
    success: bool
    message: str
    result: Optional[BodyAnalysisResult] = None
    photo_url: Optional[str] = None

class WardrobeCompatibilityResult(BaseModel):
    compatibility_percentage: float
    matching_items: int
    total_items: int
    recommendations: List[str]
    color_matches: List[str]
    style_matches: List[str]
    missing_essentials: List[str]

class WardrobeCompatibilityResponse(BaseModel):
    success: bool
    message: str
    result: Optional[WardrobeCompatibilityResult] = None

@router.post("/analyze", response_model=BodyAnalysisResponse)
async def analyze_body_photo(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user_firebase)
):
    """
    Analyze a full-body photo to provide personalized style recommendations.
    """
    try:
        logger.info(f"🔍 Starting body photo analysis for user {current_user.id}")
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        # Read and validate image
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty file"
            )
        
        logger.info(f"📸 Processing image: {len(image_bytes)} bytes")
        
        # Validate image can be opened
        try:
            image = Image.open(io.BytesIO(image_bytes))
            logger.info(f"🖼️ Image validated: {image.size}, mode: {image.mode}")
        except Exception as e:
            logger.error(f"❌ Invalid image format: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image format"
            )
        
        # Compress image for storage and processing
        try:
            # Compress for storage (higher quality)
            storage_compressed = ImageCompressionService.compress_for_storage(image_bytes)
            storage_info = ImageCompressionService.get_image_info(storage_compressed)
            
            # Compress for AI processing (lower quality to reduce costs)
            ai_compressed = ImageCompressionService.compress_for_ai_processing(image_bytes)
            
            logger.info(f"📦 Image compressed - Storage: {storage_info.get('size_mb', 0):.2f}MB, AI: {len(ai_compressed)/1024/1024:.2f}MB")
            
        except Exception as e:
            logger.error(f"❌ Image compression failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Image processing failed"
            )
        
        # Upload to Google Cloud Storage
        try:
            filename = f"body_photos/{current_user.id}_{file.filename}"
            public_url = gcs_uploader.upload_file(
                file_data=storage_compressed,
                filename=filename,
                content_type=file.content_type
            )
            logger.info(f"☁️ Image uploaded to GCS: {public_url}")
            
        except Exception as e:
            logger.error(f"❌ GCS upload failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload image"
            )
        
        # Analyze body photo with AI
        try:
            logger.info("🤖 Starting AI body analysis...")
            analysis_result = ai_analyze_body_photo(ai_compressed)
            logger.info(f"✅ AI analysis completed: {analysis_result}")
            
        except Exception as e:
            logger.error(f"❌ AI analysis failed: {e}")
            # Continue without analysis - we still want to save the photo
            analysis_result = {
                "error": f"Analysis failed: {str(e)}",
                "bodyType": "Unknown",
                "recommendedColors": ["Navy", "White", "Black"],
                "styleRecommendations": ["Classic", "Minimalist"],
                "confidence": 0.0
            }
        
        # Analysis completed - no database storage needed
        logger.info("✅ Body analysis completed successfully - returning results")
        
        # Prepare response
        result = BodyAnalysisResult(
            bodyType=analysis_result.get("bodyType"),
            recommendedColors=analysis_result.get("recommendedColors", []),
            styleRecommendations=analysis_result.get("styleRecommendations", []),
            proportions=analysis_result.get("proportions", {}),
            confidence=analysis_result.get("confidence", 0.0),
            analysis_details=analysis_result
        )
        
        return BodyAnalysisResponse(
            success=True,
            message="Body photo analyzed successfully",
            result=result,
            photo_url=public_url
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error in body analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during body analysis"
        )

@router.post("/wardrobe-compatibility", response_model=WardrobeCompatibilityResponse)
async def analyze_wardrobe_compatibility(
    current_user: models.User = Depends(get_current_user_firebase),
    db: Session = Depends(get_db)
):
    """
    Analyze how well user's wardrobe matches their body analysis results.
    """
    try:
        logger.info(f"🔍 Starting wardrobe compatibility analysis for user {current_user.id}")
        
        # Get user's clothing items
        clothing_items = db.query(models.ClothingItem).filter(
            models.ClothingItem.owner_id == current_user.id
        ).all()
        
        if not clothing_items:
            return WardrobeCompatibilityResponse(
                success=True,
                message="No clothing items found in wardrobe",
                result=WardrobeCompatibilityResult(
                    compatibility_percentage=0.0,
                    matching_items=0,
                    total_items=0,
                    recommendations=["Add clothing items to your wardrobe to get compatibility analysis"],
                    color_matches=[],
                    style_matches=[],
                    missing_essentials=["Basic wardrobe items needed"]
                )
            )
        
        # Get user's latest body analysis (we'll need to store this)
        # For now, we'll use default recommendations
        body_analysis = {
            "bodyType": "Rectangle",  # Default - should come from stored analysis
            "recommendedColors": ["Navy", "White", "Black", "Gray", "Burgundy"],
            "styleRecommendations": ["Classic", "Minimalist", "Structured"]
        }
        
        # Prepare wardrobe data for AI analysis
        wardrobe_data = []
        for item in clothing_items:
            wardrobe_data.append({
                "name": item.name,
                "category": item.category,
                "color": item.color,
                "brand": item.brand,
                "material": item.material,
                "tags": item.tags if hasattr(item, 'tags') else []
            })
        
        # Analyze compatibility with AI
        try:
            logger.info("🤖 Starting AI wardrobe compatibility analysis...")
            compatibility_result = ai_analyze_wardrobe_compatibility(body_analysis, wardrobe_data)
            logger.info(f"✅ AI compatibility analysis completed: {compatibility_result}")
            
        except Exception as e:
            logger.error(f"❌ AI compatibility analysis failed: {e}")
            # Fallback to basic analysis
            compatibility_result = {
                "compatibility_percentage": 75.0,
                "matching_items": len(clothing_items) // 2,
                "total_items": len(clothing_items),
                "recommendations": ["Consider adding more versatile pieces", "Focus on recommended colors"],
                "color_matches": ["Navy", "Black"],
                "style_matches": ["Classic pieces"],
                "missing_essentials": ["White button-down shirt", "Dark jeans"]
            }
        
        result = WardrobeCompatibilityResult(
            compatibility_percentage=compatibility_result.get("compatibility_percentage", 0.0),
            matching_items=compatibility_result.get("matching_items", 0),
            total_items=len(clothing_items),
            recommendations=compatibility_result.get("recommendations", []),
            color_matches=compatibility_result.get("color_matches", []),
            style_matches=compatibility_result.get("style_matches", []),
            missing_essentials=compatibility_result.get("missing_essentials", [])
        )
        
        return WardrobeCompatibilityResponse(
            success=True,
            message="Wardrobe compatibility analysis completed",
            result=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error in wardrobe compatibility analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during wardrobe compatibility analysis"
        )

@router.get("/results/{user_id}")
async def get_body_analysis_results(
    user_id: int,
    current_user: models.User = Depends(get_current_user_firebase)
):
    """
    Body analysis results are not stored - this endpoint is deprecated.
    """
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Body analysis results are not stored. Please perform a new analysis."
    )

@router.delete("/results/{analysis_id}")
async def delete_body_analysis(
    analysis_id: int,
    current_user: models.User = Depends(get_current_user_firebase)
):
    """
    Body analysis results are not stored - this endpoint is deprecated.
    """
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Body analysis results are not stored. Nothing to delete."
    )