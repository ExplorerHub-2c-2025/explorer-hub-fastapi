from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId


class Reply(BaseModel):
    id: int
    user_id: str
    user_name: str
    text: str
    created_at: datetime
    replies: List['Reply'] = []


# Update forward references for recursive model
Reply.model_rebuild()


class ReviewBase(BaseModel):
    business_id: int
    rating: int = Field(ge=1, le=5)
    title: str
    text: str
    images: List[str] = []


class ReviewCreate(ReviewBase):
    pass


class ReplyCreate(BaseModel):
    text: str


class ReviewInDB(ReviewBase):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    user_name: str
    helpful_count: int = 0
    replies: List[Reply] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class Review(ReviewBase):
    id: int
    user_id: str
    user_name: str
    helpful_count: int
    replies: List[Reply] = []
    created_at: datetime
