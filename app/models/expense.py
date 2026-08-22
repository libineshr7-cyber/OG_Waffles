from datetime import datetime, date
from sqlalchemy import Column, String, Numeric, DateTime, Date, Integer, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String(100), primary_key=True, index=True)          # e.g. EXP-XXXXXX
    category = Column(String(100), default="Other", nullable=False, index=True)
    description = Column(String(255), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    expense_date = Column(Date, default=date.today, nullable=False, index=True)
    payment_method = Column(String(50), default="CASH", nullable=False) # CASH, UPI, CARD, OTHER
    reference_number = Column(String(100), default="", nullable=True)
    notes = Column(Text, default="", nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True) # Soft delete
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    creator = relationship("User")

    def __repr__(self):
        return f"<Expense(id='{self.id}', category='{self.category}', amount={self.amount})>"
