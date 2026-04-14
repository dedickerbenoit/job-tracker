import { create } from 'zustand';
import { toast } from 'sonner';
import { authApi } from '@/services/api';
import { t } from '@/lib/i18n';
import type { User, LoginData, RegisterData } from '@/types';

type AuthModalTab = 'login' | 'register';

interface AuthState {
  user: User | null;
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
  loading: true,
  isAuthenticated: false,
  showAuthModal: false,
  authModalTab: 'login',

  initialize: async () => {
    // Check authentication by calling /auth/me
    // Sanctum will validate the session cookie
    try {
      const user = await authApi.me();
      set({ user, isAuthenticated: true, loading: false });
    } catch {
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },

  login: async (data) => {
    const response = await authApi.login(data);
    const { user } = response.data;
    // Session cookie is set automatically by Sanctum
    set({ user, isAuthenticated: true, showAuthModal: false });
    toast.success(t.auth.welcomeBack);
  },

  register: async (data) => {
    const response = await authApi.register(data);
    const { user } = response.data;
    // Session cookie is set automatically by Sanctum
    set({ user, isAuthenticated: true, showAuthModal: false });
    toast.success(t.auth.accountCreated);
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore error — session may already be invalid
    }
    set({ user: null, isAuthenticated: false });
    toast.success(t.auth.loggedOut);
  },

  openAuthModal: (tab = 'login') => {
    set({ showAuthModal: true, authModalTab: tab });
  },

  closeAuthModal: () => {
    set({ showAuthModal: false });
  },

  clearAuth: () => {
    set({ user: null, isAuthenticated: false });
  },
}));
