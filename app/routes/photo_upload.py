from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import logging
from typing import Dict, Any, List
import os

from ..gcs_uploader import gcs_uploader
from ..firebase_auth import get_current_user_firebase
from ..models import User
from ..database import SessionLocal
from ..services.image_compression import ImageCompressionService

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["photo-upload"]
)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Allowed image MIME types
ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/gif",
    "image/webp"
}

# Maximum file size (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024

@router.post("/upload-photo", response_model=Dict[str, str])
async def upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_firebase),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Upload a photo to Google Cloud Storage.
    
    Args:
        file: The uploaded image file
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        JSON response with the public URL of the uploaded image
    """
    try:
        # Validate file presence
        if not file:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided"
            )
        
        # Validate file type
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Validate file size
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Validate file is not empty
        if len(file_content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty file provided"
            )
        
        # Validate image integrity
        is_valid, error_msg = ImageCompressionService.validate_image(file_content)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image file: {error_msg}"
            )
        
        # Get original image info for logging
        original_info = ImageCompressionService.get_image_info(file_content)
        logger.info(f"Original image: {original_info}")
        
        # Compress image for storage
        try:
            compressed_content = ImageCompressionService.compress_for_storage(
                file_content, 
                output_format="JPEG"
            )
            compressed_info = ImageCompressionService.get_image_info(compressed_content)
            logger.info(f"Compressed image: {compressed_info}")
        except Exception as compression_error:
            logger.error(f"Image compression failed: {str(compression_error)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Image compression failed: {str(compression_error)}"
            )
        
        # Upload compressed image to Google Cloud Storage
        try:
            public_url = gcs_uploader.upload_file(
                file_data=compressed_content,
                filename=file.filename or "unknown",
                content_type="image/jpeg"  # Always JPEG after compression
            )
            
            if not public_url:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to upload file to cloud storage"
                )
            
            logger.info(f"Photo uploaded successfully by user {current_user.email}: {public_url}")
            
            return {
                "url": public_url,
                "message": "Photo uploaded successfully",
                "filename": file.filename
            }
            
        except Exception as upload_error:
            logger.error(f"GCS upload error for user {current_user.email}: {str(upload_error)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed: {str(upload_error)}"
            )
            
    except HTTPException:
        # Re-raise HTTP exceptions as they are
        raise
    except Exception as e:
        logger.error(f"Unexpected error during photo upload for user {current_user.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during upload"
        )

@router.delete("/photo")
async def delete_photo(
    file_url: str,
    current_user: User = Depends(get_current_user_firebase),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Delete a photo from Google Cloud Storage.
    
    Args:
        file_url: Public URL of the file to delete
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        JSON response confirming deletion
    """
    try:
        if not file_url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File URL is required"
            )
        
        # Attempt to delete the file
        success = gcs_uploader.delete_file(file_url)
        
        if success:
            logger.info(f"Photo deleted successfully by user {current_user.email}: {file_url}")
            return {
                "message": "Photo deleted successfully",
                "url": file_url
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found or could not be deleted"
            )
            
    except HTTPException:
        # Re-raise HTTP exceptions as they are
        raise
    except Exception as e:
        logger.error(f"Unexpected error during photo deletion for user {current_user.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during deletion"
        )

@router.post("/upload-and-classify", response_model=Dict[str, Any])
async def upload_and_classify_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_firebase),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Upload a photo to Google Cloud Storage and classify it in one step.
    This is more efficient as it compresses the image once for both operations.
    
    Args:
        file: The uploaded image file
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        JSON response with the public URL and classification results
    """
    try:
        # Validate file presence
        if not file:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided"
            )
        
        # Validate file type
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Validate file size
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Validate file is not empty
        if len(file_content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty file provided"
            )
        
        # Validate image integrity
        is_valid, error_msg = ImageCompressionService.validate_image(file_content)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image file: {error_msg}"
            )
        
        # Get original image info for logging
        original_info = ImageCompressionService.get_image_info(file_content)
        logger.info(f"Original image: {original_info}")
        
        # Compress image for storage
        try:
            compressed_for_storage = ImageCompressionService.compress_for_storage(
                file_content, 
                output_format="JPEG"
            )
            storage_info = ImageCompressionService.get_image_info(compressed_for_storage)
            logger.info(f"Storage compressed image: {storage_info}")
        except Exception as compression_error:
            logger.error(f"Storage compression failed: {str(compression_error)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Image compression failed: {str(compression_error)}"
            )
        
        # Upload compressed image to Google Cloud Storage
        try:
            public_url = gcs_uploader.upload_file(
                file_data=compressed_for_storage,
                filename=file.filename or "unknown",
                content_type="image/jpeg"  # Always JPEG after compression
            )
            
            if not public_url:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to upload file to cloud storage"
                )
                
        except Exception as upload_error:
            logger.error(f"GCS upload error for user {current_user.email}: {str(upload_error)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed: {str(upload_error)}"
            )
        
        # Classify the image using AI (this will use AI-optimized compression internally)
        try:
            from ..services import ai
            classification_result = ai.ai_classify_clothing(file_content)
            
            if not classification_result or "error" in classification_result:
                logger.warning("AI classification failed, returning upload URL only")
                classification_result = None
                
        except Exception as classification_error:
            logger.error(f"AI classification error: {str(classification_error)}")
            classification_result = None
        
        # Prepare response
        response = {
            "url": public_url,
            "message": "Photo uploaded and processed successfully",
            "filename": file.filename,
            "original_size_mb": original_info.get("size_mb", 0),
            "compressed_size_mb": storage_info.get("size_mb", 0),
            "compression_ratio": round((1 - storage_info.get("size_mb", 1) / max(original_info.get("size_mb", 1), 0.001)) * 100, 1)
        }
        
        # Add classification results if available
        if classification_result:
            # Map the result to match the expected schema
            mapped_classification = {
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
            response["classification"] = mapped_classification
        
        logger.info(f"Photo uploaded and classified successfully by user {current_user.email}: {public_url}")
        return response
            
    except HTTPException:
        # Re-raise HTTP exceptions as they are
        raise
    except Exception as e:
        logger.error(f"Unexpected error during photo upload and classification for user {current_user.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during upload and classification"
        )

@router.post("/bulk-upload", response_model=Dict[str, Any])
async def bulk_upload_images(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user_firebase),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Upload multiple images (up to 10) and process them asynchronously.
    
    Args:
        files: List of uploaded image files (max 10)
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        JSON response with batch_id for tracking progress
    """
    try:
        # Validate number of files
        if not files or len(files) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No files provided"
            )
        
        if len(files) > 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 10 files allowed per batch"
            )
        
        # Validate each file
        images_data = []
        for file in files:
            # Validate file type
            if file.content_type not in ALLOWED_IMAGE_TYPES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid file type for {file.filename}. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}"
                )
            
            # Read file content
            file_content = await file.read()
            
            # Validate file size
            if len(file_content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File {file.filename} too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
                )
            
            # Validate file is not empty
            if len(file_content) == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Empty file provided: {file.filename}"
                )
            
            # Store file data for processing
            images_data.append({
                'filename': file.filename or f"image_{len(images_data) + 1}",
                'content_type': file.content_type,
                'file_data': file_content
            })
        
        # Generate batch ID
        import uuid
        batch_id = str(uuid.uuid4())
        
        # Start async processing
        from ..tasks import process_bulk_images_task
        task = process_bulk_images_task.delay(images_data, current_user.id, batch_id)
        
        logger.info(f"Started bulk processing for user {current_user.email}, batch_id: {batch_id}, task_id: {task.id}")
        
        return {
            "batch_id": batch_id,
            "task_id": task.id,
            "message": f"Started processing {len(files)} images",
            "total_files": len(files),
            "status": "processing"
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as they are
        raise
    except Exception as e:
        logger.error(f"Unexpected error during bulk upload for user {current_user.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during bulk upload"
        )

@router.get("/bulk-status/{batch_id}", response_model=Dict[str, Any])
async def get_bulk_upload_status(
    batch_id: str,
    current_user: User = Depends(get_current_user_firebase),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get the status of a bulk upload batch.
    
    Args:
        batch_id: The batch identifier
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        JSON response with batch processing status
    """
    try:
        import redis
        import json
        
        # Connect to Redis
        redis_client = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379/0"), db=1)
        
        # Get status from Redis
        batch_key = f"batch:{batch_id}:status"
        status_data = redis_client.get(batch_key)
        
        if not status_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Batch not found or expired"
            )
        
        status = json.loads(status_data)
        
        # Add batch_id to response
        status["batch_id"] = batch_id
        
        return status
        
    except HTTPException:
        # Re-raise HTTP exceptions as they are
        raise
    except Exception as e:
        logger.error(f"Error getting bulk status for batch {batch_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while retrieving status"
        ) 