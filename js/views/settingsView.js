/* OG Waffles & Fried Chicken - System Settings View (INR ₹ Edition) */

function renderSettingsView() {
  const state = store.getState();
  const settings = state.settings;

  return `
    <div class="p-6 space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div class="border-b border-[#D4AF37]/20 pb-4">
        <span class="text-xs text-[#D4AF37] font-semibold tracking-widest uppercase">System Control & Branding</span>
        <h1 class="font-heading text-2xl font-extrabold text-white">System Settings</h1>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Sidebar Navigation Tabs -->
        <div class="glass-card p-4 space-y-2 text-xs">
          <button onclick="showSettingsTab('business')" id="set-tab-business" class="w-full text-left px-3 py-2.5 rounded-xl font-bold bg-[#D4AF37] text-black">
            <i class="fas fa-store mr-2"></i> Business & Branding Info
          </button>
          <button onclick="showSettingsTab('server')" id="set-tab-server" class="w-full text-left px-3 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white">
            <i class="fas fa-server mr-2"></i> Cloud Backend & MongoDB
          </button>
          <button onclick="showSettingsTab('security')" id="set-tab-security" class="w-full text-left px-3 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white">
            <i class="fas fa-key mr-2"></i> PIN & Security Access
          </button>
        </div>

        <!-- Settings Content Panel (2 Cols) -->
        <div class="md:col-span-2 glass-card p-6 border border-[#D4AF37]/30 space-y-6">
          <!-- 1. BUSINESS & LOGO BRANDING TAB -->
          <div id="set-panel-business" class="space-y-4 text-xs">
            <h3 class="font-heading font-bold text-base text-white border-b border-gray-800 pb-2">Business Metadata & Official Logo</h3>

            <!-- Official Logo Uploader -->
            <div class="p-4 rounded-xl bg-black/60 border border-[#D4AF37]/40 space-y-3">
              <label class="block font-bold text-[#D4AF37] text-xs">Official Uploaded Business Logo</label>
              <div class="flex items-center gap-4">
                <div id="settings-logo-preview" class="w-16 h-16 rounded-full bg-[#0B0B0B] border-2 border-[#D4AF37] flex items-center justify-center p-0.5 overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                  <img src="${settings.logoUrl || 'assets/logo.png'}" alt="Uploaded Official Logo" class="w-full h-full object-cover rounded-full">
                </div>
                <div class="flex-1 space-y-2">
                  <input id="set-logo-file" type="file" accept="image/*" onchange="handleLogoFileSelect(event)" class="text-xs text-gray-400">
                  <input id="set-logo-url" type="text" value="${settings.logoUrl || 'assets/logo.png'}" placeholder="Logo Path or Image URL..." class="input-gold py-1.5 text-xs">
                </div>
              </div>
            </div>

            <form onsubmit="handleBusinessSettingsSave(event)" class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-gray-300 font-semibold mb-1">Business Name</label>
                  <input id="set-biz-name" type="text" value="${settings.businessName}" required class="input-gold py-2 text-xs">
                </div>
                <div>
                  <label class="block text-gray-300 font-semibold mb-1">Parent Brand</label>
                  <input id="set-parent-brand" type="text" value="${settings.parentBrand}" required class="input-gold py-2 text-xs">
                </div>
              </div>

              <div>
                <label class="block text-gray-300 font-semibold mb-1">Subtitle Line</label>
                <input id="set-subtitle" type="text" value="${settings.subTitle}" required class="input-gold py-2 text-xs">
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-gray-300 font-semibold mb-1">Phone Number</label>
                  <input id="set-phone" type="text" value="${settings.phone}" class="input-gold py-2 text-xs">
                </div>
                <div>
                  <label class="block text-gray-300 font-semibold mb-1">Contact Email</label>
                  <input id="set-email" type="email" value="${settings.email}" class="input-gold py-2 text-xs">
                </div>
              </div>

              <div>
                <label class="block text-gray-300 font-semibold mb-1">Outlet Address</label>
                <textarea id="set-address" rows="2" class="input-gold py-2 text-xs">${settings.address}</textarea>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-gray-300 font-semibold mb-1">GSTIN Number</label>
                  <input id="set-gst" type="text" value="${settings.gstNumber}" class="input-gold py-2 text-xs">
                </div>
                <div>
                  <label class="block text-gray-300 font-semibold mb-1">GST Tax Rate (%)</label>
                  <input id="set-tax" type="number" step="0.1" value="${settings.taxRate}" class="input-gold py-2 text-xs">
                </div>
                <div>
                  <label class="block text-gray-300 font-semibold mb-1">Currency Symbol</label>
                  <input id="set-currency" type="text" value="${settings.currency || '₹'}" class="input-gold py-2 text-xs">
                </div>
              </div>

              <div>
                <label class="block text-gray-300 font-semibold mb-1">Receipt Footer Note</label>
                <input id="set-footer" type="text" value="${settings.receiptFooter}" class="input-gold py-2 text-xs">
              </div>

              <button type="submit" class="btn-gold-solid text-xs py-2.5 px-6 mt-2">
                <i class="fas fa-save mr-1"></i> Save Store Settings
              </button>
            </form>
          </div>

          <!-- 2. CLOUD & BACKEND TAB -->
          <div id="set-panel-server" class="space-y-4 text-xs hidden">
            <h3 class="font-heading font-bold text-base text-white border-b border-gray-800 pb-2">Cloud Backend & MongoDB Connection</h3>

            <div class="p-4 rounded-xl bg-black/60 border border-[#D4AF37]/30 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-bold text-white text-xs">Active Server Connection</p>
                  <p class="text-[10px] text-gray-400 font-mono mt-0.5" id="settings-current-server">${api.baseUrl}</p>
                </div>
                <button type="button" onclick="testCurrentServer()" class="py-1.5 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-[#D4AF37] border border-[#D4AF37]/30 font-semibold">
                  <i class="fas fa-sync-alt mr-1"></i> Test Health
                </button>
              </div>
              <div id="settings-health-badge" class="text-[11px] p-2 rounded bg-gray-900 border border-gray-800 text-gray-400">
                Click "Test Health" to check live backend and MongoDB connection status.
              </div>
            </div>

            <form onsubmit="handleServerSave(event)" class="space-y-4">
              <div>
                <label class="block text-gray-300 font-semibold mb-1">Backend Server API URL</label>
                <input id="settings-server-url-input" type="url" required value="${api.baseUrl}" placeholder="https://og-waffles-backend.onrender.com" class="input-gold py-2 text-xs">
                <p class="text-[10px] text-gray-500 mt-1">When deployed to Render, paste your Render URL here (e.g. <code>https://og-waffles-pos.onrender.com</code>).</p>
              </div>

              <div class="flex gap-3">
                <button type="submit" class="btn-gold-solid text-xs py-2.5 px-6">
                  <i class="fas fa-save mr-1"></i> Save Server URL
                </button>
                <button type="button" onclick="resetToDefaultServer()" class="py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 border border-gray-700">
                  <i class="fas fa-undo mr-1"></i> Reset to Default
                </button>
              </div>
            </form>
          </div>

          <!-- 3. PIN & SECURITY TAB -->
          <div id="set-panel-security" class="space-y-4 text-xs hidden">
            <h3 class="font-heading font-bold text-base text-white border-b border-gray-800 pb-2">Security & PIN Management</h3>

            <form onsubmit="handleSecuritySettingsSave(event)" class="space-y-4">
              <div class="p-4 rounded-xl bg-black/60 border border-[#D4AF37]/30 space-y-2">
                <label class="block text-gold-gradient font-bold text-xs flex items-center gap-2">
                  <i class="fas fa-crown text-[#D4AF37]"></i> Owner Access PIN (Full Management Control)
                </label>
                <input id="set-owner-pin" type="text" value="${settings.ownerPin}" required class="input-gold py-2 text-xs font-mono w-48 text-center">
                <p class="text-[10px] text-gray-500">Default owner login: <code>owner_dev</code> / <code>owner123</code></p>
              </div>

              <div class="p-4 rounded-xl bg-black/60 border border-emerald-500/30 space-y-2">
                <label class="block text-emerald-400 font-bold text-xs flex items-center gap-2">
                  <i class="fas fa-cash-register text-emerald-400"></i> Cashier Access PIN (POS Billing Only)
                </label>
                <input id="set-cashier-pin" type="text" value="${settings.cashierPin}" required class="input-gold py-2 text-xs font-mono w-48 text-center">
                <p class="text-[10px] text-gray-500">Default cashier login: <code>cashier_dev</code> / <code>cashier123</code></p>
              </div>

              <button type="submit" class="btn-gold-solid text-xs py-2.5 px-6 mt-2">
                <i class="fas fa-lock mr-1"></i> Update Access PINs
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

function showSettingsTab(tab) {
  ['business', 'server', 'security'].forEach(t => {
    const btn = document.getElementById(`set-tab-${t}`);
    const panel = document.getElementById(`set-panel-${t}`);

    if (btn && panel) {
      if (t === tab) {
        btn.className = "w-full text-left px-3 py-2.5 rounded-xl font-bold bg-[#D4AF37] text-black";
        panel.classList.remove("hidden");
      } else {
        btn.className = "w-full text-left px-3 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white";
        panel.classList.add("hidden");
      }
    }
  });
}

async function testCurrentServer() {
  const badge = document.getElementById("settings-health-badge");
  if (!badge) return;
  badge.className = "text-[11px] p-2 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/30";
  badge.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> Testing health of ${api.baseUrl}...`;

  try {
    const res = await api.checkHealth();
    if (res.status === "healthy") {
      badge.className = "text-[11px] p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
      badge.innerHTML = `<i class="fas fa-check-circle mr-1"></i> <strong>Online & Healthy!</strong> Database: ${res.database || 'MongoDB'} (${res.mongo_status || 'OK'})`;
    } else {
      badge.className = "text-[11px] p-2 rounded bg-red-500/10 text-red-400 border border-red-500/30";
      badge.innerHTML = `<i class="fas fa-times-circle mr-1"></i> <strong>Offline / Error:</strong> ${res.error || 'Cannot reach server'}`;
    }
  } catch (e) {
    badge.className = "text-[11px] p-2 rounded bg-red-500/10 text-red-400 border border-red-500/30";
    badge.innerHTML = `<i class="fas fa-times-circle mr-1"></i> <strong>Connection Failed:</strong> ${e.message}`;
  }
}

function handleServerSave(e) {
  e.preventDefault();
  const input = document.getElementById("settings-server-url-input");
  if (!input) return;
  const newUrl = input.value.trim().replace(/\/+$/, "");
  if (newUrl) {
    if (typeof window.APP_CONFIG !== "undefined" && window.APP_CONFIG.setApiBaseUrl) {
      window.APP_CONFIG.setApiBaseUrl(newUrl);
    } else {
      localStorage.setItem("ogw_api_base_url", newUrl);
      api.baseUrl = newUrl;
    }
    alert("Backend Server URL updated to: " + newUrl);
    showSettingsTab('server');
    testCurrentServer();
  }
}

function resetToDefaultServer() {
  if (typeof window.APP_CONFIG !== "undefined" && window.APP_CONFIG.resetApiBaseUrl) {
    window.APP_CONFIG.resetApiBaseUrl();
  } else {
    localStorage.removeItem("ogw_api_base_url");
  }
  const input = document.getElementById("settings-server-url-input");
  if (input) input.value = api.baseUrl;
  alert("Reset to default server URL: " + api.baseUrl);
  testCurrentServer();
}

function handleLogoFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    document.getElementById("set-logo-url").value = evt.target.result;
    const preview = document.getElementById("settings-logo-preview");
    if (preview) {
      preview.innerHTML = `<img src="${evt.target.result}" alt="Uploaded Official Logo" class="w-full h-full object-cover rounded-full">`;
    }
  };
  reader.readAsDataURL(file);
}

function handleBusinessSettingsSave(e) {
  e.preventDefault();
  const logoUrl = document.getElementById("set-logo-url").value || "assets/logo.png";
  const businessName = document.getElementById("set-biz-name").value;
  const parentBrand = document.getElementById("set-parent-brand").value;
  const subTitle = document.getElementById("set-subtitle").value;
  const phone = document.getElementById("set-phone").value;
  const email = document.getElementById("set-email").value;
  const address = document.getElementById("set-address").value;
  const gstNumber = document.getElementById("set-gst").value;
  const taxRate = parseFloat(document.getElementById("set-tax").value);
  const currency = document.getElementById("set-currency").value || "₹";
  const receiptFooter = document.getElementById("set-footer").value;

  store.updateSettings({
    logoUrl,
    businessName,
    parentBrand,
    subTitle,
    phone,
    email,
    address,
    gstNumber,
    taxRate,
    currency,
    receiptFooter
  });

  alert("Store Settings Saved Successfully!");
}

function handleSecuritySettingsSave(e) {
  e.preventDefault();
  const ownerPin = document.getElementById("set-owner-pin").value.trim();
  const cashierPin = document.getElementById("set-cashier-pin") ? document.getElementById("set-cashier-pin").value.trim() : "3333";

  store.updateSettings({ ownerPin, cashierPin });
  alert("PIN security codes updated successfully!");
}
