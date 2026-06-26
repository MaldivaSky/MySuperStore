"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api";

/**
 * AuthProvider — mounts at the root layout.
 *
 * On every page load / refresh it checks whether we have tokens in localStorage
 * but no authenticated state in Zustand (this happens with Google OAuth users
 * because the Google credential is short-lived and the zustand-persist
 * rehydration may find stale data). It silently calls /users/me/ to revalidate
 * the session using the stored access_token (which will be auto-refreshed by
 * the api.ts interceptor if expired).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, login, logout, _hydrated } = useAuthStore();

  useEffect(() => {
    // Wait for zustand-persist to rehydrate from localStorage
    if (!_hydrated) return;

    const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;

    if (accessToken) {
      // Revalida os dados do usuário para manter roles (is_seller, admin) em sincronia.
      // O interceptor do api.ts já cuida do refresh automático em caso de 401.
      authApi.me()
        .then((res) => {
          // Relê os tokens do localStorage: o interceptor pode tê-los rotacionado.
          const freshAccess = localStorage.getItem("access_token") || accessToken;
          const freshRefresh = localStorage.getItem("refresh_token") || refreshToken || "";
          login({ access: freshAccess, refresh: freshRefresh }, res.data);
        })
        .catch((err) => {
          // Só desloga se o servidor confirmou que a credencial é inválida (401).
          // Erros de rede (mobile offline, timeout) NÃO devem encerrar a sessão —
          // preserva o estado já reidratado do localStorage.
          if (err?.response?.status === 401) {
            logout();
          }
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hydrated]);

  return <>{children}</>;
}
