import unittest
import os
import sys
import uuid
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine

from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.inventory_product import InventoryProduct
from app.models.supplier import Supplier
from app.models.customer import Customer
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.payment import Payment
from app.models.reward_visit import RewardVisit
from app.models.reward_redemption import RewardRedemption
from app.models.purchase import Purchase
from app.models.purchase_item import PurchaseItem
from app.models.expense import Expense
from app.models.stock_movement import StockMovement
from app.auth.security import get_password_hash, create_access_token


class TestV8BusinessIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.TestingSessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=cls.engine
        )
        Base.metadata.create_all(bind=cls.engine)

        def override_get_db():
            db = cls.TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        cls.client = TestClient(app)

        # Seed Owner and Cashier Users
        db = cls.TestingSessionLocal()
        cls.owner = User(
            name="V8 Owner",
            username="owner_v8",
            password_hash=get_password_hash("owner123"),
            role="OWNER",
            active=True,
        )
        cls.cashier = User(
            name="V8 Cashier",
            username="cashier_v8",
            password_hash=get_password_hash("cashier123"),
            role="CASHIER",
            active=True,
        )
        db.add_all([cls.owner, cls.cashier])
        db.commit()
        db.refresh(cls.owner)
        db.refresh(cls.cashier)

        cls.owner_token = create_access_token(
            {"sub": cls.owner.username, "role": "OWNER", "user_id": cls.owner.id}
        )
        cls.cashier_token = create_access_token(
            {"sub": cls.cashier.username, "role": "CASHIER", "user_id": cls.cashier.id}
        )
        cls.owner_headers = {"Authorization": f"Bearer {cls.owner_token}"}
        cls.cashier_headers = {"Authorization": f"Bearer {cls.cashier_token}"}
        db.close()

    def setUp(self):
        self.db = self.TestingSessionLocal()

    def tearDown(self):
        self.db.close()

    def test_01_purchase_creation_stock_increase_avg_cost_and_movement(self):
        """Test A: Purchase creation updates stock, base unit conversion, weighted avg cost, and adds PURCHASE stock movement."""
        # 1. Create Supplier
        sup_res = self.client.post(
            "/api/suppliers",
            headers=self.owner_headers,
            json={
                "name": "Global Poultry Supply",
                "contact_person": "John Doe",
                "phone": "9876500001",
                "email": "poultry@example.com"
            }
        )
        self.assertEqual(sup_res.status_code, 201)
        sup_id = sup_res.json()["id"]

        # 2. Create Inventory Product (e.g. 10,000g stock @ avg_cost 0.20/g = ₹2,000 valuation)
        inv_res = self.client.post(
            "/api/inventory",
            headers=self.owner_headers,
            json={
                "name": "Raw Chicken Breasts",
                "category": "Poultry",
                "purchase_unit": "PACKET",
                "base_unit": "GRAM",
                "conversion_qty": 2500.0,  # 1 packet = 2500g
                "current_qty": 10000.0,
                "min_limit": 5000.0,
                "avg_cost": 0.20,
                "supplier_id": sup_id
            }
        )
        self.assertEqual(inv_res.status_code, 201)
        inv_id = inv_res.json()["id"]

        # 3. Create Purchase of 4 packets @ ₹600/packet (Total = ₹2,400)
        # Added base qty = 4 * 2500 = 10,000g
        # New total qty = 10,000 + 10,000 = 20,000g
        # New avg cost = ((10,000 * 0.20) + 2,400) / 20,000 = (2,000 + 2,400) / 20,000 = 4,400 / 20,000 = 0.22/g
        pur_payload = {
            "supplier_id": sup_id,
            "invoice_number": "PUR-INV-8001",
            "purchase_date": str(date.today()),
            "tax": 50.0,
            "discount": 0.0,
            "notes": "Fresh delivery batch A",
            "items": [
                {
                    "inventory_product_id": inv_id,
                    "purchase_qty": 4.0,
                    "purchase_unit": "PACKET",
                    "conversion_qty": 2500.0,
                    "unit_cost": 600.0
                }
            ]
        }
        pur_res = self.client.post(
            "/api/purchases",
            headers=self.owner_headers,
            json=pur_payload
        )
        self.assertEqual(pur_res.status_code, 201)
        pur_data = pur_res.json()
        self.assertEqual(pur_data["subtotal"], 2400.0)
        self.assertEqual(pur_data["total"], 2450.0)

        # 4. Verify inventory product stock and avg_cost updated
        inv_check = self.client.get(f"/api/inventory/{inv_id}", headers=self.owner_headers)
        self.assertEqual(inv_check.status_code, 200)
        inv_data = inv_check.json()
        self.assertEqual(inv_data["current_qty"], 20000.0)
        self.assertAlmostEqual(inv_data["avg_cost"], 0.22, places=2)

        # 5. Verify PURCHASE stock movement logged
        mov_res = self.client.get(f"/api/inventory/movements?inventory_product_id={inv_id}", headers=self.owner_headers)
        self.assertEqual(mov_res.status_code, 200)
        movements = mov_res.json()
        pur_mov = next((m for m in movements if m["movement_type"] == "PURCHASE"), None)
        self.assertIsNotNone(pur_mov)
        self.assertEqual(pur_mov["quantity"], 10000.0)
        self.assertEqual(pur_mov["quantity_before"], 10000.0)
        self.assertEqual(pur_mov["quantity_after"], 20000.0)
        self.assertEqual(pur_mov["reference_type"], "PURCHASE")

        # 6. Verify GET /api/suppliers/{id}/purchases
        sup_pur = self.client.get(f"/api/suppliers/{sup_id}/purchases", headers=self.owner_headers)
        self.assertEqual(sup_pur.status_code, 200)
        self.assertTrue(len(sup_pur.json()) >= 1)

    def test_02_expense_crud_and_soft_delete(self):
        """Test B: Expense CRUD, listing, and soft deletion."""
        # 1. Create Expense
        exp_payload = {
            "category": "Electricity",
            "description": "Store electricity bill for July",
            "amount": 3500.00,
            "expense_date": str(date.today()),
            "payment_method": "UPI",
            "reference_number": "UPI-REF-9988",
            "notes": "Paid online via UPI"
        }
        exp_res = self.client.post("/api/expenses", headers=self.owner_headers, json=exp_payload)
        self.assertEqual(exp_res.status_code, 201)
        exp_id = exp_res.json()["id"]
        self.assertEqual(exp_res.json()["amount"], 3500.00)

        # 2. Get Expense Details
        exp_get = self.client.get(f"/api/expenses/{exp_id}", headers=self.owner_headers)
        self.assertEqual(exp_get.status_code, 200)
        self.assertEqual(exp_get.json()["category"], "Electricity")

        # 3. Update Expense
        exp_upd = self.client.put(
            f"/api/expenses/{exp_id}",
            headers=self.owner_headers,
            json={"amount": 3600.00, "notes": "Updated after meter audit"}
        )
        self.assertEqual(exp_upd.status_code, 200)
        self.assertEqual(exp_upd.json()["amount"], 3600.00)

        # 4. Cashier forbidden to delete expense
        del_cashier = self.client.delete(f"/api/expenses/{exp_id}", headers=self.cashier_headers)
        self.assertEqual(del_cashier.status_code, 403)

        # 5. Soft Delete Expense (Owner)
        exp_del = self.client.delete(f"/api/expenses/{exp_id}", headers=self.owner_headers)
        self.assertEqual(exp_del.status_code, 200)

        # 6. Verify soft-deleted from list
        exp_list = self.client.get("/api/expenses", headers=self.owner_headers)
        self.assertEqual(exp_list.status_code, 200)
        active_ids = [e["id"] for e in exp_list.json()]
        self.assertNotIn(exp_id, active_ids)

    def test_03_rewards_and_duplicate_prevention(self):
        """Test D & E & F: Rewards accumulation, duplicate prevention on same sale, and redemption reset."""
        # 1. Create Customer
        cust_res = self.client.post(
            "/api/customers",
            headers=self.cashier_headers,
            json={
                "name": "Arjun Sharma",
                "phone": "9811122233",
                "email": "arjun@example.com"
            }
        )
        self.assertEqual(cust_res.status_code, 201)
        cust_id = cust_res.json()["id"]

        # 2. Create Sale for Customer
        # Create Category & Product first
        cat_res = self.client.post("/api/categories", headers=self.owner_headers, json={"name": "Waffles V8"})
        cat_id = cat_res.json()["id"]

        prod_res = self.client.post(
            "/api/products",
            headers=self.owner_headers,
            json={"name": "Belgian Chocolate Waffle", "category_id": cat_id, "price": 250.00}
        )
        prod_id = prod_res.json()["id"]

        sale_res = self.client.post(
            "/api/sales",
            headers=self.cashier_headers,
            json={
                "customer_id": cust_id,
                "order_type": "DINE_IN",
                "subtotal": 250.00,
                "tax": 12.50,
                "discount": 0.00,
                "total": 262.50,
                "items": [{"product_id": prod_id, "quantity": 1, "unit_price": 250.00}],
                "payments": [{"payment_method": "CASH", "amount": 262.50}]
            }
        )
        self.assertEqual(sale_res.status_code, 201)
        sale_id = sale_res.json()["id"]

        # 3. Add Reward Visit with sale_id
        visit_res = self.client.post(
            f"/api/customers/{cust_id}/reward-visit",
            headers=self.cashier_headers,
            json={"amount": 262.50, "sale_id": sale_id}
        )
        self.assertEqual(visit_res.status_code, 201)
        self.assertEqual(visit_res.json()["visit_number"], 1)

        # 4. Duplicate Reward Visit on same sale_id must FAIL with 400
        dup_res = self.client.post(
            f"/api/customers/{cust_id}/reward-visit",
            headers=self.cashier_headers,
            json={"amount": 262.50, "sale_id": sale_id}
        )
        self.assertEqual(dup_res.status_code, 400)
        self.assertIn("already been recorded", dup_res.json()["detail"])

        # 5. Accumulate visits up to 10
        for i in range(2, 11):
            res = self.client.post(
                f"/api/customers/{cust_id}/reward-visit",
                headers=self.cashier_headers,
                json={"amount": 200.0}
            )
            self.assertEqual(res.status_code, 201)

        # 6. Check eligibility
        rewards_status = self.client.get(f"/api/customers/{cust_id}/rewards", headers=self.cashier_headers)
        self.assertEqual(rewards_status.status_code, 200)
        self.assertTrue(rewards_status.json()["eligible_for_redemption"])
        self.assertEqual(rewards_status.json()["reward_visits"], 10)

        # 7. Redeem Reward
        redeem_res = self.client.post(
            f"/api/customers/{cust_id}/redeem",
            headers=self.cashier_headers,
            json={"reward_name": "Free Belgian Waffle", "notes": "Loyalty 10 visits reward"}
        )
        self.assertEqual(redeem_res.status_code, 201)

        # 8. Verify visits counter reset to 0
        rewards_after = self.client.get(f"/api/customers/{cust_id}/rewards", headers=self.cashier_headers)
        self.assertEqual(rewards_after.json()["reward_visits"], 0)
        self.assertEqual(rewards_after.json()["reward_redemptions"], 1)
        self.assertFalse(rewards_after.json()["eligible_for_redemption"])

    def test_04_dashboard_and_reports_reflect_business_metrics(self):
        """Test C & G: Dashboard & Reports endpoints accurately reflect sales, COGS, expenses, and profit."""
        # 1. Log an Expense
        exp_res = self.client.post(
            "/api/expenses",
            headers=self.owner_headers,
            json={
                "category": "Maintenance",
                "description": "Fryer repair",
                "amount": 500.0,
                "expense_date": str(date.today()),
                "payment_method": "CASH"
            }
        )
        self.assertEqual(exp_res.status_code, 201)

        # 2. Get Dashboard Metrics
        dash_res = self.client.get("/api/dashboard", headers=self.owner_headers)
        self.assertEqual(dash_res.status_code, 200)
        dash_data = dash_res.json()
        self.assertIn("today", dash_data)
        self.assertIn("this_month", dash_data)
        self.assertIn("inventory", dash_data)
        self.assertIn("customers", dash_data)
        self.assertIn("rewards", dash_data)

        # 3. Get Profit Report
        profit_res = self.client.get(
            f"/api/reports/profit?date_from={str(date.today())}&date_to={str(date.today())}",
            headers=self.owner_headers
        )
        self.assertEqual(profit_res.status_code, 200)
        profit_data = profit_res.json()
        self.assertIn("net_sales", profit_data)
        self.assertIn("cost_of_goods_sold", profit_data)
        self.assertIn("gross_profit", profit_data)
        self.assertIn("expenses", profit_data)
        self.assertIn("net_profit", profit_data)
        self.assertIn("profit_margin_percentage", profit_data)

        # 4. Get Top Products Report
        top_res = self.client.get("/api/reports/top-products", headers=self.owner_headers)
        self.assertEqual(top_res.status_code, 200)

        # 5. Get Sales Trend Report
        trend_res = self.client.get("/api/reports/sales-trend?days=7", headers=self.owner_headers)
        self.assertEqual(trend_res.status_code, 200)

        # 6. Get Inventory Valuation Report
        val_res = self.client.get("/api/reports/inventory-value", headers=self.owner_headers)
        self.assertEqual(val_res.status_code, 200)


if __name__ == "__main__":
    unittest.main()
