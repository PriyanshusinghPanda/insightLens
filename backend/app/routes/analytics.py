from fastapi import APIRouter, Depends
from app.services.analytics_service import get_product_reviews, sentiment_counts, get_dashboard_stats, get_analytics_data
from app.services.nps_service import calculate_nps
from app.utils.dependencies import get_current_user

router = APIRouter()

@router.get("/dashboard-stats")
def dashboard_stats(user=Depends(get_current_user)):
    return get_dashboard_stats(user["user_id"], user.get("role"))

@router.get("/analytics-data")
def analytics_data(user=Depends(get_current_user)):
    return get_analytics_data(user["user_id"], user.get("role"))

@router.get("/nps/{product_id}")
def nps(product_id: int, user=Depends(get_current_user)):
    reviews = get_product_reviews(product_id, user["user_id"], user.get("role"))
    score = calculate_nps(reviews)
    return {"nps_score": score}

@router.get("/sentiment/{product_id}")
def sentiment(product_id: int, user=Depends(get_current_user)):
    happy, unhappy = sentiment_counts(product_id, user["user_id"], user.get("role"))
    return {"happy": happy, "unhappy": unhappy}