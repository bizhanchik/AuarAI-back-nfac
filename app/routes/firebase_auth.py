from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
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
        # Check if user exists by Firebase UID
        user = crud.get_user_by_firebase_uid(db, user_data.uid)
        
        if not user:
            # Check if there's an old user with same email (from deleted account)
            existing_user_by_email = crud.get_user_by_email(db, user_data.email)
            if existing_user_by_email:
                # Delete the old user record completely to start fresh
                crud.delete_user(db, existing_user_by_email.id)
            
            # Create new user with error handling for email conflicts
            try:
                user = crud.create_firebase_user(
                    db=db,
                    firebase_uid=user_data.uid,
                    email=user_data.email,
                    display_name=user_data.displayName,
                    photo_url=user_data.photoURL,
                    email_verified=True  # Firebase email is already verified
                )
            except IntegrityError:
                # If there's still an email conflict, find and delete the conflicting user
                db.rollback()
                existing_user_by_email = crud.get_user_by_email(db, user_data.email)
                if existing_user_by_email:
                    crud.delete_user(db, existing_user_by_email.id)
                
                # Try creating the user again
                user = crud.create_firebase_user(
                    db=db,
                    firebase_uid=user_data.uid,
                    email=user_data.email,
                    display_name=user_data.displayName,
                    photo_url=user_data.photoURL,
                    email_verified=True
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
    Get current user information
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

@router.put("/profile")
async def update_user_profile(
    profile_data: schemas.FirebaseUserUpdate,
    current_user = Depends(firebase_auth.get_current_user_firebase),
    db: Session = Depends(get_db)
):
    """
    Update user profile information
    """
    try:
        # Поддерживаем как display_name, так и name для совместимости с фронтендом
        display_name = profile_data.display_name or profile_data.name
        
        print(f"🔄 Updating profile for user {current_user.id}")
        print(f"📝 Current display_name: '{current_user.display_name}'")
        print(f"📝 New display_name: '{display_name}'")
        print(f"📝 Photo URL: '{profile_data.photo_url}'")
        
        # Update user profile
        updated_user = crud.update_firebase_user(
            db=db,
            user=current_user,
            display_name=display_name,
            photo_url=profile_data.photo_url
        )
        
        print(f"✅ Profile updated successfully")
        print(f"📝 Updated display_name: '{updated_user.display_name}'")
        print(f"📝 Updated at: {updated_user.updated_at}")
        
        return {
            "success": True,
            "message": "Profile updated successfully",
            "user": {
                "id": updated_user.id,
                "firebase_uid": updated_user.firebase_uid,
                "email": updated_user.email,
                "display_name": updated_user.display_name,
                "photo_url": updated_user.photo_url,
                "email_verified": updated_user.email_verified,
                "is_premium": updated_user.is_premium,
                "created_at": updated_user.created_at,
                "updated_at": updated_user.updated_at
            }
        }
    except Exception as e:
        print(f"❌ Failed to update profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )

@router.delete("/delete-account")
async def delete_account(
    current_user = Depends(firebase_auth.get_current_user_firebase),
    db: Session = Depends(get_db)
):
    """
    Delete user account and all associated data
    """
    try:
        # Delete user from database
        crud.delete_user(db, current_user.id)
        
        return {
            "success": True,
            "message": "Account deleted successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}"
        )