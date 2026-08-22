/* OG Waffles & Fried Chicken - Waste Management View */

function renderWasteView() {
  const state = store.getState();
  const wasteLogs = state.wasteLogs || [];
  const ingredients = state.ingredients || [];

  return `
    <div class="p-6 space-y-6 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/20 pb-4">
        <div>
          <span class="text-xs text-[#D4AF37] font-semibold tracking-widest uppercase">Loss Control Engine</span>
          <h1 class="font-heading text-2xl font-extrabold text-white">Waste Management</h1>
          <p class="text-xs text-gray-400">Track expired, burnt, or damaged stock. Logging waste automatically reduces inventory stock.</p>
        </div>

        <button onclick="openWasteModal()" class="btn-gold-solid text-xs py-2 px-4">
          <i class="fas fa-trash-alt"></i> Log Damaged Stock
        </button>
      </div>

      <div class="glass-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-black/60 border-b border-gray-800 text-gray-400 uppercase font-semibold text-[10px]">
              <tr>
                <th class="p-3.5">Log ID</th>
                <th class="p-3.5">Date</th>
                <th class="p-3.5">Ingredient</th>
                <th class="p-3.5">Quantity Wasted</th>
                <th class="p-3.5">Reason</th>
                <th class="p-3.5">Logged By</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-800/60">
              ${wasteLogs.map(w => `
                <tr class="hover:bg-white/5 transition-colors">
                  <td class="p-3.5 font-bold text-white">${w.id}</td>
                  <td class="p-3.5 text-gray-400">${w.date}</td>
                  <td class="p-3.5 font-bold text-[#D4AF37]">${w.ingredientName}</td>
                  <td class="p-3.5 font-bold text-red-400">-${w.qty}</td>
                  <td class="p-3.5"><span class="badge-red">${w.reason}</span></td>
                  <td class="p-3.5 text-gray-300">${w.loggedBy}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Waste Log Modal -->
    <div id="waste-modal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 hidden">
      <div class="w-full max-w-md glass-card p-6 border border-[#D4AF37]/50 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-gray-800 pb-3">
          <h3 class="font-heading font-bold text-base text-white">Log Waste / Damaged Inventory</h3>
          <button onclick="closeWasteModal()" class="text-gray-400 hover:text-white"><i class="fas fa-times"></i></button>
        </div>

        <form onsubmit="handleWasteSubmit(event)" class="space-y-3 text-xs">
          <div>
            <label class="block text-gray-300 font-semibold mb-1">Select Ingredient</label>
            <select id="wst-ing-id" required class="input-gold py-2 text-xs">
              <option value="">-- Choose Ingredient --</option>
              ${ingredients.map(i => `<option value="${i.id}">${i.name} (Current: ${i.currentQty} ${i.unit})</option>`).join('')}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Qty Wasted</label>
              <input id="wst-qty" type="number" step="0.01" required min="0.01" class="input-gold py-2 text-xs">
            </div>
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Reason</label>
              <select id="wst-reason" required class="input-gold py-2 text-xs">
                <option value="Expired">Expired</option>
                <option value="Burnt">Burnt</option>
                <option value="Damaged">Damaged</option>
                <option value="Staff Consumption">Staff Consumption</option>
                <option value="Sample">Sample Tasting</option>
              </select>
            </div>
          </div>

          <div class="pt-3 flex justify-end gap-2 border-t border-gray-800">
            <button type="button" onclick="closeWasteModal()" class="btn-outline-dark text-xs py-2 px-4">Cancel</button>
            <button type="submit" class="btn-gold-solid text-xs py-2 px-5">Deduct Inventory & Log</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function openWasteModal() {
  document.getElementById("waste-modal").classList.remove("hidden");
}

function closeWasteModal() {
  document.getElementById("waste-modal").classList.add("hidden");
}

function handleWasteSubmit(e) {
  e.preventDefault();
  const ingredientId = document.getElementById("wst-ing-id").value;
  const qty = parseFloat(document.getElementById("wst-qty").value);
  const reason = document.getElementById("wst-reason").value;

  const res = store.addWaste({ ingredientId, qty, reason });
  if (res.success) {
    closeWasteModal();
    renderView('waste');
  } else {
    alert(res.message);
  }
}
