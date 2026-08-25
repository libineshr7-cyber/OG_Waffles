from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends
from app.database import get_db
from app.schemas.report import DashboardMetrics
from app.auth.dependencies import require_owner

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardMetrics, summary="Executive Owner Dashboard Summary (Owner Only)")
def get_dashboard(
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    today = date.today()
    month_start = today.replace(day=1)
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    month_start_dt = datetime.combine(month_start, datetime.min.time())

    # 1. Today Metrics
    today_sales = list(db["sales"].find({
        "$or": [
            {"sale_date": {"$gte": today_start, "$lte": today_end}},
            {"sale_date": today.isoformat()},
            {"sale_date": str(today)}
        ],
        "sale_status": "COMPLETED"
    }))
    today_sales_total = sum(float(s.get("total", 0.0)) for s in today_sales)
    today_bills = len(today_sales)

    today_expenses = list(db["expenses"].find({
        "$or": [
            {"expense_date": {"$gte": today_start, "$lte": today_end}},
            {"expense_date": today.isoformat()},
            {"expense_date": str(today)}
        ],
        "is_deleted": False
    }))
    today_exp_total = sum(float(e.get("amount", 0.0)) for e in today_expenses)
    today_profit = today_sales_total - today_exp_total

    # Today's Payment Method Distribution
    today_sale_ids = [s["id"] for s in today_sales]
    today_cash = 0.0
    today_upi = 0.0
    today_card = 0.0
    today_split = 0.0
    if today_sale_ids:
        for p in db["payments"].find({"sale_id": {"$in": today_sale_ids}}):
            amt = float(p.get("amount", 0.0))
            m_type = p.get("payment_method")
            if m_type == "CASH":
                today_cash += amt
            elif m_type == "UPI":
                today_upi += amt
            elif m_type == "CARD":
                today_card += amt
            elif m_type == "SPLIT":
                today_split += amt

    # 2. This Month Metrics
    month_sales = list(db["sales"].find({
        "$or": [
            {"sale_date": {"$gte": month_start_dt, "$lte": today_end}},
            {"sale_date": {"$gte": month_start.isoformat(), "$lte": today.isoformat()}}
        ],
        "sale_status": "COMPLETED"
    }))
    month_sales_total = sum(float(s.get("total", 0.0)) for s in month_sales)
    month_bills = len(month_sales)

    month_expenses = list(db["expenses"].find({
        "$or": [
            {"expense_date": {"$gte": month_start_dt, "$lte": today_end}},
            {"expense_date": {"$gte": month_start.isoformat(), "$lte": today.isoformat()}}
        ],
        "is_deleted": False
    }))
    month_exp_total = sum(float(e.get("amount", 0.0)) for e in month_expenses)
    month_profit = month_sales_total - month_exp_total

    # 3. Inventory Stock Metrics
    inv_items = list(db["inventory_products"].find())
    total_inv_value = sum(float(i.get("current_qty", 0.0)) * float(i.get("avg_cost", 0.0)) for i in inv_items)
    low_stock_count = sum(1 for i in inv_items if i.get("status") == "LOW_STOCK")
    out_of_stock_count = sum(1 for i in inv_items if i.get("status") == "OUT_OF_STOCK")

    # 4. Customer Metrics
    active_customers_count = db["customers"].count_documents({"is_deleted": False})
    new_customers_month = db["customers"].count_documents({
        "is_deleted": False,
        "created_at": {"$gte": datetime.combine(month_start, datetime.min.time())}
    })

    # 5. Rewards Metrics
    eligible_rewards_count = db["customers"].count_documents({
        "is_deleted": False,
        "reward_visits": {"$gte": 10}
    })

    return {
        "today": {
            "sales": round(today_sales_total, 2),
            "bills": today_bills,
            "expenses": round(today_exp_total, 2),
            "profit": round(today_profit, 2),
            "cash_total": round(today_cash, 2),
            "upi_total": round(today_upi, 2),
            "card_total": round(today_card, 2),
            "split_total": round(today_split, 2)
        },
        "this_month": {
            "sales": round(month_sales_total, 2),
            "bills": month_bills,
            "expenses": round(month_exp_total, 2),
            "profit": round(month_profit, 2)
        },
        "inventory": {
            "total_inventory_value": round(total_inv_value, 2),
            "low_stock_count": low_stock_count,
            "out_of_stock_count": out_of_stock_count
        },
        "customers": {
            "total_active_customers": active_customers_count,
            "new_customers_this_month": new_customers_month
        },
        "rewards": {
            "eligible_customers": eligible_rewards_count
        }
    }
