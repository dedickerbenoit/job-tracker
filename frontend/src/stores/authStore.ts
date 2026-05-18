import { create } from "zustand";
import { toast } from "sonner";
import { authApi, setOnUnauthorized } from "@/services/api";
import { t } from "@/lib/i18n";
import type { User, LoginData, RegisterData } from "@/types";

type AuthModalTab = "login" | "register";

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  showAuthModal: boolean;
  authModalTab: AuthModalTab;

  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  openAuthModal: (tab?: AuthModalTab) => void;
  closeAuthModal: () => void;
  clearAuth: () => void;
}

// Guard against double-invocation in React StrictMode (dev). Without this,
// the one-shot handoff token gets consumed by the first call while the second
// call races ahead with /auth/me, returns 401 before the session is set, and
// the AuthGate briefly renders and opens the login modal.
let initPromise: Promise<void> | null = null;

// The handoff token is captured and stripped from the URL by the inline
// bootstrap script in index.html, before any paint or React code runs.
// We read it from the window global here and immediately clear it so it
// cannot be reused by a later call.
function consumeHandoffToken(): string | null {
  const w = window as Window & { __JT_HANDOFF_TOKEN__?: string };
  const token = w.__JT_HANDOFF_TOKEN__ ?? null;
  if (token) delete w.__JT_HANDOFF_TOKEN__;
  return token;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  isAuthenticated: false,
  showAuthModal: false,
  authModalTab: "login",

  initialize: () => {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      // Check if we have a handoff token from the extension (stripped from
      // the URL at bootstrap — see index.html).
      const authToken = consumeHandoffToken();

      if (authToken) {
        // Exchange the token for a session cookie
        try {
          const user = await authApi.tokenLogin(authToken);
          set({ user, isAuthenticated: true, loading: false });
          return;
        } catch {
          // Token invalid, expired, or already used — notify the user
          toast.error(t.auth.handoffFailed);
          // Fall through to normal /auth/me check
        }
      }

      // Check authentication by calling /auth/me
      // Sanctum will validate the session cookie
      try {
        const user = await authApi.me();
        set({ user, isAuthenticated: true, loading: false });
      } catch {
        set({ user: null, isAuthenticated: false, loading: false });
      }
    })();

    return initPromise;
  },

  refreshUser: async () => {
    try {
      const user = await authApi.me();
      set({ user, isAuthenticated: true });
    } catch {
      // Ignore — user state unchanged
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
    toast.success(t.auth.emailVerification.checkInbox);
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

  openAuthModal: (tab = "login") => {
    set({ showAuthModal: true, authModalTab: tab });
  },

  closeAuthModal: () => {
    set({ showAuthModal: false });
  },

  clearAuth: () => {
    set({ user: null, isAuthenticated: false });
  },
}));

// Wire up the 401 interceptor callback now that the store exists.
setOnUnauthorized((silent) => {
  const { clearAuth, openAuthModal } = useAuthStore.getState();
  clearAuth();
  if (!silent) {
    openAuthModal("login");
  }
});
