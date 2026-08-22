from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sale_id = Column(String(100), ForeignKey("sales.id", ondelete="CASCADE"), nullable=False, index=True)
    payment_method = Column(String(50), nullable=False)             # Allowed: CASH, UPI, CARD
    amount = Column(Numeric(12, 2), nullable=False)
    reference_number = Column(String(100), default="", nullable=True) # e.g. UPI Ref / Card Last 4
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sale = relationship("Sale", back_populates="payments")

    def __repr__(self):
        return f"<Payment(id={self.id}, method='{self.payment_method}', amount={self.amount})>"
