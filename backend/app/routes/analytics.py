from fastapi import APIRouter, Depends
from typing import List, Optional
from pydantic import BaseModel

from app.services.analytics_service import (
    get_product_reviews, sentiment_counts, get_dashboard_stats,
    get_analytics_data, get_nps_for_category, get_trend_over_time, compare_products
)
from app.services.nps_service import calculate_nps
from app.utils.dependencies import get_current_user
from app.database import get_db

router = APIRouter()

# ─── Existing Routes ──────────────────────────────────────────────────────────

@router.get("/dashboard-stats")
async def dashboard_stats(user=Depends(get_current_user), db=Depends(get_db)):
    return await get_dashboard_stats(db, user["user_id"], user.get("role"))


@router.get("/products")
async def get_products(user=Depends(get_current_user), db=Depends(get_db)):
    from app.services.analytics_service import get_allowed_categories
    role = user.get("role")

    match_stage = {}
    if role != "admin":
        allowed_cats = await get_allowed_categories(db, user["user_id"])
        if not allowed_cats:
            return []
        match_stage = {"category": {"$in": allowed_cats}}

    cursor = db.products.find(match_stage, {"id": 1, "name": 1, "category": 1})
    products = await cursor.to_list(length=1000)
    for p in products:
        p["_id"] = str(p["_id"])
    return products


@router.get("/analytics-data")
async def analytics_data(
    category: Optional[str] = None,
    product_id: Optional[int] = None,
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    return await get_analytics_data(db, user["user_id"], user.get("role"), category, product_id)


class InsightsRequest(BaseModel):
    category: Optional[str] = None
    product_id: Optional[int] = None


@router.post("/insights")
async def get_insights(req: InsightsRequest, user=Depends(get_current_user), db=Depends(get_db)):
    from app.services.analytics_service import get_filtered_reviews
    from app.services.llm_service import summarize_reviews

    reviews = await get_filtered_reviews(db, user["user_id"], user.get("role"), req.category, req.product_id)
    if not reviews:
        return {"insights": "No reviews found for the selected filters."}

    prompt = "Please provide 3-4 bullet points summarizing the main themes, complaints, and highlights from these reviews."
    insights = await summarize_reviews(prompt, reviews)
    return {"insights": insights}


@router.get("/nps/{product_id}")
async def nps(product_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    reviews = await get_product_reviews(db, product_id, user["user_id"], user.get("role"))
    score = calculate_nps(reviews)
    return {"nps_score": score}


@router.get("/sentiment/{product_id}")
async def sentiment(product_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    happy, unhappy = await sentiment_counts(db, product_id, user["user_id"], user.get("role"))
    return {"happy": happy, "unhappy": unhappy}


# ─── Phase 3 — New Routes ────────────────────────────────────────────────────

@router.get("/category-nps")
async def category_nps(category: str, user=Depends(get_current_user), db=Depends(get_db)):
    """NPS score for an entire product category."""
    return await get_nps_for_category(db, category, user["user_id"], user.get("role"))


@router.get("/trend")
async def trend(category: str, user=Depends(get_current_user), db=Depends(get_db)):
    """Monthly NPS trend + review volume for a category (last 6-12 months)."""
    return await get_trend_over_time(db, category, user["user_id"], user.get("role"))


class CompareRequest(BaseModel):
    product_ids: List[int]


@router.post("/compare")
async def compare(req: CompareRequest, user=Depends(get_current_user), db=Depends(get_db)):
    """Side-by-side comparison of up to 5 products."""
    if len(req.product_ids) > 5:
        return {"error": "Maximum 5 products can be compared at once"}
    return await compare_products(db, req.product_ids, user["user_id"], user.get("role"))