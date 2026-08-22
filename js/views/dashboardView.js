/* OG Waffles & Fried Chicken - Live Business Dashboard View (Authoritative Backend Integration) */

let _dashboardMetrics = null;
let _dashboardRecentSales = [];
let _dashboardSalesTrend = [];
let _dashboardLoaded = false;
let _dashboardLoading = false;

async function fetchDashboardBackend() {
  if (_dashboardLoading || typeof api === 'undefined' || !api.getToken()) return;
  _dashboardLoading = true;
  try {
    const [metrics, recentSales, trend] = await Promise.all([
      api.dashboard.get().catch(err => { console.warn("[Dashboard] metrics error:", err); return null; }),
      api.sales.list().catch(err => { console.warn("[Dashboard] recent sales error:", err); return []; }),
      api.reports.salesTrend().catch(err => { console.warn("[Dashboard] sales trend error:", err); return []; })
    ]);

    if (metrics) _dashboardMetrics = metrics;
    if (Array.isArray(recentSales)) _dashboardRecentSales = recentSales.slice(0, 5);
    if (Array.isArray(trend)) _dashboardSalesTrend = trend;
    _dashboardLoaded = true;
  } catch (e) {
    console.error("[Dashboard] Error:", e);
  } finally {
    _dashboardLoading = false;
  }
}

function renderDashboardView() {
  // Trigger background fetch if not yet loaded
  if (!_dashboardLoaded && !_dashboardLoading && typeof api !== 'undefined' && api.getToken()) {
    fetchDashboardBackend().then(() => {
      if (typeof currentView !== 'undefined' && currentView === 'dashboard') {
        renderCurrentApp();
      }
    });
  }

  const m = _dashboardMetrics || {
    today: { sales: 0, bills: 0, expenses: 0, profit: 0 },
    this_month: { sales: 0, bills: 0, expenses: 0, profit: 0 },
    inventory: { total_inventory_value: 0, low_stock_count: 0, out_of_stock_count: 0 },
    customers: { total_active_customers: 0, new_customers_this_month: 0 },
    rewards: { eligible_customers_count: 0 }
  };

  const todayRevenue = m.today.sales || 0;
  const todayProfit = m.today.profit || 0;
  const todaySalesCount = m.today.bills || 0;
  const monthSales = m.this_month.sales || 0;
  const monthProfit = m.this_month.profit || 0;
  const lowStockCount = (m.inventory.low_stock_count || 0) + (m.inventory.out_of_stock_count || 0);

  const recentOrders = _dashboardRecentSales || [];

  return `
    <div class="p-6 space-y-8 animate-fade-in">
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

