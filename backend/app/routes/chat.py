from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.analytics_service import get_product_reviews
from app.services.llm_service import summarize_reviews
from app.utils.dependencies import get_current_user
from app.database import get_db

router = APIRouter()

class ChatRequest(BaseModel):
    product_id: int
    question: str

from datetime import datetime

class SaveReportRequest(BaseModel):
    product_id: int
    question: str
    response: str

@router.post("/ask")
async def ask(req: ChatRequest, user=Depends(get_current_user), db = Depends(get_db)):
    reviews = await get_product_reviews(db, req.product_id, user["user_id"], user.get("role"))
    
    if not reviews:
        return {"answer": "Access denied or no data found. You may not be assigned to this product's category."}
        
    answer = await summarize_reviews(req.question, reviews)
    
    # Traceability Requirement: Log Conversation implicitly
    await db.conversations.insert_one({
        "user_id": user["user_id"],
        "product_id": req.product_id,
        "prompt": req.question,
        "llm_response": answer,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return {"answer": answer}

@router.post("/save")
async def save_report(req: SaveReportRequest, user=Depends(get_current_user), db = Depends(get_db)):
    await db.reports.insert_one({
        "user_id": user["user_id"],
        "product_id": req.product_id,
        "question": req.question,
        "response": req.response,
        "timestamp": datetime.utcnow().isoformat()
    })
    return {"message": "Report saved successfully"}