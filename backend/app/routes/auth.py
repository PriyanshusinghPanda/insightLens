from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.database import get_db
from app.utils.security import hash_password, verify_password, create_token
import traceback

router = APIRouter()

class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str = "analyst"

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
async def register(req: RegisterRequest, db = Depends(get_db)):
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": req.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
            
        await db.users.insert_one({
            "email": req.email,
            "password": hash_password(req.password),
            "role": req.role
        })
        return {"message": "created"}
    except HTTPException:
        raise
    except Exception as e:
        error_info = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Server crashed: {str(e)}")

@router.post("/login")
async def login(req: LoginRequest, db = Depends(get_db)):
    user = await db.users.find_one({"email": req.email})

    if not user or not verify_password(req.password, user.get("password")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # MongoDB id needs casting to str for JWT serialization
    token = create_token({"user_id": str(user["_id"]), "role": user.get("role")})
    return {"access_token": token}

@router.get("/debug-env")
def debug_env():
    import os
    mongo_url = os.getenv("DATABASE_URL") or ""
    return {
        "url_len": len(mongo_url),
        "url_start": mongo_url[:10] if mongo_url else None
    }