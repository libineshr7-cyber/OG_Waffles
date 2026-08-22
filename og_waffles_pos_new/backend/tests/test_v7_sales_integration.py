import unittest
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestV7SalesIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # 1. Owner Login
        res_owner = client.post("/api/auth/login", json={"username": "owner_dev", "password": "owner123"})
        assert res_owner.status_code == 200, f"Owner login failed: {res_owner.text}"
        cls.owner_token = res_owner.json()["access_token"]
        cls.owner_headers = {"Authorization": f"Bearer {cls.owner_token}"}

        # 2. Cashier Login
        res_cashier = client.post("/api/auth/login", json={"username": "cashier_dev", "password": "cashier123"})
        assert res_cashier.status_code == 200, f"Cashier login failed: {res_cashier.text}"
        cls.cashier_token = res_cashier.json()["access_token"]
        cls.cashier_headers = {"Authorization": f"Bearer {cls.cashier_token}"}

    def test_01_owner_and_cashier_login_and_auth(self):
        # Criteria 1, 2, 24: Login & JWT authentication works
        res_owner = client.get("/api/auth/me", headers=self.owner_headers)
        self.assertEqual(res_owner.status_code, 200)
        self.assertEqual(res_owner.json()["role"], "OWNER")

        res_cashier = client.get("/api/auth/me", headers=self.cashier_headers)
        self.assertEqual(res_cashier.status_code, 200)
        self.assertEqual(res_cashier.json()["role"], "CASHIER")

    def test_02_master_data_integrity(self):
        # Criteria 25: Existing V6.2 master-data integration
        res_cats = client.get("/api/categories", headers=self.cashier_headers)
        self.assertEqual(res_cats.status_code, 200)
        self.assertTrue(len(res_cats.json()) > 0)

        res_prods = client.get("/api/products", headers=self.cashier_headers)
        self.assertEqual(res_prods.status_code, 200)
        self.assertTrue(len(res_prods.json()) > 0)

        res_inv = client.get("/api/inventory", headers=self.owner_headers)
        self.assertEqual(res_inv.status_code, 200)
        self.assertTrue(len(res_inv.json()) > 0)

        res_sups = client.get("/api/suppliers", headers=self.owner_headers)
        self.assertEqual(res_sups.status_code, 200)
        self.assertTrue(len(res_sups.json()) > 0)

    def test_03_cashier_sale_creation_and_invoice_generation(self):
        # Criteria 3, 4, 5, 8, 9: Cashier creates sale, OW invoice number, Cash payment, inventory deduction, SALE movement
        # 1. Setup inventory & product for predictable testing
        inv_res = client.post(
            "/api/inventory",
            headers=self.owner_headers,
            json={
                "name": f"Test Flour {uuid.uuid4().hex[:6]}",
                "category": "Dry Goods",
                "purchase_unit": "PACKET",
                "base_unit": "GRAM",
                "conversion_qty": 1000.0,
                "current_qty": 5000.0,
                "min_limit": 500.0,
                "avg_cost": 0.05
            }
        )
        self.assertEqual(inv_res.status_code, 201)
        inv_item = inv_res.json()
        inv_id = inv_item["id"]

        prod_res = client.post(
            "/api/products",
            headers=self.owner_headers,
            json={
                "category_id": "cat-waffles",
                "name": f"Test Belgian Waffle {uuid.uuid4().hex[:6]}",
                "price": 150.0,
                "selling_unit": "piece",
                "inventory_product_id": inv_id,
                "deduction_qty": 100.0,
                "available": True,
                "active": True
            }
        )
        self.assertEqual(prod_res.status_code, 201)
        prod_item = prod_res.json()
        prod_id = prod_item["id"]

        # 2. Cashier creates sale with CASH
        sale_payload = {
            "items": [{"product_id": prod_id, "quantity": 2.0}],
            "payment_method": "CASH",
            "discount": 0.0,
            "tax": 15.0
        }
        res_sale = client.post("/api/sales", headers=self.cashier_headers, json=sale_payload)
        self.assertEqual(res_sale.status_code, 201, f"Sale failed: {res_sale.text}")
        sale = res_sale.json()

        # Check invoice number format (OW-YYYY-XXXXXX)
        self.assertTrue(sale["invoice_number"].startswith("OW-"), f"Unexpected invoice number: {sale['invoice_number']}")
        self.assertEqual(float(sale["subtotal"]), 300.0) # 2 * 150
        self.assertEqual(float(sale["tax"]), 15.0)
        self.assertEqual(float(sale["total"]), 315.0)
        self.assertEqual(sale["sale_status"], "COMPLETED")
        self.assertEqual(sale["payment_status"], "PAID")

        # Check payment record
        self.assertEqual(len(sale["payments"]), 1)
        self.assertEqual(sale["payments"][0]["payment_method"], "CASH")
        self.assertEqual(float(sale["payments"][0]["amount"]), 315.0)

        # Check inventory decreased by 200.0g (from 5000.0 to 4800.0)
        inv_check = client.get(f"/api/inventory/{inv_id}", headers=self.owner_headers)
        self.assertEqual(inv_check.status_code, 200)
        self.assertEqual(float(inv_check.json()["current_qty"]), 4800.0)

        # Check SALE stock movement
        mov_res = client.get(f"/api/inventory/movements?inventory_product_id={inv_id}", headers=self.owner_headers)
        self.assertEqual(mov_res.status_code, 200)
        movements = mov_res.json()
        self.assertTrue(any(m["movement_type"] == "SALE" and m["reference_id"] == sale["id"] for m in movements))

    def test_04_upi_and_card_payment_methods(self):
        # Criteria 6, 7: UPI and CARD payments
        prods = client.get("/api/products", headers=self.cashier_headers).json()
        prod_id = prods[0]["id"]

        # UPI Sale
        upi_payload = {
            "items": [{"product_id": prod_id, "quantity": 1.0}],
            "payment_method": "UPI",
            "payment_reference": "UPI987654321"
        }
        res_upi = client.post("/api/sales", headers=self.cashier_headers, json=upi_payload)
        self.assertEqual(res_upi.status_code, 201)
        self.assertEqual(res_upi.json()["payments"][0]["payment_method"], "UPI")

        # CARD Sale
        card_payload = {
            "items": [{"product_id": prod_id, "quantity": 1.0}],
            "payment_method": "CARD",
            "payment_reference": "CARD1234"
        }
        res_card = client.post("/api/sales", headers=self.cashier_headers, json=card_payload)
        self.assertEqual(res_card.status_code, 201)
        self.assertEqual(res_card.json()["payments"][0]["payment_method"], "CARD")

    def test_05_insufficient_stock_rejection_and_no_partial_deduction(self):
        # Criteria 10, 11: Insufficient stock rejection, no partial deduction
        # Create inventory product with 50g
        inv_res = client.post(
            "/api/inventory",
            headers=self.owner_headers,
            json={
                "name": f"Limited Sugar {uuid.uuid4().hex[:6]}",
                "category": "Dry Goods",
                "purchase_unit": "PACKET",
                "base_unit": "GRAM",
                "conversion_qty": 1000.0,
                "current_qty": 50.0,
                "min_limit": 10.0
            }
        )
        inv_id = inv_res.json()["id"]

        # Create product that requires 100g
        prod_res = client.post(
            "/api/products",
            headers=self.owner_headers,
            json={
                "category_id": "cat-waffles",
                "name": f"Sweet Delight {uuid.uuid4().hex[:6]}",
                "price": 100.0,
                "inventory_product_id": inv_id,
                "deduction_qty": 100.0,
                "available": True
            }
        )
        prod_id = prod_res.json()["id"]

        # Attempt sale requiring 100g when only 50g available
        res_fail = client.post(
            "/api/sales",
            headers=self.cashier_headers,
            json={"items": [{"product_id": prod_id, "quantity": 1.0}]}
        )
        self.assertEqual(res_fail.status_code, 400)
        self.assertIn("Insufficient stock", res_fail.json()["detail"])

        # Confirm inventory remained untouched (still exactly 50.0g)
        inv_check = client.get(f"/api/inventory/{inv_id}", headers=self.owner_headers)
        self.assertEqual(float(inv_check.json()["current_qty"]), 50.0)

    def test_06_new_customer_auto_registration_and_history(self):
        # Criteria 12, 13, 14, 15, 16, 17: Customer auto-registration, linking, spend/visit update, history
        phone_num = f"98765{uuid.uuid4().int % 100000:05d}"
        cust_name = f"Loyal Guest {uuid.uuid4().hex[:4]}"

        prods = client.get("/api/products", headers=self.cashier_headers).json()
        prod = prods[0]

        # 1. First sale creates customer automatically
        sale_payload = {
            "customer": {
                "name": cust_name,
                "phone": phone_num
            },
            "items": [{"product_id": prod["id"], "quantity": 1.0}],
            "payment_method": "CASH"
        }
        res_sale1 = client.post("/api/sales", headers=self.cashier_headers, json=sale_payload)
        self.assertEqual(res_sale1.status_code, 201)
        sale1 = res_sale1.json()
        cust_id = sale1["customer_id"]
        self.assertIsNotNone(cust_id)

        # 2. Check customer in database
        cust_res = client.get(f"/api/customers/{cust_id}", headers=self.cashier_headers)
        self.assertEqual(cust_res.status_code, 200)
        cust = cust_res.json()
        self.assertEqual(cust["name"], cust_name)
        self.assertEqual(cust["phone"], phone_num)
        self.assertEqual(cust["visit_count"], 1)
        self.assertEqual(float(cust["total_spent"]), float(sale1["total"]))

        # 3. Second sale for existing customer
        sale_payload2 = {
            "customer_id": cust_id,
            "items": [{"product_id": prod["id"], "quantity": 2.0}],
            "payment_method": "UPI"
        }
        res_sale2 = client.post("/api/sales", headers=self.cashier_headers, json=sale_payload2)
        self.assertEqual(res_sale2.status_code, 201)
        sale2 = res_sale2.json()

        # Check updated visit count and total spent
        cust_res2 = client.get(f"/api/customers/{cust_id}", headers=self.cashier_headers)
        cust2 = cust_res2.json()
        self.assertEqual(cust2["visit_count"], 2)
        expected_total = float(sale1["total"]) + float(sale2["total"])
        self.assertAlmostEqual(float(cust2["total_spent"]), expected_total, places=2)

        # 4. Check customer purchase history endpoint
        sales_hist_res = client.get(f"/api/customers/{cust_id}/sales", headers=self.cashier_headers)
        self.assertEqual(sales_hist_res.status_code, 200)
        sales_hist = sales_hist_res.json()
        self.assertEqual(len(sales_hist), 2)
        invoice_numbers = [s["invoice_number"] for s in sales_hist]
        self.assertIn(sale1["invoice_number"], invoice_numbers)
        self.assertIn(sale2["invoice_number"], invoice_numbers)

    def test_07_today_sales_metrics(self):
        # Criteria 18: Today's sales summary
        res = client.get("/api/sales/today", headers=self.cashier_headers)
        self.assertEqual(res.status_code, 200)
        today_data = res.json()
        self.assertIn("number_of_bills", today_data)
        self.assertIn("gross_sales", today_data)
        self.assertIn("net_sales", today_data)
        self.assertIn("cash_total", today_data)
        self.assertIn("upi_total", today_data)
        self.assertIn("card_total", today_data)
        self.assertGreater(today_data["number_of_bills"], 0)

    def test_08_owner_sale_cancellation_and_inventory_restoration(self):
        # Criteria 19, 20, 21, 22, 23: Sale cancellation, RBAC, inventory restoration, REVERSAL movement, duplicate reject
        # 1. Setup inventory & product
        inv_res = client.post(
            "/api/inventory",
            headers=self.owner_headers,
            json={
                "name": f"Cancel Test Mix {uuid.uuid4().hex[:6]}",
                "category": "Mix",
                "purchase_unit": "PACKET",
                "base_unit": "PIECE",
                "conversion_qty": 1.0,
                "current_qty": 20.0,
                "min_limit": 5.0
            }
        )
        inv_id = inv_res.json()["id"]

        prod_res = client.post(
            "/api/products",
            headers=self.owner_headers,
            json={
                "category_id": "cat-waffles",
                "name": f"Cancel Test Waffle {uuid.uuid4().hex[:6]}",
                "price": 200.0,
                "inventory_product_id": inv_id,
                "deduction_qty": 2.0,
                "available": True
            }
        )
        prod_id = prod_res.json()["id"]

        # 2. Cashier sells 3 items (deducts 6 pieces, remaining = 14)
        sale_res = client.post(
            "/api/sales",
            headers=self.cashier_headers,
            json={"items": [{"product_id": prod_id, "quantity": 3.0}], "payment_method": "CASH"}
        )
        self.assertEqual(sale_res.status_code, 201)
        sale = sale_res.json()
        sale_id = sale["id"]

        # Confirm stock is 14
        inv_mid = client.get(f"/api/inventory/{inv_id}", headers=self.owner_headers).json()
        self.assertEqual(float(inv_mid["current_qty"]), 14.0)

        # 3. Cashier CANNOT cancel sale (403 Forbidden)
        res_cashier_cancel = client.post(f"/api/sales/{sale_id}/cancel", headers=self.cashier_headers)
        self.assertEqual(res_cashier_cancel.status_code, 403)

        # 4. Owner cancels sale (200 OK)
        res_owner_cancel = client.post(f"/api/sales/{sale_id}/cancel", headers=self.owner_headers)
        self.assertEqual(res_owner_cancel.status_code, 200)
        cancelled_sale = res_owner_cancel.json()
        self.assertEqual(cancelled_sale["sale_status"], "CANCELLED")
        self.assertEqual(cancelled_sale["payment_status"], "REFUNDED")

        # 5. Inventory restored to 20.0 pieces
        inv_restored = client.get(f"/api/inventory/{inv_id}", headers=self.owner_headers).json()
        self.assertEqual(float(inv_restored["current_qty"]), 20.0)

        # 6. REVERSAL stock movement exists
        mov_res = client.get(f"/api/inventory/movements?inventory_product_id={inv_id}", headers=self.owner_headers)
        movements = mov_res.json()
        self.assertTrue(any(m["movement_type"] == "REVERSAL" and m["reference_id"] == sale_id for m in movements))

        # 7. Duplicate cancellation rejected (400 Bad Request)
        res_dup_cancel = client.post(f"/api/sales/{sale_id}/cancel", headers=self.owner_headers)
        self.assertEqual(res_dup_cancel.status_code, 400)


if __name__ == "__main__":
    unittest.main()
