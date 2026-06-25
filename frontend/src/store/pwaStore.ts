import { create } from "zustand";

interface PwaState {
  deferredPrompt: any | null;
  setDeferredPrompt: (prompt: any | null) => void;
  isInstallable: boolean;
}

export const usePwaStore = create<PwaState>((set) => ({
  deferredPrompt: null,
  isInstallable: false,
  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt, isInstallable: prompt !== null }),
}));
