from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    review_text = Column(String)
    rating = Column(Float)
    sentiment = Column(String)