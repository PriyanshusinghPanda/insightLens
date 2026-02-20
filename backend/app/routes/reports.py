from fastapi import APIRouter

router = APIRouter()

@router.get("/my")
def my_reports():
    return {"message": "reports endpoint working"}