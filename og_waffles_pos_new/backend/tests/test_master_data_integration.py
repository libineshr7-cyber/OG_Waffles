import unittest
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestMasterDataIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # 1. Login as Owner
        res_owner = client.post("/api/auth/login", json={"username": "owner_dev", "password": "owner123"})
        assert res_owner.status_code == 200, f"Owner login failed: {res_owner.text}"
        cls.owner_token = res_owner.json()["access_token"]
        cls.owner_headers = {"Authorization": f"Bearer {cls.owner_token}"}

        # 2. Login as Cashier
        res_cashier = client.post("/api/auth/login", json={"username": "cashier_dev", "password": "cashier123"})
        assert res_cashier.status_code == 200, f"Cashier login failed: {res_cashier.text}"
        cls.cashier_token = res_cashier.json()["access_token"]
        cls.cashier_headers = {"Authorization": f"Bearer {cls.cashier_token}"}

    def test_01_auth_me(self):
        res = client.get("/api/auth/me", headers=self.owner_headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["role"], "OWNER")

        res_c = client.get("/api/auth/me", headers=self.cashier_headers)
        self.assertEqual(res_c.status_code, 200)
        self.assertEqual(res_c.json()["role"], "CASHIER")

    def test_02_categories_flow(self):
        # List categories as Owner
        res = client.get("/api/categories", headers=self.owner_headers)
        self.assertEqual(res.status_code, 200)
        cats = res.json()
        self.assertIsInstance(cats, list)
        self.assertTrue(any(c["name"] == "WAFFLES" for c in cats), "WAFFLES category missing")

        # Cashier list categories
        res_c = client.get("/api/categories", headers=self.cashier_headers)
        self.assertEqual(res_c.status_code, 200)

        # Cashier cannot create category (403)
        res_c_create = client.post(
            "/api/categories",
            headers=self.cashier_headers,
            json={"name": "Cashier Cat", "icon": "fa-box"}
        )
        self.assertEqual(res_c_create.status_code, 403)

        # Owner creates category
        test_cat_name = f"Test Cat {uuid.uuid4().hex[:6]}"
        res_create = client.post(
            "/api/categories",
            headers=self.owner_headers,
            json={"name": test_cat_name, "icon": "fa-utensils", "active": True}
        )
        self.assertEqual(res_create.status_code, 201)
        created_cat = res_create.json()
        cat_id = created_cat["id"]
        self.assertEqual(created_cat["name"], test_cat_name)

        # Owner updates category
        updated_cat_name = f"Updated {test_cat_name}"
        res_update = client.put(
            f"/api/categories/{cat_id}",
            headers=self.owner_headers,
            json={"name": updated_cat_name}
        )
        self.assertEqual(res_update.status_code, 200)
        self.assertEqual(res_update.json()["name"], updated_cat_name)

        # Owner deletes category
        res_delete = client.delete(f"/api/categories/{cat_id}", headers=self.owner_headers)
        self.assertEqual(res_delete.status_code, 200)

        # Confirm deleted
        res_get_deleted = client.put(
            f"/api/categories/{cat_id}",
            headers=self.owner_headers,
            json={"name": "Will Fail"}
        )
        self.assertEqual(res_get_deleted.status_code, 404)

    def test_03_products_flow(self):
        # List products
        res = client.get("/api/products", headers=self.owner_headers)
        self.assertEqual(res.status_code, 200)
        products = res.json()
        self.assertIsInstance(products, list)
        self.assertTrue(len(products) > 0)

        # Check waffles category filter
        waffles_res = client.get("/api/products?category_id=cat-waffles", headers=self.owner_headers)
        self.assertEqual(waffles_res.status_code, 200)
        waffle_items = waffles_res.json()
        self.assertGreaterEqual(len(waffle_items), 14, "Expected at least 14 waffle flavours")
        waffle_names = [w["name"] for w in waffle_items]
        self.assertIn("Nutella Waffle", waffle_names)
        self.assertIn("Red Velvet Waffle", waffle_names)
        self.assertIn("Signature OG Waffle", waffle_names)

        # Cashier cannot create product (403)
        res_c_create = client.post(
            "/api/products",
            headers=self.cashier_headers,
            json={"name": "Cashier Item", "price": 99.0, "category_id": "cat-waffles"}
        )
        self.assertEqual(res_c_create.status_code, 403)

        # Owner creates product
        test_prod_name = f"Test Product {uuid.uuid4().hex[:6]}"
        res_create = client.post(
            "/api/products",
            headers=self.owner_headers,
            json={
                "category_id": "cat-waffles",
                "name": test_prod_name,
                "price": 149.00,
                "selling_unit": "piece",
                "description": "Test description",
                "available": True,
                "active": True
            }
        )
        self.assertEqual(res_create.status_code, 201)
        prod = res_create.json()
        prod_id = prod["id"]

        # Owner updates product
        res_update = client.put(
            f"/api/products/{prod_id}",
            headers=self.owner_headers,
            json={"price": 199.00}
        )
        self.assertEqual(res_update.status_code, 200)
        self.assertEqual(float(res_update.json()["price"]), 199.00)

        # Owner deletes product
        res_delete = client.delete(f"/api/products/{prod_id}", headers=self.owner_headers)
        self.assertEqual(res_delete.status_code, 200)

    def test_04_inventory_flow(self):
        # List inventory as Owner
        res = client.get("/api/inventory", headers=self.owner_headers)
        self.assertEqual(res.status_code, 200)
        inv = res.json()
        self.assertIsInstance(inv, list)
        self.assertTrue(len(inv) > 0)

        # Cashier cannot access inventory (403)
        res_c = client.get("/api/inventory", headers=self.cashier_headers)
        self.assertEqual(res_c.status_code, 403)

        # Owner creates inventory product
        test_ing_name = f"Test Poultry {uuid.uuid4().hex[:6]}"
        res_create = client.post(
            "/api/inventory",
            headers=self.owner_headers,
            json={
                "name": test_ing_name,
                "category": "Poultry",
                "purchase_unit": "PACKET",
                "base_unit": "PIECE",
                "conversion_qty": 20.0,
                "current_qty": 50.0,
                "min_limit": 10.0,
                "avg_cost": 25.0
            }
        )
        self.assertEqual(res_create.status_code, 201)
        ing_item = res_create.json()
        ing_id = ing_item["id"]

        # Owner updates inventory product
        res_update = client.put(
            f"/api/inventory/{ing_id}",
            headers=self.owner_headers,
            json={"min_limit": 15.0}
        )
        self.assertEqual(res_update.status_code, 200)
        self.assertEqual(float(res_update.json()["min_limit"]), 15.0)

        # Owner deletes inventory product
        res_delete = client.delete(f"/api/inventory/{ing_id}", headers=self.owner_headers)
        self.assertEqual(res_delete.status_code, 200)

    def test_05_suppliers_flow(self):
        # List suppliers as Owner
        res = client.get("/api/suppliers", headers=self.owner_headers)
        self.assertEqual(res.status_code, 200)
        sups = res.json()
        self.assertIsInstance(sups, list)
        self.assertTrue(len(sups) > 0)

        # Cashier cannot access suppliers (403)
        res_c = client.get("/api/suppliers", headers=self.cashier_headers)
        self.assertEqual(res_c.status_code, 403)

        # Owner creates supplier
        test_sup_name = f"Test Vendor {uuid.uuid4().hex[:6]}"
        res_create = client.post(
            "/api/suppliers",
            headers=self.owner_headers,
            json={
                "name": test_sup_name,
                "phone": "+91 98765 00000",
                "address": "Hyderabad",
                "gst_no": "36TEST12345",
                "balance": 0.00
            }
        )
        self.assertEqual(res_create.status_code, 201)
        sup = res_create.json()
        sup_id = sup["id"]

        # Owner updates supplier
        res_update = client.put(
            f"/api/suppliers/{sup_id}",
            headers=self.owner_headers,
            json={"phone": "+91 98765 11111"}
        )
        self.assertEqual(res_update.status_code, 200)
        self.assertEqual(res_update.json()["phone"], "+91 98765 11111")

        # Owner deletes supplier
        res_delete = client.delete(f"/api/suppliers/{sup_id}", headers=self.owner_headers)
        self.assertEqual(res_delete.status_code, 200)


if __name__ == "__main__":
    unittest.main()
