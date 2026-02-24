from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from bson import ObjectId

from app.utils.dependencies import get_current_user, require_admin
from app.database import get_db

router = APIRouter()


class AssignCategoryRequest(BaseModel):
    user_id: str
    category: str


class RevokeCategoryRequest(BaseModel):
    user_id: str
    category: str


# ─── User Management ──────────────────────────────────────────────────────────

@router.get("/users")
async def get_users(admin=Depends(require_admin), db=Depends(get_db)):
    """List all users (excluding passwords) with their assigned categories."""
    cursor = db.users.find({}, {"password": 0})
    users = []
    async for u in cursor:
        uid = str(u["_id"])
        u["_id"] = uid

        # Attach assigned categories if analyst
        if u.get("role") == "analyst":
            cat_cursor = db.analyst_category.find({"user_id": uid})
            cats = await cat_cursor.to_list(length=100)
            u["assigned_categories"] = [c["category"] for c in cats]
        else:
            u["assigned_categories"] = []

        users.append(u)
    return users


@router.get("/categories")
async def get_all_categories(admin=Depends(require_admin), db=Depends(get_db)):
    """Return all distinct categories in the products collection."""
    categories = await db.products.distinct("category")
    return sorted(categories)


# ─── Category Assignment ──────────────────────────────────────────────────────

@router.post("/assign-category")
async def assign_category(req: AssignCategoryRequest, admin=Depends(require_admin), db=Depends(get_db)):
    """Assign a product category to an analyst."""
    try:
        user_oid = ObjectId(req.user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    user = await db.users.find_one({"_id": user_oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("role") != "analyst":
        raise HTTPException(status_code=400, detail="Categories can only be assigned to analysts")

    # Idempotent: no duplicate
    existing = await db.analyst_category.find_one({"user_id": req.user_id, "category": req.category})
    if existing:
        return {"message": "Category already assigned to this analyst"}

    await db.analyst_category.insert_one({
        "user_id": req.user_id,
        "category": req.category
    })
    return {"message": f"'{req.category}' assigned to analyst successfully"}


@router.delete("/revoke-category")
async def revoke_category(req: RevokeCategoryRequest, admin=Depends(require_admin), db=Depends(get_db)):
    """Remove a category assignment from an analyst."""
    try:
        ObjectId(req.user_id)  # validate format
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    result = await db.analyst_category.delete_one({
        "user_id": req.user_id,
        "category": req.category
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Assignment not found")

    return {"message": f"'{req.category}' revoked from analyst successfully"}


@router.get("/user-categories/{user_id}")
async def get_user_categories(user_id: str, admin=Depends(require_admin), db=Depends(get_db)):
    """Get all categories assigned to a specific analyst."""
    cursor = db.analyst_category.find({"user_id": user_id})
    cats = await cursor.to_list(length=100)
    return {"user_id": user_id, "categories": [c["category"] for c in cats]}
