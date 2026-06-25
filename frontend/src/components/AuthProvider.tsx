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
      // Always revalidate user data to ensure roles (is_seller, admin) are in sync
      authApi.me()
        .then((res) => {
          login(
            { access: accessToken, refresh: refreshToken || "" },
            res.data
          );
        })
        .catch(() => {
          // Token is truly expired or invalid — clear everything
          logout();
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hydrated]);

  return <>{children}</>;
}
