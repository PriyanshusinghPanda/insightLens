from fastapi import APIRouter, Depends
from app.utils.dependencies import get_current_user
from app.database import get_db

router = APIRouter()

@router.get("/my-reports")
async def my_reports(user=Depends(get_current_user), db = Depends(get_db)):
    reports_cursor = db.reports.find({"user_id": user["user_id"]})
    reports = await reports_cursor.to_list(length=100)
    
    # Needs to match old Pydantic output loosely or frontend might break
    formatted_reports = []
    for r in reports:
        formatted_reports.append({
            "id": str(r["_id"]),
            "user_id": r["user_id"],
            "question": r["question"],
            "response": r["response"]
        })
    return formatted_reports