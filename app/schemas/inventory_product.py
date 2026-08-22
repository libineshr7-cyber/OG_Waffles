from datetime import datetime, date
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal


class InventoryProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    category: Optional[str] = "General"
    purchase_unit: str = Field(..., min_length=1, example="PACKET")
    base_unit: str = Field(..., example="PIECE")
    conversion_qty: float = Field(..., gt=0.0, example=20.0)
    current_qty: Optional[float] = Field(0.0, ge=0.0)
    min_limit: Optional[float] = Field(10.0, ge=0.0)
    avg_cost: Optional[float] = Field(0.00, ge=0.0)
    supplier_id: Optional[str] = None
    status: Optional[str] = "IN_STOCK"

    @field_validator("base_unit")
    @classmethod
    def validate_base_unit(cls, v: str) -> str:
        v_upper = v.strip().upper()
        if v_upper not in ["GRAM", "PIECE", "G", "PCS", "PIECES", "GRAMS"]:
            raise ValueError("base_unit must be either 'GRAM' or 'PIECE'")
        return "GRAM" if v_upper in ["GRAM", "G", "GRAMS"] else "PIECE"


class InventoryProductCreate(InventoryProductBase):
    id: Optional[str] = None


class InventoryProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    purchase_unit: Optional[str] = None
    base_unit: Optional[str] = None
    conversion_qty: Optional[float] = Field(None, gt=0.0)
    min_limit: Optional[float] = Field(None, ge=0.0)
    supplier_id: Optional[str] = None

    @field_validator("base_unit")
    @classmethod
    def validate_base_unit(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v_upper = v.strip().upper()
        if v_upper not in ["GRAM", "PIECE", "G", "PCS", "PIECES", "GRAMS"]:
            raise ValueError("base_unit must be either 'GRAM' or 'PIECE'")
        return "GRAM" if v_upper in ["GRAM", "G", "GRAMS"] else "PIECE"


class InventoryAdjustmentRequest(BaseModel):
    movement_type: Literal["ADJUSTMENT_IN", "ADJUSTMENT_OUT"]
    quantity: float = Field(..., gt=0.0, example=50.0)  # In base units
    notes: Optional[str] = Field("", example="Physical inventory count correction")


class InventoryWasteRequest(BaseModel):
    quantity: float = Field(..., gt=0.0, example=250.0)  # In base units
    notes: Optional[str] = Field(..., min_length=1, example="Defrost thaw damage / expired")


class InventoryProductOut(InventoryProductBase):
    id: str
    last_updated: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
