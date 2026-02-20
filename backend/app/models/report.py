from sqlalchemy import Column, Integer, String
from app.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    question = Column(String)
    response = Column(String)