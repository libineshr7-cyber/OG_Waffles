import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User

client = TestClient(app)

def run_manual_v8_verification():
    print("==================================================")
    print("STARTING V8 MANUAL FLOW VERIFICATIONS (TESTS A - G)")
    print("==================================================")

    # 1. Login as Owner
    res_owner = client.post("/api/auth/login", json={"username": "owner_dev", "password": "owner123"})
    assert res_owner.status_code == 200, f"Owner login failed: {res_owner.text}"
    owner_headers = {"Authorization": f"Bearer {res_owner.json()['access_token']}"}

    # 2. Login as Cashier
    res_cashier = client.post("/api/auth/login", json={"username": "cashier_dev", "password": "cashier123"})
    assert res_cashier.status_code == 200, f"Cashier login failed: {res_cashier.text}"
    cashier_headers = {"Authorization": f"Bearer {res_cashier.json()['access_token']}"}

    print("[OK] Auth: Owner and Cashier tokens generated successfully.")

    # ----------------------------------------------------
    # TEST A: Purchase -> inventory increases -> avg cost updates -> PURCHASE movement
    # ----------------------------------------------------
    print("\n--- TEST A: Purchase Flow ---")
    sup_res = client.post("/api/suppliers", headers=owner_headers, json={"name": "V8 Verification Supplier", "contact_person": "Sup Lead"})
    sup_id = sup_res.json()["id"]

    inv_res = client.post("/api/inventory", headers=owner_headers, json={
        "name": "Belgian Flour Mix V8",
        "category": "Baking",
        "purchase_unit": "PACKET",
        "base_unit": "GRAM",
        "conversion_qty": 1000.0,
        "current_qty": 5000.0,
        "min_limit": 2000.0,
        "avg_cost": 0.10,
        "supplier_id": sup_id
    })
    inv_id = inv_res.json()["id"]

    pur_res = client.post("/api/purchases", headers=owner_headers, json={
        "supplier_id": sup_id,
        "invoice_number": "INV-MANUAL-V8-01",
        "purchase_date": "2026-08-20",
        "tax": 0.0,
        "discount": 0.0,
        "notes": "Manual Test A verification purchase",
        "items": [
            {
                "inventory_product_id": inv_id,
                "purchase_qty": 5.0,
                "purchase_unit": "PACKET",
                "conversion_qty": 1000.0,
                "unit_cost": 200.0  # 5 * 200 = 1000 total cost for 5000g
            }
        ]
    })
    assert pur_res.status_code == 201, f"Purchase failed: {pur_res.text}"
    pur_id = pur_res.json()["id"]

    # Verify inventory qty & avg cost
    inv_after = client.get(f"/api/inventory/{inv_id}", headers=owner_headers).json()
    assert inv_after["current_qty"] == 10000.0, f"Expected 10000g, got {inv_after['current_qty']}"
    assert inv_after["avg_cost"] == 0.15, f"Expected 0.15, got {inv_after['avg_cost']}"

    # Verify stock movement
    movs = client.get(f"/api/inventory/movements?inventory_product_id={inv_id}", headers=owner_headers).json()
    pur_mov = next((m for m in movs if m["reference_id"] == pur_id), None)
    assert pur_mov is not None, "PURCHASE stock movement not found"
    assert pur_mov["movement_type"] == "PURCHASE"
    print(f"[OK] TEST A Passed: Purchase {pur_id} restocked +5000g (Total: 10000g, avg_cost: Rs. 0.15/g) with PURCHASE movement.")

    # ----------------------------------------------------
    # TEST B: Expense -> appears in Expenses -> appears in Reports/Dashboard
    # ----------------------------------------------------
    print("\n--- TEST B: Expense Outflow ---")
    exp_res = client.post("/api/expenses", headers=owner_headers, json={
        "category": "Marketing",
        "description": "V8 Social Media Ad Campaign",
        "amount": 2500.00,
        "expense_date": "2026-08-20",
        "payment_method": "UPI",
        "reference_number": "UPI-AD-101",
        "notes": "Verified outflow"
    })
    assert exp_res.status_code == 201, f"Expense failed: {exp_res.text}"
    exp_id = exp_res.json()["id"]

    exp_list = client.get("/api/expenses", headers=owner_headers).json()
    assert any(e["id"] == exp_id for e in exp_list), "Expense not in list"
    print(f"[OK] TEST B Passed: Expense {exp_id} (Rs. 2,500 Marketing) logged and listed successfully.")

    # ----------------------------------------------------
    # TEST C & G: Sale -> Dashboard, Reports, and Profit calculation
    # ----------------------------------------------------
    print("\n--- TEST C & G: Sale & Reports Analytics ---")
    cat_res = client.post("/api/categories", headers=owner_headers, json={"name": "V8 Verif Cat"})
    cat_id = cat_res.json()["id"]

    prod_res = client.post("/api/products", headers=owner_headers, json={
        "name": "Luxury Waffle V8",
        "category_id": cat_id,
        "price": 350.00
    })
    prod_id = prod_res.json()["id"]

    sale_res = client.post("/api/sales", headers=cashier_headers, json={
        "order_type": "DINE_IN",
        "subtotal": 700.00,
        "tax": 35.00,
        "discount": 0.00,
        "total": 735.00,
        "items": [{"product_id": prod_id, "quantity": 2, "unit_price": 350.00}],
        "payments": [{"payment_method": "UPI", "amount": 735.00}]
    })
    assert sale_res.status_code == 201, f"Sale failed: {sale_res.text}"
    sale_id = sale_res.json()["id"]

    dash = client.get("/api/dashboard", headers=owner_headers).json()
    assert dash["today"]["sales"] >= 735.00, f"Dashboard sales not updated: {dash['today']['sales']}"

    profit = client.get("/api/reports/profit?date_from=2026-08-20&date_to=2026-08-20", headers=owner_headers).json()
    assert profit["net_sales"] >= 735.00, f"Profit net_sales not updated: {profit['net_sales']}"
    assert profit["expenses"] >= 2500.00, f"Profit expenses not updated: {profit['expenses']}"
    print(f"[OK] TEST C & G Passed: Sale {sale_id} dynamically updated Dashboard (Today sales: Rs. {dash['today']['sales']}) and Profit Reports.")

    # ----------------------------------------------------
    # TEST D & E & F: Rewards Visit, Duplicate Prevention, and Redemption
    # ----------------------------------------------------
    print("\n--- TEST D, E, F: Loyalty Rewards Flow ---")
    cust_res = client.post("/api/customers", headers=cashier_headers, json={
        "name": "Loyal Customer V8",
        "phone": "9999888877",
        "email": "loyal@example.com"
    })
    cust_id = cust_res.json()["id"]

    # TEST D: Record reward visit
    visit1 = client.post(f"/api/customers/{cust_id}/reward-visit", headers=cashier_headers, json={
        "amount": 735.00,
        "sale_id": sale_id
    })
    assert visit1.status_code == 201, f"Reward visit failed: {visit1.text}"
    print(f"[OK] TEST D Passed: Recorded reward visit 1 for Customer {cust_id} with sale {sale_id}.")

    # TEST E: Duplicate reward visit on same sale
    dup_visit = client.post(f"/api/customers/{cust_id}/reward-visit", headers=cashier_headers, json={
        "amount": 735.00,
        "sale_id": sale_id
    })
    assert dup_visit.status_code == 400, "Duplicate reward visit should be rejected with 400"
    print(f"[OK] TEST E Passed: Duplicate reward visit on sale {sale_id} correctly rejected (400 Bad Request).")

    # Accumulate 9 more visits to reach 10
    for _ in range(9):
        client.post(f"/api/customers/{cust_id}/reward-visit", headers=cashier_headers, json={"amount": 300.0})

    status_10 = client.get(f"/api/customers/{cust_id}/rewards", headers=cashier_headers).json()
    assert status_10["eligible_for_redemption"] is True, "Customer should be eligible for redemption"
    assert status_10["reward_visits"] == 10

    # TEST F: Redeem reward
    redeem = client.post(f"/api/customers/{cust_id}/redeem", headers=cashier_headers, json={
        "reward_name": "Free Golden Waffle",
        "notes": "10-visit celebration"
    })
    assert redeem.status_code == 201, f"Redeem failed: {redeem.text}"

    status_after = client.get(f"/api/customers/{cust_id}/rewards", headers=cashier_headers).json()
    assert status_after["reward_visits"] == 0, f"Expected 0 visits, got {status_after['reward_visits']}"
    assert status_after["reward_redemptions"] == 1, f"Expected 1 redemption, got {status_after['reward_redemptions']}"
    print(f"[OK] TEST F Passed: Reward redeemed successfully. Visits reset to 0, redemptions count incremented to 1.")

    print("\n==================================================")
    print("ALL V8 MANUAL VERIFICATION TESTS (A - G) PASSED 100%!")
    print("==================================================")

if __name__ == "__main__":
    run_manual_v8_verification()
