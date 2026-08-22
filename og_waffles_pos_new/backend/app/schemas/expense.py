from datetime import datetime, date
from pydantic import BaseModel, Field
from typing import Optional, Literal, Union


class ExpenseBase(BaseModel):
    category: Optional[str] = Field("Other", example="Packaging")
    description: str = Field(..., min_length=1, max_length=255, example="Paper boxes and waffle trays")
    amount: float = Field(..., gt=0.0, example=850.00)
    expense_date: Optional[date] = None
    payment_method: Literal["CASH", "UPI", "CARD", "OTHER"] = "CASH"
    reference_number: Optional[str] = ""
    notes: Optional[str] = ""


class ExpenseCreate(ExpenseBase):
    id: Optional[str] = None


class ExpenseUpdate(BaseModel):
    category: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0.0)
    expense_date: Optional[date] = None
    payment_method: Optional[Literal["CASH", "UPI", "CARD", "OTHER"]] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class ExpenseOut(ExpenseBase):
    id: str
    expense_date: date
    created_by: Optional[Union[int, str]] = 1
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
