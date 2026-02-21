from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.security import hash_password, verify_password, create_token

router = APIRouter()

class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str = "user"

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    import traceback
    try:
        user = User(email=req.email, password=hash_password(req.password), role=req.role)
        db.add(user)
        db.commit()
        return {"message": "created"}
    except Exception as e:
        error_info = traceback.format_exc()
        return {"error": "Server crashed", "traceback": error_info}


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()

    if not user or not verify_password(req.password, user.password):
        return {"error": "Invalid credentials"}

    token = create_token({"user_id": user.id, "role": user.role})
    return {"access_token": token}

@router.get("/debug-env")
def debug_env():
    import os
    turso_url = os.getenv("TURSO_DATABASE_URL") or os.getenv("DATABASE_URL") or ""
    turso_token = os.getenv("TURSO_AUTH_TOKEN") or ""
    return {
        "url_len": len(turso_url),
        "token_len": len(turso_token),
        "url_start": turso_url[:10] if turso_url else None
    }