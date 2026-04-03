import { create } from 'zustand';
import { toast } from 'sonner';
import { applicationApi } from '@/services/api';
import { STATUS_CONFIG } from '@/lib/constants';
import { t } from '@/lib/i18n';
import type {
  Application,
  ApplicationEvent,
  ApplicationFilters,
  ApplicationStatus,
  CreateApplicationData,
  DuplicateWarning,
  PaginationMeta,
  StatsData,
  TimelineFilters,
  UpdateApplicationData,
} from '@/types';

interface ApplicationState {
  // Data
  applications: Application[];
  selectedApplication: Application | null;
  stats: StatsData | null;
  timelineEvents: ApplicationEvent[];

  // Pagination
  pagination: PaginationMeta | null;
  timelinePagination: PaginationMeta | null;

  // Filters
  filters: ApplicationFilters;
  timelineFilters: TimelineFilters;

  // UI state
  loading: boolean;
  timelineLoading: boolean;
  statsLoading: boolean;
  lastWarning: DuplicateWarning | null;

  // Actions
  setFilters: (filters: ApplicationFilters) => void;
  fetchApplications: (filters?: ApplicationFilters) => Promise<void>;
  fetchApplication: (id: number) => Promise<Application>;
  createApplication: (data: CreateApplicationData) => Promise<Application>;
  updateApplication: (id: number, data: UpdateApplicationData) => Promise<Application>;
  deleteApplication: (id: number) => Promise<void>;
  updateStatus: (id: number, status: ApplicationStatus) => Promise<void>;
  fetchTimeline: (filters?: TimelineFilters) => Promise<void>;
  loadMoreTimeline: () => Promise<void>;
  fetchStats: () => Promise<void>;
  setSelectedApplication: (app: Application | null) => void;
  clearWarning: () => void;
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  // Initial state
  applications: [],
  selectedApplication: null,
  stats: null,
  timelineEvents: [],
  pagination: null,
  timelinePagination: null,
  filters: {},
  timelineFilters: {},
  loading: false,
  timelineLoading: false,
  statsLoading: false,
  lastWarning: null,

  setFilters: (filters) => set({ filters }),

  fetchApplications: async (filters) => {
    const activeFilters = filters ?? get().filters;
    set({ loading: true });
    try {
      const response = await applicationApi.list(activeFilters);
      set({
        applications: response.data,
        pagination: response.meta,
        filters: activeFilters,
      });
    } catch (error) {
      toast.error(t.toast.errorLoading);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchApplication: async (id) => {
    const app = await applicationApi.get(id);
    set({ selectedApplication: app });
    return app;
  },

  createApplication: async (data) => {
    const response = await applicationApi.create(data);
    if (response.warning) {
      set({ lastWarning: response.warning });
    }
    // Refresh list
    await get().fetchApplications();
    return response.data;
  },

  updateApplication: async (id, data) => {
    const app = await applicationApi.update(id, data);
    // Update in local list
    set((state) => ({
      applications: state.applications.map((a) => (a.id === id ? { ...a, ...app } : a)),
      selectedApplication: state.selectedApplication?.id === id ? app : state.selectedApplication,
    }));
    return app;
  },

  deleteApplication: async (id) => {
    await applicationApi.delete(id);
    set((state) => ({
      applications: state.applications.filter((a) => a.id !== id),
      selectedApplication: state.selectedApplication?.id === id ? null : state.selectedApplication,
    }));
  },

  updateStatus: async (id, status) => {
    // Optimistic update with derived status_label
    const previousApps = get().applications;
    const statusLabel = STATUS_CONFIG[status]?.label ?? status;
    set((state) => ({
      applications: state.applications.map((a) =>
        a.id === id ? { ...a, status, status_label: statusLabel } : a,
      ),
    }));

    try {
      const updated = await applicationApi.updateStatus(id, status);
      set((state) => ({
        applications: state.applications.map((a) => (a.id === id ? { ...a, ...updated } : a)),
      }));
    } catch {
      // Rollback on error
      set({ applications: previousApps });
      throw new Error(t.toast.errorStatusChange);
    }
  },

  fetchTimeline: async (filters) => {
    set({ timelineLoading: true, timelineFilters: filters ?? {} });
    try {
      const response = await applicationApi.timeline(filters);
      set({
        timelineEvents: response.data,
        timelinePagination: response.meta,
      });
    } finally {
      set({ timelineLoading: false });
    }
  },

  loadMoreTimeline: async () => {
    const { timelinePagination, timelineFilters } = get();
    if (!timelinePagination || timelinePagination.current_page >= timelinePagination.last_page) return;

    set({ timelineLoading: true });
    try {
      const response = await applicationApi.timeline({
        ...timelineFilters,
        page: timelinePagination.current_page + 1,
      });
      set((state) => ({
        timelineEvents: [...state.timelineEvents, ...response.data],
        timelinePagination: response.meta,
      }));
    } finally {
      set({ timelineLoading: false });
    }
  },

  fetchStats: async () => {
    set({ statsLoading: true });
    try {
      const stats = await applicationApi.stats();
      set({ stats });
    } finally {
      set({ statsLoading: false });
    }
  },

  setSelectedApplication: (app) => set({ selectedApplication: app }),
  clearWarning: () => set({ lastWarning: null }),
}));
