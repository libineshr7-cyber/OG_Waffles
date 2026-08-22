from datetime import datetime
from sqlalchemy import Column, String, Numeric, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(String(100), primary_key=True, index=True)
    category_id = Column(String(100), ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False, index=True)
    price = Column(Numeric(10, 2), nullable=False)
    selling_unit = Column(String(50), default="piece", nullable=False)
    description = Column(Text, default="", nullable=True)
    image_url = Column(String(500), default="", nullable=True)
    available = Column(Boolean, default=True, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    
    # V2: Link to inventory product for future POS deduction
    inventory_product_id = Column(String(100), ForeignKey("inventory_products.id", ondelete="SET NULL"), nullable=True, index=True)
    deduction_qty = Column(Numeric(10, 4), default=0.0, nullable=True)  # in inventory base units
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    category = relationship("Category", back_populates="products")
    inventory_product = relationship("InventoryProduct", back_populates="menu_products")

    def __repr__(self):
        return f"<Product(id='{self.id}', name='{self.name}', price={self.price})>"
