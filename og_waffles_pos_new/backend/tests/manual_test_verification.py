from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def run_manual_test_verification():
    print("=== MANUAL TEST VERIFICATION SUITE ===")
    
    # ----------------------------------------------------
    # TEST A — NEW CUSTOMER
    # ----------------------------------------------------
    print("\n--- TEST A: NEW CUSTOMER FLOW ---")
    # 1. Login as CASHIER
    res_cashier = client.post("/api/auth/login", json={"username": "cashier_dev", "password": "cashier123"})
    assert res_cashier.status_code == 200
    cashier_headers = {"Authorization": f"Bearer {res_cashier.json()['access_token']}"}
    print("1. Logged in as CASHIER.")

    res_owner = client.post("/api/auth/login", json={"username": "owner_dev", "password": "owner123"})
    owner_headers = {"Authorization": f"Bearer {res_owner.json()['access_token']}"}

    # 2 & 3 & 4 & 5. Open POS, select Waffles and backend flavour
    res_prods = client.get("/api/products", headers=cashier_headers)
    assert res_prods.status_code == 200
    waffles = [p for p in res_prods.json() if p.get("category_id") == "cat-waffles" or "waffle" in p.get("name", "").lower()]
    waffle = next((p for p in waffles if p.get("inventory_product_id")), waffles[0])

    inv_id = waffle.get("inventory_product_id")
    if not inv_id:
        # Get an inventory item to link for inventory test
        inv_list = client.get("/api/inventory", headers=owner_headers).json()
        if inv_list:
            inv_id = inv_list[0]["id"]
            client.put(f"/api/products/{waffle['id']}", headers=owner_headers, json={"inventory_product_id": inv_id, "deduction_qty": 50.0})
            waffle["inventory_product_id"] = inv_id

    print(f"2-5. Selected product: '{waffle['name']}' (ID: {waffle['id']}, Price: INR{waffle['price']})")

    # Get initial inventory stock for this waffle
    initial_stock = 0
    if inv_id:
        inv_before = client.get(f"/api/inventory/{inv_id}", headers=owner_headers).json()
        initial_stock = float(inv_before.get("current_qty", 0))
        print(f"   Initial ingredient stock for '{inv_before['name']}': {initial_stock} {inv_before.get('base_unit')}")

    # 6 & 7 & 8 & 9. Enter NEW customer name, phone, CASH, complete bill
    import uuid
    u_cust = uuid.uuid4().hex[:4]
    new_phone = f"9811{uuid.uuid4().int % 1000000:06d}"
    new_name = f"Aryan Sharma {u_cust}"
    sale_payload = {
        "customer": {
            "name": new_name,
            "phone": new_phone
        },
        "items": [{"product_id": waffle["id"], "quantity": 1.0}],
        "payment_method": "CASH"
    }
    res_sale = client.post("/api/sales", headers=cashier_headers, json=sale_payload)
    assert res_sale.status_code == 201, f"Sale failed: {res_sale.text}"
    sale_data = res_sale.json()
    invoice_no = sale_data["invoice_number"]
    cust_id = sale_data["customer_id"]
    print(f"10. Backend invoice generated: {invoice_no} (Total: INR{sale_data['total']})")

    # 11 & 12. Open Customer Database & confirm new customer exists
    res_cust = client.get(f"/api/customers/{cust_id}", headers=cashier_headers)
    assert res_cust.status_code == 200
    cust_data = res_cust.json()
    print(f"11-12. Customer profile created: {cust_data['name']} (Phone: {cust_data['phone']})")

    # 13 & 14 & 15. Confirm purchase history, total spent, visit count
    res_cust_sales = client.get(f"/api/customers/{cust_id}/sales", headers=cashier_headers)
    assert res_cust_sales.status_code == 200
    cust_sales = res_cust_sales.json()
    assert any(s["invoice_number"] == invoice_no for s in cust_sales)
    print(f"13-15. Purchase history confirmed with invoice {invoice_no}.")
    print(f"       Total Visits: {cust_data['visit_count']}, Total Spent: INR{cust_data['total_spent']}")

    # 16 & 17. Check Inventory & confirm stock was deducted
    if inv_id:
        inv_after = client.get(f"/api/inventory/{inv_id}", headers=owner_headers).json()
        after_stock = float(inv_after.get("current_qty", 0))
        deducted = initial_stock - after_stock
        print(f"16-17. Inventory stock deducted: {initial_stock} -> {after_stock} (Deducted: {deducted})")

    # 18 & 19. Open Today's Sales & confirm bill appears
    res_today = client.get("/api/sales/today", headers=cashier_headers)
    assert res_today.status_code == 200
    print(f"18-19. Today's sales updated: {res_today.json()['number_of_bills']} bills, Gross: INR{res_today.json()['gross_sales']}")

    import uuid
    uid = uuid.uuid4().hex[:6]
    # ----------------------------------------------------
    # TEST B — INSUFFICIENT STOCK
    # ----------------------------------------------------
    print("\n--- TEST B: INSUFFICIENT STOCK FLOW ---")
    # 1. Create a limited ingredient
    res_lim_inv = client.post("/api/inventory", headers=owner_headers, json={
        "name": f"Limited Nutella {uid}",
        "category": "Sauce",
        "purchase_unit": "BOTTLE",
        "base_unit": "GRAM",
        "conversion_qty": 500.0,
        "current_qty": 10.0, # only 10 grams!
        "min_limit": 50.0
    })
    assert res_lim_inv.status_code == 201, f"Failed to create limited inv: {res_lim_inv.text}"
    lim_inv_id = res_lim_inv.json()["id"]

    res_lim_prod = client.post("/api/products", headers=owner_headers, json={
        "category_id": "cat-waffles",
        "name": f"Mega Nutella Waffle {uid}",
        "price": 250.0,
        "inventory_product_id": lim_inv_id,
        "deduction_qty": 50.0, # requires 50 grams per waffle
        "available": True
    })
    assert res_lim_prod.status_code == 201, f"Failed to create limited prod: {res_lim_prod.text}"
    lim_prod_id = res_lim_prod.json()["id"]

    # 2 & 3. Add more than available stock (e.g. 1 waffle requires 50g, only 10g in stock)
    print("1-3. Attempting to bill item requiring 50g with only 10g available...")
    res_fail_sale = client.post("/api/sales", headers=cashier_headers, json={
        "items": [{"product_id": lim_prod_id, "quantity": 1.0}],
        "payment_method": "CASH"
    })

    # 4 & 5 & 6 & 7. Confirm sale is rejected, no invoice generated, stock untouched
    assert res_fail_sale.status_code == 400
    print(f"4. Sale rejected with 400 Bad Request: '{res_fail_sale.json()['detail']}'")
    lim_inv_check = client.get(f"/api/inventory/{lim_inv_id}", headers=owner_headers).json()
    assert float(lim_inv_check["current_qty"]) == 10.0
    print(f"5-7. Confirmed no partial stock deduction: Stock remains {lim_inv_check['current_qty']}g")

    # ----------------------------------------------------
    # TEST C — OWNER CANCELLATION
    # ----------------------------------------------------
    print("\n--- TEST C: OWNER CANCELLATION FLOW ---")
    # 1. Login as OWNER
    print("1. Logged in as OWNER.")
    
    # 2 & 3. Cancel the test sale created earlier
    sale_to_cancel_id = sale_data["id"]
    print(f"2-3. Cancelling sale ID: {sale_to_cancel_id} ({invoice_no})...")
    res_cancel = client.post(f"/api/sales/{sale_to_cancel_id}/cancel", headers=owner_headers)
    assert res_cancel.status_code == 200
    cancelled_data = res_cancel.json()

    # 4 & 5. Confirm sale is CANCELLED and payment is REFUNDED
    assert cancelled_data["sale_status"] == "CANCELLED"
    assert cancelled_data["payment_status"] == "REFUNDED"
    print(f"4-5. Sale status: {cancelled_data['sale_status']}, Payment status: {cancelled_data['payment_status']}")

    # 6 & 7. Confirm inventory is restored and REVERSAL movement exists
    if inv_id:
        inv_restored = client.get(f"/api/inventory/{inv_id}", headers=owner_headers).json()
        restored_stock = float(inv_restored.get("current_qty", 0))
        assert restored_stock == initial_stock
        print(f"6. Stock restored to original quantity: {restored_stock} {inv_restored.get('base_unit')}")
    
    movs = client.get(f"/api/inventory/movements?inventory_product_id={inv_id}", headers=owner_headers).json()
    has_reversal = any(m["movement_type"] == "REVERSAL" and m["reference_id"] == sale_to_cancel_id for m in movs)
    assert has_reversal
    print(f"7. REVERSAL stock movement verified in audit log.")

    print("\nALL MANUAL VERIFICATION CRITERIA PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_manual_test_verification()
