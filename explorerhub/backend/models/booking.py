from pydantic import BaseModel, Field
from datetime import date, time
from typing import Optional

class BookingCreate(BaseModel):
    name: str
    amount: int
    date: date
    time: time

class Booking(BookingCreate):
    id: int
    business_id: int
    user_id: str
    created_at: date 