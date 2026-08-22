/* OG Waffles & Fried Chicken - Global POS Configuration */
window.APP_CONFIG = {
  APP_NAME: "OG Waffles & Fried Chicken POS",
  VERSION: "5.0.0",
  // Live Deployed Render Backend URL
  DEFAULT_API_URL: "https://og-waffles.onrender.com",
  LOCAL_API_URL: "http://127.0.0.1:8001",

  // Dynamic API Base URL resolver: Checks localStorage first, then default URL
  getApiBaseUrl() {
    const saved = localStorage.getItem("ogw_api_base_url");
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, "");
    }
    // If running inside Android WebView or production web, return live Render backend
    return this.DEFAULT_API_URL;
  },

  setApiBaseUrl(url) {
    if (url) {
      const cleanUrl = url.trim().replace(/\/+$/, "");
      localStorage.setItem("ogw_api_base_url", cleanUrl);
      if (typeof api !== "undefined") {
        api.baseUrl = cleanUrl;
      }
      return cleanUrl;
    }
  },

  resetApiBaseUrl() {
    localStorage.removeItem("ogw_api_base_url");
    if (typeof api !== "undefined") {
      api.baseUrl = this.getApiBaseUrl();
    }
  }
};

window.API_BASE_URL = window.APP_CONFIG.getApiBaseUrl();
