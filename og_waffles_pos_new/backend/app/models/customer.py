from datetime import datetime, date
from sqlalchemy import Column, String, Numeric, DateTime, Date, Integer, Boolean, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(100), primary_key=True, index=True)          # e.g. CUST-XXXXXX
    name = Column(String(150), nullable=False, index=True)
    phone = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(150), default="", nullable=True)
    birthday = Column(Date, nullable=True)
    address = Column(Text, default="", nullable=True)
    notes = Column(Text, default="", nullable=True)
    
    total_spent = Column(Numeric(12, 2), default=0.00, nullable=False)
    visit_count = Column(Integer, default=0, nullable=False)
    reward_visits = Column(Integer, default=0, nullable=False)
    reward_redemptions = Column(Integer, default=0, nullable=False)
    
    last_visit = Column(Date, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True) # Soft delete
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    sales = relationship("Sale", back_populates="customer")
    reward_visits_list = relationship("RewardVisit", back_populates="customer", cascade="all, delete-orphan")
    reward_redemptions_list = relationship("RewardRedemption", back_populates="customer", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Customer(id='{self.id}', name='{self.name}', phone='{self.phone}', spent={self.total_spent})>"
