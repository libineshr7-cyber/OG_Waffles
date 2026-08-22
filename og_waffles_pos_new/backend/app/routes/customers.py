from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import ASCENDING, DESCENDING
import uuid

from app.database import get_db, clean_doc, clean_docs
from app.schemas.customer import (
    CustomerCreate, CustomerUpdate, CustomerOut, CustomerDetailOut
)
from app.schemas.reward import (
    RewardVisitCreate, RewardVisitOut, RewardRedeemCreate, RewardRedemptionOut
)
from app.schemas.sale import SaleOut
from app.auth.dependencies import get_current_user, require_owner, require_authenticated

router = APIRouter(prefix="/api/customers", tags=["Customers & Loyalty"])


def enrich_customer_analytics(cust: dict) -> dict:
    spent = float(cust.get("total_spent", 0.0))
    visits = int(cust.get("visit_count", 0))
    avg_spend = round(spent / visits, 2) if visits > 0 else 0.0
    r_visits = int(cust.get("reward_visits", 0))

    return {
        "id": cust["id"],
        "name": cust["name"],
        "phone": cust["phone"],
        "email": cust.get("email", ""),
        "birthday": cust.get("birthday"),
        "address": cust.get("address", ""),
        "notes": cust.get("notes", ""),
        "total_spent": spent,
        "visit_count": visits,
        "reward_visits": r_visits,
        "reward_redemptions": int(cust.get("reward_redemptions", 0)),
        "last_visit": cust.get("last_visit"),
        "is_deleted": cust.get("is_deleted", False),
        "created_at": cust.get("created_at"),
        "updated_at": cust.get("updated_at"),
        "average_spend": avg_spend,
        "lifetime_value": spent,
        "reward_progress": min(10, r_visits),
        "reward_eligible": r_visits >= 10
    }


@router.get("", response_model=List[CustomerOut], summary="List Active Customers")
def list_customers(
    search: Optional[str] = None,
    include_deleted: bool = False,
    db = Depends(get_db),
    current_user: dict = Depends(require_authenticated)
):
    query = {}
    if not include_deleted:
        query["is_deleted"] = False

    if search:
        s = search.strip()
        query["$or"] = [
            {"name": {"$regex": s, "$options": "i"}},
            {"phone": {"$regex": s, "$options": "i"}}
        ]

    cursor = db["customers"].find(query).sort("name", ASCENDING)
    return [enrich_customer_analytics(c) for c in cursor]


@router.get("/search", response_model=List[CustomerOut], summary="Fast Customer Search by Phone or Name")
def search_customers(
    phone: Optional[str] = None,
    query: Optional[str] = None,
    db = Depends(get_db),
    current_user: dict = Depends(require_authenticated)
):
    db_query = {"is_deleted": False}

    if phone:
        p_clean = phone.strip().replace(" ", "").replace("-", "")
        db_query["phone"] = {"$regex": p_clean, "$options": "i"}
    elif query:
        q = query.strip()
        db_query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"phone": {"$regex": q, "$options": "i"}}
        ]

    cursor = db["customers"].find(db_query).sort("last_visit", DESCENDING).limit(20)
    return [enrich_customer_analytics(c) for c in cursor]


@router.get("/{customer_id}", response_model=CustomerDetailOut, summary="Get Customer Profile & Loyalty History")
def get_customer(
    customer_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(require_authenticated)
):
    cust = db["customers"].find_one({"id": customer_id})
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    recent_sales = list(db["sales"].find({"customer_id": cust["id"]}).sort("created_at", DESCENDING).limit(10))

    sales_summary_list = []
    for s in recent_sales:
        item_count = db["sale_items"].count_documents({"sale_id": s["id"]})
        sales_summary_list.append({
            "id": s["id"],
            "invoice_number": s["invoice_number"],
            "sale_date": str(s.get("sale_date", "")),
            "total": float(s.get("total", 0.0)),
            "sale_status": s.get("sale_status", ""),
            "items_count": item_count
        })

    reward_visits_list = clean_docs(db["reward_visits"].find({"customer_id": cust["id"]}).sort("created_at", DESCENDING))
    reward_redemptions_list = clean_docs(db["reward_redemptions"].find({"customer_id": cust["id"]}).sort("created_at", DESCENDING))

    detail = enrich_customer_analytics(cust)
    detail["recent_purchases"] = sales_summary_list
    detail["reward_visits_history"] = reward_visits_list
    detail["reward_redemptions_history"] = reward_redemptions_list
    return detail


@router.post("", response_model=CustomerOut, status_code=status.HTTP_201_CREATED, summary="Create Customer")
def create_customer(
    cust_in: CustomerCreate,
    db = Depends(get_db),
    current_user: dict = Depends(require_authenticated)
):
    existing = db["customers"].find_one({"phone": cust_in.phone})
    now = datetime.utcnow()

    if existing:
        if existing.get("is_deleted", False):
            update_fields = {
                "is_deleted": False,
                "name": cust_in.name,
                "email": cust_in.email or "",
                "birthday": cust_in.birthday,
                "address": cust_in.address or "",
                "notes": cust_in.notes or "",
                "updated_at": now
            }
            db["customers"].update_one({"id": existing["id"]}, {"$set": update_fields})
            updated = db["customers"].find_one({"id": existing["id"]})
            return enrich_customer_analytics(updated)
        raise HTTPException(
            status_code=400,
            detail=f"Customer with phone number '{cust_in.phone}' already exists"
        )

    cust_id = cust_in.id or f"CUST-{uuid.uuid4().hex[:6].upper()}"
    new_cust = {
        "id": cust_id,
        "name": cust_in.name,
        "phone": cust_in.phone,
        "email": cust_in.email or "",
        "birthday": cust_in.birthday,
        "address": cust_in.address or "",
        "notes": cust_in.notes or "",
        "total_spent": 0.00,
        "visit_count": 0,
        "reward_visits": 0,
        "reward_redemptions": 0,
        "last_visit": None,
        "is_deleted": False,
        "created_at": now,
        "updated_at": now
    }
    db["customers"].insert_one(new_cust)
    return enrich_customer_analytics(new_cust)


@router.put("/{customer_id}", response_model=CustomerOut, summary="Update Customer Profile")
def update_customer(
    customer_id: str,
    cust_in: CustomerUpdate,
    db = Depends(get_db),
    current_user: dict = Depends(require_authenticated)
):
    cust = db["customers"].find_one({"id": customer_id})
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    if cust_in.phone and cust_in.phone != cust.get("phone"):
        duplicate = db["customers"].find_one({"phone": cust_in.phone, "id": {"$ne": customer_id}})
        if duplicate:
            raise HTTPException(
                status_code=400,
                detail=f"Another customer already has phone number '{cust_in.phone}'"
            )

    update_data = cust_in.model_dump(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        db["customers"].update_one({"id": customer_id}, {"$set": update_data})

    updated = db["customers"].find_one({"id": customer_id})
    return enrich_customer_analytics(updated)


@router.delete("/{customer_id}", status_code=status.HTTP_200_OK, summary="Soft Delete Customer (Owner Only)")
def delete_customer(
    customer_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    cust = db["customers"].find_one({"id": customer_id})
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    db["customers"].update_one(
        {"id": customer_id},
        {"$set": {"is_deleted": True, "updated_at": datetime.utcnow()}}
    )
    return {"message": f"Customer '{cust['name']}' soft deleted successfully. Historical sales preserved."}


@router.get("/{customer_id}/sales", response_model=List[SaleOut], summary="Get Customer Complete Purchase History")
def get_customer_sales(
    customer_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(require_authenticated)
):
    cust = db["customers"].find_one({"id": customer_id})
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    cursor = db["sales"].find({"customer_id": customer_id}).sort("created_at", DESCENDING)
    sales = clean_docs(cursor)
    for s in sales:
        s["items"] = clean_docs(db["sale_items"].find({"sale_id": s["id"]}))
        s["payments"] = clean_docs(db["payments"].find({"sale_id": s["id"]}))
    return sales


@router.get("/{customer_id}/rewards", summary="Get Customer Reward Visits & Redemptions")
def get_customer_rewards(
    customer_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(require_authenticated)
):
    cust = db["customers"].find_one({"id": customer_id})
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    visits = clean_docs(db["reward_visits"].find({"customer_id": customer_id}).sort("created_at", DESCENDING))
    redemptions = clean_docs(db["reward_redemptions"].find({"customer_id": customer_id}).sort("created_at", DESCENDING))
    r_visits = int(cust.get("reward_visits", 0))

    return {
        "customer_id": cust["id"],
        "customer_name": cust["name"],
        "reward_visits": r_visits,
        "reward_redemptions": int(cust.get("reward_redemptions", 0)),
        "eligible_for_redemption": r_visits >= 10,
        "visits": visits,
        "redemptions": redemptions
    }


@router.post("/{customer_id}/reward-visit", response_model=RewardVisitOut, status_code=status.HTTP_201_CREATED, summary="Record Loyalty Reward Visit")
def add_reward_visit(
    customer_id: str,
    visit_in: RewardVisitCreate,
    db = Depends(get_db),
    current_user: dict = Depends(require_authenticated)
):
    cust = db["customers"].find_one({"id": customer_id, "is_deleted": False})
    if not cust:
        raise HTTPException(status_code=404, detail="Active customer not found")

    if visit_in.amount <= 0:
        raise HTTPException(status_code=400, detail="Reward visit amount must be greater than zero")

    if visit_in.sale_id:
        sale = db["sales"].find_one({"id": visit_in.sale_id})
        if not sale:
            raise HTTPException(status_code=400, detail=f"Sale '{visit_in.sale_id}' not found")
        if visit_in.amount > float(sale.get("total", 0.0)):
            raise HTTPException(status_code=400, detail="Reward visit amount cannot exceed sale total")

        dup = db["reward_visits"].find_one({
            "customer_id": cust["id"],
            "sale_id": visit_in.sale_id
        })
        if dup:
            raise HTTPException(status_code=400, detail=f"Reward visit has already been recorded for Sale '{visit_in.sale_id}'")

    new_visit_number = int(cust.get("reward_visits", 0)) + 1
    now = datetime.utcnow()

    db["customers"].update_one(
        {"id": cust["id"]},
        {"$set": {"reward_visits": new_visit_number, "updated_at": now}}
    )

    reward_record = {
        "id": f"RV-{uuid.uuid4().hex[:6].upper()}",
        "customer_id": cust["id"],
        "sale_id": visit_in.sale_id,
        "amount": float(visit_in.amount),
        "visit_number": new_visit_number,
        "reward_given": False,
        "created_by": current_user.get("id", 1),
        "created_at": now
    }
    db["reward_visits"].insert_one(reward_record)
    return clean_doc(reward_record)


@router.post("/{customer_id}/redeem", response_model=RewardRedemptionOut, status_code=status.HTTP_201_CREATED, summary="Redeem 10-Visit Loyalty Reward")
def redeem_loyalty_reward(
    customer_id: str,
    redeem_in: RewardRedeemCreate,
    db = Depends(get_db),
    current_user: dict = Depends(require_authenticated)
):
    cust = db["customers"].find_one({"id": customer_id, "is_deleted": False})
    if not cust:
        raise HTTPException(status_code=404, detail="Active customer not found")

    current_reward_visits = int(cust.get("reward_visits", 0))
    if current_reward_visits < 10:
        raise HTTPException(
            status_code=400,
            detail=f"Customer has only {current_reward_visits} reward visits. 10 visits required for redemption."
        )

    new_visits_count = max(0, current_reward_visits - 10)
    new_redemptions_count = int(cust.get("reward_redemptions", 0)) + 1
    now = datetime.utcnow()

    db["customers"].update_one(
        {"id": cust["id"]},
        {"$set": {
            "reward_visits": new_visits_count,
            "reward_redemptions": new_redemptions_count,
            "updated_at": now
        }}
    )

    redemption = {
        "id": f"RR-{uuid.uuid4().hex[:6].upper()}",
        "customer_id": cust["id"],
        "reward_name": redeem_in.reward_name or "Free Waffle / 10 Visits Reward",
        "visit_used": 10,
        "notes": redeem_in.notes or "",
        "created_by": current_user.get("id", 1),
        "created_at": now
    }
    db["reward_redemptions"].insert_one(redemption)
    return clean_doc(redemption)
