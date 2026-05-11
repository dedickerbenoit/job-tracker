import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import type {
  Application,
  ApplicationEvent,
  ApplicationFilters,
  AuthResponse,
  CreateApplicationData,
  CreateApplicationResponse,
  DataExport,
  LoginData,
  PaginatedResponse,
  RegisterData,
  StatsData,
  TimelineFilters,
  UpdateApplicationData,
  ApplicationStatus,
  User,
} from "@/types";

// ── Axios instance ──

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  withCredentials: true, // Enable cookies for Sanctum SPA mode
  withXSRFToken: true, // Automatically include XSRF token from cookies
});

// Silent requests bypass the modal-opening branch of the 401 interceptor.
// Used for bootstrap auth probes (e.g. /auth/me on page load) where a 401
// is expected for anonymous visitors and must not prompt a login modal.
interface SilentRequestConfig extends InternalAxiosRequestConfig {
  silent?: boolean;
}

// Callback set by the auth store to handle 401 responses.
// Avoids a circular chunk dependency (api → authStore → api) that breaks
// the production build when Rolldown splits authStore into its own chunk.
let onUnauthorized: ((silent: boolean) => void) | null = null;

export function setOnUnauthorized(cb: (silent: boolean) => void): void {
  onUnauthorized = cb;
}

// Error interceptor — clear auth on 401 and open login modal
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isSilent =
        (error.config as SilentRequestConfig | undefined)?.silent === true;
      onUnauthorized?.(isSilent);
    }
    return Promise.reject(error);
  },
);

// ── Helper: clean undefined params ──

function cleanParams(
  params: Record<string, unknown>,
): Record<string, string | number> {
  const cleaned: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      cleaned[key] = value as string | number;
    }
  }
  return cleaned;
}

// ── Applications API ──

export const applicationApi = {
  list(
    filters: ApplicationFilters = {},
  ): Promise<PaginatedResponse<Application>> {
    return api
      .get("/applications", {
        params: cleanParams(filters as Record<string, unknown>),
      })
      .then((r) => r.data);
  },

  get(id: number): Promise<Application> {
    return api.get(`/applications/${id}`).then((r) => r.data.data ?? r.data);
  },

  create(data: CreateApplicationData): Promise<CreateApplicationResponse> {
    return api.post("/applications", data).then((r) => r.data);
  },

  update(id: number, data: UpdateApplicationData): Promise<Application> {
    return api
      .put(`/applications/${id}`, data)
      .then((r) => r.data.data ?? r.data);
  },

  delete(id: number): Promise<void> {
    return api.delete(`/applications/${id}`).then(() => undefined);
  },

  updateStatus(id: number, status: ApplicationStatus): Promise<Application> {
    return api
      .patch(`/applications/${id}/status`, { status })
      .then((r) => r.data.data ?? r.data);
  },

  timeline(
    filters: TimelineFilters = {},
  ): Promise<PaginatedResponse<ApplicationEvent>> {
    return api
      .get("/applications/timeline", {
        params: cleanParams(filters as Record<string, unknown>),
      })
      .then((r) => r.data);
  },

  stats(): Promise<StatsData> {
    return api.get("/applications/stats").then((r) => r.data.data ?? r.data);
  },
};

// ── CSRF Cookie Helper ──

/**
 * Retrieves CSRF cookie from backend.
 * Must be called before any mutating request (login, register, etc.)
 * when using Sanctum SPA mode with cookies.
 */
export async function getCsrfCookie(): Promise<void> {
  // Sanctum CSRF endpoint is at /sanctum/csrf-cookie (not /api/v1/sanctum/csrf-cookie)
  // Strip versioned path first, then fallback to unversioned (for custom VITE_API_URL without /v1)
  const csrfUrl =
    BASE_URL.replace("/api/v1", "").replace("/api", "") +
    "/sanctum/csrf-cookie";
  await axios.get(csrfUrl, { withCredentials: true });
}

// ── Account API (RGPD) ──

export const accountApi = {
  exportData(): Promise<DataExport> {
    return api.get("/account/data-export").then((r) => r.data.data ?? r.data);
  },

  suspendAccount(): Promise<void> {
    return api.post("/account/suspend").then(() => undefined);
  },

  deleteAccount(): Promise<void> {
    return api.delete("/account").then(() => undefined);
  },
};

// ── Auth API ──

export const authApi = {
  async login(data: LoginData): Promise<AuthResponse> {
    await getCsrfCookie();
    return api.post("/auth/login", data).then((r) => r.data);
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    await getCsrfCookie();
    return api.post("/auth/register", data).then((r) => r.data);
  },

  logout(): Promise<void> {
    return api.post("/auth/logout").then(() => undefined);
  },

  me(): Promise<User> {
    // silent: 401 here is expected for anonymous visitors — do not open modal
    return api
      .get("/auth/me", { silent: true } as SilentRequestConfig)
      .then((r) => r.data.data);
  },

  async tokenLogin(token: string): Promise<User> {
    await getCsrfCookie();
    return api
      .post(
        "/auth/token-login",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      .then((r) => r.data.data.user);
  },
};
