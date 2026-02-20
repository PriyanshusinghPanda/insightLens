from sqlalchemy import Column, Integer, String
from app.database import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    prompt = Column(String)
    llm_response = Column(String)