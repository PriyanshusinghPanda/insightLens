from fastapi import APIRouter, Depends
from app.utils.dependencies import get_current_user
from app.database import get_db
from app.models.report import Report
from sqlalchemy.orm import Session

router = APIRouter()

@router.get("/my")
def my_reports(user=Depends(get_current_user), db: Session = Depends(get_db)):
    reports = db.query(Report).filter(Report.user_id == user["user_id"]).all()
    return reports