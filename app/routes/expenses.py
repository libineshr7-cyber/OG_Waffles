from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import DESCENDING
import uuid

from app.database import get_db, clean_doc, clean_docs
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseOut
from app.auth.dependencies import require_owner

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])


@router.get("", response_model=List[ExpenseOut], summary="List Expenses (Owner Only)")
def list_expenses(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    category: Optional[str] = None,
    include_deleted: bool = False,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    query = {}
    if not include_deleted:
        query["is_deleted"] = False

    if date_from or date_to:
        query["expense_date"] = {}
        if date_from:
            query["expense_date"]["$gte"] = date_from
        if date_to:
            query["expense_date"]["$lte"] = date_to

    if category:
        query["category"] = category

    cursor = db["expenses"].find(query).sort([("expense_date", DESCENDING), ("created_at", DESCENDING)])
    return clean_docs(cursor)


@router.get("/{expense_id}", response_model=ExpenseOut, summary="Get Expense Details (Owner Only)")
def get_expense(
    expense_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    exp = db["expenses"].find_one({"id": expense_id})
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")
    return clean_doc(exp)


@router.post("", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED, summary="Create Expense (Owner Only)")
def create_expense(
    exp_in: ExpenseCreate,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    if exp_in.amount <= 0:
        raise HTTPException(status_code=400, detail="Expense amount must be greater than zero")

    exp_id = exp_in.id or f"EXP-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.utcnow()

    new_expense = {
        "id": exp_id,
        "category": exp_in.category or "Other",
        "description": exp_in.description,
        "amount": float(exp_in.amount),
        "expense_date": exp_in.expense_date or date.today(),
        "payment_method": exp_in.payment_method or "CASH",
        "reference_number": exp_in.reference_number or "",
        "notes": exp_in.notes or "",
        "created_by": current_user.get("id", 1),
        "is_deleted": False,
        "created_at": now,
        "updated_at": now
    }
    db["expenses"].insert_one(new_expense)
    return clean_doc(new_expense)


@router.put("/{expense_id}", response_model=ExpenseOut, summary="Update Expense (Owner Only)")
def update_expense(
    expense_id: str,
    exp_in: ExpenseUpdate,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    exp = db["expenses"].find_one({"id": expense_id})
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")

    if exp_in.amount is not None and exp_in.amount <= 0:
        raise HTTPException(status_code=400, detail="Expense amount must be greater than zero")

    update_data = exp_in.model_dump(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        db["expenses"].update_one({"id": expense_id}, {"$set": update_data})

    updated = db["expenses"].find_one({"id": expense_id})
    return clean_doc(updated)


@router.delete("/{expense_id}", status_code=status.HTTP_200_OK, summary="Soft Delete Expense (Owner Only)")
def delete_expense(
    expense_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(require_owner)
):
    exp = db["expenses"].find_one({"id": expense_id})
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")

    db["expenses"].update_one(
        {"id": expense_id},
        {"$set": {"is_deleted": True, "updated_at": datetime.utcnow()}}
    )
    return {"message": f"Expense '{exp['description']}' soft deleted successfully"}
