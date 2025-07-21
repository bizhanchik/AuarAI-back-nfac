import os
import json
from typing import Optional
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv
import logging

from . import models, crud
from .database import get_db

# Set up logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Firebase Admin SDK
def initialize_firebase():
    if not firebase_admin._apps:
        try:
            # Try to use service account key file
            service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "firebase-service-account.json")
            if os.path.exists(service_account_path):
                cred = credentials.Certificate(service_account_path)
                print(f"Using Firebase service account from file: {service_account_path}")
            else:
                # Try to use environment variable with JSON content
                service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
                if service_account_json:
                    service_account_info = json.loads(service_account_json)
                    cred = credentials.Certificate(service_account_info)
                    print("Using Firebase service account from environment variable")
                else:
                    # Use default credentials (for Google Cloud environments)
                    print("Warning: No Firebase service account found, using default credentials")
                    print("This may cause authentication issues")
                    cred = credentials.ApplicationDefault()
            
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully")
        except Exception as e:
            print(f"ERROR: Firebase Admin SDK initialization failed: {e}")
            print("Firebase authentication will not work properly")
            print("Please set up Firebase service account key:")
            print("1. Go to Firebase Console -> Project Settings -> Service Accounts")
            print("2. Generate a new private key")
            print("3. Save it as 'firebase-service-account.json' in your Backend directory")
            return False
    return True

# Initialize Firebase on module import
initialize_firebase()

# HTTP Bearer token security
security = HTTPBearer(auto_error=False)  # Don't auto-error, we'll handle it manually

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Verify Firebase ID token and return decoded token
    """
    if not credentials:
        logger.warning("No authorization credentials provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    logger.info(f"Attempting to verify Firebase token: {credentials.credentials[:20]}...")
    
    try:
        # Verify the Firebase ID token
        decoded_token = auth.verify_id_token(credentials.credentials)
        logger.info(f"Firebase token verified successfully for user: {decoded_token.get('email')}")
        return decoded_token
    except auth.InvalidIdTokenError as e:
        logger.error(f"Invalid Firebase ID token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase ID token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.ExpiredIdTokenError as e:
        logger.error(f"Expired Firebase ID token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Expired Firebase ID token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user_firebase(
    token_data: dict = Depends(verify_firebase_token),
    db: Session = Depends(get_db)
) -> models.User:
    """
    Get current user from Firebase token
    """
    firebase_uid = token_data.get("uid")
    logger.info(f"Getting user for Firebase UID: {firebase_uid}")
    
    if not firebase_uid:
        logger.error("Firebase token missing UID")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing uid"
        )
    
    # Try to find user by Firebase UID
    user = crud.get_user_by_firebase_uid(db, firebase_uid)
    
    if not user:
        logger.info(f"User not found, creating new user for UID: {firebase_uid}")
        # If user doesn't exist, create a new user
        email = token_data.get("email")
        display_name = token_data.get("name")
        photo_url = token_data.get("picture")
        email_verified = token_data.get("email_verified", False)
        
        if not email:
            logger.error("Firebase token missing email")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is required for user creation"
            )
        
        try:
            user = crud.create_firebase_user(
                db=db,
                firebase_uid=firebase_uid,
                email=email,
                display_name=display_name,
                photo_url=photo_url,
                email_verified=email_verified
            )
            logger.info(f"Created new user: {user.email}")
        except IntegrityError:
            # If there's an email conflict, find and delete the conflicting user
            db.rollback()
            logger.info(f"IntegrityError occurred, checking for existing user with email: {email}")
            existing_user_by_email = crud.get_user_by_email(db, email)
            if existing_user_by_email:
                logger.info(f"Deleting existing user with email: {email}")
                crud.delete_user(db, existing_user_by_email.id)
            
            # Try creating the user again
            user = crud.create_firebase_user(
                db=db,
                firebase_uid=firebase_uid,
                email=email,
                display_name=display_name,
                photo_url=photo_url,
                email_verified=email_verified
            )
            logger.info(f"Created new user after cleanup: {user.email}")
    else:
        logger.info(f"Found existing user: {user.email}")
    
    if user:
        db.refresh(user)
    
    return user

# WebSocket version for Firebase authentication
async def get_current_user_websocket_firebase(token: str, db: Session) -> Optional[models.User]:
    """
    WebSocket version of Firebase authentication
    """
    try:
        decoded_token = auth.verify_id_token(token)
        firebase_uid = decoded_token.get("uid")
        
        if not firebase_uid:
            return None
        
        user = crud.get_user_by_firebase_uid(db, firebase_uid)
        if user:
            db.refresh(user)
        return user
    except Exception:
        return None