"use client";

import { useEffect } from "react";
import { userApi } from "@/lib/api";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PWARegistry() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // 1. Registra o Service Worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registrado com sucesso:", registration.scope);
          
          // 2. Pede permissão para Notificações
          if ("Notification" in window) {
            Notification.requestPermission().then((permission) => {
              if (permission === "granted") {
                // 3. Se permitido, assina no Push Manager usando a chave pública VAPID
                const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!vapidPublicKey) return;

                registration.pushManager
                  .subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
                  })
                  .then((subscription) => {
                    // 4. Envia o token para o backend
                    userApi.subscribePush(subscription.toJSON())
                      .catch(err => console.error("Falha ao salvar inscrição Push no servidor:", err));
                  })
                  .catch((err) => {
                    console.error("Falha ao se inscrever no Push Manager:", err);
                  });
              }
            });
          }
        })
        .catch((err) => {
          console.error("Falha ao registrar o Service Worker:", err);
        });
    }
  }, []);

  return null;
}
