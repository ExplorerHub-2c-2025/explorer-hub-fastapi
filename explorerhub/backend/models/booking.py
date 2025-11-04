from pydantic import BaseModel, Field
from datetime import date, time, datetime
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
    # store created_at as a full datetime (Mongo stores datetimes)
    created_at: datetime