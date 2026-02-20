from app.database import SessionLocal
from app.models.review import Review

def get_product_reviews(product_id):
    db = SessionLocal()
    reviews = db.query(Review).filter(Review.product_id == product_id).all()
    db.close()
    return reviews

def sentiment_counts(product_id):
    db = SessionLocal()
    happy = db.query(Review).filter(Review.product_id==product_id, Review.sentiment=="happy").count()
    unhappy = db.query(Review).filter(Review.product_id==product_id, Review.sentiment=="unhappy").count()
    db.close()
    return happy, unhappy