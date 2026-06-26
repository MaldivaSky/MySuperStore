"use client";

import { Download } from "lucide-react";
import { usePwaStore } from "@/store/pwaStore";

export function InstallAppButton() {
  const { isInstallable, deferredPrompt, setDeferredPrompt } = usePwaStore();

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Mostra o prompt nativo
    deferredPrompt.prompt();
    
    // Aguarda a resposta do usuário
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("Usuário aceitou instalar o PWA");
    } else {
      console.log("Usuário recusou instalar o PWA");
    }
    
    // O prompt só pode ser usado uma vez, então limpa o estado
    setDeferredPrompt(null);
  };

  if (!isInstallable) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="flex w-full justify-center items-center gap-1.5 px-4 py-3 bg-gradient-to-r from-primary/20 to-amber-600/20 hover:from-primary/30 hover:to-amber-600/30 text-primary border border-primary/20 hover:border-primary/40 transition-colors rounded-xl text-sm font-bold shadow-[0_0_10px_rgba(230,181,60,0.1)]"
      title="Instalar App"
    >
      <Download className="w-3.5 h-3.5" />
      <span>Instalar App</span>
    </button>
  );
}
