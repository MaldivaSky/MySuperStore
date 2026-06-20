"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Truck, Zap, PackageSearch } from "lucide-react";
import { SaturnMark } from "@/components/Brand";

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Exibe o modal apenas se o usuário ainda não o fechou antes
    const hasSeen = localStorage.getItem("has_seen_welcome");
    if (!hasSeen) {
      // Pequeno delay para a página carregar e o modal surgir suavemente
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("has_seen_welcome", "true");
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-[#0A0A15] border border-white/10 shadow-2xl z-10"
          >
            {/* Ambient Background Gradient */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
            
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 md:p-12 relative z-10">
              <div className="flex justify-center mb-6">
                <SaturnMark className="w-20 h-auto drop-shadow-[0_0_15px_rgba(230,181,60,0.5)]" />
              </div>

              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                  Bem-vindo à <span className="text-primary">MySuperStore</span>
                </h2>
                <p className="text-lg text-neutral-400 font-light">
                  Você acaba de entrar no ecossistema onde tudo orbita ao seu redor. <br className="hidden md:block"/> 
                  Um universo de ofertas selecionadas, segurança impenetrável e logística de ponta.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-colors">
                  <div className="p-3 rounded-full bg-primary/10 text-primary shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold mb-1">Pagamento Blindado</h3>
                    <p className="text-sm text-neutral-400">Suas transações são protegidas de ponta a ponta. Compre sem nenhum receio.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-colors">
                  <div className="p-3 rounded-full bg-primary/10 text-primary shrink-0">
                    <PackageSearch className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold mb-1">Rastreio em Tempo Real</h3>
                    <p className="text-sm text-neutral-400">Do clique até a sua porta. Saiba exatamente onde está a sua encomenda.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-colors">
                  <div className="p-3 rounded-full bg-primary/10 text-primary shrink-0">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold mb-1">Ofertas Relâmpago</h3>
                    <p className="text-sm text-neutral-400">Acesso a deals exclusivos e boosters algorítmicos para garantir o menor preço.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-colors">
                  <div className="p-3 rounded-full bg-primary/10 text-primary shrink-0">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold mb-1">Entrega Gravitacional</h3>
                    <p className="text-sm text-neutral-400">Logística de alta performance para que seus desejos cheguem na velocidade da luz.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={handleClose}
                  className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-primary to-[#B38F25] text-black font-black text-lg rounded-xl hover:scale-105 hover:shadow-[0_0_30px_rgba(230,181,60,0.3)] transition-all"
                >
                  Explorar o Marketplace
                </button>
                <span className="text-xs text-neutral-500 font-medium tracking-wide uppercase">
                  Pressione ESC ou clique fora para fechar
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
