from datetime import datetime, date
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(String(100), primary_key=True, index=True)  # e.g. PUR-801
    supplier_id = Column(String(100), ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False, index=True)
    invoice_number = Column(String(100), nullable=False, index=True)
    purchase_date = Column(Date, default=date.today, nullable=False)
    subtotal = Column(Numeric(12, 2), default=0.00, nullable=False)
    tax = Column(Numeric(12, 2), default=0.00, nullable=False)
    discount = Column(Numeric(12, 2), default=0.00, nullable=False)
    total = Column(Numeric(12, 2), default=0.00, nullable=False)
    notes = Column(Text, default="", nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    supplier = relationship("Supplier", back_populates="purchases")
    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Purchase(id='{self.id}', invoice='{self.invoice_number}', total={self.total})>"
