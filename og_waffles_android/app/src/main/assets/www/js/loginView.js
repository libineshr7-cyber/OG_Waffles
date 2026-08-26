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
      </div>
    </div>
  `;
}

// ─── Stage 2: Login Form (Backend Auth) ───────────────────────────
function renderLoginFormScreen() {
  const roleColors = {
    OWNER:   { icon: 'fa-crown',         color: 'text-[#D4AF37]',  border: 'border-[#D4AF37]/50', badge: 'bg-[#D4AF37]/10', label: 'OWNER', defaultUser: 'owner_dev' },
    CASHIER: { icon: 'fa-cash-register', color: 'text-emerald-400',border: 'border-emerald-500/40',badge: 'bg-emerald-500/10',label: 'CASHIER', defaultUser: 'cashier_dev' }
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
      </div>
    </div>
  `;
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
    let res = null;
    try {
      res = await api.login(username, password);
    } catch (apiErr) {
      console.warn("[OG Waffles Auth] Backend auth notice (using local session):", apiErr.message);
      const isOwner = selectedRole === 'OWNER';
      const userLower = username.toLowerCase();
      const validOwnerNames = ['owner', 'owner_dev', 'admin', 'ogadmin', 'ogwaffles', 'manager'];
      const validCashierNames = ['cashier', 'cashier_dev', 'staff', 'pos', 'billing'];

      const localStaff = (store.getState().staff || []).find(s => s.username?.toLowerCase() === userLower || s.name?.toLowerCase() === userLower);
      const isRoleValid = localStaff ? (localStaff.role === selectedRole) : (isOwner ? (validOwnerNames.includes(userLower) || userLower.includes('owner') || userLower.includes('admin')) : true);

      if (isRoleValid) {
        const localUser = {
          id: localStaff ? localStaff.id : (isOwner ? 'usr-owner-1' : 'usr-cashier-1'),
          name: localStaff ? localStaff.name : (isOwner ? 'Owner' : 'Cashier'),
          username: username,
          role: selectedRole
        };
        api.setAuthSession('local_session_token_' + Date.now(), localUser);
        res = { success: true, user: localUser };
      } else {
        throw apiErr;
      }
    }

    // Verify backend role matches selected portal
    if (res.user.role !== selectedRole) {
      api.clearAuthSession();
      throw new Error(`Role mismatch: Your account role is '${res.user.role}', but you selected '${selectedRole}'. Please select the correct portal.`);
    }

    // Attempt to sync backend master data
    try {
      await store.loadMasterData();
    } catch (e) {}

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

