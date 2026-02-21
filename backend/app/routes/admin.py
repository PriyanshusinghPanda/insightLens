from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from app.utils.dependencies import get_current_user, require_admin
from app.database import get_db

router = APIRouter()

class AssignCategoryRequest(BaseModel):
    user_id: str
    category: str

@router.get("/users")
async def get_users(admin=Depends(require_admin), db=Depends(get_db)):
    cursor = db.users.find({}, {"password": 0})
    users = []
    async for u in cursor:
        u["_id"] = str(u["_id"])
        users.append(u)
    return users

@router.post("/assign-category")
async def assign_category(req: AssignCategoryRequest, admin=Depends(require_admin), db=Depends(get_db)):
    # Check if user exists
    from bson import ObjectId
    try:
        user_oid = ObjectId(req.user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
        
    user = await db.users.find_one({"_id": user_oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.get("role") != "analyst":
        raise HTTPException(status_code=400, detail="Categories can only be assigned to analysts")
        
    # Check if assignment already exists
    existing = await db.analyst_category.find_one({"user_id": str(user_oid), "category": req.category})
    if existing:
        return {"message": "Category already assigned to this analyst"}
        
    await db.analyst_category.insert_one({
        "user_id": str(user_oid),
        "category": req.category
    })
    
    return {"message": f"Successfully assigned {req.category} to analyst."}
