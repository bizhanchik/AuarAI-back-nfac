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
    name:     str
    brand:    Optional[str]
    category: str
    gender:   str
    color:    Optional[str]
    size:     Optional[str]
    material: Optional[str]
    description: Optional[str]

    image_url:   HttpUrl
    store_name:  str
    store_url:   Optional[HttpUrl]
    product_url: HttpUrl
    price:       float

    tags:                Optional[List[str]] = Field(default_factory=list)
    occasions:           Optional[List[str]] = Field(default_factory=list)
    weather_suitability: Optional[List[str]] = Field(default_factory=list)
    ai_generated_embedding: Optional[List[float]] = Field(default_factory=list)

class ClothingItemCreate(ClothingItemBase):
    pass

class ClothingItem(ClothingItemBase):
    id:         int
    owner_id:   int
    available:  bool
    updated_at: datetime

    class Config:
        orm_mode = True