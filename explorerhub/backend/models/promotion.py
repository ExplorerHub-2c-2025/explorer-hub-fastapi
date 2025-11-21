from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from bson import ObjectId


class PromotionBase(BaseModel):
    title: str
    description: Optional[str] = None  # Descripción ahora es opcional
    discount_percentage: Optional[int] = Field(None, ge=1, le=100)  # Descuento en porcentaje
    discount_amount: Optional[float] = Field(None, ge=0)  # Descuento en monto fijo
    code: Optional[str] = None  # Código promocional (opcional)
    promotion_type: str = Field(default="code")  # "code" o "automatic"
    start_date: date
    end_date: date
    terms_conditions: Optional[str] = None
    max_uses: Optional[int] = None  # Máximo de usos (None = ilimitado)
    min_purchase: Optional[float] = Field(None, ge=0)  # Compra mínima requerida
    categories: List[str] = []  # Categorías aplicables
    applies_to_ticket_types: List[str] = ["adult", "senior", "child"]  # A qué tipos de entrada aplica
    is_flash_sale: bool = False  # Oferta relámpago (estilo Mercado Libre)
    flash_duration_hours: Optional[int] = Field(None, ge=1, le=72)  # Duración de la oferta en horas


class PromotionCreate(PromotionBase):
    pass


class PromotionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    discount_percentage: Optional[int] = Field(None, ge=1, le=100)
    discount_amount: Optional[float] = Field(None, ge=0)
    code: Optional[str] = None
    promotion_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    terms_conditions: Optional[str] = None
    max_uses: Optional[int] = None
    min_purchase: Optional[float] = None
    categories: Optional[List[str]] = None
    applies_to_ticket_types: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_flash_sale: Optional[bool] = None
    flash_duration_hours: Optional[int] = Field(None, ge=1, le=72)


class PromotionInDB(PromotionBase):
    id: Optional[str] = Field(alias="_id", default=None)
    business_id: int
    current_uses: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str, date: lambda v: v.isoformat()}


class Promotion(PromotionBase):
    id: int
    business_id: int
    current_uses: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        json_encoders = {date: lambda v: v.isoformat()}


class PromotionClaim(BaseModel):
    """Model for when a user claims/uses a promotion"""
    user_id: int
    promotion_id: int
    business_id: int
    claimed_at: datetime = Field(default_factory=datetime.utcnow)
    used: bool = False  # Si la promoción ya fue usada
    used_at: Optional[datetime] = None
