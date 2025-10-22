from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from bson import ObjectId


class TripActivity(BaseModel):
    business_id: str
    business_name: str
    scheduled_date: Optional[date] = None
    notes: Optional[str] = None


class TripBase(BaseModel):
    name: str
    destination: str
    start_date: date
    end_date: date
    description: Optional[str] = None


class TripCreate(TripBase):
    pass


class TripInDB(TripBase):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    activities: List[TripActivity] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class Trip(TripBase):
    id: str
    user_id: str
    activities: List[TripActivity]
    created_at: datetime
