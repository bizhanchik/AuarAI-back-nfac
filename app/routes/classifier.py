from typing import List, Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from celery.result import AsyncResult
import redis

from fastapi import APIRouter, HTTPException
from app.tasks import celery_app
from celery.result import AsyncResult

from ..auth import get_current_user
from ..models import User
from ..tasks import classify_image_task, redis_key_for_user
from app import models
import os

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
import asyncio

from ..services import ai
from .. import models, crud
from ..database import get_db
from ..firebase_auth import get_current_user_firebase
from sqlalchemy.orm import Session

router = APIRouter(prefix="/classifier", tags=["classifier"])

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
r = redis.Redis.from_url(REDIS_URL, db=1)

class ImageClassificationRequest(BaseModel):
    image_url: str
    additional_context: Optional[str] = None

class ImageClassificationResponse(BaseModel):
    clothing_type: str
    color: str
    material: Optional[str] = None
    pattern: Optional[str] = None
    brand: Optional[str] = None
    confidence_score: float
    description: Optional[str] = None
    predicted_tags: Optional[List[str]] = []
    occasions: Optional[List[str]] = []
    weather_suitability: Optional[List[str]] = []
    predicted_name: Optional[str] = None
    predicted_category: Optional[str] = None
    predicted_color: Optional[str] = None
    predicted_brand: Optional[str] = None
    predicted_material: Optional[str] = None
    additional_details: Dict[str, Any] = {}

@router.post("/classify-image", response_model=ImageClassificationResponse)
async def classify_clothing_image(
    request: ImageClassificationRequest,
    current_user: models.User = Depends(get_current_user_firebase),
    db: Session = Depends(get_db)
):
    """
    Classify a clothing item from an image URL using AI.
    """
    try:
        # Use the AI service to classify the image
        classification_result = await ai.classify_clothing_image(
            image_url=request.image_url,
            additional_context=request.additional_context
        )
        
        if not classification_result:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Unable to classify the image. Please ensure it contains a clear view of a clothing item."
            )
        
        return ImageClassificationResponse(**classification_result)
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Classification failed: {str(e)}"
        )

@router.post("/classify-image-file", response_model=ImageClassificationResponse)
async def classify_clothing_image_file(
    files: List[UploadFile] = File(...),
    current_user: models.User = Depends(get_current_user_firebase),
    db: Session = Depends(get_db)
):
    """
    Classify a clothing item from uploaded file(s) using AI.
    """
    try:
        if not files or len(files) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No files provided"
            )
        
        # Use the first file
        file = files[0]
        
        # Read file content
        file_content = await file.read()
        
        # Use the AI classification function directly
        classification_result = ai.ai_classify_clothing(file_content)
        
        if not classification_result or "error" in classification_result:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Unable to classify the image. Please ensure it contains a clear view of a clothing item."
            )
        
        # Map the result to match the expected schema
        mapped_result = {
            "clothing_type": classification_result.get("category", "Unknown"),
            "color": classification_result.get("color", "Unknown"),
            "material": classification_result.get("material"),
            "pattern": None,
            "brand": classification_result.get("brand"),
            "confidence_score": 0.8,
            "description": classification_result.get("description"),
            "predicted_tags": classification_result.get("tags", []),
            "occasions": classification_result.get("occasions", []),
            "weather_suitability": classification_result.get("weather_suitability", []),
            "predicted_name": classification_result.get("name"),
            "predicted_category": classification_result.get("category"),
            "predicted_color": classification_result.get("color"),
            "predicted_brand": classification_result.get("brand"),
            "predicted_material": classification_result.get("material"),
            "additional_details": {
                "gender": classification_result.get("gender"),
                "size": classification_result.get("size")
            }
        }
        
        return ImageClassificationResponse(**mapped_result)
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Classification failed: {str(e)}"
        )

@router.get("/classification-result/{task_id}")
def get_result(task_id: str):
    # create AsyncResult *on your configured app*
    result = AsyncResult(task_id, app=celery_app)

    if result.state == "PENDING":
        # task_id not found or still queued
        return {"status": "pending"}
    if not result.ready():
        return {"status": result.state}
    try:
        data = result.get(timeout=1)  # fetch the actual result
    except Exception as e:
        raise HTTPException(500, detail=f"Task failed: {e}")
    return {"status": "completed", "result": data}
