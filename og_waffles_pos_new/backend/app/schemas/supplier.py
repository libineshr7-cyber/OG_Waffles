from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    phone: Optional[str] = ""
    address: Optional[str] = ""
    gst_no: Optional[str] = ""
    balance: Optional[float] = 0.00
    active: Optional[bool] = True


class SupplierCreate(SupplierBase):
    id: Optional[str] = None


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    gst_no: Optional[str] = None
    balance: Optional[float] = None
    active: Optional[bool] = None


class SupplierOut(SupplierBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
