"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Truck, Zap, PackageSearch, Sparkles } from "lucide-react";
import { OfficialLogo } from "@/components/Brand";

const features = [
  { Icon: ShieldCheck, title: "Pagamento Blindado", desc: "Criptografia de nível militar. Compre com total segurança." },
  { Icon: PackageSearch, title: "Rastreio Orbital", desc: "Visibilidade total da sua encomenda em tempo real." },
  { Icon: Zap, title: "Ofertas Relâmpago", desc: "Deals exclusivos e oportunidades únicas para você." },
  { Icon: Truck, title: "Logística Gravitacional", desc: "Despacho otimizado para chegar na velocidade da luz." },
];

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
        <div className="fixed inset-0 z-[150]">
          {/* Backdrop — fixed so it never scrolls away */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={handleClose}
            className="fixed inset-0 bg-[#020205]/80 backdrop-blur-md"
          />

          {/* Scrollable layer — allows modal to be taller than the viewport on small screens */}
          <div className="relative h-full overflow-y-auto flex items-start sm:items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-6xl flex flex-col lg:flex-row overflow-hidden rounded-2xl sm:rounded-[2.5rem] bg-[#080812]/90 border border-white/[0.08] shadow-[0_0_100px_rgba(230,181,60,0.15)] my-auto"
            >
              {/* Close Button — 44×44 touch target minimum */}
              <button
                onClick={handleClose}
                aria-label="Fechar"
                className="absolute top-3 right-3 sm:top-6 sm:right-6 z-50 flex items-center justify-center w-11 h-11 text-neutral-400 hover:text-white bg-black/40 hover:bg-white/10 rounded-full transition-all group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>

              {/* Left — Visual */}
              <div className="relative w-full lg:w-5/12 min-h-[160px] sm:min-h-[260px] lg:min-h-[600px] flex flex-col justify-between p-5 sm:p-8 lg:p-14 overflow-hidden bg-black">
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
                  <OfficialLogo className="w-28 sm:w-36 lg:w-48 mb-3 sm:mb-6 drop-shadow-2xl" />
                  <h2 className="text-xl sm:text-3xl lg:text-5xl font-display font-black text-white leading-[1.1] tracking-tight pr-10">
                    O Centro da <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-200 to-amber-500">
                      Gravidade Comercial.
                    </span>
                  </h2>
                </div>

                <div className="relative z-10 mt-3 sm:mt-6 lg:mt-0 hidden sm:block">
                  <p className="text-neutral-300 text-sm sm:text-base lg:text-lg font-light leading-relaxed">
                    "Você acaba de entrar no ecossistema onde a exclusividade é regra e tudo orbita ao redor da sua experiência."
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-primary font-bold text-xs tracking-widest uppercase">
                    <Sparkles className="w-3.5 h-3.5" /> Padrão Ouro MySuperStore
                  </div>
                </div>
              </div>

              {/* Right — Features */}
              <div className="w-full lg:w-7/12 p-5 sm:p-8 lg:p-14 flex flex-col justify-center relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-20 w-80 h-80 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-10 relative z-10">
                  {features.map(({ Icon, title, desc }) => (
                    <div key={title} className="group flex items-start gap-3 sm:block">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0 sm:mb-4 transition-all duration-300">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm sm:text-lg mb-0.5 sm:mb-2">{title}</h3>
                        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 sm:pt-6 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-6 relative z-10">
                  <p className="text-xs text-neutral-500 font-medium tracking-wide uppercase hidden sm:block">
                    Experimente o inexplorado
                  </p>
                  <button
                    onClick={handleClose}
                    className="w-full sm:w-auto px-8 sm:px-10 py-4 bg-white text-black font-black text-sm uppercase tracking-wider rounded-xl hover:bg-primary hover:text-black transition-all duration-300 hover:shadow-[0_0_30px_rgba(230,181,60,0.4)]"
                  >
                    Explorar o Ecossistema
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
