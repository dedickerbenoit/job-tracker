// ── Auth ──

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  suspended_at: string | null;
  email_verified_at: string | null;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  accept_terms: boolean;
  accept_privacy: boolean;
}

export interface AuthResponse {
  data: { user: User; token?: string };
}

// ── Enums (string literals matching backend) ──

export type ApplicationStatus =
  | "to_apply"
  | "applied"
  | "follow_up"
  | "interview"
  | "offer"
  | "rejected";

export type ApplicationSource = "linkedin" | "indeed" | "hellowork" | "manual";

export type ApplicationEventType =
  | "created"
  | "status_changed"
  | "updated"
  | "deleted";

// ── Models ──

export interface Application {
  id: number;
  title: string;
  company: string;
  location: string;
  url: string;
  description?: string | null;
  source: ApplicationSource;
  status: ApplicationStatus;
  status_label: string;
  notes?: string | null;
  applied_at: string | null;
  status_changed_at: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationEvent {
  id: number;
  application_id: number | null;
  type: ApplicationEventType;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface StatsData {
  total: number;
  by_status: Record<ApplicationStatus, number>;
  by_source: Record<ApplicationSource, number>;
}

// ── API Types ──

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface DuplicateWarning {
  type: "duplicate_url";
  message: string;
  duplicates: Application[];
}

export interface CreateApplicationResponse {
  data: Application;
  warning?: DuplicateWarning;
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  source?: ApplicationSource;
  search?: string;
  from_date?: string;
  to_date?: string;
  sort?: string;
  direction?: "asc" | "desc";
  per_page?: number;
  page?: number;
}

export interface TimelineFilters {
  application_id?: number;
  type?: ApplicationEventType;
  from_date?: string;
  to_date?: string;
  per_page?: number;
  page?: number;
}

export interface CreateApplicationData {
  title: string;
  company: string;
  location: string;
  url: string;
  description?: string;
  source: ApplicationSource;
  status?: ApplicationStatus;
  notes?: string;
  applied_at?: string;
}

export type UpdateApplicationData = Partial<CreateApplicationData>;

// ── RGPD ──

export interface Consent {
  id: number;
  consent_type: "terms" | "privacy";
  consented_at: string;
  revoked_at: string | null;
}

export interface DataExport {
  profile: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    updated_at: string;
  };
  applications: (Application & { events: ApplicationEvent[] })[];
  consents: {
    id: number;
    consent_type: string;
    consented_at: string;
    ip_address: string | null;
    user_agent: string | null;
    revoked_at: string | null;
  }[];
}
