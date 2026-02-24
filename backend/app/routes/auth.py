from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.database import get_db
from app.utils.security import hash_password, verify_password, create_token
from app.utils.dependencies import get_current_user
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
async def register(req: RegisterRequest, db=Depends(get_db)):
    try:
        existing_user = await db.users.find_one({"email": req.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Only allow analyst self-registration; admin must be created by another admin
        allowed_roles = {"analyst", "admin"}
        if req.role not in allowed_roles:
            raise HTTPException(status_code=400, detail="Invalid role")

        await db.users.insert_one({
            "email": req.email,
            "password": hash_password(req.password),
            "role": req.role
        })
        return {"message": "Account created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@router.post("/login")
async def login(req: LoginRequest, db=Depends(get_db)):
    user = await db.users.find_one({"email": req.email})

    if not user or not verify_password(req.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Embed user_id (as string of MongoDB ObjectId) and role into JWT
    token = create_token({
        "user_id": str(user["_id"]),
        "email": user["email"],
        "role": user.get("role", "analyst")
    })
    return {
        "access_token": token,
        "role": user.get("role", "analyst"),
        "email": user["email"]
    }


@router.get("/me")
async def get_me(user=Depends(get_current_user), db=Depends(get_db)):
    """Return current user info + their assigned categories (if analyst)."""
    from bson import ObjectId
    try:
        db_user = await db.users.find_one({"_id": ObjectId(user["user_id"])}, {"password": 0})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch assigned categories for analysts
    categories = []
    if db_user.get("role") == "analyst":
        cursor = db.analyst_category.find({"user_id": user["user_id"]})
        rows = await cursor.to_list(length=100)
        categories = [r["category"] for r in rows]

    return {
        "user_id": user["user_id"],
        "email": db_user["email"],
        "role": db_user.get("role", "analyst"),
        "assigned_categories": categories
    }