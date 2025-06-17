from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import models, schemas, crud, auth
from ..database import SessionLocal

router = APIRouter(prefix="/items", tags=["items"])


# Зависимость: сессия базы данных
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get(
    "/",
    response_model=List[schemas.ClothingItem]
)
def read_items(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.get_clothing_items_by_owner(db, current_user.id, skip, limit) 