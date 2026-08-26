/* OG Waffles & Fried Chicken - Centralized API & Authentication Engine */

const api = {
  get baseUrl() {
    if (typeof window.APP_CONFIG !== "undefined" && window.APP_CONFIG.getApiBaseUrl) {
      return window.APP_CONFIG.getApiBaseUrl();
    }
    return localStorage.getItem("ogw_api_base_url") || window.API_BASE_URL || "http://127.0.0.1:8001";
  },

  set baseUrl(val) {
    if (val) {
      const clean = val.trim().replace(/\/+$/, "");
      localStorage.setItem("ogw_api_base_url", clean);
      window.API_BASE_URL = clean;
    }
  },

  async checkHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`, { method: "GET" });
      return await res.json();
    } catch (e) {
      return { status: "offline", error: e.message };
    }
  },

  // ── 1. Storage Helpers ──
  getToken() {
    return localStorage.getItem("ogw_access_token") || null;
  },

  setAuthSession(token, user) {
    if (token) {
      localStorage.setItem("ogw_access_token", token);
    }
    if (user) {
      const cleanUser = {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role
      };
      localStorage.setItem("ogw_user", JSON.stringify(cleanUser));
      if (typeof store !== "undefined" && store.state) {
        store.state.currentUser = cleanUser;
        store.saveState();
      }
    }
  },

  clearAuthSession() {
    localStorage.removeItem("ogw_access_token");
    localStorage.removeItem("ogw_user");
    if (typeof store !== "undefined" && store.state) {
      store.state.currentUser = null;
      store.saveState();
    }
  },

  getCurrentUser() {
    const raw = localStorage.getItem("ogw_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  isAuthenticated() {
    return Boolean(this.getToken() && this.getCurrentUser());
  },

  getRole() {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  },

  // ── 2. Centralized Fetch Wrapper with 401/403 Handling ──
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith("http") ? endpoint : `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized: Session expired or invalid token
      if (response.status === 401) {
        console.warn("[OG Waffles API] 401 Unauthorized notice from", endpoint);
        const currentTok = this.getToken();
        if (currentTok && !currentTok.startsWith("local_")) {
          this.clearAuthSession();
        }
        throw new Error("Session expired or unauthorized.");
      }

      // Handle 403 Forbidden: User does not have permission for this action
      if (response.status === 403) {
        console.warn("[OG Waffles API] 403 Forbidden — Action not permitted for this role");
        const errorData = await response.json().catch(() => ({ detail: "Access Forbidden" }));
        throw new Error(errorData.detail || "You do not have permission to perform this action.");
      }

      if (response.status === 204) {
        return { success: true };
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data.detail || (typeof data === "string" ? data : `Request failed with status ${response.status}`);
        throw new Error(errorMsg);
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // ── 3. Core Authentication APIs ──
  async login(username, password) {
    const data = await this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });

    if (data.access_token) {
      this.setAuthSession(data.access_token, {
        id: data.user_id || 1,
        name: data.name || username,
        username: username,
        role: data.role
      });
      return {
        success: true,
        user: this.getCurrentUser(),
        token: data.access_token
      };
    }
    throw new Error("Login failed: invalid response from server.");
  },

  async fetchMe() {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    if (token.startsWith("local_")) {
      return this.getCurrentUser();
    }

    try {
      const user = await this.request("/api/auth/me", { method: "GET" });
      if (user && user.username) {
        this.setAuthSession(token, user);
        return user;
      }
      return this.getCurrentUser();
    } catch (e) {
      console.warn("[OG Waffles API] fetchMe background notice:", e.message);
      return this.getCurrentUser();
    }
  },

  async logout() {
    try {
      if (this.getToken()) {
        await this.request("/api/auth/logout", { method: "POST" });
      }
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      this.clearAuthSession();
    }
  },

  // ── Helper for Query String ──
  _buildQuery(params = {}) {
    const keys = Object.keys(params).filter(k => params[k] !== undefined && params[k] !== null && params[k] !== "");
    if (keys.length === 0) return "";
    const qs = keys.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join("&");
    return `?${qs}`;
  },

  // ── 4. Categories API ──
  categories: {
    async list(params = {}) {
      const qs = api._buildQuery(params);
      return await api.request(`/api/categories${qs}`, { method: "GET" });
    },
    async create(data) {
      return await api.request("/api/categories", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    async update(id, data) {
      return await api.request(`/api/categories/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },
    async delete(id) {
      return await api.request(`/api/categories/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
    }
  },

  // ── 5. Products API ──
  products: {
    async list(params = {}) {
      const qs = api._buildQuery(params);
      return await api.request(`/api/products${qs}`, { method: "GET" });
    },
    async get(id) {
      return await api.request(`/api/products/${encodeURIComponent(id)}`, { method: "GET" });
    },
    async create(data) {
      return await api.request("/api/products", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    async update(id, data) {
      return await api.request(`/api/products/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },
    async delete(id) {
      return await api.request(`/api/products/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
    }
  },

  // ── Image Upload API ──
  async uploadImage(file) {
    const formData = new FormData();
    formData.append("file", file);

    const token = this.getToken();
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const url = `${this.baseUrl}/api/upload`;
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData
    });

    if (!res.ok) {
      let errDetail = "Upload failed";
      try {
        const errJson = await res.json();
        errDetail = errJson.detail || errDetail;
      } catch (e) {}
      throw new Error(errDetail);
    }

    return await res.json();
  },

  // ── 6. Inventory API ──
  inventory: {
    async list(params = {}) {
      const qs = api._buildQuery(params);
      return await api.request(`/api/inventory${qs}`, { method: "GET" });
    },
    async get(id) {
      return await api.request(`/api/inventory/${encodeURIComponent(id)}`, { method: "GET" });
    },
    async create(data) {
      return await api.request("/api/inventory", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    async update(id, data) {
      return await api.request(`/api/inventory/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },
    async delete(id) {
      return await api.request(`/api/inventory/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
    },
    async adjust(id, data) {
      return await api.request(`/api/inventory/${encodeURIComponent(id)}/adjust`, {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    async waste(id, data) {
      return await api.request(`/api/inventory/${encodeURIComponent(id)}/waste`, {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    async movements(params = {}) {
      const qs = api._buildQuery(params);
      return await api.request(`/api/inventory/movements${qs}`, { method: "GET" });
    }
  },

  // ── 7. Suppliers API ──
  suppliers: {
    async list(params = {}) {
      const qs = api._buildQuery(params);
      return await api.request(`/api/suppliers${qs}`, { method: "GET" });
    },
    async create(data) {
      return await api.request("/api/suppliers", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    async update(id, data) {
      return await api.request(`/api/suppliers/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },
    async delete(id) {
      return await api.request(`/api/suppliers/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
    }
  },

  // ── 8. Sales & Billing API ──
  sales: {
    async create(data) {
      return await api.request("/api/sales", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    async list(params = {}) {
      const qs = api._buildQuery(params);
      return await api.request(`/api/sales${qs}`, { method: "GET" });
    },
    async get(id) {
      return await api.request(`/api/sales/${encodeURIComponent(id)}`, { method: "GET" });
    },
    async items(id) {
      return await api.request(`/api/sales/${encodeURIComponent(id)}/items`, { method: "GET" });
    },
    async payment(id) {
      return await api.request(`/api/sales/${encodeURIComponent(id)}/payment`, { method: "GET" });
    },
    async today(params = {}) {
      const qs = api._buildQuery(params);
      return await api.request(`/api/sales/today${qs}`, { method: "GET" });
    },
    async summary(params = {}) {
      const qs = api._buildQuery(params);
      return await api.request(`/api/sales/summary${qs}`, { method: "GET" });
    },
    async cancel(id) {
      return await api.request(`/api/sales/${encodeURIComponent(id)}/cancel`, {
        method: "POST"
      });
    },
    async resetToday() {
      return await api.request("/api/sales/today/reset", {
        method: "DELETE"
      });
    }
  },

  // ── 9. Customers & Loyalty API ──
  customers: {
    async list(params = {}) {
      const qs = api._buildQuery(params);
      return await api.request(`/api/customers${qs}`, { method: "GET" });
    },
    async search(params = {}) {
      const qs = api._buildQuery(params);
      return await api.request(`/api/customers/search${qs}`, { method: "GET" });
    },
    async get(id) {
      return await api.request(`/api/customers/${encodeURIComponent(id)}`, { method: "GET" });
    },
    async create(data) {
      return await api.request("/api/customers", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    async update(id, data) {
      return await api.request(`/api/customers/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },
    async delete(id) {
      return await api.request(`/api/customers/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
    },
    async sales(id) {
      return await api.request(`/api/customers/${encodeURIComponent(id)}/sales`, { method: "GET" });
    },
    async rewards(id) {
      return await api.request(`/api/customers/${encodeURIComponent(id)}/rewards`, { method: "GET" });
    },
    async rewardVisit(id, data) {
      return await api.request(`/api/customers/${encodeURIComponent(id)}/reward-visit`, {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    async redeem(id, data = {}) {
      return await api.request(`/api/customers/${encodeURIComponent(id)}/redeem`, {
        method: "POST",
        body: JSON.stringify(data)
      });
    }
  },

  // ── 10. Purchases API ──
  purchases: {
    async list(params = {}) {
      const qs = api._buildQuery(params);
      return await api.request(`/api/purchases${qs}`, { method: "GET" });
    },
    async get(id) {
      return await api.request(`/api/purchases/${encodeURIComponent(id)}`, { method: "GET" });
    },
    async create(data) {
      return await api.request("/api/purchases", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    async bySupplier(supplierId) {
      return await api.request(`/api/suppliers/${encodeURIComponent(supplierId)}/purchases`, { method: "GET" });
    }
  },

  // ── 11. Expenses API ──
  expenses: {
    async list(params = {}) {
      const qs = api._buildQuery(params);
      return await api.request(`/api/expenses${qs}`, { method: "GET" });
    },
    async get(id) {
      return await api.request(`/api/expenses/${encodeURIComponent(id)}`, { method: "GET" });
    },
    async create(data) {
      return await api.request("/api/expenses", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    async update(id, data) {
      return await api.request(`/api/expenses/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },
    async delete(id) {
      return await api.request(`/api/expenses/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
    }
  },

  // ── 12. Dashboard API ──
  dashboard: {
    async get() {
      return await api.request("/api/dashboard", { method: "GET" });
    }
  },

  // ── 13. Reports API ──
  reports: {
    async today() {
      return await api.request("/api/reports/today", { method: "GET" });
    },
    async sales(params = {}) {
      const qs = api._buildQuery(params);
      return await api.request(`/api/reports/sales${qs}`, { method: "GET" });
    },
    async products(params = {}) {
      const qs = api._buildQuery(params);
      return await api.request(`/api/reports/products${qs}`, { method: "GET" });
    },
    async categories(params = {}) {
      const qs = api._buildQuery(params);
      return await api.request(`/api/reports/categories${qs}`, { method: "GET" });
    },
    async expenses(params = {}) {
      const qs = api._buildQuery(params);
      return await api.request(`/api/reports/expenses${qs}`, { method: "GET" });
    },
    async purchases(params = {}) {
      const qs = api._buildQuery(params);
      return await api.request(`/api/reports/purchases${qs}`, { method: "GET" });
    },
    async profit(params = {}) {
      const qs = api._buildQuery(params);
      return await api.request(`/api/reports/profit${qs}`, { method: "GET" });
    },
    async inventoryValuation() {
      return await api.request("/api/reports/inventory-value", { method: "GET" });
    },
    async salesTrend(params = {}) {
      const qs = api._buildQuery(params);
      return await api.request(`/api/reports/sales-trend${qs}`, { method: "GET" });
    },
    async topProducts(params = {}) {
      const qs = api._buildQuery(params);
      return await api.request(`/api/reports/top-products${qs}`, { method: "GET" });
    }
  }
};



