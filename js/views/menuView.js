/* OG Waffles & Fried Chicken - Menu & Category Management (INR ₹ Edition) */

/* ─────────────────────────────────────────────────────────────────────
   STATE
   ───────────────────────────────────────────────────────────────────── */
let menuFilterCategory   = "All";
let menuFilterAvail      = "All";
let menuSearchQuery      = "";
let menuSortBy           = "name";
let menuImagePreviewData = "";
let categoryImagePreviewData = "";

/* ─────────────────────────────────────────────────────────────────────
   RENDER
   ───────────────────────────────────────────────────────────────────── */
function renderMenuView() {
  const state       = store.getState();
  const allItems    = state.menuItems || [];
  const categories  = state.categories || [];
  const ingredients = state.ingredients || [];

  /* Filter */
  let items = allItems.filter(item => {
    let catOk = menuFilterCategory === "All";
    if (!catOk) {
      catOk = item.categoryId === menuFilterCategory || (item.category && item.category === menuFilterCategory);
    }
    const availOk = menuFilterAvail    === "All" ||
                    (menuFilterAvail   === "Available"   && item.available !== false) ||
                    (menuFilterAvail   === "Unavailable" && item.available === false);
    const searchOk = !menuSearchQuery  || item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
                     (item.description || "").toLowerCase().includes(menuSearchQuery.toLowerCase());
    return catOk && availOk && searchOk;
  });

  /* Sort */
  items = [...items].sort((a, b) => {
    if (menuSortBy === "price_asc")  return a.price - b.price;
    if (menuSortBy === "price_desc") return b.price - a.price;
    if (menuSortBy === "category")   return (a.category || '').localeCompare(b.category || '');
    return a.name.localeCompare(b.name);
  });

  return `
    <div class="p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">

      <!-- PAGE HEADER -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/20 pb-4">
        <div>
          <span class="text-xs text-[#D4AF37] font-semibold tracking-widest uppercase">Catalog Management</span>
          <h1 class="font-heading text-2xl font-extrabold text-white">Menu &amp; Categories</h1>
          <p class="text-xs text-gray-400 mt-0.5">
            ${categories.length} categories &bull;
            ${allItems.length} total products &bull;
            ${allItems.filter(i=>i.available !== false).length} available for POS sale
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button onclick="openCategoryModal()" class="btn-outline-dark text-xs py-2.5 px-4">
            <i class="fas fa-folder-plus mr-1 text-[#D4AF37]"></i> Add Category
          </button>
          <button onclick="openMenuModal()" class="btn-gold-solid text-xs py-2.5 px-5">
            <i class="fas fa-plus mr-1"></i> Add Product
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════
           CATEGORY MANAGEMENT SECTION
           ═══════════════════════════════════════════════════════════ -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-heading font-extrabold text-sm text-white flex items-center gap-2">
            <i class="fas fa-th-large text-[#D4AF37]"></i> Categories Management
          </h2>
          <span class="text-xs text-gray-500">${categories.length} configured</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          <!-- All Categories Tab / Filter Card -->
          <div onclick="handleMenuCategoryFilter('All')"
            class="glass-card p-3 rounded-xl cursor-pointer transition-all border ${menuFilterCategory === 'All' ? 'border-[#D4AF37] bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]' : 'border-gray-800 hover:border-gray-700'} flex flex-col justify-between">
            <div class="flex items-center justify-between mb-2">
              <span class="w-8 h-8 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center text-xs font-bold">
                <i class="fas fa-layer-group"></i>
              </span>
              <span class="text-[10px] font-bold text-gray-400">${allItems.length} items</span>
            </div>
            <div>
              <h4 class="font-heading font-bold text-xs text-white">All Categories</h4>
              <p class="text-[9px] text-gray-500">Show all products</p>
            </div>
          </div>

          <!-- Dynamic Category Cards -->
          ${categories.map(cat => {
            const count = allItems.filter(i => i.categoryId === cat.id || i.category === cat.name).length;
            const isSelected = menuFilterCategory === cat.id || menuFilterCategory === cat.name;
            const iconName = cat.icon || "fa-utensils";
            const iconClass = iconName.startsWith('fa-') ? `fas ${iconName}` : (iconName.includes(' ') ? iconName : `fas fa-${iconName}`);

            return `
              <div class="glass-card p-3 rounded-xl transition-all border ${isSelected ? 'border-[#D4AF37] bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]' : 'border-gray-800 hover:border-gray-700'} flex flex-col justify-between group">
                <div class="flex items-center justify-between mb-2">
                  <span onclick="handleMenuCategoryFilter('${cat.id}')" class="w-8 h-8 rounded-lg bg-black/60 border border-gray-700 text-[#D4AF37] flex items-center justify-center text-xs cursor-pointer hover:border-[#D4AF37]">
                    <i class="${iconClass}"></i>
                  </span>
                  <div class="flex items-center gap-1">
                    <button onclick="toggleCategoryStatus('${cat.id}')" title="${cat.active !== false ? 'Disable Category' : 'Enable Category'}" class="text-[10px] text-gray-400 hover:text-white transition-colors">
                      <i class="fas fa-toggle-${cat.active !== false ? 'on text-emerald-400' : 'off text-gray-600'}"></i>
                    </button>
                    <button onclick="openCategoryModal('${cat.id}')" title="Edit Category" class="text-[10px] text-[#D4AF37] hover:text-white transition-colors">
                      <i class="fas fa-pen"></i>
                    </button>
                    <button onclick="confirmDeleteCategory('${cat.id}', '${cat.name.replace(/'/g, "\\'")}')" title="Delete Category" class="text-[10px] text-red-400 hover:text-red-300 transition-colors">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                <div onclick="handleMenuCategoryFilter('${cat.id}')" class="cursor-pointer">
                  <div class="flex items-center justify-between">
                    <h4 class="font-heading font-bold text-xs text-white group-hover:text-[#D4AF37] transition-colors truncate" title="${cat.name}">${cat.name}</h4>
                    <span class="text-[9px] font-mono text-gray-400">${count}</span>
                  </div>
                  <span class="text-[9px] ${cat.active !== false ? 'text-emerald-400' : 'text-red-400'} font-semibold block mt-0.5">
                    ${cat.active !== false ? '● Active' : '○ Disabled'}
                  </span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════
           PRODUCTS FILTER & CATALOG
           ═══════════════════════════════════════════════════════════ -->
      <div class="space-y-4 pt-2">
        <!-- SEARCH + FILTERS + SORT ROW -->
        <div class="glass-card p-4 flex flex-wrap gap-3 items-center">

          <!-- Search -->
          <div class="relative flex-1 min-w-48">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37] text-xs"></i>
            <input type="text" value="${menuSearchQuery}"
              oninput="handleMenuSearch(this.value)"
              placeholder="Search products by name or description..."
              class="input-gold pl-9 py-2 text-xs w-full">
          </div>

          <!-- Category filter -->
          <select onchange="handleMenuCategoryFilter(this.value)" class="input-gold py-2 text-xs">
            <option value="All" ${menuFilterCategory==="All"?"selected":""}>All Categories</option>
            ${categories.map(c=>`<option value="${c.id}" ${menuFilterCategory===c.id || menuFilterCategory===c.name ?"selected":""}>${c.name}</option>`).join("")}
          </select>

          <!-- Availability filter -->
          <select onchange="handleMenuAvailFilter(this.value)" class="input-gold py-2 text-xs">
            <option value="All"         ${menuFilterAvail==="All"?"selected":""}>All Status</option>
            <option value="Available"   ${menuFilterAvail==="Available"?"selected":""}>Available for POS</option>
            <option value="Unavailable" ${menuFilterAvail==="Unavailable"?"selected":""}>Unavailable</option>
          </select>

          <!-- Sort -->
          <select onchange="handleMenuSort(this.value)" class="input-gold py-2 text-xs">
            <option value="name"       ${menuSortBy==="name"?"selected":""}>Sort: Name (A-Z)</option>
            <option value="price_asc"  ${menuSortBy==="price_asc"?"selected":""}>Sort: Price ↑</option>
            <option value="price_desc" ${menuSortBy==="price_desc"?"selected":""}>Sort: Price ↓</option>
            <option value="category"   ${menuSortBy==="category"?"selected":""}>Sort: Category</option>
          </select>

          ${menuSearchQuery || menuFilterCategory !== "All" || menuFilterAvail !== "All" ? `
            <button onclick="clearMenuFilters()" class="text-xs text-gray-400 hover:text-white transition-colors">
              <i class="fas fa-times mr-1"></i>Clear
            </button>
          ` : ""}
        </div>

        <!-- RESULTS COUNT -->
        <div class="flex items-center justify-between">
          <p class="text-xs text-gray-400">
            Showing <strong class="text-white">${items.length}</strong> of ${allItems.length} products
            ${menuFilterCategory !== "All" ? ` in <strong class="text-[#D4AF37]">${categories.find(c=>c.id===menuFilterCategory||c.name===menuFilterCategory)?.name || menuFilterCategory}</strong>` : ''}
          </p>
          <button onclick="openMenuModal(null, '${menuFilterCategory !== "All" ? menuFilterCategory : ""}')" class="text-xs text-[#D4AF37] hover:underline font-semibold">
            <i class="fas fa-plus mr-1"></i> Add Product to this Category
          </button>
        </div>

        <!-- MENU CARDS GRID -->
        ${items.length === 0 ? `
          <div class="py-20 text-center text-gray-500 glass-card">
            <i class="fas fa-utensils text-5xl mb-4 block opacity-20 text-[#D4AF37]"></i>
            <p class="text-sm font-semibold text-white">No products found</p>
            <p class="text-xs mt-1">Try adjusting your filters, or add a product to this category.</p>
            <button onclick="openMenuModal(null, '${menuFilterCategory !== "All" ? menuFilterCategory : ""}')" class="btn-gold-solid text-xs py-2 px-5 mt-4">
              <i class="fas fa-plus mr-1"></i> Add New Product
            </button>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            ${items.map(item => renderMenuCard(item, ingredients, categories)).join("")}
          </div>
        `}
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         ADD / EDIT CATEGORY MODAL
         ═══════════════════════════════════════════════════════════ -->
    <div id="category-modal" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 hidden overflow-y-auto">
      <div class="w-full max-w-md glass-card border border-[#D4AF37]/50 shadow-2xl p-6 space-y-4 my-8">
        <div class="flex items-center justify-between border-b border-gray-800 pb-3">
          <div>
            <h3 id="cat-modal-title" class="font-heading font-bold text-base text-white">Add New Category</h3>
            <p class="text-[11px] text-gray-400">Configure category name, icon, and display status</p>
          </div>
          <button onclick="closeCategoryModal()" class="text-gray-400 hover:text-white"><i class="fas fa-times"></i></button>
        </div>

        <form onsubmit="handleCategorySave(event)" class="space-y-3.5 text-xs">
          <input type="hidden" id="cat-id">

          <div>
            <label class="block text-gray-300 font-semibold mb-1">Category Name *</label>
            <input id="cat-name" type="text" required placeholder="e.g. Waffles, Burgers, Beverages..." class="input-gold py-2 text-xs">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Icon Style</label>
              <select id="cat-icon" class="input-gold py-2 text-xs">
                <option value="fa-stroopwafel">🧇 Waffles (fa-stroopwafel)</option>
                <option value="fa-drumstick-bite">🍗 Chicken & Snacks (fa-drumstick-bite)</option>
                <option value="fa-utensils">🍽️ Combos (fa-utensils)</option>
                <option value="fa-bowl-food">🥟 Steamed Momos (fa-bowl-food)</option>
                <option value="fa-bread-slice">🌯 Shawarma (fa-bread-slice)</option>
                <option value="fa-glass-cheers">🍹 Shawarma & Mojito Combos (fa-glass-cheers)</option>
                <option value="fa-cocktail">🍸 Mojitos (fa-cocktail)</option>
                <option value="fa-blender">🥤 Milk Shakes (fa-blender)</option>
                <option value="fa-mug-hot">☕ Cold Coffee (fa-mug-hot)</option>
                <option value="fa-ice-cream">🍨 Scoop Ice Cream (fa-ice-cream)</option>
                <option value="fa-bottle-water">🥤 Cold Drinks (fa-bottle-water)</option>
                <option value="fa-box">📦 Other (fa-box)</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Status</label>
              <label class="flex items-center gap-2 cursor-pointer mt-2">
                <input id="cat-active" type="checkbox" checked class="accent-[#D4AF37] w-4 h-4">
                <span class="text-gray-300 font-medium">Active for POS</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-gray-300 font-semibold mb-1">Category Image URL (Optional)</label>
            <input id="cat-image-url" type="text" placeholder="https://..." oninput="handleCategoryImageUrl(this.value)" class="input-gold py-2 text-xs font-mono">
          </div>

          <div class="pt-3 flex justify-end gap-2 border-t border-gray-800">
            <button type="button" onclick="closeCategoryModal()" class="btn-outline-dark text-xs py-2 px-4">Cancel</button>
            <button type="submit" class="btn-gold-solid text-xs py-2 px-5">Save Category</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         ADD / EDIT MENU ITEM MODAL
         ═══════════════════════════════════════════════════════════ -->
    <div id="menu-modal" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 hidden overflow-y-auto">
      <div class="w-full max-w-2xl glass-card border border-[#D4AF37]/50 shadow-2xl my-8">

        <!-- Modal Header -->
        <div class="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h3 id="menu-modal-title" class="font-heading font-bold text-base text-white">Add New Product</h3>
            <p class="text-xs text-gray-500 mt-0.5">Configure product details and optional direct inventory connection</p>
          </div>
          <button onclick="closeMenuModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>

        <form onsubmit="handleMenuSave(event)" class="p-5 space-y-4 text-xs">
          <input type="hidden" id="menu-id">

          <!-- ROW 1: Name + Category -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-gray-300 font-semibold mb-1.5">Product Name *</label>
              <input id="menu-name" type="text" required placeholder="e.g. Chocolate Waffle" class="input-gold py-2 text-xs">
            </div>
            <div>
              <label class="block text-gray-300 font-semibold mb-1.5">Category *</label>
              <select id="menu-category-select" required class="input-gold py-2 text-xs w-full">
                ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
              </select>
            </div>
          </div>

          <!-- ROW 2: Price + Availability -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-gray-300 font-semibold mb-1.5">Selling Price (₹) *</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37] font-bold">₹</span>
                <input id="menu-price" type="number" step="0.01" min="0" required placeholder="0.00" class="input-gold py-2 text-xs pl-7">
              </div>
            </div>
            <div>
              <label class="block text-gray-300 font-semibold mb-1.5">POS Availability Status</label>
              <label class="flex items-center gap-3 cursor-pointer mt-2.5">
                <div class="relative">
                  <input id="menu-available" type="checkbox" checked class="sr-only peer">
                  <div class="w-10 h-5 bg-gray-700 peer-checked:bg-[#D4AF37] rounded-full transition-colors"></div>
                  <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></div>
                </div>
                <span id="menu-avail-label" class="text-gray-300 font-semibold">Available for Sale</span>
              </label>
            </div>
          </div>

          <!-- ROW 3: Direct Inventory Connection (Optional) -->
          <div class="p-4 rounded-xl bg-black/60 border border-[#D4AF37]/30 space-y-3">
            <div>
              <label class="block text-[#D4AF37] font-bold text-xs flex items-center gap-2">
                <i class="fas fa-link text-[#D4AF37]"></i> Direct Inventory Stock Connection <span class="text-gray-500 font-normal text-[10px]">(Optional)</span>
              </label>
              <p class="text-[10px] text-gray-400 mt-0.5">Select the inventory product to deduct when this item is sold. If none selected, item sells freely without stock deduction.</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-gray-300 font-semibold mb-1">Linked Inventory Product</label>
                <select id="menu-inventory-product" class="input-gold py-2 text-xs" onchange="handleMenuInventoryProductChange(this.value)">
                  <option value="">-- No Inventory Connection (Sells Freely) --</option>
                  ${ingredients.map(i => {
                    const bUnit = i.baseUnit || i.unit || 'piece';
                    return `<option value="${i.id}">${i.name} (Stock: ${i.currentQty} ${bUnit})</option>`;
                  }).join('')}
                </select>
              </div>

              <div>
                <label class="block text-gray-300 font-semibold mb-1">Base Quantity Deducted Per Sale</label>
                <div class="flex items-center gap-2">
                  <input id="menu-deduct-qty" type="number" step="0.01" min="0.01" value="1" placeholder="1" class="input-gold py-2 text-xs font-bold text-center flex-1" oninput="updateMenuDeductPreview()">
                  <span id="menu-deduct-unit-badge" class="px-2.5 py-2 rounded-lg bg-black/80 border border-gray-700 text-gray-300 text-xs font-mono font-bold whitespace-nowrap">units</span>
                </div>
              </div>
            </div>

            <!-- Preview Notice -->
            <div id="menu-deduct-preview" class="p-2.5 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[11px] text-[#D4AF37]">
              Sells freely &mdash; no stock deduction on sale.
            </div>
          </div>

          <!-- ROW 4: Description -->
          <div>
            <label class="block text-gray-300 font-semibold mb-1.5">Description</label>
            <textarea id="menu-desc" rows="2" placeholder="Short description of this product..." class="input-gold py-2 text-xs resize-none"></textarea>
          </div>

          <!-- ROW 5: Food Image -->
          <div class="space-y-3 border border-[#D4AF37]/20 rounded-xl p-4 bg-black/30">
            <label class="block text-[#D4AF37] font-bold mb-1">Product Image</label>
            <div class="flex gap-4 items-start">
              <div class="w-24 h-24 rounded-xl overflow-hidden border-2 border-[#D4AF37]/40 flex-shrink-0 bg-gray-900 flex items-center justify-center">
                <img id="menu-img-preview" src="" alt="Preview" class="w-full h-full object-cover hidden" onerror="this.classList.add('hidden'); document.getElementById('menu-img-placeholder').classList.remove('hidden')">
                <div id="menu-img-placeholder" class="text-center text-gray-600 text-xs p-2">
                  <i class="fas fa-image text-2xl block mb-1"></i> No image
                </div>
              </div>

              <div class="flex-1 space-y-2">
                <input type="file" accept="image/*" onchange="handleMenuImageUpload(event)" class="block w-full text-xs text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#D4AF37] file:text-black hover:file:bg-[#BF953F] cursor-pointer">
                <input id="menu-image-url" type="text" placeholder="Or paste image URL (https://...)" oninput="handleMenuImageUrl(this.value)" class="input-gold py-1.5 text-xs font-mono">
              </div>
            </div>
            <input type="hidden" id="menu-image">
          </div>

          <!-- FORM FOOTER -->
          <div class="flex items-center justify-end gap-3 border-t border-gray-800 pt-4">
            <button type="button" onclick="closeMenuModal()" class="btn-outline-dark text-xs py-2.5 px-5">
              <i class="fas fa-times mr-1"></i> Cancel
            </button>
            <button type="submit" class="btn-gold-solid text-xs py-2.5 px-6">
              <i class="fas fa-save mr-1"></i> Save Product
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- DELETE CATEGORY CONFIRMATION MODAL -->
    <div id="category-delete-modal" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 hidden">
      <div class="w-full max-w-sm glass-card border border-red-500/40 shadow-2xl p-6 space-y-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <i class="fas fa-exclamation-triangle text-red-400"></i>
          </div>
          <div>
            <h3 class="font-heading font-bold text-sm text-white">Delete Category?</h3>
            <p class="text-xs text-gray-400 mt-0.5" id="cat-delete-msg">This will delete the category.</p>
          </div>
        </div>
        <div class="flex gap-3 justify-end pt-2">
          <button onclick="closeCategoryDeleteModal()" class="btn-outline-dark text-xs py-2 px-5">Cancel</button>
          <button id="cat-delete-confirm-btn" class="text-xs py-2 px-5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors">
            <i class="fas fa-trash mr-1"></i> Delete
          </button>
        </div>
      </div>
    </div>

    <!-- DELETE MENU ITEM CONFIRMATION MODAL -->
    <div id="menu-delete-modal" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 hidden">
      <div class="w-full max-w-sm glass-card border border-red-500/40 shadow-2xl p-6 space-y-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <i class="fas fa-exclamation-triangle text-red-400"></i>
          </div>
          <div>
            <h3 class="font-heading font-bold text-sm text-white">Delete Menu Item?</h3>
            <p class="text-xs text-gray-400 mt-0.5" id="menu-delete-msg">This action cannot be undone.</p>
          </div>
        </div>
        <p class="text-xs text-gray-400">Deleting this item will remove it from <strong class="text-white">POS Billing</strong> immediately.</p>
        <div class="flex gap-3 justify-end pt-2">
          <button onclick="closeDeleteModal()" class="btn-outline-dark text-xs py-2 px-5">
            <i class="fas fa-times mr-1"></i> Cancel
          </button>
          <button id="menu-delete-confirm-btn" class="text-xs py-2 px-5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors">
            <i class="fas fa-trash mr-1"></i> Delete
          </button>
        </div>
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────────────────────────────────
   MENU CARD RENDERER
   ───────────────────────────────────────────────────────────────────── */
function renderMenuCard(item, ingredients, categories) {
  let inventoryTag = `<span class="text-[9px] text-gray-500 italic">Sells freely &bull; No inventory deduction</span>`;

  if (item.inventoryProductId) {
    const ingObj = ingredients.find(i => i.id === item.inventoryProductId);
    const unit = ingObj ? (ingObj.baseUnit || ingObj.unit || '') : '';
    inventoryTag = `<span class="inline-flex items-center gap-1 bg-black/60 border border-[#D4AF37]/40 px-2 py-0.5 rounded-full text-[9px] text-[#D4AF37] font-semibold">
      <i class="fas fa-boxes text-[8px]"></i> ${ingObj ? ingObj.name : 'Linked Item'}: &minus;${item.deductQty || 1} ${unit}
    </span>`;
  }

  const categoryName = item.category || (categories && categories.find(c => c.id === item.categoryId)?.name) || 'General';

  return `
    <div class="glass-card overflow-hidden flex flex-col group ${item.available === false ? 'opacity-70' : ''}">
      <!-- Image -->
      <div class="relative h-40 overflow-hidden bg-gray-900 flex-shrink-0 flex items-center justify-center">
        ${item.image
          ? `<img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ""}
        <div class="w-full h-full flex items-center justify-center text-gray-700 text-xs ${item.image ? 'hidden' : 'flex'}">
          <i class="fas fa-utensils text-3xl opacity-20"></i>
        </div>

        <!-- Price badge -->
        <span class="absolute top-3 right-3 bg-black/85 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-[#D4AF37] border border-[#D4AF37]/40">
          ${formatCurrency(item.price)}
        </span>

        <!-- Category badge -->
        <span class="absolute top-3 left-3 bg-[#D4AF37] text-black px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide">
          ${categoryName}
        </span>

        <!-- Unavailable overlay -->
        ${item.available === false ? `
          <div class="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span class="bg-red-600/90 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Unavailable</span>
          </div>
        ` : ""}
      </div>

      <!-- Body -->
      <div class="p-4 flex flex-col flex-1 space-y-3">
        <div>
          <h3 class="font-heading font-bold text-sm text-white leading-tight">${item.name}</h3>
          ${item.description ? `<p class="text-[11px] text-gray-400 mt-1 line-clamp-2">${item.description}</p>` : ""}
        </div>

        <!-- Inventory Connection Tag -->
        <div class="border-t border-gray-800 pt-2 flex-1">
          ${inventoryTag}
        </div>

        <!-- Footer actions -->
        <div class="border-t border-gray-800 pt-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="${item.available !== false ? 'badge-green' : 'badge-red'} text-[9px]">
              ${item.available !== false ? "✓ Available" : "✗ Unavailable"}
            </span>
            <button onclick="toggleMenuItemAvailability('${item.id}')" title="${item.available !== false ? 'Mark Unavailable' : 'Mark Available'}"
              class="text-[9px] text-gray-500 hover:text-[#D4AF37] transition-colors">
              <i class="fas fa-toggle-${item.available !== false ? 'on text-emerald-400' : 'off text-gray-600'}"></i>
            </button>
          </div>

          <div class="flex items-center gap-3">
            <button onclick="openMenuModal('${item.id}')"
              class="text-[11px] text-[#D4AF37] hover:text-[#F3E5AB] font-semibold transition-colors">
              <i class="fas fa-edit mr-1"></i>Edit
            </button>
            <button onclick="confirmDeleteMenuItem('${item.id}', '${item.name.replace(/'/g,"\\'")}')"
              class="text-[11px] text-red-400 hover:text-red-300 font-semibold transition-colors">
              <i class="fas fa-trash mr-1"></i>Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function handleMenuSearch(val)           { menuSearchQuery = val;     renderView("menu"); }
function handleMenuCategoryFilter(val)   { menuFilterCategory = val;  renderView("menu"); }
function handleMenuAvailFilter(val)      { menuFilterAvail = val;     renderView("menu"); }
function handleMenuSort(val)             { menuSortBy = val;          renderView("menu"); }
function clearMenuFilters() {
  menuSearchQuery = ""; menuFilterCategory = "All"; menuFilterAvail = "All";
  renderView("menu");
}

/* ─────────────────────────────────────────────────────────────────────
   CATEGORY ACTIONS
   ───────────────────────────────────────────────────────────────────── */
function openCategoryModal(catId = null) {
  const modal = document.getElementById("category-modal");
  categoryImagePreviewData = "";

  if (catId) {
    const cat = (store.getState().categories || []).find(c => c.id === catId);
    if (!cat) return;
    document.getElementById("cat-modal-title").innerText = "Edit Category";
    document.getElementById("cat-id").value = cat.id;
    document.getElementById("cat-name").value = cat.name;
    document.getElementById("cat-icon").value = cat.icon || "fa-utensils";
    document.getElementById("cat-active").checked = cat.active !== false;
    document.getElementById("cat-image-url").value = cat.image_url || cat.image || "";
  } else {
    document.getElementById("cat-modal-title").innerText = "Add New Category";
    document.getElementById("cat-id").value = "";
    document.getElementById("cat-name").value = "";
    document.getElementById("cat-icon").value = "fa-utensils";
    document.getElementById("cat-active").checked = true;
    document.getElementById("cat-image-url").value = "";
  }
  modal.classList.remove("hidden");
}

function closeCategoryModal() {
  document.getElementById("category-modal").classList.add("hidden");
}

async function handleCategorySave(e) {
  e.preventDefault();
  const id = document.getElementById("cat-id").value;
  const name = document.getElementById("cat-name").value.trim();
  const icon = document.getElementById("cat-icon").value;
  const active = document.getElementById("cat-active").checked;
  const image = document.getElementById("cat-image-url").value.trim();

  if (!name) {
    alert("Please enter a Category Name.");
    return;
  }

  try {
    if (id) {
      await api.categories.update(id, { name, icon, active, image_url: image });
      store.addNotification("Category Updated", `Category "${name}" updated successfully`, "success");
    } else {
      await api.categories.create({ name, icon, active, image_url: image });
      store.addNotification("Category Created", `Category "${name}" created successfully`, "success");
    }
    closeCategoryModal();
    await store.loadMasterData();
    renderView("menu");
  } catch (err) {
    console.error("[MenuView] Save Category Error:", err);
    alert(err.message || "Failed to save category.");
  }
}

async function toggleCategoryStatus(catId) {
  const cat = (store.getState().categories || []).find(c => c.id === catId);
  if (!cat) return;
  const newActive = !(cat.active !== false);

  try {
    await api.categories.update(catId, { active: newActive });
    store.addNotification("Category Status Changed", `"${cat.name}" is now ${newActive ? 'Active' : 'Disabled'}`, "info");
    await store.loadMasterData();
    renderView("menu");
  } catch (err) {
    console.error("[MenuView] Toggle Category Status Error:", err);
    alert(err.message || "Failed to toggle category status.");
  }
}

function confirmDeleteCategory(catId, catName) {
  const modal = document.getElementById("category-delete-modal");
  const msg   = document.getElementById("cat-delete-msg");
  const btn   = document.getElementById("cat-delete-confirm-btn");

  if (msg) msg.textContent = `Are you sure you want to delete category "${catName}"? Products in this category will be unassigned.`;

  btn.onclick = async function() {
    try {
      await api.categories.delete(catId);
      store.addNotification("Category Deleted", `"${catName}" removed from categories`, "warning");
      closeCategoryDeleteModal();
      if (menuFilterCategory === catId) menuFilterCategory = "All";
      await store.loadMasterData();
      renderView("menu");
    } catch (err) {
      console.error("[MenuView] Delete Category Error:", err);
      alert(err.message || "Failed to delete category.");
    }
  };

  modal.classList.remove("hidden");
}

function closeCategoryDeleteModal() {
  document.getElementById("category-delete-modal").classList.add("hidden");
}

/* ─────────────────────────────────────────────────────────────────────
   PRODUCT MODAL ACTIONS
   ───────────────────────────────────────────────────────────────────── */
function handleMenuInventoryProductChange(productId) {
  const state = store.getState();
  const ing = (state.ingredients || []).find(i => i.id === productId);
  const badge = document.getElementById("menu-deduct-unit-badge");

  if (ing) {
    const unit = ing.baseUnit || ing.unit || "units";
    if (badge) badge.textContent = unit;
  } else {
    if (badge) badge.textContent = "units";
  }
  updateMenuDeductPreview();
}

function updateMenuDeductPreview() {
  const prodId = document.getElementById("menu-inventory-product")?.value;
  const qty = parseFloat(document.getElementById("menu-deduct-qty")?.value) || 1;
  const preview = document.getElementById("menu-deduct-preview");

  if (!prodId) {
    if (preview) {
      preview.innerHTML = `Sells freely &mdash; no stock deduction on sale.`;
      preview.className = "p-2.5 rounded-lg bg-gray-900/50 border border-gray-800 text-[11px] text-gray-400";
    }
    return;
  }

  const state = store.getState();
  const ing = (state.ingredients || []).find(i => i.id === prodId);
  const unit = ing ? (ing.baseUnit || ing.unit || "units") : "units";
  const name = ing ? ing.name : "product";

  if (preview) {
    preview.innerHTML = `<strong>Direct Connection:</strong> Selling 1 unit deducts <strong>${qty} ${unit}</strong> from <strong>${name}</strong> stock.`;
    preview.className = "p-2.5 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[11px] text-[#D4AF37]";
  }
}

function openMenuModal(id = null, defaultCatId = "") {
  const modal = document.getElementById("menu-modal");
  menuImagePreviewData = "";
  const categories = store.getState().categories || [];

  if (id) {
    const item = store.getState().menuItems.find(m => m.id === id);
    if (!item) return;

    document.getElementById("menu-modal-title").innerText = "Edit Product";
    document.getElementById("menu-id").value        = item.id;
    document.getElementById("menu-name").value      = item.name;
    document.getElementById("menu-price").value     = item.price;
    document.getElementById("menu-desc").value      = item.description || "";
    document.getElementById("menu-available").checked = item.available !== false;
    document.getElementById("menu-image").value     = item.image_url || item.image || "";
    document.getElementById("menu-image-url").value = item.image_url || item.image || "";

    const catSel = document.getElementById("menu-category-select");
    if (catSel) {
      if (item.categoryId || item.category_id) catSel.value = item.categoryId || item.category_id;
      else {
        const found = categories.find(c => c.name.toLowerCase() === (item.category || '').toLowerCase());
        if (found) catSel.value = found.id;
      }
    }

    const invSelect = document.getElementById("menu-inventory-product");
    const deductInput = document.getElementById("menu-deduct-qty");
    let linkedId = item.inventoryProductId || item.inventory_product_id || "";
    let deductQty = item.deductQty !== undefined ? item.deductQty : (item.deduction_qty || 1);

    if (invSelect) invSelect.value = linkedId;
    if (deductInput) deductInput.value = deductQty;
    handleMenuInventoryProductChange(linkedId);

    const imgUrl = item.image_url || item.image;
    if (imgUrl) {
      menuImagePreviewData = imgUrl;
      setMenuImagePreview(imgUrl);
    }
  } else {
    document.getElementById("menu-modal-title").innerText = "Add New Product";
    document.getElementById("menu-id").value        = "";
    document.getElementById("menu-name").value      = "";
    document.getElementById("menu-price").value     = "";
    document.getElementById("menu-desc").value      = "";
    document.getElementById("menu-available").checked = true;
    document.getElementById("menu-image").value     = "";
    document.getElementById("menu-image-url").value = "";
    document.getElementById("menu-inventory-product").value = "";
    document.getElementById("menu-deduct-qty").value = "1";

    const catSel = document.getElementById("menu-category-select");
    if (catSel) {
      if (defaultCatId) {
        catSel.value = defaultCatId;
      } else if (catSel.options.length > 0) {
        catSel.selectedIndex = 0;
      }
    }

    handleMenuInventoryProductChange("");
    clearMenuImagePreview();
  }

  modal.classList.remove("hidden");
}

function closeMenuModal() {
  document.getElementById("menu-modal").classList.add("hidden");
}

function handleMenuImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    menuImagePreviewData = e.target.result;
    document.getElementById("menu-image").value     = menuImagePreviewData;
    document.getElementById("menu-image-url").value = "";
    setMenuImagePreview(menuImagePreviewData);
  };
  reader.readAsDataURL(file);
}

function handleMenuImageUrl(url) {
  menuImagePreviewData = url;
  document.getElementById("menu-image").value = url;
  setMenuImagePreview(url);
}

function setMenuImagePreview(src) {
  const img  = document.getElementById("menu-img-preview");
  const ph   = document.getElementById("menu-img-placeholder");
  if (!img) return;
  img.src = src;
  img.classList.remove("hidden");
  if (ph) ph.classList.add("hidden");
}

function clearMenuImagePreview() {
  const img = document.getElementById("menu-img-preview");
  const ph  = document.getElementById("menu-img-placeholder");
  if (img) { img.src = ""; img.classList.add("hidden"); }
  if (ph)  ph.classList.remove("hidden");
}

async function handleMenuSave(e) {
  e.preventDefault();

  const id          = document.getElementById("menu-id").value;
  const name        = document.getElementById("menu-name").value.trim();
  const price       = parseFloat(document.getElementById("menu-price").value);
  const description = document.getElementById("menu-desc").value.trim();
  const available   = document.getElementById("menu-available").checked;
  const image       = document.getElementById("menu-image").value.trim();
  const categoryId  = document.getElementById("menu-category-select").value;

  if (!name || isNaN(price)) {
    alert("Please fill in Product Name and Price.");
    return;
  }

  const inventoryProductId = document.getElementById("menu-inventory-product").value || null;
  const deductQty = inventoryProductId ? (parseFloat(document.getElementById("menu-deduct-qty").value) || 1.0) : 0.0;
  const sellingUnit = inventoryProductId ? (store.getState().ingredients.find(i => i.id === inventoryProductId)?.baseUnit || 'piece') : 'piece';

  const payload = {
    category_id: categoryId,
    name,
    price,
    selling_unit: sellingUnit,
    description,
    image_url: image,
    available,
    active: available,
    inventory_product_id: inventoryProductId,
    deduction_qty: deductQty
  };

  try {
    if (id) {
      await api.products.update(id, payload);
      store.addNotification("Product Updated", `"${name}" updated successfully`, "success");
    } else {
      await api.products.create(payload);
      store.addNotification("Product Created", `"${name}" created successfully`, "success");
    }
    closeMenuModal();
    await store.loadMasterData();
    renderView("menu");
  } catch (err) {
    console.error("[MenuView] Save Product Error:", err);
    alert(err.message || "Failed to save product.");
  }
}

function confirmDeleteMenuItem(id, name) {
  const modal = document.getElementById("menu-delete-modal");
  const msg   = document.getElementById("menu-delete-msg");
  const btn   = document.getElementById("menu-delete-confirm-btn");

  if (msg) msg.textContent = `Delete "${name}"? This action cannot be undone.`;

  btn.onclick = async function() {
    try {
      await api.products.delete(id);
      store.addNotification("Menu Item Deleted", `"${name}" removed from menu`, "warning");
      closeDeleteModal();
      await store.loadMasterData();
      renderView("menu");
    } catch (err) {
      console.error("[MenuView] Delete Product Error:", err);
      alert(err.message || "Failed to delete product.");
    }
  };

  modal.classList.remove("hidden");
}

function closeDeleteModal() {
  document.getElementById("menu-delete-modal").classList.add("hidden");
}

async function toggleMenuItemAvailability(id) {
  const item = store.getState().menuItems.find(m => m.id === id);
  if (!item) return;
  const newAvail = !(item.available !== false);

  try {
    await api.products.update(id, { available: newAvail, active: newAvail });
    store.addNotification("Item Status Changed", `"${item.name}" is now ${newAvail ? 'Available' : 'Unavailable'}`, "info");
    await store.loadMasterData();
    renderView("menu");
  } catch (err) {
    console.error("[MenuView] Toggle Product Availability Error:", err);
    alert(err.message || "Failed to update item availability.");
  }
}

