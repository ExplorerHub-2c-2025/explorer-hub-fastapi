from pydantic import BaseModel, Field
from datetime import date, time, datetime
from typing import Optional
from enum import Enum


class BookingStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"


class BookingCreate(BaseModel):
    name: str
    amount: int
    date: date
    time: time
    promotion_code: Optional[str] = None


class Booking(BookingCreate):
    id: int
    business_id: int
    user_id: str
    # store created_at as a full datetime (Mongo stores datetimes)
    created_at: datetime
    discount_applied: float = 0.0
    original_price: Optional[float] = None
    final_price: Optional[float] = None
    status: BookingStatus = BookingStatus.pending


class BookingWithBusiness(Booking):
    business_name: str
    business_category: str
    business_image: Optional[str] = None


class BookingWithUser(Booking):
    user_name: str
    user_email: str