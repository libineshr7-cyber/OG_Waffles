from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, Literal, Union


class PaymentCreate(BaseModel):
    payment_method: Literal["CASH", "UPI", "CARD", "SPLIT"]
    amount: float = Field(..., gt=0.0)
    reference_number: Optional[str] = ""


class PaymentOut(BaseModel):
    id: Union[int, str] = 1
    sale_id: str
    payment_method: str
    amount: float
    reference_number: Optional[str] = ""
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
