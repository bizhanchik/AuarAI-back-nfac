from sqlalchemy.orm import Session
from . import models, auth, schemas

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, username: str, password: str):
    hashed = auth.get_password_hash(password)
    user = models.User(username = username, hashed_password = hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def create_clothing_item(
    db: Session,
    item_in: schemas.ClothingItemCreate,
    owner_id: int
) -> models.ClothingItem:
    data = item_in.dict()
    # Приведение HttpUrl -> str (можно сделать и через кастомный encoder)
    data["image_url"]   = str(data["image_url"])
    data["store_url"]   = str(data["store_url"]) if data["store_url"] else None
    data["product_url"] = str(data["product_url"])
    
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
