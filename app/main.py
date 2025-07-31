from typing import List
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import models, schemas, crud, auth, firebase_auth
from .database import get_db
from .routes import classifier, weather, photo_upload, items, stylist, v2v_assistant, firebase_auth as firebase_auth_routes, ip_location, body_analysis

app = FastAPI(root_path="/api")

origins = [
    "http://localhost:5173",
    "http://localhost:5175", 
    "http://192.168.1.46:5173",
    "https://auarai.com",
    "https://www.auarai.com",
    "http://auarai.com",
    "http://www.auarai.com"
]

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Use the origins list
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],    
)

# Include all routers
app.include_router(classifier.router)
app.include_router(items.router)
app.include_router(weather.router, prefix="/weather", tags=["weather"])
app.include_router(photo_upload.router)
app.include_router(stylist.router)
app.include_router(v2v_assistant.router)
app.include_router(firebase_auth_routes.router)  # Add Firebase auth routes
app.include_router(ip_location.router)  # Add IP location routes
app.include_router(body_analysis.router)  # Add body analysis routes (prefix already defined in router)

# Роутер для операций с одеждой (updated to use Firebase auth)
clothing_router = APIRouter(
    prefix="/clothing",
    tags=["clothing"]
)

@clothing_router.post(
    "/",
    response_model=schemas.ClothingItem,
    status_code=status.HTTP_201_CREATED
)
def create_item(
    item: schemas.ClothingItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(firebase_auth.get_current_user_firebase)
):
    return crud.create_clothing_item(db, item, current_user.id)

@clothing_router.put(
    "/{item_id}",
    response_model=schemas.ClothingItem
)
def update_item(
    item_id: int,
    item: schemas.ClothingItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(firebase_auth.get_current_user_firebase)
):
    db_item = crud.get_clothing_item_by_id(db, item_id, current_user.id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    return crud.update_clothing_item(db, item_id, item)

@clothing_router.delete("/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(firebase_auth.get_current_user_firebase)
):
    db_item = crud.get_clothing_item_by_id(db, item_id, current_user.id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    crud.delete_clothing_item(db, item_id)
    return {"message": "Item deleted successfully"}

@clothing_router.post("/bulk-delete")
def bulk_delete_items(
    item_ids: List[int],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(firebase_auth.get_current_user_firebase)
):
    """Delete multiple clothing items at once"""
    if not item_ids:
        raise HTTPException(status_code=400, detail="No item IDs provided")
    
    if len(item_ids) > 50:  # Reasonable limit
        raise HTTPException(status_code=400, detail="Cannot delete more than 50 items at once")
    
    deleted_count = 0
    not_found_ids = []
    
    for item_id in item_ids:
        db_item = crud.get_clothing_item_by_id(db, item_id, current_user.id)
        if db_item:
            crud.delete_clothing_item(db, item_id)
            deleted_count += 1
        else:
            not_found_ids.append(item_id)
    
    result = {
        "message": f"Successfully deleted {deleted_count} items",
        "deleted_count": deleted_count,
        "total_requested": len(item_ids)
    }
    
    if not_found_ids:
        result["not_found_ids"] = not_found_ids
        result["message"] += f". {len(not_found_ids)} items were not found or don't belong to you."
    
    return result

# === Legacy Authentication Routes (keep for backward compatibility) ===
legacy_auth_router = APIRouter(tags=["legacy-auth"])

@legacy_auth_router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    if crud.get_user_by_username(db, user.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )

    crud.create_user(db, user.username, user.password)
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@legacy_auth_router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_username(db, form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# === Main Application Routes ===
@app.get("/")
def root():
    return {"message": "API is up and running"}

# Include routers
app.include_router(legacy_auth_router, prefix="")       # Legacy /register, /login
app.include_router(clothing_router, prefix="")          # /clothing

# Updated /me endpoint to use Firebase auth
@app.get("/me")
def get_me(current_user: models.User = Depends(firebase_auth.get_current_user_firebase)):
    return {
        "id": current_user.id,
        "firebase_uid": current_user.firebase_uid,
        "email": current_user.email,
        "display_name": current_user.display_name,
        "photo_url": current_user.photo_url,
        "email_verified": current_user.email_verified,
        "is_premium": current_user.is_premium,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at,
        # Legacy fields for backward compatibility
        "username": current_user.email,  # Use email as username
    }

@app.get("/debug/me")
def debug_me(current_user: models.User = Depends(firebase_auth.get_current_user_firebase)):
    return {
        "firebase_uid": current_user.firebase_uid,
        "email": current_user.email,
        "display_name": current_user.display_name,
        "is_premium_db": current_user.is_premium,
        "raw_db_row": {
            **current_user.__dict__
        }
    }

# Remove duplicate CORS middleware - already added above


from pydantic import BaseModel

class User(BaseModel):
    name: str
    age: int

