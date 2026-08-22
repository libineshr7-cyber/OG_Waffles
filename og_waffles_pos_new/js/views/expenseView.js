/* OG Waffles & Fried Chicken - Expense Management View (Authoritative Backend Integration) */

let _expensesList = [];
let _expensesLoaded = false;
let _expensesLoading = false;

async function fetchExpensesBackend() {
  if (_expensesLoading || typeof api === 'undefined' || !api.getToken()) return;
  _expensesLoading = true;
  try {
    const list = await api.expenses.list().catch(err => { console.warn("[Expenses] Fetch error:", err); return []; });
    if (Array.isArray(list)) {
      _expensesList = list.filter(e => !e.is_deleted);
      _expensesLoaded = true;
    }
  } catch (e) {
    console.error("[Expenses] Error:", e);
  } finally {
    _expensesLoading = false;
  }
}

function renderExpenseView() {
  const state = store.getState();
  const currentUser = state.currentUser;
  const isOwner = currentUser && currentUser.role === 'OWNER';

  // Trigger background fetch if not yet loaded
  if (!_expensesLoaded && !_expensesLoading && typeof api !== 'undefined' && api.getToken()) {
    fetchExpensesBackend().then(() => {
      if (typeof currentView !== 'undefined' && currentView === 'expenses') {
        renderCurrentApp();
      }
    });
  }

  const expenses = _expensesList || [];
  const totalExpense = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const categories = ["Rent", "Electricity", "Salary", "Ingredients", "Packaging", "Marketing", "Maintenance", "Fuel", "Transport", "Internet", "Miscellaneous", "Other"];

  return `
    <div class="p-6 space-y-6 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/20 pb-4">
        <div>
          <span class="text-xs text-[#D4AF37] font-semibold tracking-widest uppercase">Financial Outflow Tracker</span>
          <h1 class="font-heading text-2xl font-extrabold text-white">Expense Management</h1>
          <p class="text-xs text-gray-400">All expenses dynamically adjust Net Profit across executive reports.</p>
        </div>

        <div class="flex items-center gap-3">
          <button onclick="refreshExpensesData()" class="btn-outline-dark text-xs py-2 px-3 flex items-center gap-1.5" title="Refresh Expenses">
            <i class="fas fa-sync-alt ${_expensesLoading ? 'fa-spin text-[#D4AF37]' : ''}"></i> Refresh
          </button>
          <button onclick="openExpenseModal()" class="btn-gold-solid text-xs py-2 px-4">
            <i class="fas fa-receipt mr-1"></i> Log New Expense
          </button>
        </div>
      </div>

      <!-- Expense Summary Cards Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="glass-card p-6 space-y-3 border-l-4 border-l-red-500 flex flex-col justify-between">
          <div>
            <span class="text-xs text-gray-400 font-semibold">TOTAL EXPENSES</span>
            <h2 class="text-3xl font-extrabold text-white font-heading mt-1">${formatCurrency(totalExpense)}</h2>
          </div>
          <p class="text-xs text-gray-400">Logged operational outflows across store modules.</p>
        </div>

        <div class="lg:col-span-2 glass-card p-6 flex flex-col items-center justify-center">
          <h4 class="font-heading text-sm font-bold text-white mb-2">Category Expense Breakdown</h4>
          <div class="w-full h-48 flex items-center justify-center relative">
            <canvas id="expense-pie-chart" class="w-full h-full"></canvas>
          </div>
        </div>
      </div>

      <!-- Expenses History Table -->
      <div class="glass-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-black/60 border-b border-gray-800 text-gray-400 uppercase font-semibold text-[10px]">
              <tr>
                <th class="p-3.5">Expense ID</th>
                <th class="p-3.5">Date</th>
                <th class="p-3.5">Category</th>
                <th class="p-3.5">Description</th>
                <th class="p-3.5">Method</th>
                <th class="p-3.5">Amount</th>
                <th class="p-3.5">Notes</th>
                ${isOwner ? `<th class="p-3.5 text-right">Actions</th>` : ''}
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-800/60">
              ${expenses.length === 0 ? `
                <tr>
                  <td colspan="${isOwner ? 8 : 7}" class="p-8 text-center text-gray-500">
                    <i class="fas fa-file-invoice-dollar text-3xl mb-2 block opacity-30"></i>
                    No expenses recorded yet. Log an expense voucher to track business outflows!
                  </td>
                </tr>
              ` : expenses.map(e => `
                <tr class="hover:bg-white/5 transition-colors">
                  <td class="p-3.5 font-bold text-white font-mono text-[11px]">${e.id}</td>
                  <td class="p-3.5 text-gray-400 font-mono">${e.expense_date}</td>
                  <td class="p-3.5"><span class="badge-gold">${e.category}</span></td>
                  <td class="p-3.5 font-semibold text-white">${e.description}</td>
                  <td class="p-3.5 text-gray-400 font-mono">${e.payment_method}</td>
                  <td class="p-3.5 font-extrabold text-red-400">${formatCurrency(e.amount)}</td>
                  <td class="p-3.5 text-gray-400">${e.notes || e.reference_number || '-'}</td>
                  ${isOwner ? `
                    <td class="p-3.5 text-right">
                      <button onclick="handleDeleteExpense('${e.id}', '${e.description}')" class="text-xs text-red-400 hover:text-red-300 transition-colors" title="Delete Expense">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  ` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Log Expense Modal -->
    <div id="expense-modal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 hidden">
      <div class="w-full max-w-lg glass-card p-6 border border-[#D4AF37]/50 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-gray-800 pb-3">
          <h3 class="font-heading font-bold text-base text-white">Log Expense Voucher</h3>
          <button onclick="closeExpenseModal()" class="text-gray-400 hover:text-white"><i class="fas fa-times"></i></button>
        </div>

        <form onsubmit="handleExpenseSubmit(event)" class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Expense Category *</label>
              <select id="exp-category" required class="input-gold py-2 text-xs">
                ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Amount (₹) *</label>
              <input id="exp-amount" type="number" step="0.01" required min="0.01" class="input-gold py-2 text-xs">
            </div>
          </div>

          <div>
            <label class="block text-gray-300 font-semibold mb-1">Expense Description *</label>
            <input id="exp-desc" type="text" required placeholder="Electricity bill, store rent..." class="input-gold py-2 text-xs">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Expense Date</label>
              <input id="exp-date" type="date" class="input-gold py-2 text-xs">
            </div>
            <div>
              <label class="block text-gray-300 font-semibold mb-1">Payment Method</label>
              <select id="exp-method" class="input-gold py-2 text-xs">
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="OTHER">Other / Bank Transfer</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-gray-300 font-semibold mb-1">Reference / Note</label>
            <input id="exp-remarks" type="text" placeholder="Transaction ref / provider details..." class="input-gold py-2 text-xs">
          </div>

          <div class="pt-3 flex justify-end gap-2 border-t border-gray-800">
            <button type="button" onclick="closeExpenseModal()" class="btn-outline-dark text-xs py-2 px-4">Cancel</button>
            <button type="submit" id="exp-submit-btn" class="btn-gold-solid text-xs py-2 px-5">Save Expense</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

async function refreshExpensesData() {
  _expensesLoaded = false;
  await fetchExpensesBackend();
  renderView('expenses');
}

function initExpenseChart() {
  const ctx = document.getElementById('expense-pie-chart');
  if (!ctx) return;

  const expenses = _expensesList || [];
  const catTotals = {};
  expenses.forEach(e => {
    const cat = e.category || 'Other';
    catTotals[cat] = (catTotals[cat] || 0) + (parseFloat(e.amount) || 0);
  });

  const labels = Object.keys(catTotals);
  const data = Object.values(catTotals);

  if (window.expenseChartInstance) {
    window.expenseChartInstance.destroy();
  }

  window.expenseChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels.length > 0 ? labels : ['No Expenses Logged'],
      datasets: [{
        data: data.length > 0 ? data : [1],
        backgroundColor: labels.length > 0 ? ['#D4AF37', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#3B82F6', '#EC4899', '#6366F1'] : ['#374151'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#9CA3AF', font: { size: 10 } } }
      }
    }
  });
}

function openExpenseModal() {
  document.getElementById("expense-modal").classList.remove("hidden");
  document.getElementById("exp-date").value = new Date().toISOString().split("T")[0];
  document.getElementById("exp-amount").value = "";
  document.getElementById("exp-desc").value = "";
  document.getElementById("exp-remarks").value = "";
}

function closeExpenseModal() {
  document.getElementById("expense-modal").classList.add("hidden");
}

async function handleExpenseSubmit(e) {
  e.preventDefault();
  const category = document.getElementById("exp-category").value;
  const amount = parseFloat(document.getElementById("exp-amount").value);
  const description = document.getElementById("exp-desc").value.trim();
  const expense_date = document.getElementById("exp-date").value || new Date().toISOString().split("T")[0];
  const payment_method = document.getElementById("exp-method").value;
  const notes = document.getElementById("exp-remarks").value.trim();

  if (!description || isNaN(amount) || amount <= 0) {
    alert("Please enter a valid description and positive amount.");
    return;
  }

  const submitBtn = document.getElementById("exp-submit-btn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Saving...`;
  }

  const payload = {
    category,
    description,
    amount,
    expense_date,
    payment_method,
    reference_number: "",
    notes
  };

  try {
    await api.expenses.create(payload);
    store.addNotification("Expense Logged", `Recorded expense: ₹${amount} for ${description}`, "success");
    closeExpenseModal();
    await fetchExpensesBackend();
    renderView('expenses');
  } catch (err) {
    console.error("[Expense Submit Error]", err);
    alert(err.message || "Failed to log expense.");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Save Expense`;
    }
  }
}

async function handleDeleteExpense(id, description) {
  if (!confirm(`Are you sure you want to delete expense "${description}"?`)) {
    return;
  }

  try {
    await api.expenses.delete(id);
    store.addNotification("Expense Removed", `Expense removed successfully`, "warning");
    await fetchExpensesBackend();
    renderView('expenses');
  } catch (err) {
    console.error("[Delete Expense Error]", err);
    alert(err.message || "Failed to delete expense.");
  }
}

