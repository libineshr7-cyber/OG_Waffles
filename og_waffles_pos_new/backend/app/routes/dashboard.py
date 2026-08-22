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

    # 1. Today Metrics
    today_sales = list(db["sales"].find({
        "sale_date": today,
        "sale_status": "COMPLETED"
    }))
    today_sales_total = sum(float(s.get("total", 0.0)) for s in today_sales)
    today_bills = len(today_sales)

    today_expenses = list(db["expenses"].find({
        "expense_date": today,
        "is_deleted": False
    }))
    today_exp_total = sum(float(e.get("amount", 0.0)) for e in today_expenses)
    today_profit = today_sales_total - today_exp_total

    # 2. This Month Metrics
    month_sales = list(db["sales"].find({
        "sale_date": {"$gte": month_start, "$lte": today},
        "sale_status": "COMPLETED"
    }))
    month_sales_total = sum(float(s.get("total", 0.0)) for s in month_sales)
    month_bills = len(month_sales)

    month_expenses = list(db["expenses"].find({
        "expense_date": {"$gte": month_start, "$lte": today},
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
            "profit": round(today_profit, 2)
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
