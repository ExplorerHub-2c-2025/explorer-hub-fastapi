from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId


class Location(BaseModel):
    address: str
    city: str
    state: str
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class BusinessBase(BaseModel):
    name: str
    description: str
    category: str
    location: Location
    phone: Optional[str] = None
    website: Optional[str] = None
    price_level: int = Field(ge=1, le=4)
    images: List[str] = []
    tags: List[str] = []


class BusinessCreate(BusinessBase):
    pass


class BusinessInDB(BusinessBase):
    id: Optional[str] = Field(alias="_id", default=None)
    owner_id: str
    rating: float = 0.0
    review_count: int = 0
    views: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class Business(BusinessBase):
    id: int
    owner_id: str
    rating: float
    views: int
    review_count: int
    created_at: datetime
    is_active: bool
