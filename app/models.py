from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
)
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    # Firebase fields
    firebase_uid = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    email_verified = Column(Boolean, default=False)
    
    # Legacy fields (keep for backward compatibility during migration)
    username = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    
    # App-specific fields
    is_premium = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)



class ClothingItem(Base):
    __tablename__ = "clothing_items"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    name        = Column(String, nullable=False)
    brand       = Column(String, nullable=True)
    category    = Column(String, nullable=True)
    gender      = Column(String, nullable=True)      # ← добавили это поле
    color       = Column(String, nullable=True)
    size        = Column(String, nullable=True)
    material    = Column(String, nullable=True)
    description = Column(String, nullable=True)

    image_url   = Column(String, nullable=True)
    store_name  = Column(String, nullable=False, default="User Upload")
    store_url   = Column(String, nullable=True)
    product_url = Column(String, nullable=True)
    price       = Column(Float,  nullable=True, default=0.0)

    tags                   = Column(JSON, default=list)
    occasions              = Column(JSON, default=list)
    weather_suitability    = Column(JSON, default=list)
    ai_generated_embedding = Column(JSON, default=list)

    available  = Column(Boolean, default=True, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)


class BodyAnalysis(Base):
    __tablename__ = "body_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Photo information
    photo_url = Column(String, nullable=False)
    compressed_photo_url = Column(String, nullable=True)
    
    # Analysis results
    body_type = Column(String, nullable=True)
    recommended_colors = Column(JSON, default=list)
    style_recommendations = Column(JSON, default=list)
    
    # Body proportions
    leg_to_body_ratio = Column(Float, nullable=True)
    shoulder_to_hip_ratio = Column(Float, nullable=True)
    waist_to_hip_ratio = Column(Float, nullable=True)
    
    # Additional analysis data
    confidence = Column(Float, nullable=True)
    fashion_tips = Column(JSON, default=list)
    best_silhouettes = Column(JSON, default=list)
    avoid_patterns = Column(JSON, default=list)
    accessory_tips = Column(JSON, default=list)
    
    # Metadata
    analysis_version = Column(String, default="1.0")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
