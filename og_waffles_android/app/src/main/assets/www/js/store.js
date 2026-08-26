/* OG Waffles & Fried Chicken - Reactive Store Engine (INR ₹ Edition) */

class Store {
  constructor() {
    this.listeners = [];
    this.loadState();
  }

  loadState() {
    const saved = localStorage.getItem("OG_WAFFLES_POS_STORE_V2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // ── STRUCTURAL validity check ────────────────────────────────
        // Only verify that the saved object has the core arrays — do NOT
        // check specific setting VALUES (logoUrl, currency, etc.) because
        // those can legitimately change (e.g. user uploads a custom logo),
        // and checking them caused silent data-loss on every page refresh.
        const isValid = parsed
          && parsed.settings
          && Array.isArray(parsed.menuItems)
          && Array.isArray(parsed.ingredients)
          && Array.isArray(parsed.orders);

        if (isValid) {
          this.state = parsed;

          if (!this.state.menuVersion || this.state.menuVersion < 4) {
            this.state.menuVersion = 4;
            this.saveState();
          }

          if (!this.state.menuCategories)  this.state.menuCategories = [];
          if (!this.state.wasteLogs)       this.state.wasteLogs = [];
          if (!this.state.notifications)   this.state.notifications = [];
          if (!this.state.purchases)       this.state.purchases = [];
          if (!this.state.customers)       this.state.customers = [];
          if (!this.state.staff)           this.state.staff = [];
          if (!this.state.suppliers)       this.state.suppliers = [];
          if (!this.state.expenses)        this.state.expenses = [];
          if (!this.state.stockMovements)  this.state.stockMovements = [];
          if (this.state.currentUser === undefined) this.state.currentUser = null;

          // ── Clean up legacy branding & force updated outlet address/phone ──
          if (this.state.settings) {
            this.state.settings.businessName = "OG Waffles & Fried Chicken";
            this.state.settings.parentBrand = "OG Waffles & Fried Chicken";
            this.state.settings.address = "No. 390, paneer nagar, thiruvalluvar salai, mogapair east, chennai - 600037";
            this.state.settings.phone = "+91 93633 23102";
            this.state.settings.receiptFooter = "Thank you for dining with OG";
          }
          return;
        }
      } catch (e) {
        console.error("[OG Waffles] Failed to parse saved state — resetting to demo data.", e);
      }
    }
    // No valid saved state → seed with INITIAL_DATA
    this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.state.menuVersion = 4;
    if (!this.state.menuCategories) this.state.menuCategories = [];
    if (!this.state.categories) this.state.categories = JSON.parse(JSON.stringify(INITIAL_DATA.categories || []));
    if (this.state.currentUser === undefined) this.state.currentUser = null;
    this.saveState();
  }

  saveState() {
    try {
      localStorage.setItem("OG_WAFFLES_POS_STORE_V2", JSON.stringify(this.state));
    } catch (e) {
      console.warn("[OG Waffles Store] LocalStorage save warning:", e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  getState() {
    return this.state;
  }

  // loginStrict: validates ONLY the exact role selected (OWNER or CASHIER).
  loginStrict(role, credential) {
    const s = this.state.settings;
    let isValid = false;

    if (role === "OWNER") {
      isValid = (credential === s.ownerPin || credential === s.ownerPassword);
    } else if (role === "CASHIER") {
      isValid = (credential === s.cashierPin);
    }

    if (isValid) {
      this.state.currentUser = {
        role,
        name: role === "OWNER" ? "Owner Admin" : "Cashier"
      };
      this.saveState();
      return { success: true };
    }
    return { success: false, message: `Invalid PIN for ${role} role.` };
  }

  // login: legacy permissive login kept for backward compatibility
  login(role, credential) {
    return this.loginStrict(role, credential);
  }

  logout() {
    // Clear ONLY the session — never touch business data
    this.state.currentUser = null;
    this.saveState();
    // Also clear any sessionStorage keys to prevent stale sessions
    try { sessionStorage.removeItem("ogw_session"); } catch(e) {}
  }

  // --- POS BILLING & INVENTORY AUTO-DEDUCTION ENGINE ---

  // Calculate actual COGS for an order based on recipe ingredient costs.
  // Returns the total ingredient cost (in ₹) for the given cart items.
  calcOrderCogs(items) {
    let totalCogs = 0;
    items.forEach(cartItem => {
      const menuItem = this.state.menuItems.find(m => m.id === cartItem.id);
      if (menuItem && menuItem.ingredients) {
        menuItem.ingredients.forEach(recipeIng => {
          const ing = this.state.ingredients.find(i => i.id === recipeIng.ingredientId);
          if (ing && ing.avgCost) {
            totalCogs += recipeIng.qty * cartItem.qty * ing.avgCost;
          }
        });
      }
    });
    return parseFloat(totalCogs.toFixed(2));
  }

  createOrder({ customerName, customerPhone, items, subtotal, tax, discount, grandTotal, paymentMethod }) {
    const invoiceNo = 'INV-' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    // Ensure arrays exist
    if (!this.state.stockMovements) this.state.stockMovements = [];
    if (!this.state.customers) this.state.customers = [];

    // 1. DEDUCT DIRECT INVENTORY PRODUCT (OR RECIPE INGREDIENTS) + LOG STOCK MOVEMENTS
    items.forEach(cartItem => {
      const menuItem = this.state.menuItems.find(m => m.id === cartItem.id);
      if (!menuItem) return;

      // Type A: Direct Inventory Connection
      if (menuItem.inventoryProductId) {
        const ing = this.state.ingredients.find(i => i.id === menuItem.inventoryProductId);
        if (ing) {
          const deductPerItem = parseFloat(menuItem.deductQty) || 1;
          const qtyToReduce   = parseFloat((deductPerItem * cartItem.qty).toFixed(4));
          const prevQty       = ing.currentQty;
          ing.currentQty      = Math.max(0, parseFloat((ing.currentQty - qtyToReduce).toFixed(4)));

          // Status check
          if (ing.currentQty <= 0) {
            ing.status = 'Out of Stock';
            this.addNotification('Out of Stock Alert', `${ing.name} is now out of stock!`, 'danger');
          } else if (ing.currentQty <= ing.minLimit) {
            ing.status = 'Running Low';
            this.addNotification('Low Stock Alert', `${ing.name} is running low (${ing.currentQty} ${ing.baseUnit || ing.unit} remaining)`, 'warning');
          } else {
            ing.status = 'Available';
          }
          ing.lastUpdated = dateStr;

          // Log stock movement
          this.state.stockMovements.unshift({
            id:             'MOV-' + Date.now() + '-' + Math.floor(Math.random() * 999),
            date:           dateStr,
            time:           timeStr,
            ingredientId:   ing.id,
            ingredientName: ing.name,
            type:           'SALE',
            change:         -qtyToReduce,
            prevQty:        prevQty,
            newQty:         ing.currentQty,
            refId:          invoiceNo,
            note:           `POS Sale: ${cartItem.name} ×${cartItem.qty} (-${qtyToReduce} ${ing.baseUnit || ing.unit})`
          });
        }
      }
      // Backward-compat: Recipe Ingredients array
      else if (menuItem.ingredients && Array.isArray(menuItem.ingredients) && menuItem.ingredients.length > 0) {
        menuItem.ingredients.forEach(recipeIng => {
          const ing = this.state.ingredients.find(i => i.id === recipeIng.ingredientId);
          if (ing) {
            const qtyToReduce = parseFloat((recipeIng.qty * cartItem.qty).toFixed(4));
            const prevQty     = ing.currentQty;
            ing.currentQty    = Math.max(0, parseFloat((ing.currentQty - qtyToReduce).toFixed(4)));

            if (ing.currentQty <= 0) {
              ing.status = 'Out of Stock';
              this.addNotification('Out of Stock Alert', `${ing.name} is now out of stock!`, 'danger');
            } else if (ing.currentQty <= ing.minLimit) {
              ing.status = 'Running Low';
              this.addNotification('Low Stock Alert', `${ing.name} is running low (${ing.currentQty} ${ing.baseUnit || ing.unit} remaining)`, 'warning');
            } else {
              ing.status = 'Available';
            }
            ing.lastUpdated = dateStr;

            this.state.stockMovements.unshift({
              id:             'MOV-' + Date.now() + '-' + Math.floor(Math.random() * 999),
              date:           dateStr,
              time:           timeStr,
              ingredientId:   ing.id,
              ingredientName: ing.name,
              type:           'SALE',
              change:         -qtyToReduce,
              prevQty:        prevQty,
              newQty:         ing.currentQty,
              refId:          invoiceNo,
              note:           `POS Sale: ${cartItem.name} ×${cartItem.qty}`
            });
          }
        });
      }
    });

    // 2. CALCULATE ACTUAL COGS
    const cogs = this.calcOrderCogs(items);

    // 3. RECORD ORDER
    const newOrder = {
      id:            invoiceNo,
      date:          dateStr,
      time:          timeStr,
      customerName:  customerName || 'Walk-in Guest',
      customerPhone: customerPhone || 'N/A',
      items,
      subtotal,
      tax,
      discount,
      grandTotal,
      cogs,
      paymentMethod,
      status:  'Completed',
      cashier: this.state.currentUser ? this.state.currentUser.name : 'Cashier'
    };

    this.state.orders.unshift(newOrder);

    // 4. CUSTOMER AUTO-REGISTRATION & PURCHASE HISTORY (DO NOT CHANGE REWARDS HERE)
    const rawPhone = (customerPhone || '').toString().trim();
    const cleanDigits = rawPhone.replace(/[^\d]/g, '');
    const isRealPhone = cleanDigits.length >= 7 && rawPhone.toLowerCase() !== 'n/a';

    if (isRealPhone) {
      const matchPhone10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

      // Find existing customer by phone
      let cust = this.state.customers.find(c => {
        const cClean = (c.phone || '').toString().replace(/[^\d]/g, '');
        const c10 = cClean.length >= 10 ? cClean.slice(-10) : cClean;
        return c10 === matchPhone10 || c.phone === rawPhone;
      });

      const purchaseRecord = {
        billNo:        invoiceNo,
        date:          dateStr,
        time:          timeStr,
        items:         JSON.parse(JSON.stringify(items)),
        totalAmount:   grandTotal,
        paymentMethod: paymentMethod
      };

      if (!cust) {
        // Auto-register NEW customer: rewardProgress starts at 0, visitHistory is empty
        const displayName = (customerName && customerName !== 'Walk-in Guest') ? customerName.trim() : 'Valued Guest';
        cust = {
          id:              `CUST-${Math.floor(100 + Math.random() * 9000)}`,
          name:            displayName,
          phone:           rawPhone,
          visits:          1,
          totalSpent:      parseFloat(grandTotal.toFixed(2)),
          rewardProgress:  0,
          lastVisit:       dateStr,
          purchaseHistory: [purchaseRecord],
          visitHistory:    []
        };
        this.state.customers.unshift(cust);
        this.addNotification("Customer Registered", `Auto-registered customer: ${displayName} (${rawPhone})`, "success");
      } else {
        // Update EXISTING customer: update visits, total spent, last visit, and purchase history.
        // DO NOT change rewardProgress or reward visitHistory here!
        cust.visits = (cust.visits || 0) + 1;
        cust.totalSpent = parseFloat(((cust.totalSpent || 0) + grandTotal).toFixed(2));
        cust.lastVisit = dateStr;

        if (!Array.isArray(cust.purchaseHistory)) cust.purchaseHistory = [];
        cust.purchaseHistory.unshift(purchaseRecord);
      }
    }

    this.addNotification("New Sale Completed", `Invoice #${invoiceNo} placed successfully (₹${grandTotal.toFixed(2)})`, "info");
    this.saveState();
    return newOrder;
  }

  // --- PURCHASES ENGINE (PACKET TO BASE UNIT AUTO RESTOCK) ---
  addPurchase({ ingredientId, date, supplier, invoiceNo, qty, purchaseQty, purchaseUnit, conversionQty, totalBaseQty, unit, unitPrice, tax, remarks }) {
    const ing = this.state.ingredients.find(i => i.id === ingredientId);
    if (!ing) return { success: false, message: 'Product not found in inventory' };

    const pQty = parseFloat(purchaseQty !== undefined ? purchaseQty : qty) || 0;
    const cQty = parseFloat(conversionQty) || (ing.conversionQty || 1);
    const pUnit = purchaseUnit || ing.purchaseUnit || 'packet';
    const bUnit = ing.baseUnit || ing.unit || 'piece';
    const baseQtyAdded = parseFloat(totalBaseQty !== undefined ? totalBaseQty : (pQty * cQty));

    const totalAmount = parseFloat(((pQty * parseFloat(unitPrice || 0)) + parseFloat(tax || 0)).toFixed(2));
    const now = new Date();
    const dateStr = date || now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    const newPurchase = {
      id: 'PUR-' + Math.floor(800 + Math.random() * 900),
      date:           dateStr,
      ingredientId,
      ingredientName: ing.name,
      supplier:       supplier || ing.supplier || 'N/A',
      invoiceNo:      invoiceNo || 'INV-' + Date.now(),
      purchaseQty:    pQty,
      purchaseUnit:   pUnit,
      conversionQty:  cQty,
      totalBaseQty:   baseQtyAdded,
      qty:            baseQtyAdded,
      unit:           bUnit,
      unitPrice:      parseFloat(unitPrice || 0),
      tax:            parseFloat(tax || 0),
      totalAmount,
      paymentStatus:  'Paid',
      remarks
    };

    // Auto-increase base inventory stock
    const prevQty  = ing.currentQty;
    ing.currentQty = parseFloat((ing.currentQty + baseQtyAdded).toFixed(4));
    ing.lastUpdated = dateStr;
    if (ing.currentQty <= 0) {
      ing.status = 'Out of Stock';
    } else if (ing.currentQty <= ing.minLimit) {
      ing.status = 'Running Low';
    } else {
      ing.status = 'Available';
    }

    // Log stock movement
    if (!this.state.stockMovements) this.state.stockMovements = [];
    this.state.stockMovements.unshift({
      id:             'MOV-' + Date.now() + '-' + Math.floor(Math.random() * 999),
      date:           dateStr,
      time:           timeStr,
      ingredientId:   ing.id,
      ingredientName: ing.name,
      type:           'PURCHASE',
      change:         baseQtyAdded,
      prevQty:        prevQty,
      newQty:         ing.currentQty,
      refId:          newPurchase.id,
      note:           `Purchase: ${pQty} ${pUnit} (+${baseQtyAdded} ${bUnit}) from ${supplier || 'supplier'}`
    });

    this.state.purchases.unshift(newPurchase);
    this.addNotification('Purchase Added', `Restocked ${pQty} ${pUnit} (+${baseQtyAdded} ${bUnit}) of ${ing.name}`, 'success');
    this.saveState();
    return { success: true };
  }

  // --- EXPENSE MANAGEMENT ---
  addExpense({ category, description, amount, paidTo, method, remarks }) {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];

    const newExp = {
      id: `EXP-${Math.floor(900 + Math.random() * 900)}`,
      date: dateStr,
      category,
      description,
      amount: parseFloat(amount),
      paidTo,
      method,
      remarks
    };

    this.state.expenses.unshift(newExp);
    this.addNotification("Expense Logged", `Logged ₹${amount} for ${category}`, "info");
    this.saveState();
    return { success: true };
  }

  // --- WASTE MANAGEMENT (AUTO REDUCES INVENTORY) ---
  addWaste({ ingredientId, qty, reason }) {
    const ing = this.state.ingredients.find(i => i.id === ingredientId);
    if (!ing) return { success: false, message: "Ingredient not found" };

    const dateStr = new Date().toISOString().split("T")[0];
    const newWaste = {
      id: `WST-${Math.floor(300 + Math.random() * 900)}`,
      date: dateStr,
      ingredientId,
      ingredientName: ing.name,
      qty: parseFloat(qty),
      reason,
      loggedBy: this.state.currentUser ? this.state.currentUser.name : "Staff"
    };

    ing.currentQty = Math.max(0, parseFloat((ing.currentQty - parseFloat(qty)).toFixed(2)));
    if (ing.currentQty === 0) ing.status = "Out of Stock";
    else if (ing.currentQty <= ing.minLimit) ing.status = "Running Low";

    this.state.wasteLogs.unshift(newWaste);
    this.addNotification("Waste Logged", `Logged ${qty} ${ing.unit} waste for ${ing.name} (${reason})`, "warning");
    this.saveState();
    return { success: true };
  }

  // --- REWARD CARD RESET ---
  resetRewardCard(customerId) {
    const cust = this.state.customers.find(c => c.id === customerId);
    if (cust) {
      cust.rewardProgress = 0;
      this.addNotification("Reward Card Reset", `Reset reward progress for ${cust.name}`, "info");
      this.saveState();
    }
  }

  // --- CUSTOMER CRUD MANAGEMENT ---
  addCustomer({ name, phone }) {
    const newCust = {
      id: `CUST-${Math.floor(100 + Math.random() * 9000)}`,
      name,
      phone,
      visits: 0,
      totalSpent: 0,
      rewardProgress: 0,
      lastVisit: new Date().toISOString().split("T")[0],
      purchaseHistory: [],
      visitHistory: []
    };
    this.state.customers.unshift(newCust);
    this.addNotification("Customer Added", `Added new customer: ${name} (${phone})`, "success");
    this.saveState();
    return newCust;
  }

  updateCustomer(customerId, updates) {
    const cust = this.state.customers.find(c => c.id === customerId);
    if (cust) {
      if (updates.name) cust.name = updates.name;
      if (updates.phone) cust.phone = updates.phone;
      this.addNotification("Customer Updated", `Updated customer info for ${cust.name}`, "info");
      this.saveState();
    }
  }

  deleteCustomer(customerId) {
    // PERMISSION CHECK — only OWNER may delete customers
    const role = this.state.currentUser ? this.state.currentUser.role : null;
    if (role !== 'OWNER') {
      return { success: false, message: 'Cashiers do not have permission to delete customers.' };
    }
    const cust = this.state.customers.find(c => c.id === customerId);
    this.state.customers = this.state.customers.filter(c => c.id !== customerId);
    this.addNotification('Customer Deleted', 'Removed ' + (cust ? cust.name : customerId) + ' from database', 'warning');
    this.saveState();
    return { success: true };
  }

  // --- MENU & CATEGORY MANAGEMENT ---
  saveCategory({ id, name, icon, image, image_url, active }) {
    if (!this.state.categories) this.state.categories = [];
    const catName = (name || '').trim();
    if (!catName) return { success: false, message: "Category name is required" };
    const img = image_url !== undefined ? image_url : (image !== undefined ? image : "");

    if (id) {
      const idx = this.state.categories.findIndex(c => c.id === id);
      if (idx !== -1) {
        const oldName = this.state.categories[idx].name;
        this.state.categories[idx] = {
          ...this.state.categories[idx],
          name: catName,
          icon: icon || this.state.categories[idx].icon || "fa-utensils",
          image: img !== undefined ? img : (this.state.categories[idx].image || ""),
          image_url: img !== undefined ? img : (this.state.categories[idx].image_url || this.state.categories[idx].image || ""),
          active: active !== undefined ? active : (this.state.categories[idx].active !== false)
        };
        // Also update products with this category
        if (oldName !== catName && Array.isArray(this.state.menuItems)) {
          this.state.menuItems.forEach(m => {
            if (m.categoryId === id || m.category === oldName) {
              m.categoryId = id;
              m.category = catName;
            }
          });
        }
      } else {
        this.state.categories.push({
          id,
          name: catName,
          icon: icon || "fa-utensils",
          image: img || "",
          image_url: img || "",
          active: active !== undefined ? active : true
        });
      }
    } else {
      const newId = `cat-${catName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
      this.state.categories.push({
        id: newId,
        name: catName,
        icon: icon || "fa-utensils",
        image: img || "",
        image_url: img || "",
        active: active !== undefined ? active : true
      });
    }
    this.addNotification("Category Saved", `Category "${catName}" saved successfully`, "success");
    this.saveState();
    return { success: true };
  }

  deleteCategory(id, deleteProducts = false) {
    if (!this.state.categories) return;
    const cat = this.state.categories.find(c => c.id === id);
    this.state.categories = this.state.categories.filter(c => c.id !== id);
    if (Array.isArray(this.state.menuItems)) {
      if (deleteProducts) {
        this.state.menuItems = this.state.menuItems.filter(m => m.categoryId !== id && m.category_id !== id && (cat ? m.category !== cat.name : true));
      } else {
        this.state.menuItems.forEach(m => {
          if (m.categoryId === id || m.category_id === id || (cat && m.category === cat.name)) {
            m.categoryId = "other";
            m.category_id = "other";
            m.category = "Other";
          }
        });
      }
    }
    this.addNotification("Category Deleted", `"${cat ? cat.name : id}" removed from categories`, "warning");
    this.saveState();
  }

  toggleCategoryStatus(id) {
    if (!this.state.categories) return;
    const cat = this.state.categories.find(c => c.id === id);
    if (cat) {
      cat.active = !cat.active;
      this.addNotification("Category Status Changed", `"${cat.name}" is now ${cat.active ? 'Active' : 'Disabled'}`, "info");
      this.saveState();
    }
  }

  saveMenuItem(item) {
    // Ensure categoryId and category are in sync
    if (this.state.categories && this.state.categories.length > 0) {
      if (item.categoryId || item.category_id) {
        const cId = item.categoryId || item.category_id;
        const foundCat = this.state.categories.find(c => c.id === cId);
        if (foundCat) item.category = foundCat.name;
      } else if (item.category) {
        const foundCat = this.state.categories.find(c => c.name.toLowerCase() === item.category.toLowerCase());
        if (foundCat) {
          item.categoryId = foundCat.id;
          item.category_id = foundCat.id;
        }
      }
    }

    const img = item.image_url !== undefined ? item.image_url : (item.image !== undefined ? item.image : "");
    item.image = img;
    item.image_url = img;
    item.active = item.available !== false;
    item._localModified = true;
    item._localModifiedAt = Date.now();

    if (item.id) {
      const idx = this.state.menuItems.findIndex(m => m.id === item.id || (m.id && m.id.toLowerCase() === item.id.toLowerCase()));
      if (idx !== -1) {
        this.state.menuItems[idx] = { ...this.state.menuItems[idx], ...item };
      } else {
        this.state.menuItems.unshift(item);
      }
    } else {
      item.id = `MENU-${Date.now()}`;
      this.state.menuItems.unshift(item);
    }
    this.saveState();
  }

  deleteMenuItem(id) {
    const item = this.state.menuItems.find(m => m.id === id || (m.id && m.id.toLowerCase() === id.toLowerCase()));
    this.state.menuItems = this.state.menuItems.filter(m => m.id !== id && (m.id ? m.id.toLowerCase() !== id.toLowerCase() : true));
    this.addNotification("Product Deleted", `"${item ? item.name : id}" removed from menu`, "warning");
    this.saveState();
  }

  toggleMenuItemAvailability(id) {
    const item = this.state.menuItems.find(m => m.id === id);
    if (item) {
      item.available = !item.available;
      item.active = item.available;
      this.addNotification("Item Status Changed", `"${item.name}" is now ${item.available ? 'Available' : 'Unavailable'}`, "info");
      this.saveState();
    }
  }

  addMenuCategory(categoryName) {
    if (!this.state.menuCategories) this.state.menuCategories = [];
    if (!this.state.menuCategories.includes(categoryName)) {
      this.state.menuCategories.push(categoryName);
    }
    if (!this.state.categories) this.state.categories = [];
    if (!this.state.categories.some(c => c.name.toLowerCase() === categoryName.toLowerCase())) {
      this.state.categories.push({
        id: `cat-${categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: categoryName,
        icon: "fa-utensils",
        image: "",
        active: true
      });
    }
    this.saveState();
  }

  // --- INVENTORY PRODUCT MANAGEMENT ---
  saveIngredient(ing) {
    if (!ing.baseUnit) ing.baseUnit = ing.unit || "piece";
    if (!ing.purchaseUnit) ing.purchaseUnit = "packet";
    if (!ing.conversionQty) ing.conversionQty = 1;
    ing.unit = ing.baseUnit; // synchronize unit field

    if (ing.id) {
      const idx = this.state.ingredients.findIndex(i => i.id === ing.id);
      if (idx !== -1) {
        this.state.ingredients[idx] = { ...this.state.ingredients[idx], ...ing };
      } else {
        this.state.ingredients.unshift(ing);
      }
    } else {
      ing.id = `ING-${Math.floor(10 + Math.random() * 90)}`;
      ing.lastUpdated = new Date().toISOString().split("T")[0];
      this.state.ingredients.unshift(ing);
    }
    this.saveState();
  }

  deleteIngredient(id) {
    this.state.ingredients = this.state.ingredients.filter(i => i.id !== id);
    this.saveState();
  }

  // --- STAFF & SUPPLIER CRUD ---
  saveStaff(emp) {
    if (emp.id) {
      const idx = this.state.staff.findIndex(e => e.id === emp.id);
      if (idx !== -1) this.state.staff[idx] = emp;
    } else {
      emp.id = `EMP-${Math.floor(10 + Math.random() * 90)}`;
      this.state.staff.unshift(emp);
    }
    this.saveState();
  }

  deleteStaff(id) {
    this.state.staff = this.state.staff.filter(e => e.id !== id);
    this.saveState();
  }

  saveSupplier(sup) {
    if (sup.id) {
      const idx = this.state.suppliers.findIndex(s => s.id === sup.id);
      if (idx !== -1) this.state.suppliers[idx] = sup;
    } else {
      sup.id = `SUP-${Math.floor(10 + Math.random() * 90)}`;
      this.state.suppliers.unshift(sup);
    }
    this.saveState();
  }

  deleteSupplier(id) {
    this.state.suppliers = this.state.suppliers.filter(s => s.id !== id);
    this.saveState();
  }

  // --- SETTINGS & NOTIFICATIONS ---
  updateSettings(newSettings) {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.addNotification("Settings Saved", "Updated business settings successfully", "success");
    this.saveState();
  }

  addNotification(title, message, type = "info") {
    const notif = {
      id: `NOT-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
    };
    this.state.notifications.unshift(notif);
  }

  clearNotifications() {
    this.state.notifications = [];
    this.saveState();
  }

  // ── Authoritative Backend Master Data Synchronization (V6.2) ──
  async loadMasterData() {
    if (typeof api === "undefined" || !api.getToken()) return;
    try {
      // Master data accessible to all authenticated users (Categories, Products, Inventory, Customers)
      const [cats, prods, inv, custs] = await Promise.all([
        api.categories.list().catch(err => { console.warn("[Store] categories fetch error:", err); return null; }),
        api.products.list().catch(err => { console.warn("[Store] products fetch error:", err); return null; }),
        api.inventory.list().catch(err => { console.warn("[Store] inventory fetch error:", err); return null; }),
        api.customers.list().catch(err => { console.warn("[Store] customers fetch error:", err); return null; })
      ]);

      if (Array.isArray(cats))  this.syncCategories(cats);
      if (Array.isArray(prods)) this.syncProducts(prods);
      if (Array.isArray(inv))   this.syncInventory(inv);
      if (Array.isArray(custs)) this.syncCustomers(custs);

      // Owner-only master data (Suppliers)
      const isOwnerRole = (this.state.currentUser && this.state.currentUser.role === 'OWNER') || (typeof api !== 'undefined' && api.getRole() === 'OWNER');
      if (isOwnerRole) {
        const sups = await api.suppliers.list().catch(err => { console.warn("[Store] suppliers fetch error:", err); return null; });
        if (Array.isArray(sups)) this.syncSuppliers(sups);
      }

      this.saveState();
      return true;
    } catch (e) {
      console.error("[Store] loadMasterData error:", e);
      return false;
    }
  }

  async loadCategories() {
    if (typeof api === "undefined" || !api.getToken()) return [];
    try {
      const cats = await api.categories.list();
      if (Array.isArray(cats)) {
        this.syncCategories(cats);
        this.saveState();
      }
      return this.state.categories;
    } catch (e) {
      console.error("[Store] loadCategories error:", e);
      throw e;
    }
  }

  async loadProducts() {
    if (typeof api === "undefined" || !api.getToken()) return [];
    try {
      const prods = await api.products.list();
      if (Array.isArray(prods)) {
        this.syncProducts(prods);
        this.saveState();
      }
      return this.state.menuItems;
    } catch (e) {
      console.error("[Store] loadProducts error:", e);
      throw e;
    }
  }

  async loadInventory() {
    if (typeof api === "undefined" || !api.getToken()) return [];
    try {
      const inv = await api.inventory.list();
      if (Array.isArray(inv)) {
        this.syncInventory(inv);
        this.saveState();
      }
      return this.state.ingredients;
    } catch (e) {
      console.error("[Store] loadInventory error:", e);
      throw e;
    }
  }

  async loadSuppliers() {
    if (typeof api === "undefined" || !api.getToken()) return [];
    try {
      const sups = await api.suppliers.list();
      if (Array.isArray(sups)) {
        this.syncSuppliers(sups);
        this.saveState();
      }
      return this.state.suppliers;
    } catch (e) {
      console.error("[Store] loadSuppliers error:", e);
      throw e;
    }
  }

  async loadCustomers() {
    if (typeof api === "undefined" || !api.getToken()) return [];
    try {
      const custs = await api.customers.list();
      if (Array.isArray(custs)) {
        this.syncCustomers(custs);
        this.saveState();
      }
      return this.state.customers;
    } catch (e) {
      console.error("[Store] loadCustomers error:", e);
      return this.state.customers || [];
    }
  }

  syncCategories(cats) {
    const localCats = Array.isArray(this.state.categories) ? this.state.categories : [];
    this.state.categories = cats.map(c => {
      const existingLocal = localCats.find(lc => lc.id === c.id || (lc.id && lc.id.toLowerCase() === (c.id || '').toLowerCase()));
      let img = c.image_url || c.image || "";
      if (existingLocal && existingLocal._localModified && (existingLocal.image_url !== undefined || existingLocal.image !== undefined)) {
        img = existingLocal.image_url || existingLocal.image || img;
      } else if (!img && existingLocal && (existingLocal.image_url || existingLocal.image)) {
        img = existingLocal.image_url || existingLocal.image;
      }
      return {
        id: c.id,
        name: (existingLocal && existingLocal._localModified) ? existingLocal.name : c.name,
        icon: (existingLocal && existingLocal._localModified) ? existingLocal.icon : (c.icon || "fa-utensils"),
        image: img,
        image_url: img,
        display_order: c.display_order || 0,
        active: (existingLocal && existingLocal._localModified) ? existingLocal.active : (c.active !== false),
        _localModified: existingLocal ? existingLocal._localModified : false
      };
    });
    localCats.forEach(loc => {
      if (loc && loc.id && !this.state.categories.some(c => c.id === loc.id || (c.id && c.id.toLowerCase() === loc.id.toLowerCase()))) {
        this.state.categories.push(loc);
      }
    });
  }

  syncProducts(prods) {
    const cats = this.state.categories || [];
    const localItems = Array.isArray(this.state.menuItems) ? this.state.menuItems : [];

    this.state.menuItems = prods.map(p => {
      const matchedCat = cats.find(c => c.id === p.category_id);
      const existingLocal = localItems.find(m => m.id === p.id || (m.id && m.id.toLowerCase() === (p.id || '').toLowerCase()));

      let img = p.image_url || p.image || "";
      if (existingLocal && existingLocal._localModified && (existingLocal.image_url !== undefined || existingLocal.image !== undefined)) {
        img = existingLocal.image_url || existingLocal.image || img;
      } else if (!img && existingLocal && (existingLocal.image_url || existingLocal.image)) {
        img = existingLocal.image_url || existingLocal.image;
      }

      return {
        id: p.id,
        categoryId: p.category_id,
        category_id: p.category_id,
        category: matchedCat ? matchedCat.name : (p.category || "General"),
        name: (existingLocal && existingLocal._localModified) ? existingLocal.name : p.name,
        price: (existingLocal && existingLocal._localModified) ? existingLocal.price : (parseFloat(p.price) || 0),
        sellingUnit: p.selling_unit || "piece",
        selling_unit: p.selling_unit || "piece",
        unit: p.selling_unit || "piece",
        description: (existingLocal && existingLocal._localModified) ? existingLocal.description : (p.description || ""),
        image: img,
        image_url: img,
        available: (existingLocal && existingLocal._localModified) ? existingLocal.available : (p.available !== false),
        active: (existingLocal && existingLocal._localModified) ? existingLocal.active : (p.active !== false),
        inventoryProductId: p.inventory_product_id || null,
        inventory_product_id: p.inventory_product_id || null,
        deductQty: parseFloat(p.deduction_qty || 0),
        deduction_qty: parseFloat(p.deduction_qty || 0),
        _localModified: existingLocal ? existingLocal._localModified : false,
        _localModifiedAt: existingLocal ? existingLocal._localModifiedAt : null
      };
    });

    localItems.forEach(loc => {
      if (loc && loc.id && !this.state.menuItems.some(m => m.id === loc.id || (m.id && m.id.toLowerCase() === loc.id.toLowerCase()))) {
        this.state.menuItems.push(loc);
      }
    });
  }

  syncInventory(inv) {
    const sups = this.state.suppliers || [];
    this.state.ingredients = inv.map(i => {
      const matchedSup = sups.find(s => s.id === i.supplier_id);
      const bUnit = (i.base_unit || i.baseUnit || "PIECE").toLowerCase() === "gram" ? "g" : (i.base_unit || i.baseUnit || "piece").toLowerCase();
      let statusStr = "Available";
      if (i.status === "OUT_OF_STOCK" || parseFloat(i.current_qty) <= 0) statusStr = "Out of Stock";
      else if (i.status === "LOW_STOCK" || parseFloat(i.current_qty) <= parseFloat(i.min_limit)) statusStr = "Running Low";

      return {
        id: i.id,
        name: i.name,
        category: i.category || "General",
        purchaseUnit: (i.purchase_unit || i.purchaseUnit || "packet").toLowerCase(),
        purchase_unit: i.purchase_unit || "packet",
        baseUnit: bUnit,
        base_unit: i.base_unit || "PIECE",
        unit: bUnit,
        conversionQty: parseFloat(i.conversion_qty || 1),
        conversion_qty: parseFloat(i.conversion_qty || 1),
        currentQty: parseFloat(i.current_qty || 0),
        current_qty: parseFloat(i.current_qty || 0),
        minLimit: parseFloat(i.min_limit || 10),
        min_limit: parseFloat(i.min_limit || 10),
        avgCost: parseFloat(i.avg_cost || 0),
        avg_cost: parseFloat(i.avg_cost || 0),
        supplierId: i.supplier_id || null,
        supplier_id: i.supplier_id || null,
        supplier: matchedSup ? matchedSup.name : (i.supplier || "N/A"),
        status: statusStr,
        rawStatus: i.status || "IN_STOCK",
        lastUpdated: i.last_updated ? String(i.last_updated) : new Date().toISOString().split("T")[0]
      };
    });
  }

  syncSuppliers(sups) {
    this.state.suppliers = sups.map(s => ({
      id: s.id,
      name: s.name,
      phone: s.phone || "",
      address: s.address || "",
      gstNo: s.gst_no || s.gstNo || "",
      gst_no: s.gst_no || s.gstNo || "",
      balance: parseFloat(s.balance || 0),
      active: s.active !== false
    }));
  }

  syncCustomers(custs) {
    this.state.customers = custs.map(c => {
      const spent = parseFloat(c.total_spent !== undefined ? c.total_spent : (c.totalSpent || 0));
      const visits = parseInt(c.visit_count !== undefined ? c.visit_count : (c.visits || 0));
      const rVisits = parseInt(c.reward_visits !== undefined ? c.reward_visits : (c.rewardVisits || 0));
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email || "",
        birthday: c.birthday || "",
        address: c.address || "",
        notes: c.notes || "",
        totalSpent: spent,
        total_spent: spent,
        visits: visits,
        visit_count: visits,
        rewardVisits: rVisits,
        reward_visits: rVisits,
        rewardRedemptions: parseInt(c.reward_redemptions || 0),
        reward_redemptions: parseInt(c.reward_redemptions || 0),
        rewardProgress: c.reward_progress !== undefined ? c.reward_progress : Math.min(10, rVisits),
        reward_progress: c.reward_progress !== undefined ? c.reward_progress : Math.min(10, rVisits),
        lastVisit: c.last_visit ? String(c.last_visit) : "N/A",
        last_visit: c.last_visit ? String(c.last_visit) : "N/A",
        isDeleted: c.is_deleted || false
      };
    });
  }
}


const store = new Store();
