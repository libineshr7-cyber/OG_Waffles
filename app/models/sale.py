from datetime import datetime, date
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Date, Integer
from sqlalchemy.orm import relationship
from app.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id = Column(String(100), primary_key=True, index=True)          # e.g. SALE-XXXX
    invoice_number = Column(String(100), unique=True, nullable=False, index=True) # e.g. OW-2026-000001
    customer_id = Column(String(100), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    subtotal = Column(Numeric(12, 2), default=0.00, nullable=False)
    discount = Column(Numeric(12, 2), default=0.00, nullable=False)
    tax = Column(Numeric(12, 2), default=0.00, nullable=False)
    total = Column(Numeric(12, 2), default=0.00, nullable=False)
    payment_status = Column(String(50), default="PAID", nullable=False)  # PENDING, PAID, REFUNDED
    sale_status = Column(String(50), default="COMPLETED", nullable=False) # COMPLETED, CANCELLED, REFUNDED
    sale_date = Column(Date, default=date.today, nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    creator = relationship("User")
    customer = relationship("Customer", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="sale", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Sale(id='{self.id}', invoice='{self.invoice_number}', total={self.total}, status='{self.sale_status}')>"
