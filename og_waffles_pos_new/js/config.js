/* OG Waffles & Fried Chicken - Global POS Configuration */
window.APP_CONFIG = {
  APP_NAME: "OG Waffles & Fried Chicken POS",
  VERSION: "5.0.0",
  // Live Deployed Render Backend URL
  DEFAULT_API_URL: "https://og-waffles-r7hf.onrender.com",
  LOCAL_API_URL: "http://127.0.0.1:8000",

  // Dynamic API Base URL resolver: Checks localStorage first, then detects local host, then defaults to live Render backend
  getApiBaseUrl() {
    const saved = localStorage.getItem("ogw_api_base_url");
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, "");
    }
    // If running in browser
    if (typeof window !== "undefined" && window.location) {
      const port = window.location.port;
      const hn = window.location.hostname;
      // If port is 8000 (FastAPI serving directly)
      if (port === "8000" && (hn === "localhost" || hn === "127.0.0.1")) {
        return window.location.origin;
      }
      // If opened from local live server or file:
      if (hn === "localhost" || hn === "127.0.0.1" || window.location.protocol === "file:") {
        return this.LOCAL_API_URL; // "http://127.0.0.1:8000"
      }
    }
    // Production web or Android APK
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
