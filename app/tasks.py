from celery import Celery, group
from celery.schedules import crontab
import redis
import os
from dotenv import load_dotenv
from .services.ai import ai_classify_clothing
from .services.weather import fetch_weather
from .gcs_uploader import gcs_uploader
from .services.image_compression import ImageCompressionService
import logging
import json
import base64
from sqlalchemy.orm import Session
from .database import SessionLocal
from . import crud, models, schemas

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

celery_app = Celery(
    "tasks",
    broker=os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0")
)

# Configure Celery Beat schedule
celery_app.conf.beat_schedule = {
    'update-weather-every-hour': {
        'task': 'app.tasks.update_weather_task',
        'schedule': crontab(minute=0),  # Run at the start of every hour
    },
}

r = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379/0"), db=1)

def redis_key_for_user(user_id: int) -> str:
    return f"user:{user_id}:tasks"

def redis_key_for_batch(batch_id: str) -> str:
    return f"batch:{batch_id}:status"

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        return db
    finally:
        db.close()

@celery_app.task(bind=True)
def classify_image_task(self, image_bytes: bytes, user_id: int):
    key = redis_key_for_user(user_id)
    try:
        result = ai_classify_clothing(image_bytes)
        return result
    finally:
        # Удаляем task_id из Redis даже если была ошибка
        r.srem(key, self.request.id)

@celery_app.task(bind=True)
def process_single_image_task(self, image_data: dict, user_id: int, batch_id: str, image_index: int):
    """
    Process a single image: upload to GCS, classify with AI, and add to wardrobe
    This runs in parallel with other image processing tasks
    """
    batch_key = redis_key_for_batch(batch_id)
    
    try:
        filename = image_data['filename']
        content_type = image_data['content_type']
        # Decode base64 file data
        file_data = base64.b64decode(image_data['file_data'])
        
        logger.info(f"Processing image {image_index + 1}: {filename}")
        
        # Validate and compress image
        is_valid, error_msg = ImageCompressionService.validate_image(file_data)
        if not is_valid:
            raise Exception(f"Invalid image: {error_msg}")
        
        # Compress for storage
        compressed_content = ImageCompressionService.compress_for_storage(
            file_data, 
            output_format="JPEG"
        )
        
        # Upload to GCS
        public_url = gcs_uploader.upload_file(
            file_data=compressed_content,
            filename=filename,
            content_type="image/jpeg"
        )
        
        if not public_url:
            raise Exception("Failed to upload to cloud storage")
        
        # Classify with AI (this runs in parallel for each image)
        classification_result = None
        try:
            classification_result = ai_classify_clothing(file_data)
        except Exception as classify_error:
            logger.warning(f"Classification failed for {filename}: {str(classify_error)}")
        
        # Prepare clothing item data
        clothing_data = {
            "name": classification_result.get("name", "Unknown Item") if classification_result else "Unknown Item",
            "category": classification_result.get("category", "Other") if classification_result else "Other", 
            "color": classification_result.get("color", "Unknown") if classification_result else "Unknown",
            "brand": classification_result.get("brand") if classification_result else None,
            "material": classification_result.get("material") if classification_result else None,
            "description": classification_result.get("description") if classification_result else None,
            "image_url": public_url,
            "condition": "excellent",
            "tags": classification_result.get("tags", []) if classification_result else [],
            "weather_suitability": classification_result.get("weather_suitability", []) if classification_result else [],
            "occasions": classification_result.get("occasions", []) if classification_result else [],
            "user_id": user_id
        }
        
        # Add to database
        db = SessionLocal()
        try:
            clothing_item = crud.create_clothing_item(db, schemas.ClothingItemCreate(**clothing_data), user_id)
            
            result = {
                "filename": filename,
                "status": "success",
                "clothing_item_id": clothing_item.id,
                "image_url": public_url,
                "classification": classification_result,
                "image_index": image_index
            }
            
            logger.info(f"Successfully processed {filename} -> item ID: {clothing_item.id}")
            
            # Update batch status
            update_batch_status(batch_key, result, None)
            
            return result
            
        finally:
            db.close()
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Failed to process {filename}: {error_msg}")
        
        error_result = {
            "filename": filename,
            "error": error_msg,
            "image_index": image_index
        }
        
        # Update batch status with error
        update_batch_status(batch_key, None, error_result)
        
        raise

def update_batch_status(batch_key: str, success_result: dict = None, error_result: dict = None):
    """Update batch processing status in Redis"""
    try:
        # Get current status
        current_status = r.get(batch_key)
        if current_status:
            status = json.loads(current_status)
        else:
            return  # Batch not found
        
        # Update status based on result
        if success_result:
            status["results"].append(success_result)
            status["success"] += 1
        
        if error_result:
            status["errors"].append(error_result)
            status["failed"] += 1
        
        status["processed"] = status["success"] + status["failed"]
        
        # Check if batch is complete
        if status["processed"] >= status["total"]:
            status["status"] = "completed"
        
        # Save updated status
        r.setex(batch_key, 3600, json.dumps(status))
        
    except Exception as e:
        logger.error(f"Failed to update batch status: {str(e)}")

@celery_app.task(bind=True)
def process_bulk_images_task(self, images_data: list, user_id: int, batch_id: str):
    """
    Coordinate bulk image processing by spawning parallel tasks for each image
    """
    batch_key = redis_key_for_batch(batch_id)
    
    try:
        # Set initial status
        status = {
            "status": "processing",
            "total": len(images_data),
            "processed": 0,
            "success": 0,
            "failed": 0,
            "results": [],
            "errors": []
        }
        r.setex(batch_key, 3600, json.dumps(status))
        
        # Convert file data to base64 for Celery serialization
        serialized_images = []
        for i, image_data in enumerate(images_data):
            serialized_image = {
                'filename': image_data['filename'],
                'content_type': image_data['content_type'],
                'file_data': base64.b64encode(image_data['file_data']).decode('utf-8')
            }
            serialized_images.append(serialized_image)
        
        # Create parallel tasks for each image
        logger.info(f"Starting parallel processing of {len(serialized_images)} images for batch {batch_id}")
        
        # Create a group of parallel tasks
        job = group(
            process_single_image_task.s(img_data, user_id, batch_id, i) 
            for i, img_data in enumerate(serialized_images)
        )
        
        # Execute all tasks in parallel
        result = job.apply_async()
        
        logger.info(f"Dispatched {len(serialized_images)} parallel image processing tasks for batch {batch_id}")
        
        return {
            "batch_id": batch_id,
            "message": f"Started parallel processing of {len(images_data)} images",
            "task_ids": [str(subtask.id) for subtask in result.children] if hasattr(result, 'children') else []
        }
        
    except Exception as e:
        logger.error(f"Bulk processing coordination failed for batch {batch_id}: {str(e)}")
        
        # Update status with error
        error_status = {
            "status": "failed",
            "error": str(e),
            "total": len(images_data),
            "processed": 0,
            "success": 0,
            "failed": len(images_data)
        }
        r.setex(batch_key, 3600, json.dumps(error_status))
        
        raise

@celery_app.task
def update_weather_task():
    """Celery task to update weather data."""
    try:
        weather_data = fetch_weather()
        if weather_data:
            return {"status": "success", "data": weather_data}
        return {"status": "error", "message": "Failed to fetch weather data"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
