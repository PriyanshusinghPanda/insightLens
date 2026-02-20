from fastapi import APIRouter
from app.services.analytics_service import get_product_reviews, sentiment_counts
from app.services.nps_service import calculate_nps

router = APIRouter()

@router.get("/nps/{product_id}")
def nps(product_id: int):
    reviews = get_product_reviews(product_id)
    score = calculate_nps(reviews)
    return {"nps_score": score}

@router.get("/sentiment/{product_id}")
def sentiment(product_id: int):
    happy, unhappy = sentiment_counts(product_id)
    return {"happy": happy, "unhappy": unhappy}