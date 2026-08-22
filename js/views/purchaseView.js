/* OG Waffles & Fried Chicken - Purchase Management View (Authoritative Backend Integration) */

let _purchasesList = [];
let _purchasesLoaded = false;
let _purchasesLoading = false;

async function fetchPurchasesBackend() {
  if (_purchasesLoading || typeof api === 'undefined' || !api.getToken()) return;
  _purchasesLoading = true;
  try {
    const list = await api.purchases.list().catch(err => { console.warn("[Purchases] Fetch error:", err); return []; });
    if (Array.isArray(list)) {
      _purchasesList = list;
      _purchasesLoaded = true;
    }
  } catch (e) {
    console.error("[Purchases] Error:", e);
  } finally {
    _purchasesLoading = false;
  }
}

function renderPurchaseView() {
  const state = store.getState();
  const ingredients = state.ingredients || [];
  const suppliers = state.suppliers || [];

  // Trigger background fetch if not yet loaded
  if (!_purchasesLoaded && !_purchasesLoading && typeof api !== 'undefined' && api.getToken()) {
    fetchPurchasesBackend().then(() => {
      if (typeof currentView !== 'undefined' && currentView === 'purchases') {
        renderCurrentApp();
      }
    });
  }

  const purchases = _purchasesList || [];

  return `
    <div class="p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/20 pb-4">
        <div>
          <span class="text-xs text-[#D4AF37] font-semibold tracking-widest uppercase">Procurement Engine</span>
          <h1 class="font-heading text-2xl font-extrabold text-white">Purchase Management</h1>
          <p class="text-xs text-gray-400">Record supplier purchases with automatic Packet &rarr; Base Unit inventory restock and average cost calculations.</p>
        </div>

        <div class="flex items-center gap-3">
          <button onclick="refreshPurchasesData()" class="btn-outline-dark text-xs py-2 px-3 flex items-center gap-1.5" title="Refresh Purchases">
            <i class="fas fa-sync-alt ${_purchasesLoading ? 'fa-spin text-[#D4AF37]' : ''}"></i> Refresh
          </button>
          <button onclick="openPurchaseModal()" class="btn-gold-solid text-xs py-2 px-4 whitespace-nowrap">
            <i class="fas fa-cart-plus mr-1"></i> Record New Purchase
          </button>
        </div>
      </div>

      <!-- Purchases History Table -->
      <div class="glass-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-black/60 border-b border-gray-800 text-gray-400 uppercase font-semibold text-[10px]">
              <tr>
                <th class="p-3.5">Purchase ID</th>
                <th class="p-3.5">Date</th>
                <th class="p-3.5">Product</th>
                <th class="p-3.5">Supplier</th>
                <th class="p-3.5">Invoice #</th>
                <th class="p-3.5">Purchased Qty</th>
                <th class="p-3.5">Total Added Stock</th>
                <th class="p-3.5">Unit Price</th>
                <th class="p-3.5">Total Amount</th>
                <th class="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-800/60">
              ${purchases.length === 0 ? `
                <tr>
                  <td colspan="10" class="p-8 text-center text-gray-500">
                    <i class="fas fa-truck-loading text-3xl mb-2 block opacity-30"></i>
                    No purchases recorded yet. Record a purchase to add inventory stock!
                  </td>
                </tr>
              ` : purchases.map(p => {
                const sup = suppliers.find(s => s.id === p.supplier_id);
                const supName = sup ? sup.name : (p.supplier_id || 'N/A');
                const items = p.items || [];
                const firstItem = items[0] || {};
                const ing = ingredients.find(i => i.id === firstItem.inventory_product_id);
                const prodName = ing ? ing.name : (firstItem.inventory_product_id || 'Ingredient');

                const pQty = firstItem.purchase_qty !== undefined ? firstItem.purchase_qty : 0;
                const pUnit = firstItem.purchase_unit || 'packet';
                const bQty = firstItem.base_qty !== undefined ? firstItem.base_qty : 0;
                const bUnit = ing ? (ing.baseUnit || ing.unit || 'g') : 'units';
                const unitPrice = firstItem.unit_cost !== undefined ? firstItem.unit_cost : 0;

                return `
                  <tr class="hover:bg-white/5 transition-colors">
                    <td class="p-3.5 font-bold text-white font-mono text-[11px]">${p.id}</td>
                    <td class="p-3.5 text-gray-400 font-mono">${p.purchase_date}</td>
                    <td class="p-3.5 font-bold text-[#D4AF37]">${prodName}</td>
                    <td class="p-3.5 text-gray-300">${supName}</td>
                    <td class="p-3.5 text-gray-400 font-mono">${p.invoice_number}</td>
                    <td class="p-3.5 font-bold text-white font-mono">${pQty} ${pUnit}</td>
                    <td class="p-3.5 font-bold text-emerald-400 font-mono">+${bQty.toLocaleString()} ${bUnit}</td>
                    <td class="p-3.5 text-gray-300">${formatCurrency(unitPrice)}</td>
                    <td class="p-3.5 font-extrabold text-white">${formatCurrency(p.total)}</td>
                    <td class="p-3.5"><span class="badge-green">Completed</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Record Purchase Modal -->
    <div id="purchase-modal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 hidden overflow-y-auto">
      <div class="w-full max-w-lg glass-card p-6 border border-[#D4AF37]/50 shadow-2xl space-y-4 my-8">
        <div class="flex items-center justify-between border-b border-gray-800 pb-3">
          <div>
            <h3 class="font-heading font-bold text-base text-white">Record New Purchase Entry</h3>
            <p class="text-[11px] text-gray-400">Restock base inventory via purchase units &amp; conversion ratio</p>
          </div>
          <button onclick="closePurchaseModal()" class="text-gray-400 hover:text-white"><i class="fas fa-times"></i></button>
        </div>

        <form onsubmit="handlePurchaseSubmit(event)" class="space-y-4 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Purchase Date *</label>
              <input id="pur-date" type="date" required class="input-gold py-2 text-xs">
            </div>
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Select Product *</label>
              <select id="pur-ing-id" required class="input-gold py-2 text-xs" onchange="handlePurchaseProductChange(this.value)">
                <option value="">-- Choose Product --</option>
                ${ingredients.map(i => {
                  const bUnit = i.baseUnit || i.unit || 'piece';
                  return `<option value="${i.id}">${i.name} (Current Stock: ${i.currentQty} ${bUnit})</option>`;
                }).join('')}
              </select>
            </div>
          </div>

          <!-- Conversion & Calculation Card -->
          <div class="p-3.5 rounded-xl bg-black/60 border border-[#D4AF37]/30 space-y-3">
            <h4 class="font-bold text-[#D4AF37] text-xs flex items-center gap-1.5">
              <i class="fas fa-calculator"></i> Purchase &rarr; Base Quantity Calculation
            </h4>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-gray-300 font-semibold mb-1">Purchase Qty *</label>
                <input id="pur-qty" type="number" step="0.01" required min="0.01" value="10" class="input-gold py-2 text-xs font-bold text-center" oninput="calculatePurchaseBaseStock()">
              </div>
              <div>
                <label class="block text-gray-300 font-semibold mb-1">Purchase Unit</label>
                <input id="pur-unit-name" type="text" value="packet" class="input-gold py-2 text-xs text-center" oninput="calculatePurchaseBaseStock()">
              </div>
              <div>
                <label class="block text-gray-300 font-semibold mb-1">1 Unit Contains *</label>
                <input id="pur-conv-qty" type="number" step="0.01" min="0.01" value="5000" class="input-gold py-2 text-xs font-bold text-center" oninput="calculatePurchaseBaseStock()">
              </div>
            </div>

            <!-- Live Calculation Output Banner -->
            <div id="pur-calc-banner" class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs">
              <span class="text-gray-300 font-medium">Total Base Stock Added:</span>
              <span id="pur-total-base-display" class="font-extrabold text-emerald-400 text-sm font-mono">+50,000 g</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Supplier *</label>
              <select id="pur-supplier-id" required class="input-gold py-2 text-xs">
                <option value="">-- Choose Supplier --</option>
                ${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Supplier Invoice # *</label>
              <input id="pur-inv-no" type="text" required placeholder="INV-2026-101" class="input-gold py-2 text-xs font-mono">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Unit Cost per Purchase Unit (₹) *</label>
              <input id="pur-price" type="number" step="0.01" required min="0" placeholder="0.00" class="input-gold py-2 text-xs">
            </div>
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Tax Amount (₹)</label>
              <input id="pur-tax" type="number" step="0.01" value="0.00" class="input-gold py-2 text-xs">
            </div>
          </div>

          <div>
            <label class="block text-gray-300 font-semibold mb-1">Remarks / Note</label>
            <input id="pur-remarks" type="text" placeholder="Fresh delivery from supplier..." class="input-gold py-2 text-xs">
          </div>

          <div class="pt-3 flex justify-end gap-2 border-t border-gray-800">
            <button type="button" onclick="closePurchaseModal()" class="btn-outline-dark text-xs py-2 px-4">Cancel</button>
            <button type="submit" id="pur-submit-btn" class="btn-gold-solid text-xs py-2 px-5">Save Purchase &amp; Add Stock</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

async function refreshPurchasesData() {
  _purchasesLoaded = false;
  await fetchPurchasesBackend();
  renderView('purchases');
}

function handlePurchaseProductChange(productId) {
  const state = store.getState();
  const ing = (state.ingredients || []).find(i => i.id === productId);
  if (!ing) return;

  const pUnit = ing.purchaseUnit || ing.purchase_unit || "packet";
  const conv = ing.conversionQty || ing.conversion_qty || 1;

  document.getElementById("pur-unit-name").value = pUnit;
  document.getElementById("pur-conv-qty").value = conv;
  
  if (ing.supplierId || ing.supplier_id) {
    const supSelect = document.getElementById("pur-supplier-id");
    if (supSelect) supSelect.value = ing.supplierId || ing.supplier_id;
  }

  calculatePurchaseBaseStock();
}

function calculatePurchaseBaseStock() {
  const ingId = document.getElementById("pur-ing-id")?.value;
  const state = store.getState();
  const ing = (state.ingredients || []).find(i => i.id === ingId);
  const bUnit = ing ? (ing.baseUnit || ing.unit || "g") : "g";

  const pQty = parseFloat(document.getElementById("pur-qty")?.value) || 0;
  const cQty = parseFloat(document.getElementById("pur-conv-qty")?.value) || 1;
  const totalBase = pQty * cQty;

  const displayEl = document.getElementById("pur-total-base-display");
  if (displayEl) {
    displayEl.textContent = `+${totalBase.toLocaleString()} ${bUnit}`;
  }
}

function openPurchaseModal() {
  document.getElementById("purchase-modal").classList.remove("hidden");
  document.getElementById("pur-date").value = new Date().toISOString().split("T")[0];
  document.getElementById("pur-ing-id").value = "";
  document.getElementById("pur-qty").value = "10";
  document.getElementById("pur-unit-name").value = "packet";
  document.getElementById("pur-conv-qty").value = "1000";
  document.getElementById("pur-supplier-id").value = "";
  document.getElementById("pur-inv-no").value = "INV-" + Math.floor(1000 + Math.random() * 9000);
  document.getElementById("pur-price").value = "";
  document.getElementById("pur-tax").value = "0.00";
  document.getElementById("pur-remarks").value = "";
  calculatePurchaseBaseStock();
}

function closePurchaseModal() {
  document.getElementById("purchase-modal").classList.add("hidden");
}

async function handlePurchaseSubmit(e) {
  e.preventDefault();
  const date = document.getElementById("pur-date").value;
  const ingredientId = document.getElementById("pur-ing-id").value;
  const purchaseQty = parseFloat(document.getElementById("pur-qty").value) || 0;
  const purchaseUnit = document.getElementById("pur-unit-name").value.trim() || "packet";
  const conversionQty = parseFloat(document.getElementById("pur-conv-qty").value);
  const supplierId = document.getElementById("pur-supplier-id").value;
  const invoiceNo = document.getElementById("pur-inv-no").value.trim();
  const unitPrice = parseFloat(document.getElementById("pur-price").value) || 0;
  const tax = parseFloat(document.getElementById("pur-tax").value) || 0;
  const remarks = document.getElementById("pur-remarks").value.trim();

  if (!ingredientId) {
    alert("Please select a product to purchase.");
    return;
  }

  if (!supplierId) {
    alert("Please select a supplier.");
    return;
  }

  if (isNaN(conversionQty) || conversionQty <= 0) {
    alert("Conversion quantity must be greater than zero.");
    return;
  }

  const submitBtn = document.getElementById("pur-submit-btn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Saving...`;
  }

  const payload = {
    supplier_id: supplierId,
    invoice_number: invoiceNo || `INV-${Date.now()}`,
    purchase_date: date || new Date().toISOString().split("T")[0],
    tax: tax,
    discount: 0.00,
    notes: remarks,
    items: [
      {
        inventory_product_id: ingredientId,
        purchase_qty: purchaseQty,
        purchase_unit: purchaseUnit,
        conversion_qty: conversionQty,
        unit_cost: unitPrice
      }
    ]
  };

  try {
    await api.purchases.create(payload);
    store.addNotification("Purchase Recorded", `Added ${purchaseQty} ${purchaseUnit} to inventory. Stock & average cost updated.`, "success");
    closePurchaseModal();
    // Refresh purchases & inventory master data
    await Promise.all([
      fetchPurchasesBackend(),
      store.loadMasterData()
    ]);
    renderView('purchases');
  } catch (err) {
    console.error("[Purchase Submit Error]", err);
    alert(err.message || "Failed to record purchase.");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Save Purchase & Add Stock`;
    }
  }
}

