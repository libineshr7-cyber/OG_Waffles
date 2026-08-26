/* OG Waffles & Fried Chicken - Core UI Components (INR ₹ Edition) */

// Global Indian Rupee Currency Formatter
function formatCurrency(val) {
  const settings = store.getState().settings;
  const curr = settings ? settings.currency || "₹" : "₹";
  const num = parseFloat(val) || 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
  return `${curr}${formatted}`;
}

// 1. BRAND LOGO COMPONENT
function renderLogo(size = 'normal', showSub = true) {
  const state = store.getState();
  const settings = state.settings;
  const logoUrl = settings.logoUrl || "assets/logo.png";

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const logoImgHtml = `
    <div class="relative ${isSmall ? 'w-10 h-10' : isLarge ? 'w-24 h-24' : 'w-12 h-12'} flex-shrink-0 rounded-full border-2 border-[#D4AF37] p-0.5 shadow-[0_0_15px_rgba(212,175,55,0.4)] bg-[#0B0B0B] flex items-center justify-center overflow-hidden">
      <img src="${logoUrl}" alt="OG Waffles Logo" class="w-full h-full object-cover rounded-full">
    </div>
  `;

  return `
    <div class="flex items-center gap-3 select-none">
      ${logoImgHtml}
      <div class="flex flex-col">
        <span class="font-heading font-extrabold tracking-wider ${isSmall ? 'text-sm' : isLarge ? 'text-2xl' : 'text-lg'} text-gold-gradient leading-tight gold-glow-text">
          OG WAFFLES &amp; FRIED CHICKEN
        </span>
        <span class="text-[10px] tracking-widest text-[#D4AF37]/90 uppercase font-semibold font-body">
          Chennai &bull; Tel: +91 93633 23102
        </span>
        ${showSub ? `
          <span class="text-[9px] text-gray-400 font-medium tracking-wide">
            ${settings.subTitle || "Restaurant Management & POS System"}
          </span>
        ` : ''}
      </div>
    </div>
  `;
}

// 2. TOP NAVIGATION BAR
function renderNavBar(activeView) {
  const state = store.getState();
  const currentUser = state.currentUser;
  const shortageAlerts = typeof store.getShortageAlerts === 'function' ? store.getShortageAlerts() : (state.notifications || []);
  const unreadNotifs = shortageAlerts.length;

  return `
    <header class="sticky top-0 z-40 bg-[#0B0B0B]/90 backdrop-blur-md border-b border-[#D4AF37]/20 px-4 py-3 flex items-center justify-between shadow-lg">
      <div class="flex items-center gap-6">
        <div class="cursor-pointer" onclick="navigate(store.getState().currentUser && store.getState().currentUser.role === 'CASHIER' ? 'pos' : 'dashboard')">
          ${renderLogo('normal', true)}
        </div>
      </div>

      <div class="flex items-center gap-3">
        <!-- Global Search Button -->
        <button onclick="toggleGlobalSearch()" class="hidden sm:flex items-center gap-2 bg-[#141414] border border-[#D4AF37]/20 px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:border-[#D4AF37] transition-all">
          <i class="fas fa-search text-[#D4AF37]"></i>
          <span>Search system...</span>
          <kbd class="bg-black/50 px-1.5 py-0.5 rounded text-[10px] text-gray-500 border border-gray-800">⌘K</kbd>
        </button>

        <!-- Product Shortages Notification Bell -->
        <button onclick="toggleNotifications()" class="relative p-2 rounded-xl bg-[#141414] border ${unreadNotifs > 0 ? 'border-amber-500/50 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]' : 'border-[#D4AF37]/20 text-gray-300'} hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all" title="Product Shortage Alerts">
          <i class="fas fa-bell text-sm"></i>
          ${unreadNotifs > 0 ? `
            <span class="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-md">
              ${unreadNotifs > 9 ? '9+' : unreadNotifs}
            </span>
          ` : ''}
        </button>

        <!-- Current User Role / Login -->
        ${currentUser ? `
          <div class="flex items-center gap-2 bg-[#141414] border border-[#D4AF37]/30 px-3 py-1.5 rounded-xl">
            <div class="w-6 h-6 rounded-full ${currentUser.role === 'OWNER' ? 'bg-[#D4AF37]' : 'bg-emerald-500'} text-black font-bold text-xs flex items-center justify-center">
              ${currentUser.role.charAt(0)}
            </div>
            <div class="hidden sm:flex flex-col">
              <span class="text-xs font-bold text-white leading-tight">${currentUser.name}</span>
              <span class="text-[9px] font-semibold ${currentUser.role === 'OWNER' ? 'text-[#D4AF37]' : 'text-emerald-400'} uppercase">${currentUser.role}</span>
            </div>
            <button onclick="logout()" class="ml-1 text-gray-400 hover:text-red-400 text-xs" title="Logout">
              <i class="fas fa-sign-out-alt"></i>
            </button>
          </div>
        ` : `
          <button onclick="navigate('login')" class="btn-gold text-xs py-1.5 px-3">
            <i class="fas fa-lock"></i> Portal Login
          </button>
        `}
      </div>
    </header>
  `;
}

// 3. ADMIN SIDEBAR NAVIGATION
function renderSidebar(activeView) {
  const state = store.getState();
  const role  = state.currentUser ? state.currentUser.role : 'CASHIER';

  // Must exactly mirror ROLE_PERMISSIONS in app.js (OWNER and CASHIER only)
  const navItems = [
    { id: 'dashboard',  label: 'Live Dashboard',      icon: 'fa-tachometer-alt',  roles: ['OWNER'] },
    { id: 'pos',        label: 'POS Billing',          icon: 'fa-cash-register',   roles: ['OWNER', 'CASHIER'], highlight: true },
    { id: 'todaysales', label: "Today's Sales",        icon: 'fa-calendar-day',    roles: ['OWNER', 'CASHIER'] },
    { id: 'inventory',  label: 'Inventory',            icon: 'fa-boxes',           roles: ['OWNER'] },
    { id: 'purchases',  label: 'Purchases',            icon: 'fa-truck-loading',   roles: ['OWNER'] },
    { id: 'menu',       label: 'Menu Management',      icon: 'fa-utensils',        roles: ['OWNER'] },
    { id: 'expenses',   label: 'Expenses',             icon: 'fa-receipt',         roles: ['OWNER'] },
    { id: 'reports',    label: 'Analytics & Reports',  icon: 'fa-chart-pie',       roles: ['OWNER'] },
    { id: 'rewards',    label: 'Customer Rewards',     icon: 'fa-award',           roles: ['OWNER', 'CASHIER'] },
    { id: 'customers',  label: 'Customer Database',    icon: 'fa-users',           roles: ['OWNER', 'CASHIER'] },
    { id: 'staff',      label: 'Staff Management',     icon: 'fa-user-tie',        roles: ['OWNER'] },
    { id: 'suppliers',  label: 'Suppliers',            icon: 'fa-handshake',       roles: ['OWNER'] },
    { id: 'waste',      label: 'Waste Log',            icon: 'fa-trash-alt',       roles: ['OWNER'] },
    { id: 'systemlogs', label: 'System Logs',          icon: 'fa-history',         roles: ['OWNER'] },
    { id: 'settings',   label: 'System Settings',      icon: 'fa-cog',             roles: ['OWNER'] }
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(role));

  const roleBadgeColor = role === 'OWNER'
    ? 'bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]'
    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400';

  const roleIcon = role === 'OWNER' ? 'fa-crown' : 'fa-cash-register';

  return `
    <aside class="w-64 bg-[#0B0B0B] border-r border-[#D4AF37]/20 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-61px)]">
      <div class="py-4 px-3 space-y-1">
        <!-- Role Badge -->
        <div class="px-3 py-2.5 mb-2 rounded-xl border ${roleBadgeColor} flex items-center gap-2 text-xs font-bold">
          <i class="fas ${roleIcon} text-sm"></i>
          <div>
            <div class="font-extrabold uppercase tracking-wide">${role} PORTAL</div>
            <div class="text-[9px] opacity-70 font-normal">${filteredItems.length} modules accessible</div>
          </div>
        </div>

        ${filteredItems.map(item => {
          const isItemActive = activeView === item.id || (item.id === 'todaysales' && activeView === 'today-sales') || (item.id === 'systemlogs' && activeView === 'system-logs');
          return `
          <button onclick="navigate('${item.id}')" class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${isItemActive ? 'bg-gradient-to-r from-[#BF953F]/20 to-transparent text-[#D4AF37] border-l-4 border-[#D4AF37]' : 'text-gray-400 hover:text-white hover:bg-white/5'}">
            <div class="flex items-center gap-3">
              <i class="fas ${item.icon} w-4 text-center ${isItemActive ? 'text-[#D4AF37]' : 'text-gray-500'}"></i>
              <span>${item.label}</span>
            </div>
            ${item.highlight ? `<span class="bg-[#D4AF37] text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded">POS</span>` : ''}
          </button>
        `;}).join('')}
      </div>

      <!-- Sidebar Footer -->
      <div class="p-4 border-t border-[#D4AF37]/10 bg-[#141414]/50 text-center">
        <button onclick="logout()" class="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-red-400 transition-colors py-2 rounded-xl hover:bg-red-950/30">
          <i class="fas fa-sign-out-alt"></i> Logout from ${role}
        </button>
        <p class="text-[9px] text-[#D4AF37]/60 mt-2">OG Waffles &amp; Fried Chicken © 2026</p>
      </div>
    </aside>
  `;
}

// 4. NOTIFICATION CENTER DRAWER — STRICTLY PRODUCT & STOCK SHORTAGE ALERTS
function renderNotificationDrawer() {
  const shortageAlerts = typeof store.getShortageAlerts === 'function' ? store.getShortageAlerts() : [];

  return `
    <div id="notif-drawer" class="fixed inset-y-0 right-0 w-80 sm:w-96 bg-[#141414] border-l border-amber-500/30 shadow-2xl z-50 transform translate-x-full transition-transform duration-300 flex flex-col">
      <div class="p-4 border-b border-amber-500/20 flex items-center justify-between bg-[#0B0B0B]">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <i class="fas fa-exclamation-triangle text-amber-400 text-xs"></i>
          </div>
          <div>
            <h3 class="font-heading text-sm text-white font-bold">Product Shortage Alerts</h3>
            <p class="text-[10px] text-gray-500">${shortageAlerts.length} active shortage${shortageAlerts.length === 1 ? '' : 's'}</p>
          </div>
        </div>
        <button onclick="toggleNotifications()" class="text-gray-400 hover:text-white">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        ${shortageAlerts.length === 0 ? `
          <div class="text-center py-16 text-gray-500 text-xs space-y-3">
            <div class="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <i class="fas fa-check-circle text-xl"></i>
            </div>
            <p class="text-white font-semibold">Stock Levels Optimal</p>
            <p class="text-[11px] text-gray-500 max-w-xs mx-auto">No inventory items are currently running low or out of stock.</p>
          </div>
        ` : shortageAlerts.map(alert => `
          <div class="p-3.5 rounded-xl ${alert.type === 'danger' ? 'bg-red-950/20 border-red-500/40' : 'bg-amber-950/20 border-amber-500/40'} border text-xs space-y-2">
            <div class="flex items-center justify-between">
              <span class="inline-flex items-center gap-1.5 font-bold ${alert.type === 'danger' ? 'text-red-400' : 'text-amber-400'}">
                <i class="fas ${alert.type === 'danger' ? 'fa-ban' : 'fa-exclamation-triangle'} text-[10px]"></i>
                ${alert.title}
              </span>
              <span class="text-[9px] text-gray-500 font-mono">${alert.timestamp || 'Live'}</span>
            </div>

            <p class="text-gray-200 text-xs leading-snug font-medium">${alert.message}</p>

            ${alert.currentQty !== undefined ? `
              <div class="flex items-center justify-between pt-1 border-t border-gray-800/80 text-[10px]">
                <span class="text-gray-400">Current Stock: <strong class="${alert.currentQty <= 0 ? 'text-red-400' : 'text-amber-300'}">${alert.currentQty} ${alert.unit}</strong></span>
                <span class="text-gray-500">Min Limit: ${alert.minLimit} ${alert.unit}</span>
              </div>
            ` : ''}

            <div class="pt-1">
              <button onclick="navigate('inventory'); toggleNotifications();" class="w-full text-center py-1 rounded-lg bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 border border-gray-700 hover:border-amber-500/40 transition-colors text-[10px] font-semibold text-gray-300">
                <i class="fas fa-boxes mr-1 text-amber-400"></i> Restock in Inventory
              </button>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="p-3 border-t border-gray-800 bg-[#0B0B0B] flex items-center justify-between gap-2">
        <button onclick="navigate('systemlogs'); toggleNotifications();" class="w-1/2 btn-outline-dark text-xs py-1.5 text-center">
          <i class="fas fa-history mr-1"></i> System Logs
        </button>
        <button onclick="navigate('inventory'); toggleNotifications();" class="w-1/2 btn-gold text-xs py-1.5 text-center">
          <i class="fas fa-boxes mr-1"></i> View Inventory
        </button>
      </div>
    </div>
  `;
}

// 5. GLOBAL SEARCH MODAL
function renderGlobalSearchModal() {
  return `
    <div id="global-search-modal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 hidden">
      <div class="w-full max-w-xl bg-[#141414] border border-[#D4AF37]/40 rounded-2xl p-4 shadow-2xl space-y-4">
        <div class="flex items-center gap-3 border-b border-gray-800 pb-3">
          <i class="fas fa-search text-[#D4AF37] text-lg"></i>
          <input id="global-search-input" type="text" oninput="handleGlobalSearch(this.value)" placeholder="Search products, customers, inventory, invoices..." class="bg-transparent text-white font-medium text-sm w-full outline-none">
          <button onclick="toggleGlobalSearch()" class="text-gray-400 hover:text-white">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div id="global-search-results" class="max-h-96 overflow-y-auto space-y-2 text-xs">
          <p class="text-gray-500 text-center py-6">Type anything to search across the business module...</p>
        </div>
      </div>
    </div>
  `;
}
