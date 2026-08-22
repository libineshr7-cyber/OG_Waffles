from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import DESCENDING
import uuid

from app.database import get_db, clean_doc, clean_docs
from app.schemas.purchase import PurchaseCreate, PurchaseOut
from app.auth.dependencies import require_owner

router = APIRouter(prefix="/api/purchases", tags=["Purchases"])


@router.get("", response_model=List[PurchaseOut], summary="List Purchases (Owner Only)")
def get_purchases(
    supplier_id: Optional[str] = None,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    query = {}
    if supplier_id:
        query["supplier_id"] = supplier_id

    cursor = db["purchases"].find(query).sort([("purchase_date", DESCENDING), ("created_at", DESCENDING)])
    purchases = clean_docs(cursor)
    for p in purchases:
        p["items"] = clean_docs(db["purchase_items"].find({"purchase_id": p["id"]}))
    return purchases


@router.get("/{purchase_id}", response_model=PurchaseOut, summary="Get Purchase Details (Owner Only)")
def get_purchase(
    purchase_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    purchase = db["purchases"].find_one({"id": purchase_id})
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    purchase = clean_doc(purchase)
    purchase["items"] = clean_docs(db["purchase_items"].find({"purchase_id": purchase["id"]}))
    return purchase


@router.post("", response_model=PurchaseOut, status_code=status.HTTP_201_CREATED, summary="Create Purchase & Auto-Restock Inventory (Owner Only)")
def create_purchase(
    p_in: PurchaseCreate,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    supplier = db["suppliers"].find_one({"id": p_in.supplier_id})
    if not supplier:
        raise HTTPException(status_code=400, detail=f"Supplier '{p_in.supplier_id}' does not exist")

    purchase_id = p_in.id or f"PUR-{uuid.uuid4().hex[:6].upper()}"
    if db["purchases"].find_one({"id": purchase_id}):
        raise HTTPException(status_code=400, detail=f"Purchase ID '{purchase_id}' already exists")

    if not p_in.items or len(p_in.items) == 0:
        raise HTTPException(status_code=400, detail="Purchase must contain at least one item")

    subtotal = 0.0
    purchase_items_to_add = []
    stock_movements_to_add = []
    inventory_updates = []
    now = datetime.utcnow()
    p_date = p_in.purchase_date or date.today()

    for item_data in p_in.items:
        inv_prod = db["inventory_products"].find_one({"id": item_data.inventory_product_id})
        if not inv_prod:
            raise HTTPException(
                status_code=400,
                detail=f"Inventory Product '{item_data.inventory_product_id}' does not exist"
            )

        p_qty = float(item_data.purchase_qty)
        if p_qty <= 0:
            raise HTTPException(status_code=400, detail="Purchase quantity must be greater than zero")

        c_qty = float(item_data.conversion_qty) if item_data.conversion_qty is not None else float(inv_prod.get("conversion_qty", 1.0))
        if c_qty <= 0:
            raise HTTPException(status_code=400, detail="Conversion quantity must be greater than zero")

        base_qty_added = p_qty * c_qty
        unit_cost = float(item_data.unit_cost)
        item_total_cost = p_qty * unit_cost
        subtotal += item_total_cost

        purchase_item_doc = {
            "id": f"PI-{uuid.uuid4().hex[:6].upper()}",
            "purchase_id": purchase_id,
            "inventory_product_id": inv_prod["id"],
            "purchase_qty": p_qty,
            "purchase_unit": item_data.purchase_unit or inv_prod.get("purchase_unit", "PACKET"),
            "conversion_qty": c_qty,
            "base_qty": base_qty_added,
            "unit_cost": unit_cost,
            "total_cost": item_total_cost,
            "created_at": now
        }
        purchase_items_to_add.append(purchase_item_doc)

        qty_before = float(inv_prod.get("current_qty", 0.0))
        qty_after = qty_before + base_qty_added
        old_avg_cost = float(inv_prod.get("avg_cost", 0.0))

        if qty_after > 0:
            new_avg_cost = ((qty_before * old_avg_cost) + item_total_cost) / qty_after
        else:
            new_avg_cost = 0.0

        min_lim = float(inv_prod.get("min_limit", 10.0))
        new_status = "OUT_OF_STOCK" if qty_after <= 0 else ("LOW_STOCK" if qty_after <= min_lim else "IN_STOCK")

        inventory_updates.append((
            inv_prod["id"],
            {
                "current_qty": qty_after,
                "avg_cost": round(new_avg_cost, 4),
                "status": new_status,
                "last_updated": p_date,
                "updated_at": now
            }
        ))

        stock_movement = {
            "id": f"MOV-{uuid.uuid4().hex[:6].upper()}",
            "inventory_product_id": inv_prod["id"],
            "movement_type": "PURCHASE",
            "quantity": base_qty_added,
            "unit": inv_prod.get("base_unit", "PIECE"),
            "quantity_before": qty_before,
            "quantity_after": qty_after,
            "reference_type": "PURCHASE",
            "reference_id": purchase_id,
            "notes": f"Purchase invoice #{p_in.invoice_number} ({p_qty} {item_data.purchase_unit or inv_prod.get('purchase_unit', 'PACKET')})",
            "created_at": now
        }
        stock_movements_to_add.append(stock_movement)

    tax_amount = float(p_in.tax or 0.00)
    discount_amount = float(p_in.discount or 0.00)
    grand_total = max(0.0, subtotal + tax_amount - discount_amount)

    new_purchase = {
        "id": purchase_id,
        "supplier_id": supplier["id"],
        "invoice_number": p_in.invoice_number,
        "purchase_date": p_date,
        "subtotal": subtotal,
        "tax": tax_amount,
        "discount": discount_amount,
        "total": grand_total,
        "notes": p_in.notes or "",
        "created_at": now,
        "updated_at": now
    }

    # Execute DB writes
    db["purchases"].insert_one(new_purchase)
    if purchase_items_to_add:
        db["purchase_items"].insert_many(purchase_items_to_add)
    if stock_movements_to_add:
        db["stock_movements"].insert_many(stock_movements_to_add)

    for item_id, upd_dict in inventory_updates:
        db["inventory_products"].update_one({"id": item_id}, {"$set": upd_dict})

    result = clean_doc(new_purchase)
    result["items"] = clean_docs(purchase_items_to_add)
    return result
