import { create } from 'zustand';
import { toast } from 'sonner';
import { authApi } from '@/services/api';
import { t } from '@/lib/i18n';
import type { User, LoginData, RegisterData } from '@/types';

type AuthModalTab = 'login' | 'register';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  showAuthModal: boolean;
  authModalTab: AuthModalTab;

  initialize: () => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  openAuthModal: (tab?: AuthModalTab) => void;
  closeAuthModal: () => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  loading: true,
  isAuthenticated: false,
  showAuthModal: false,
  authModalTab: 'login',

  initialize: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({ loading: false, isAuthenticated: false, user: null, token: null });
      return;
    }
    try {
      const user = await authApi.me();
      set({ user, token, isAuthenticated: true, loading: false });
    } catch {
      localStorage.removeItem('auth_token');
      set({ user: null, token: null, isAuthenticated: false, loading: false });
    }
  },

  login: async (data) => {
    const response = await authApi.login(data);
    const { user, token } = response.data;
    localStorage.setItem('auth_token', token);
    set({ user, token, isAuthenticated: true, showAuthModal: false });
    toast.success(t.auth.welcomeBack);
  },

  register: async (data) => {
    const response = await authApi.register(data);
    const { user, token } = response.data;
    localStorage.setItem('auth_token', token);
    set({ user, token, isAuthenticated: true, showAuthModal: false });
    toast.success(t.auth.accountCreated);
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore error — token may already be invalid
    }
    localStorage.removeItem('auth_token');
    set({ user: null, token: null, isAuthenticated: false });
    toast.success(t.auth.loggedOut);
  },

  openAuthModal: (tab = 'login') => {
    set({ showAuthModal: true, authModalTab: tab });
  },

  closeAuthModal: () => {
    set({ showAuthModal: false });
  },

  clearAuth: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
