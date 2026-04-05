// API utility for communicating with the backend
// TODO: Use HTTPS in production (current HTTP is for local development only)
const API_BASE_URL = 'http://localhost:8000/api';

import { getFromSession, setInSession, removeFromSession } from './storage.js';

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
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
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

export { apiRequest, apiLogin, apiLogout, apiGetMe, getAuthToken, clearAuthToken, API_BASE_URL };
