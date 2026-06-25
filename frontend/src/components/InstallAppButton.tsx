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
      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 transition-colors rounded-full text-xs font-bold"
      title="Instalar App"
    >
      <Download className="w-3.5 h-3.5" />
      <span>Instalar App</span>
    </button>
  );
}
