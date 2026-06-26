"use client";

import { useEffect } from "react";
import { usePwaStore } from "@/store/pwaStore";
import { ensureServiceWorker, resubscribeIfGranted } from "@/lib/push";

export function PWARegistry() {
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      usePwaStore.getState().setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      ensureServiceWorker()
        .then((registration) => {
          console.log("Service Worker registrado:", registration.scope);
          // NÃO pedimos permissão aqui: o iOS exige um gesto do usuário (ver NotificationOptIn).
          // Apenas reassinamos se o usuário já concedeu antes, mantendo o token fresco.
          resubscribeIfGranted();
        })
        .catch((err) => console.error("Falha ao registrar o Service Worker:", err));
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  return null;
}
