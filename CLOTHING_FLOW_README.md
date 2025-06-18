# Clothing Addition Flow

This document explains how the clothing addition feature works in the AuarAi wardrobe application.

## Current Flow

### 1. User Clicks "Add Clothing" Button
- Opens the `AddClothingModal` component
- User sees the photo upload interface

### 2. Photo Upload Process
When user selects a photo and clicks either "Классифицировать" or "Пропустить":

#### Option A: With AI Classification
1. **Photo Upload**: The selected file is uploaded to Google Cloud Storage via `/upload-photo` endpoint
2. **URL Storage**: The returned GCS URL is stored in `formData.image_url`
3. **AI Classification**: The image is sent for AI classification via `/ai/classify-image`
4. **Form Pre-fill**: Classification results auto-fill the form fields
5. **Manual Edit**: User can review and edit the auto-filled data

#### Option B: Skip Classification
1. **Photo Upload**: The selected file is uploaded to Google Cloud Storage via `/upload-photo`
2. **URL Storage**: The returned GCS URL is stored in `formData.image_url`
3. **Manual Entry**: User fills all data manually

### 3. Clothing Item Creation
- User submits the form via the `/clothing/` endpoint
- The clothing item is created in the database with the GCS image URL
- Item appears in the dashboard immediately

### 4. Dashboard Display
- The `ClothingGrid` component fetches all user items via `/items/` endpoint
- Each item displays using the stored `image_url` from the database
- Images are served directly from Google Cloud Storage

## Key Components

### Frontend Components
- `AddClothingModal.jsx` - Handles the entire add clothing flow
- `ClothingGrid.jsx` - Displays clothing items with images
- `Dashboard.jsx` - Main dashboard view

### Backend Endpoints
- `POST /upload-photo` - Uploads image to GCS, returns public URL
- `POST /ai/classify-image` - AI classification of clothing items
- `GET /ai/classification-result/{taskId}` - Gets classification results
- `POST /clothing/` - Creates new clothing item in database
- `GET /items/` - Fetches user's clothing items

### Database
- `ClothingItem` model stores the GCS URL in `image_url` field
- All clothing metadata is stored alongside the image URL

## Flow Diagram

```
User clicks "Add Clothing"
    ↓
Select Photo
    ↓
Upload to GCS → Get URL
    ↓
[Optional] AI Classification
    ↓
Fill/Edit Form Data
    ↓
Submit to Database (with GCS URL)
    ↓
Display in Dashboard
```

## Error Handling

- Image upload failures show error toast
- Classification timeouts fall back to manual entry
- Invalid file types are rejected
- Large files (>10MB) are rejected
- Database errors are handled gracefully

## Future Improvements

1. Image compression before upload
2. Multiple image support per item
3. Drag-and-drop upload interface
4. Better error recovery for failed uploads
5. Image editing capabilities 