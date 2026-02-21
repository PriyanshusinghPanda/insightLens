from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.analytics_service import get_product_reviews
from app.services.llm_service import summarize_reviews
from app.utils.dependencies import get_current_user
from app.database import get_db
from app.models.conversation import Conversation
from app.models.report import Report
from sqlalchemy.orm import Session

router = APIRouter()

class ChatRequest(BaseModel):
    product_id: int
    question: str

@router.post("/ask")
def ask(req: ChatRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    reviews = get_product_reviews(req.product_id, user["user_id"], user.get("role"))
    
    if not reviews:
        return {"answer": "Access denied or no data found. You may not be assigned to this product's category."}
        
    answer = summarize_reviews(req.question, reviews)
    
    # Log Conversation
    conversation = Conversation(
        user_id=user["user_id"],
        prompt=req.question,
        llm_response=answer
    )
    db.add(conversation)
    
    # Save as Report
    report = Report(
        user_id=user["user_id"],
        question=req.question,
        response=answer
    )
    db.add(report)
    
    db.commit()
    
    return {"answer": answer}