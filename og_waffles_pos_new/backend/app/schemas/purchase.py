from datetime import datetime, date
from pydantic import BaseModel, Field
from typing import Optional, List, Union


class PurchaseItemCreate(BaseModel):
    inventory_product_id: str
    purchase_qty: float = Field(..., gt=0.0, example=10.0)
    purchase_unit: Optional[str] = "PACKET"
    conversion_qty: Optional[float] = Field(None, gt=0.0, example=2500.0)
    unit_cost: float = Field(..., ge=0.0, example=650.00)


class PurchaseItemOut(BaseModel):
    id: Union[int, str] = 1
    purchase_id: str
    inventory_product_id: str
    purchase_qty: float
    purchase_unit: str
    conversion_qty: float
    base_qty: float
    unit_cost: float
    total_cost: float
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PurchaseCreate(BaseModel):
    id: Optional[str] = None
    supplier_id: str
    invoice_number: str = Field(..., min_length=1)
    purchase_date: Optional[date] = None
    tax: Optional[float] = 0.00
    discount: Optional[float] = 0.00
    notes: Optional[str] = ""
    items: List[PurchaseItemCreate] = Field(..., min_length=1)


class PurchaseOut(BaseModel):
    id: str
    supplier_id: str
    invoice_number: str
    purchase_date: date
    subtotal: float
    tax: float = 0.0
    discount: float = 0.0
    total: float
    notes: Optional[str] = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: List[PurchaseItemOut] = []

    class Config:
        from_attributes = True
