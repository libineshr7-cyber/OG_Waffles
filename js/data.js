/* OG Waffles & Fried Chicken - Mock Data Engine (Indian Rupee ₹ Edition) */

const INITIAL_DATA = {
  settings: {
    businessName: "OG Waffles & Fried Chicken",
    parentBrand: "Odyssey's Group",
    subTitle: "Premium Business Management System",
    address: "108 Luxury Boulevard, Golden Triangle, Jubilee Hills, Hyderabad 500033",
    phone: "+91 98765 43210",
    email: "concierge@ogwaffles.in",
    gstNumber: "36AAAAA0000A1Z5",
    taxRate: 5.0, // 5% GST
    currency: "₹",
    receiptFooter: "Thank you for dining with Odyssey's Group. Premium Quality Guaranteed.",
    logoUrl: "assets/logo.png", // Official Uploaded Logo
    ownerPin: "1234",
    ownerPassword: "admin",
    cashierPin: "3333"
  },

  ingredients: [
    {
      id: "ING-LEG",
      name: "Frozen Chicken Legs",
      category: "Poultry",
      purchaseUnit: "packet",
      baseUnit: "piece",
      unit: "piece",
      conversionQty: 20,
      currentQty: 100,
      minLimit: 10,
      avgCost: 650.00,
      supplier: "Apex Poultry Farms",
      status: "Available",
      lastUpdated: "2026-08-19"
    },
    {
      id: "ING-WINGS",
      name: "Frozen Chicken Wings",
      category: "Poultry",
      purchaseUnit: "packet",
      baseUnit: "piece",
      unit: "piece",
      conversionQty: 40,
      currentQty: 200,
      minLimit: 20,
      avgCost: 550.00,
      supplier: "Apex Poultry Farms",
      status: "Available",
      lastUpdated: "2026-08-19"
    },
    {
      id: "ING-CHKFRIES",
      name: "Frozen Chicken Fries",
      category: "Poultry",
      purchaseUnit: "packet",
      baseUnit: "piece",
      unit: "piece",
      conversionQty: 60,
      currentQty: 180,
      minLimit: 30,
      avgCost: 450.00,
      supplier: "Apex Poultry Farms",
      status: "Available",
      lastUpdated: "2026-08-19"
    },
    {
      id: "ING-POPCORN",
      name: "Frozen Chicken Popcorn",
      category: "Poultry",
      purchaseUnit: "packet",
      baseUnit: "g",
      unit: "g",
      conversionQty: 2000,
      currentQty: 10000,
      minLimit: 1000,
      avgCost: 600.00,
      supplier: "Apex Poultry Farms",
      status: "Available",
      lastUpdated: "2026-08-19"
    },
    {
      id: "ING-STRIPS",
      name: "Frozen Chicken Strips",
      category: "Poultry",
      purchaseUnit: "packet",
      baseUnit: "piece",
      unit: "piece",
      conversionQty: 30,
      currentQty: 150,
      minLimit: 15,
      avgCost: 500.00,
      supplier: "Apex Poultry Farms",
      status: "Available",
      lastUpdated: "2026-08-19"
    },
    {
      id: "ING-NUGGETS",
      name: "Frozen Chicken Nuggets",
      category: "Poultry",
      purchaseUnit: "packet",
      baseUnit: "piece",
      unit: "piece",
      conversionQty: 50,
      currentQty: 250,
      minLimit: 25,
      avgCost: 350.00,
      supplier: "Apex Poultry Farms",
      status: "Available",
      lastUpdated: "2026-08-19"
    },
    {
      id: "ING-BITES",
      name: "Peri-Peri Chicken Bites",
      category: "Poultry",
      purchaseUnit: "packet",
      baseUnit: "piece",
      unit: "piece",
      conversionQty: 50,
      currentQty: 200,
      minLimit: 20,
      avgCost: 400.00,
      supplier: "Apex Poultry Farms",
      status: "Available",
      lastUpdated: "2026-08-19"
    },
    {
      id: "ING-FRIES",
      name: "Frozen French Fries",
      category: "Frozen",
      purchaseUnit: "packet",
      baseUnit: "g",
      unit: "g",
      conversionQty: 2500,
      currentQty: 15000,
      minLimit: 2000,
      avgCost: 300.00,
      supplier: "Harvest Frozen Foods",
      status: "Available",
      lastUpdated: "2026-08-19"
    },
    {
      id: "ING-MOMOS",
      name: "Frozen Steamed Momos",
      category: "Frozen",
      purchaseUnit: "packet",
      baseUnit: "piece",
      unit: "piece",
      conversionQty: 60,
      currentQty: 300,
      minLimit: 30,
      avgCost: 400.00,
      supplier: "Harvest Frozen Foods",
      status: "Available",
      lastUpdated: "2026-08-19"
    },
    {
      id: "ING-SHAWARMA",
      name: "Shawarma Chicken Base",
      category: "Poultry",
      purchaseUnit: "packet",
      baseUnit: "piece",
      unit: "piece",
      conversionQty: 25,
      currentQty: 125,
      minLimit: 15,
      avgCost: 800.00,
      supplier: "Apex Poultry Farms",
      status: "Available",
      lastUpdated: "2026-08-19"
    },
    {
      id: "ING-COLDDRINK",
      name: "Cold Drinks Assorted Cans",
      category: "Beverages",
      purchaseUnit: "packet",
      baseUnit: "can",
      unit: "can",
      conversionQty: 24,
      currentQty: 120,
      minLimit: 20,
      avgCost: 480.00,
      supplier: "Beverage Hub",
      status: "Available",
      lastUpdated: "2026-08-19"
    },
    {
      id: "ING-WATER",
      name: "Mineral Water Bottles (500 ml)",
      category: "Beverages",
      purchaseUnit: "packet",
      baseUnit: "bottle",
      unit: "bottle",
      conversionQty: 24,
      currentQty: 96,
      minLimit: 12,
      avgCost: 240.00,
      supplier: "Beverage Hub",
      status: "Available",
      lastUpdated: "2026-08-19"
    },
    {
      id: "ING-REDBULL",
      name: "Red Bull Energy Cans (250 ml)",
      category: "Beverages",
      purchaseUnit: "packet",
      baseUnit: "can",
      unit: "can",
      conversionQty: 24,
      currentQty: 48,
      minLimit: 6,
      avgCost: 2200.00,
      supplier: "Beverage Hub",
      status: "Available",
      lastUpdated: "2026-08-19"
    }
  ],

  categories: [
    {
      id: "cat-waffles",
      name: "WAFFLES",
      icon: "fa-stroopwafel",
      image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80",
      active: true
    },
    {
      id: "cat-chicken-snacks",
      name: "CHICKEN & SNACKS",
      icon: "fa-drumstick-bite",
      image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80",
      active: true
    },
    {
      id: "cat-combos",
      name: "BEST COMBO OFFERS",
      icon: "fa-utensils",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
      active: true
    },
    {
      id: "cat-momos",
      name: "STEAMED MOMOS",
      icon: "fa-bowl-food",
      image: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=600&q=80",
      active: true
    },
    {
      id: "cat-shawarma",
      name: "SHAWARMA",
      icon: "fa-bread-slice",
      image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80",
      active: true
    },
    {
      id: "cat-shawarma-mojitos",
      name: "SHAWARMA & MOJITO COMBOS",
      icon: "fa-glass-cheers",
      image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",
      active: true
    },
    {
      id: "cat-mojitos",
      name: "MOJITOS",
      icon: "fa-cocktail",
      image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
      active: true
    },
    {
      id: "cat-milkshakes",
      name: "MILK SHAKES",
      icon: "fa-blender",
      image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80",
      active: true
    },
    {
      id: "cat-cold-coffee",
      name: "COLD COFFEE",
      icon: "fa-mug-hot",
      image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80",
      active: true
    },
    {
      id: "cat-ice-cream",
      name: "SCOOP ICE CREAM",
      icon: "fa-ice-cream",
      image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80",
      active: true
    },
    {
      id: "cat-cold-drinks",
      name: "COLD DRINKS",
      icon: "fa-bottle-water",
      image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
      active: true
    }
  ],

  menuItems: [
    // ── 1. WAFFLES ──
    { id: "WAF-01", categoryId: "cat-waffles", category: "WAFFLES", name: "Milk Filling Waffle", price: 99.00, unit: "piece", available: true, active: true, image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", description: "Golden crispy waffle layered with rich milk cream filling." },
    { id: "WAF-02", categoryId: "cat-waffles", category: "WAFFLES", name: "White Filling Waffle", price: 99.00, unit: "piece", available: true, active: true, image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", description: "Warm waffle filled with luscious creamy white chocolate." },
    { id: "WAF-03", categoryId: "cat-waffles", category: "WAFFLES", name: "Dark Filling Waffle", price: 119.00, unit: "piece", available: true, active: true, image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", description: "Crisp waffle with intense Belgian dark chocolate filling." },
    { id: "WAF-04", categoryId: "cat-waffles", category: "WAFFLES", name: "Hazelnut Waffle", price: 129.00, unit: "piece", available: true, active: true, image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", description: "Toasted hazelnut paste drizzled over warm Belgian waffle." },
    { id: "WAF-05", categoryId: "cat-waffles", category: "WAFFLES", name: "Dairy Milk Waffle", price: 129.00, unit: "piece", available: true, active: true, image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", description: "Melted Cadbury Dairy Milk chocolate smothered on waffle." },
    { id: "WAF-06", categoryId: "cat-waffles", category: "WAFFLES", name: "KitKat Waffle", price: 129.00, unit: "piece", available: true, active: true, image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", description: "Loaded with crushed KitKat bars and chocolate drizzle." },
    { id: "WAF-07", categoryId: "cat-waffles", category: "WAFFLES", name: "Oreo Waffle", price: 139.00, unit: "piece", available: true, active: true, image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", description: "Crunchy Oreo crumbs with double cream on golden waffle." },
    { id: "WAF-08", categoryId: "cat-waffles", category: "WAFFLES", name: "Double Chocolate Waffle", price: 139.00, unit: "piece", available: true, active: true, image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", description: "Dual layer of milk and dark melted chocolate." },
    { id: "WAF-09", categoryId: "cat-waffles", category: "WAFFLES", name: "Triple Chocolate Waffle", price: 149.00, unit: "piece", available: true, active: true, image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", description: "Milk, dark, and white chocolate layered waffle." },
    { id: "WAF-10", categoryId: "cat-waffles", category: "WAFFLES", name: "Red Velvet Waffle", price: 149.00, unit: "piece", available: true, active: true, image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", description: "Red velvet waffle with sweet cream cheese and white chocolate." },
    { id: "WAF-11", categoryId: "cat-waffles", category: "WAFFLES", name: "Nutella Waffle", price: 149.00, unit: "piece", available: true, active: true, image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", description: "Generous coating of authentic Nutella spread." },
    { id: "WAF-12", categoryId: "cat-waffles", category: "WAFFLES", name: "Biscoff Waffle", price: 159.00, unit: "piece", available: true, active: true, image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", description: "Caramelized Lotus Biscoff spread and biscuit crumbs." },
    { id: "WAF-13", categoryId: "cat-waffles", category: "WAFFLES", name: "Butterscotch Waffle", price: 159.00, unit: "piece", available: true, active: true, image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", description: "Buttery caramel butterscotch crunch sauce on waffle." },
    { id: "WAF-14", categoryId: "cat-waffles", category: "WAFFLES", name: "Signature OG Waffle", price: 199.00, unit: "piece", available: true, active: true, image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80", description: "Our chef's loaded signature premium waffle tower." },

    // ── 2. CHICKEN & SNACKS ──
    { id: "CHK-01", categoryId: "cat-chicken-snacks", category: "CHICKEN & SNACKS", name: "Crispy Chicken Leg (1 pc)", price: 99.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-LEG", deductQty: 1, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80", description: "Single golden fried crispy chicken drumstick." },
    { id: "CHK-02", categoryId: "cat-chicken-snacks", category: "CHICKEN & SNACKS", name: "Crispy Chicken Leg (2 pcs)", price: 179.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-LEG", deductQty: 2, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80", description: "2 pieces of golden fried crispy chicken drumsticks." },
    { id: "CHK-03", categoryId: "cat-chicken-snacks", category: "CHICKEN & SNACKS", name: "Chicken Wings (4 pcs)", price: 159.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-WINGS", deductQty: 4, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80", description: "4 crispy seasoned golden chicken wings." },
    { id: "CHK-04", categoryId: "cat-chicken-snacks", category: "CHICKEN & SNACKS", name: "Chicken Wings (8 pcs)", price: 299.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-WINGS", deductQty: 8, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80", description: "8 crispy seasoned golden chicken wings sharing pack." },
    { id: "CHK-05", categoryId: "cat-chicken-snacks", category: "CHICKEN & SNACKS", name: "Chicken Fries (6 pcs)", price: 139.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-CHKFRIES", deductQty: 6, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80", description: "6 crispy breaded finger chicken fries." },
    { id: "CHK-06", categoryId: "cat-chicken-snacks", category: "CHICKEN & SNACKS", name: "Chicken Popcorn (150 g)", price: 129.00, unit: "g", available: true, active: true, inventoryProductId: "ING-POPCORN", deductQty: 150, sellingUnit: "g", image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80", description: "150 g of crunchy bite-sized popcorn chicken." },
    { id: "CHK-07", categoryId: "cat-chicken-snacks", category: "CHICKEN & SNACKS", name: "Chicken Strips (3 pcs)", price: 159.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-STRIPS", deductQty: 3, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80", description: "3 whole tender breaded chicken breast strips." },
    { id: "CHK-08", categoryId: "cat-chicken-snacks", category: "CHICKEN & SNACKS", name: "Chicken Nuggets (6 pcs)", price: 129.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-NUGGETS", deductQty: 6, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80", description: "6 golden crispy tender chicken nuggets." },
    { id: "CHK-09", categoryId: "cat-chicken-snacks", category: "CHICKEN & SNACKS", name: "Peri-Peri Chicken Bites (8 pcs)", price: 139.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-BITES", deductQty: 8, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80", description: "8 pieces of spicy peri-peri dusted chicken bites." },
    { id: "CHK-10", categoryId: "cat-chicken-snacks", category: "CHICKEN & SNACKS", name: "French Fries Regular (100 g)", price: 89.00, unit: "g", available: true, active: true, inventoryProductId: "ING-FRIES", deductQty: 100, sellingUnit: "g", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80", description: "100 g of hot salted crispy potato fries." },
    { id: "CHK-11", categoryId: "cat-chicken-snacks", category: "CHICKEN & SNACKS", name: "French Fries Large (150 g)", price: 129.00, unit: "g", available: true, active: true, inventoryProductId: "ING-FRIES", deductQty: 150, sellingUnit: "g", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80", description: "150 g large portion of hot salted potato fries." },
    { id: "CHK-12", categoryId: "cat-chicken-snacks", category: "CHICKEN & SNACKS", name: "Chicken Drumsticks Bucket (4 pcs)", price: 349.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-LEG", deductQty: 4, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80", description: "4 crispy golden fried chicken drumsticks in bucket." },

    // ── 3. BEST COMBO OFFERS ──
    { id: "CMB-01", categoryId: "cat-combos", category: "BEST COMBO OFFERS", name: "Single Chicken Delight Combo", price: 199.00, unit: "portion", available: true, active: true, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80", description: "1 Crispy Leg + Regular Fries (100g) + Cold Drink (250ml)." },
    { id: "CMB-02", categoryId: "cat-combos", category: "BEST COMBO OFFERS", name: "Wings & Fries Combo", price: 249.00, unit: "portion", available: true, active: true, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80", description: "4 Chicken Wings + Regular Fries + Lemon Mint Mojito." },
    { id: "CMB-03", categoryId: "cat-combos", category: "BEST COMBO OFFERS", name: "Shawarma Feast Combo", price: 219.00, unit: "portion", available: true, active: true, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80", description: "1 Regular Shawarma Roll + Regular Fries + Cold Drink." },
    { id: "CMB-04", categoryId: "cat-combos", category: "BEST COMBO OFFERS", name: "Waffle & Shake Combo", price: 179.00, unit: "portion", available: true, active: true, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80", description: "1 Milk Filling Waffle + 1 Vanilla Milkshake." },
    { id: "CMB-05", categoryId: "cat-combos", category: "BEST COMBO OFFERS", name: "Snack Attack Combo", price: 229.00, unit: "portion", available: true, active: true, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80", description: "Chicken Popcorn (150g) + Regular Fries + Cold Drink." },
    { id: "CMB-06", categoryId: "cat-combos", category: "BEST COMBO OFFERS", name: "OG Mega Bucket Combo", price: 499.00, unit: "portion", available: true, active: true, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80", description: "4 Drumsticks + 4 Wings + Large Fries + 2 Cold Drinks." },

    // ── 4. STEAMED MOMOS ──
    { id: "MOM-01", categoryId: "cat-momos", category: "STEAMED MOMOS", name: "Veg Steamed Momos (6 pcs)", price: 79.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-MOMOS", deductQty: 6, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=600&q=80", description: "6 freshly steamed authentic vegetable momos." },
    { id: "MOM-02", categoryId: "cat-momos", category: "STEAMED MOMOS", name: "Paneer Steamed Momos (6 pcs)", price: 89.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-MOMOS", deductQty: 6, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=600&q=80", description: "6 steamed momos stuffed with spiced cottage cheese." },
    { id: "MOM-03", categoryId: "cat-momos", category: "STEAMED MOMOS", name: "Chicken Steamed Momos (6 pcs)", price: 99.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-MOMOS", deductQty: 6, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=600&q=80", description: "6 juicy spiced minced chicken steamed momos." },
    { id: "MOM-04", categoryId: "cat-momos", category: "STEAMED MOMOS", name: "Chicken Cheese Steamed Momos (6 pcs)", price: 119.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-MOMOS", deductQty: 6, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=600&q=80", description: "6 steamed chicken momos infused with melted cheese." },
    { id: "MOM-05", categoryId: "cat-momos", category: "STEAMED MOMOS", name: "Chicken BBQ Steamed Momos (6 pcs)", price: 119.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-MOMOS", deductQty: 6, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=600&q=80", description: "6 steamed chicken momos glazed with smoky BBQ sauce." },

    // ── 5. SHAWARMA ──
    { id: "SHW-01", categoryId: "cat-shawarma", category: "SHAWARMA", name: "Regular Shawarma (Roll)", price: 120.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-SHAWARMA", deductQty: 1, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80", description: "Authentic roasted chicken wrapped in rumali roti with garlic mayo." },
    { id: "SHW-02", categoryId: "cat-shawarma", category: "SHAWARMA", name: "Regular Shawarma (Plate)", price: 160.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-SHAWARMA", deductQty: 1, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80", description: "Open plate loaded with roasted shawarma chicken, salad & kuboos." },
    { id: "SHW-03", categoryId: "cat-shawarma", category: "SHAWARMA", name: "Mexican Shawarma (Roll)", price: 120.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-SHAWARMA", deductQty: 1, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80", description: "Spicy Mexican salsa spiced chicken shawarma roll." },
    { id: "SHW-04", categoryId: "cat-shawarma", category: "SHAWARMA", name: "Mexican Shawarma (Plate)", price: 160.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-SHAWARMA", deductQty: 1, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80", description: "Platter of Mexican spiced roasted shawarma chicken." },
    { id: "SHW-05", categoryId: "cat-shawarma", category: "SHAWARMA", name: "Sweet Chilli Shawarma (Roll)", price: 120.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-SHAWARMA", deductQty: 1, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80", description: "Sweet & tangy chilli glazed chicken shawarma roll." },
    { id: "SHW-06", categoryId: "cat-shawarma", category: "SHAWARMA", name: "Sweet Chilli Shawarma (Plate)", price: 160.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-SHAWARMA", deductQty: 1, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80", description: "Platter of sweet chilli glazed roasted chicken shawarma." },
    { id: "SHW-07", categoryId: "cat-shawarma", category: "SHAWARMA", name: "BBQ Shawarma (Roll)", price: 120.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-SHAWARMA", deductQty: 1, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80", description: "Smoky hickory BBQ sauce infused chicken shawarma roll." },
    { id: "SHW-08", categoryId: "cat-shawarma", category: "SHAWARMA", name: "BBQ Shawarma (Plate)", price: 160.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-SHAWARMA", deductQty: 1, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80", description: "Platter of smoky BBQ roasted chicken shawarma." },
    { id: "SHW-09", categoryId: "cat-shawarma", category: "SHAWARMA", name: "Peri-Peri Shawarma (Roll)", price: 120.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-SHAWARMA", deductQty: 1, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80", description: "Fiery African bird's eye peri-peri spiced shawarma roll." },
    { id: "SHW-10", categoryId: "cat-shawarma", category: "SHAWARMA", name: "Peri-Peri Shawarma (Plate)", price: 160.00, unit: "piece", available: true, active: true, inventoryProductId: "ING-SHAWARMA", deductQty: 1, sellingUnit: "piece", image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80", description: "Platter of peri-peri roasted chicken shawarma." },

    // ── 6. SHAWARMA & MOJITO COMBOS ──
    { id: "SHM-01", categoryId: "cat-shawarma-mojitos", category: "SHAWARMA & MOJITO COMBOS", name: "Roll + Mojito (Lemon) - Roll", price: 179.00, unit: "portion", available: true, active: true, image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", description: "1 Shawarma Roll + 1 Lemon Mint Mojito." },
    { id: "SHM-02", categoryId: "cat-shawarma-mojitos", category: "SHAWARMA & MOJITO COMBOS", name: "Roll + Mojito (Lemon) - Plate", price: 219.00, unit: "portion", available: true, active: true, image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", description: "1 Shawarma Plate + 1 Lemon Mint Mojito." },
    { id: "SHM-03", categoryId: "cat-shawarma-mojitos", category: "SHAWARMA & MOJITO COMBOS", name: "Roll + Mojito (Blue Lagoon) - Roll", price: 189.00, unit: "portion", available: true, active: true, image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", description: "1 Shawarma Roll + 1 Blue Lagoon Mojito." },
    { id: "SHM-04", categoryId: "cat-shawarma-mojitos", category: "SHAWARMA & MOJITO COMBOS", name: "Roll + Mojito (Blue Lagoon) - Plate", price: 229.00, unit: "portion", available: true, active: true, image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", description: "1 Shawarma Plate + 1 Blue Lagoon Mojito." },
    { id: "SHM-05", categoryId: "cat-shawarma-mojitos", category: "SHAWARMA & MOJITO COMBOS", name: "Roll + Mojito (Strawberry) - Roll", price: 199.00, unit: "portion", available: true, active: true, image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", description: "1 Shawarma Roll + 1 Strawberry Mojito." },
    { id: "SHM-06", categoryId: "cat-shawarma-mojitos", category: "SHAWARMA & MOJITO COMBOS", name: "Roll + Mojito (Strawberry) - Plate", price: 239.00, unit: "portion", available: true, active: true, image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", description: "1 Shawarma Plate + 1 Strawberry Mojito." },
    { id: "SHM-07", categoryId: "cat-shawarma-mojitos", category: "SHAWARMA & MOJITO COMBOS", name: "Roll + Mojito (Green Apple) - Roll", price: 199.00, unit: "portion", available: true, active: true, image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", description: "1 Shawarma Roll + 1 Green Apple Mojito." },
    { id: "SHM-08", categoryId: "cat-shawarma-mojitos", category: "SHAWARMA & MOJITO COMBOS", name: "Roll + Mojito (Green Apple) - Plate", price: 239.00, unit: "portion", available: true, active: true, image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", description: "1 Shawarma Plate + 1 Green Apple Mojito." },
    { id: "SHM-09", categoryId: "cat-shawarma-mojitos", category: "SHAWARMA & MOJITO COMBOS", name: "Roll + Mojito (Watermelon) - Roll", price: 199.00, unit: "portion", available: true, active: true, image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", description: "1 Shawarma Roll + 1 Watermelon Mojito." },
    { id: "SHM-10", categoryId: "cat-shawarma-mojitos", category: "SHAWARMA & MOJITO COMBOS", name: "Roll + Mojito (Watermelon) - Plate", price: 239.00, unit: "portion", available: true, active: true, image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", description: "1 Shawarma Plate + 1 Watermelon Mojito." },

    // ── 7. MOJITOS ──
    { id: "MOJ-01", categoryId: "cat-mojitos", category: "MOJITOS", name: "Lemon Mint Mojito", price: 79.00, unit: "glass", available: true, active: true, image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80", description: "Refreshing classic mint, lime, and crushed ice soda." },
    { id: "MOJ-02", categoryId: "cat-mojitos", category: "MOJITOS", name: "Blue Lagoon Mojito", price: 89.00, unit: "glass", available: true, active: true, image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80", description: "Vibrant blue curacao citrus mocktail." },
    { id: "MOJ-03", categoryId: "cat-mojitos", category: "MOJITOS", name: "Green Apple Mojito", price: 99.00, unit: "glass", available: true, active: true, image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80", description: "Crisp green apple flavored sparkling mojito." },
    { id: "MOJ-04", categoryId: "cat-mojitos", category: "MOJITOS", name: "Watermelon Mojito", price: 99.00, unit: "glass", available: true, active: true, image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80", description: "Sweet fresh watermelon infused iced cooler." },
    { id: "MOJ-05", categoryId: "cat-mojitos", category: "MOJITOS", name: "Strawberry Mojito", price: 109.00, unit: "glass", available: true, active: true, image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80", description: "Ripe berry strawberry crush mojito." },

    // ── 8. MILK SHAKES ──
    { id: "SHK-01", categoryId: "cat-milkshakes", category: "MILK SHAKES", name: "Vanilla Milkshake", price: 89.00, unit: "glass", available: true, active: true, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80", description: "Rich vanilla bean ice cream thick shake." },
    { id: "SHK-02", categoryId: "cat-milkshakes", category: "MILK SHAKES", name: "Chocolate Milkshake", price: 119.00, unit: "glass", available: true, active: true, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80", description: "Decadent chocolate fudge thick shake." },
    { id: "SHK-03", categoryId: "cat-milkshakes", category: "MILK SHAKES", name: "Strawberry Milkshake", price: 119.00, unit: "glass", available: true, active: true, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80", description: "Sweet strawberry ice cream thick blend." },
    { id: "SHK-04", categoryId: "cat-milkshakes", category: "MILK SHAKES", name: "Oreo Milkshake", price: 129.00, unit: "glass", available: true, active: true, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80", description: "Loaded cookies & cream Oreo thick shake." },
    { id: "SHK-05", categoryId: "cat-milkshakes", category: "MILK SHAKES", name: "KitKat Milkshake", price: 139.00, unit: "glass", available: true, active: true, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80", description: "KitKat wafer bars blended in chocolate shake." },

    // ── 9. COLD COFFEE ──
    { id: "COF-01", categoryId: "cat-cold-coffee", category: "COLD COFFEE", name: "Classic Cold Coffee", price: 99.00, unit: "glass", available: true, active: true, image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80", description: "Rich brewed espresso blended with chilled milk & ice cream." },
    { id: "COF-02", categoryId: "cat-cold-coffee", category: "COLD COFFEE", name: "Chocolate Cold Coffee", price: 119.00, unit: "glass", available: true, active: true, image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80", description: "Cold coffee infused with dark chocolate syrup." },
    { id: "COF-03", categoryId: "cat-cold-coffee", category: "COLD COFFEE", name: "Oreo Cold Coffee", price: 129.00, unit: "glass", available: true, active: true, image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80", description: "Chilled coffee blended with crushed Oreo cookies." },
    { id: "COF-04", categoryId: "cat-cold-coffee", category: "COLD COFFEE", name: "KitKat Cold Coffee", price: 139.00, unit: "glass", available: true, active: true, image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80", description: "Chilled coffee blended with KitKat wafer chunks." },

    // ── 10. SCOOP ICE CREAM ──
    { id: "ICE-01", categoryId: "cat-ice-cream", category: "SCOOP ICE CREAM", name: "Vanilla Scoop Ice Cream", price: 49.00, unit: "scoop", available: true, active: true, image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80", description: "Single scoop of classic French vanilla ice cream." },
    { id: "ICE-02", categoryId: "cat-ice-cream", category: "SCOOP ICE CREAM", name: "Chocolate Scoop Ice Cream", price: 59.00, unit: "scoop", available: true, active: true, image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80", description: "Single scoop of rich Belgian chocolate ice cream." },
    { id: "ICE-03", categoryId: "cat-ice-cream", category: "SCOOP ICE CREAM", name: "Strawberry Scoop Ice Cream", price: 49.00, unit: "scoop", available: true, active: true, image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80", description: "Single scoop of sweet strawberry ice cream." },
    { id: "ICE-04", categoryId: "cat-ice-cream", category: "SCOOP ICE CREAM", name: "Butterscotch Scoop Ice Cream", price: 59.00, unit: "scoop", available: true, active: true, image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80", description: "Single scoop of crunchy butterscotch ice cream." },
    { id: "ICE-05", categoryId: "cat-ice-cream", category: "SCOOP ICE CREAM", name: "Pista Scoop Ice Cream", price: 69.00, unit: "scoop", available: true, active: true, image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80", description: "Single scoop of royal pistachio roasted ice cream." },

    // ── 11. COLD DRINKS ──
    { id: "DRK-01", categoryId: "cat-cold-drinks", category: "COLD DRINKS", name: "Mineral Water (500 ml)", price: 20.00, unit: "bottle", available: true, active: true, inventoryProductId: "ING-WATER", deductQty: 1, sellingUnit: "bottle", image: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80", description: "500 ml packaged pure mineral water." },
    { id: "DRK-02", categoryId: "cat-cold-drinks", category: "COLD DRINKS", name: "Thums Up (250 ml)", price: 40.00, unit: "can", available: true, active: true, inventoryProductId: "ING-COLDDRINK", deductQty: 1, sellingUnit: "can", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80", description: "250 ml chilled Thums Up can." },
    { id: "DRK-03", categoryId: "cat-cold-drinks", category: "COLD DRINKS", name: "Coca-Cola (250 ml)", price: 40.00, unit: "can", available: true, active: true, inventoryProductId: "ING-COLDDRINK", deductQty: 1, sellingUnit: "can", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80", description: "250 ml chilled Coca-Cola can." },
    { id: "DRK-04", categoryId: "cat-cold-drinks", category: "COLD DRINKS", name: "Sprite (250 ml)", price: 40.00, unit: "can", available: true, active: true, inventoryProductId: "ING-COLDDRINK", deductQty: 1, sellingUnit: "can", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80", description: "250 ml chilled Sprite can." },
    { id: "DRK-05", categoryId: "cat-cold-drinks", category: "COLD DRINKS", name: "Red Bull (250 ml)", price: 125.00, unit: "can", available: true, active: true, inventoryProductId: "ING-REDBULL", deductQty: 1, sellingUnit: "can", image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", description: "250 ml energy drink can." }
  ],

  customers: [
    {
      id: "CUST-101",
      name: "Rahul Sharma",
      phone: "9876543210",
      visits: 4,
      totalSpent: 1200.00,
      rewardProgress: 0,
      lastVisit: "2026-08-18",
      purchaseHistory: [
        {
          billNo: "INV-1001",
          date: "2026-08-18",
          time: "15:30",
          items: [{ name: "Crispy Chicken Leg (1 pc)", qty: 1, price: 99.00 }, { name: "French Fries Regular (100 g)", qty: 1, price: 89.00 }],
          totalAmount: 188.00,
          paymentMethod: "UPI"
        }
      ],
      visitHistory: []
    },
    {
      id: "CUST-102",
      name: "Sophia Martinez",
      phone: "9876501899",
      visits: 10,
      totalSpent: 6250.00,
      rewardProgress: 10,
      lastVisit: "2026-08-19",
      purchaseHistory: [
        {
          billNo: "INV-1008",
          date: "2026-08-19",
          time: "14:32",
          items: [{ name: "Nutella Waffle", qty: 2, price: 149.00 }],
          totalAmount: 298.00,
          paymentMethod: "UPI"
        }
      ],
      visitHistory: [
        { visit: 10, date: "2026-08-19", amount: 298.00 }
      ]
    }
  ],

  purchases: [
    {
      id: "PUR-801",
      date: "2026-08-19",
      ingredientId: "ING-LEG",
      ingredientName: "Frozen Chicken Legs",
      supplier: "Apex Poultry Farms",
      invoiceNo: "INV-APX-994",
      purchaseQty: 10,
      purchaseUnit: "packet",
      conversionQty: 20,
      totalBaseQty: 200,
      qty: 200,
      unit: "piece",
      unitPrice: 650.00,
      tax: 0.00,
      totalAmount: 6500.00,
      paymentStatus: "Paid",
      remarks: "10 packets of frozen chicken legs (20 pcs per packet)"
    }
  ],

  expenses: [
    { id: "EXP-901", date: "2026-08-19", category: "Stock", description: "Fresh Frozen Poultry Stock", amount: 6500.00, paidTo: "Apex Poultry Farms", method: "UPI", remarks: "10 packets" },
    { id: "EXP-902", date: "2026-08-01", category: "Rent", description: "Monthly Prime Location Rent", amount: 45000.00, paidTo: "Golden Square Realty", method: "Bank Transfer", remarks: "August Store Rent" }
  ],

  orders: [
    {
      id: "INV-1008",
      date: "2026-08-19",
      time: "14:32",
      customerName: "Sophia Martinez",
      customerPhone: "9876501899",
      items: [
        { id: "WAF-11", name: "Nutella Waffle", price: 149.00, qty: 2 }
      ],
      subtotal: 298.00,
      tax: 14.90,
      discount: 0,
      grandTotal: 312.90,
      paymentMethod: "UPI",
      status: "Completed",
      cashier: "Admin Owner"
    }
  ],

  staff: [
    { id: "EMP-01", name: "Dominic Sterling", role: "Head Chef", phone: "+91 98765 88122", salary: 45000, joiningDate: "2024-01-10", shift: "Morning (8 AM - 4 PM)", status: "Active" },
    { id: "EMP-02", name: "Elena Rostova", role: "Shift Supervisor", phone: "+91 98765 88133", salary: 35000, joiningDate: "2024-03-15", shift: "General (10 AM - 7 PM)", status: "Active" },
    { id: "EMP-03", name: "Jason Vance", role: "Cashier", phone: "+91 98765 88144", salary: 22000, joiningDate: "2025-06-01", shift: "Evening (3 PM - 11 PM)", status: "Active" }
  ],

  suppliers: [
    { id: "SUP-01", name: "Apex Poultry Farms", phone: "+91 98765 44111", address: "Farm Rd 40, Telangana", gstNo: "36APXPB88121", productsSupplied: "Frozen Chicken, Nuggets", balance: 0.00 },
    { id: "SUP-02", name: "Harvest Frozen Foods", phone: "+91 98765 99222", address: "Industrial Zone, AP", gstNo: "37GGCGG77121", productsSupplied: "Fries", balance: 0.00 }
  ],

  wasteLogs: [
    { id: "WST-301", date: "2026-08-18", ingredientId: "ING-01", ingredientName: "Frozen Chicken", qty: 250, reason: "Thaw damage", loggedBy: "Dominic Sterling" }
  ],

  notifications: [
    { id: "NOT-01", title: "System Ready", message: "OG Waffles Direct Inventory & POS system initialized", type: "info", timestamp: "2026-08-19 10:00" }
  ],

  stockMovements: []
};
