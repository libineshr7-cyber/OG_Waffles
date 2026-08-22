from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    icon: Optional[str] = "fa-utensils"
    image_url: Optional[str] = ""
    display_order: Optional[int] = 0
    active: Optional[bool] = True


class CategoryCreate(CategoryBase):
    id: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    image_url: Optional[str] = None
    display_order: Optional[int] = None
    active: Optional[bool] = None


class CategoryOut(CategoryBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
