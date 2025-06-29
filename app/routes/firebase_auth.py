from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from .. import schemas, crud, firebase_auth
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["firebase-auth"])

@router.post("/firebase-login")
async def firebase_login(
    user_data: schemas.FirebaseUserLogin,
    db: Session = Depends(get_db)
):
    """
    Login or create user with Firebase data
    This endpoint is called by the frontend after successful Firebase authentication
    """
    try:
        # Check if user exists
        user = crud.get_user_by_firebase_uid(db, user_data.uid)
        
        if not user:
            # Create new user
            user = crud.create_firebase_user(
                db=db,
                firebase_uid=user_data.uid,
                email=user_data.email,
                display_name=user_data.displayName,
                photo_url=user_data.photoURL,
                email_verified=True  # Firebase email is already verified
            )
        else:
            # Update existing user info if needed
            if (user_data.displayName and user.display_name != user_data.displayName) or \
               (user_data.photoURL and user.photo_url != user_data.photoURL):
                user = crud.update_firebase_user(
                    db=db,
                    user=user,
                    display_name=user_data.displayName,
                    photo_url=user_data.photoURL,
                    email_verified=True
                )
        
        return {
            "success": True,
            "message": "User authenticated successfully",
            "user": {
                "id": user.id,
                "firebase_uid": user.firebase_uid,
                "email": user.email,
                "display_name": user.display_name,
                "photo_url": user.photo_url,
                "is_premium": user.is_premium
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to authenticate user: {str(e)}"
        )

@router.get("/me")
async def get_current_user_info(
    current_user = Depends(firebase_auth.get_current_user_firebase)
):
    """
    Get current user information (Firebase version)
    """
    return {
        "id": current_user.id,
        "firebase_uid": current_user.firebase_uid,
        "email": current_user.email,
        "display_name": current_user.display_name,
        "photo_url": current_user.photo_url,
        "email_verified": current_user.email_verified,
        "is_premium": current_user.is_premium,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at
    }

@router.get("/verify-token")
async def verify_token(
    token_data: Dict[str, Any] = Depends(firebase_auth.verify_firebase_token)
):
    """
    Verify Firebase token (useful for debugging)
    """
    return {
        "valid": True,
        "uid": token_data.get("uid"),
        "email": token_data.get("email"),
        "name": token_data.get("name"),
        "picture": token_data.get("picture"),
        "email_verified": token_data.get("email_verified", False)
    } 