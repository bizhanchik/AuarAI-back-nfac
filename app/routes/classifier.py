from typing import List
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
from typing import Dict, Any, Optional
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
