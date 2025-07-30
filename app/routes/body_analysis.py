from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import logging
from typing import Dict, Any, List, Optional
import os
import io
from PIL import Image
import json

from ..gcs_uploader import gcs_uploader
from ..database import get_db
from ..firebase_auth import get_current_user_firebase
from .. import models
from ..services.ai import ai_analyze_body_photo
from ..services.image_compression import ImageCompressionService

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
    current_user: models.User = Depends(get_current_user_firebase),
    db: Session = Depends(get_db)
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
            public_url = await gcs_uploader.upload_file(
                file_content=storage_compressed,
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
        
        # Save analysis to database
        try:
            body_analysis = models.BodyAnalysis(
                user_id=current_user.id,
                photo_url=public_url,
                compressed_photo_url=public_url,  # Using same URL for now
                body_type=analysis_result.get("bodyType"),
                recommended_colors=analysis_result.get("recommendedColors", []),
                style_recommendations=analysis_result.get("styleRecommendations", []),
                leg_to_body_ratio=analysis_result.get("proportions", {}).get("legToBodyRatio"),
                shoulder_to_hip_ratio=analysis_result.get("proportions", {}).get("shoulderToHipRatio"),
                waist_to_hip_ratio=analysis_result.get("proportions", {}).get("waistToHipRatio"),
                confidence=analysis_result.get("confidence"),
                fashion_tips=analysis_result.get("fashionTips", []),
                best_silhouettes=analysis_result.get("bestSilhouettes", []),
                avoid_patterns=analysis_result.get("avoidPatterns", []),
                accessory_tips=analysis_result.get("accessoryTips", [])
            )
            
            db.add(body_analysis)
            db.commit()
            db.refresh(body_analysis)
            
            logger.info(f"💾 Body analysis saved to database with ID: {body_analysis.id}")
            
        except Exception as e:
            logger.error(f"❌ Database save failed: {e}")
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save analysis results"
            )
        
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

@router.get("/results/{user_id}", response_model=BodyAnalysisResponse)
async def get_body_analysis_results(
    user_id: int,
    current_user: models.User = Depends(get_current_user_firebase),
    db: Session = Depends(get_db)
):
    """
    Get the latest body analysis results for a user.
    """
    try:
        # Check if user can access these results
        if current_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Get latest body analysis
        body_analysis = db.query(models.BodyAnalysis).filter(
            models.BodyAnalysis.user_id == user_id
        ).order_by(models.BodyAnalysis.created_at.desc()).first()
        
        if not body_analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No body analysis found for this user"
            )
        
        # Prepare proportions data
        proportions = {
            "legToBodyRatio": body_analysis.leg_to_body_ratio,
            "shoulderToHipRatio": body_analysis.shoulder_to_hip_ratio,
            "waistToHipRatio": body_analysis.waist_to_hip_ratio
        }
        
        # Prepare analysis details
        analysis_details = {
            "fashionTips": body_analysis.fashion_tips or [],
            "bestSilhouettes": body_analysis.best_silhouettes or [],
            "avoidPatterns": body_analysis.avoid_patterns or [],
            "accessoryTips": body_analysis.accessory_tips or []
        }
        
        result = BodyAnalysisResult(
            bodyType=body_analysis.body_type,
            recommendedColors=body_analysis.recommended_colors or [],
            styleRecommendations=body_analysis.style_recommendations or [],
            proportions=proportions,
            confidence=body_analysis.confidence,
            analysis_details=analysis_details
        )
        
        return BodyAnalysisResponse(
            success=True,
            message="Body analysis results retrieved successfully",
            result=result,
            photo_url=body_analysis.photo_url
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error retrieving body analysis results: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve body analysis results"
        )

@router.delete("/results/{analysis_id}")
async def delete_body_analysis(
    analysis_id: int,
    current_user: models.User = Depends(get_current_user_firebase),
    db: Session = Depends(get_db)
):
    """
    Delete a body analysis record.
    """
    try:
        # Get the analysis record
        body_analysis = db.query(models.BodyAnalysis).filter(
            models.BodyAnalysis.id == analysis_id
        ).first()
        
        if not body_analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Body analysis not found"
            )
        
        # Check if user owns this analysis
        if body_analysis.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Delete from database
        db.delete(body_analysis)
        db.commit()
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"success": True, "message": "Body analysis deleted successfully"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting body analysis: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete body analysis"
        )