// API utility for communicating with the backend
import { getFromStorage, getFromSession, setInSession, removeFromSession } from './storage.js';

const DEFAULT_API_URL = 'http://localhost:8000/api';

async function getApiBaseUrl() {
  const customUrl = await getFromStorage('api_base_url');
  const url = customUrl || DEFAULT_API_URL;

  // Enforce HTTPS on non-local hosts
  if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    throw new Error(
      '[JobTracker] HTTPS is required for non-local API URLs. ' +
      'Using HTTP over the internet exposes your authentication tokens and data to interception. ' +
      'Please update your API URL in settings to use HTTPS.'
    );
  }

  return url;
}

// --- Token management via chrome.storage.session (volatile, cleared on browser close) ---

const TOKEN_KEY = 'auth_token';

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
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Request-Token': 'true', // Tell backend to use token mode (not session)
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (response.status === 401) {
    await clearAuthToken();
    const error = new Error('AUTH_REQUIRED');
    error.status = 401;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`API error: ${response.status}`);
    error.status = response.status;
    try { error.data = await response.json(); } catch (e) { /* no body */ }
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

// --- Auth helpers ---

async function apiLogin(email, password) {
  const result = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (result?.data?.token) {
    await setAuthToken(result.data.token);
  }
  return result;
}

async function apiLogout() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } finally {
    await clearAuthToken();
  }
}

async function apiGetMe() {
  return apiRequest('/auth/me');
}

export { apiRequest, apiLogin, apiLogout, apiGetMe, getAuthToken, clearAuthToken, getApiBaseUrl };
