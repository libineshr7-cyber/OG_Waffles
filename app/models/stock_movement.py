from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    inventory_product_id = Column(String(100), ForeignKey("inventory_products.id", ondelete="CASCADE"), nullable=False, index=True)
    movement_type = Column(String(50), nullable=False, index=True)  # PURCHASE, SALE, ADJUSTMENT_IN, ADJUSTMENT_OUT, WASTE, REVERSAL
    quantity = Column(Numeric(12, 4), nullable=False)               # Change in base units (+ or -)
    unit = Column(String(50), nullable=False)                       # Base unit (GRAM or PIECE)
    quantity_before = Column(Numeric(12, 4), nullable=False)
    quantity_after = Column(Numeric(12, 4), nullable=False)
    reference_type = Column(String(50), nullable=False)             # PURCHASE, ADJUSTMENT, WASTE, SALE
    reference_id = Column(String(100), nullable=True)               # e.g. PUR-801, WST-01, ADJ-01
    notes = Column(Text, default="", nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    inventory_product = relationship("InventoryProduct", back_populates="stock_movements")

    def __repr__(self):
        return f"<StockMovement(id={self.id}, type='{self.movement_type}', change={self.quantity} {self.unit})>"
