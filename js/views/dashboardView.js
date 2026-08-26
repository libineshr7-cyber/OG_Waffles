/* OG Waffles & Fried Chicken - Live Business Dashboard View (Authoritative Backend & Local Reactive Engine) */

let _dashboardMetrics = null;
let _dashboardRecentSales = [];
let _dashboardSalesTrend = [];
let _dashboardLoaded = false;
let _dashboardLoading = false;

function calculateLocalDashboardData() {
  const state = store.getState();
  const todayStr = new Date().toISOString().split("T")[0];
  const thisMonthStr = todayStr.substring(0, 7);

  const orders = state.orders || [];
  const expenses = state.expenses || [];
  const ingredients = state.ingredients || [];
  const customers = state.customers || [];

  // Today's orders
  const todayOrders = orders.filter(o => (o.date || o.created_at || '').startsWith(todayStr));
  let todaySales = 0;
  let todayCash = 0;
  let todayUpi = 0;
  let todayCard = 0;
  let todaySplit = 0;

  todayOrders.forEach(o => {
    const total = parseFloat(o.total) || parseFloat(o.grandTotal) || 0;
    todaySales += total;
    const pm = (o.paymentMethod || o.payment_method || 'CASH').toUpperCase();
    if (pm.includes('CASH')) todayCash += total;
    else if (pm.includes('UPI') || pm.includes('GPAY') || pm.includes('PHONEPE')) todayUpi += total;
    else if (pm.includes('CARD')) todayCard += total;
    else todaySplit += total;
  });

  const todayExpenses = expenses
    .filter(e => (e.date || '').startsWith(todayStr))
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const todayProfit = todaySales - todayExpenses - (todaySales * 0.35);

  // Month's orders
  const monthOrders = orders.filter(o => (o.date || o.created_at || '').startsWith(thisMonthStr));
  const monthSales = monthOrders.reduce((sum, o) => sum + (parseFloat(o.total) || parseFloat(o.grandTotal) || 0), 0);
  const monthExpenses = expenses
    .filter(e => (e.date || '').startsWith(thisMonthStr))
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const monthProfit = monthSales - monthExpenses - (monthSales * 0.35);

  // Inventory
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let totalInventoryValue = 0;

  ingredients.forEach(i => {
    const qty = parseFloat(i.currentQty) || 0;
    const min = parseFloat(i.minLimit) || 5;
    const cost = parseFloat(i.avgCost) || parseFloat(i.cost) || 0;
    totalInventoryValue += qty * cost;
    if (qty <= 0) outOfStockCount++;
    else if (qty <= min) lowStockCount++;
  });

  const eligibleRewards = customers.filter(c => (c.stampCount || 0) >= 5 || (c.rewardProgress || 0) >= 5).length;
  const recentSales = orders.slice(0, 5);

  // 7-day trend
  const trendMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dStr = d.toISOString().split("T")[0];
    trendMap[dStr] = 0;
  }
  orders.forEach(o => {
    const dStr = (o.date || o.created_at || '').split("T")[0];
    if (trendMap[dStr] !== undefined) {
      trendMap[dStr] += (parseFloat(o.total) || parseFloat(o.grandTotal) || 0);
    }
  });

  const salesTrend = Object.keys(trendMap).map(d => ({
    trend_date: d,
    net_sales: trendMap[d]
  }));

  return {
    metrics: {
      today: {
        sales: todaySales,
        bills: todayOrders.length,
        expenses: todayExpenses,
        profit: todayProfit,
        cash_total: todayCash,
        upi_total: todayUpi,
        card_total: todayCard,
        split_total: todaySplit
      },
      this_month: {
        sales: monthSales,
        bills: monthOrders.length,
        expenses: monthExpenses,
        profit: monthProfit
      },
      inventory: {
        total_inventory_value: totalInventoryValue,
        low_stock_count: lowStockCount,
        out_of_stock_count: outOfStockCount
      },
      customers: {
        total_active_customers: customers.length,
        new_customers_this_month: customers.filter(c => (c.createdAt || c.created_at || '').startsWith(thisMonthStr)).length
      },
      rewards: {
        eligible_customers_count: eligibleRewards
      }
    },
    recentSales,
    salesTrend
  };
}

async function fetchDashboardBackend() {
  if (_dashboardLoading || typeof api === 'undefined' || !api.getToken()) return;
  _dashboardLoading = true;
  try {
    const [metrics, recentSales, trend] = await Promise.all([
      api.dashboard.get().catch(err => { console.warn("[Dashboard] metrics notice:", err.message); return null; }),
      api.sales.list().catch(err => { console.warn("[Dashboard] recent sales notice:", err.message); return []; }),
      api.reports.salesTrend().catch(err => { console.warn("[Dashboard] sales trend notice:", err.message); return []; })
    ]);

    if (metrics) _dashboardMetrics = metrics;
    if (Array.isArray(recentSales) && recentSales.length > 0) _dashboardRecentSales = recentSales.slice(0, 5);
    if (Array.isArray(trend) && trend.length > 0) _dashboardSalesTrend = trend;
  } catch (e) {
    console.warn("[Dashboard] Using local reactive state:", e.message);
  } finally {
    _dashboardLoaded = true;
    _dashboardLoading = false;
  }
}

function renderDashboardView() {
  const localData = calculateLocalDashboardData();

  // Background fetch without causing infinite loops
  if (!_dashboardLoaded && !_dashboardLoading && typeof api !== 'undefined' && api.getToken()) {
    fetchDashboardBackend();
  }

  const m = _dashboardMetrics || localData.metrics;
  const recentOrders = (_dashboardRecentSales && _dashboardRecentSales.length > 0) ? _dashboardRecentSales : localData.recentSales;
  if (!_dashboardSalesTrend || _dashboardSalesTrend.length === 0) {
    _dashboardSalesTrend = localData.salesTrend;
  }

  const todayRevenue = m.today.sales || 0;
  const todayProfit = m.today.profit || 0;
  const todaySalesCount = m.today.bills || 0;
  const todayCash = m.today.cash_total || 0;
  const todayUpi = m.today.upi_total || 0;
  const todayCard = m.today.card_total || 0;
  const todaySplit = m.today.split_total || 0;
  const monthSales = m.this_month.sales || 0;
  const monthProfit = m.this_month.profit || 0;
  const lowStockCount = (m.inventory.low_stock_count || 0) + (m.inventory.out_of_stock_count || 0);

  return `
    <div class="p-6 space-y-8">
      <!-- Top Title & Quick Actions Toolbar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D4AF37]/20 pb-4">
        <div>
          <span class="text-xs text-[#D4AF37] font-semibold tracking-widest uppercase">Live Executive Control Center</span>
          <h1 class="font-heading text-2xl sm:text-3xl font-extrabold text-white">Business Dashboard</h1>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button onclick="refreshDashboardData()" class="btn-outline-dark text-xs py-2 px-3 flex items-center gap-1.5" title="Refresh Dashboard">
            <i class="fas fa-sync-alt ${_dashboardLoading ? 'fa-spin text-[#D4AF37]' : ''}"></i> Refresh
          </button>
          <button onclick="navigate('pos')" class="btn-gold-solid text-xs py-2 px-4">
            <i class="fas fa-plus-circle"></i> Create Bill (POS)
          </button>
          <button onclick="navigate('inventory')" class="btn-gold text-xs py-2 px-3">
            <i class="fas fa-boxes"></i> Inventory
          </button>
          <button onclick="navigate('purchases')" class="btn-gold text-xs py-2 px-3">
            <i class="fas fa-truck-loading"></i> Purchase
          </button>
          <button onclick="navigate('reports')" class="btn-gold text-xs py-2 px-3">
            <i class="fas fa-chart-bar"></i> Reports
          </button>
        </div>
      </div>

      <!-- Low Stock Warning Alert Banner -->
      ${lowStockCount > 0 ? `
        <div class="p-4 rounded-xl bg-red-950/40 border border-red-500/50 flex items-center justify-between animate-pulse">
          <div class="flex items-center gap-3 text-red-300 text-xs">
            <i class="fas fa-exclamation-triangle text-xl text-red-500"></i>
            <div>
              <span class="font-bold text-white text-sm">LOW STOCK ALERT!</span>
              <p>There are ${lowStockCount} ingredient(s) running low or out of stock. Restock immediately to prevent menu downtime.</p>
            </div>
          </div>
          <button onclick="navigate('inventory')" class="btn-gold text-xs py-1.5 px-3 bg-red-900 border-red-500 text-white">
            View Low Stock
          </button>
        </div>
      ` : ''}

      <!-- Top KPI Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <!-- Today's Revenue -->
        <div class="glass-card p-5 space-y-2 border-l-4 border-l-[#D4AF37]">
          <div class="flex items-center justify-between text-xs text-gray-400">
            <span>TODAY'S REVENUE</span>
            <span class="text-[#D4AF37] font-bold text-base">₹</span>
          </div>
          <div class="text-2xl font-extrabold text-white font-heading">${formatCurrency(todayRevenue)}</div>
          <div class="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
            <i class="fas fa-arrow-up"></i> Live POS Transactions Today
          </div>
        </div>

        <!-- Today's Profit -->
        <div class="glass-card p-5 space-y-2 border-l-4 border-l-emerald-500">
          <div class="flex items-center justify-between text-xs text-gray-400">
            <span>TODAY'S NET PROFIT</span>
            <span class="text-emerald-400 font-bold text-base">₹</span>
          </div>
          <div class="text-2xl font-extrabold text-emerald-400 font-heading">${formatCurrency(todayProfit)}</div>
          <div class="text-[10px] text-gray-400">Net after expenses: ₹${formatCurrency(m.today.expenses || 0)}</div>
        </div>

        <!-- Today's Orders -->
        <div class="glass-card p-5 space-y-2 border-l-4 border-l-amber-500">
          <div class="flex items-center justify-between text-xs text-gray-400">
            <span>TODAY'S ORDERS</span>
            <i class="fas fa-shopping-bag text-amber-400 text-base"></i>
          </div>
          <div class="text-2xl font-extrabold text-white font-heading">${todaySalesCount}</div>
          <div class="text-[10px] text-gray-400">Completed POS Bills</div>
        </div>

        <!-- This Month's Sales -->
        <div class="glass-card p-5 space-y-2 border-l-4 border-l-purple-500">
          <div class="flex items-center justify-between text-xs text-gray-400">
            <span>THIS MONTH REVENUE</span>
            <i class="fas fa-calendar-alt text-purple-400 text-base"></i>
          </div>
          <div class="text-2xl font-extrabold text-purple-300 font-heading">${formatCurrency(monthSales)}</div>
          <div class="text-[10px] text-gray-400">Month Net Profit: ${formatCurrency(monthProfit)}</div>
        </div>
      </div>

      <!-- Live Payment Method Distribution Widget -->
      <div class="glass-card p-4 flex flex-wrap gap-4 items-center justify-between border border-[#D4AF37]/30 text-xs shadow-lg bg-gradient-to-r from-black/80 via-gray-900/60 to-black/80">
        <div class="flex items-center gap-2">
          <i class="fas fa-chart-pie text-[#D4AF37] text-sm"></i>
          <div>
            <span class="font-bold text-white block">Today's Payment Method Distribution</span>
            <span class="text-[10px] text-gray-400">Real-time collections by tender mode</span>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <span class="px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 font-medium flex items-center gap-1.5">
            <i class="fas fa-money-bill-wave text-emerald-400"></i> Cash: <strong class="text-white font-mono">${formatCurrency(todayCash)}</strong>
          </span>
          <span class="px-3 py-1.5 rounded-lg bg-blue-950/50 border border-blue-500/40 text-blue-300 font-medium flex items-center gap-1.5">
            <i class="fas fa-qrcode text-blue-400"></i> UPI: <strong class="text-white font-mono">${formatCurrency(todayUpi)}</strong>
          </span>
          <span class="px-3 py-1.5 rounded-lg bg-amber-950/50 border border-amber-500/40 text-amber-300 font-medium flex items-center gap-1.5">
            <i class="fas fa-credit-card text-amber-400"></i> Card: <strong class="text-white font-mono">${formatCurrency(todayCard)}</strong>
          </span>
          <span class="px-3 py-1.5 rounded-lg bg-indigo-950/50 border border-indigo-500/40 text-indigo-300 font-medium flex items-center gap-1.5">
            <i class="fas fa-columns text-indigo-400"></i> Split: <strong class="text-white font-mono">${formatCurrency(todaySplit)}</strong>
          </span>
        </div>
      </div>

      <!-- Secondary Metrics Bar -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div class="glass-panel p-4 rounded-xl flex items-center justify-between">
          <div>
            <span class="text-gray-400 text-[10px]">TOTAL CUSTOMERS</span>
            <span class="block text-lg font-bold text-white">${m.customers.total_active_customers}</span>
          </div>
          <i class="fas fa-users text-gray-500 text-xl"></i>
        </div>

        <div class="glass-panel p-4 rounded-xl flex items-center justify-between">
          <div>
            <span class="text-gray-400 text-[10px]">NEW THIS MONTH</span>
            <span class="block text-lg font-bold text-emerald-400">+${m.customers.new_customers_this_month}</span>
          </div>
          <i class="fas fa-user-plus text-emerald-400/60 text-xl"></i>
        </div>

        <div class="glass-panel p-4 rounded-xl flex items-center justify-between">
          <div>
            <span class="text-gray-400 text-[10px]">INVENTORY VALUE</span>
            <span class="block text-sm font-bold text-[#D4AF37]">${formatCurrency(m.inventory.total_inventory_value || 0)}</span>
          </div>
          <i class="fas fa-warehouse text-[#D4AF37]/60 text-xl"></i>
        </div>

        <div class="glass-panel p-4 rounded-xl flex items-center justify-between">
          <div>
            <span class="text-gray-400 text-[10px]">ELIGIBLE REWARDS</span>
            <span class="block text-lg font-bold text-amber-300">${m.rewards.eligible_customers_count || 0}</span>
          </div>
          <i class="fas fa-gift text-amber-400 text-xl"></i>
        </div>
      </div>

      <!-- Charts & Recent Stream Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Sales Trend Chart (2 Cols) -->
        <div class="lg:col-span-2 glass-card p-6 space-y-4">
          <div class="flex items-center justify-between border-b border-gray-800 pb-3">
            <div>
              <h3 class="font-heading font-bold text-base text-white">Daily Revenue Trend</h3>
              <p class="text-xs text-gray-400">Authoritative POS Sales Performance (in ₹)</p>
            </div>
            <span class="badge-gold">Live Backend Data</span>
          </div>

          <div class="h-64 flex items-center justify-center relative">
            <canvas id="dashboard-sales-chart" class="w-full h-full"></canvas>
          </div>
        </div>

        <!-- Recent Live Orders Feed (1 Col) -->
        <div class="glass-card p-6 space-y-4 flex flex-col justify-between">
          <div class="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 class="font-heading font-bold text-base text-white">Recent Completed Orders</h3>
            <button onclick="navigate('today-sales')" class="text-xs text-[#D4AF37] hover:underline">View All</button>
          </div>

          <div class="space-y-3 overflow-y-auto max-h-72 text-xs">
            ${recentOrders.length === 0 ? `
              <div class="p-4 text-center text-gray-500 text-xs">No orders recorded yet.</div>
            ` : recentOrders.map(o => {
              const invNo = o.invoice_number || o.id;
              const dateStr = o.sale_date || '';
              let pMethod = 'CASH';
              if (o.payments && o.payments.length > 0) pMethod = o.payments[0].payment_method;
              return `
                <div class="p-3 rounded-xl bg-black/60 border border-gray-800 flex items-center justify-between hover:border-[#D4AF37]/40 transition-all">
                  <div>
                    <span class="font-bold text-white font-mono text-[11px] block">${invNo}</span>
                    <span class="text-[10px] text-gray-400">${dateStr}</span>
                  </div>
                  <div class="text-right">
                    <span class="font-bold text-[#D4AF37] block">${formatCurrency(o.total || 0)}</span>
                    <span class="badge-green text-[9px] py-0 px-1.5">${pMethod}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <button onclick="navigate('pos')" class="w-full btn-gold text-xs py-2 mt-2">
            <i class="fas fa-cash-register"></i> Open POS Billing Screen
          </button>
        </div>
      </div>
    </div>
  `;
}

async function refreshDashboardData() {
  _dashboardLoaded = false;
  await fetchDashboardBackend();
  renderView('dashboard');
}

// Chart Initializer Hook
function initDashboardCharts() {
  const ctx = document.getElementById('dashboard-sales-chart');
  if (!ctx) return;

  const trend = _dashboardSalesTrend || [];
  const labels = trend.map(t => t.trend_date || t.date || 'Day');
  const data = trend.map(t => parseFloat(t.net_sales || t.sales || 0));

  if (window.dashboardChartInstance) {
    window.dashboardChartInstance.destroy();
  }

  window.dashboardChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length > 0 ? labels : ['No Data'],
      datasets: [{
        label: 'Revenue (₹)',
        data: data.length > 0 ? data : [0],
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#F3E5AB',
        pointBorderColor: '#D4AF37',
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } }
      }
    }
  });
}

