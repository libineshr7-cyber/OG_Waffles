/* OG Waffles & Fried Chicken - POS Billing System View (INR ₹ Edition) */

let posCart = [];
let selectedPosCategory = null; // null = Category selection view
let posSearchQuery = "";
let appliedDiscountPercent = 0;
let isTaxEnabled = false; // Default OFF — enabled on click
// Customer details persist across cart updates — cleared only on successful bill
let posCustName  = '';
let posCustPhone = '';
let posOrderType = 'Walk-in'; // 'Walk-in' vs 'Online'

function setPosOrderType(type) {
  posOrderType = type;
  const walkBtn = document.getElementById('cart-order-type-walkin');
  const onlineBtn = document.getElementById('cart-order-type-online');
  const modalWalkBtn = document.getElementById('modal-order-type-walkin');
  const modalOnlineBtn = document.getElementById('modal-order-type-online');
  
  if (walkBtn && onlineBtn) {
    if (type === 'Walk-in') {
      walkBtn.className = 'flex-1 py-1 px-2 rounded-lg text-xs font-bold bg-[#D4AF37] text-black shadow-sm flex items-center justify-center gap-1';
      onlineBtn.className = 'flex-1 py-1 px-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white flex items-center justify-center gap-1';
    } else {
      walkBtn.className = 'flex-1 py-1 px-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white flex items-center justify-center gap-1';
      onlineBtn.className = 'flex-1 py-1 px-2 rounded-lg text-xs font-bold bg-[#D4AF37] text-black shadow-sm flex items-center justify-center gap-1';
    }
  }

  if (modalWalkBtn && modalOnlineBtn) {
    if (type === 'Walk-in') {
      modalWalkBtn.className = 'flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-[#D4AF37] text-black shadow-sm flex items-center justify-center gap-1.5';
      modalOnlineBtn.className = 'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-gray-400 hover:text-white flex items-center justify-center gap-1.5';
    } else {
      modalWalkBtn.className = 'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-gray-400 hover:text-white flex items-center justify-center gap-1.5';
      modalOnlineBtn.className = 'flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-[#D4AF37] text-black shadow-sm flex items-center justify-center gap-1.5';
    }
  }
}

function renderPosView() {
  const state = store.getState();
  const menuItems = state.menuItems || [];
  const allCategories = state.categories || [];
  const activeCategories = allCategories.filter(c => c.active !== false);
  const settings = state.settings;

  const isSearchMode = (posSearchQuery || '').trim().length > 0;
  
  // Find current selected category object if any
  let currentCategory = null;
  if (selectedPosCategory) {
    currentCategory = allCategories.find(c => c.id === selectedPosCategory || (c.name && c.name.toLowerCase() === selectedPosCategory.toLowerCase()));
  }

  // Filter products for the active view
  let displayedItems = [];
  if (isSearchMode) {
    const q = posSearchQuery.trim().toLowerCase();
    displayedItems = menuItems.filter(item =>
      item.name.toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q)
    );
  } else if (selectedPosCategory) {
    displayedItems = menuItems.filter(item => {
      const matchId = item.categoryId && currentCategory && item.categoryId === currentCategory.id;
      const matchName = currentCategory && item.category && item.category.toLowerCase() === currentCategory.name.toLowerCase();
      const matchDirect = item.category === selectedPosCategory || item.categoryId === selectedPosCategory;
      return matchId || matchName || matchDirect;
    });
  }

  // Calculate Cart Totals
  const subtotal = posCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountAmount = (subtotal * appliedDiscountPercent) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = isTaxEnabled ? (taxableAmount * settings.taxRate) / 100 : 0;
  const grandTotal = taxableAmount + taxAmount;

  return `
    <div class="h-[calc(100vh-61px)] flex flex-col md:flex-row overflow-hidden bg-[#0B0B0B]">
      <!-- LEFT SECTION: PRODUCT CATALOG & CATEGORY NAVIGATION (65% Width) -->
      <div class="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto border-r border-[#D4AF37]/20">
        <!-- Search Bar Header -->
        <div class="flex items-center justify-between gap-3">
          <div class="relative w-full max-w-md">
            <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D4AF37] text-xs"></i>
            <input type="text" value="${posSearchQuery}" oninput="handlePosSearch(this.value)" placeholder="Search any product across all categories..." class="input-gold pl-9 py-2 text-xs w-full">
            ${posSearchQuery ? `
              <button onclick="clearPosSearch()" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs">
                <i class="fas fa-times"></i>
              </button>
            ` : ''}
          </div>

          ${selectedPosCategory && !isSearchMode ? `
            <button onclick="backToPosCategories()" class="btn-gold text-xs py-2 px-3.5 flex items-center gap-1.5 whitespace-nowrap">
              <i class="fas fa-arrow-left"></i> Back to Categories
            </button>
          ` : ''}
        </div>

        <!-- ════════════════════════════════════════════════════════════════════
             MAIN CONTENT: 1) CATEGORIES VIEW  2) CATEGORY PRODUCTS  3) SEARCH RESULTS
             ════════════════════════════════════════════════════════════════════ -->

        ${isSearchMode ? `
          <!-- ── VIEW A: GLOBAL SEARCH RESULTS ── -->
          <div class="flex items-center justify-between border-b border-gray-800 pb-2">
            <span class="text-xs text-gray-300">
              Found <strong class="text-[#D4AF37]">${displayedItems.length}</strong> matching products
            </span>
            <button onclick="clearPosSearch()" class="text-[11px] text-gray-400 hover:text-[#D4AF37]">
              <i class="fas fa-times mr-1"></i> Close Search
            </button>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 flex-1 overflow-y-auto pr-1">
            ${displayedItems.length === 0 ? `
              <div class="col-span-full py-16 text-center text-gray-600">
                <i class="fas fa-search text-3xl mb-3 block opacity-30"></i>
                <p class="text-xs">No products match "${posSearchQuery}".</p>
              </div>
            ` : displayedItems.map(item => renderPosProductCard(item)).join('')}
          </div>
        ` : (!selectedPosCategory) ? `
          <!-- ── VIEW B: CATEGORIES LISTING (DEFAULT ENTRY VIEW) ── -->
          <div class="flex items-center justify-between border-b border-gray-800 pb-2">
            <div>
              <h2 class="font-heading font-extrabold text-sm text-white flex items-center gap-2">
                <i class="fas fa-th-large text-[#D4AF37]"></i> Menu Categories
              </h2>
              <p class="text-[11px] text-gray-400">Select a category to view and order products</p>
            </div>
            <span class="text-[11px] text-gray-500">${activeCategories.length} categories</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1 overflow-y-auto pr-1">
            ${activeCategories.length === 0 ? `
              <div class="col-span-full py-16 text-center text-gray-600">
                <i class="fas fa-layer-group text-3xl mb-3 block opacity-30"></i>
                <p class="text-xs">No active categories found.</p>
              </div>
            ` : activeCategories.map(cat => {
              const catItems = menuItems.filter(i => {
                const matchId = (i.categoryId === cat.id) || (i.category_id === cat.id);
                const matchName = (i.category || '').toLowerCase() === cat.name.toLowerCase();
                return matchId || matchName;
              });
              const availCount = catItems.filter(i => i.available !== false).length;
              const iconName = cat.icon || "fa-utensils";
              const iconClass = iconName.startsWith('fa-') ? `fas ${iconName}` : (iconName.includes(' ') ? iconName : `fas fa-${iconName}`);
              const catImg = cat.image_url || cat.image || "";

              return `
                <div onclick="openPosCategory('${cat.id}')"
                  class="glass-card p-4 flex flex-col justify-between cursor-pointer hover:scale-[1.02] hover:border-[#D4AF37] transition-all duration-200 group border border-gray-800/80 shadow-lg">
                  <div class="relative h-32 rounded-xl overflow-hidden mb-3 bg-gray-900 flex items-center justify-center">
                    ${catImg
                      ? `<img src="${catImg}" alt="${cat.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
                      : ''}
                    <div class="w-full h-full flex flex-col items-center justify-center text-[#D4AF37] p-3 ${catImg ? 'hidden' : 'flex'}">
                      <i class="${iconClass} text-4xl mb-1.5 group-hover:scale-110 transition-transform"></i>
                    </div>
                    <span class="absolute top-2 right-2 bg-black/85 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[#D4AF37] border border-[#D4AF37]/40">
                      ${availCount} ${availCount === 1 ? 'Item' : 'Items'}
                    </span>
                  </div>
                  <div class="space-y-1">
                    <div class="flex items-center justify-between">
                      <h3 class="font-heading font-extrabold text-sm text-white group-hover:text-[#D4AF37] transition-colors">${cat.name}</h3>
                      <i class="fas fa-chevron-right text-xs text-gray-500 group-hover:text-[#D4AF37] group-hover:translate-x-1 transition-all"></i>
                    </div>
                    <p class="text-[10px] text-gray-500">Tap to view products</p>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <!-- ── VIEW C: PRODUCTS INSIDE SELECTED CATEGORY ── -->
          <div class="flex items-center justify-between border-b border-gray-800 pb-2">
            <div class="flex items-center gap-3">
              <button onclick="backToPosCategories()" class="w-8 h-8 rounded-lg bg-black/80 border border-[#D4AF37]/40 hover:border-[#D4AF37] text-[#D4AF37] flex items-center justify-center text-xs transition-colors" title="Back to Categories">
                <i class="fas fa-arrow-left"></i>
              </button>
              <div>
                <h2 class="font-heading font-extrabold text-sm text-white flex items-center gap-2">
                  <span>${currentCategory ? currentCategory.name : selectedPosCategory}</span>
                </h2>
                <p class="text-[10px] text-gray-400">Showing all items in this category</p>
              </div>
            </div>
            <span class="text-xs text-gray-400 font-mono">${displayedItems.length} products</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 flex-1 overflow-y-auto pr-1">
            ${displayedItems.length === 0 ? `
              <div class="col-span-full py-16 text-center text-gray-600">
                <i class="fas fa-box-open text-3xl mb-3 block opacity-30"></i>
                <p class="text-xs">No products in this category yet.</p>
                <button onclick="backToPosCategories()" class="btn-outline-dark text-xs py-1.5 px-4 mt-3">
                  <i class="fas fa-arrow-left mr-1"></i> Back to Categories
                </button>
              </div>
            ` : displayedItems.map(item => renderPosProductCard(item)).join('')}
          </div>
        `}
      </div>

      <!-- RIGHT SECTION: LIVE ORDER CART & BILLING PANEL (35% Width) -->
      <div class="w-full md:w-96 bg-[#141414] border-l border-[#D4AF37]/30 flex flex-col justify-between p-4 shadow-2xl">
        <!-- Cart Header & Customer Attachment -->
        <div class="space-y-2.5 border-b border-gray-800 pb-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="fas fa-shopping-cart text-[#D4AF37]"></i>
              <h3 class="font-heading font-bold text-sm text-white">Current POS Order</h3>
            </div>
            <button onclick="clearPosCart()" class="text-[10px] text-red-400 hover:underline font-semibold">Clear Cart</button>
          </div>

          <!-- Order Channel / Type Selector: Walk-in vs Online -->
          <div class="flex items-center gap-1.5 p-1 bg-black/60 rounded-xl border border-gray-800 text-xs">
            <button type="button" id="cart-order-type-walkin" onclick="setPosOrderType('Walk-in')"
              class="flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${posOrderType === 'Walk-in' ? 'bg-[#D4AF37] text-black shadow-sm' : 'text-gray-400 hover:text-white'}">
              <i class="fas fa-walking text-[10px]"></i> Walk-in
            </button>
            <button type="button" id="cart-order-type-online" onclick="setPosOrderType('Online')"
              class="flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${posOrderType === 'Online' ? 'bg-[#D4AF37] text-black shadow-sm' : 'text-gray-400 hover:text-white'}">
              <i class="fas fa-globe text-[10px]"></i> Online Order
            </button>
          </div>

          <!-- Customer Name & Phone Input with Auto-Lookup / Auto-Registration -->
          <div class="space-y-1.5">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <input id="pos-cust-name" type="text" placeholder="Customer Name"
                value="${posCustName}"
                oninput="handlePosCustNameInput(this.value)"
                class="input-gold py-1.5 px-2 text-xs">
              <input id="pos-cust-phone" type="tel" placeholder="Phone Number"
                value="${posCustPhone}"
                oninput="handlePosCustPhoneInput(this.value)"
                class="input-gold py-1.5 px-2 text-xs">
            </div>
            ${posSelectedCustomerId ? `
              <div class="flex items-center justify-between text-[10px] bg-[#D4AF37]/15 border border-[#D4AF37]/40 px-2 py-1 rounded text-[#D4AF37]">
                <span class="truncate"><i class="fas fa-user-check mr-1"></i> Linked to customer (${posCustName || 'Guest'})</span>
                <button type="button" onclick="clearPosCustomer()" class="text-gray-400 hover:text-white ml-1"><i class="fas fa-times"></i></button>
              </div>
            ` : (posCustPhone && posCustPhone.trim().length >= 5 ? `
              <div class="text-[10px] text-emerald-400 flex items-center gap-1 px-1">
                <i class="fas fa-user-plus text-[9px]"></i> New customer &bull; Auto-registers on bill
              </div>
            ` : '')}
          </div>
        </div>

        <!-- Cart Items List -->
        <div class="flex-1 overflow-y-auto py-3 space-y-2.5 max-h-64 sm:max-h-none">
          ${posCart.length === 0 ? `
            <div class="h-full flex flex-col items-center justify-center text-center text-gray-500 text-xs py-12 space-y-2">
              <i class="fas fa-cash-register text-3xl text-gray-700"></i>
              <p>No items added to current bill</p>
              <span class="text-[10px] text-gray-600">Select products from menu grid</span>
            </div>
          ` : posCart.map(item => `
            <div class="p-2.5 rounded-xl bg-black/60 border border-gray-800 flex items-center justify-between text-xs">
              <div class="flex-1 pr-2">
                <span class="font-bold text-white block line-clamp-1">${item.name}</span>
                <span class="text-[10px] text-[#D4AF37] font-semibold">${formatCurrency(item.price)} each</span>
              </div>

              <!-- Quantity Controls -->
              <div class="flex items-center gap-2 bg-[#141414] border border-gray-700 rounded-lg p-1">
                <button onclick="updatePosQty('${item.id}', -1)" class="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-red-400">
                  <i class="fas fa-minus text-[9px]"></i>
                </button>
                <span class="font-bold text-white px-1 text-xs">${item.qty}</span>
                <button onclick="updatePosQty('${item.id}', 1)" class="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-emerald-400">
                  <i class="fas fa-plus text-[9px]"></i>
                </button>
              </div>

              <div class="text-right pl-3">
                <span class="font-bold text-white block">${formatCurrency(item.price * item.qty)}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Cart Calculations & Checkout Section -->
        <div class="border-t border-gray-800 pt-3 space-y-3">
          <!-- Discount & Tax Controls -->
          <div class="flex items-center justify-between gap-2 text-xs">
            <div class="flex items-center gap-1">
              <span class="text-gray-400 text-[11px]">Disc %:</span>
              <input type="number" min="0" max="100" value="${appliedDiscountPercent}" onchange="setPosDiscount(this.value)" class="w-14 input-gold py-0.5 px-1 text-xs text-center">
            </div>

            <label class="flex items-center gap-1.5 text-[11px] text-gray-300 cursor-pointer">
              <input type="checkbox" ${isTaxEnabled ? 'checked' : ''} onchange="togglePosTax(this.checked)" class="accent-[#D4AF37]">
              <span>GST (${settings.taxRate}%)</span>
            </label>
          </div>

          <!-- Total Summary Breakdown -->
          <div class="space-y-1 text-xs border-t border-gray-800/80 pt-2">
            <div class="flex justify-between text-gray-400">
              <span>Subtotal:</span>
              <span class="text-white font-semibold">${formatCurrency(subtotal)}</span>
            </div>
            ${appliedDiscountPercent > 0 ? `
              <div class="flex justify-between text-emerald-400">
                <span>Discount (${appliedDiscountPercent}%):</span>
                <span>-${formatCurrency(discountAmount)}</span>
              </div>
            ` : ''}
            <div class="flex justify-between text-gray-400">
              <span>Tax / GST:</span>
              <span class="text-white font-semibold">${formatCurrency(taxAmount)}</span>
            </div>
            <div class="flex justify-between text-base font-extrabold text-white pt-1 border-t border-gray-700">
              <span>Total:</span>
              <span class="text-[#D4AF37] font-heading">${formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <!-- Checkout & Payment Buttons -->
          <button type="button" onclick="openPaymentModal(${grandTotal})" ${posCart.length === 0 ? 'disabled' : ''} class="w-full btn-gold-solid py-3 text-sm flex items-center justify-center gap-2 ${posCart.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}">
            <i class="fas fa-credit-card"></i> Process Payment & Print Bill
          </button>
        </div>
      </div>
    </div>

    <!-- Payment & Invoice Modal -->
    <div id="payment-modal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 hidden">
      <div class="w-full max-w-md glass-card p-6 border border-[#D4AF37]/50 shadow-2xl space-y-5">
        <div class="flex items-center justify-between border-b border-gray-800 pb-3">
          <div class="flex items-center gap-2">
            <i class="fas fa-cash-register text-[#D4AF37]"></i>
            <h3 class="font-heading font-bold text-base text-white">Select Payment Method</h3>
          </div>
          <button type="button" onclick="closePaymentModal()" class="text-gray-400 hover:text-white"><i class="fas fa-times"></i></button>
        </div>

        <div class="text-center py-2 bg-black/50 rounded-xl border border-[#D4AF37]/30">
          <span class="text-xs text-gray-400 block">Total Payable Amount</span>
          <span class="text-3xl font-extrabold text-[#D4AF37] font-heading" id="pos-modal-grand-total">${formatCurrency(grandTotal)}</span>
        </div>

        <!-- Order Type Selection Inside Payment Modal -->
        <div class="space-y-1.5">
          <label class="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Customer Order Type</label>
          <div class="flex items-center gap-2 p-1 bg-black/60 rounded-xl border border-gray-800">
            <button type="button" id="modal-order-type-walkin" onclick="setPosOrderType('Walk-in')"
              class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${posOrderType === 'Walk-in' ? 'bg-[#D4AF37] text-black shadow-sm' : 'text-gray-400 hover:text-white'}">
              <i class="fas fa-walking"></i> Walk-in
            </button>
            <button type="button" id="modal-order-type-online" onclick="setPosOrderType('Online')"
              class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${posOrderType === 'Online' ? 'bg-[#D4AF37] text-black shadow-sm' : 'text-gray-400 hover:text-white'}">
              <i class="fas fa-globe"></i> Online Order
            </button>
          </div>
        </div>

        <!-- 4-Button Payment Method Grid -->
        <div id="payment-methods-grid" class="grid grid-cols-2 gap-3 text-xs">
          <button type="button" id="pay-btn-cash" onclick="completePosOrder('Cash')" class="p-4 rounded-xl bg-black border border-gray-700 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 flex flex-col items-center gap-2 text-white font-bold transition-all">
            <i class="fas fa-money-bill-wave text-2xl text-emerald-400"></i>
            Cash Payment
          </button>

          <button type="button" id="pay-btn-upi" onclick="completePosOrder('UPI')" class="p-4 rounded-xl bg-black border border-gray-700 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 flex flex-col items-center gap-2 text-white font-bold transition-all">
            <i class="fas fa-qrcode text-2xl text-amber-400"></i>
            UPI / QR Code
          </button>

          <button type="button" id="pay-btn-card" onclick="completePosOrder('Card')" class="p-4 rounded-xl bg-black border border-gray-700 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 flex flex-col items-center gap-2 text-white font-bold transition-all">
            <i class="fas fa-credit-card text-2xl text-purple-400"></i>
            Card Payment
          </button>

          <button type="button" id="pay-btn-split" onclick="showSplitPaymentView(${grandTotal})" class="p-4 rounded-xl bg-black border border-gray-700 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 flex flex-col items-center gap-2 text-white font-bold transition-all">
            <i class="fas fa-columns text-2xl text-blue-400"></i>
            Split Payment
          </button>
        </div>

        <!-- Split Payment Custom Allocation Panel -->
        <div id="payment-split-panel" class="hidden space-y-3 text-xs">
          <div class="bg-black/60 p-3 rounded-xl border border-gray-800 space-y-2">
            <div class="flex items-center justify-between text-[11px] text-gray-400 border-b border-gray-800 pb-1">
              <span>Allocate Payment Split</span>
              <span>Total: <strong class="text-white">${formatCurrency(grandTotal)}</strong></span>
            </div>
            
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[10px] text-emerald-400 block font-semibold mb-0.5">
                  <i class="fas fa-money-bill-wave mr-1"></i> Cash Portion (₹)
                </label>
                <input type="number" id="split-cash-amt" min="0" max="${grandTotal}" step="1"
                  value="${Math.round(grandTotal / 2)}"
                  oninput="handleSplitAmountChange(${grandTotal})"
                  class="input-gold w-full py-1 px-2 text-xs font-bold">
              </div>
              <div>
                <label class="text-[10px] text-blue-400 block font-semibold mb-0.5">
                  <select id="split-second-method" onchange="handleSplitAmountChange(${grandTotal})" class="bg-transparent text-blue-400 font-semibold focus:outline-none cursor-pointer">
                    <option value="UPI" class="bg-black text-white">UPI / QR (₹)</option>
                    <option value="CARD" class="bg-black text-white">Card (₹)</option>
                  </select>
                </label>
                <input type="number" id="split-second-amt" min="0" max="${grandTotal}" step="1"
                  value="${grandTotal - Math.round(grandTotal / 2)}"
                  oninput="handleSplitSecondAmountChange(${grandTotal})"
                  class="input-gold w-full py-1 px-2 text-xs font-bold">
              </div>
            </div>

            <div id="split-validation-msg" class="text-[10px] text-emerald-400 font-semibold text-center pt-1">
              ✓ Split total matches: ${formatCurrency(grandTotal)}
            </div>
          </div>

          <div class="flex gap-2">
            <button type="button" onclick="hideSplitPaymentView()" class="w-1/3 btn-outline-dark py-2 text-xs">
              <i class="fas fa-arrow-left mr-1"></i> Back
            </button>
            <button type="button" id="confirm-split-btn" onclick="confirmSplitOrder(${grandTotal})" class="w-2/3 btn-gold-solid py-2 text-xs font-bold flex items-center justify-center gap-1.5">
              <i class="fas fa-check-circle"></i> Complete Split Bill
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Printable Invoice Dialog Container -->
    <div id="printable-invoice-modal" class="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 ${_activeInvoiceOrder ? '' : 'hidden'} overflow-y-auto">
      <div class="w-full max-w-md flex flex-col gap-3 my-auto">
        <!-- Clean Printable Bill (No action buttons or close X inside the receipt paper) -->
        <div class="w-full bg-white text-black p-6 rounded-2xl shadow-2xl space-y-4 font-sans text-xs" id="printable-invoice">
          <!-- Top Header: Round Logo & OG Waffles & Fried Chicken -->
          <div class="text-center border-b border-gray-300 pb-3 space-y-1">
            <img src="${settings.logoUrl || 'assets/logo.png'}" alt="Logo" class="w-16 h-16 object-cover rounded-full mx-auto mb-1 border border-gray-300 shadow-sm">
            <h2 class="font-black text-base uppercase tracking-wider text-black">OG WAFFLES &amp; FRIED CHICKEN</h2>
            <p class="text-[11px] text-gray-600">${settings.address || 'No. 390, paneer nagar, thiruvalluvar salai, mogapair east, chennai - 600037'} • Tel: ${settings.phone || '+91 93633 23102'}</p>
          </div>

          <div id="invoice-details-content" class="space-y-3">
            ${_activeInvoiceOrder ? buildInvoiceDetailsHtml(_activeInvoiceOrder, _activeInvoicePaymentMethod) : '<!-- Dynamic Bill Details Inserted Here -->'}
          </div>

          <!-- Bottom Footer: Thank you for dining with OG -->
          <div class="text-center border-t border-gray-300 pt-3 text-[11px] font-bold text-gray-800 tracking-wide">
            Thank you for dining with OG
          </div>
        </div>

        <!-- Separate Action Controls Below the Bill (Never printed on the bill) -->
        <div class="glass-card p-3 border border-gray-800 flex flex-wrap items-center gap-2 no-print shadow-2xl">
          <button onclick="printAndDownloadInvoice()" class="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all">
            <i class="fas fa-print"></i> <i class="fas fa-file-download"></i> Print &amp; Download Bill (OGLOGS)
          </button>
          <button onclick="window.print()" class="py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-gray-700">
            <i class="fas fa-print"></i> Print
          </button>
          <button onclick="downloadInvoicePdf()" class="py-2.5 px-4 rounded-xl bg-[#D4AF37] hover:brightness-110 text-black font-bold text-xs flex items-center justify-center gap-1.5">
            <i class="fas fa-file-pdf"></i> PDF
          </button>
          <button onclick="closeInvoiceModal()" class="py-2.5 px-4 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold text-xs flex items-center justify-center gap-1.5" title="Close & Start New Sale">
            <i class="fas fa-check-circle"></i> Done
          </button>
        </div>
      </div>
    </div>
  `;
}

// Customer selection state
let posSelectedCustomerId = null;

// Helper to preserve user typed customer inputs before re-rendering
function syncCurrentCustInputs() {
  const nameEl = document.getElementById('pos-cust-name');
  const phoneEl = document.getElementById('pos-cust-phone');
  if (nameEl) posCustName = nameEl.value;
  if (phoneEl) posCustPhone = phoneEl.value;
}

function handlePosCustPhoneInput(val) {
  posCustPhone = val;
  const clean = val.replace(/[^\d]/g, '');
  if (clean.length >= 5) {
    const customers = store.getState().customers || [];
    const match = customers.find(c => {
      const cClean = (c.phone || '').replace(/[^\d]/g, '');
      return cClean === clean || (clean.length >= 10 && cClean.endsWith(clean.slice(-10)));
    });
    if (match) {
      posSelectedCustomerId = match.id;
      if (!posCustName || posCustName === 'Walk-in Guest') {
        posCustName = match.name;
        const nameEl = document.getElementById('pos-cust-name');
        if (nameEl) nameEl.value = match.name;
      }
    } else {
      posSelectedCustomerId = null;
    }
  } else {
    posSelectedCustomerId = null;
  }
}

function handlePosCustNameInput(val) {
  posCustName = val;
}

function clearPosCustomer() {
  posCustName = '';
  posCustPhone = '';
  posSelectedCustomerId = null;
  renderView('pos');
}

function openPosCategory(catId) {
  syncCurrentCustInputs();
  selectedPosCategory = catId;
  posSearchQuery = "";
  renderView('pos');
}

function backToPosCategories() {
  syncCurrentCustInputs();
  selectedPosCategory = null;
  posSearchQuery = "";
  renderView('pos');
}

function clearPosSearch() {
  syncCurrentCustInputs();
  posSearchQuery = "";
  renderView('pos');
}

function renderPosProductCard(item) {
  const isAvail = item.available !== false;
  const onclickVal = isAvail ? `addToPosCart('${item.id}')` : 'void(0)';
  const cardClass = isAvail
    ? 'glass-card p-3 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-all group border border-gray-800 hover:border-[#D4AF37]'
    : 'glass-card p-3 flex flex-col justify-between cursor-not-allowed opacity-50 transition-all border border-gray-800/50';
  const hoverScale = isAvail ? 'group-hover:scale-110' : '';
  const titleClass = isAvail ? 'group-hover:text-[#D4AF37]' : 'text-gray-500';
  const prodImg = item.image_url || item.image || '';
  const imgHtml = prodImg
    ? `<img src="${prodImg}" alt="${item.name}" class="w-full h-full object-cover ${hoverScale} transition-transform duration-300" onerror="this.style.display='none'">`
    : '';
  const unavailOverlay = !isAvail
    ? `<div class="absolute inset-0 bg-black/70 flex items-center justify-center"><span class="bg-red-600/90 text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">Unavailable</span></div>`
    : '';
  const actionHtml = isAvail
    ? `<button class="w-full btn-gold text-[10px] py-1.5 mt-2 flex items-center justify-center gap-1.5"><i class="fas fa-plus"></i> Add to Cart</button>`
    : `<div class="w-full text-center text-[9px] text-gray-600 py-1.5 mt-2 border border-gray-800 rounded-lg">Unavailable</div>`;

  return `
    <div onclick="${onclickVal}" class="${cardClass}">
      <div class="relative h-28 rounded-xl overflow-hidden mb-2 bg-gray-900 flex items-center justify-center">
        ${imgHtml}
        <div class="w-full h-full flex items-center justify-center text-gray-700 ${prodImg ? 'hidden' : 'flex'}">
          <i class="fas fa-utensils text-2xl opacity-20"></i>
        </div>
        <span class="absolute top-2 right-2 bg-black/85 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-bold text-[#D4AF37] border border-[#D4AF37]/40">
          ${formatCurrency(item.price)}
        </span>
        <span class="absolute bottom-1.5 left-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-bold text-gray-300 uppercase tracking-wider border border-gray-700">
          ${item.category || ''}
        </span>
        ${unavailOverlay}
      </div>
      <div class="space-y-1">
        <h4 class="font-heading font-bold text-xs text-white ${titleClass} line-clamp-1">${item.name}</h4>
        <p class="text-[10px] text-gray-500 line-clamp-1">${item.description || item.category}</p>
      </div>
      ${actionHtml}
    </div>
  `;
}

// Cart Helper Functions
function addToPosCart(itemId) {
  syncCurrentCustInputs();
  const menuItems = store.getState().menuItems;
  const item = menuItems.find(m => m.id === itemId);
  if (!item) return;

  // Block unavailable items from being added
  if (item.available === false) {
    alert(`"${item.name}" is currently marked as Unavailable and cannot be added to the order.`);
    return;
  }

  const existing = posCart.find(c => c.id === itemId);
  if (existing) {
    existing.qty += 1;
  } else {
    posCart.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
  }
  renderView('pos');
}

function updatePosQty(itemId, change) {
  syncCurrentCustInputs();
  const item = posCart.find(c => c.id === itemId);
  if (item) {
    item.qty += change;
    if (item.qty <= 0) {
      posCart = posCart.filter(c => c.id !== itemId);
    }
  }
  renderView('pos');
}

function clearPosCart() {
  posCart = [];
  posCustName = '';
  posCustPhone = '';
  appliedDiscountPercent = 0;
  renderView('pos');
}

function handlePosSearch(val) {
  syncCurrentCustInputs();
  posSearchQuery = val;
  renderView('pos');
}

function setPosCategory(cat) {
  syncCurrentCustInputs();
  selectedPosCategory = cat;
  renderView('pos');
}

function setPosDiscount(val) {
  syncCurrentCustInputs();
  appliedDiscountPercent = Math.max(0, Math.min(100, parseFloat(val) || 0));
  renderView('pos');
}

function togglePosTax(checked) {
  syncCurrentCustInputs();
  isTaxEnabled = checked;
  renderView('pos');
}

// ═══════════════════════════════════════════════════════════════════
// STOCK VALIDATION HELPER
// Checks ALL cart items against current inventory.
// Supports both Direct Product Inventory and legacy mappings.
// Items with NO inventory connection sell freely.
// ═══════════════════════════════════════════════════════════════════
function validateCartStock() {
  const state       = store.getState();
  const menuItems   = state.menuItems   || [];
  const ingredients = state.ingredients || [];

  // Accumulate total base unit requirements for the ENTIRE cart
  const requirements = {};

  for (const cartItem of posCart) {
    const menuItem = menuItems.find(m => m.id === cartItem.id);
    if (!menuItem) continue;

    // Type A: Direct Inventory Connection
    if (menuItem.inventoryProductId) {
      const ing = ingredients.find(i => i.id === menuItem.inventoryProductId);
      const deductQty = parseFloat(menuItem.deductQty) || 1;
      const needed = deductQty * cartItem.qty;
      const bUnit = ing ? (ing.baseUnit || ing.unit || '') : '';

      if (!requirements[menuItem.inventoryProductId]) {
        requirements[menuItem.inventoryProductId] = {
          name:      ing ? ing.name : menuItem.name,
          unit:      bUnit,
          required:  0,
          available: ing ? ing.currentQty : 0
        };
      }
      requirements[menuItem.inventoryProductId].required += needed;
    }
    // Backward-compatible recipe array
    else if (Array.isArray(menuItem.ingredients) && menuItem.ingredients.length > 0) {
      for (const recipeIng of menuItem.ingredients) {
        const ing = ingredients.find(i => i.id === recipeIng.ingredientId);
        const needed = recipeIng.qty * cartItem.qty;
        const bUnit = ing ? (ing.baseUnit || ing.unit || '') : '';

        if (!requirements[recipeIng.ingredientId]) {
          requirements[recipeIng.ingredientId] = {
            name:      ing ? ing.name : (recipeIng.name || recipeIng.ingredientId),
            unit:      bUnit,
            required:  0,
            available: ing ? ing.currentQty : 0
          };
        }
        requirements[recipeIng.ingredientId].required += needed;
      }
    }
    // Type B: Non-inventory menu item -> sells freely!
  }

  const shortages = Object.values(requirements).filter(r => r.required > r.available);
  return {
    ok:        shortages.length === 0,
    shortages: shortages
  };
}

// ═══════════════════════════════════════════════════════════════════
// INSUFFICIENT STOCK MODAL
// Shows a styled blocking modal — never a dismissible browser alert.
// ═══════════════════════════════════════════════════════════════════
function showStockErrorModal(shortages) {
  // Remove any existing stock modal
  const old = document.getElementById('pos-stock-error-modal');
  if (old) old.remove();

  const rows = shortages.map(s => {
    const req = parseFloat(s.required.toFixed(2));
    const avl = parseFloat(s.available.toFixed(2));
    return '<tr style="border-bottom:1px solid #333">' +
      '<td style="padding:8px 10px;color:#fff;font-weight:600">' + s.name + '</td>' +
      '<td style="padding:8px 10px;text-align:right;color:#f87171">' + req + ' ' + s.unit + '</td>' +
      '<td style="padding:8px 10px;text-align:right;color:#34d399">' + avl + ' ' + s.unit + '</td>' +
    '</tr>';
  }).join('');

  const modal = document.createElement('div');
  modal.id = 'pos-stock-error-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.92);' +
    'display:flex;align-items:center;justify-content:center;padding:16px';

  // ── Build close button as a DOM element so there is NO inline HTML
  // attribute escaping. This was the freeze bug: the previous version used
  //   onclick="document.getElementById(\"pos-stock-error-modal\").remove()"
  // HTML parsers do not recognise \"-escaping inside attributes — the inner "
  // terminated the onclick attribute immediately, leaving a dead handler.
  // Using addEventListener avoids all HTML-quoting concerns entirely.
  const closeBtn = document.createElement('button');
  closeBtn.id    = 'pos-stock-error-close-btn';
  closeBtn.style.cssText =
    'width:100%;padding:11px;background:#D4AF37;color:#000;font-weight:800;' +
    'border:none;border-radius:10px;font-size:13px;cursor:pointer;letter-spacing:0.5px';
  closeBtn.textContent = 'OK \u2014 Go Back to Cart';
  closeBtn.addEventListener('click', function () {
    const m = document.getElementById('pos-stock-error-modal');
    if (m) m.remove();
    // Ensure _posOrderInProgress is released so the POS is fully usable again
    _posOrderInProgress = false;
  });

  // Set static HTML structure — no interactive elements, no quoting issues.
  modal.innerHTML =
    '<div id="pos-stock-error-card" style="width:100%;max-width:480px;background:#1a1a1a;border:1px solid #dc2626;border-radius:16px;overflow:hidden;box-shadow:0 0 40px rgba(220,38,38,0.3)">' +

      '<div style="background:#7f1d1d;padding:16px 20px;display:flex;align-items:center;gap:10px">' +
        '<span style="font-size:22px">&#x274C;</span>' +
        '<div>' +
          '<div style="color:#fff;font-weight:800;font-size:15px;letter-spacing:0.5px">INSUFFICIENT STOCK</div>' +
          '<div style="color:#fca5a5;font-size:11px;margin-top:2px">Bill cannot be completed. No inventory has been changed.</div>' +
        '</div>' +
      '</div>' +

      '<div style="padding:16px 20px">' +
        '<table style="width:100%;border-collapse:collapse;font-size:12px">' +
          '<thead>' +
            '<tr style="border-bottom:1px solid #444">' +
              '<th style="padding:6px 10px;text-align:left;color:#9ca3af;font-weight:600">Ingredient</th>' +
              '<th style="padding:6px 10px;text-align:right;color:#f87171;font-weight:600">Required</th>' +
              '<th style="padding:6px 10px;text-align:right;color:#34d399;font-weight:600">Available</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
        '<p style="color:#9ca3af;font-size:11px;margin-top:12px;text-align:center">' +
          'Please reduce the quantity in the cart or restock the ingredient.' +
        '</p>' +
      '</div>' +

      '<div id="pos-stock-btn-slot" style="padding:0 20px 16px"></div>' +

    '</div>';

  // Insert modal into DOM first, then inject the close button via DOM API.
  // This is the correct pattern: closeBtn was built above using createElement
  // and addEventListener — no inline onclick string, no HTML quoting issue.
  document.body.appendChild(modal);
  document.getElementById('pos-stock-btn-slot').appendChild(closeBtn);
}


// ═══════════════════════════════════════════════════════════════════
// OPEN PAYMENT MODAL — validates stock FIRST, never shows payment
// buttons if any ingredient is short.
// ═══════════════════════════════════════════════════════════════════
function openPaymentModal(total) {
  if (posCart.length === 0) return;

  // PRIMARY VALIDATION GATE — stock check happens HERE
  const validation = validateCartStock();

  if (!validation.ok) {
    showStockErrorModal(validation.shortages);
    return;
  }

  hideSplitPaymentView();
  document.getElementById('payment-modal').classList.remove('hidden');
}

function closePaymentModal() {
  document.getElementById('payment-modal').classList.add('hidden');
  hideSplitPaymentView();
}

function showSplitPaymentView(grandTotal) {
  const grid = document.getElementById('payment-methods-grid');
  const panel = document.getElementById('payment-split-panel');
  if (grid) grid.classList.add('hidden');
  if (panel) {
    panel.classList.remove('hidden');
    const cashInput = document.getElementById('split-cash-amt');
    const secondInput = document.getElementById('split-second-amt');
    if (cashInput && secondInput) {
      const half = Math.round(grandTotal / 2);
      cashInput.value = half;
      secondInput.value = parseFloat((grandTotal - half).toFixed(2));
    }
    handleSplitAmountChange(grandTotal);
  }
}

function hideSplitPaymentView() {
  const grid = document.getElementById('payment-methods-grid');
  const panel = document.getElementById('payment-split-panel');
  if (grid) grid.classList.remove('hidden');
  if (panel) panel.classList.add('hidden');
}

function handleSplitAmountChange(grandTotal) {
  const cashInput = document.getElementById('split-cash-amt');
  const secondInput = document.getElementById('split-second-amt');
  const msg = document.getElementById('split-validation-msg');
  const btn = document.getElementById('confirm-split-btn');
  if (!cashInput || !secondInput || !msg || !btn) return;

  let cash = parseFloat(cashInput.value) || 0;
  if (cash < 0) cash = 0;
  if (cash > grandTotal) cash = grandTotal;
  cashInput.value = cash;

  const remainder = Math.max(0, grandTotal - cash);
  secondInput.value = parseFloat(remainder.toFixed(2));

  const totalSplit = cash + remainder;
  if (Math.abs(totalSplit - grandTotal) <= 0.01) {
    msg.className = "text-[10px] text-emerald-400 font-semibold text-center pt-1";
    msg.innerHTML = `✓ Split total matches: ${formatCurrency(grandTotal)}`;
    btn.disabled = false;
    btn.classList.remove('opacity-50', 'cursor-not-allowed');
  } else {
    msg.className = "text-[10px] text-red-400 font-semibold text-center pt-1";
    msg.innerHTML = `⚠️ Total is ${formatCurrency(totalSplit)}, must equal ${formatCurrency(grandTotal)}`;
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
  }
}

function handleSplitSecondAmountChange(grandTotal) {
  const cashInput = document.getElementById('split-cash-amt');
  const secondInput = document.getElementById('split-second-amt');
  const msg = document.getElementById('split-validation-msg');
  const btn = document.getElementById('confirm-split-btn');
  if (!cashInput || !secondInput || !msg || !btn) return;

  let second = parseFloat(secondInput.value) || 0;
  if (second < 0) second = 0;
  if (second > grandTotal) second = grandTotal;
  secondInput.value = second;

  const cash = Math.max(0, grandTotal - second);
  cashInput.value = parseFloat(cash.toFixed(2));

  const totalSplit = cash + second;
  if (Math.abs(totalSplit - grandTotal) <= 0.01) {
    msg.className = "text-[10px] text-emerald-400 font-semibold text-center pt-1";
    msg.innerHTML = `✓ Split total matches: ${formatCurrency(grandTotal)}`;
    btn.disabled = false;
    btn.classList.remove('opacity-50', 'cursor-not-allowed');
  } else {
    msg.className = "text-[10px] text-red-400 font-semibold text-center pt-1";
    msg.innerHTML = `⚠️ Total is ${formatCurrency(totalSplit)}, must equal ${formatCurrency(grandTotal)}`;
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
  }
}

async function confirmSplitOrder(grandTotal) {
  const cashInput = document.getElementById('split-cash-amt');
  const secondMethodSelect = document.getElementById('split-second-method');
  const secondInput = document.getElementById('split-second-amt');
  const cashVal = parseFloat(cashInput ? cashInput.value : 0) || 0;
  const secondMethod = secondMethodSelect ? secondMethodSelect.value : "UPI";
  const secondVal = parseFloat(secondInput ? secondInput.value : 0) || 0;

  const splitPayments = [];
  if (cashVal > 0) {
    splitPayments.push({
      payment_method: "CASH",
      amount: cashVal,
      reference_number: "Split-Cash"
    });
  }
  if (secondVal > 0) {
    splitPayments.push({
      payment_method: secondMethod,
      amount: secondVal,
      reference_number: `Split-${secondMethod}`
    });
  }

  await completePosOrder('Split', splitPayments);
}

/* ─── Bill Completion Lock & Active Modal State ─── */
let _posOrderInProgress = false;
let _activeInvoiceOrder = null;
let _activeInvoicePaymentMethod = null;

function buildInvoiceDetailsHtml(order, paymentMethodName) {
  if (!order) return "";
  const settings = store.getState().settings;
  const invoiceNo = order.invoice_number || order.id || "N/A";
  const dateStr = order.sale_date || new Date().toISOString().split("T")[0];
  let timeStr = new Date().toTimeString().split(" ")[0].substring(0, 5);
  if (order.created_at) {
    try {
      timeStr = new Date(order.created_at).toTimeString().split(" ")[0].substring(0, 5);
    } catch(e) {}
  }

  let custName = "Walk-in Guest";
  if (order.customer_id) {
    const found = (store.getState().customers || []).find(c => c.id === order.customer_id);
    if (found && found.name) custName = found.name;
  } else if (posCustName) {
    custName = posCustName;
  }

  let payMethod = paymentMethodName || "Cash";
  if (order.payments && order.payments.length > 0) {
    payMethod = order.payments.map(p => `${p.payment_method} (₹${parseFloat(p.amount || 0).toFixed(2)})`).join(", ");
  }

  const orderType = order.order_type || posOrderType || "Walk-in";

  const itemsList = order.items || [];
  const subtotalVal = order.subtotal !== undefined ? order.subtotal : (order.total || 0);
  const discountVal = order.discount || 0;
  const taxVal = order.tax || 0;
  const totalVal = order.total !== undefined ? order.total : (order.grandTotal || 0);

  return `
    <div class="flex justify-between text-[11px] border-b border-gray-200 pb-2">
      <div>
        <p><strong>Invoice No:</strong> <span class="font-mono text-black font-bold">${invoiceNo}</span></p>
        <p><strong>Date/Time:</strong> ${dateStr} ${timeStr}</p>
        <p><strong>Order Type:</strong> <span class="font-semibold text-gray-800">${orderType}</span></p>
      </div>
      <div class="text-right">
        <p><strong>Customer:</strong> ${custName}</p>
        <p><strong>Payment:</strong> <span class="font-semibold text-emerald-800">${payMethod}</span></p>
      </div>
    </div>

    <table class="w-full text-left border-collapse my-2 text-[11px]">
      <thead>
        <tr class="border-b border-gray-400 font-bold">
          <th class="py-1">Item</th>
          <th class="py-1 text-center">Qty</th>
          <th class="py-1 text-right">Price</th>
          <th class="py-1 text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsList.map(i => {
          const name = i.product_name_snapshot || i.name || "Item";
          const qty = i.quantity !== undefined ? i.quantity : (i.qty || 1);
          const price = i.unit_price !== undefined ? i.unit_price : (i.price || 0);
          const total = i.line_total !== undefined ? i.line_total : (price * qty);
          return `
            <tr class="border-b border-gray-200">
              <td class="py-1 font-medium">${name}</td>
              <td class="py-1 text-center">${qty}</td>
              <td class="py-1 text-right">${formatCurrency(price)}</td>
              <td class="py-1 text-right">${formatCurrency(total)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="space-y-1 text-right text-[11px] pt-1">
      <p>Subtotal: ${formatCurrency(subtotalVal)}</p>
      ${discountVal > 0 ? `<p class="text-emerald-700">Discount: -${formatCurrency(discountVal)}</p>` : ''}
      ${taxVal > 0 ? `<p>GST/Tax (${settings.taxRate}%): ${formatCurrency(taxVal)}</p>` : ''}
      <p class="text-sm font-black text-black border-t border-gray-400 pt-1">Total: ${formatCurrency(totalVal)}</p>
    </div>
  `;
}

async function completePosOrder(method, splitBreakdown = null) {
  // ── LAYER 1: Double-click / re-entry guard ─────────────────────────
  if (_posOrderInProgress) return;

  // ── LAYER 2: Empty cart ────────────────────────────────────────────
  if (posCart.length === 0) {
    closePaymentModal();
    return;
  }

  // ── ACQUIRE LOCK ───────────────────────────────────────────────────
  _posOrderInProgress = true;

  // ── LAYER 3: Disable all payment buttons & show processing state ────
  const btnIds = ['pay-btn-cash', 'pay-btn-upi', 'pay-btn-card', 'pay-btn-split', 'confirm-split-btn'];
  const originalHtmlMap = {};
  btnIds.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      originalHtmlMap[id] = btn.innerHTML;
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    }
  });

  const activeBtnId = method.toLowerCase() === 'split' ? 'confirm-split-btn' : `pay-btn-${method.toLowerCase()}`;
  const activeBtn = document.getElementById(activeBtnId);
  if (activeBtn) {
    activeBtn.innerHTML = `<i class="fas fa-circle-notch fa-spin text-lg text-[#D4AF37]"></i> <span class="text-xs font-bold text-[#D4AF37]">Processing...</span>`;
  }

  const state = store.getState();
  const settings = state.settings;

  const subtotal = posCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountAmt = (subtotal * appliedDiscountPercent) / 100;
  const taxable = Math.max(0, subtotal - discountAmt);
  const taxAmount = isTaxEnabled ? (taxable * settings.taxRate) / 100 : 0;

  // ── Construct backend SaleCreate payload ──
  const items = posCart.map(item => ({
    product_id: item.id,
    quantity: parseFloat(item.qty)
  }));

  let customerPayload = null;
  const rawPhone = (posCustPhone || '').trim();
  const rawName = (posCustName || '').trim();
  if (rawPhone && rawPhone.length >= 5 && rawPhone.toLowerCase() !== 'n/a') {
    customerPayload = {
      name: rawName || 'Valued Guest',
      phone: rawPhone
    };
  }

  const payload = {
    customer_id: posSelectedCustomerId || null,
    customer: customerPayload,
    items: items,
    payment_method: method.toUpperCase(),
    payment_reference: "",
    split_payments: (method.toUpperCase() === 'SPLIT' && splitBreakdown) ? splitBreakdown : null,
    order_type: posOrderType || "Walk-in",
    discount: parseFloat(discountAmt.toFixed(2)),
    tax: parseFloat(taxAmount.toFixed(2))
  };

  try {
    const saleResult = await api.sales.create(payload);

    // Save active invoice state to survive any background re-renders
    _activeInvoiceOrder = saleResult;
    _activeInvoicePaymentMethod = method;

    // Close payment modal and show authoritative invoice
    closePaymentModal();
    displayInvoiceModal(saleResult, method);

    // Clear cart and customer only on SUCCESS
    posCart = [];
    appliedDiscountPercent = 0;
    posCustName = '';
    posCustPhone = '';
    posSelectedCustomerId = null;
    posOrderType = 'Walk-in';

    // Trigger celebratory confetti
    if (typeof confetti === 'function') {
      try { confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } }); } catch(e) {}
    }
  } catch (err) {
    console.error("[POS Sale Error]", err);
    // Reset payment buttons
    btnIds.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '';
        btn.style.cursor = '';
        if (originalHtmlMap[id]) btn.innerHTML = originalHtmlMap[id];
      }
    });

    let errMsg = err.message || "Failed to process sale. Please try again.";
    if (errMsg.toLowerCase().includes("insufficient stock")) {
      errMsg = `⚠️ ${errMsg}`;
    }
    alert(errMsg);
  } finally {
    _posOrderInProgress = false;
  }
}


function displayInvoiceModal(order, paymentMethodName) {
  _activeInvoiceOrder = order;
  _activeInvoicePaymentMethod = paymentMethodName;
  const content = document.getElementById("invoice-details-content");
  const modal = document.getElementById("printable-invoice-modal");
  if (content) {
    content.innerHTML = buildInvoiceDetailsHtml(order, paymentMethodName);
  }
  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeInvoiceModal() {
  _activeInvoiceOrder = null;
  _activeInvoicePaymentMethod = null;
  const modal = document.getElementById("printable-invoice-modal");
  if (modal) {
    modal.classList.add("hidden");
  }
  // Refresh master data (authoritative inventory stock, customer list) in background
  if (typeof store !== 'undefined' && store.loadMasterData) {
    store.loadMasterData().catch(e => console.warn("[Store refresh error]", e));
  }
  renderView('pos');
}

async function downloadInvoicePdf() {
  const element = document.getElementById("printable-invoice");
  if (!element) return;
  const invNo = (_activeInvoiceOrder && (_activeInvoiceOrder.invoice_number || _activeInvoiceOrder.id)) ? (_activeInvoiceOrder.invoice_number || _activeInvoiceOrder.id) : Date.now();
  const opt = {
    margin:       0.35,
    filename:     `Invoice_${invNo}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  if (typeof html2pdf !== 'undefined') {
    try {
      await html2pdf().set(opt).from(element).save();
    } catch(err) {
      console.warn("[PDF generation notice]", err);
    }
  }
}

async function printAndDownloadInvoice() {
  // 1. Automatically download the PDF invoice
  await downloadInvoicePdf();
  // 2. Open browser print prompt
  setTimeout(() => {
    window.print();
  }, 400);
}
