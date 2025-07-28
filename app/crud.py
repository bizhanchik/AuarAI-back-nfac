from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from . import models, auth, schemas
from typing import Optional

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, username: str, password: str):
    hashed_password = auth.get_password_hash(password)
    user = models.User(username=username, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_user_by_firebase_uid(db: Session, firebase_uid: str) -> Optional[models.User]:
    """Get user by Firebase UID"""
    return db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """Get user by email"""
    return db.query(models.User).filter(models.User.email == email).first()

def create_firebase_user(
    db: Session, 
    firebase_uid: str, 
    email: str, 
    display_name: Optional[str] = None,
    photo_url: Optional[str] = None,
    email_verified: bool = False
) -> models.User:
    """Create a new Firebase user"""
    user = models.User(
        firebase_uid=firebase_uid,
        email=email,
        display_name=display_name,
        photo_url=photo_url,
        email_verified=email_verified,
        is_premium=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_firebase_user(
    db: Session,
    user: models.User,
    display_name: Optional[str] = None,
    photo_url: Optional[str] = None,
    email_verified: Optional[bool] = None
) -> models.User:
    """Update Firebase user information"""
    if display_name is not None:
        user.display_name = display_name
    if photo_url is not None:
        user.photo_url = photo_url
    if email_verified is not None:
        user.email_verified = email_verified
    
    db.commit()
    db.refresh(user)
    return user

def create_clothing_item(
    db: Session,
    item_in: schemas.ClothingItemCreate,
    owner_id: int
) -> models.ClothingItem:
    data = item_in.dict()
    data["image_url"]   = str(data["image_url"]) if data.get("image_url") else None
    data["store_url"]   = str(data["store_url"]) if data.get("store_url") else None
    data["product_url"] = str(data["product_url"]) if data.get("product_url") else None
    
    db_item = models.ClothingItem(**data, owner_id=owner_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_clothing_items_by_owner(
    db: Session,
    owner_id: int,
    skip: int = 0,
    limit: int = 100
) -> list[models.ClothingItem]:
    return (
        db.query(models.ClothingItem)
          .filter(models.ClothingItem.owner_id == owner_id)
          .offset(skip)
          .limit(limit)
          .all()
    )

def get_clothing_item_by_id(
    db: Session,
    item_id: int,
    owner_id: int
) -> models.ClothingItem:
    return db.query(models.ClothingItem).filter(
        models.ClothingItem.id == item_id,
        models.ClothingItem.owner_id == owner_id
    ).first()

def update_clothing_item(
    db: Session,
    item_id: int,
    item_in: schemas.ClothingItemCreate
) -> models.ClothingItem:
    data = item_in.dict()
    # Convert HttpUrl to str if needed
    if data.get("image_url"):
        data["image_url"] = str(data["image_url"])
    if data.get("store_url"):
        data["store_url"] = str(data["store_url"])
    if data.get("product_url"):
        data["product_url"] = str(data["product_url"])
    
    db.query(models.ClothingItem).filter(models.ClothingItem.id == item_id).update(data)
    db.commit()
    return db.query(models.ClothingItem).filter(models.ClothingItem.id == item_id).first()

def delete_clothing_item(
    db: Session,
    item_id: int
):
    db.query(models.ClothingItem).filter(models.ClothingItem.id == item_id).delete()
    db.commit()

def delete_user(db: Session, user_id: int):
    """Delete user and all associated data"""
    # First delete all clothing items owned by the user
    db.query(models.ClothingItem).filter(models.ClothingItem.owner_id == user_id).delete()
    
    # Then delete the user
    db.query(models.User).filter(models.User.id == user_id).delete()
    
    db.commit()
