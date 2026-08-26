/* OG Waffles & Fried Chicken - Direct Inventory & Unit Conversion Engine (INR ₹ Edition) */

let inventorySearch = "";
let inventoryFilterStatus = "All";

function renderInventoryView() {
  const state = store.getState();
  const ingredients = state.ingredients || [];
  const settings = state.settings;

  const filtered = ingredients.filter(ing => {
    const name = ing.name || "";
    const cat = ing.category || "";
    const matchesSearch = name.toLowerCase().includes(inventorySearch.toLowerCase()) || cat.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchesStatus = inventoryFilterStatus === "All" || ing.status === inventoryFilterStatus;
    return matchesSearch && matchesStatus;
  });

  return `
    <div class="p-6 space-y-6 max-w-7xl mx-auto">
      <!-- Title & Action Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/20 pb-4">
        <div>
          <span class="text-xs text-[#D4AF37] font-semibold tracking-widest uppercase">Stock Control Engine</span>
          <h1 class="font-heading text-2xl font-extrabold text-white">Direct Product Inventory</h1>
          <p class="text-xs text-gray-400 mt-0.5">Track products with configurable Packet &rarr; Base Unit (g, kg, piece, packet) conversions.</p>
        </div>

        <button onclick="openIngredientModal()" class="btn-gold-solid text-xs py-2 px-4 whitespace-nowrap">
          <i class="fas fa-plus mr-1"></i> Add Inventory Product
        </button>
      </div>

      <!-- Controls & Filter Toolbar -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#141414] p-4 rounded-xl border border-gray-800">
        <div class="relative w-full sm:w-80">
          <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D4AF37] text-xs"></i>
          <input type="text" value="${inventorySearch}" oninput="handleInventorySearch(this.value)" placeholder="Search product name or category..." class="input-gold pl-9 py-1.5 text-xs">
        </div>

        <div class="flex items-center gap-2 text-xs w-full sm:w-auto">
          <span class="text-gray-400">Status Filter:</span>
          <select onchange="handleInventoryStatusFilter(this.value)" class="input-gold py-1.5 px-3 text-xs w-auto">
            <option value="All" ${inventoryFilterStatus === 'All' ? 'selected' : ''}>All Stock</option>
            <option value="Available" ${inventoryFilterStatus === 'Available' ? 'selected' : ''}>Green - Available</option>
            <option value="Running Low" ${inventoryFilterStatus === 'Running Low' ? 'selected' : ''}>Yellow - Running Low</option>
            <option value="Out of Stock" ${inventoryFilterStatus === 'Out of Stock' ? 'selected' : ''}>Red - Out of Stock</option>
          </select>
        </div>
      </div>

      <!-- Inventory Data Table -->
      <div class="glass-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-black/60 border-b border-gray-800 text-gray-400 uppercase font-semibold text-[10px]">
              <tr>
                <th class="p-3.5">Product Name</th>
                <th class="p-3.5">Category</th>
                <th class="p-3.5">Current Stock (Base Unit)</th>
                <th class="p-3.5">Purchase &rarr; Base Conversion</th>
                <th class="p-3.5">Min Limit</th>
                <th class="p-3.5">Avg Unit Cost</th>
                <th class="p-3.5">Supplier</th>
                <th class="p-3.5">Status</th>
                <th class="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-800/60">
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="9" class="p-8 text-center text-gray-500">
                    <i class="fas fa-boxes text-3xl mb-2 block opacity-30"></i>
                    No inventory products found. Click "Add Inventory Product" to create one!
                  </td>
                </tr>
              ` : filtered.map(ing => {
                const bUnit = ing.baseUnit || ing.unit || "piece";
                const pUnit = ing.purchaseUnit || "packet";
                const conv = parseFloat(ing.conversionQty);
                const hasValidConv = !isNaN(conv) && conv > 0;
                
                // Formatted stock display
                let stockDisplay = `${ing.currentQty} ${bUnit}`;
                if (bUnit === 'g' && ing.currentQty >= 1000) {
                  stockDisplay = `${ing.currentQty.toLocaleString()} g (${(ing.currentQty / 1000).toFixed(2)} kg)`;
                }

                const isOutOfStock = ing.currentQty <= 0;
                const isLowStock = !isOutOfStock && ing.currentQty <= ing.minLimit;

                return `
                  <tr class="hover:bg-white/5 transition-colors">
                    <td class="p-3.5 font-bold text-white">${ing.name}</td>
                    <td class="p-3.5 text-gray-400">${ing.category || 'General'}</td>
                    <td class="p-3.5 font-extrabold ${isOutOfStock || isLowStock ? 'text-red-400' : 'text-emerald-400'}">
                      ${stockDisplay}
                    </td>
                    <td class="p-3.5 text-gray-300 font-mono text-[11px]">
                      ${hasValidConv ? `
                        <span class="px-2 py-0.5 rounded bg-black/60 border border-gray-700 text-[#D4AF37]">
                          1 ${pUnit} = ${conv} ${bUnit}
                        </span>
                      ` : `
                        <span class="text-red-400 font-semibold text-[10px]">
                          <i class="fas fa-exclamation-circle mr-1"></i> Conversion is not configured for this product.
                        </span>
                      `}
                    </td>
                    <td class="p-3.5 text-gray-400">${ing.minLimit} ${bUnit}</td>
                    <td class="p-3.5 text-[#D4AF37] font-semibold">${formatCurrency(ing.avgCost)}</td>
                    <td class="p-3.5 text-gray-300">${ing.supplier || 'N/A'}</td>
                    <td class="p-3.5">
                      ${isOutOfStock ? '<span class="badge-red font-bold">OUT OF STOCK</span>' :
                        isLowStock ? '<span class="badge-yellow font-bold">LOW STOCK</span>' :
                        '<span class="badge-green font-bold">IN STOCK</span>'}
                    </td>
                    <td class="p-3.5 text-right space-x-2">
                      <button onclick="openStockMovementsModal('${ing.id}')" class="text-xs text-[#D4AF37] hover:underline" title="View Audit Movements">
                        <i class="fas fa-history"></i> Movements
                      </button>
                      <button onclick="openIngredientModal('${ing.id}')" class="text-xs text-blue-400 hover:underline" title="Edit Product">
                        <i class="fas fa-edit"></i> Edit
                      </button>
                      <button onclick="deleteIngredientItem('${ing.id}')" class="text-xs text-red-400 hover:underline" title="Delete Product">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Stock Movements Audit Modal -->
    <div id="movements-modal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 hidden">
      <div class="w-full max-w-3xl glass-card p-6 border border-[#D4AF37]/50 shadow-2xl space-y-4 my-8 max-h-[85vh] flex flex-col justify-between">
        <div class="flex items-center justify-between border-b border-gray-800 pb-3">
          <div>
            <h3 id="movements-modal-title" class="font-heading font-bold text-base text-white">Stock Movements Audit Log</h3>
            <p class="text-[11px] text-gray-400">Authoritative backend transaction log for stock deductions, purchases, and adjustments</p>
          </div>
          <button onclick="closeStockMovementsModal()" class="text-gray-400 hover:text-white"><i class="fas fa-times"></i></button>
        </div>

        <div class="overflow-y-auto flex-1 border border-gray-800 rounded-xl bg-black/40">
          <table class="w-full text-left text-xs">
            <thead class="bg-black/80 border-b border-gray-800 text-gray-400 text-[10px] uppercase font-semibold sticky top-0">
              <tr>
                <th class="p-2.5">Date &amp; Time</th>
                <th class="p-2.5">Type</th>
                <th class="p-2.5">Quantity</th>
                <th class="p-2.5">Stock Shift</th>
                <th class="p-2.5">Ref ID</th>
                <th class="p-2.5">Notes</th>
              </tr>
            </thead>
            <tbody id="movements-modal-body" class="divide-y divide-gray-800/60 text-xs">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>

        <div class="pt-3 border-t border-gray-800 flex justify-end">
          <button onclick="closeStockMovementsModal()" class="btn-outline-dark text-xs py-1.5 px-4">Close</button>
        </div>
      </div>
    </div>

    <!-- Product Edit Modal -->
    <div id="ingredient-modal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 hidden overflow-y-auto">
      <div class="w-full max-w-xl glass-card p-6 border border-[#D4AF37]/50 shadow-2xl space-y-4 my-8">
        <div class="flex items-center justify-between border-b border-gray-800 pb-3">
          <div>
            <h3 id="ing-modal-title" class="font-heading font-bold text-base text-white">Add Inventory Product</h3>
            <p class="text-[11px] text-gray-400">Configure base stock units and purchase conversion ratios</p>
          </div>
          <button onclick="closeIngredientModal()" class="text-gray-400 hover:text-white"><i class="fas fa-times"></i></button>
        </div>

        <form onsubmit="handleIngredientSave(event)" class="space-y-4 text-xs">
          <input type="hidden" id="ing-id">

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Product Name *</label>
              <input id="ing-name" type="text" required placeholder="e.g. Frozen Chicken" class="input-gold py-2 text-xs">
            </div>
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Category *</label>
              <input id="ing-category" type="text" required placeholder="Poultry, Frozen, Fries, Waffles..." class="input-gold py-2 text-xs">
            </div>
          </div>

          <!-- Unit Configuration Section -->
          <div class="p-3.5 rounded-xl bg-black/60 border border-[#D4AF37]/30 space-y-3">
            <h4 class="font-bold text-[#D4AF37] text-xs flex items-center gap-1.5">
              <i class="fas fa-balance-scale"></i> Unit &amp; Conversion Configuration
            </h4>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-gray-300 font-semibold mb-1">Purchase Unit *</label>
                <input id="ing-purchase-unit" type="text" required placeholder="packet, box, bag..." value="packet" class="input-gold py-2 text-xs" oninput="updateConversionPreview()">
              </div>

              <div>
                <label class="block text-gray-300 font-semibold mb-1">Base / Selling Unit *</label>
                <select id="ing-base-unit" required class="input-gold py-2 text-xs" onchange="updateConversionPreview()">
                  <option value="g">gram (g)</option>
                  <option value="kg">kilogram (kg)</option>
                  <option value="piece">piece</option>
                  <option value="packet">packet</option>
                </select>
              </div>

              <div class="col-span-2 sm:col-span-1">
                <label class="block text-gray-300 font-semibold mb-1">1 Purchase Unit Contains *</label>
                <input id="ing-conv-qty" type="number" step="0.01" min="0.01" required value="5000" class="input-gold py-2 text-xs font-bold text-center" oninput="updateConversionPreview()">
              </div>
            </div>

            <!-- Live Conversion Preview Banner -->
            <div id="ing-conv-preview" class="p-2 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-center text-[#D4AF37] font-semibold text-[11px]">
              Formula: 1 packet = 5000 g
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Current Stock (in Base Unit) *</label>
              <input id="ing-qty" type="number" step="0.01" required class="input-gold py-2 text-xs font-bold text-emerald-400">
            </div>
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Min Alert Limit *</label>
              <input id="ing-min" type="number" step="0.01" required class="input-gold py-2 text-xs">
            </div>
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Avg Unit Cost (₹)</label>
              <input id="ing-cost" type="number" step="0.01" required class="input-gold py-2 text-xs">
            </div>
          </div>

          <div>
            <label class="block text-gray-300 font-semibold mb-1">Default Supplier</label>
            <select id="ing-supplier-id" class="input-gold py-2 text-xs w-full">
              <option value="">-- No Supplier Selected --</option>
              ${(store.getState().suppliers || []).map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
            </select>
          </div>

          <div class="pt-3 flex justify-end gap-2 border-t border-gray-800">
            <button type="button" onclick="closeIngredientModal()" class="btn-outline-dark text-xs py-2 px-4">Cancel</button>
            <button type="submit" class="btn-gold-solid text-xs py-2 px-5">Save Product</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function handleInventorySearch(val) {
  inventorySearch = val;
  renderView('inventory');
}

function handleInventoryStatusFilter(val) {
  inventoryFilterStatus = val;
  renderView('inventory');
}

function updateConversionPreview() {
  const pUnit = document.getElementById("ing-purchase-unit")?.value.trim() || "packet";
  const bUnit = document.getElementById("ing-base-unit")?.value || "g";
  const conv = document.getElementById("ing-conv-qty")?.value || "1";
  const preview = document.getElementById("ing-conv-preview");
  if (preview) {
    preview.innerHTML = `Formula: 1 <strong>${pUnit}</strong> = <strong>${conv} ${bUnit}</strong>`;
  }
}

function openIngredientModal(id = null) {
  const modal = document.getElementById("ingredient-modal");
  const title = document.getElementById("ing-modal-title");
  const suppliers = store.getState().suppliers || [];
  
  if (id) {
    const ing = store.getState().ingredients.find(i => i.id === id);
    if (ing) {
      title.innerText = "Edit Inventory Product — " + ing.name;
      document.getElementById("ing-id").value = ing.id;
      document.getElementById("ing-name").value = ing.name;
      document.getElementById("ing-category").value = ing.category || "General";
      document.getElementById("ing-purchase-unit").value = (ing.purchaseUnit || ing.purchase_unit || "packet").toLowerCase();
      document.getElementById("ing-base-unit").value = (ing.baseUnit || ing.unit || "g").toLowerCase() === "g" ? "g" : "piece";
      document.getElementById("ing-conv-qty").value = ing.conversionQty || ing.conversion_qty || 1;
      document.getElementById("ing-qty").value = ing.currentQty !== undefined ? ing.currentQty : (ing.current_qty || 0);
      document.getElementById("ing-qty").disabled = true; // Stock count adjusted via Adjust/Purchase/Waste
      document.getElementById("ing-min").value = ing.minLimit !== undefined ? ing.minLimit : (ing.min_limit || 10);
      document.getElementById("ing-cost").value = ing.avgCost !== undefined ? ing.avgCost : (ing.avg_cost || 0);
      
      const supSel = document.getElementById("ing-supplier-id");
      if (supSel) {
        supSel.value = ing.supplierId || ing.supplier_id || "";
      }
    }
  } else {
    title.innerText = "Add New Inventory Product";
    document.getElementById("ing-id").value = "";
    document.getElementById("ing-name").value = "";
    document.getElementById("ing-category").value = "Frozen";
    document.getElementById("ing-purchase-unit").value = "packet";
    document.getElementById("ing-base-unit").value = "g";
    document.getElementById("ing-conv-qty").value = "5000";
    document.getElementById("ing-qty").value = "0";
    document.getElementById("ing-qty").disabled = false;
    document.getElementById("ing-min").value = "500";
    document.getElementById("ing-cost").value = "0.00";
    
    const supSel = document.getElementById("ing-supplier-id");
    if (supSel) {
      supSel.value = "";
    }
  }
  updateConversionPreview();
  modal.classList.remove("hidden");
}

function closeIngredientModal() {
  document.getElementById("ingredient-modal").classList.add("hidden");
}

async function handleIngredientSave(e) {
  e.preventDefault();
  const id = document.getElementById("ing-id").value;
  const name = document.getElementById("ing-name").value.trim();
  const category = document.getElementById("ing-category").value.trim();
  const purchaseUnit = document.getElementById("ing-purchase-unit").value.trim().toUpperCase() || "PACKET";
  const baseUnitRaw = document.getElementById("ing-base-unit").value;
  const baseUnit = (baseUnitRaw === "g" || baseUnitRaw === "kg" || baseUnitRaw === "gram") ? "GRAM" : "PIECE";
  const conversionQty = parseFloat(document.getElementById("ing-conv-qty").value);
  const currentQty = parseFloat(document.getElementById("ing-qty").value) || 0;
  const minLimit = parseFloat(document.getElementById("ing-min").value) || 0;
  const avgCost = parseFloat(document.getElementById("ing-cost").value) || 0;
  const supplierId = document.getElementById("ing-supplier-id").value || null;

  if (!name || !category) {
    alert("Please fill in Product Name and Category.");
    return;
  }

  if (isNaN(conversionQty) || conversionQty <= 0) {
    alert("Conversion is not configured for this product. Please specify how many base units are contained in 1 purchase unit.");
    return;
  }

  try {
    if (id) {
      await api.inventory.update(id, {
        name,
        category,
        purchase_unit: purchaseUnit,
        base_unit: baseUnit,
        conversion_qty: conversionQty,
        min_limit: minLimit,
        supplier_id: supplierId
      });
      store.addNotification("Inventory Updated", `"${name}" updated successfully`, "success");
    } else {
      await api.inventory.create({
        name,
        category,
        purchase_unit: purchaseUnit,
        base_unit: baseUnit,
        conversion_qty: conversionQty,
        current_qty: currentQty,
        min_limit: minLimit,
        avg_cost: avgCost,
        supplier_id: supplierId
      });
      store.addNotification("Inventory Created", `"${name}" added to inventory`, "success");
    }
    closeIngredientModal();
    await store.loadMasterData();
    renderView('inventory');
  } catch (err) {
    console.error("[InventoryView] Save Error:", err);
    alert(err.message || "Failed to save inventory product.");
  }
}

async function deleteIngredientItem(id) {
  const role = store.getState().currentUser ? store.getState().currentUser.role : null;
  if (role !== 'OWNER') {
    alert("Only the Owner has permission to delete inventory products.");
    return;
  }
  if (confirm("Are you sure you want to delete this product from inventory? This action cannot be undone.")) {
    try {
      await api.inventory.delete(id);
      store.addNotification("Inventory Deleted", "Product removed from inventory", "warning");
      await store.loadMasterData();
      renderView('inventory');
    } catch (err) {
      console.error("[InventoryView] Delete Error:", err);
      alert(err.message || "Failed to delete inventory product.");
    }
  }
}

async function openStockMovementsModal(productId) {
  const ing = (store.getState().ingredients || []).find(i => i.id === productId);
  const modal = document.getElementById("movements-modal");
  const title = document.getElementById("movements-modal-title");
  const tbody = document.getElementById("movements-modal-body");
  if (!modal || !tbody) return;

  title.textContent = `Stock Movements — ${ing ? ing.name : productId}`;
  tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-gray-500 text-xs"><i class="fas fa-circle-notch fa-spin text-lg text-[#D4AF37] mb-2 block"></i> Loading stock movements...</td></tr>`;
  modal.classList.remove("hidden");

  try {
    const movements = await api.inventory.movements({ inventory_product_id: productId });
    if (!movements || movements.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-gray-500 text-xs">No stock movements recorded for this product yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = movements.map(m => {
      const typeColor = m.movement_type === 'PURCHASE' ? 'bg-emerald-500/20 text-emerald-400' :
                        m.movement_type === 'SALE' ? 'bg-blue-500/20 text-blue-400' :
                        m.movement_type === 'REVERSAL' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-amber-500/20 text-amber-400';
      const dateStr = m.created_at ? new Date(m.created_at).toLocaleString() : 'N/A';
      return `
        <tr class="hover:bg-white/5 transition-colors">
          <td class="p-2.5 text-gray-400 font-mono text-[11px]">${dateStr}</td>
          <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase ${typeColor}">${m.movement_type}</span></td>
          <td class="p-2.5 font-bold font-mono ${m.movement_type === 'SALE' ? 'text-red-400' : 'text-emerald-400'}">${m.movement_type === 'SALE' ? '-' : '+'}${m.quantity} ${m.unit || ''}</td>
          <td class="p-2.5 text-gray-300 font-mono text-[11px]">${m.quantity_before} &rarr; ${m.quantity_after}</td>
          <td class="p-2.5 text-gray-400 font-mono text-[11px]">${m.reference_id || '-'}</td>
          <td class="p-2.5 text-gray-300 text-[11px]">${m.notes || '-'}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error("[Movements Error]", err);
    tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-red-400 text-xs">Failed to load stock movements: ${err.message}</td></tr>`;
  }
}

function closeStockMovementsModal() {
  const modal = document.getElementById("movements-modal");
  if (modal) modal.classList.add("hidden");
}


