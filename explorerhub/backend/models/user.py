from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "client"  # "client" or "business"


class UserCreate(UserBase):
    password: str
    birth_date: Optional[str] = None
    country: Optional[str] = None
    language: Optional[str] = "es"
    preferences: Optional[List[str]] = []


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserInDB(UserBase):
    id: Optional[int] = Field(default=None)
    hashed_password: str
    birth_date: Optional[str] = None
    country: Optional[str] = None
    language: Optional[str] = "es"
    preferences: Optional[List[str]] = []
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        # Allow extra fields from MongoDB
        extra = "allow"


class User(UserBase):
    id: int
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
