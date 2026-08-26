from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import ASCENDING
import uuid

from app.database import get_db, clean_doc, clean_docs
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut
from app.auth.dependencies import get_current_user, require_owner

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("", response_model=List[ProductOut], summary="List Products")
def get_products(
    category_id: Optional[str] = None,
    active_only: bool = False,
    db = Depends(get_db)
):
    query = {}
    if category_id:
        query["category_id"] = category_id
    if active_only:
        query["active"] = True

    cursor = db["products"].find(query).sort("name", ASCENDING)
    return clean_docs(cursor)


@router.get("/{product_id}", response_model=ProductOut, summary="Get Product Details")
def get_product(
    product_id: str,
    db = Depends(get_db)
):
    product = db["products"].find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return clean_doc(product)


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED, summary="Create Product")
def create_product(
    prod_in: ProductCreate,
    db = Depends(get_db)
):
    prod_id = prod_in.id or f"PROD-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.utcnow()
    product_doc = {
        "id": prod_id,
        "category_id": prod_in.category_id or "cat-waffles",
        "name": prod_in.name,
        "price": float(prod_in.price),
        "selling_unit": prod_in.selling_unit or "piece",
        "description": prod_in.description or "",
        "image_url": prod_in.image_url or "",
        "available": prod_in.available if prod_in.available is not None else True,
        "active": prod_in.active if prod_in.active is not None else True,
        "inventory_product_id": prod_in.inventory_product_id,
        "deduction_qty": float(prod_in.deduction_qty or 0.0),
        "created_at": now,
        "updated_at": now
    }
    db["products"].insert_one(product_doc)
    return clean_doc(product_doc)


@router.put("/{product_id}", response_model=ProductOut, summary="Update Product")
def update_product(
    product_id: str,
    prod_in: ProductUpdate,
    db = Depends(get_db)
):
    product = db["products"].find_one({"$or": [{"id": product_id}, {"id": product_id.upper()}, {"id": product_id.lower()}]})
    if not product and prod_in.name:
        product = db["products"].find_one({"name": prod_in.name})

    now = datetime.utcnow()
    if not product:
        # Upsert: auto-create product if it doesn't exist in MongoDB yet
        new_doc = {
            "id": product_id,
            "category_id": prod_in.category_id or "cat-waffles",
            "name": prod_in.name or product_id,
            "price": prod_in.price or 0.0,
            "selling_unit": prod_in.selling_unit or "piece",
            "description": prod_in.description or "",
            "image_url": prod_in.image_url or "",
            "available": prod_in.available if prod_in.available is not None else True,
            "active": prod_in.active if prod_in.active is not None else True,
            "inventory_product_id": prod_in.inventory_product_id,
            "deduction_qty": prod_in.deduction_qty or 0.0,
            "created_at": now,
            "updated_at": now
        }
        db["products"].insert_one(new_doc)
        return clean_doc(new_doc)

    update_data = prod_in.model_dump(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = now
        db["products"].update_one({"id": product["id"]}, {"$set": update_data})

    updated = db["products"].find_one({"id": product["id"]})
    return clean_doc(updated)


@router.delete("/{product_id}", status_code=status.HTTP_200_OK, summary="Delete Product (Owner Only)")
def delete_product(
    product_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    product = db["products"].find_one({"$or": [{"id": product_id}, {"id": product_id.upper()}, {"id": product_id.lower()}]})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db["products"].delete_one({"id": product["id"]})
    return {"message": f"Product '{product['name']}' deleted successfully"}
