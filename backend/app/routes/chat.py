from fastapi import APIRouter
from pydantic import BaseModel
from app.services.analytics_service import get_product_reviews
from app.services.llm_service import summarize_reviews

router = APIRouter()

class ChatRequest(BaseModel):
    product_id: int
    question: str

@router.post("/ask")
def ask(req: ChatRequest):
    reviews = get_product_reviews(req.product_id)
    answer = summarize_reviews(req.question, reviews)
    return {"answer": answer}