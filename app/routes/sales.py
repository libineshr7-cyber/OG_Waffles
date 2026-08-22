from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import DESCENDING
import uuid

from app.database import get_db, clean_doc, clean_docs
from app.schemas.sale import (
    SaleCreate, SaleOut, SaleItemOut, TodaySalesSummary, SalesSummary
)
from app.schemas.payment import PaymentOut
from app.auth.dependencies import get_current_user, require_owner, require_authenticated

router = APIRouter(prefix="/api/sales", tags=["Sales & Billing"])


def generate_invoice_number(db) -> str:
    current_year = date.today().year
    prefix = f"OW-{current_year}-"
    count = db["sales"].count_documents({"invoice_number": {"$regex": f"^{prefix}"}})
    new_num = count + 1
    invoice_no = f"{prefix}{new_num:06d}"

    while db["sales"].find_one({"invoice_number": invoice_no}):
        new_num += 1
        invoice_no = f"{prefix}{new_num:06d}"

    return invoice_no


@router.post("", response_model=SaleOut, status_code=status.HTTP_201_CREATED, summary="Create Completed Sale, Deduct Inventory & Auto-Update Customer")
def create_sale(
    sale_in: SaleCreate,
    db = Depends(get_db),
    current_user: dict = Depends(require_authenticated)
):
    if not sale_in.items or len(sale_in.items) == 0:
        raise HTTPException(status_code=400, detail="Sale must contain at least one line item")

    sale_id = f"SALE-{uuid.uuid4().hex[:8].upper()}"
    invoice_number = generate_invoice_number(db)
    today = date.today()
    now = datetime.utcnow()

    subtotal = 0.0
    sale_items_to_add = []
    stock_movements_to_add = []
    inventory_updates = []

    # 1. Validate all products and inventory stock
    for item_data in sale_in.items:
        qty = float(item_data.quantity)
        if qty <= 0:
            raise HTTPException(status_code=400, detail="Item quantity must be greater than zero")

        product = db["products"].find_one({"id": item_data.product_id})
        if not product:
            raise HTTPException(status_code=400, detail=f"Product '{item_data.product_id}' not found")
        if not product.get("active", True) or not product.get("available", True):
            raise HTTPException(status_code=400, detail=f"Product '{product['name']}' is currently unavailable")

        unit_price = float(product["price"])
        line_subtotal = unit_price * qty
        subtotal += line_subtotal

        deduction_qty = float(product.get("deduction_qty", 0.0))
        inv_prod_id = product.get("inventory_product_id")

        if inv_prod_id:
            inv_prod = db["inventory_products"].find_one({"id": inv_prod_id})
            if not inv_prod:
                raise HTTPException(
                    status_code=400,
                    detail=f"Inventory product mapping '{inv_prod_id}' for '{product['name']}' does not exist"
                )

            required_base_qty = qty * deduction_qty
            current_available = float(inv_prod.get("current_qty", 0.0))

            if current_available < required_base_qty:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for '{product['name']}'. Required: {required_base_qty} {inv_prod.get('base_unit', 'PIECE')}, Available: {current_available} {inv_prod.get('base_unit', 'PIECE')}"
                )

            inventory_updates.append((inv_prod, required_base_qty))

        sale_item = {
            "id": f"SI-{uuid.uuid4().hex[:6].upper()}",
            "sale_id": sale_id,
            "product_id": product["id"],
            "product_name_snapshot": product["name"],
            "unit_price": unit_price,
            "quantity": qty,
            "selling_unit": product.get("selling_unit", "piece"),
            "deduction_qty": deduction_qty,
            "inventory_product_id": inv_prod_id,
            "line_discount": 0.00,
            "line_tax": 0.00,
            "line_total": line_subtotal,
            "created_at": now
        }
        sale_items_to_add.append(sale_item)

    # 2. Calculate Final Totals
    discount = float(sale_in.discount or 0.00)
    tax = float(sale_in.tax or 0.00)
    if discount < 0:
        raise HTTPException(status_code=400, detail="Discount cannot be negative")
    if tax < 0:
        raise HTTPException(status_code=400, detail="Tax cannot be negative")

    grand_total = max(0.00, subtotal - discount + tax)

    # 3. Handle Customer Association & Auto-Registration
    final_customer_id = sale_in.customer_id
    if sale_in.customer and sale_in.customer.phone:
        clean_phone = sale_in.customer.phone.strip().replace(" ", "").replace("-", "")
        cust = db["customers"].find_one({"phone": clean_phone})

        if cust:
            new_spent = float(cust.get("total_spent", 0.0)) + grand_total
            new_visits = int(cust.get("visit_count", 0)) + 1
            cust_update = {
                "total_spent": new_spent,
                "visit_count": new_visits,
                "last_visit": today,
                "is_deleted": False,
                "updated_at": now
            }
            if sale_in.customer.name and (not cust.get("name") or cust.get("name") == "Valued Guest"):
                cust_update["name"] = sale_in.customer.name
            db["customers"].update_one({"id": cust["id"]}, {"$set": cust_update})
            final_customer_id = cust["id"]
        else:
            new_cust_id = f"CUST-{uuid.uuid4().hex[:6].upper()}"
            new_cust = {
                "id": new_cust_id,
                "name": sale_in.customer.name or "Valued Guest",
                "phone": clean_phone,
                "email": "",
                "address": "",
                "notes": "",
                "total_spent": grand_total,
                "visit_count": 1,
                "reward_visits": 0,
                "reward_redemptions": 0,
                "last_visit": today,
                "is_deleted": False,
                "created_at": now,
                "updated_at": now
            }
            db["customers"].insert_one(new_cust)
            final_customer_id = new_cust_id
    elif final_customer_id:
        cust = db["customers"].find_one({"id": final_customer_id})
        if cust:
            db["customers"].update_one(
                {"id": final_customer_id},
                {"$set": {
                    "total_spent": float(cust.get("total_spent", 0.0)) + grand_total,
                    "visit_count": int(cust.get("visit_count", 0)) + 1,
                    "last_visit": today,
                    "updated_at": now
                }}
            )

    # 4. Apply Stock Deductions & Log Movements
    for inv_prod, required_base_qty in inventory_updates:
        qty_before = float(inv_prod.get("current_qty", 0.0))
        qty_after = qty_before - float(required_base_qty)
        min_lim = float(inv_prod.get("min_limit", 10.0))
        new_status = "OUT_OF_STOCK" if qty_after <= 0 else ("LOW_STOCK" if qty_after <= min_lim else "IN_STOCK")

        db["inventory_products"].update_one(
            {"id": inv_prod["id"]},
            {"$set": {
                "current_qty": qty_after,
                "status": new_status,
                "last_updated": today,
                "updated_at": now
            }}
        )

        movement = {
            "id": f"MOV-{uuid.uuid4().hex[:6].upper()}",
            "inventory_product_id": inv_prod["id"],
            "movement_type": "SALE",
            "quantity": -float(required_base_qty),
            "unit": inv_prod.get("base_unit", "PIECE"),
            "quantity_before": qty_before,
            "quantity_after": qty_after,
            "reference_type": "SALE",
            "reference_id": sale_id,
            "notes": f"POS Sale Invoice #{invoice_number}",
            "created_at": now
        }
        stock_movements_to_add.append(movement)

    # 5. Create Sale Record
    new_sale = {
        "id": sale_id,
        "invoice_number": invoice_number,
        "customer_id": final_customer_id,
        "subtotal": subtotal,
        "discount": discount,
        "tax": tax,
        "total": grand_total,
        "payment_status": "PAID",
        "sale_status": "COMPLETED",
        "sale_date": today,
        "created_by": current_user.get("id", 1),
        "created_at": now,
        "updated_at": now
    }
    db["sales"].insert_one(new_sale)

    if sale_items_to_add:
        db["sale_items"].insert_many(sale_items_to_add)
    if stock_movements_to_add:
        db["stock_movements"].insert_many(stock_movements_to_add)

    # 6. Create Payment Record
    payment = {
        "id": f"PAY-{uuid.uuid4().hex[:6].upper()}",
        "sale_id": sale_id,
        "payment_method": sale_in.payment_method,
        "amount": grand_total,
        "reference_number": sale_in.payment_reference or "",
        "created_at": now
    }
    db["payments"].insert_one(payment)

    result = clean_doc(new_sale)
    result["items"] = clean_docs(sale_items_to_add)
    result["payments"] = [clean_doc(payment)]
    return result


@router.get("", response_model=List[SaleOut], summary="List Sales with Filters")
def list_sales(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    sale_status: Optional[str] = None,
    payment_status: Optional[str] = None,
    customer_id: Optional[str] = None,
    db = Depends(get_db),
    current_user: dict = Depends(require_authenticated)
):
    query = {}
    if date_from or date_to:
        query["sale_date"] = {}
        if date_from:
            query["sale_date"]["$gte"] = date_from
        if date_to:
            query["sale_date"]["$lte"] = date_to
    if sale_status:
        query["sale_status"] = sale_status
    if payment_status:
        query["payment_status"] = payment_status
    if customer_id:
        query["customer_id"] = customer_id

    cursor = db["sales"].find(query).sort("created_at", DESCENDING)
    sales = clean_docs(cursor)

    for s in sales:
        s["items"] = clean_docs(db["sale_items"].find({"sale_id": s["id"]}))
        s["payments"] = clean_docs(db["payments"].find({"sale_id": s["id"]}))

    return sales


@router.get("/today", response_model=TodaySalesSummary, summary="Today's Sales Register Summary")
def get_today_sales(
    db = Depends(get_db),
    current_user: dict = Depends(require_authenticated)
):
    today = date.today()
    completed_sales = list(db["sales"].find({
        "sale_date": today,
        "sale_status": "COMPLETED"
    }))

    num_bills = len(completed_sales)
    gross_sales = sum(float(s.get("subtotal", 0.0)) for s in completed_sales)
    discount_total = sum(float(s.get("discount", 0.0)) for s in completed_sales)
    tax_total = sum(float(s.get("tax", 0.0)) for s in completed_sales)
    net_sales = sum(float(s.get("total", 0.0)) for s in completed_sales)

    sale_ids = [s["id"] for s in completed_sales]
    cash_total = 0.0
    upi_total = 0.0
    card_total = 0.0

    if sale_ids:
        payments = list(db["payments"].find({"sale_id": {"$in": sale_ids}}))
        for p in payments:
            amt = float(p.get("amount", 0.0))
            method = p.get("payment_method")
            if method == "CASH":
                cash_total += amt
            elif method == "UPI":
                upi_total += amt
            elif method == "CARD":
                card_total += amt

    return {
        "sale_date": today,
        "number_of_bills": num_bills,
        "gross_sales": round(gross_sales, 2),
        "discount_total": round(discount_total, 2),
        "tax_total": round(tax_total, 2),
        "net_sales": round(net_sales, 2),
        "cash_total": round(cash_total, 2),
        "upi_total": round(upi_total, 2),
        "card_total": round(card_total, 2)
    }


@router.get("/summary", response_model=SalesSummary, summary="Date-Range Sales Metrics Summary")
def get_sales_summary(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db = Depends(get_db),
    current_user: dict = Depends(require_authenticated)
):
    query = {"sale_status": "COMPLETED"}
    if date_from or date_to:
        query["sale_date"] = {}
        if date_from:
            query["sale_date"]["$gte"] = date_from
        if date_to:
            query["sale_date"]["$lte"] = date_to

    sales = list(db["sales"].find(query))
    num_bills = len(sales)
    gross_sales = sum(float(s.get("subtotal", 0.0)) for s in sales)
    discount_total = sum(float(s.get("discount", 0.0)) for s in sales)
    tax_total = sum(float(s.get("tax", 0.0)) for s in sales)
    net_sales = sum(float(s.get("total", 0.0)) for s in sales)

    sale_ids = [s["id"] for s in sales]
    cash_total = 0.0
    upi_total = 0.0
    card_total = 0.0

    if sale_ids:
        payments = list(db["payments"].find({"sale_id": {"$in": sale_ids}}))
        for p in payments:
            amt = float(p.get("amount", 0.0))
            method = p.get("payment_method")
            if method == "CASH":
                cash_total += amt
            elif method == "UPI":
                upi_total += amt
            elif method == "CARD":
                card_total += amt

    return {
        "date_from": date_from,
        "date_to": date_to,
        "number_of_bills": num_bills,
        "gross_sales": round(gross_sales, 2),
        "discount_total": round(discount_total, 2),
        "tax_total": round(tax_total, 2),
        "net_sales": round(net_sales, 2),
        "cash_total": round(cash_total, 2),
        "upi_total": round(upi_total, 2),
        "card_total": round(card_total, 2)
    }


@router.get("/{sale_id}", response_model=SaleOut, summary="Get Sale Details")
def get_sale(
    sale_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(require_authenticated)
):
    sale = db["sales"].find_one({"id": sale_id})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    sale = clean_doc(sale)
    sale["items"] = clean_docs(db["sale_items"].find({"sale_id": sale["id"]}))
    sale["payments"] = clean_docs(db["payments"].find({"sale_id": sale["id"]}))
    return sale


@router.get("/{sale_id}/items", response_model=List[SaleItemOut], summary="Get Line Items for a Sale")
def get_sale_items(
    sale_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(require_authenticated)
):
    sale = db["sales"].find_one({"id": sale_id})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return clean_docs(db["sale_items"].find({"sale_id": sale_id}))


@router.get("/{sale_id}/payment", response_model=List[PaymentOut], summary="Get Payments for a Sale")
def get_sale_payments(
    sale_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(require_authenticated)
):
    sale = db["sales"].find_one({"id": sale_id})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return clean_docs(db["payments"].find({"sale_id": sale_id}))


@router.post("/{sale_id}/cancel", response_model=SaleOut, summary="Cancel Sale & Reverse Inventory Stock (Owner Only)")
def cancel_sale(
    sale_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    sale = db["sales"].find_one({"id": sale_id})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    if sale.get("sale_status") == "CANCELLED":
        raise HTTPException(status_code=400, detail="Sale has already been cancelled")
    if sale.get("sale_status") != "COMPLETED":
        raise HTTPException(status_code=400, detail=f"Cannot cancel sale with status '{sale.get('sale_status')}'")

    items = list(db["sale_items"].find({"sale_id": sale_id}))
    now = datetime.utcnow()

    # Reverse Inventory
    for item in items:
        inv_prod_id = item.get("inventory_product_id")
        deduction_qty = float(item.get("deduction_qty", 0.0))

        if inv_prod_id and deduction_qty > 0:
            inv_prod = db["inventory_products"].find_one({"id": inv_prod_id})
            if inv_prod:
                restore_qty = float(item.get("quantity", 0.0)) * deduction_qty
                qty_before = float(inv_prod.get("current_qty", 0.0))
                qty_after = qty_before + restore_qty
                min_lim = float(inv_prod.get("min_limit", 10.0))
                new_status = "OUT_OF_STOCK" if qty_after <= 0 else ("LOW_STOCK" if qty_after <= min_lim else "IN_STOCK")

                db["inventory_products"].update_one(
                    {"id": inv_prod_id},
                    {"$set": {
                        "current_qty": qty_after,
                        "status": new_status,
                        "last_updated": date.today(),
                        "updated_at": now
                    }}
                )

                movement = {
                    "id": f"MOV-{uuid.uuid4().hex[:6].upper()}",
                    "inventory_product_id": inv_prod["id"],
                    "movement_type": "REVERSAL",
                    "quantity": restore_qty,
                    "unit": inv_prod.get("base_unit", "PIECE"),
                    "quantity_before": qty_before,
                    "quantity_after": qty_after,
                    "reference_type": "SALE_CANCELLATION",
                    "reference_id": sale["id"],
                    "notes": f"Reversal for cancelled Sale #{sale['invoice_number']} ({item.get('product_name_snapshot', '')})",
                    "created_at": now
                }
                db["stock_movements"].insert_one(movement)

    db["sales"].update_one(
        {"id": sale_id},
        {"$set": {
            "sale_status": "CANCELLED",
            "payment_status": "REFUNDED",
            "updated_at": now
        }}
    )

    updated_sale = db["sales"].find_one({"id": sale_id})
    result = clean_doc(updated_sale)
    result["items"] = clean_docs(items)
    result["payments"] = clean_docs(db["payments"].find({"sale_id": sale_id}))
    return result
