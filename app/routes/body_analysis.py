from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional
import os
import io
from PIL import Image
import json

from ..gcs_uploader import gcs_uploader
from ..firebase_auth import get_current_user_firebase
from .. import models
from ..services.ai import ai_analyze_body_photo
from ..services.image_compression import ImageCompressionService
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