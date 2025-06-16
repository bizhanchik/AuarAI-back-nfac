from typing import List
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from . import models, schemas, crud, auth, database
from .routes import classifier, items, weather


app = FastAPI()
app.include_router(classifier.router)
app.include_router(items.router)
app.include_router(weather.router, prefix="/weather", tags=["weather"])


# Зависимость: сессия базы данных
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Роутер для операций с одеждой
clothing_router = APIRouter(
    prefix="/clothing",
    tags=["clothing"]
)

auth_router = APIRouter(tags=["auth"])


@clothing_router.post(
    "/",
    response_model=schemas.ClothingItem,
    status_code=status.HTTP_201_CREATED
)
def create_item(
    item: schemas.ClothingItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.create_clothing_item(db, item, current_user.id)

# Роутер для регистрации и логина
auth_router = APIRouter(tags=["auth"])

@auth_router.post("/register", status_code=status.HTTP_201_CREATED)
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

@auth_router.post("/login", response_model=schemas.Token)
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

# Простая проверка работоспособности
@app.get("/")
def root():
    return {"message": "API is up and running"}

# Регистрируем роутеры
app.include_router(auth_router, prefix="")       # /register, /login
app.include_router(clothing_router, prefix="")   # /clothing

@app.get("/me")
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return {
        "username": current_user.username,
        "is_premium": current_user.is_premium,
    }

@app.get("/debug/me")
def debug_me(current_user: models.User = Depends(auth.get_current_user)):
    return {
        "username": current_user.username,
        "is_premium_db": current_user.is_premium,
        "raw_db_row": {
            # если хотите — можно вывести __dict__ целиком,
            # но осторожно не просилить приватные поля
            **current_user.__dict__
        }
    }
