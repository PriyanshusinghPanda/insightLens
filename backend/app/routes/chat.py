"""
chat.py — Chat route using Gemini tool-calling via llm_service.run_tool_call

Request:  { query: str, context_product_id?: int }
Response: { answer: str, tool_used: str, tool_args: dict, chart_data: dict | None }

Every conversation is logged with:
  user_id, query, tool_used, tool_args, answer, chart_data (bool), timestamp
"""

from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from app.services.llm_service import run_tool_call
from app.utils.dependencies import get_current_user
from app.database import get_db

router = APIRouter()


class ChatRequest(BaseModel):
    query: str
    context_product_id: Optional[int] = None   # optional scoping hint


class SaveReportRequest(BaseModel):
    query: str
    answer: str
    tool_used: Optional[str] = None
    product_id: Optional[int] = None


@router.post("/ask")
async def ask(req: ChatRequest, user=Depends(get_current_user), db=Depends(get_db)):
    """
    Main chat endpoint. LLM picks the correct analytics tool, runs the DB query,
    and returns a formatted answer + optional chart data.
    """
    if not req.query.strip():
        return {"answer": "Please enter a question.", "tool_used": None, "chart_data": None}

    result = await run_tool_call(
        query=req.query,
        db=db,
        user_id=user["user_id"],
        role=user.get("role"),
        context_product_id=req.context_product_id
    )

    # Traceability: log the full conversation turn
    await db.conversations.insert_one({
        "user_id": user["user_id"],
        "query": req.query,
        "tool_used": result.get("tool_used"),
        "tool_args": result.get("tool_args", {}),
        "answer": result.get("answer"),
        "has_chart": result.get("chart_data") is not None,
        "timestamp": datetime.utcnow().isoformat()
    })

    return result


@router.post("/save")
async def save_report(req: SaveReportRequest, user=Depends(get_current_user), db=Depends(get_db)):
    """Save a chat answer as a named report for later retrieval."""
    await db.reports.insert_one({
        "user_id": user["user_id"],
        "product_id": req.product_id,
        "query": req.query,
        "answer": req.answer,
        "tool_used": req.tool_used,
        "timestamp": datetime.utcnow().isoformat()
    })
    return {"message": "Report saved successfully"}


@router.get("/history")
async def chat_history(user=Depends(get_current_user), db=Depends(get_db)):
    """Return the last 20 conversation turns for the current user."""
    cursor = db.conversations.find(
        {"user_id": user["user_id"]},
        {"_id": 0, "query": 1, "tool_used": 1, "answer": 1, "has_chart": 1, "timestamp": 1}
    ).sort("timestamp", -1).limit(20)

    history = await cursor.to_list(length=20)
    return history