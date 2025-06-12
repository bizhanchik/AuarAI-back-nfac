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
    username = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String)
    is_premium = Column(Boolean, default=False)



class ClothingItem(Base):
    __tablename__ = "clothing_items"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    name        = Column(String, nullable=False)
    brand       = Column(String, nullable=True)
    category    = Column(String, nullable=False)
    gender      = Column(String, nullable=False)
    color       = Column(String, nullable=True)
    size        = Column(String, nullable=True)
    material    = Column(String, nullable=True)
    description = Column(String, nullable=True)

    image_url   = Column(String, nullable=False)
    store_name  = Column(String, nullable=False)
    store_url   = Column(String, nullable=True)
    product_url = Column(String, nullable=False)
    price       = Column(Float,  nullable=False)

    tags                   = Column(JSON, default=list)  # ["casual", "summer"]
    occasions              = Column(JSON, default=list)  # ["party", "work"]
    weather_suitability    = Column(JSON, default=list)  # ["rainy", "cold"]
    ai_generated_embedding = Column(JSON, default=list)  # [0.12, 0.53, ...]

    available  = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
