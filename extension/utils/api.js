// API utility for communicating with the backend
import {
  getFromStorage,
  getFromSession,
  setInSession,
  removeFromSession,
} from "./storage.js";

const DEFAULT_API_URL = "http://localhost:8000/api/v1";
const DEFAULT_DASHBOARD_URL = "http://localhost:5173";

async function getApiBaseUrl() {
  const customUrl = await getFromStorage("api_base_url");
  const url = customUrl || DEFAULT_API_URL;

  // Enforce HTTPS on non-local hosts
  if (
    url.startsWith("http://") &&
    !url.includes("localhost") &&
    !url.includes("127.0.0.1")
  ) {
    throw new Error(
      "[JobTracker] HTTPS is required for non-local API URLs. " +
        "Using HTTP over the internet exposes your authentication tokens and data to interception. " +
        "Please update your API URL in settings to use HTTPS.",
    );
  }

  return url;
}

// --- Token management via chrome.storage.session (volatile, cleared on browser close) ---

const TOKEN_KEY = "auth_token";

async function getAuthToken() {
  return (await getFromSession(TOKEN_KEY)) || null;
}

async function setAuthToken(token) {
  return setInSession(TOKEN_KEY, token);
}

async function clearAuthToken() {
  return removeFromSession(TOKEN_KEY);
}

// --- API request with auth ---

async function apiRequest(endpoint, options = {}) {
  const token = await getAuthToken();
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Request-Token": "true", // Tell backend to use token mode (not session)
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (response.status === 401) {
    await clearAuthToken();
    const error = new Error("AUTH_REQUIRED");
    error.status = 401;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`API error: ${response.status}`);
    error.status = response.status;
    try {
      error.data = await response.json();
    } catch (e) {
      /* no body */
    }
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

// --- Auth helpers ---

async function apiLogin(email, password) {
  const result = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (result?.data?.token) {
    await setAuthToken(result.data.token);
  }
  return result;
}

async function apiLogout() {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } finally {
    await clearAuthToken();
  }
}

async function apiGetMe() {
  return apiRequest("/auth/me");
}

/**
 * Request a short-lived (60s) one-shot handoff token from the backend.
 * Used to securely pass auth from the extension to the dashboard SPA
 * without exposing the main access token in URL params, logs, or Referer headers.
 */
async function apiCreateHandoffToken() {
  const result = await apiRequest("/auth/create-handoff-token", {
    method: "POST",
  });
  return result?.data?.token || null;
}

async function getDashboardUrl() {
  const customUrl = await getFromStorage("dashboard_url");
  return customUrl || DEFAULT_DASHBOARD_URL;
}

/**
 * Open the dashboard in a new tab, securely handing off authentication.
 * Fetches a short-lived handoff token first, then passes it in the URL
 * fragment (#). Using the hash instead of a query string keeps the token
 * out of server logs and the Referer header. The dashboard's bootstrap
 * script (index.html) strips the hash synchronously on load, so it is
 * never visible in the address bar or browser history.
 * If unauthenticated or handoff fails, opens the dashboard without auth.
 *
 * Known trade-off (accepted):
 *   Between the moment the dashboard tab receives the URL and the moment
 *   its inline bootstrap script runs `history.replaceState()` to strip the
 *   hash, another browser extension running a content script at
 *   `run_at: document_start` could theoretically read `location.hash` and
 *   exfiltrate the token. The attack window is <~10ms. Mitigations in place:
 *     - handoff tokens have a 60s TTL (one-shot; deleted on use server-side),
 *     - tokens carry only the 'handoff' ability (cannot read application data),
 *     - hash is stripped before React mounts or paint occurs.
 *   The alternative (an extension→backend→dashboard cross-origin call with
 *   cookies) is significantly more complex and offers marginal benefit given
 *   that a malicious extension on the same browser can already read the
 *   dashboard's cookies directly.
 */
async function openDashboard() {
  const baseUrl = await getDashboardUrl();
  const dashboardUrl = `${baseUrl}/dashboard`;

  // We request the handoff token AFTER resolving the dashboard URL so the
  // tab is opened as soon as possible after token creation. If the user
  // closes the popup before the tab loads, the token simply expires after
  // 60s (and is pruned by the scheduled cleanup job on the backend).
  let handoffToken = null;
  try {
    handoffToken = await apiCreateHandoffToken();
  } catch (e) {
    // Not authenticated or backend error — open dashboard anyway
  }

  const url = handoffToken
    ? `${dashboardUrl}#auth_token=${encodeURIComponent(handoffToken)}`
    : dashboardUrl;
  chrome.tabs.create({ url });
}

export {
  apiRequest,
  apiLogin,
  apiLogout,
  apiGetMe,
  apiCreateHandoffToken,
  getAuthToken,
  clearAuthToken,
  getApiBaseUrl,
  getDashboardUrl,
  openDashboard,
};
