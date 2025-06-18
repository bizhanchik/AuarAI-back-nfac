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

    available  = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
