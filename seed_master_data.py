import os
import sys
from datetime import date, datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import get_db, init_indexes
from app.auth.security import get_password_hash


def seed_master_data():
    init_indexes()
    db = get_db()

    try:
        print("--> Populating Master Data into MongoDB if not already present...")
        now = datetime.utcnow()

        # 1. Users
        if not db["users"].find_one({"username": "owner_dev"}):
            db["users"].insert_one({
                "id": 1,
                "name": "Store Owner (Dev)",
                "username": "owner_dev",
                "password_hash": get_password_hash("owner123"),
                "role": "OWNER",
                "active": True,
                "created_at": now,
                "updated_at": now
            })
            print("  [+] Added user: owner_dev (password: owner123)")

        if not db["users"].find_one({"username": "cashier_dev"}):
            db["users"].insert_one({
                "id": 2,
                "name": "Front Cashier (Dev)",
                "username": "cashier_dev",
                "password_hash": get_password_hash("cashier123"),
                "role": "CASHIER",
                "active": True,
                "created_at": now,
                "updated_at": now
            })
            print("  [+] Added user: cashier_dev (password: cashier123)")

        # 2. Suppliers
        suppliers_data = [
            {"id": "SUP-01", "name": "Apex Poultry Farms", "phone": "+91 98765 44111", "address": "Farm Rd 40, Telangana", "gst_no": "36APXPB88121", "balance": 0.00, "active": True},
            {"id": "SUP-02", "name": "Harvest Frozen Foods", "phone": "+91 98765 99222", "address": "Industrial Zone, AP", "gst_no": "37GGCGG77121", "balance": 0.00, "active": True},
            {"id": "SUP-03", "name": "Beverage Hub", "phone": "+91 98765 33444", "address": "Jubilee Hills, Hyderabad", "gst_no": "36BEVHB11223", "balance": 0.00, "active": True},
        ]
        for sup in suppliers_data:
            existing = db["suppliers"].find_one({"$or": [{"id": sup["id"]}, {"name": sup["name"]}]})
            if not existing:
                doc = {**sup, "created_at": now, "updated_at": now}
                db["suppliers"].insert_one(doc)
                print(f"  [+] Added supplier: {sup['name']}")

        # 3. Inventory Products
        inventory_data = [
            {"id": "ING-LEG", "name": "Frozen Chicken Legs", "category": "Poultry", "purchase_unit": "PACKET", "base_unit": "PIECE", "conversion_qty": 20.0, "current_qty": 100.0, "min_limit": 10.0, "avg_cost": 32.50, "supplier_id": "SUP-01", "status": "IN_STOCK"},
            {"id": "ING-WINGS", "name": "Frozen Chicken Wings", "category": "Poultry", "purchase_unit": "PACKET", "base_unit": "PIECE", "conversion_qty": 40.0, "current_qty": 200.0, "min_limit": 20.0, "avg_cost": 13.75, "supplier_id": "SUP-01", "status": "IN_STOCK"},
            {"id": "ING-CHKFRIES", "name": "Frozen Chicken Fries", "category": "Poultry", "purchase_unit": "PACKET", "base_unit": "PIECE", "conversion_qty": 60.0, "current_qty": 180.0, "min_limit": 30.0, "avg_cost": 7.50, "supplier_id": "SUP-01", "status": "IN_STOCK"},
            {"id": "ING-POPCORN", "name": "Frozen Chicken Popcorn", "category": "Poultry", "purchase_unit": "PACKET", "base_unit": "GRAM", "conversion_qty": 2000.0, "current_qty": 10000.0, "min_limit": 1000.0, "avg_cost": 0.30, "supplier_id": "SUP-01", "status": "IN_STOCK"},
            {"id": "ING-STRIPS", "name": "Frozen Chicken Strips", "category": "Poultry", "purchase_unit": "PACKET", "base_unit": "PIECE", "conversion_qty": 30.0, "current_qty": 150.0, "min_limit": 15.0, "avg_cost": 16.67, "supplier_id": "SUP-01", "status": "IN_STOCK"},
            {"id": "ING-NUGGETS", "name": "Frozen Chicken Nuggets", "category": "Poultry", "purchase_unit": "PACKET", "base_unit": "PIECE", "conversion_qty": 50.0, "current_qty": 250.0, "min_limit": 25.0, "avg_cost": 7.00, "supplier_id": "SUP-01", "status": "IN_STOCK"},
            {"id": "ING-BITES", "name": "Peri-Peri Chicken Bites", "category": "Poultry", "purchase_unit": "PACKET", "base_unit": "PIECE", "conversion_qty": 50.0, "current_qty": 200.0, "min_limit": 20.0, "avg_cost": 8.00, "supplier_id": "SUP-01", "status": "IN_STOCK"},
            {"id": "ING-FRIES", "name": "Frozen French Fries", "category": "Frozen", "purchase_unit": "PACKET", "base_unit": "GRAM", "conversion_qty": 2500.0, "current_qty": 15000.0, "min_limit": 2000.0, "avg_cost": 0.12, "supplier_id": "SUP-02", "status": "IN_STOCK"},
            {"id": "ING-MOMOS", "name": "Frozen Steamed Momos", "category": "Frozen", "purchase_unit": "PACKET", "base_unit": "PIECE", "conversion_qty": 60.0, "current_qty": 300.0, "min_limit": 30.0, "avg_cost": 6.67, "supplier_id": "SUP-02", "status": "IN_STOCK"},
            {"id": "ING-SHAWARMA", "name": "Shawarma Chicken Base", "category": "Poultry", "purchase_unit": "PACKET", "base_unit": "PIECE", "conversion_qty": 25.0, "current_qty": 125.0, "min_limit": 15.0, "avg_cost": 32.00, "supplier_id": "SUP-01", "status": "IN_STOCK"},
            {"id": "ING-COLDDRINK", "name": "Cold Drinks Assorted Cans", "category": "Beverages", "purchase_unit": "PACKET", "base_unit": "PIECE", "conversion_qty": 24.0, "current_qty": 120.0, "min_limit": 20.0, "avg_cost": 20.00, "supplier_id": "SUP-03", "status": "IN_STOCK"},
            {"id": "ING-WATER", "name": "Mineral Water Bottles (500 ml)", "category": "Beverages", "purchase_unit": "PACKET", "base_unit": "PIECE", "conversion_qty": 24.0, "current_qty": 96.0, "min_limit": 12.0, "avg_cost": 10.00, "supplier_id": "SUP-03", "status": "IN_STOCK"},
            {"id": "ING-REDBULL", "name": "Red Bull Energy Cans (250 ml)", "category": "Beverages", "purchase_unit": "PACKET", "base_unit": "PIECE", "conversion_qty": 24.0, "current_qty": 48.0, "min_limit": 6.0, "avg_cost": 91.67, "supplier_id": "SUP-03", "status": "IN_STOCK"},
        ]
        for ing in inventory_data:
            existing = db["inventory_products"].find_one({"$or": [{"id": ing["id"]}, {"name": ing["name"]}]})
            if not existing:
                doc = {**ing, "last_updated": now, "created_at": now, "updated_at": now}
                db["inventory_products"].insert_one(doc)
                print(f"  [+] Added inventory item: {ing['name']}")

        # 4. Categories
        categories_data = [
            {"id": "cat-waffles", "name": "WAFFLES", "icon": "fa-stroopwafel", "image_url": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", "display_order": 1, "active": True},
            {"id": "cat-chicken-snacks", "name": "CHICKEN & SNACKS", "icon": "fa-drumstick-bite", "image_url": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80", "display_order": 2, "active": True},
            {"id": "cat-combos", "name": "BEST COMBO OFFERS", "icon": "fa-utensils", "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80", "display_order": 3, "active": True},
            {"id": "cat-momos", "name": "STEAMED MOMOS", "icon": "fa-bowl-food", "image_url": "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=600&q=80", "display_order": 4, "active": True},
            {"id": "cat-shawarma", "name": "SHAWARMA", "icon": "fa-bread-slice", "image_url": "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80", "display_order": 5, "active": True},
            {"id": "cat-shawarma-mojitos", "name": "SHAWARMA & MOJITO COMBOS", "icon": "fa-glass-cheers", "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", "display_order": 6, "active": True},
            {"id": "cat-mojitos", "name": "MOJITOS", "icon": "fa-cocktail", "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80", "display_order": 7, "active": True},
            {"id": "cat-milkshakes", "name": "MILK SHAKES", "icon": "fa-blender", "image_url": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80", "display_order": 8, "active": True},
            {"id": "cat-cold-coffee", "name": "COLD COFFEE", "icon": "fa-mug-hot", "image_url": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80", "display_order": 9, "active": True},
            {"id": "cat-ice-cream", "name": "SCOOP ICE CREAM", "icon": "fa-ice-cream", "image_url": "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80", "display_order": 10, "active": True},
            {"id": "cat-cold-drinks", "name": "COLD DRINKS", "icon": "fa-bottle-water", "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80", "display_order": 11, "active": True},
        ]
        for cat in categories_data:
            existing = db["categories"].find_one({"$or": [{"id": cat["id"]}, {"name": cat["name"]}]})
            if not existing:
                doc = {**cat, "created_at": now, "updated_at": now}
                db["categories"].insert_one(doc)
                print(f"  [+] Added category: {cat['name']}")

        # 5. Menu Products
        products_data = [
            # Waffles (14 items)
            {"id": "WAF-01", "category_id": "cat-waffles", "name": "Milk Filling Waffle", "price": 99.00, "selling_unit": "piece", "description": "Golden crispy waffle layered with rich milk cream filling.", "image_url": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "WAF-02", "category_id": "cat-waffles", "name": "White Filling Waffle", "price": 99.00, "selling_unit": "piece", "description": "Warm waffle filled with luscious creamy white chocolate.", "image_url": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "WAF-03", "category_id": "cat-waffles", "name": "Dark Filling Waffle", "price": 119.00, "selling_unit": "piece", "description": "Crisp waffle with intense Belgian dark chocolate filling.", "image_url": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "WAF-04", "category_id": "cat-waffles", "name": "Hazelnut Waffle", "price": 129.00, "selling_unit": "piece", "description": "Toasted hazelnut paste drizzled over warm Belgian waffle.", "image_url": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "WAF-05", "category_id": "cat-waffles", "name": "Dairy Milk Waffle", "price": 129.00, "selling_unit": "piece", "description": "Melted Cadbury Dairy Milk chocolate smothered on waffle.", "image_url": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "WAF-06", "category_id": "cat-waffles", "name": "KitKat Waffle", "price": 129.00, "selling_unit": "piece", "description": "Loaded with crushed KitKat bars and chocolate drizzle.", "image_url": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "WAF-07", "category_id": "cat-waffles", "name": "Oreo Waffle", "price": 139.00, "selling_unit": "piece", "description": "Crunchy Oreo crumbs with double cream on golden waffle.", "image_url": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "WAF-08", "category_id": "cat-waffles", "name": "Double Chocolate Waffle", "price": 139.00, "selling_unit": "piece", "description": "Dual layer of milk and dark melted chocolate.", "image_url": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "WAF-09", "category_id": "cat-waffles", "name": "Triple Chocolate Waffle", "price": 149.00, "selling_unit": "piece", "description": "Milk, dark, and white chocolate layered waffle.", "image_url": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "WAF-10", "category_id": "cat-waffles", "name": "Red Velvet Waffle", "price": 149.00, "selling_unit": "piece", "description": "Red velvet waffle with sweet cream cheese and white chocolate.", "image_url": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "WAF-11", "category_id": "cat-waffles", "name": "Nutella Waffle", "price": 149.00, "selling_unit": "piece", "description": "Generous coating of authentic Nutella spread.", "image_url": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "WAF-12", "category_id": "cat-waffles", "name": "Biscoff Waffle", "price": 159.00, "selling_unit": "piece", "description": "Caramelized Lotus Biscoff spread and biscuit crumbs.", "image_url": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "WAF-13", "category_id": "cat-waffles", "name": "Butterscotch Waffle", "price": 159.00, "selling_unit": "piece", "description": "Buttery caramel butterscotch crunch sauce on waffle.", "image_url": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "WAF-14", "category_id": "cat-waffles", "name": "Signature OG Waffle", "price": 199.00, "selling_unit": "piece", "description": "Our chef's loaded signature premium waffle tower.", "image_url": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},

            # Chicken & Snacks
            {"id": "CHK-01", "category_id": "cat-chicken-snacks", "name": "Crispy Chicken Leg (1 pc)", "price": 99.00, "selling_unit": "piece", "description": "Single golden fried crispy chicken drumstick.", "image_url": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-LEG", "deduction_qty": 1.0},
            {"id": "CHK-02", "category_id": "cat-chicken-snacks", "name": "Crispy Chicken Leg (2 pcs)", "price": 179.00, "selling_unit": "piece", "description": "2 pieces of golden fried crispy chicken drumsticks.", "image_url": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-LEG", "deduction_qty": 2.0},
            {"id": "CHK-03", "category_id": "cat-chicken-snacks", "name": "Chicken Wings (4 pcs)", "price": 159.00, "selling_unit": "piece", "description": "4 crispy seasoned golden chicken wings.", "image_url": "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-WINGS", "deduction_qty": 4.0},
            {"id": "CHK-04", "category_id": "cat-chicken-snacks", "name": "Chicken Wings (8 pcs)", "price": 299.00, "selling_unit": "piece", "description": "8 crispy seasoned golden chicken wings sharing pack.", "image_url": "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-WINGS", "deduction_qty": 8.0},
            {"id": "CHK-05", "category_id": "cat-chicken-snacks", "name": "Chicken Fries (6 pcs)", "price": 139.00, "selling_unit": "piece", "description": "6 crispy breaded finger chicken fries.", "image_url": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-CHKFRIES", "deduction_qty": 6.0},
            {"id": "CHK-06", "category_id": "cat-chicken-snacks", "name": "Chicken Popcorn (150 g)", "price": 129.00, "selling_unit": "g", "description": "150 g of crunchy bite-sized popcorn chicken.", "image_url": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-POPCORN", "deduction_qty": 150.0},
            {"id": "CHK-07", "category_id": "cat-chicken-snacks", "name": "Chicken Strips (3 pcs)", "price": 159.00, "selling_unit": "piece", "description": "3 whole tender breaded chicken breast strips.", "image_url": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-STRIPS", "deduction_qty": 3.0},
            {"id": "CHK-08", "category_id": "cat-chicken-snacks", "name": "Chicken Nuggets (6 pcs)", "price": 129.00, "selling_unit": "piece", "description": "6 golden crispy tender chicken nuggets.", "image_url": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-NUGGETS", "deduction_qty": 6.0},
            {"id": "CHK-09", "category_id": "cat-chicken-snacks", "name": "Peri-Peri Chicken Bites (8 pcs)", "price": 139.00, "selling_unit": "piece", "description": "8 pieces of spicy peri-peri dusted chicken bites.", "image_url": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-BITES", "deduction_qty": 8.0},
            {"id": "CHK-10", "category_id": "cat-chicken-snacks", "name": "French Fries Regular (100 g)", "price": 89.00, "selling_unit": "g", "description": "100 g of hot salted crispy potato fries.", "image_url": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-FRIES", "deduction_qty": 100.0},
            {"id": "CHK-11", "category_id": "cat-chicken-snacks", "name": "French Fries Large (150 g)", "price": 129.00, "selling_unit": "g", "description": "150 g large portion of hot salted potato fries.", "image_url": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-FRIES", "deduction_qty": 150.0},
            {"id": "CHK-12", "category_id": "cat-chicken-snacks", "name": "Chicken Drumsticks Bucket (4 pcs)", "price": 349.00, "selling_unit": "piece", "description": "4 crispy golden fried chicken drumsticks in bucket.", "image_url": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-LEG", "deduction_qty": 4.0},

            # Combos
            {"id": "CMB-01", "category_id": "cat-combos", "name": "Single Chicken Delight Combo", "price": 199.00, "selling_unit": "portion", "description": "1 Crispy Leg + Regular Fries (100g) + Cold Drink (250ml).", "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "CMB-02", "category_id": "cat-combos", "name": "Wings & Fries Combo", "price": 249.00, "selling_unit": "portion", "description": "4 Chicken Wings + Regular Fries + Lemon Mint Mojito.", "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "CMB-03", "category_id": "cat-combos", "name": "Shawarma Feast Combo", "price": 219.00, "selling_unit": "portion", "description": "1 Regular Shawarma Roll + Regular Fries + Cold Drink.", "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "CMB-04", "category_id": "cat-combos", "name": "Waffle & Shake Combo", "price": 179.00, "selling_unit": "portion", "description": "1 Milk Filling Waffle + 1 Vanilla Milkshake.", "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "CMB-05", "category_id": "cat-combos", "name": "Snack Attack Combo", "price": 229.00, "selling_unit": "portion", "description": "Chicken Popcorn (150g) + Regular Fries + Cold Drink.", "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "CMB-06", "category_id": "cat-combos", "name": "OG Mega Bucket Combo", "price": 499.00, "selling_unit": "portion", "description": "4 Drumsticks + 4 Wings + Large Fries + 2 Cold Drinks.", "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},

            # Steamed Momos
            {"id": "MOM-01", "category_id": "cat-momos", "name": "Veg Steamed Momos (6 pcs)", "price": 79.00, "selling_unit": "piece", "description": "6 freshly steamed authentic vegetable momos.", "image_url": "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-MOMOS", "deduction_qty": 6.0},
            {"id": "MOM-02", "category_id": "cat-momos", "name": "Paneer Steamed Momos (6 pcs)", "price": 89.00, "selling_unit": "piece", "description": "6 steamed momos stuffed with spiced cottage cheese.", "image_url": "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-MOMOS", "deduction_qty": 6.0},
            {"id": "MOM-03", "category_id": "cat-momos", "name": "Chicken Steamed Momos (6 pcs)", "price": 99.00, "selling_unit": "piece", "description": "6 juicy spiced minced chicken steamed momos.", "image_url": "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-MOMOS", "deduction_qty": 6.0},
            {"id": "MOM-04", "category_id": "cat-momos", "name": "Chicken Cheese Steamed Momos (6 pcs)", "price": 119.00, "selling_unit": "piece", "description": "6 steamed chicken momos infused with melted cheese.", "image_url": "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-MOMOS", "deduction_qty": 6.0},
            {"id": "MOM-05", "category_id": "cat-momos", "name": "Chicken BBQ Steamed Momos (6 pcs)", "price": 119.00, "selling_unit": "piece", "description": "6 steamed chicken momos glazed with smoky BBQ sauce.", "image_url": "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-MOMOS", "deduction_qty": 6.0},

            # Shawarma
            {"id": "SHW-01", "category_id": "cat-shawarma", "name": "Regular Shawarma (Roll)", "price": 120.00, "selling_unit": "piece", "description": "Authentic roasted chicken wrapped in rumali roti with garlic mayo.", "image_url": "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-SHAWARMA", "deduction_qty": 1.0},
            {"id": "SHW-02", "category_id": "cat-shawarma", "name": "Regular Shawarma (Plate)", "price": 160.00, "selling_unit": "piece", "description": "Open plate loaded with roasted shawarma chicken, salad & kuboos.", "image_url": "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-SHAWARMA", "deduction_qty": 1.0},
            {"id": "SHW-03", "category_id": "cat-shawarma", "name": "Mexican Shawarma (Roll)", "price": 120.00, "selling_unit": "piece", "description": "Spicy Mexican salsa spiced chicken shawarma roll.", "image_url": "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-SHAWARMA", "deduction_qty": 1.0},
            {"id": "SHW-04", "category_id": "cat-shawarma", "name": "Mexican Shawarma (Plate)", "price": 160.00, "selling_unit": "piece", "description": "Platter of Mexican spiced roasted shawarma chicken.", "image_url": "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-SHAWARMA", "deduction_qty": 1.0},
            {"id": "SHW-05", "category_id": "cat-shawarma", "name": "Sweet Chilli Shawarma (Roll)", "price": 120.00, "selling_unit": "piece", "description": "Sweet & tangy chilli glazed chicken shawarma roll.", "image_url": "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-SHAWARMA", "deduction_qty": 1.0},
            {"id": "SHW-06", "category_id": "cat-shawarma", "name": "Sweet Chilli Shawarma (Plate)", "price": 160.00, "selling_unit": "piece", "description": "Platter of sweet chilli glazed roasted chicken shawarma.", "image_url": "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-SHAWARMA", "deduction_qty": 1.0},
            {"id": "SHW-07", "category_id": "cat-shawarma", "name": "BBQ Shawarma (Roll)", "price": 120.00, "selling_unit": "piece", "description": "Smoky hickory BBQ sauce infused chicken shawarma roll.", "image_url": "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-SHAWARMA", "deduction_qty": 1.0},
            {"id": "SHW-08", "category_id": "cat-shawarma", "name": "BBQ Shawarma (Plate)", "price": 160.00, "selling_unit": "piece", "description": "Platter of smoky BBQ roasted chicken shawarma.", "image_url": "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-SHAWARMA", "deduction_qty": 1.0},
            {"id": "SHW-09", "category_id": "cat-shawarma", "name": "Peri-Peri Shawarma (Roll)", "price": 120.00, "selling_unit": "piece", "description": "Fiery African bird's eye peri-peri spiced shawarma roll.", "image_url": "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-SHAWARMA", "deduction_qty": 1.0},
            {"id": "SHW-10", "category_id": "cat-shawarma", "name": "Peri-Peri Shawarma (Plate)", "price": 160.00, "selling_unit": "piece", "description": "Platter of peri-peri roasted chicken shawarma.", "image_url": "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-SHAWARMA", "deduction_qty": 1.0},

            # Shawarma & Mojito Combos
            {"id": "SHM-01", "category_id": "cat-shawarma-mojitos", "name": "Roll + Mojito (Lemon) - Roll", "price": 179.00, "selling_unit": "portion", "description": "1 Shawarma Roll + 1 Lemon Mint Mojito.", "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "SHM-02", "category_id": "cat-shawarma-mojitos", "name": "Roll + Mojito (Lemon) - Plate", "price": 219.00, "selling_unit": "portion", "description": "1 Shawarma Plate + 1 Lemon Mint Mojito.", "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "SHM-03", "category_id": "cat-shawarma-mojitos", "name": "Roll + Mojito (Blue Lagoon) - Roll", "price": 189.00, "selling_unit": "portion", "description": "1 Shawarma Roll + 1 Blue Lagoon Mojito.", "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "SHM-04", "category_id": "cat-shawarma-mojitos", "name": "Roll + Mojito (Blue Lagoon) - Plate", "price": 229.00, "selling_unit": "portion", "description": "1 Shawarma Plate + 1 Blue Lagoon Mojito.", "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "SHM-05", "category_id": "cat-shawarma-mojitos", "name": "Roll + Mojito (Strawberry) - Roll", "price": 199.00, "selling_unit": "portion", "description": "1 Shawarma Roll + 1 Strawberry Mojito.", "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "SHM-06", "category_id": "cat-shawarma-mojitos", "name": "Roll + Mojito (Strawberry) - Plate", "price": 239.00, "selling_unit": "portion", "description": "1 Shawarma Plate + 1 Strawberry Mojito.", "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "SHM-07", "category_id": "cat-shawarma-mojitos", "name": "Roll + Mojito (Green Apple) - Roll", "price": 199.00, "selling_unit": "portion", "description": "1 Shawarma Roll + 1 Green Apple Mojito.", "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "SHM-08", "category_id": "cat-shawarma-mojitos", "name": "Roll + Mojito (Green Apple) - Plate", "price": 239.00, "selling_unit": "portion", "description": "1 Shawarma Plate + 1 Green Apple Mojito.", "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "SHM-09", "category_id": "cat-shawarma-mojitos", "name": "Roll + Mojito (Watermelon) - Roll", "price": 199.00, "selling_unit": "portion", "description": "1 Shawarma Roll + 1 Watermelon Mojito.", "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "SHM-10", "category_id": "cat-shawarma-mojitos", "name": "Roll + Mojito (Watermelon) - Plate", "price": 239.00, "selling_unit": "portion", "description": "1 Shawarma Plate + 1 Watermelon Mojito.", "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},

            # Mojitos
            {"id": "MOJ-01", "category_id": "cat-mojitos", "name": "Lemon Mint Mojito", "price": 79.00, "selling_unit": "glass", "description": "Refreshing classic mint, lime, and crushed ice soda.", "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "MOJ-02", "category_id": "cat-mojitos", "name": "Blue Lagoon Mojito", "price": 89.00, "selling_unit": "glass", "description": "Vibrant blue curacao citrus mocktail.", "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "MOJ-03", "category_id": "cat-mojitos", "name": "Green Apple Mojito", "price": 99.00, "selling_unit": "glass", "description": "Crisp green apple flavored sparkling mojito.", "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "MOJ-04", "category_id": "cat-mojitos", "name": "Watermelon Mojito", "price": 99.00, "selling_unit": "glass", "description": "Sweet fresh watermelon infused iced cooler.", "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "MOJ-05", "category_id": "cat-mojitos", "name": "Strawberry Mojito", "price": 109.00, "selling_unit": "glass", "description": "Ripe berry strawberry crush mojito.", "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},

            # Milkshakes
            {"id": "SHK-01", "category_id": "cat-milkshakes", "name": "Vanilla Milkshake", "price": 89.00, "selling_unit": "glass", "description": "Rich vanilla bean ice cream thick shake.", "image_url": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "SHK-02", "category_id": "cat-milkshakes", "name": "Chocolate Milkshake", "price": 119.00, "selling_unit": "glass", "description": "Decadent chocolate fudge thick shake.", "image_url": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "SHK-03", "category_id": "cat-milkshakes", "name": "Strawberry Milkshake", "price": 119.00, "selling_unit": "glass", "description": "Sweet strawberry ice cream thick blend.", "image_url": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "SHK-04", "category_id": "cat-milkshakes", "name": "Oreo Milkshake", "price": 129.00, "selling_unit": "glass", "description": "Loaded cookies & cream Oreo thick shake.", "image_url": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "SHK-05", "category_id": "cat-milkshakes", "name": "KitKat Milkshake", "price": 139.00, "selling_unit": "glass", "description": "KitKat wafer bars blended in chocolate shake.", "image_url": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},

            # Cold Coffee
            {"id": "COF-01", "category_id": "cat-cold-coffee", "name": "Classic Cold Coffee", "price": 99.00, "selling_unit": "glass", "description": "Rich brewed espresso blended with chilled milk & ice cream.", "image_url": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "COF-02", "category_id": "cat-cold-coffee", "name": "Chocolate Cold Coffee", "price": 119.00, "selling_unit": "glass", "description": "Cold coffee infused with dark chocolate syrup.", "image_url": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "COF-03", "category_id": "cat-cold-coffee", "name": "Oreo Cold Coffee", "price": 129.00, "selling_unit": "glass", "description": "Chilled coffee blended with crushed Oreo cookies.", "image_url": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "COF-04", "category_id": "cat-cold-coffee", "name": "KitKat Cold Coffee", "price": 139.00, "selling_unit": "glass", "description": "Chilled coffee blended with KitKat wafer chunks.", "image_url": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},

            # Scoop Ice Cream
            {"id": "ICE-01", "category_id": "cat-ice-cream", "name": "Vanilla Scoop Ice Cream", "price": 49.00, "selling_unit": "scoop", "description": "Single scoop of classic French vanilla ice cream.", "image_url": "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "ICE-02", "category_id": "cat-ice-cream", "name": "Chocolate Scoop Ice Cream", "price": 59.00, "selling_unit": "scoop", "description": "Single scoop of rich Belgian chocolate ice cream.", "image_url": "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "ICE-03", "category_id": "cat-ice-cream", "name": "Strawberry Scoop Ice Cream", "price": 49.00, "selling_unit": "scoop", "description": "Single scoop of sweet strawberry ice cream.", "image_url": "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "ICE-04", "category_id": "cat-ice-cream", "name": "Butterscotch Scoop Ice Cream", "price": 59.00, "selling_unit": "scoop", "description": "Single scoop of crunchy butterscotch ice cream.", "image_url": "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},
            {"id": "ICE-05", "category_id": "cat-ice-cream", "name": "Pista Scoop Ice Cream", "price": 69.00, "selling_unit": "scoop", "description": "Single scoop of royal pistachio roasted ice cream.", "image_url": "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80", "available": True, "active": True},

            # Cold Drinks
            {"id": "DRK-01", "category_id": "cat-cold-drinks", "name": "Mineral Water (500 ml)", "price": 20.00, "selling_unit": "bottle", "description": "500 ml packaged pure mineral water.", "image_url": "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-WATER", "deduction_qty": 1.0},
            {"id": "DRK-02", "category_id": "cat-cold-drinks", "name": "Thums Up (250 ml)", "price": 40.00, "selling_unit": "can", "description": "250 ml chilled Thums Up can.", "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-COLDDRINK", "deduction_qty": 1.0},
            {"id": "DRK-03", "category_id": "cat-cold-drinks", "name": "Coca-Cola (250 ml)", "price": 40.00, "selling_unit": "can", "description": "250 ml chilled Coca-Cola can.", "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-COLDDRINK", "deduction_qty": 1.0},
            {"id": "DRK-04", "category_id": "cat-cold-drinks", "name": "Sprite (250 ml)", "price": 40.00, "selling_unit": "can", "description": "250 ml chilled Sprite can.", "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-COLDDRINK", "deduction_qty": 1.0},
            {"id": "DRK-05", "category_id": "cat-cold-drinks", "name": "Red Bull (250 ml)", "price": 125.00, "selling_unit": "can", "description": "250 ml energy drink can.", "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", "available": True, "active": True, "inventory_product_id": "ING-REDBULL", "deduction_qty": 1.0},
        ]
        for prod in products_data:
            existing = db["products"].find_one({"$or": [{"id": prod["id"]}, {"name": prod["name"]}]})
            if not existing:
                doc = {**prod, "created_at": now, "updated_at": now}
                db["products"].insert_one(doc)
                print(f"  [+] Added product: {prod['name']}")

        print("--> Master data population into MongoDB completed successfully.")

    except Exception as e:
        print(f"Error during master data population: {e}")
        raise e


if __name__ == "__main__":
    seed_master_data()
