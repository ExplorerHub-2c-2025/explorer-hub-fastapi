from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class NotificationType(str, Enum):
    # User notifications
    address_change = "address_change"
    price_change = "price_change"
    new_promotion = "new_promotion"
    booking_pending = "booking_pending"
    booking_confirmed = "booking_confirmed"
    booking_cancelled = "booking_cancelled"
    new_follower = "new_follower"
    trip_invite = "trip_invite"
    
    # Business notifications
    new_review = "new_review"
    review_response = "review_response"
    new_booking = "new_booking"
    promo_expired = "promo_expired"


class NotificationCreate(BaseModel):
    user_id: int
    type: NotificationType
    title: str
    description: str
    link: Optional[str] = None
    context_id: Optional[int] = None  # ID del booking, review, business, etc.
    unread_count: Optional[int] = None  # Para notificaciones agrupadas


class Notification(NotificationCreate):
    id: int
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class NotificationUpdate(BaseModel):
    read: Optional[bool] = None


class NotificationStats(BaseModel):
    total: int
    unread: int
