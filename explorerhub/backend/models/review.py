from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId


class ReviewBase(BaseModel):
    business_id: str
    rating: int = Field(ge=1, le=5)
    title: str
    text: str
    images: List[str] = []


class ReviewCreate(ReviewBase):
    pass


class ReviewInDB(ReviewBase):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    user_name: str
    helpful_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class Review(ReviewBase):
    id: str
    user_id: str
    user_name: str
    helpful_count: int
    created_at: datetime
