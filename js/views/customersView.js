/* OG Waffles & Fried Chicken - Customer Database View (INR ₹ Edition) */

let customerSearchQuery = "";

function renderCustomersView() {
  const state = store.getState();
  const customers = state.customers || [];

  const filtered = customers.filter(c =>
    (c.name || '').toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    (c.phone || '').includes(customerSearchQuery)
  );

  return `
    <div class="p-6 space-y-6 max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/20 pb-4">
        <div>
          <span class="text-xs text-[#D4AF37] font-semibold tracking-widest uppercase">Client Relationship Directory</span>
          <h1 class="font-heading text-2xl font-extrabold text-white">Customer Database</h1>
          <p class="text-xs text-gray-400 mt-0.5">${customers.length} registered customers • Click any customer to view their full purchase history &amp; loyalty status</p>
        </div>

        <div class="flex items-center gap-3">
          <div class="relative w-full sm:w-64">
            <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D4AF37] text-xs"></i>
            <input type="text" value="${customerSearchQuery}" oninput="handleCustomerDBSearch(this.value)" placeholder="Search name or phone..." class="input-gold pl-9 py-2 text-xs">
          </div>
          <button onclick="openCustomerAddModal()" class="btn-gold-solid text-xs py-2 px-4 whitespace-nowrap">
            <i class="fas fa-user-plus mr-1"></i> Add Customer
          </button>
        </div>
      </div>

      <div class="glass-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-black/60 border-b border-gray-800 text-gray-400 uppercase font-semibold text-[10px]">
              <tr>
                <th class="p-3.5">Customer ID</th>
                <th class="p-3.5">Customer Name</th>
                <th class="p-3.5">Phone Number</th>
                <th class="p-3.5">Visit Count</th>
                <th class="p-3.5">Total Spent</th>
                <th class="p-3.5">Reward Status</th>
                <th class="p-3.5">Last Visit</th>
                <th class="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-800/60">
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="8" class="p-8 text-center text-gray-500">
                    <i class="fas fa-users text-3xl mb-2 block opacity-30"></i>
                    No customers found matching your search.
                  </td>
                </tr>
              ` : filtered.map(c => `
                <tr class="hover:bg-white/5 transition-colors group">
                  <td class="p-3.5 font-bold text-white font-mono text-[10px]">${c.id}</td>
                  <td class="p-3.5">
                    <button onclick="openCustomerProfileModal('${c.id}')" class="font-bold text-[#D4AF37] hover:text-[#F3E5AB] hover:underline transition-colors cursor-pointer text-left flex items-center gap-1.5">
                      <span>${c.name}</span>
                      <i class="fas fa-history text-[9px] opacity-60 group-hover:opacity-100" title="View Purchase History"></i>
                    </button>
                  </td>
                  <td class="p-3.5 text-gray-300 font-mono">${c.phone}</td>
                  <td class="p-3.5 font-bold text-white">${c.visits || 0} visits</td>
                  <td class="p-3.5 font-extrabold text-emerald-400">${formatCurrency(c.totalSpent || 0)}</td>
                  <td class="p-3.5">
                    <span class="${(c.rewardProgress || 0) >= 10 ? 'badge-gold font-bold animate-pulse' : 'badge-green'}">
                      ${(c.rewardProgress || 0) >= 10 ? '🎉 REWARD AVAILABLE' : `${c.rewardProgress || 0} / 10 Visits`}
                    </span>
                  </td>
                  <td class="p-3.5 text-gray-500">${c.lastVisit || 'N/A'}</td>
                  <td class="p-3.5 text-right">
                    <div class="flex items-center justify-end gap-3">
                       <button onclick="openCustomerProfileModal('${c.id}')" class="text-xs text-blue-400 hover:text-blue-300 transition-colors" title="Purchase History">
                         <i class="fas fa-receipt"></i>
                       </button>
                       <button onclick="openCustomerEditModal('${c.id}')" class="text-xs text-[#D4AF37] hover:text-[#F3E5AB] transition-colors" title="Edit Customer">
                         <i class="fas fa-pen"></i>
                       </button>
                       ${(store.getState().currentUser && store.getState().currentUser.role === 'OWNER') ? `
                       <button onclick="deleteCustomerRecord('${c.id}')" class="text-xs text-red-400 hover:text-red-300 transition-colors" title="Delete Customer">
                         <i class="fas fa-trash"></i>
                       </button>` : ''}
                     </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Customer Profile & Purchase History Modal -->
    <div id="customer-profile-modal" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 hidden overflow-y-auto">
      <div class="w-full max-w-2xl glass-card border border-[#D4AF37]/50 shadow-2xl p-6 space-y-5 my-8">
        <div class="flex items-center justify-between border-b border-gray-800 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] font-bold text-base">
              <i class="fas fa-user"></i>
            </div>
            <div>
              <h3 id="cust-profile-name" class="font-heading font-bold text-base text-white">Customer Profile</h3>
              <p id="cust-profile-phone" class="text-xs text-[#D4AF37] font-mono">+91 00000 00000</p>
            </div>
          </div>
          <button onclick="closeCustomerProfileModal()" class="text-gray-400 hover:text-white"><i class="fas fa-times"></i></button>
        </div>

        <!-- KPI Stats Overview -->
        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="p-3 rounded-xl bg-black/50 border border-gray-800">
            <span class="text-[10px] text-gray-400 uppercase tracking-wider block">Total Visits</span>
            <span id="cust-profile-visits" class="font-heading text-lg font-black text-white">0</span>
          </div>
          <div class="p-3 rounded-xl bg-black/50 border border-gray-800">
            <span class="text-[10px] text-gray-400 uppercase tracking-wider block">Total Spent</span>
            <span id="cust-profile-spent" class="font-heading text-lg font-black text-emerald-400">₹0.00</span>
          </div>
          <div class="p-3 rounded-xl bg-black/50 border border-gray-800">
            <span class="text-[10px] text-gray-400 uppercase tracking-wider block">Loyalty Reward</span>
            <span id="cust-profile-reward" class="font-heading text-sm font-bold text-[#D4AF37] block mt-1">0 / 10</span>
          </div>
        </div>

        <!-- Purchase History Table -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="font-heading font-bold text-xs text-[#D4AF37] flex items-center gap-1.5">
              <i class="fas fa-history"></i> Complete Purchase History
            </h4>
            <span id="cust-profile-orders-count" class="text-[10px] text-gray-400">0 bills</span>
          </div>

          <div class="max-h-64 overflow-y-auto border border-gray-800 rounded-xl bg-black/40">
            <table class="w-full text-left text-xs">
              <thead class="bg-black/80 border-b border-gray-800 text-gray-400 text-[10px] uppercase font-semibold sticky top-0">
                <tr>
                  <th class="p-2.5">Bill #</th>
                  <th class="p-2.5">Date &amp; Time</th>
                  <th class="p-2.5">Items Ordered</th>
                  <th class="p-2.5">Payment</th>
                  <th class="p-2.5 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody id="cust-profile-history-body" class="divide-y divide-gray-800/60 text-xs">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Actions -->
        <div class="pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
          <button id="cust-profile-reward-btn" class="btn-gold text-xs py-1.5 px-4">
            <i class="fas fa-award mr-1"></i> View Loyalty Reward Card
          </button>
          <button onclick="closeCustomerProfileModal()" class="btn-outline-dark text-xs py-1.5 px-4">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Customer Modal -->
    <div id="customer-modal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 hidden">
      <div class="w-full max-w-md glass-card p-6 border border-[#D4AF37]/50 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-gray-800 pb-3">
          <h3 id="customer-modal-title" class="font-heading font-bold text-base text-white">Add New Customer</h3>
          <button onclick="closeCustomerModal()" class="text-gray-400 hover:text-white transition-colors"><i class="fas fa-times"></i></button>
        </div>

        <form onsubmit="handleCustomerSubmit(event)" class="space-y-3 text-xs">
          <input type="hidden" id="cust-edit-id" value="">

          <div>
            <label class="block text-gray-300 font-semibold mb-1">Customer Name *</label>
            <input id="cust-name" type="text" required placeholder="Full Name" class="input-gold py-2 text-xs">
          </div>

          <div>
            <label class="block text-gray-300 font-semibold mb-1">Phone Number *</label>
            <input id="cust-phone" type="tel" required placeholder="9876543210" class="input-gold py-2 text-xs font-mono">
          </div>

          <div class="pt-3 flex justify-end gap-2 border-t border-gray-800">
            <button type="button" onclick="closeCustomerModal()" class="btn-outline-dark text-xs py-2 px-4">Cancel</button>
            <button type="submit" id="cust-submit-btn" class="btn-gold-solid text-xs py-2 px-5">
              <i class="fas fa-save"></i> Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function handleCustomerDBSearch(val) {
  customerSearchQuery = val;
  renderView('customers');
}

async function openCustomerProfileModal(customerId) {
  const state = store.getState();
  let cust = (state.customers || []).find(c => c.id === customerId);

  // Set initial UI with cached/store state
  if (cust) {
    document.getElementById("cust-profile-name").textContent = cust.name;
    document.getElementById("cust-profile-phone").textContent = cust.phone;
    document.getElementById("cust-profile-visits").textContent = cust.visits || cust.visit_count || 0;
    document.getElementById("cust-profile-spent").textContent = formatCurrency(cust.totalSpent || cust.total_spent || 0);
    
    const rewEl = document.getElementById("cust-profile-reward");
    const rProgress = cust.rewardProgress !== undefined ? cust.rewardProgress : (cust.reward_progress || 0);
    if (rProgress >= 10) {
      rewEl.innerHTML = '<span class="text-[#D4AF37] font-extrabold animate-pulse">🎉 REWARD AVAILABLE</span>';
    } else {
      rewEl.textContent = `${rProgress} / 10 Visits`;
    }
  }

  const tbody = document.getElementById("cust-profile-history-body");
  tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-gray-500 text-xs"><i class="fas fa-circle-notch fa-spin text-lg text-[#D4AF37] mb-2 block"></i> Loading purchase history...</td></tr>`;

  document.getElementById("customer-profile-modal").classList.remove("hidden");

  // Fetch live authoritative details & sales history from backend
  try {
    const [detail, salesHistory] = await Promise.all([
      api.customers.get(customerId).catch(() => null),
      api.customers.sales(customerId).catch(() => [])
    ]);

    if (detail) {
      document.getElementById("cust-profile-name").textContent = detail.name;
      document.getElementById("cust-profile-phone").textContent = detail.phone;
      document.getElementById("cust-profile-visits").textContent = detail.visit_count || 0;
      document.getElementById("cust-profile-spent").textContent = formatCurrency(detail.total_spent || 0);
      
      const rewEl = document.getElementById("cust-profile-reward");
      const rProgress = detail.reward_progress !== undefined ? detail.reward_progress : Math.min(10, detail.reward_visits || 0);
      if (rProgress >= 10) {
        rewEl.innerHTML = '<span class="text-[#D4AF37] font-extrabold animate-pulse">🎉 REWARD AVAILABLE</span>';
      } else {
        rewEl.textContent = `${rProgress} / 10 Visits`;
      }
    }

    const history = Array.isArray(salesHistory) ? salesHistory : [];
    document.getElementById("cust-profile-orders-count").textContent = `${history.length} recorded bills`;

    if (history.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="p-6 text-center text-gray-500 text-xs">
            <i class="fas fa-receipt text-2xl mb-1 block opacity-30"></i>
            No past purchase bills found for this customer.
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = history.map(h => {
        const itemsList = Array.isArray(h.items)
          ? h.items.map(it => `${it.product_name_snapshot || it.name || 'Item'} ×${it.quantity !== undefined ? it.quantity : (it.qty || 1)}`).join(', ')
          : 'Order Items';
        const invoiceNo = h.invoice_number || h.id || 'INV-POS';
        const dateStr = h.sale_date || (h.created_at ? new Date(h.created_at).toISOString().split('T')[0] : '');
        let pMethod = 'CASH';
        if (h.payments && h.payments.length > 0) {
          pMethod = h.payments[0].payment_method;
        } else if (h.payment_method) {
          pMethod = h.payment_method;
        }

        return `
          <tr class="hover:bg-white/5 transition-colors">
            <td class="p-2.5 font-bold text-white font-mono text-[11px]">${invoiceNo}</td>
            <td class="p-2.5 text-gray-400 font-mono text-[11px]">${dateStr}</td>
            <td class="p-2.5 text-gray-200 text-[11px] max-w-xs truncate" title="${itemsList}">${itemsList}</td>
            <td class="p-2.5">
              <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                pMethod === 'CASH' ? 'bg-emerald-500/20 text-emerald-400' :
                pMethod === 'UPI' ? 'bg-blue-500/20 text-blue-400' :
                'bg-purple-500/20 text-purple-400'
              }">${pMethod}</span>
            </td>
            <td class="p-2.5 text-right font-extrabold text-[#D4AF37]">${formatCurrency(h.total || 0)}</td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error("[CustomerProfile Error]", err);
  }

  const rewardBtn = document.getElementById("cust-profile-reward-btn");
  if (rewardBtn) {
    rewardBtn.onclick = function() {
      closeCustomerProfileModal();
      navigateToCustomerReward(customerId);
    };
  }
}

function closeCustomerProfileModal() {
  document.getElementById("customer-profile-modal").classList.add("hidden");
}

function openCustomerAddModal() {
  document.getElementById("cust-edit-id").value = "";
  document.getElementById("cust-name").value = "";
  document.getElementById("cust-phone").value = "";
  document.getElementById("customer-modal-title").textContent = "Add New Customer";
  document.getElementById("cust-submit-btn").innerHTML = '<i class="fas fa-save"></i> Save Customer';
  document.getElementById("customer-modal").classList.remove("hidden");
}

function openCustomerEditModal(customerId) {
  const state = store.getState();
  const cust = state.customers.find(c => c.id === customerId);
  if (!cust) return;

  document.getElementById("cust-edit-id").value = cust.id;
  document.getElementById("cust-name").value = cust.name;
  document.getElementById("cust-phone").value = cust.phone;
  document.getElementById("customer-modal-title").textContent = "Edit Customer — " + cust.name;
  document.getElementById("cust-submit-btn").innerHTML = '<i class="fas fa-check"></i> Update Customer';
  document.getElementById("customer-modal").classList.remove("hidden");
}

function closeCustomerModal() {
  document.getElementById("customer-modal").classList.add("hidden");
}

async function handleCustomerSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById("cust-edit-id").value;
  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();

  if (!name || !phone) return;

  try {
    if (editId) {
      await api.customers.update(editId, { name, phone });
      store.addNotification("Customer Updated", `Updated ${name}`, "success");
    } else {
      await api.customers.create({ name, phone });
      store.addNotification("Customer Added", `Added new customer: ${name}`, "success");
    }
    closeCustomerModal();
    await store.loadMasterData();
    renderView('customers');
  } catch (err) {
    console.error("[Customer Save Error]", err);
    alert(err.message || "Failed to save customer.");
  }
}

async function deleteCustomerRecord(id) {
  const state = store.getState();
  const role = state.currentUser ? state.currentUser.role : null;
  if (role !== 'OWNER') {
    alert('Cashiers do not have permission to delete customers.');
    return;
  }
  const cust = state.customers.find(c => c.id === id);
  if (confirm('Delete customer "' + (cust ? cust.name : id) + '" from the database? This action cannot be undone.')) {
    try {
      await api.customers.delete(id);
      store.addNotification("Customer Deleted", `Removed ${cust ? cust.name : id}`, "warning");
      await store.loadMasterData();
      renderView('customers');
    } catch (err) {
      console.error("[Customer Delete Error]", err);
      alert(err.message || "Failed to delete customer.");
    }
  }
}

function navigateToCustomerReward(customerId) {
  const state = store.getState();
  const cust = state.customers.find(c => c.id === customerId);
  if (cust) {
    rewardSearchQuery = cust.name;
  }
  navigate('rewards');
}


