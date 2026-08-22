from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, Union


class RewardVisitCreate(BaseModel):
    amount: float = Field(..., gt=0.0, example=350.00)
    sale_id: Optional[str] = None


class RewardVisitOut(BaseModel):
    id: Union[int, str] = 1
    customer_id: str
    sale_id: Optional[str] = None
    amount: float
    visit_number: int
    reward_given: bool = False
    created_by: Optional[Union[int, str]] = 1
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RewardRedeemCreate(BaseModel):
    reward_name: Optional[str] = "Free Waffle / 10 Visits Reward"
    notes: Optional[str] = ""


class RewardRedemptionOut(BaseModel):
    id: Union[int, str] = 1
    customer_id: str
    reward_name: str
    visit_used: int = 10
    notes: Optional[str] = ""
    created_by: Optional[Union[int, str]] = 1
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
