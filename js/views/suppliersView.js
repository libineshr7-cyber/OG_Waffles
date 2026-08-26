/* OG Waffles & Fried Chicken - Supplier Management View (INR ₹ Edition) */

function renderSuppliersView() {
  const state = store.getState();
  const suppliers = state.suppliers || [];
  const settings = state.settings;

  return `
    <div class="p-6 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/20 pb-4">
        <div>
          <span class="text-xs text-[#D4AF37] font-semibold tracking-widest uppercase">Vendor Network</span>
          <h1 class="font-heading text-2xl font-extrabold text-white">Supplier Management</h1>
        </div>

        <button onclick="openSupplierModal()" class="btn-gold-solid text-xs py-2 px-4">
          <i class="fas fa-handshake"></i> Add Supplier
        </button>
      </div>

      <div class="glass-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-black/60 border-b border-gray-800 text-gray-400 uppercase font-semibold text-[10px]">
              <tr>
                <th class="p-3.5">Supplier ID</th>
                <th class="p-3.5">Supplier Name</th>
                <th class="p-3.5">Phone</th>
                <th class="p-3.5">Address</th>
                <th class="p-3.5">GST Number</th>
                <th class="p-3.5">Outstanding Balance</th>
                <th class="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-800/60">
              ${suppliers.length === 0 ? `
                <tr>
                  <td colspan="7" class="p-8 text-center text-gray-500">
                    <i class="fas fa-handshake text-3xl mb-2 block opacity-30"></i>
                    No suppliers found. Click "Add Supplier" to create one.
                  </td>
                </tr>
              ` : suppliers.map(s => `
                <tr class="hover:bg-white/5 transition-colors">
                  <td class="p-3.5 font-bold text-white font-mono">${s.id}</td>
                  <td class="p-3.5 font-bold text-[#D4AF37]">${s.name}</td>
                  <td class="p-3.5 text-gray-300 font-mono">${s.phone || 'N/A'}</td>
                  <td class="p-3.5 text-gray-400">${s.address || 'N/A'}</td>
                  <td class="p-3.5 text-gray-400 font-mono">${s.gst_no || s.gstNo || 'N/A'}</td>
                  <td class="p-3.5 font-bold ${parseFloat(s.balance || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}">
                    ${formatCurrency(parseFloat(s.balance || 0))}
                  </td>
                  <td class="p-3.5 text-right space-x-2">
                    <button onclick="openSupplierModal('${s.id}')" class="text-xs text-[#D4AF37] hover:underline" title="Edit Supplier">
                      <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="deleteSupplierRecord('${s.id}')" class="text-xs text-red-400 hover:underline" title="Delete Supplier">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Supplier Modal -->
    <div id="supplier-modal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 hidden">
      <div class="w-full max-w-md glass-card p-6 border border-[#D4AF37]/50 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-gray-800 pb-3">
          <h3 id="sup-modal-title" class="font-heading font-bold text-base text-white">Add New Vendor Supplier</h3>
          <button onclick="closeSupplierModal()" class="text-gray-400 hover:text-white"><i class="fas fa-times"></i></button>
        </div>

        <form onsubmit="handleSupplierSubmit(event)" class="space-y-3 text-xs">
          <input type="hidden" id="sup-id">

          <div>
            <label class="block text-gray-300 font-semibold mb-1">Supplier / Company Name *</label>
            <input id="sup-name" type="text" required class="input-gold py-2 text-xs">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Phone Number</label>
              <input id="sup-phone" type="tel" class="input-gold py-2 text-xs">
            </div>
            <div>
              <label class="block text-gray-300 font-semibold mb-1">GST Number</label>
              <input id="sup-gst" type="text" placeholder="GST12345" class="input-gold py-2 text-xs font-mono">
            </div>
          </div>

          <div>
            <label class="block text-gray-300 font-semibold mb-1">Address</label>
            <input id="sup-address" type="text" class="input-gold py-2 text-xs">
          </div>

          <div class="pt-3 flex justify-end gap-2 border-t border-gray-800">
            <button type="button" onclick="closeSupplierModal()" class="btn-outline-dark text-xs py-2 px-4">Cancel</button>
            <button type="submit" class="btn-gold-solid text-xs py-2 px-5">Save Supplier</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function openSupplierModal(id = null) {
  const modal = document.getElementById("supplier-modal");
  const title = document.getElementById("sup-modal-title");

  if (id) {
    const s = (store.getState().suppliers || []).find(sup => sup.id === id);
    if (s) {
      if (title) title.innerText = "Edit Supplier — " + s.name;
      document.getElementById("sup-id").value = s.id;
      document.getElementById("sup-name").value = s.name;
      document.getElementById("sup-phone").value = s.phone || "";
      document.getElementById("sup-gst").value = s.gst_no || s.gstNo || "";
      document.getElementById("sup-address").value = s.address || "";
    }
  } else {
    if (title) title.innerText = "Add New Vendor Supplier";
    document.getElementById("sup-id").value = "";
    document.getElementById("sup-name").value = "";
    document.getElementById("sup-phone").value = "";
    document.getElementById("sup-gst").value = "";
    document.getElementById("sup-address").value = "";
  }
  modal.classList.remove("hidden");
}

function closeSupplierModal() {
  document.getElementById("supplier-modal").classList.add("hidden");
}

async function handleSupplierSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("sup-id").value;
  const name = document.getElementById("sup-name").value.trim();
  const phone = document.getElementById("sup-phone").value.trim();
  const gstNo = document.getElementById("sup-gst").value.trim();
  const address = document.getElementById("sup-address").value.trim();

  if (!name) {
    alert("Please enter Supplier Name.");
    return;
  }

  const payload = {
    name,
    phone,
    address,
    gst_no: gstNo,
    active: true
  };

  try {
    if (id) {
      await api.suppliers.update(id, payload);
      store.addNotification("Supplier Updated", `"${name}" updated successfully`, "success");
    } else {
      await api.suppliers.create(payload);
      store.addNotification("Supplier Created", `"${name}" added to suppliers`, "success");
    }
    closeSupplierModal();
    await store.loadMasterData();
    renderView('suppliers');
  } catch (err) {
    console.error("[SuppliersView] Save Error:", err);
    alert(err.message || "Failed to save supplier.");
  }
}

async function deleteSupplierRecord(id) {
  const role = store.getState().currentUser ? store.getState().currentUser.role : null;
  if (role !== 'OWNER') {
    alert("Only the Owner has permission to delete suppliers.");
    return;
  }
  if (confirm("Are you sure you want to delete this supplier?")) {
    try {
      await api.suppliers.delete(id);
      store.addNotification("Supplier Deleted", "Supplier removed from records", "warning");
      await store.loadMasterData();
      renderView('suppliers');
    } catch (err) {
      console.error("[SuppliersView] Delete Error:", err);
      alert(err.message || "Failed to delete supplier.");
    }
  }
}

