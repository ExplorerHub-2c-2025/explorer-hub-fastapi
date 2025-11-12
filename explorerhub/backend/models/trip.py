from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from bson import ObjectId
from enum import Enum


class TripVisibility(str, Enum):
    private = "private"  # Solo el propietario puede ver
    followers = "followers"  # Solo el propietario y sus seguidores pueden ver
    public = "public"  # Todos pueden ver


class TripActivity(BaseModel):
    business_id: int
    business_name: str
    scheduled_date: Optional[datetime] = None
    notes: Optional[str] = None


class TripBase(BaseModel):
    name: str
    destination: str
    start_date: datetime
    end_date: datetime
    description: Optional[str] = None
    visibility: TripVisibility = TripVisibility.private


class TripCreate(TripBase):
    pass


class TripInDB(TripBase):
    id: Optional[int] = Field(alias="id", default=None)
    user_id: int
    activities: List[TripActivity] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class Trip(TripBase):
    id: int
    user_id: str
    activities: List[TripActivity]
    created_at: datetime
    
    
class TripComment(BaseModel):
    user_id: int
    user_name: str
    comment: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TripWithUser(Trip):
    user_name: str
    user_profile_picture: Optional[str] = None
    comments: List[TripComment] = []
    likes_count: int = 0
