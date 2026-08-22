from typing import List, Optional
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import ASCENDING, DESCENDING

from app.database import get_db, clean_doc, clean_docs
from app.schemas.report import (
    TodayReportOut, SalesReportOut, ProductSalesReportItem, CategorySalesReportItem,
    ExpenseReportOut, PurchaseReportOut, ProfitReportOut, InventoryValuationReportOut,
    DailyTrendItem, TopProductItem
)
from app.auth.dependencies import require_owner, require_authenticated

router = APIRouter(prefix="/api/reports", tags=["Reports & Analytics"])


@router.get("/today", response_model=TodayReportOut, summary="Today's Register & Sales Report (Cashier & Owner)")
def get_today_report(
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

    expenses = list(db["expenses"].find({
        "expense_date": today,
        "is_deleted": False
    }))
    total_expenses = sum(float(e.get("amount", 0.0)) for e in expenses)
    net_after_expenses = round(net_sales - total_expenses, 2)

    return {
        "report_date": today,
        "number_of_bills": num_bills,
        "gross_sales": round(gross_sales, 2),
        "discount_total": round(discount_total, 2),
        "tax_total": round(tax_total, 2),
        "net_sales": round(net_sales, 2),
        "cash_total": round(cash_total, 2),
        "upi_total": round(upi_total, 2),
        "card_total": round(card_total, 2),
        "total_expenses": round(total_expenses, 2),
        "net_after_expenses": net_after_expenses
    }


@router.get("/sales", response_model=SalesReportOut, summary="Date-Range Sales Report (Owner Only)")
def get_sales_report(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    query = {}
    if date_from or date_to:
        query["sale_date"] = {}
        if date_from:
            query["sale_date"]["$gte"] = date_from
        if date_to:
            query["sale_date"]["$lte"] = date_to

    all_sales = list(db["sales"].find(query))
    completed_sales = [s for s in all_sales if s.get("sale_status") == "COMPLETED"]
    cancelled_count = sum(1 for s in all_sales if s.get("sale_status") == "CANCELLED")

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
        "date_from": date_from,
        "date_to": date_to,
        "number_of_bills": num_bills,
        "gross_sales": round(gross_sales, 2),
        "discount_total": round(discount_total, 2),
        "tax_total": round(tax_total, 2),
        "net_sales": round(net_sales, 2),
        "cash_total": round(cash_total, 2),
        "upi_total": round(upi_total, 2),
        "card_total": round(card_total, 2),
        "cancelled_sales_count": cancelled_count
    }


@router.get("/products", response_model=List[ProductSalesReportItem], summary="Sales By Product (Owner Only)")
def get_sales_by_product(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    sales_q = {"sale_status": "COMPLETED"}
    if date_from or date_to:
        sales_q["sale_date"] = {}
        if date_from:
            sales_q["sale_date"]["$gte"] = date_from
        if date_to:
            sales_q["sale_date"]["$lte"] = date_to

    completed_sales = list(db["sales"].find(sales_q))
    sale_ids = [s["id"] for s in completed_sales]

    items = list(db["sale_items"].find({"sale_id": {"$in": sale_ids}})) if sale_ids else []
    grouped = {}
    for item in items:
        pid = item["product_id"]
        if pid not in grouped:
            grouped[pid] = {
                "product_id": pid,
                "product_name": item.get("product_name_snapshot", pid),
                "quantity_sold": 0.0,
                "gross_sales": 0.0,
                "discount": 0.0,
                "tax": 0.0,
                "net_sales": 0.0
            }
        qty = float(item.get("quantity", 0.0))
        unit_p = float(item.get("unit_price", 0.0))
        grouped[pid]["quantity_sold"] += qty
        grouped[pid]["gross_sales"] += unit_p * qty
        grouped[pid]["discount"] += float(item.get("line_discount", 0.0))
        grouped[pid]["tax"] += float(item.get("line_tax", 0.0))
        grouped[pid]["net_sales"] += float(item.get("line_total", 0.0))

    result = list(grouped.values())
    for r in result:
        r["gross_sales"] = round(r["gross_sales"], 2)
        r["discount"] = round(r["discount"], 2)
        r["tax"] = round(r["tax"], 2)
        r["net_sales"] = round(r["net_sales"], 2)

    result.sort(key=lambda x: x["net_sales"], reverse=True)
    return result


@router.get("/categories", response_model=List[CategorySalesReportItem], summary="Sales By Category (Owner Only)")
def get_sales_by_category(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    sales_q = {"sale_status": "COMPLETED"}
    if date_from or date_to:
        sales_q["sale_date"] = {}
        if date_from:
            sales_q["sale_date"]["$gte"] = date_from
        if date_to:
            sales_q["sale_date"]["$lte"] = date_to

    completed_sales = list(db["sales"].find(sales_q))
    sale_ids = [s["id"] for s in completed_sales]

    items = list(db["sale_items"].find({"sale_id": {"$in": sale_ids}})) if sale_ids else []

    products_map = {p["id"]: p for p in db["products"].find()}
    categories_map = {c["id"]: c for c in db["categories"].find()}

    grouped = {}
    for item in items:
        pid = item.get("product_id")
        prod = products_map.get(pid, {})
        cat_id = prod.get("category_id", "uncategorized")
        cat = categories_map.get(cat_id, {})
        cat_name = cat.get("name", "Other")

        if cat_id not in grouped:
            grouped[cat_id] = {
                "category_id": cat_id,
                "category_name": cat_name,
                "quantity_sold": 0.0,
                "net_sales": 0.0
            }
        grouped[cat_id]["quantity_sold"] += float(item.get("quantity", 0.0))
        grouped[cat_id]["net_sales"] += float(item.get("line_total", 0.0))

    result = list(grouped.values())
    for r in result:
        r["net_sales"] = round(r["net_sales"], 2)

    result.sort(key=lambda x: x["net_sales"], reverse=True)
    return result


@router.get("/expenses", response_model=ExpenseReportOut, summary="Expense Report & Category Breakdown (Owner Only)")
def get_expenses_report(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    query = {"is_deleted": False}
    if date_from or date_to:
        query["expense_date"] = {}
        if date_from:
            query["expense_date"]["$gte"] = date_from
        if date_to:
            query["expense_date"]["$lte"] = date_to

    expenses = list(db["expenses"].find(query))
    total_expenses = sum(float(e.get("amount", 0.0)) for e in expenses)

    breakdown_map = {}
    for e in expenses:
        cat = e.get("category", "Other")
        if cat not in breakdown_map:
            breakdown_map[cat] = {"category": cat, "amount": 0.0, "count": 0}
        breakdown_map[cat]["amount"] += float(e.get("amount", 0.0))
        breakdown_map[cat]["count"] += 1

    breakdown_list = list(breakdown_map.values())
    for b in breakdown_list:
        b["amount"] = round(b["amount"], 2)
    breakdown_list.sort(key=lambda x: x["amount"], reverse=True)

    return {
        "date_from": date_from,
        "date_to": date_to,
        "total_expenses": round(total_expenses, 2),
        "category_breakdown": breakdown_list
    }


@router.get("/purchases", response_model=PurchaseReportOut, summary="Purchase Report & Supplier Breakdown (Owner Only)")
def get_purchases_report(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    query = {}
    if date_from or date_to:
        query["purchase_date"] = {}
        if date_from:
            query["purchase_date"]["$gte"] = date_from
        if date_to:
            query["purchase_date"]["$lte"] = date_to

    purchases = list(db["purchases"].find(query))
    total_cost = sum(float(p.get("total", 0.0)) for p in purchases)

    suppliers_map = {s["id"]: s for s in db["suppliers"].find()}

    sup_map = {}
    for p in purchases:
        sid = p.get("supplier_id")
        sup = suppliers_map.get(sid, {})
        sname = sup.get("name", sid)
        if sid not in sup_map:
            sup_map[sid] = {
                "supplier_id": sid,
                "supplier_name": sname,
                "purchase_count": 0,
                "purchase_total": 0.0
            }
        sup_map[sid]["purchase_count"] += 1
        sup_map[sid]["purchase_total"] += float(p.get("total", 0.0))

    sup_list = list(sup_map.values())
    for s in sup_list:
        s["purchase_total"] = round(s["purchase_total"], 2)
    sup_list.sort(key=lambda x: x["purchase_total"], reverse=True)

    return {
        "date_from": date_from,
        "date_to": date_to,
        "number_of_purchases": len(purchases),
        "total_purchase_cost": round(total_cost, 2),
        "supplier_breakdown": sup_list
    }


@router.get("/profit", response_model=ProfitReportOut, summary="Profit & Loss Report (Owner Only)")
def get_profit_report(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    sales_q = {"sale_status": "COMPLETED"}
    if date_from or date_to:
        sales_q["sale_date"] = {}
        if date_from:
            sales_q["sale_date"]["$gte"] = date_from
        if date_to:
            sales_q["sale_date"]["$lte"] = date_to

    completed_sales = list(db["sales"].find(sales_q))
    net_sales = sum(float(s.get("total", 0.0)) for s in completed_sales)
    sale_ids = [s["id"] for s in completed_sales]

    # COGS calculation
    cogs_total = 0.0
    if sale_ids:
        sale_items = list(db["sale_items"].find({"sale_id": {"$in": sale_ids}}))
        inv_map = {i["id"]: i for i in db["inventory_products"].find()}
        for si in sale_items:
            inv_id = si.get("inventory_product_id")
            deduct_q = float(si.get("deduction_qty", 0.0))
            if inv_id and deduct_q > 0:
                inv_prod = inv_map.get(inv_id, {})
                avg_cost = float(inv_prod.get("avg_cost", 0.0))
                line_cogs = float(si.get("quantity", 0.0)) * deduct_q * avg_cost
                cogs_total += line_cogs

    exp_q = {"is_deleted": False}
    if date_from or date_to:
        exp_q["expense_date"] = {}
        if date_from:
            exp_q["expense_date"]["$gte"] = date_from
        if date_to:
            exp_q["expense_date"]["$lte"] = date_to

    expenses = list(db["expenses"].find(exp_q))
    total_expenses = sum(float(e.get("amount", 0.0)) for e in expenses)

    gross_profit = net_sales - cogs_total
    net_profit = gross_profit - total_expenses
    profit_margin = round((net_profit / net_sales) * 100, 2) if net_sales > 0 else 0.0

    return {
        "date_from": date_from,
        "date_to": date_to,
        "net_sales": round(net_sales, 2),
        "cost_of_goods_sold": round(cogs_total, 2),
        "gross_profit": round(gross_profit, 2),
        "expenses": round(total_expenses, 2),
        "net_profit": round(net_profit, 2),
        "profit_margin_percentage": profit_margin
    }


@router.get("/inventory-value", response_model=InventoryValuationReportOut, summary="Inventory Stock Valuation (Owner Only)")
def get_inventory_valuation(
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    inv_items = list(db["inventory_products"].find().sort("name", ASCENDING))
    items_out = []
    total_val = 0.0

    for item in inv_items:
        qty = float(item.get("current_qty", 0.0))
        cost = float(item.get("avg_cost", 0.0))
        val = round(qty * cost, 2)
        total_val += val

        items_out.append({
            "inventory_product_id": item["id"],
            "product_name": item["name"],
            "current_qty": qty,
            "base_unit": item["base_unit"],
            "avg_cost": cost,
            "inventory_value": val
        })

    return {
        "total_inventory_value": round(total_val, 2),
        "items": items_out
    }


@router.get("/sales-trend", response_model=List[DailyTrendItem], summary="Daily Sales Trend Timeline (Owner Only)")
def get_sales_trend(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    start_d = date_from or (date.today() - timedelta(days=6))
    end_d = date_to or date.today()

    trend = []
    curr = start_d
    while curr <= end_d:
        sales = list(db["sales"].find({
            "sale_date": curr,
            "sale_status": "COMPLETED"
        }))
        bills = len(sales)
        net_sales = sum(float(s.get("total", 0.0)) for s in sales)

        expenses = list(db["expenses"].find({
            "expense_date": curr,
            "is_deleted": False
        }))
        exp_total = sum(float(e.get("amount", 0.0)) for e in expenses)
        profit = net_sales - exp_total

        trend.append({
            "date": curr,
            "bills": bills,
            "net_sales": round(net_sales, 2),
            "expenses": round(exp_total, 2),
            "profit": round(profit, 2)
        })
        curr += timedelta(days=1)

    return trend


@router.get("/top-products", response_model=List[TopProductItem], summary="Top Selling Products (Owner Only)")
def get_top_products(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = 10,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    items = get_sales_by_product(date_from, date_to, db, current_user)
    top = items[:limit]
    return [
        {
            "product_id": t["product_id"],
            "product_name": t["product_name"],
            "quantity_sold": t["quantity_sold"],
            "net_sales": t["net_sales"]
        }
        for t in top
    ]
