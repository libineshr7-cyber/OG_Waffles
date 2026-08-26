/* OG Waffles & Fried Chicken - Analytics & Reports View (Authoritative Backend Integration) */

let activeReportTab = "Daily";
let _reportProfitData = null;
let _reportSalesData = null;
let _reportTopProducts = [];
let _reportSalesTrend = [];
let _reportsLoaded = false;
let _reportsLoading = false;

function getDateRangeForTab(tab) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  if (tab === "Daily") {
    return { date_from: todayStr, date_to: todayStr };
  } else if (tab === "Weekly") {
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { date_from: weekAgo.toISOString().split("T")[0], date_to: todayStr };
  } else if (tab === "Monthly") {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return { date_from: monthStart.toISOString().split("T")[0], date_to: todayStr };
  } else if (tab === "Yearly") {
    const yearStart = new Date(today.getFullYear(), 0, 1);
    return { date_from: yearStart.toISOString().split("T")[0], date_to: todayStr };
  }
  return { date_from: todayStr, date_to: todayStr };
}

function calculateLocalReportsData(tab = "Daily") {
  const state = store.getState();
  const range = getDateRangeForTab(tab);
  const orders = (state.orders || []).filter(o => {
    const d = (o.date || o.created_at || '').split("T")[0];
    return d >= range.date_from && d <= range.date_to;
  });
  const expenses = (state.expenses || []).filter(e => {
    const d = (e.date || '').split("T")[0];
    return d >= range.date_from && d <= range.date_to;
  });

  let netSales = 0;
  const prodMap = {};

  orders.forEach(o => {
    const tot = parseFloat(o.total) || parseFloat(o.grandTotal) || 0;
    netSales += tot;
    (o.items || []).forEach(item => {
      const name = item.name || 'Item';
      const qty = parseInt(item.qty || item.quantity) || 1;
      prodMap[name] = (prodMap[name] || 0) + qty;
    });
  });

  const totalExp = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const cogs = netSales * 0.35;
  const grossProfit = netSales - cogs;
  const netProfit = grossProfit - totalExp;
  const margin = netSales > 0 ? (netProfit / netSales) * 100 : 0;

  const topProds = Object.keys(prodMap)
    .map(name => ({ product_name: name, quantity_sold: prodMap[name] }))
    .sort((a, b) => b.quantity_sold - a.quantity_sold)
    .slice(0, 5);

  return {
    profit: {
      net_sales: netSales,
      cost_of_goods_sold: cogs,
      gross_profit: grossProfit,
      expenses: totalExp,
      net_profit: netProfit,
      profit_margin_percentage: margin
    },
    topProds
  };
}

async function fetchReportsBackend(tab = activeReportTab) {
  if (_reportsLoading || typeof api === 'undefined' || !api.getToken()) return;
  _reportsLoading = true;
  const range = getDateRangeForTab(tab);

  try {
    const [profit, sales, topProds, trend] = await Promise.all([
      api.reports.profit(range).catch(err => { console.warn("[Reports] profit notice:", err.message); return null; }),
      api.reports.sales(range).catch(err => { console.warn("[Reports] sales notice:", err.message); return null; }),
      api.reports.topProducts({ limit: 5 }).catch(err => { console.warn("[Reports] top products notice:", err.message); return []; }),
      api.reports.salesTrend({ days: 7 }).catch(err => { console.warn("[Reports] trend notice:", err.message); return []; })
    ]);

    if (profit) _reportProfitData = profit;
    if (sales) _reportSalesData = sales;
    if (Array.isArray(topProds) && topProds.length > 0) _reportTopProducts = topProds;
    if (Array.isArray(trend) && trend.length > 0) _reportSalesTrend = trend;
  } catch (e) {
    console.warn("[Reports] Using local reactive state:", e.message);
  } finally {
    _reportsLoaded = true;
    _reportsLoading = false;
  }
}

function renderReportsView() {
  const localData = calculateLocalReportsData(activeReportTab);

  // Background fetch without causing infinite loops
  if (!_reportsLoaded && !_reportsLoading && typeof api !== 'undefined' && api.getToken()) {
    fetchReportsBackend(activeReportTab);
  }

  const profit = _reportProfitData || localData.profit;
  if (!_reportTopProducts || _reportTopProducts.length === 0) {
    _reportTopProducts = localData.topProds;
  }

  const totalRev = profit.net_sales || 0;
  const totalExp = profit.expenses || 0;
  const cogs = profit.cost_of_goods_sold || 0;
  const netProfit = profit.net_profit || 0;
  const margin = profit.profit_margin_percentage || 0;

  return `
    <div class="p-6 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/20 pb-4">
        <div>
          <span class="text-xs text-[#D4AF37] font-semibold tracking-widest uppercase">Executive Analytics</span>
          <h1 class="font-heading text-2xl font-extrabold text-white">Business Reports</h1>
          <p class="text-xs text-gray-400">Authoritative Profit, COGS, and Outflow Metrics & 7-Day PDF Exporter</p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button onclick="refreshReportsData()" class="btn-outline-dark text-xs py-2 px-3 flex items-center gap-1.5" title="Refresh Reports">
            <i class="fas fa-sync-alt ${_reportsLoading ? 'fa-spin text-[#D4AF37]' : ''}"></i> Refresh
          </button>
          <button onclick="exportReportsCSV()" class="btn-gold text-xs py-2 px-3">
            <i class="fas fa-file-csv"></i> Export CSV
          </button>
          <button id="btn-download-weekly-pdf" onclick="downloadWeeklyReportPdf()" class="btn-gold-solid text-xs py-2 px-4 shadow-[0_0_15px_rgba(212,175,55,0.4)] flex items-center gap-1.5 font-bold">
            <i class="fas fa-file-pdf text-red-400"></i> Download 7-Day PDF Report
          </button>
        </div>
      </div>

      <!-- Weekly Automation Banner -->
      <div class="glass-card p-4 border border-[#D4AF37]/30 bg-gradient-to-r from-[#141414] via-[#1a1710] to-[#141414] flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] text-lg">
            <i class="fas fa-calendar-check"></i>
          </div>
          <div>
            <h3 class="font-heading text-sm font-bold text-white flex items-center gap-2">
              7-Day Automated Weekly Report
              <span class="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">Active (Every 7 Days)</span>
            </h3>
            <p class="text-[11px] text-gray-400 mt-0.5">
              Includes gross revenue, COGS, net profit, top 10 items, payment methods, inventory status, and expense audits.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 w-full md:w-auto">
          <button onclick="downloadWeeklyReportPdf()" class="btn-gold text-xs py-2 px-4 whitespace-nowrap w-full md:w-auto flex items-center justify-center gap-1.5">
            <i class="fas fa-download text-black"></i> Export 7-Day PDF Now
          </button>
        </div>
      </div>

      <!-- Timeframe Filter Tabs -->
      <div class="flex items-center gap-2 bg-[#141414] p-1 rounded-xl border border-gray-800 w-fit text-xs font-semibold">
        ${['Daily', 'Weekly', 'Monthly', 'Yearly'].map(tab => `
          <button onclick="setReportTab('${tab}')" class="px-4 py-1.5 rounded-lg transition-all ${activeReportTab === tab ? 'bg-gradient-to-r from-[#BF953F] to-[#AA771C] text-black shadow-md' : 'text-gray-400 hover:text-white'}">
            ${tab} Report
          </button>
        `).join('')}
      </div>

      <!-- Top Summary Breakdown Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div class="glass-card p-5 border-l-4 border-l-[#D4AF37]">
          <span class="text-xs text-gray-400 font-semibold">NET SALES (${activeReportTab})</span>
          <div class="text-2xl font-extrabold text-white font-heading mt-1">${formatCurrency(totalRev)}</div>
          <span class="text-[10px] text-gray-400">Total revenue</span>
        </div>

        <div class="glass-card p-5 border-l-4 border-l-amber-500">
          <span class="text-xs text-gray-400 font-semibold">COGS (${activeReportTab})</span>
          <div class="text-2xl font-extrabold text-amber-300 font-heading mt-1">${formatCurrency(cogs)}</div>
          <span class="text-[10px] text-gray-400">Cost of goods sold</span>
        </div>

        <div class="glass-card p-5 border-l-4 border-l-red-500">
          <span class="text-xs text-gray-400 font-semibold">TOTAL EXPENSES (${activeReportTab})</span>
          <div class="text-2xl font-extrabold text-red-400 font-heading mt-1">${formatCurrency(totalExp)}</div>
          <span class="text-[10px] text-gray-400">Operating outflows</span>
        </div>

        <div class="glass-card p-5 border-l-4 border-l-emerald-500">
          <span class="text-xs text-gray-400 font-semibold">NET PROFIT (${activeReportTab})</span>
          <div class="text-2xl font-extrabold text-emerald-400 font-heading mt-1">${formatCurrency(netProfit)}</div>
          <span class="text-[10px] text-emerald-400 font-bold">${margin.toFixed(1)}% Margin</span>
        </div>
      </div>

      <!-- Analytics Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="glass-card p-6 space-y-4">
          <h3 class="font-heading font-bold text-sm text-white">Revenue vs Expense Comparison (in ₹)</h3>
          <div class="h-64 flex items-center justify-center relative">
            <canvas id="report-bar-chart" class="w-full h-full"></canvas>
          </div>
        </div>

        <div class="glass-card p-6 space-y-4">
          <h3 class="font-heading font-bold text-sm text-white">Top Selling Products Breakdown</h3>
          <div class="h-64 flex items-center justify-center relative">
            <canvas id="report-doughnut-chart" class="w-full h-full"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function setReportTab(tab) {
  activeReportTab = tab;
  _reportsLoaded = false;
  await fetchReportsBackend(tab);
  renderView('reports');
}

async function refreshReportsData() {
  _reportsLoaded = false;
  await fetchReportsBackend(activeReportTab);
  renderView('reports');
}

function initReportCharts() {
  const barCtx = document.getElementById('report-bar-chart');
  const doughnutCtx = document.getElementById('report-doughnut-chart');

  const profit = _reportProfitData || { net_sales: 0, expenses: 0, cost_of_goods_sold: 0 };
  const topProds = _reportTopProducts || [];

  if (barCtx) {
    if (window.reportBarInstance) window.reportBarInstance.destroy();
    window.reportBarInstance = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: ['Net Revenue', 'COGS', 'Operating Expenses', 'Net Profit'],
        datasets: [{
          label: 'Amount (₹)',
          data: [profit.net_sales || 0, profit.cost_of_goods_sold || 0, profit.expenses || 0, profit.net_profit || 0],
          backgroundColor: ['#D4AF37', '#F59E0B', '#EF4444', '#10B981'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { ticks: { color: '#9CA3AF' } },
          y: { ticks: { color: '#9CA3AF' } }
        }
      }
    });
  }

  if (doughnutCtx) {
    if (window.reportDoughnutInstance) window.reportDoughnutInstance.destroy();
    const prodLabels = topProds.map(p => p.product_name || 'Product');
    const prodData = topProds.map(p => p.quantity_sold || 0);

    window.reportDoughnutInstance = new Chart(doughnutCtx, {
      type: 'doughnut',
      data: {
        labels: prodLabels.length > 0 ? prodLabels : ['No Product Sales Recorded'],
        datasets: [{
          data: prodData.length > 0 ? prodData : [1],
          backgroundColor: prodLabels.length > 0 ? ['#D4AF37', '#10B981', '#F59E0B', '#8B5CF6', '#3B82F6'] : ['#374151'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { color: '#9CA3AF', font: { size: 10 } } } }
      }
    });
  }
}

async function exportReportsCSV() {
  try {
    const range = getDateRangeForTab(activeReportTab);
    const sales = await api.sales.list(range);
    let csv = "InvoiceNo,Date,Customer,PaymentMethod,Subtotal(INR),Tax(INR),Total(INR),Status\n";
    (sales || []).forEach(s => {
      let pMethod = 'CASH';
      if (s.payments && s.payments.length > 0) pMethod = s.payments[0].payment_method;
      csv += `"${s.invoice_number || s.id}","${s.sale_date}","${s.customer_id || 'Guest'}","${pMethod}",${s.subtotal},${s.tax},${s.total},"${s.sale_status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `OG_Waffles_Report_${activeReportTab}_${Date.now()}.csv`;
    a.click();
  } catch (e) {
    alert("Export failed: " + e.message);
  }
}

function exportReportsPDF() {
  if (typeof downloadWeeklyReportPdf === "function") {
    downloadWeeklyReportPdf();
  } else {
    window.print();
  }
}

