from fastapi import APIRouter, Depends
from app.utils.dependencies import get_current_user
from app.database import SessionLocal
from app.models.report import Report

router = APIRouter()

@router.get("/my")
def my_reports(user=Depends(get_current_user)):
    db = SessionLocal()
    reports = db.query(Report).filter(Report.user_id == user["user_id"]).all()
    db.close()
    return reports