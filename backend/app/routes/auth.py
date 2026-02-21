from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.utils.security import hash_password, verify_password, create_token

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str = "user"

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    user = User(email=req.email, password=hash_password(req.password), role=req.role)
    db.add(user)
    db.commit()
    return {"message": "created"}

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()

    if not user or not verify_password(req.password, user.password):
        return {"error": "Invalid credentials"}

    token = create_token({"user_id": user.id, "role": user.role})
    return {"access_token": token}