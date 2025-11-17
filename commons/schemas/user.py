from pydantic import BaseModel, Field, EmailStr, model_validator
from enum import Enum
from pydantic_extra_types.phone_numbers import PhoneNumber
from bson import ObjectId
from typing import Optional
from datetime import date, datetime


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    CITIZEN = "CITIZEN"


class UserBase(BaseModel):
    name: str = Field(...)
    role: UserRole = Field(...)
    email: EmailStr = Field(...)
    phone: Optional[PhoneNumber] = Field(None)
    dob: date = Field(...)


class UserRegister(UserBase):
    password: str = Field(...)


class User(UserBase):
    id: str = Field(validation_alias="_id", serialization_alias="id")
    createdAt: datetime = Field(..., default_factory=datetime.now)

    @model_validator(mode="before")
    @classmethod
    def convert_objectid(cls, data: dict):
        if isinstance(data, dict) and "_id" in data and isinstance(data["_id"], ObjectId):
            data["_id"] = str(data["_id"])
        return data