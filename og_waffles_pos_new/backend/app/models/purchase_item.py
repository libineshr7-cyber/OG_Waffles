from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    purchase_id = Column(String(100), ForeignKey("purchases.id", ondelete="CASCADE"), nullable=False, index=True)
    inventory_product_id = Column(String(100), ForeignKey("inventory_products.id", ondelete="RESTRICT"), nullable=False, index=True)
    purchase_qty = Column(Numeric(10, 4), nullable=False)       # e.g. 10 packets
    purchase_unit = Column(String(50), nullable=False)          # e.g. PACKET
    conversion_qty = Column(Numeric(10, 4), nullable=False)     # e.g. 2500 g per packet
    base_qty = Column(Numeric(12, 4), nullable=False)           # purchase_qty * conversion_qty (e.g. 25000 g)
    unit_cost = Column(Numeric(10, 2), nullable=False)          # Cost per 1 purchase_unit in ₹
    total_cost = Column(Numeric(12, 2), nullable=False)         # purchase_qty * unit_cost
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    purchase = relationship("Purchase", back_populates="items")
    inventory_product = relationship("InventoryProduct", back_populates="purchase_items")

    def __repr__(self):
        return f"<PurchaseItem(id={self.id}, item='{self.inventory_product_id}', base_qty={self.base_qty})>"
