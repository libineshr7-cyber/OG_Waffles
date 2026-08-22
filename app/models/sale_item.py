from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sale_id = Column(String(100), ForeignKey("sales.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(100), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)
    product_name_snapshot = Column(String(150), nullable=False)     # Snapshot at sale time
    unit_price = Column(Numeric(10, 2), nullable=False)             # Authoritative price snapshot
    quantity = Column(Numeric(10, 4), nullable=False)               # Sold quantity
    selling_unit = Column(String(50), default="piece", nullable=False)
    deduction_qty = Column(Numeric(10, 4), default=0.0, nullable=False)
    inventory_product_id = Column(String(100), ForeignKey("inventory_products.id", ondelete="SET NULL"), nullable=True, index=True)
    line_discount = Column(Numeric(12, 2), default=0.00, nullable=False)
    line_tax = Column(Numeric(12, 2), default=0.00, nullable=False)
    line_total = Column(Numeric(12, 2), nullable=False)             # unit_price * quantity - discount + tax
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product")
    inventory_product = relationship("InventoryProduct")

    def __repr__(self):
        return f"<SaleItem(id={self.id}, product='{self.product_name_snapshot}', qty={self.quantity}, total={self.line_total})>"
