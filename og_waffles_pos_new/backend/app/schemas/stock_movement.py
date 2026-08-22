from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, Union


class StockMovementOut(BaseModel):
    id: Union[int, str] = 1
    inventory_product_id: str
    movement_type: str
    quantity: float
    unit: str
    quantity_before: float
    quantity_after: float
    reference_type: str
    reference_id: Optional[str] = None
    notes: Optional[str] = ""
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
