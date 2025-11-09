from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class FavoriteCreate(BaseModel):
    business_id: int


class Favorite(BaseModel):
    id: int
    user_id: str
    business_id: int
    created_at: datetime


class FavoriteWithBusiness(Favorite):
    business_name: str
    business_categories: list[str]
    business_location: str
    business_rating: float
    business_review_count: int
    business_price_level: int
    business_images: list[str]
    business_description: Optional[str] = None
    business_tags: list[str] = []
