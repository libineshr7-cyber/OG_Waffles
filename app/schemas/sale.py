from datetime import datetime, date
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Literal, Union
from app.schemas.payment import PaymentCreate, PaymentOut


class CustomerPayload(BaseModel):
    name: Optional[str] = None
    phone: str = Field(..., min_length=5)

    @field_validator("phone")
    @classmethod
    def clean_phone(cls, v: str) -> str:
        cleaned = v.strip().replace(" ", "").replace("-", "")
        if len(cleaned) < 5:
            raise ValueError("Phone number must contain at least 5 digits")
        return cleaned


class SaleItemCreate(BaseModel):
    product_id: str
    quantity: float = Field(..., gt=0.0, example=2.0)


class SaleItemOut(BaseModel):
    id: Union[int, str] = 1
    sale_id: str
    product_id: str
    product_name_snapshot: str
    unit_price: float
    quantity: float
    selling_unit: Optional[str] = "piece"
    deduction_qty: Optional[float] = 0.0
    inventory_product_id: Optional[str] = None
    line_discount: Optional[float] = 0.0
    line_tax: Optional[float] = 0.0
    line_total: float
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SaleCreate(BaseModel):
    customer_id: Optional[str] = None
    customer: Optional[CustomerPayload] = None  # Auto customer creation / lookup by phone
    items: List[SaleItemCreate] = Field(..., min_length=1)
    payment_method: Literal["CASH", "UPI", "CARD"] = "CASH"
    payment_reference: Optional[str] = ""
    discount: Optional[float] = Field(0.00, ge=0.0)
    tax: Optional[float] = Field(0.00, ge=0.0)


class SaleOut(BaseModel):
    id: str
    invoice_number: str
    customer_id: Optional[str] = None
    subtotal: float
    discount: float = 0.0
    tax: float = 0.0
    total: float
    payment_status: str = "PAID"
    sale_status: str = "COMPLETED"
    sale_date: date
    created_by: Optional[Union[int, str]] = 1
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: List[SaleItemOut] = []
    payments: List[PaymentOut] = []

    class Config:
        from_attributes = True


class TodaySalesSummary(BaseModel):
    sale_date: date
    number_of_bills: int
    gross_sales: float
    discount_total: float
    tax_total: float
    net_sales: float
    cash_total: float
    upi_total: float
    card_total: float


class SalesSummary(BaseModel):
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    number_of_bills: int
    gross_sales: float
    discount_total: float
    tax_total: float
    net_sales: float
    cash_total: float
    upi_total: float
    card_total: float
