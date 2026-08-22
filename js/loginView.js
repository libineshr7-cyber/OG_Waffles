/* OG Waffles & Fried Chicken - Role Login View (Owner & Cashier Only) */

let selectedRole  = null;
let loginStage    = 'select'; // 'select' | 'form'

function renderLoginView() {
  loginStage   = 'select';
  selectedRole = null;
  return renderLoginStage();
}

function renderLoginStage() {
  if (loginStage === 'select') {
    return renderRoleSelectScreen();
  }
  return renderLoginFormScreen();
}

// ─── Stage 1: Role Choice (OWNER vs CASHIER) ─────────────────────
function renderRoleSelectScreen() {
  return `
    <div class="min-h-screen bg-[#0B0B0B] flex items-center justify-center p-4 relative overflow-hidden">
      <!-- Background Ambient Glow -->
      <div class="absolute w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div class="w-full max-w-md glass-card p-8 space-y-6 relative z-10 border border-[#D4AF37]/40 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <!-- Logo Branding Header -->
        <div class="text-center flex flex-col items-center space-y-2 pb-4 border-b border-gray-800">
          ${renderLogo('large', true)}
          <span class="text-xs text-[#D4AF37] font-semibold tracking-widest uppercase mt-2">Management Portal</span>
        </div>

        <p class="text-center text-gray-400 text-sm font-medium">Choose your login portal</p>

        <!-- Two primary role buttons -->
        <div class="grid grid-cols-2 gap-4">
          <button id="portal-btn-owner" onclick="choosePortal('OWNER')"
            class="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-b from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/50 hover:border-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all group">
            <div class="w-14 h-14 rounded-full bg-gradient-to-br from-[#BF953F] to-[#AA771C] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <i class="fas fa-crown text-2xl text-black"></i>
            </div>
            <div class="text-center">
              <p class="font-extrabold text-[#D4AF37] text-sm tracking-wider">OWNER</p>
              <p class="text-[10px] text-gray-500 mt-0.5">Full System Access</p>
            </div>
          </button>

          <button id="portal-btn-cashier" onclick="choosePortal('CASHIER')"
            class="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-b from-emerald-500/10 to-transparent border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/15 transition-all group">
            <div class="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <i class="fas fa-cash-register text-2xl text-white"></i>
            </div>
            <div class="text-center">
              <p class="font-extrabold text-emerald-400 text-sm tracking-wider">CASHIER</p>
              <p class="text-[10px] text-gray-500 mt-0.5">Billing &amp; Customers</p>
            </div>
          </button>
        </div>

        <!-- Server Connection Status & Config Button -->
        <div class="pt-2 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
          <div class="flex items-center gap-1.5 truncate max-w-[240px]">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
            <span class="truncate" title="${api.baseUrl}">Server: ${api.baseUrl.replace(/^https?:\/\//, '')}</span>
          </div>
          <button type="button" onclick="openServerConfigModal()" class="text-[#D4AF37] hover:underline font-medium flex items-center gap-1">
            <i class="fas fa-cog text-[10px]"></i> Change
          </button>
        </div>
      </div>

      <!-- Server Config Modal -->
      <div id="server-config-modal" class="hidden fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div class="glass-card max-w-sm w-full p-6 space-y-4 border border-[#D4AF37]/40 shadow-2xl">
          <div class="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 class="text-sm font-bold text-[#D4AF37] flex items-center gap-2">
              <i class="fas fa-server"></i> Server Configuration
            </h3>
            <button onclick="closeServerConfigModal()" class="text-gray-500 hover:text-white">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Backend API URL</label>
            <input id="server-url-input" type="url" value="${api.baseUrl}" placeholder="https://og-waffles-backend.onrender.com" class="input-gold text-xs">
            <p class="text-[10px] text-gray-500 mt-1">Enter your deployed Render backend URL or local server IP.</p>
          </div>
          <div id="server-test-result" class="hidden text-xs p-2 rounded"></div>
          <div class="flex gap-2">
            <button type="button" onclick="testServerConnection()" class="flex-1 py-2 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-white border border-gray-700">
              <i class="fas fa-plug mr-1"></i> Test Connection
            </button>
            <button type="button" onclick="saveServerConfig()" class="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-[#AA7C11] to-[#D4AF37] text-black font-bold text-xs">
              <i class="fas fa-save mr-1"></i> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ─── Stage 2: Login Form (Backend Auth) ───────────────────────────
function renderLoginFormScreen() {
  const roleColors = {
    OWNER:   { icon: 'fa-crown',         color: 'text-[#D4AF37]',  border: 'border-[#D4AF37]/50', badge: 'bg-[#D4AF37]/10', label: 'OWNER', defaultUser: 'owner_dev', defaultPass: 'owner123' },
    CASHIER: { icon: 'fa-cash-register', color: 'text-emerald-400',border: 'border-emerald-500/40',badge: 'bg-emerald-500/10',label: 'CASHIER', defaultUser: 'cashier_dev', defaultPass: 'cashier123' }
  };
  const rc = roleColors[selectedRole] || roleColors.OWNER;

  return `
    <div class="min-h-screen bg-[#0B0B0B] flex items-center justify-center p-4 relative overflow-hidden">
      <div class="absolute w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div class="w-full max-w-md glass-card p-8 space-y-6 relative z-10 border border-[#D4AF37]/40 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <!-- Logo -->
        <div class="text-center flex flex-col items-center space-y-2 pb-4 border-b border-gray-800">
          ${renderLogo('large', true)}
        </div>

        <!-- Role badge -->
        <div class="flex items-center justify-between">
          <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${rc.badge} border ${rc.border} text-xs ${rc.color} font-semibold">
            <i class="fas ${rc.icon}"></i> ${rc.label} LOGIN
          </span>
          <button onclick="backToRoleSelect()" class="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            <i class="fas fa-arrow-left mr-1"></i> Back
          </button>
        </div>

        <!-- Form Error Banner -->
        <div id="login-error-banner" class="hidden p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium"></div>

        <!-- Backend Authentication Form -->
        <form onsubmit="handleLoginSubmit(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-300 mb-1">
              Username
            </label>
            <input id="login-username"
              type="text"
              required
              value="${rc.defaultUser}"
              autocomplete="username"
              placeholder="Username"
              class="input-gold text-sm">
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-300 mb-1">
              Password / Security PIN
            </label>
            <input id="login-password"
              type="password"
              required
              autocomplete="current-password"
              placeholder="••••••••"
              autofocus
              class="input-gold text-sm font-mono">
          </div>

          <button id="login-submit-btn" type="submit" class="w-full btn-gold-solid py-3 text-sm">
            <i class="fas fa-sign-in-alt mr-1"></i> Access ${rc.label} Portal
          </button>
        </form>

        <!-- Quick Demo Credentials -->
        <div class="p-3 rounded-xl bg-black/40 border border-[#D4AF37]/20 text-[11px] text-gray-400 space-y-1.5">
          <p class="font-bold text-[#D4AF37] text-xs">Development Credentials:</p>
          <div class="grid grid-cols-2 gap-2 text-center mt-1">
            <div class="bg-black/50 rounded-lg p-2 border border-[#D4AF37]/20 cursor-pointer hover:bg-[#D4AF37]/10" onclick="fillCredentials('owner_dev', 'owner123')">
              <i class="fas fa-crown text-[#D4AF37] block mb-1"></i>
              <p class="font-bold text-white text-[10px]">OWNER</p>
              <code class="text-[#D4AF37] font-mono text-[9px] block">owner_dev</code>
              <code class="text-gray-400 font-mono text-[9px] block">owner123</code>
            </div>
            <div class="bg-black/50 rounded-lg p-2 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/10" onclick="fillCredentials('cashier_dev', 'cashier123')">
              <i class="fas fa-cash-register text-emerald-400 block mb-1"></i>
              <p class="font-bold text-white text-[10px]">CASHIER</p>
              <code class="text-emerald-400 font-mono text-[9px] block">cashier_dev</code>
              <code class="text-gray-400 font-mono text-[9px] block">cashier123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function fillCredentials(username, password) {
  const uInput = document.getElementById('login-username');
  const pInput = document.getElementById('login-password');
  if (uInput) uInput.value = username;
  if (pInput) {
    pInput.value = password;
    pInput.focus();
  }
}

function choosePortal(role) {
  if (role !== 'OWNER' && role !== 'CASHIER') return;
  selectedRole = role;
  loginStage   = 'form';
  const app = document.getElementById('app');
  if (app) app.innerHTML = renderLoginFormScreen();
  const pass = document.getElementById('login-password');
  if (pass) setTimeout(() => pass.focus(), 50);
}

function backToRoleSelect() {
  loginStage   = 'select';
  selectedRole = null;
  const app = document.getElementById('app');
  if (app) app.innerHTML = renderRoleSelectScreen();
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errBanner = document.getElementById('login-error-banner');
  const submitBtn = document.getElementById('login-submit-btn');

  if (errBanner) errBanner.classList.add('hidden');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Authenticating...';
  }

  try {
    const res = await api.login(username, password);

    // Verify backend role matches selected portal
    if (res.user.role !== selectedRole) {
      api.clearAuthSession();
      throw new Error(`Role mismatch: Your account role is '${res.user.role}', but you selected '${selectedRole}'. Please select the correct portal.`);
    }

    // Load authoritative backend master data
    await store.loadMasterData();

    // Success -> Navigate to role landing view
    if (res.user.role === 'CASHIER') {
      navigate('pos');
    } else {
      navigate('dashboard');
    }
  } catch (err) {
    console.error('[OG Waffles Auth Error]', err);
    if (errBanner) {
      errBanner.textContent = err.message || 'Login failed. Please check your credentials.';
      errBanner.classList.remove('hidden');
    } else {
      alert(err.message || 'Login failed.');
    }

    const passInput = document.getElementById('login-password');
    if (passInput) {
      passInput.value = '';
      passInput.classList.add('border-red-500');
      setTimeout(() => passInput.classList.remove('border-red-500'), 2000);
      passInput.focus();
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fas fa-sign-in-alt mr-1"></i> Access ${selectedRole} Portal`;
    }
  }
}

// ─── Server Config Modal Functions ────────────────────────────────
function openServerConfigModal() {
  const modal = document.getElementById('server-config-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeServerConfigModal() {
  const modal = document.getElementById('server-config-modal');
  if (modal) modal.classList.add('hidden');
}

async function testServerConnection() {
  const input = document.getElementById('server-url-input');
  const resultDiv = document.getElementById('server-test-result');
  if (!input || !resultDiv) return;

  const testUrl = input.value.trim().replace(/\/+$/, '');
  resultDiv.className = 'text-xs p-2 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/30';
  resultDiv.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Testing connection to ' + testUrl + '...';
  resultDiv.classList.remove('hidden');

  try {
    const res = await fetch(`${testUrl}/api/health`, { method: 'GET' });
    const data = await res.json();
    if (res.ok && data.status === 'healthy') {
      resultDiv.className = 'text-xs p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      resultDiv.innerHTML = `<i class="fas fa-check-circle mr-1"></i> Connected! Database: ${data.database || 'MongoDB'} (${data.mongo_status || 'OK'})`;
    } else {
      resultDiv.className = 'text-xs p-2 rounded bg-red-500/10 text-red-400 border border-red-500/30';
      resultDiv.innerHTML = `<i class="fas fa-exclamation-triangle mr-1"></i> Server responded with status ${res.status}`;
    }
  } catch (err) {
    resultDiv.className = 'text-xs p-2 rounded bg-red-500/10 text-red-400 border border-red-500/30';
    resultDiv.innerHTML = `<i class="fas fa-times-circle mr-1"></i> Connection failed: ${err.message}`;
  }
}

function saveServerConfig() {
  const input = document.getElementById('server-url-input');
  if (!input) return;
  const newUrl = input.value.trim().replace(/\/+$/, '');
  if (newUrl) {
    if (typeof window.APP_CONFIG !== 'undefined' && window.APP_CONFIG.setApiBaseUrl) {
      window.APP_CONFIG.setApiBaseUrl(newUrl);
    } else {
      localStorage.setItem('ogw_api_base_url', newUrl);
      api.baseUrl = newUrl;
    }
    closeServerConfigModal();
    if (typeof render === 'function') render();
  }
}

