import os
import uuid
from typing import Optional
from io import BytesIO
from datetime import datetime, timedelta
from google.cloud import storage
from google.cloud.exceptions import GoogleCloudError
from google.oauth2 import service_account
from google.auth import default
import logging
import json

logger = logging.getLogger(__name__)

class GCSUploader:
    def __init__(self, credentials_path: str = None, bucket_name: str = None):
        """
        Initialize GCS uploader with credentials and bucket name.
        
        Args:
            credentials_path: Path to the service account JSON file
            bucket_name: Name of the GCS bucket
        """
        # Use GOOGLE_APPLICATION_CREDENTIALS if available, otherwise fall back to GCS_CREDENTIALS_PATH
        self.credentials_path = (
            credentials_path or 
            os.getenv('GOOGLE_APPLICATION_CREDENTIALS') or 
            os.getenv('GCS_CREDENTIALS_PATH', 'gcs-key.json')
        )
        self.bucket_name = bucket_name or os.getenv('GCS_BUCKET_NAME', 'your-bucket-name')
        self.client = None
        self.bucket = None
        self.credentials = None
        
    def _load_credentials_from_dict(self, credentials_dict: dict):
        """Load credentials from a dictionary (for debugging corrupted keys)"""
        try:
            # Try to create credentials from the dictionary
            credentials = service_account.Credentials.from_service_account_info(
                credentials_dict,
                scopes=['https://www.googleapis.com/auth/cloud-platform']
            )
            return credentials
        except Exception as e:
            logger.error(f"Failed to load credentials from dict: {e}")
            return None
    
    def _initialize_client(self):
        """Initialize GCS client with explicit service account credentials."""
        try:
            if not os.path.exists(self.credentials_path):
                raise FileNotFoundError(f"Service account file not found: {self.credentials_path}")
            
            logger.info(f"Attempting to load credentials from: {self.credentials_path}")
            
            # Try multiple authentication methods
            auth_success = False
            
            # Method 1: Load from service account file
            try:
                self.credentials = service_account.Credentials.from_service_account_file(
                    self.credentials_path,
                    scopes=['https://www.googleapis.com/auth/cloud-platform']
                )
                logger.info("✅ Method 1: Successfully loaded credentials from service account file")
                auth_success = True
            except Exception as method1_error:
                logger.warning(f"❌ Method 1 failed: {method1_error}")
                
                # Method 2: Try loading from JSON and creating credentials from dict
                try:
                    with open(self.credentials_path, 'r') as f:
                        credentials_dict = json.load(f)
                    
                    self.credentials = self._load_credentials_from_dict(credentials_dict)
                    if self.credentials:
                        logger.info("✅ Method 2: Successfully loaded credentials from JSON dict")
                        auth_success = True
                    else:
                        logger.warning("❌ Method 2 failed: Could not create credentials from dict")
                except Exception as method2_error:
                    logger.warning(f"❌ Method 2 failed: {method2_error}")
                    
                    # Method 3: Try default credentials
                    try:
                        # Set environment variable and try default credentials
                        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = self.credentials_path
                        self.credentials, project = default()
                        logger.info("✅ Method 3: Successfully loaded default credentials")
                        auth_success = True
                    except Exception as method3_error:
                        logger.error(f"❌ Method 3 failed: {method3_error}")
            
            if not auth_success:
                raise Exception("All authentication methods failed")
            
            # Initialize client with explicit credentials
            self.client = storage.Client(credentials=self.credentials)
            self.bucket = self.client.bucket(self.bucket_name)
            
            # Test bucket access with a simple operation
            try:
                # Try to get bucket metadata (lightweight operation)
                bucket_info = self.bucket.reload()
                logger.info(f"✅ GCS client initialized successfully with bucket: {self.bucket_name}")
            except Exception as bucket_error:
                logger.error(f"❌ Bucket access test failed: {bucket_error}")
                # If we can't access the bucket, try to create the client without bucket validation
                logger.info("Proceeding without bucket validation...")
                
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
            Public URL of the uploaded file or signed URL for private buckets
        """
        try:
            if not self.client:
                self._initialize_client()
            
            # Generate unique filename to avoid conflicts
            file_extension = filename.split('.')[-1] if '.' in filename else ''
            unique_filename = f"{uuid.uuid4()}.{file_extension}" if file_extension else str(uuid.uuid4())
            
            # Create blob object
            blob_path = f"photos/{unique_filename}"
            blob = self.bucket.blob(blob_path)
            
            # Create a BytesIO object from the file data
            file_obj = BytesIO(file_data)
            
            logger.info(f"Attempting to upload file: {blob_path}")
            
            # Upload file with proper content type
            blob.upload_from_file(
                file_obj,
                content_type=content_type
            )
            
            logger.info(f"✅ File uploaded successfully to GCS: {blob_path}")
            
            # Since your bucket is public, try to get the public URL directly
            try:
                # For public buckets, construct the URL directly without API calls
                public_url = f"https://storage.googleapis.com/{self.bucket_name}/{blob_path}"
                logger.info(f"Generated public URL: {public_url}")
                return public_url
            except Exception as public_error:
                logger.warning(f"Could not generate public URL: {public_error}")
                
                # Fallback to signed URL
                try:
                    signed_url = blob.generate_signed_url(
                        expiration=datetime.utcnow() + timedelta(days=365),  # 1 year
                        method='GET',
                        credentials=self.credentials
                    )
                    logger.info(f"Generated signed URL: {signed_url}")
                    return signed_url
                except Exception as signed_error:
                    logger.error(f"Failed to generate signed URL: {signed_error}")
                    # Return the basic public URL as last resort
                    return f"https://storage.googleapis.com/{self.bucket_name}/{blob_path}"
            
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
        # For public buckets, construct URL directly
        return f"https://storage.googleapis.com/{self.bucket_name}/{blob_name}"
    
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
            method='GET',
            credentials=self.credentials
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