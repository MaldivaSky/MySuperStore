import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  role: "customer" | "seller" | "admin";
  phone?: string | null;
  cpf_cnpj?: string | null;
  person_type?: "PF" | "PJ";
  avatar_url?: string | null;
  has_store?: boolean;
  has_products?: boolean;
  is_seller?: boolean;
  stripe_account_id?: string;
  stripe_onboarding_complete?: boolean;
  email_verified?: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hydrated: boolean;
  login: (tokens: { access: string; refresh: string }, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hydrated: false,

      login: (tokens, user) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", tokens.access);
          if (tokens.refresh) {
            localStorage.setItem("refresh_token", tokens.refresh);
          }
          // Cookie leve para o middleware Next.js (Edge) detectar sessão ativa sem expor o token
          document.cookie = "mss_auth=1; path=/; max-age=604800; SameSite=Lax";
        }
        set({
          accessToken: tokens.access,
          refreshToken: tokens.refresh,
          user,
          isAuthenticated: true,
        });
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          document.cookie = "mss_auth=; path=/; max-age=0; SameSite=Lax";
        }
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        });
      },

      updateUser: (updatedUser) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        }));
      },

      setHydrated: (v) => set({ _hydrated: v }),
    }),
    {
      name: "mysuperstore-auth",
      // Persist everything except the internal _hydrated flag
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // After zustand rehydrates from localStorage, mark as hydrated
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
);
