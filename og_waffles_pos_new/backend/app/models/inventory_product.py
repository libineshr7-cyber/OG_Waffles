from datetime import datetime, date
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.database import Base


class InventoryProduct(Base):
    __tablename__ = "inventory_products"

    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False, index=True)
    category = Column(String(100), default="General", nullable=False)
    purchase_unit = Column(String(50), default="packet", nullable=False)   # e.g. PACKET, BOX, KG
    base_unit = Column(String(50), default="PIECE", nullable=False)        # Allowed: GRAM, PIECE
    conversion_qty = Column(Numeric(10, 4), default=1.0, nullable=False)  # > 0 (base units per purchase unit)
    current_qty = Column(Numeric(12, 4), default=0.0, nullable=False)     # >= 0 (in base_unit)
    min_limit = Column(Numeric(12, 4), default=10.0, nullable=False)      # >= 0 (in base_unit)
    avg_cost = Column(Numeric(10, 4), default=0.0000, nullable=False)     # Cost per base unit in ₹
    supplier_id = Column(String(100), ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(50), default="IN_STOCK", nullable=False)       # IN_STOCK, LOW_STOCK, OUT_OF_STOCK
    last_updated = Column(Date, default=date.today, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    supplier = relationship("Supplier", back_populates="inventory_products")
    purchase_items = relationship("PurchaseItem", back_populates="inventory_product")
    stock_movements = relationship("StockMovement", back_populates="inventory_product", cascade="all, delete-orphan")
    menu_products = relationship("Product", back_populates="inventory_product")

    def calculate_status(self) -> str:
        if self.current_qty <= 0:
            return "OUT_OF_STOCK"
        elif self.current_qty <= self.min_limit:
            return "LOW_STOCK"
        return "IN_STOCK"

    def __repr__(self):
        return f"<InventoryProduct(id='{self.id}', name='{self.name}', current_qty={self.current_qty} {self.base_unit})>"
