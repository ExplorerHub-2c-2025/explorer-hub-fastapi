from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from database import get_database
from models.user import UserCreate, User, Token, UserLogin
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_active_user,
)
from config import settings

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/signup", response_model=dict, status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate, db = Depends(get_database)):
    """Register a new user"""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user_dict = user.model_dump()
    user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
    
    result = await db.users.insert_one(user_dict)
    created_user = await db.users.find_one({"_id": result.inserted_id})
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": created_user["email"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(created_user["_id"]),
            "email": created_user["email"],
            "full_name": created_user["full_name"],
            "is_business": created_user.get("is_business", False),
            "created_at": created_user["created_at"].isoformat() if "created_at" in created_user else None
        }
    }


@router.post("/login")
async def login(user_credentials: UserLogin, db = Depends(get_database)):
    """Login user and return access token"""
    user = await db.users.find_one({"email": user_credentials.email})
    
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user["full_name"],
            "is_business": user.get("is_business", False),
            "created_at": user["created_at"].isoformat() if "created_at" in user else None
        }
    }


@router.get("/me", response_model=User)
async def get_me(current_user = Depends(get_current_active_user)):
    """Get current user information"""
    return User(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        is_business=current_user.is_business,
        created_at=current_user.created_at
    )
