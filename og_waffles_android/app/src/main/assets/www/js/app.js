let currentView = null; // active view id

/* ─────────────────────────────────────────────────────────────────
   ROLE PERMISSION MAP
   Single source of truth for what each role can access.
   ───────────────────────────────────────────────────────────────── */
const ROLE_PERMISSIONS = {
  OWNER:   ["dashboard","pos","inventory","purchases","menu","expenses","reports","rewards","customers","todaysales","staff","suppliers","waste","systemlogs","settings"],
  CASHIER: ["pos","customers","rewards","todaysales"]
};

function canAccess(role, view) {
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(view);
}

function defaultViewForRole(role) {
  if (role === "CASHIER") return "pos";
  return "dashboard";
}

/* ─────────────────────────────────────────────────────────────────
   APP INITIALISATION — Authenticated Session Validation
   ───────────────────────────────────────────────────────────────── */
async function initApp() {
  window.addEventListener('error', function(event) {
    console.error('[OG Waffles] Unhandled error:', event.message, 'at', event.filename, ':', event.lineno);
    forceHideLoader();
  });

  store.subscribe(() => {
    try {
      renderCurrentApp();
    } catch(e) {
      console.error('[OG Waffles] renderCurrentApp error in subscriber:', e);
    }
  });

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K for Search)
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      toggleGlobalSearch();
    }
  });

  // ── Session Restoration from FastAPI Backend ──
  try {
    if (typeof api !== 'undefined' && api.getToken()) {
      const validatedUser = await api.fetchMe();
      if (validatedUser && validatedUser.role) {
        store.state.currentUser = validatedUser;
        store.saveState();
        // Eagerly sync backend master data
        await store.loadMasterData();
      } else {
        api.clearAuthSession();
        store.state.currentUser = null;
        store.saveState();
      }
    } else {
      store.state.currentUser = null;
      store.saveState();
    }
  } catch (authErr) {
    console.warn('[OG Waffles] Backend session check failed:', authErr);
    if (typeof api !== 'undefined') api.clearAuthSession();
    store.state.currentUser = null;
    store.saveState();
  }

  // Hash route listener to redirect any customer or old routes
  window.addEventListener('hashchange', handleHashRouting);
  handleHashRouting();

  try {
    renderCurrentApp();
  } catch(e) {
    console.error('[OG Waffles] Initial render failed:', e);
    clearCorruptedSession();
    try {
      const appContainer = document.getElementById('app');
      if (appContainer) appContainer.innerHTML = renderLoginView();
    } catch(e2) { /* ignore */ }
  }

  forceHideLoader();

  // Background automated 7-day report check
  if (typeof checkAndAutoExportWeeklyReport === "function") {
    setTimeout(checkAndAutoExportWeeklyReport, 2500);
  }
}

function forceHideLoader() {
  setTimeout(() => {
    const loader = document.getElementById('loading-screen');
    if (loader) {
      loader.classList.add('opacity-0', 'pointer-events-none');
      setTimeout(() => { try { loader.remove(); } catch(e) {} }, 500);
    }
  }, 400);
}

function clearCorruptedSession() {
  try {
    if (typeof api !== 'undefined') {
      api.clearAuthSession();
    }
    const raw = localStorage.getItem('OG_WAFFLES_POS_STORE_V2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.currentUser !== undefined) {
        parsed.currentUser = null;
        localStorage.setItem('OG_WAFFLES_POS_STORE_V2', JSON.stringify(parsed));
        if (typeof store !== 'undefined' && store.loadState) {
          store.loadState();
        }
      }
    }
  } catch(e) {
    console.warn('[OG Waffles] clearCorruptedSession failed:', e);
  }
}

function handleHashRouting() {
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  const customerRoutes = [
    'customer', 'home', 'website', 'online-order', 'checkout', 'cart',
    'portal', 'menu-site', 'promotions', 'account', 'order-online',
    'public-menu', 'track-order', 'store', 'order', 'shop'
  ];
  if (customerRoutes.includes(hash)) {
    try { history.replaceState(null, '', window.location.pathname); } catch (e) {}
    const user = store.getState().currentUser;
    navigate(user ? defaultViewForRole(user.role) : 'login');
    return;
  }
  if (hash && (ROLE_PERMISSIONS.OWNER.includes(hash) || ROLE_PERMISSIONS.CASHIER.includes(hash) || hash === 'login')) {
    navigate(hash);
  }
}

/* ─────────────────────────────────────────────────────────────────
   MAIN RENDERER
   ───────────────────────────────────────────────────────────────── */
function renderCurrentApp() {
  const appContainer = document.getElementById("app");
  if (!appContainer) return;

  const state = store.getState();
  const currentUser = state.currentUser;

  // ── 1. NOT LOGGED IN → LOGIN ─────────────────────────────────────
  if (!currentUser) {
    currentView = "login";
    appContainer.innerHTML = renderLoginView();
    return;
  }

  // ── 2. LOGGED IN — ROLE ACCESS GUARD ─────────────────────────────
  const role = currentUser.role;

  if (!currentView || currentView === "login") {
    currentView = defaultViewForRole(role);
  }

  if (!canAccess(role, currentView)) {
    appContainer.innerHTML = renderAccessDenied(role, currentView);
    setTimeout(() => {
      currentView = defaultViewForRole(role);
      renderCurrentApp();
    }, 1500);
    return;
  }

  // ── 3. RENDER INTERNAL POS/ERP WORKSPACE ─────────────────────────
  appContainer.innerHTML = `
    <div class="min-h-screen flex flex-col bg-[#0B0B0B]">
      ${renderNavBar(currentView)}

      <div class="flex-1 flex overflow-hidden">
        ${renderSidebar(currentView)}

        <main class="flex-1 overflow-y-auto bg-[#0B0B0B]">
          ${renderActiveAdminView(currentView, role)}
        </main>
      </div>

      ${renderNotificationDrawer()}
      ${renderGlobalSearchModal()}
    </div>
  `;

  setTimeout(() => {
    if (currentView === "dashboard" && typeof initDashboardCharts === "function") initDashboardCharts();
    if (currentView === "expenses"  && typeof initExpenseChart    === "function") initExpenseChart();
    if (currentView === "reports"   && typeof initReportCharts    === "function") initReportCharts();
  }, 50);
}

/* ─────────────────────────────────────────────────────────────────
   VIEW ROUTER
   ───────────────────────────────────────────────────────────────── */
function renderActiveAdminView(view, role) {
  if (!canAccess(role, view)) {
    return renderAccessDenied(role, view);
  }

  switch (view) {
    case "dashboard":   return renderDashboardView();
    case "pos":         return renderPosView();
    case "todaysales":  return renderTodaySalesView();
    case "inventory":   return renderInventoryView();
    case "purchases":   return renderPurchaseView();
    case "menu":        return renderMenuView();
    case "expenses":    return renderExpenseView();
    case "reports":     return renderReportsView();
    case "rewards":     return renderRewardsView();
    case "customers":   return renderCustomersView();
    case "staff":       return renderStaffView();
    case "suppliers":   return renderSuppliersView();
    case "waste":       return renderWasteView();
    case "systemlogs":  return renderSystemLogsView();
    case "settings":    return renderSettingsView();
    default:            return defaultViewForRole(role) === "pos" ? renderPosView() : renderDashboardView();
  }
}

/* ─────────────────────────────────────────────────────────────────
   ACCESS DENIED SCREEN
   ───────────────────────────────────────────────────────────────── */
function renderAccessDenied(role, attemptedView) {
  return `
    <div class="flex-1 flex items-center justify-center p-8 min-h-[60vh]">
      <div class="text-center space-y-5 max-w-sm">
        <div class="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center mx-auto">
          <i class="fas fa-shield-alt text-red-400 text-3xl"></i>
        </div>
        <div>
          <h2 class="font-heading font-bold text-xl text-white">Access Denied</h2>
          <p class="text-xs text-gray-400 mt-2">
            Your role (<strong class="text-[#D4AF37]">${role}</strong>) does not have permission
            to access the <strong class="text-white">${attemptedView}</strong> module.
          </p>
        </div>
        <p class="text-[10px] text-gray-600">Redirecting to your portal...</p>
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────────────────────────────
   NAVIGATION
   ───────────────────────────────────────────────────────────────── */
function navigate(viewId) {
  const customerRoutes = [
    "customer", "home", "website", "online-order", "checkout", "cart",
    "portal", "menu-site", "promotions", "account", "order-online",
    "public-menu", "track-order", "store", "order", "shop"
  ];
  if (customerRoutes.includes(viewId)) {
    const user = store.getState().currentUser;
    navigate(user ? defaultViewForRole(user.role) : "login");
    return;
  }

  const state = store.getState();
  const currentUser = state.currentUser;

  if (viewId === "login") {
    currentView = "login";
    renderCurrentApp();
    return;
  }

  if (!currentUser) {
    currentView = "login";
    renderCurrentApp();
    return;
  }

  const role = currentUser.role;
  if (!canAccess(role, viewId)) {
    currentView = viewId;
    renderCurrentApp();
    return;
  }

  currentView = viewId;
  renderCurrentApp();

  // Background refresh for master data views to keep UI authoritative
  if (["menu", "pos", "inventory", "suppliers", "customers", "rewards"].includes(viewId)) {
    store.loadMasterData().then(() => {
      // Re-render if view has not changed
      if (currentView === viewId) {
        renderCurrentApp();
      }
    }).catch(() => {});
  } else if (viewId === "today-sales" && typeof fetchTodaySalesBackend === "function") {
    fetchTodaySalesBackend().then(() => {
      if (currentView === "today-sales") {
        renderCurrentApp();
      }
    }).catch(() => {});
  } else if (viewId === "dashboard" && typeof fetchDashboardBackend === "function") {
    fetchDashboardBackend().then(() => {
      if (currentView === "dashboard") {
        renderCurrentApp();
      }
    }).catch(() => {});
  } else if (viewId === "reports" && typeof fetchReportsBackend === "function") {
    fetchReportsBackend(activeReportTab).then(() => {
      if (currentView === "reports") {
        renderCurrentApp();
      }
    }).catch(() => {});
  } else if (viewId === "purchases" && typeof fetchPurchasesBackend === "function") {
    fetchPurchasesBackend().then(() => {
      if (currentView === "purchases") {
        renderCurrentApp();
      }
    }).catch(() => {});
  } else if (viewId === "expenses" && typeof fetchExpensesBackend === "function") {
    fetchExpensesBackend().then(() => {
      if (currentView === "expenses") {
        renderCurrentApp();
      }
    }).catch(() => {});
  }
}

function switchSection(section) {
  const state = store.getState();
  const user = state.currentUser;
  navigate(user ? defaultViewForRole(user.role) : "login");
}

/* ─────────────────────────────────────────────────────────────────
   LOGOUT — calls FastAPI logout & clears session
   ───────────────────────────────────────────────────────────────── */
async function logout() {
  if (typeof api !== 'undefined') {
    await api.logout();
  }
  store.logout();
  currentView = "login";
  renderCurrentApp();
}

/* ─────────────────────────────────────────────────────────────────
   NOTIFICATIONS
   ───────────────────────────────────────────────────────────────── */
function toggleNotifications() {
  const drawer = document.getElementById("notif-drawer");
  if (drawer) drawer.classList.toggle("translate-x-full");
}

function clearNotifs() {
  store.clearNotifications();
  renderCurrentApp();
}

/* ─────────────────────────────────────────────────────────────────
   GLOBAL SEARCH
   ───────────────────────────────────────────────────────────────── */
function toggleGlobalSearch() {
  const modal = document.getElementById("global-search-modal");
  if (modal) {
    modal.classList.toggle("hidden");
    if (!modal.classList.contains("hidden")) {
      const input = document.getElementById("global-search-input");
      if (input) input.focus();
    }
  }
}

function handleGlobalSearch(query) {
  const resultsContainer = document.getElementById("global-search-results");
  if (!resultsContainer) return;

  if (!query || query.trim() === "") {
    resultsContainer.innerHTML = `<p class="text-gray-500 text-center py-6">Type anything to search across the business module...</p>`;
    return;
  }

  const q     = query.toLowerCase();
  const state = store.getState();
  const role  = state.currentUser ? state.currentUser.role : "CASHIER";

  const matchedMenu   = state.menuItems.filter(m => m.name.toLowerCase().includes(q));
  const matchedIng    = state.ingredients.filter(i => i.name.toLowerCase().includes(q));
  const matchedCust   = state.customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  const matchedOrders = state.orders.filter(o => o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q));

  let html = "";

  if (matchedMenu.length > 0 && canAccess(role, "menu")) {
    html += `<div class="font-bold text-[#D4AF37] mb-1">Menu Items (${matchedMenu.length})</div>`;
    matchedMenu.forEach(m => {
      html += `<div onclick="toggleGlobalSearch(); navigate('menu')" class="p-2 bg-black/50 rounded hover:bg-[#D4AF37]/10 cursor-pointer flex justify-between"><span>${m.name}</span> <span class="text-[#D4AF37]">${formatCurrency(m.price)}</span></div>`;
    });
  }

  if (matchedIng.length > 0 && canAccess(role, "inventory")) {
    html += `<div class="font-bold text-[#D4AF37] mt-3 mb-1">Inventory (${matchedIng.length})</div>`;
    matchedIng.forEach(i => {
      html += `<div onclick="toggleGlobalSearch(); navigate('inventory')" class="p-2 bg-black/50 rounded hover:bg-[#D4AF37]/10 cursor-pointer flex justify-between"><span>${i.name}</span> <span class="text-emerald-400">${i.currentQty} ${i.unit}</span></div>`;
    });
  }

  if (matchedCust.length > 0 && canAccess(role, "customers")) {
    html += `<div class="font-bold text-[#D4AF37] mt-3 mb-1">Customers (${matchedCust.length})</div>`;
    matchedCust.forEach(c => {
      html += `<div onclick="toggleGlobalSearch(); navigate('customers')" class="p-2 bg-black/50 rounded hover:bg-[#D4AF37]/10 cursor-pointer flex justify-between"><span>${c.name}</span> <span class="text-gray-400">${c.phone}</span></div>`;
    });
  }

  if (matchedOrders.length > 0 && canAccess(role, "reports")) {
    html += `<div class="font-bold text-[#D4AF37] mt-3 mb-1">Orders & Invoices (${matchedOrders.length})</div>`;
    matchedOrders.forEach(o => {
      html += `<div onclick="toggleGlobalSearch(); navigate('reports')" class="p-2 bg-black/50 rounded hover:bg-[#D4AF37]/10 cursor-pointer flex justify-between"><span>Invoice #${o.id}</span> <span class="text-[#D4AF37]">${formatCurrency(o.grandTotal)}</span></div>`;
    });
  }

  if (!html) {
    html = `<p class="text-gray-500 text-center py-6">No matching records found for "${query}".</p>`;
  }

  resultsContainer.innerHTML = html;
}

function renderView(view) {
  if (view) currentView = view;
  renderCurrentApp();
}

document.addEventListener("DOMContentLoaded", initApp);
