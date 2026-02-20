from fastapi import APIRouter
from app.services.analytics_service import get_product_reviews
from app.services.llm_service import summarize_reviews

router = APIRouter()

@router.post("/ask")
def ask(product_id: int, question: str):
    reviews = get_product_reviews(product_id)
    answer = summarize_reviews(question, reviews)
    return {"answer": answer}