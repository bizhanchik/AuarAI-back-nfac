# Photo Upload Feature

This application now supports uploading photos to Google Cloud Storage through a FastAPI endpoint.

## Features

- Secure photo upload with user authentication
- Multiple image format support (JPEG, PNG, GIF, WebP)
- File size validation (max 10MB)
- Automatic file type validation
- UUID-based file naming to prevent conflicts
- Public URL generation for uploaded images
- Secure deletion of uploaded photos

## Setup

### 1. Install Dependencies

The required dependencies are already included in `requirements.txt`:
```bash
pip install -r requirements.txt
```

### 2. Google Cloud Storage Setup

1. Create a Google Cloud Storage bucket
2. Create a service account with Storage Admin permissions
3. Download the service account key as JSON file
4. Set up environment variables (see Configuration section)

## Configuration

### Environment Variables

Set up the following environment variables in your `.env` file or system environment:

```bash
# Google Cloud Storage Configuration
# Primary method: Use the standard Google Cloud environment variable
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json

# Alternative method: Use custom environment variable (fallback)
GCS_CREDENTIALS_PATH=gcs-key.json

# GCS Bucket Configuration
GCS_BUCKET_NAME=your-actual-bucket-name
```

### Authentication Methods

The application supports two authentication methods (in order of priority):

1. **Standard Google Cloud Authentication** (Recommended):
   - Set `GOOGLE_APPLICATION_CREDENTIALS` to the full path of your service account JSON file
   - This is the standard Google Cloud SDK environment variable

2. **Custom Path Authentication** (Fallback):
   - Set `GCS_CREDENTIALS_PATH` to the path of your service account JSON file
   - Defaults to `gcs-key.json` in the project root

### Service Account Permissions

Your service account needs the following IAM permissions:
- `storage.objects.create` - To upload files
- `storage.objects.delete` - To delete files
- `storage.objects.get` - To access files
- `storage.buckets.get` - To verify bucket access

Or simply assign the `Storage Admin` role for full access.

## API Endpoints

### Upload Photo

**POST** `/upload-photo`

Upload a photo to Google Cloud Storage.

**Headers:**
- `Authorization: Bearer <your-jwt-token>`
- `Content-Type: multipart/form-data`

**Request Body:**
- `file`: Image file (JPEG, PNG, GIF, or WebP, max 10MB)

**Response:**
```json
{
  "url": "https://storage.googleapis.com/your-bucket/photos/uuid.jpg",
  "message": "Photo uploaded successfully",
  "filename": "original-filename.jpg"
}
```

### Delete Photo

**DELETE** `/photo?file_url=<url>`

Delete a photo from Google Cloud Storage.

**Headers:**
- `Authorization: Bearer <your-jwt-token>`

**Query Parameters:**
- `file_url`: Public URL of the file to delete

**Response:**
```json
{
  "message": "Photo deleted successfully",
  "url": "https://storage.googleapis.com/your-bucket/photos/uuid.jpg"
}
```

## Error Handling

### Common Errors

- **401 Unauthorized**: Invalid or missing JWT token
- **400 Bad Request**: Invalid file type, empty file, or missing file
- **413 Request Entity Too Large**: File size exceeds 10MB limit
- **404 Not Found**: File not found during deletion
- **500 Internal Server Error**: GCS upload/configuration issues

## File Storage

Uploaded files are stored in the `photos/` directory within your GCS bucket with UUID-based filenames to prevent conflicts.

## URL Generation

The application automatically generates public URLs for uploaded files:

1. **Public URLs**: If your bucket allows public access, files get public URLs
2. **Signed URLs**: If your bucket is private, long-lived signed URLs are generated (1 year expiration)

## Troubleshooting

### Authentication Issues

- Ensure your service account JSON file exists and is readable
- Check the `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- Verify the service account has the necessary permissions
- Confirm the bucket name is correct
- Ensure the service account key hasn't expired

### Upload Issues

- Check GCS service status
- Verify bucket permissions and existence
- Ensure sufficient storage quota
- Check network connectivity to Google Cloud Storage

## Files Structure

- `app/gcs_uploader.py` - Google Cloud Storage helper functions
- `app/routes/photo_upload.py` - FastAPI photo upload endpoints
- `gcs-key.json.example` - Template for service account key file
- Updated `requirements.txt` - Added google-cloud-storage dependency

## Security Considerations

- Service account keys should be kept secure and not committed to version control
- Use environment variables for configuration
- Implement proper bucket access controls
- Consider using short-lived signed URLs for sensitive content
- Regularly rotate service account keys 