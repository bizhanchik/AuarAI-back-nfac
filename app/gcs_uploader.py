import os
import uuid
from typing import Optional
from io import BytesIO
from datetime import datetime, timedelta
from google.cloud import storage
from google.cloud.exceptions import GoogleCloudError
import logging

logger = logging.getLogger(__name__)

class GCSUploader:
    def __init__(self, credentials_path: str = None, bucket_name: str = None):
        """
        Initialize GCS uploader with credentials and bucket name.
        
        Args:
            credentials_path: Path to the service account JSON file
            bucket_name: Name of the GCS bucket
        """
        self.credentials_path = credentials_path or os.getenv('GCS_CREDENTIALS_PATH', 'gcs-key.json')
        self.bucket_name = bucket_name or os.getenv('GCS_BUCKET_NAME', 'your-bucket-name')
        self.client = None
        self.bucket = None
        
    def _initialize_client(self):
        """Initialize GCS client with service account credentials."""
        try:
            if not os.path.exists(self.credentials_path):
                raise FileNotFoundError(f"Service account file not found: {self.credentials_path}")
            
            # Set the environment variable for authentication
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = self.credentials_path
            
            self.client = storage.Client()
            self.bucket = self.client.bucket(self.bucket_name)
            
            # Test bucket access
            if not self.bucket.exists():
                raise ValueError(f"Bucket '{self.bucket_name}' does not exist or is not accessible")
                
        except Exception as e:
            logger.error(f"Failed to initialize GCS client: {str(e)}")
            raise
    
    def upload_file(self, file_data: bytes, filename: str, content_type: str) -> Optional[str]:
        """
        Upload a file to Google Cloud Storage.
        
        Args:
            file_data: The file content as bytes
            filename: Original filename
            content_type: MIME type of the file
            
        Returns:
            Public URL of the uploaded file (works only if bucket has public access)
            or signed URL for private buckets
        """
        try:
            if not self.client:
                self._initialize_client()
            
            # Generate unique filename to avoid conflicts
            file_extension = filename.split('.')[-1] if '.' in filename else ''
            unique_filename = f"{uuid.uuid4()}.{file_extension}" if file_extension else str(uuid.uuid4())
            
            # Create blob object
            blob = self.bucket.blob(f"photos/{unique_filename}")
            
            # Create a BytesIO object from the file data
            file_obj = BytesIO(file_data)
            
            # Upload file with proper content type
            blob.upload_from_file(
                file_obj,
                content_type=content_type
            )
            
            # For Uniform Bucket-Level Access, we can't use make_public()
            # Instead, we generate a signed URL that works for a long time
            # Or use public URL if bucket is configured for public access
            
            try:
                # Try to return public URL (works if bucket has public access configured)
                public_url = blob.public_url
                logger.info(f"File uploaded successfully: {public_url}")
                return public_url
            except Exception:
                # If public URL doesn't work, generate a signed URL (valid for 7 days)
                signed_url = blob.generate_signed_url(
                    expiration=datetime.utcnow() + timedelta(days=7),
                    method='GET'
                )
                logger.info(f"File uploaded successfully with signed URL: {signed_url}")
                return signed_url
            
        except GoogleCloudError as e:
            logger.error(f"Google Cloud Storage error: {str(e)}")
            raise Exception(f"Upload failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during upload: {str(e)}")
            raise Exception(f"Upload failed: {str(e)}")
    
    def get_public_url(self, blob_name: str) -> str:
        """
        Get public URL for a blob (works only if bucket is publicly accessible).
        
        Args:
            blob_name: Name of the blob in the bucket
            
        Returns:
            Public URL of the blob
        """
        if not self.client:
            self._initialize_client()
        
        blob = self.bucket.blob(blob_name)
        return blob.public_url
    
    def get_signed_url(self, blob_name: str, expiration_hours: int = 24) -> str:
        """
        Generate a signed URL for a blob (works for private buckets).
        
        Args:
            blob_name: Name of the blob in the bucket
            expiration_hours: Hours until the URL expires
            
        Returns:
            Signed URL of the blob
        """
        if not self.client:
            self._initialize_client()
        
        blob = self.bucket.blob(blob_name)
        
        signed_url = blob.generate_signed_url(
            expiration=datetime.utcnow() + timedelta(hours=expiration_hours),
            method='GET'
        )
        
        return signed_url
    
    def delete_file(self, file_url: str) -> bool:
        """
        Delete a file from Google Cloud Storage using its public URL.
        
        Args:
            file_url: Public URL of the file to delete
            
        Returns:
            True if deletion was successful, False otherwise
        """
        try:
            if not self.client:
                self._initialize_client()
            
            # Extract blob name from URL
            # Example URL: https://storage.googleapis.com/bucket-name/photos/filename.jpg
            url_parts = file_url.split('/')
            if len(url_parts) < 2:
                raise ValueError("Invalid file URL format")
            
            # Find bucket name in URL and extract blob path
            try:
                bucket_index = url_parts.index(self.bucket_name)
                blob_name = '/'.join(url_parts[bucket_index + 1:])
            except ValueError:
                # If bucket name not found in URL, try to extract from signed URL
                # For signed URLs, extract the object path from the URL parameters
                if '?' in file_url:
                    base_url = file_url.split('?')[0]
                    url_parts = base_url.split('/')
                    blob_name = '/'.join(url_parts[url_parts.index(self.bucket_name) + 1:])
                else:
                    raise ValueError("Cannot extract blob name from URL")
            
            # Delete the blob
            blob = self.bucket.blob(blob_name)
            blob.delete()
            
            logger.info(f"File deleted successfully: {file_url}")
            return True
            
        except GoogleCloudError as e:
            logger.error(f"Google Cloud Storage error during deletion: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during deletion: {str(e)}")
            return False

# Global instance for reuse
gcs_uploader = GCSUploader() 