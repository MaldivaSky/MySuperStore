// Web Push — utilitários de assinatura.
// IMPORTANTE (iOS): `Notification.requestPermission()` só funciona se chamado a partir
// de um gesto do usuário (toque) e com o app rodando em modo standalone (instalado).
import { userApi } from "@/lib/api";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Está rodando como app instalado (PWA standalone)? Pré-requisito do push no iOS. */
export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari expõe isto em vez do display-mode
    (window.navigator as any).standalone === true
  );
}

/** O navegador suporta Web Push? */
export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Garante o Service Worker registrado e retorna o registration pronto. */
export async function ensureServiceWorker() {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

/**
 * Assina o usuário no Push e envia o token ao backend.
 * Deve ser chamado a partir de um gesto do usuário (clique) por causa do iOS.
 * Retorna true em caso de sucesso.
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    console.error("NEXT_PUBLIC_VAPID_PUBLIC_KEY ausente — não é possível assinar push.");
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const registration = await ensureServiceWorker();

  // Reaproveita a assinatura existente, se houver.
  const subscription =
    (await registration.pushManager.getSubscription()) ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    }));

  await userApi.subscribePush(subscription.toJSON());
  return true;
}

/**
 * Reassina silenciosamente quando a permissão JÁ foi concedida — mantém o token
 * fresco no servidor sem nunca abrir um diálogo. Seguro chamar no carregamento.
 */
export async function resubscribeIfGranted(): Promise<void> {
  if (!isPushSupported()) return;
  if (Notification.permission !== "granted") return;
  try {
    await subscribeToPush();
  } catch (err) {
    console.error("Falha ao reassinar push:", err);
  }
}
