from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    price: float = Field(..., ge=0.0)
    selling_unit: Optional[str] = "piece"
    description: Optional[str] = ""
    image_url: Optional[str] = ""
    available: Optional[bool] = True
    active: Optional[bool] = True
    inventory_product_id: Optional[str] = None
    deduction_qty: Optional[float] = Field(0.0, ge=0.0)


class ProductCreate(ProductBase):
    id: Optional[str] = None
    category_id: str


class ProductUpdate(BaseModel):
    category_id: Optional[str] = None
    name: Optional[str] = None
    price: Optional[float] = None
    selling_unit: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    available: Optional[bool] = None
    active: Optional[bool] = None
    inventory_product_id: Optional[str] = None
    deduction_qty: Optional[float] = None


class ProductOut(ProductBase):
    id: str
    category_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
