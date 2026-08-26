/* OG Waffles & Fried Chicken - Today's Operational Sales Summary View (Authoritative Backend Integration) */

let _todaySalesSummary = null;
let _todaySalesList = [];
let _todaySalesLoaded = false;
let _todaySalesLoading = false;

async function fetchTodaySalesBackend() {
  if (_todaySalesLoading || typeof api === 'undefined' || !api.getToken()) return;
  _todaySalesLoading = true;
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const [summary, list] = await Promise.all([
      api.sales.today().catch(err => { console.warn("[TodaySales] Summary fetch error:", err); return null; }),
      api.sales.list({ date_from: todayStr, date_to: todayStr }).catch(err => { console.warn("[TodaySales] List fetch error:", err); return []; })
    ]);

    if (summary) _todaySalesSummary = summary;
    if (Array.isArray(list)) _todaySalesList = list;
    _todaySalesLoaded = true;
  } catch (e) {
    console.error("[TodaySales] Backend fetch failed:", e);
  } finally {
    _todaySalesLoading = false;
  }
}

function renderTodaySalesView() {
  const state = store.getState();
  const currentUser = state.currentUser;
  const isOwner = currentUser && currentUser.role === 'OWNER';
  const todayStr = new Date().toISOString().split('T')[0];

  // Trigger background fetch if not yet loaded
  if (!_todaySalesLoaded && !_todaySalesLoading && typeof api !== 'undefined' && api.getToken()) {
    fetchTodaySalesBackend().then(() => {
      if (typeof currentView !== 'undefined' && currentView === 'today-sales') {
        renderCurrentApp();
      }
    });
  }

  const summary = _todaySalesSummary || {
    number_of_bills: 0,
    gross_sales: 0,
    discount_total: 0,
    tax_total: 0,
    net_sales: 0,
    cash_total: 0,
    upi_total: 0,
    card_total: 0
  };

  const totalSales = summary.net_sales || 0;
  const totalOrdersCount = summary.number_of_bills || 0;
  const cashSales = summary.cash_total || 0;
  const upiSales = summary.upi_total || 0;
  const cardSales = summary.card_total || 0;

  const todayTransactions = _todaySalesList || [];

  const formattedToday = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return `
    <div class="p-6 space-y-6 animate-fade-in max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/20 pb-4">
        <div>
          <span class="text-xs text-[#D4AF37] font-semibold tracking-widest uppercase">Live Operational Counter</span>
          <h1 class="font-heading text-2xl font-extrabold text-white">Today's Sales Summary</h1>
          <p class="text-xs text-gray-400 mt-0.5"><i class="fas fa-calendar-day text-[#D4AF37] mr-1"></i> Business Date: <span class="text-white font-semibold">${formattedToday}</span></p>
        </div>

        <div class="flex items-center gap-3">
          <button onclick="refreshTodaySalesData()" class="btn-outline-dark text-xs py-2 px-3 flex items-center gap-1.5" title="Refresh Sales">
            <i class="fas fa-sync-alt ${_todaySalesLoading ? 'fa-spin text-[#D4AF37]' : ''}"></i> Refresh
          </button>
          <button onclick="navigate('pos')" class="btn-gold-solid text-xs py-2 px-4 whitespace-nowrap">
            <i class="fas fa-cash-register mr-1"></i> Open POS Billing
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Card 1: Today's Revenue -->
        <div class="glass-card p-5 border border-[#D4AF37]/40 space-y-2 relative overflow-hidden bg-gradient-to-br from-[#D4AF37]/15 to-transparent">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400 font-semibold uppercase tracking-wider">Today's Sales</span>
            <div class="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
              <i class="fas fa-rupee-sign text-sm"></i>
            </div>
          </div>
          <div class="font-heading text-2xl font-black text-gold-gradient">${formatCurrency(totalSales)}</div>
          <p class="text-[11px] text-gray-400">Total net revenue collected today</p>
        </div>

        <!-- Card 2: Total Orders -->
        <div class="glass-card p-5 border border-gray-800 space-y-2 relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400 font-semibold uppercase tracking-wider">Today's Orders</span>
            <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <i class="fas fa-receipt text-sm"></i>
            </div>
          </div>
          <div class="font-heading text-2xl font-black text-white">${totalOrdersCount} <span class="text-xs font-normal text-gray-400">bills</span></div>
          <p class="text-[11px] text-gray-400">Completed sales transactions</p>
        </div>

        <!-- Card 3: Cash Breakdown -->
        <div class="glass-card p-5 border border-gray-800 space-y-2 relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400 font-semibold uppercase tracking-wider">Today's Cash Sales</span>
            <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <i class="fas fa-money-bill-wave text-sm"></i>
            </div>
          </div>
          <div class="font-heading text-2xl font-black text-emerald-400">${formatCurrency(cashSales)}</div>
          <p class="text-[11px] text-gray-400">Cash in register</p>
        </div>

        <!-- Card 4: Digital (UPI + Card) -->
        <div class="glass-card p-5 border border-gray-800 space-y-2 relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400 font-semibold uppercase tracking-wider">UPI &amp; Card Sales</span>
            <div class="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
              <i class="fas fa-mobile-alt text-sm"></i>
            </div>
          </div>
          <div class="font-heading text-2xl font-black text-purple-300">${formatCurrency(upiSales + cardSales)}</div>
          <p class="text-[11px] text-gray-400">UPI: ${formatCurrency(upiSales)} &bull; Card: ${formatCurrency(cardSales)}</p>
        </div>
      </div>

      <!-- Payment Method Split Pill Breakdown -->
      <div class="glass-card p-4 flex flex-wrap gap-4 items-center justify-between border border-[#D4AF37]/20 text-xs">
        <div class="flex items-center gap-2">
          <i class="fas fa-chart-pie text-[#D4AF37]"></i>
          <span class="font-bold text-white">Payment Method Distribution:</span>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <span class="px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-medium">
            <i class="fas fa-money-bill-wave mr-1"></i> Cash: <strong class="text-white">${formatCurrency(cashSales)}</strong>
          </span>
          <span class="px-3 py-1 rounded-lg bg-blue-950/40 border border-blue-500/40 text-blue-300 font-medium">
            <i class="fas fa-qrcode mr-1"></i> UPI: <strong class="text-white">${formatCurrency(upiSales)}</strong>
          </span>
          <span class="px-3 py-1 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 font-medium">
            <i class="fas fa-credit-card mr-1"></i> Card: <strong class="text-white">${formatCurrency(cardSales)}</strong>
          </span>
        </div>
      </div>

      <!-- Today's Transaction Log Table -->
      <div class="glass-card overflow-hidden">
        <div class="p-4 border-b border-gray-800 flex items-center justify-between">
          <h3 class="font-heading font-bold text-sm text-white flex items-center gap-2">
            <i class="fas fa-list text-[#D4AF37]"></i> Today's Invoices (${todayTransactions.length})
          </h3>
          <span class="text-[11px] text-gray-400">Authoritative backend records for (${todayStr})</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-black/60 border-b border-gray-800 text-gray-400 uppercase font-semibold text-[10px]">
              <tr>
                <th class="p-3.5">Invoice #</th>
                <th class="p-3.5">Time</th>
                <th class="p-3.5">Customer</th>
                <th class="p-3.5">Items Ordered</th>
                <th class="p-3.5">Payment</th>
                <th class="p-3.5">Status</th>
                <th class="p-3.5 text-right">Bill Total</th>
                ${isOwner ? `<th class="p-3.5 text-right">Actions</th>` : ''}
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-800/60">
              ${todayTransactions.length === 0 ? `
                <tr>
                  <td colspan="${isOwner ? 8 : 7}" class="p-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-3xl mb-2 block opacity-30"></i>
                    No sales recorded yet today. Complete orders in POS Billing to view real-time sales here!
                  </td>
                </tr>
              ` : todayTransactions.map(o => {
                const invoiceNo = o.invoice_number || o.id;
                let timeStr = 'N/A';
                if (o.created_at) {
                  try { timeStr = new Date(o.created_at).toTimeString().split(' ')[0].substring(0, 5); } catch(e) {}
                }
                const cust = (store.getState().customers || []).find(c => c.id === o.customer_id);
                const custName = cust ? cust.name : (o.customer_id ? o.customer_id : 'Walk-in Guest');
                const itemsSummary = (o.items || []).map(it => `${it.product_name_snapshot || it.name || 'Item'} ×${it.quantity !== undefined ? it.quantity : (it.qty || 1)}`).join(', ');
                
                let pMethod = 'CASH';
                if (o.payments && o.payments.length > 0) {
                  pMethod = o.payments[0].payment_method;
                } else if (o.payment_method) {
                  pMethod = o.payment_method;
                }

                const isCancelled = o.sale_status === 'CANCELLED';

                return `
                  <tr class="hover:bg-white/5 transition-colors ${isCancelled ? 'opacity-50 line-through' : ''}">
                    <td class="p-3.5 font-bold text-white font-mono text-[11px]">${invoiceNo}</td>
                    <td class="p-3.5 text-gray-400 font-mono">${timeStr}</td>
                    <td class="p-3.5 font-semibold text-gray-200">${custName}</td>
                    <td class="p-3.5 text-gray-300 max-w-xs truncate">${itemsSummary || 'N/A'}</td>
                    <td class="p-3.5">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        pMethod === 'CASH' ? 'bg-emerald-500/20 text-emerald-400' :
                        pMethod === 'UPI' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-purple-500/20 text-purple-400'
                      }">${pMethod}</span>
                    </td>
                    <td class="p-3.5">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isCancelled ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                      }">${o.sale_status}</span>
                    </td>
                    <td class="p-3.5 text-right font-extrabold ${isCancelled ? 'text-gray-500' : 'text-[#D4AF37]'}">${formatCurrency(o.total || 0)}</td>
                    ${isOwner ? `
                      <td class="p-3.5 text-right">
                        ${!isCancelled ? `
                          <button onclick="handleCancelSale('${o.id}', '${invoiceNo}')" class="text-xs text-red-400 hover:text-red-300 transition-colors" title="Cancel Sale (Restores Inventory)">
                            <i class="fas fa-ban"></i> Cancel
                          </button>
                        ` : '<span class="text-[10px] text-gray-500">Cancelled</span>'}
                      </td>
                    ` : ''}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

async function refreshTodaySalesData() {
  _todaySalesLoaded = false;
  await fetchTodaySalesBackend();
  renderView('today-sales');
}

async function handleCancelSale(saleId, invoiceNo) {
  const role = store.getState().currentUser ? store.getState().currentUser.role : null;
  if (role !== 'OWNER') {
    alert("Only the Owner has permission to cancel sales.");
    return;
  }

  if (!confirm(`Are you sure you want to cancel Sale #${invoiceNo}?\n\nThis will mark the sale as CANCELLED, refund the payment record, and automatically restore inventory stock.`)) {
    return;
  }

  try {
    await api.sales.cancel(saleId);
    store.addNotification("Sale Cancelled", `Sale #${invoiceNo} has been cancelled and stock restored.`, "warning");
    // Refresh Today's Sales and Master Data
    await Promise.all([
      fetchTodaySalesBackend(),
      store.loadMasterData()
    ]);
    renderView('today-sales');
  } catch (err) {
    console.error("[Cancel Sale Error]", err);
    alert(err.message || "Failed to cancel sale.");
  }
}

