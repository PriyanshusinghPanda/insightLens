from sqlalchemy import Column, Integer, String
from app.database import Base

class AnalystCategory(Base):
    __tablename__ = "analyst_category"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    category = Column(String)
