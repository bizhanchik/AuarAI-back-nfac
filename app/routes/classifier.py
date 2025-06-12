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

router = APIRouter(prefix="/ai", tags=["AI"])

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = redis.Redis.from_url(REDIS_URL, db=1)

@router.post("/classify-image")
async def classify_images(
    files: List[UploadFile] = File(...),
    current_user: models.User = Depends(get_current_user)
):
    task_ids = []

    for file in files:
        image_bytes = await file.read()

        # Ограничения для freemium
        task_set_key = redis_key_for_user(current_user.id)
        if not current_user.is_premium and r.scard(task_set_key) >= 1:
            return {"error": "Free users can only classify 1 item at a time."}
        elif current_user.is_premium and r.scard(task_set_key) >= 5:
            return {"error": "Premium users can only classify 5 items at a time."}

        task = classify_image_task.delay(image_bytes, current_user.id)
        r.sadd(task_set_key, task.id)
        task_ids.append(task.id)

    return {"task_ids": task_ids}

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
