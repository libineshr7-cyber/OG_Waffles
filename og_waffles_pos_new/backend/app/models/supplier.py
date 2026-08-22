from datetime import datetime
from sqlalchemy import Column, String, Numeric, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False, index=True)
    phone = Column(String(50), default="", nullable=True)
    address = Column(Text, default="", nullable=True)
    gst_no = Column(String(50), default="", nullable=True)
    balance = Column(Numeric(12, 2), default=0.00, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    inventory_products = relationship("InventoryProduct", back_populates="supplier")
    purchases = relationship("Purchase", back_populates="supplier")

    def __repr__(self):
        return f"<Supplier(id='{self.id}', name='{self.name}')>"
