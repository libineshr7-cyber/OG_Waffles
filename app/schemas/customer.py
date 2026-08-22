from datetime import datetime, date
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from app.schemas.reward import RewardVisitOut, RewardRedemptionOut


class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    phone: str = Field(..., min_length=5, max_length=50)
    email: Optional[str] = ""
    birthday: Optional[date] = None
    address: Optional[str] = ""
    notes: Optional[str] = ""

    @field_validator("phone")
    @classmethod
    def clean_phone(cls, v: str) -> str:
        cleaned = v.strip().replace(" ", "").replace("-", "")
        if len(cleaned) < 5:
            raise ValueError("Phone number must contain at least 5 digits")
        return cleaned


class CustomerCreate(CustomerBase):
    id: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    birthday: Optional[date] = None
    address: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def clean_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip().replace(" ", "").replace("-", "")
        if len(cleaned) < 5:
            raise ValueError("Phone number must contain at least 5 digits")
        return cleaned


class CustomerOut(CustomerBase):
    id: str
    total_spent: float = 0.0
    visit_count: int = 0
    reward_visits: int = 0
    reward_redemptions: int = 0
    last_visit: Optional[date] = None
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # Calculated Analytics
    average_spend: Optional[float] = 0.0
    lifetime_value: Optional[float] = 0.0
    reward_progress: Optional[int] = 0
    reward_eligible: Optional[bool] = False

    class Config:
        from_attributes = True


class CustomerDetailOut(CustomerOut):
    recent_purchases: List[dict] = []
    reward_visits_history: List[RewardVisitOut] = []
    reward_redemptions_history: List[RewardRedemptionOut] = []
