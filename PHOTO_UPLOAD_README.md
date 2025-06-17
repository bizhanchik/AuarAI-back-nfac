# Photo Upload Functionality

This application now supports uploading photos to Google Cloud Storage through a FastAPI endpoint.

## Setup

### 1. Install Dependencies

The required dependencies are already included in `requirements.txt`:
```bash
pip install -r requirements.txt
```

### 2. Google Cloud Storage Setup

1. Create a Google Cloud Storage bucket
2. Create a service account with storage admin permissions
3. Download the service account key JSON file
4. Place the key file in your project root as `gcs-key.json`

### 3. Environment Variables

Set the following environment variables (optional, defaults are provided):

```bash
# Google Cloud Storage Configuration
GCS_CREDENTIALS_PATH=gcs-key.json
GCS_BUCKET_NAME=your-actual-bucket-name
```

### 4. Service Account Permissions

Ensure your service account has the following IAM roles:
- Storage Object Admin (for uploading/deleting files)
- Storage Legacy Bucket Writer (for making objects public)

## API Endpoints

### Upload Photo

**POST** `/upload-photo`

Upload an image file and get back the public URL.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Image file (JPEG, PNG, GIF, WebP)
- Max file size: 10MB
- Authentication: Bearer token required

**Response:**
```json
{
  "url": "https://storage.googleapis.com/your-bucket-name/photos/uuid-filename.jpg",
  "message": "Photo uploaded successfully",
  "filename": "original-filename.jpg"
}
```

**Example with curl:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/your/image.jpg" \
  http://localhost:8000/upload-photo
```

**Example with Python requests:**
```python
import requests

url = "http://localhost:8000/upload-photo"
headers = {"Authorization": "Bearer YOUR_ACCESS_TOKEN"}
files = {"file": open("image.jpg", "rb")}

response = requests.post(url, headers=headers, files=files)
print(response.json())
```

### Delete Photo

**DELETE** `/upload/photo?file_url=PHOTO_URL`

Delete a photo from Google Cloud Storage.

**Request:**
- Query parameter: `file_url` (the public URL of the photo)
- Authentication: Bearer token required

**Response:**
```json
{
  "message": "Photo deleted successfully",
  "url": "https://storage.googleapis.com/your-bucket-name/photos/uuid-filename.jpg"
}
```

## Error Handling

The API provides detailed error messages for common issues:

- **400 Bad Request**: Invalid file type, empty file, or missing file
- **401 Unauthorized**: Missing or invalid authentication token
- **413 Request Entity Too Large**: File exceeds 10MB limit
- **500 Internal Server Error**: GCS upload/configuration issues

## File Organization

Uploaded files are stored in the `photos/` directory within your GCS bucket with UUID-based filenames to prevent conflicts.

## Security Features

- Authentication required for all operations
- File type validation (images only)
- File size limits
- Unique filename generation
- Proper error handling and logging

## Troubleshooting

### Common Issues:

1. **"Service account file not found"**
   - Ensure `gcs-key.json` exists in the project root
   - Check the `GCS_CREDENTIALS_PATH` environment variable

2. **"Bucket does not exist or is not accessible"**
   - Verify the bucket name in `GCS_BUCKET_NAME`
   - Check service account permissions

3. **"Upload failed"**
   - Verify internet connectivity
   - Check GCS service status
   - Ensure service account has proper IAM roles

4. **"Invalid file type"**
   - Only JPEG, PNG, GIF, and WebP files are supported
   - Check the file's MIME type

## Files Created

- `app/gcs_uploader.py` - Google Cloud Storage helper functions
- `app/routes/photo_upload.py` - FastAPI routes for photo operations
- `gcs-key.json.example` - Template for service account key file
- Updated `requirements.txt` - Added google-cloud-storage dependency
- Updated `app/main.py` - Registered photo upload routes 