from fastapi import APIRouter, Depends
from app.utils.dependencies import get_current_user
from app.database import get_db

router = APIRouter()

@router.get("/my-reports")
async def my_reports(user=Depends(get_current_user), db = Depends(get_db)):
    match_stage = {}
    if user.get("role") != "admin":
        match_stage = {"user_id": user["user_id"]}
        
    pipeline = []
    if match_stage:
        pipeline.append({"$match": match_stage})
        
    pipeline.extend([
        {"$lookup": {
            "from": "products",
            "localField": "product_id",
            "foreignField": "id",
            "as": "product_info"
        }},
        {"$unwind": {"path": "$product_info", "preserveNullAndEmptyArrays": True}},
        {"$project": {
            "_id": 1,
            "user_id": 1,
            "question": 1,
            "response": 1,
            "timestamp": 1,
            "product_id": 1,
            "product_name": "$product_info.name"
        }},
        {"$sort": {"timestamp": -1}}
    ])
    
    reports_cursor = db.reports.aggregate(pipeline)
    formatted_reports = []
    async for r in reports_cursor:
        formatted_reports.append({
            "id": str(r["_id"]),
            "user_id": r["user_id"],
            "question": r["question"],
            "response": r["response"],
            "timestamp": r.get("timestamp", ""),
            "product_id": r.get("product_id"),
            "product_name": r.get("product_name", "Unknown Product")
        })
    return formatted_reports