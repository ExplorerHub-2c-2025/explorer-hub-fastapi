from pydantic import BaseModel, Field
from datetime import date, time, datetime
from typing import Optional, List
from enum import Enum


class BookingStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"


class TicketSelection(BaseModel):
    """Selección de entradas por tipo"""
    adult_count: int = Field(default=0, ge=0)
    senior_count: int = Field(default=0, ge=0)
    child_count: int = Field(default=0, ge=0)


class BookingCreate(BaseModel):
    name: str
    amount: int  # Total de personas (para compatibilidad)
    date: date
    time: time
    promotion_code: Optional[str] = None
    ticket_selection: Optional[TicketSelection] = None  # Nueva selección detallada


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
    ticket_selection: Optional[TicketSelection] = None
    applied_promotion_id: Optional[int] = None  # ID de la promoción aplicada


class BookingWithBusiness(Booking):
    business_name: str
    business_categories: List[str] = []  # Cambiado de business_category a business_categories
    business_image: Optional[str] = None


class BookingWithUser(Booking):
    user_name: str
    user_email: str