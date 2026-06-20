"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Truck, Zap, PackageSearch, Sparkles } from "lucide-react";
import { OfficialLogo } from "@/components/Brand";

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem("has_seen_welcome_v2");
    if (!hasSeen) {
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("has_seen_welcome_v2", "true");
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop Blur Intenso */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(16px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.8 }}
            onClick={handleClose}
            className="absolute inset-0 bg-[#020205]/80"
          />

          {/* Modal Content - Wide Premium Split Layout */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-6xl flex flex-col lg:flex-row overflow-hidden rounded-[2.5rem] bg-[#080812]/90 border border-white/[0.08] shadow-[0_0_100px_rgba(230,181,60,0.15)] z-10"
          >
            {/* Fechar Invisível */}
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 p-3 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 group"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Lado Esquerdo - Visual e Conceito */}
            <div className="relative w-full lg:w-5/12 min-h-[300px] lg:min-h-[600px] flex flex-col justify-between p-10 lg:p-14 overflow-hidden bg-black">
              {/* Background Imagem Espacial/Abstrata Premium */}
              <div 
                className="absolute inset-0 opacity-40 mix-blend-screen scale-105"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1500&auto=format&fit=crop')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
              
              <div className="relative z-10">
                <OfficialLogo className="w-48 mb-8 drop-shadow-2xl" />
                <h2 className="text-4xl lg:text-5xl font-display font-black text-white leading-[1.1] tracking-tight">
                  O Centro da <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-200 to-amber-500">
                    Gravidade Comercial.
                  </span>
                </h2>
              </div>

              <div className="relative z-10 mt-10 lg:mt-0">
                <p className="text-neutral-300 text-lg font-light leading-relaxed">
                  "Você acaba de entrar no ecossistema onde a exclusividade é regra e tudo orbita ao redor da sua experiência."
                </p>
                <div className="mt-6 flex items-center gap-2 text-primary font-bold text-sm tracking-widest uppercase">
                  <Sparkles className="w-4 h-4" /> Padrão Ouro MySuperStore
                </div>
              </div>
            </div>

            {/* Lado Direito - Features */}
            <div className="w-full lg:w-7/12 p-8 lg:p-14 flex flex-col justify-center relative">
              {/* Glows de Fundo */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-20 w-80 h-80 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 relative z-10">
                <div className="group">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 group-hover:border-primary/50 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Pagamento Blindado</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed group-hover:text-neutral-300 transition-colors">
                    Suas transações são protegidas de ponta a ponta por criptografia de nível militar. Compre no ápice da segurança.
                  </p>
                </div>

                <div className="group">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 group-hover:border-primary/50 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                    <PackageSearch className="w-6 h-6" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Rastreio Orbital</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed group-hover:text-neutral-300 transition-colors">
                    Visibilidade cirúrgica. Do clique até a sua porta, saiba as coordenadas exatas da sua encomenda em tempo real.
                  </p>
                </div>

                <div className="group">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 group-hover:border-primary/50 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Ofertas Relâmpago</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed group-hover:text-neutral-300 transition-colors">
                    Acesso vip a deals exclusivos e boosters algorítmicos. Oportunidades únicas que desaparecem como estrelas cadentes.
                  </p>
                </div>

                <div className="group">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 group-hover:border-primary/50 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                    <Truck className="w-6 h-6" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Logística Gravitacional</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed group-hover:text-neutral-300 transition-colors">
                    Física aplicada ao e-commerce. Despacho otimizado para que seus desejos cheguem na velocidade da luz.
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                <p className="text-xs text-neutral-500 font-medium tracking-wide uppercase">
                  Experimente o inexplorado
                </p>
                <button
                  onClick={handleClose}
                  className="w-full sm:w-auto px-10 py-4 bg-white text-black font-black text-sm uppercase tracking-wider rounded-xl hover:bg-primary hover:text-black transition-all duration-300 hover:shadow-[0_0_30px_rgba(230,181,60,0.4)]"
                >
                  Explorar o Ecossistema
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
