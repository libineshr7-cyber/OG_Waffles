/* OG Waffles & Fried Chicken - System Activity Logs View */

let systemLogsSearchQuery = "";
let systemLogsModuleFilter = "ALL";
let systemLogsLevelFilter = "ALL";

function renderSystemLogsView() {
  const state = store.getState();
  const logs = state.systemLogs || [];

  // Summary Metrics
  const totalLogs = logs.length;
  const menuChanges = logs.filter(l => l.module === 'MENU').length;
  const posSales = logs.filter(l => l.module === 'POS').length;
  const stockAlerts = logs.filter(l => l.module === 'INVENTORY' || l.level === 'warning' || l.level === 'danger').length;

  // Filtered Logs
  let filtered = logs.filter(l => {
    const q = systemLogsSearchQuery.toLowerCase();
    const matchesQuery = !q ||
      (l.details && l.details.toLowerCase().includes(q)) ||
      (l.action && l.action.toLowerCase().includes(q)) ||
      (l.module && l.module.toLowerCase().includes(q)) ||
      (l.user && l.user.toLowerCase().includes(q));

    const matchesModule = systemLogsModuleFilter === 'ALL' || l.module === systemLogsModuleFilter;
    const matchesLevel = systemLogsLevelFilter === 'ALL' || l.level === systemLogsLevelFilter;

    return matchesQuery && matchesModule && matchesLevel;
  });

  return `
    <div class="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <!-- Header Banner -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/20 pb-4">
        <div>
          <h1 class="font-heading font-extrabold text-2xl text-gold-gradient tracking-wide">
            <i class="fas fa-history mr-2 text-[#D4AF37]"></i> System Activity Logs
          </h1>
          <p class="text-xs text-gray-400 mt-1">
            Real-time audit trail of product edits, sales, inventory deductions, and system actions
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="exportSystemLogsCsv()" class="btn-outline-dark text-xs py-2 px-3 flex items-center gap-1.5 hover:border-[#D4AF37] transition-all">
            <i class="fas fa-file-export text-[#D4AF37]"></i> Export CSV
          </button>
          <button onclick="confirmClearSystemLogs()" class="btn-outline-dark text-xs py-2 px-3 flex items-center gap-1.5 text-red-400 hover:border-red-500 transition-all">
            <i class="fas fa-trash-alt"></i> Clear Logs
          </button>
        </div>
      </div>

      <!-- Top Summary Metrics Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="glass-card p-4 flex items-center gap-3 border border-gray-800">
          <div class="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <i class="fas fa-clipboard-list text-lg"></i>
          </div>
          <div>
            <p class="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total Logs</p>
            <p class="text-xl font-heading font-extrabold text-white">${totalLogs}</p>
          </div>
        </div>

        <div class="glass-card p-4 flex items-center gap-3 border border-gray-800">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <i class="fas fa-utensils text-lg"></i>
          </div>
          <div>
            <p class="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Menu & Products</p>
            <p class="text-xl font-heading font-extrabold text-amber-400">${menuChanges}</p>
          </div>
        </div>

        <div class="glass-card p-4 flex items-center gap-3 border border-gray-800">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <i class="fas fa-cash-register text-lg"></i>
          </div>
          <div>
            <p class="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Sales Transactions</p>
            <p class="text-xl font-heading font-extrabold text-emerald-400">${posSales}</p>
          </div>
        </div>

        <div class="glass-card p-4 flex items-center gap-3 border border-gray-800">
          <div class="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <i class="fas fa-exclamation-triangle text-lg"></i>
          </div>
          <div>
            <p class="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Stock & Warnings</p>
            <p class="text-xl font-heading font-extrabold text-red-400">${stockAlerts}</p>
          </div>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="glass-card p-4 border border-gray-800 flex flex-col md:flex-row items-center gap-3 justify-between">
        <div class="relative w-full md:w-80">
          <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
          <input
            type="text"
            id="system-logs-search"
            value="${systemLogsSearchQuery}"
            oninput="handleSystemLogsSearch(this.value)"
            placeholder="Search activities, products, staff..."
            class="input-gold w-full pl-9 py-2 text-xs">
        </div>

        <div class="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <!-- Module Filter -->
          <select id="system-logs-module-filter" onchange="handleSystemLogsModuleFilter(this.value)" class="input-gold py-2 px-3 text-xs">
            <option value="ALL" ${systemLogsModuleFilter === 'ALL' ? 'selected' : ''}>All Modules</option>
            <option value="MENU" ${systemLogsModuleFilter === 'MENU' ? 'selected' : ''}>Menu & Products</option>
            <option value="POS" ${systemLogsModuleFilter === 'POS' ? 'selected' : ''}>POS Billing</option>
            <option value="INVENTORY" ${systemLogsModuleFilter === 'INVENTORY' ? 'selected' : ''}>Inventory & Stock</option>
            <option value="CUSTOMERS" ${systemLogsModuleFilter === 'CUSTOMERS' ? 'selected' : ''}>Customers</option>
            <option value="EXPENSES" ${systemLogsModuleFilter === 'EXPENSES' ? 'selected' : ''}>Expenses</option>
            <option value="SETTINGS" ${systemLogsModuleFilter === 'SETTINGS' ? 'selected' : ''}>Settings</option>
            <option value="SYSTEM" ${systemLogsModuleFilter === 'SYSTEM' ? 'selected' : ''}>System</option>
          </select>

          <!-- Level Filter -->
          <select id="system-logs-level-filter" onchange="handleSystemLogsLevelFilter(this.value)" class="input-gold py-2 px-3 text-xs">
            <option value="ALL" ${systemLogsLevelFilter === 'ALL' ? 'selected' : ''}>All Severity</option>
            <option value="info" ${systemLogsLevelFilter === 'info' ? 'selected' : ''}>Info</option>
            <option value="success" ${systemLogsLevelFilter === 'success' ? 'selected' : ''}>Success</option>
            <option value="warning" ${systemLogsLevelFilter === 'warning' ? 'selected' : ''}>Warning</option>
            <option value="danger" ${systemLogsLevelFilter === 'danger' ? 'selected' : ''}>Danger</option>
          </select>

          <button onclick="resetSystemLogsFilters()" class="btn-outline-dark text-xs py-2 px-3 whitespace-nowrap">
            <i class="fas fa-sync-alt mr-1"></i> Reset
          </button>
        </div>
      </div>

      <!-- Activity Logs Table / Feed -->
      <div class="glass-card overflow-hidden border border-gray-800">
        ${filtered.length === 0 ? `
          <div class="py-16 text-center text-gray-500 space-y-3">
            <i class="fas fa-clipboard text-4xl text-[#D4AF37]/30"></i>
            <p class="text-sm font-semibold text-gray-400">No activity logs found</p>
            <p class="text-xs text-gray-600">Activities performed across Menu, POS, and Inventory will appear here automatically.</p>
          </div>
        ` : `
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-[#0B0B0B] border-b border-gray-800 text-gray-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th class="p-3.5">Timestamp</th>
                  <th class="p-3.5">Module</th>
                  <th class="p-3.5">Action</th>
                  <th class="p-3.5">Activity Details</th>
                  <th class="p-3.5">User</th>
                  <th class="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-800/60 font-medium">
                ${filtered.map(log => renderLogTableRow(log)).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    </div>
  `;
}

function renderLogTableRow(log) {
  const levelStyles = {
    info:    { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: 'fa-info-circle', label: 'INFO' },
    success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: 'fa-check-circle', label: 'SUCCESS' },
    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'fa-exclamation-triangle', label: 'WARNING' },
    danger:  { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: 'fa-exclamation-circle', label: 'ALERT' }
  };

  const moduleBadges = {
    MENU:      'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]',
    POS:       'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
    INVENTORY: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
    CUSTOMERS: 'bg-purple-500/15 border-purple-500/40 text-purple-300',
    EXPENSES:  'bg-rose-500/15 border-rose-500/40 text-rose-300',
    SETTINGS:  'bg-gray-500/15 border-gray-500/40 text-gray-300',
    STAFF:     'bg-indigo-500/15 border-indigo-500/40 text-indigo-300',
    SYSTEM:    'bg-gray-500/15 border-gray-500/40 text-gray-400'
  };

  const ls = levelStyles[log.level] || levelStyles.info;
  const mb = moduleBadges[log.module] || moduleBadges.SYSTEM;

  return `
    <tr class="hover:bg-white/[0.02] transition-colors">
      <!-- Timestamp -->
      <td class="p-3.5 whitespace-nowrap text-gray-400 font-mono text-[11px]">
        <i class="far fa-clock mr-1 opacity-60"></i>${log.timestamp || 'Just now'}
      </td>

      <!-- Module -->
      <td class="p-3.5 whitespace-nowrap">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${mb}">
          ${log.module}
        </span>
      </td>

      <!-- Action -->
      <td class="p-3.5 whitespace-nowrap">
        <span class="text-white font-semibold text-xs tracking-tight">
          ${(log.action || 'ACTIVITY').replace(/_/g, ' ')}
        </span>
      </td>

      <!-- Activity Details -->
      <td class="p-3.5 text-gray-300 text-xs">
        <p class="leading-relaxed">${log.details || ''}</p>
      </td>

      <!-- User & Role -->
      <td class="p-3.5 whitespace-nowrap">
        <div class="flex items-center gap-1.5">
          <div class="w-5 h-5 rounded-full ${log.role === 'OWNER' ? 'bg-[#D4AF37] text-black' : 'bg-emerald-500 text-black'} font-bold text-[9px] flex items-center justify-center">
            ${(log.user || 'S').charAt(0).toUpperCase()}
          </div>
          <span class="text-xs text-gray-300 font-medium">${log.user || 'System'}</span>
        </div>
      </td>

      <!-- Status Indicator -->
      <td class="p-3.5 whitespace-nowrap text-center">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${ls.bg} ${ls.border} ${ls.text}">
          <i class="fas ${ls.icon} text-[8px]"></i> ${ls.label}
        </span>
      </td>
    </tr>
  `;
}

function handleSystemLogsSearch(val) {
  systemLogsSearchQuery = val;
  renderView('systemlogs');
}

function handleSystemLogsModuleFilter(val) {
  systemLogsModuleFilter = val;
  renderView('systemlogs');
}

function handleSystemLogsLevelFilter(val) {
  systemLogsLevelFilter = val;
  renderView('systemlogs');
}

function resetSystemLogsFilters() {
  systemLogsSearchQuery = "";
  systemLogsModuleFilter = "ALL";
  systemLogsLevelFilter = "ALL";
  renderView('systemlogs');
}

function confirmClearSystemLogs() {
  if (confirm("Are you sure you want to clear all activity logs? This action cannot be undone.")) {
    store.clearSystemLogs();
    store.addNotification("System Logs Cleared", "Cleared all system activity logs", "info");
    renderView('systemlogs');
  }
}

function exportSystemLogsCsv() {
  const logs = store.getState().systemLogs || [];
  if (logs.length === 0) {
    alert("No activity logs available to export.");
    return;
  }

  let csv = "ID,Timestamp,Module,Action,Details,User,Role,Level\n";
  logs.forEach(l => {
    const cleanDetails = (l.details || '').replace(/"/g, '""');
    csv += `"${l.id}","${l.timestamp}","${l.module}","${l.action}","${cleanDetails}","${l.user}","${l.role}","${l.level}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `OG_Waffles_Activity_Logs_${new Date().toISOString().substring(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
