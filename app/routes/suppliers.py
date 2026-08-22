from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import ASCENDING, DESCENDING
import uuid

from app.database import get_db, clean_doc, clean_docs
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierOut
from app.schemas.purchase import PurchaseOut
from app.auth.dependencies import require_owner

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])


@router.get("", response_model=List[SupplierOut], summary="List Suppliers (Owner Only)")
def get_suppliers(
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    cursor = db["suppliers"].find().sort("name", ASCENDING)
    return clean_docs(cursor)


@router.get("/{supplier_id}/purchases", response_model=List[PurchaseOut], summary="Get Purchases For Supplier (Owner Only)")
def get_supplier_purchases(
    supplier_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    supplier = db["suppliers"].find_one({"id": supplier_id})
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    cursor = db["purchases"].find({"supplier_id": supplier_id}).sort([("purchase_date", DESCENDING), ("created_at", DESCENDING)])
    purchases = clean_docs(cursor)
    for p in purchases:
        p["items"] = clean_docs(db["purchase_items"].find({"purchase_id": p["id"]}))
    return purchases


@router.post("", response_model=SupplierOut, status_code=status.HTTP_201_CREATED, summary="Create Supplier (Owner Only)")
def create_supplier(
    sup_in: SupplierCreate,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    sup_id = sup_in.id or f"SUP-{uuid.uuid4().hex[:6].upper()}"
    if db["suppliers"].find_one({"id": sup_id}):
        raise HTTPException(status_code=400, detail=f"Supplier ID '{sup_id}' already exists")
    if db["suppliers"].find_one({"name": sup_in.name}):
        raise HTTPException(status_code=400, detail=f"Supplier name '{sup_in.name}' already exists")

    now = datetime.utcnow()
    supplier_doc = {
        "id": sup_id,
        "name": sup_in.name,
        "phone": sup_in.phone or "",
        "address": sup_in.address or "",
        "gst_no": sup_in.gst_no or "",
        "balance": float(sup_in.balance or 0.00),
        "active": sup_in.active if sup_in.active is not None else True,
        "created_at": now,
        "updated_at": now
    }
    db["suppliers"].insert_one(supplier_doc)
    return clean_doc(supplier_doc)


@router.put("/{supplier_id}", response_model=SupplierOut, summary="Update Supplier (Owner Only)")
def update_supplier(
    supplier_id: str,
    sup_in: SupplierUpdate,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    supplier = db["suppliers"].find_one({"id": supplier_id})
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    update_data = sup_in.model_dump(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        db["suppliers"].update_one({"id": supplier_id}, {"$set": update_data})

    updated = db["suppliers"].find_one({"id": supplier_id})
    return clean_doc(updated)


@router.delete("/{supplier_id}", status_code=status.HTTP_200_OK, summary="Delete Supplier (Owner Only)")
def delete_supplier(
    supplier_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    supplier = db["suppliers"].find_one({"id": supplier_id})
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    db["suppliers"].delete_one({"id": supplier_id})
    return {"message": f"Supplier '{supplier['name']}' deleted successfully"}
