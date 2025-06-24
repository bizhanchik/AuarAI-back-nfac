from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional
from datetime import datetime


class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class ClothingItemBase(BaseModel):
    name:        str
    brand:       Optional[str] = None
    category:    Optional[str] = None
    gender:      Optional[str] = None  # <--- добавили и сделали опциональным
    color:       Optional[str] = None
    size:        Optional[str] = None
    material:    Optional[str] = None
    description: Optional[str] = None

    image_url:   Optional[str] = None
    store_name:  str = "User Upload"
    store_url:   Optional[str] = None
    product_url: Optional[str] = None
    price:       Optional[float] = 0.0

    tags:                Optional[List[str]] = Field(default_factory=list)
    occasions:           Optional[List[str]] = Field(default_factory=list)
    weather_suitability: Optional[List[str]] = Field(default_factory=list)
    ai_generated_embedding: Optional[List[float]] = Field(default_factory=list)

class ClothingItemCreate(ClothingItemBase):
    pass

class ClothingItem(ClothingItemBase):
    id:         int
    owner_id:   int
    available:  Optional[bool] = True
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# === Firebase User Schemas ===
class FirebaseUserLogin(BaseModel):
    uid: str
    email: str
    displayName: Optional[str] = None
    photoURL: Optional[str] = None

class FirebaseUserResponse(BaseModel):
    id: int
    firebase_uid: str
    email: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    email_verified: bool
    is_premium: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True