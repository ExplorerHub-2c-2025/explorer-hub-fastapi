from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from database import get_database
from models.user import UserCreate, User, Token, UserLogin
from models.counter import get_next_sequence_value
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_active_user,
)
from config import settings
from utils import serialize_doc

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
    
    # Validate role
    if user.role not in ["client", "business"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be either 'client' or 'business'"
        )
    
    # Create new user
    user_dict = user.model_dump()
    user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
    
    # Get next sequential ID
    next_id = await get_next_sequence_value("users", db)
    user_dict["id"] = next_id
    
    await db.users.insert_one(user_dict)
    created_user = await db.users.find_one({"id": next_id})
    
    # Remove _id field
    created_user = serialize_doc(created_user)
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": created_user["email"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "user": {
            "id": created_user["id"],
            "email": created_user["email"],
            "full_name": created_user["full_name"],
            "role": created_user.get("role", "client")
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
    
    # Ensure user has id field
    user = serialize_doc(user)
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user.get("role", "client")
        }
    }


@router.get("/me")
async def get_me(current_user = Depends(get_current_active_user)):
    """Get current user information"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role
    }
