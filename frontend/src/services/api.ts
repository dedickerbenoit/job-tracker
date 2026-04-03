import axios from 'axios';
import type {
  Application,
  ApplicationEvent,
  ApplicationFilters,
  CreateApplicationData,
  CreateApplicationResponse,
  PaginatedResponse,
  StatsData,
  TimelineFilters,
  UpdateApplicationData,
  ApplicationStatus,
} from '@/types';

// ── Axios instance ──

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// Auth interceptor — injects token from localStorage
// Placeholder for EPIC-01: will be replaced by real auth flow
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token') || import.meta.env.VITE_DEV_TOKEN;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // TODO EPIC-01: redirect to login
    }
    return Promise.reject(error);
  },
);

// ── Helper: clean undefined params ──

function cleanParams(params: Record<string, unknown>): Record<string, string | number> {
  const cleaned: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value as string | number;
    }
  }
  return cleaned;
}

// ── Applications API ──

export const applicationApi = {
  list(filters: ApplicationFilters = {}): Promise<PaginatedResponse<Application>> {
    return api.get('/applications', { params: cleanParams(filters as Record<string, unknown>) })
      .then((r) => r.data);
  },

  get(id: number): Promise<Application> {
    return api.get(`/applications/${id}`).then((r) => r.data.data ?? r.data);
  },

  create(data: CreateApplicationData): Promise<CreateApplicationResponse> {
    return api.post('/applications', data).then((r) => r.data);
  },

  update(id: number, data: UpdateApplicationData): Promise<Application> {
    return api.put(`/applications/${id}`, data).then((r) => r.data.data ?? r.data);
  },

  delete(id: number): Promise<void> {
    return api.delete(`/applications/${id}`).then(() => undefined);
  },

  updateStatus(id: number, status: ApplicationStatus): Promise<Application> {
    return api.patch(`/applications/${id}/status`, { status }).then((r) => r.data.data ?? r.data);
  },

  timeline(filters: TimelineFilters = {}): Promise<PaginatedResponse<ApplicationEvent>> {
    return api.get('/applications/timeline', { params: cleanParams(filters as Record<string, unknown>) })
      .then((r) => r.data);
  },

  stats(): Promise<StatsData> {
    return api.get('/applications/stats').then((r) => r.data.data ?? r.data);
  },
};
