from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import logging
from typing import Dict, Any

from ..gcs_uploader import gcs_uploader
from ..firebase_auth import get_current_user_firebase
from ..models import User
from ..database import SessionLocal

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
        
        # Upload to Google Cloud Storage
        try:
            public_url = gcs_uploader.upload_file(
                file_data=file_content,
                filename=file.filename or "unknown",
                content_type=file.content_type
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