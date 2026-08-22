from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class RewardVisit(Base):
    __tablename__ = "reward_visits"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(String(100), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    sale_id = Column(String(100), ForeignKey("sales.id", ondelete="SET NULL"), nullable=True, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    visit_number = Column(Integer, nullable=False)
    reward_given = Column(Boolean, default=False, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    customer = relationship("Customer", back_populates="reward_visits_list")
    sale = relationship("Sale")
    creator = relationship("User")

    def __repr__(self):
        return f"<RewardVisit(id={self.id}, customer='{self.customer_id}', amount={self.amount})>"
