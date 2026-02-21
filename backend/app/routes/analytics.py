from fastapi import APIRouter, Depends
from app.services.analytics_service import get_product_reviews, sentiment_counts, get_dashboard_stats, get_analytics_data
from app.services.nps_service import calculate_nps
from app.utils.dependencies import get_current_user
from app.database import get_db

router = APIRouter()

@router.get("/dashboard-stats")
async def dashboard_stats(user=Depends(get_current_user), db = Depends(get_db)):
    return await get_dashboard_stats(db, user["user_id"], user.get("role"))

@router.get("/analytics-data")
async def analytics_data(user=Depends(get_current_user), db = Depends(get_db)):
    return await get_analytics_data(db, user["user_id"], user.get("role"))

@router.get("/nps/{product_id}")
async def nps(product_id: int, user=Depends(get_current_user), db = Depends(get_db)):
    reviews = await get_product_reviews(db, product_id, user["user_id"], user.get("role"))
    score = calculate_nps(reviews)
    return {"nps_score": score}

@router.get("/sentiment/{product_id}")
async def sentiment(product_id: int, user=Depends(get_current_user), db = Depends(get_db)):
    happy, unhappy = await sentiment_counts(db, product_id, user["user_id"], user.get("role"))
    return {"happy": happy, "unhappy": unhappy}