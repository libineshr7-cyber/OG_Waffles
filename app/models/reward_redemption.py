from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class RewardRedemption(Base):
    __tablename__ = "reward_redemptions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(String(100), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    reward_name = Column(String(150), default="Free Waffle / 10 Visits Reward", nullable=False)
    visit_used = Column(Integer, default=10, nullable=False)
    notes = Column(Text, default="", nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    customer = relationship("Customer", back_populates="reward_redemptions_list")
    creator = relationship("User")

    def __repr__(self):
        return f"<RewardRedemption(id={self.id}, customer='{self.customer_id}', reward='{self.reward_name}')>"
