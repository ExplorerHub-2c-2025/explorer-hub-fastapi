from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FollowerCreate(BaseModel):
    """Model for creating a follower relationship"""
    follower_id: str  # User who is following
    following_id: str  # User being followed


class FollowerInDB(FollowerCreate):
    """Model for follower relationship in database"""
    created_at: datetime


class UserProfile(BaseModel):
    """Model for user profile with follower stats"""
    id: str
    username: str
    full_name: str
    profile_picture: Optional[str] = None
    followers_count: int = 0
    following_count: int = 0
    trips_count: int = 0
    is_following: bool = False  # Whether current user follows this user


class UserSearchResult(BaseModel):
    """Model for user search results"""
    id: str
    username: str
    full_name: str
    profile_picture: Optional[str] = None
    trips_count: int = 0
    is_following: bool = False
