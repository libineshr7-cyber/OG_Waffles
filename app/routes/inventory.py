from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import ASCENDING, DESCENDING
import uuid

from app.database import get_db, clean_doc, clean_docs
from app.schemas.inventory_product import (
    InventoryProductCreate, InventoryProductUpdate, InventoryProductOut,
    InventoryAdjustmentRequest, InventoryWasteRequest
)
from app.schemas.stock_movement import StockMovementOut
from app.auth.dependencies import require_owner

router = APIRouter(prefix="/api/inventory", tags=["Inventory Products"])


def calculate_status(current_qty: float, min_limit: float) -> str:
    if current_qty <= 0:
        return "OUT_OF_STOCK"
    elif current_qty <= min_limit:
        return "LOW_STOCK"
    return "IN_STOCK"


@router.get("", response_model=List[InventoryProductOut], summary="List Inventory Products (Owner Only)")
def get_inventory(
    category: Optional[str] = None,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    query = {}
    if category:
        query["category"] = category
    cursor = db["inventory_products"].find(query).sort("name", ASCENDING)
    return clean_docs(cursor)


@router.get("/movements", response_model=List[StockMovementOut], summary="Global Stock Movements Log (Owner Only)")
def get_all_stock_movements(
    inventory_product_id: Optional[str] = None,
    movement_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    query = {}
    if inventory_product_id:
        query["inventory_product_id"] = inventory_product_id
    if movement_type:
        query["movement_type"] = movement_type
    if date_from or date_to:
        query["created_at"] = {}
        if date_from:
            query["created_at"]["$gte"] = datetime.combine(date_from, datetime.min.time())
        if date_to:
            query["created_at"]["$lte"] = datetime.combine(date_to, datetime.max.time())

    cursor = db["stock_movements"].find(query).sort("created_at", DESCENDING)
    return clean_docs(cursor)


@router.get("/{item_id}", response_model=InventoryProductOut, summary="Get Inventory Product Details (Owner Only)")
def get_inventory_item(
    item_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    item = db["inventory_products"].find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return clean_doc(item)


@router.get("/{item_id}/movements", response_model=List[StockMovementOut], summary="Item Stock Movements (Owner Only)")
def get_item_stock_movements(
    item_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    item = db["inventory_products"].find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    cursor = db["stock_movements"].find({"inventory_product_id": item_id}).sort("created_at", DESCENDING)
    return clean_docs(cursor)


@router.post("", response_model=InventoryProductOut, status_code=status.HTTP_201_CREATED, summary="Create Inventory Product (Owner Only)")
def create_inventory_item(
    item_in: InventoryProductCreate,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    if item_in.supplier_id:
        if not db["suppliers"].find_one({"id": item_in.supplier_id}):
            raise HTTPException(status_code=400, detail=f"Supplier '{item_in.supplier_id}' does not exist")

    item_id = item_in.id or f"ING-{uuid.uuid4().hex[:6].upper()}"
    if db["inventory_products"].find_one({"id": item_id}):
        raise HTTPException(status_code=400, detail=f"Inventory Product with ID '{item_id}' already exists")
    if db["inventory_products"].find_one({"name": item_in.name}):
        raise HTTPException(status_code=400, detail=f"Inventory Product with name '{item_in.name}' already exists")

    init_qty = float(item_in.current_qty or 0.0)
    min_limit = float(item_in.min_limit or 10.0)
    status_str = calculate_status(init_qty, min_limit)
    today_val = date.today()
    now = datetime.utcnow()

    new_item = {
        "id": item_id,
        "name": item_in.name,
        "category": item_in.category or "General",
        "purchase_unit": item_in.purchase_unit,
        "base_unit": item_in.base_unit,
        "conversion_qty": float(item_in.conversion_qty),
        "current_qty": init_qty,
        "min_limit": min_limit,
        "avg_cost": float(item_in.avg_cost or 0.00),
        "supplier_id": item_in.supplier_id,
        "status": status_str,
        "last_updated": now,
        "created_at": now,
        "updated_at": now
    }
    db["inventory_products"].insert_one(new_item)

    if init_qty > 0:
        movement = {
            "id": f"MOV-{uuid.uuid4().hex[:6].upper()}",
            "inventory_product_id": item_id,
            "movement_type": "ADJUSTMENT_IN",
            "quantity": init_qty,
            "unit": item_in.base_unit,
            "quantity_before": 0.0,
            "quantity_after": init_qty,
            "reference_type": "ADJUSTMENT",
            "reference_id": "INITIAL_STOCK",
            "notes": "Initial stock upon product creation",
            "created_at": now
        }
        db["stock_movements"].insert_one(movement)

    return clean_doc(new_item)


@router.put("/{item_id}", response_model=InventoryProductOut, summary="Update Inventory Product Configuration (Owner Only)")
def update_inventory_item(
    item_id: str,
    item_in: InventoryProductUpdate,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    item = db["inventory_products"].find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    if item_in.supplier_id:
        if not db["suppliers"].find_one({"id": item_in.supplier_id}):
            raise HTTPException(status_code=400, detail=f"Supplier '{item_in.supplier_id}' does not exist")

    update_data = item_in.model_dump(exclude_unset=True)
    curr_qty = update_data.get("current_qty", item.get("current_qty", 0.0))
    min_lim = update_data.get("min_limit", item.get("min_limit", 10.0))
    update_data["status"] = calculate_status(float(curr_qty), float(min_lim))
    update_data["last_updated"] = datetime.utcnow()
    update_data["updated_at"] = datetime.utcnow()

    db["inventory_products"].update_one({"id": item_id}, {"$set": update_data})
    updated = db["inventory_products"].find_one({"id": item_id})
    return clean_doc(updated)


@router.post("/{item_id}/adjust", response_model=InventoryProductOut, summary="Adjust Stock In / Out (Owner Only)")
def adjust_inventory_stock(
    item_id: str,
    adj_in: InventoryAdjustmentRequest,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    item = db["inventory_products"].find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    qty_before = float(item.get("current_qty", 0.0))
    qty_change = float(adj_in.quantity)

    if qty_change <= 0:
        raise HTTPException(status_code=400, detail="Adjustment quantity must be greater than zero")

    if adj_in.movement_type == "ADJUSTMENT_OUT":
        if qty_change > qty_before:
            raise HTTPException(
                status_code=400,
                detail=f"Adjustment OUT quantity ({qty_change} {item['base_unit']}) exceeds current stock ({qty_before} {item['base_unit']})"
            )
        qty_after = qty_before - qty_change
        signed_qty = -qty_change
    else:  # ADJUSTMENT_IN
        qty_after = qty_before + qty_change
        signed_qty = qty_change

    min_lim = float(item.get("min_limit", 10.0))
    new_status = calculate_status(qty_after, min_lim)
    now = datetime.utcnow()

    db["inventory_products"].update_one(
        {"id": item_id},
        {"$set": {
            "current_qty": qty_after,
            "status": new_status,
            "last_updated": now,
            "updated_at": now
        }}
    )

    adj_id = f"ADJ-{uuid.uuid4().hex[:6].upper()}"
    movement = {
        "id": f"MOV-{uuid.uuid4().hex[:6].upper()}",
        "inventory_product_id": item["id"],
        "movement_type": adj_in.movement_type,
        "quantity": signed_qty,
        "unit": item["base_unit"],
        "quantity_before": qty_before,
        "quantity_after": qty_after,
        "reference_type": "ADJUSTMENT",
        "reference_id": adj_id,
        "notes": adj_in.notes or f"Manual stock adjustment ({adj_in.movement_type})",
        "created_at": now
    }
    db["stock_movements"].insert_one(movement)

    updated = db["inventory_products"].find_one({"id": item_id})
    return clean_doc(updated)


@router.post("/{item_id}/waste", response_model=InventoryProductOut, summary="Record Waste / Spoilage (Owner Only)")
def record_inventory_waste(
    item_id: str,
    waste_in: InventoryWasteRequest,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    item = db["inventory_products"].find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    qty_before = float(item.get("current_qty", 0.0))
    waste_qty = float(waste_in.quantity)

    if waste_qty <= 0:
        raise HTTPException(status_code=400, detail="Waste quantity must be greater than zero")

    if waste_qty > qty_before:
        raise HTTPException(
            status_code=400,
            detail=f"Waste quantity ({waste_qty} {item['base_unit']}) exceeds current stock ({qty_before} {item['base_unit']})"
        )

    qty_after = qty_before - waste_qty
    min_lim = float(item.get("min_limit", 10.0))
    new_status = calculate_status(qty_after, min_lim)
    now = datetime.utcnow()

    db["inventory_products"].update_one(
        {"id": item_id},
        {"$set": {
            "current_qty": qty_after,
            "status": new_status,
            "last_updated": now,
            "updated_at": now
        }}
    )

    waste_id = f"WST-{uuid.uuid4().hex[:6].upper()}"
    movement = {
        "id": f"MOV-{uuid.uuid4().hex[:6].upper()}",
        "inventory_product_id": item["id"],
        "movement_type": "WASTE",
        "quantity": -waste_qty,
        "unit": item["base_unit"],
        "quantity_before": qty_before,
        "quantity_after": qty_after,
        "reference_type": "WASTE",
        "reference_id": waste_id,
        "notes": waste_in.notes or "Waste / spoilage log",
        "created_at": now
    }
    db["stock_movements"].insert_one(movement)

    updated = db["inventory_products"].find_one({"id": item_id})
    return clean_doc(updated)


@router.delete("/{item_id}", status_code=status.HTTP_200_OK, summary="Delete Inventory Product (Owner Only)")
def delete_inventory_item(
    item_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    item = db["inventory_products"].find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    db["inventory_products"].delete_one({"id": item_id})
    return {"message": f"Inventory item '{item['name']}' deleted successfully"}
