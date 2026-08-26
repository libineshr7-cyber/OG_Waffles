from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import ASCENDING
import re

from app.database import get_db, clean_doc, clean_docs
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryOut
from app.auth.dependencies import get_current_user, require_owner

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryOut], summary="List Categories")
def get_categories(
    active_only: bool = False,
    db = Depends(get_db)
):
    query = {}
    if active_only:
        query["active"] = True

    cursor = db["categories"].find(query).sort([("display_order", ASCENDING), ("name", ASCENDING)])
    return clean_docs(cursor)


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED, summary="Create Category")
def create_category(
    cat_in: CategoryCreate,
    db = Depends(get_db)
):
    cat_id = cat_in.id
    if not cat_id:
        slug = re.sub(r"[^a-z0-9]+", "-", cat_in.name.lower()).strip("-")
        cat_id = f"cat-{slug}"

    now = datetime.utcnow()
    existing = db["categories"].find_one({"id": cat_id})
    if existing:
        db["categories"].update_one({"id": cat_id}, {"$set": {"image_url": cat_in.image_url or "", "updated_at": now}})
        return clean_doc(db["categories"].find_one({"id": cat_id}))

    category_doc = {
        "id": cat_id,
        "name": cat_in.name,
        "icon": cat_in.icon or "fa-utensils",
        "image_url": cat_in.image_url or "",
        "display_order": cat_in.display_order or 0,
        "active": cat_in.active if cat_in.active is not None else True,
        "created_at": now,
        "updated_at": now
    }
    db["categories"].insert_one(category_doc)
    return clean_doc(category_doc)


@router.put("/{category_id}", response_model=CategoryOut, summary="Update Category")
def update_category(
    category_id: str,
    cat_in: CategoryUpdate,
    db = Depends(get_db)
):
    category = db["categories"].find_one({"$or": [{"id": category_id}, {"id": category_id.lower()}]})
    if not category and cat_in.name:
        category = db["categories"].find_one({"name": cat_in.name})

    now = datetime.utcnow()
    if not category:
        new_doc = {
            "id": category_id,
            "name": cat_in.name or category_id,
            "icon": cat_in.icon or "fa-utensils",
            "image_url": cat_in.image_url or "",
            "display_order": cat_in.display_order or 0,
            "active": cat_in.active if cat_in.active is not None else True,
            "created_at": now,
            "updated_at": now
        }
        db["categories"].insert_one(new_doc)
        return clean_doc(new_doc)

    update_data = cat_in.model_dump(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = now
        db["categories"].update_one({"id": category["id"]}, {"$set": update_data})

    updated = db["categories"].find_one({"id": category["id"]})
    return clean_doc(updated)


@router.delete("/{category_id}", status_code=status.HTTP_200_OK, summary="Delete Category (Owner Only)")
def delete_category(
    category_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    category = db["categories"].find_one({"$or": [{"id": category_id}, {"id": category_id.lower()}]})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    db["categories"].delete_one({"id": category["id"]})
    return {"message": f"Category '{category['name']}' deleted successfully"}
