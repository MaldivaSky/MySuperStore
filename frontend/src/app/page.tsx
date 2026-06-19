"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import {
  Store,
  LayoutDashboard,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Zap,
  Package,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Starfield Canvas (subtle background particles)                     */
/* ------------------------------------------------------------------ */
function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const dots: { x: number; y: number; r: number; speed: number; o: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 200; i++) {
      dots.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.2,
        speed: Math.random() * 0.2 + 0.03,
        o: Math.random() * 0.5 + 0.15,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const d of dots) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${d.o})`;
        ctx.fill();
        d.y -= d.speed;
        if (d.y < -2) {
          d.y = canvas.height + 2;
          d.x = Math.random() * canvas.width;
        }
        d.o += (Math.random() - 0.5) * 0.008;
        d.o = Math.max(0.08, Math.min(0.5, d.o));
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Feature Card                                                       */
/* ------------------------------------------------------------------ */
function FeatureCard({
  href,
  icon: Icon,
  title,
  desc,
  external,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  external?: boolean;
}) {
  const Tag = external ? "a" : Link;
  const extraProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Tag
      href={href}
      {...extraProps}
      className="group relative flex flex-col gap-5 overflow-hidden rounded-2xl p-8
        border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm
        hover:border-[#D4AF37]/40 hover:bg-white/[0.05]
        transition-all duration-500 hover:-translate-y-1
        hover:shadow-[0_24px_60px_-12px_rgba(212,175,55,0.12)]"
    >
      <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 group-hover:bg-[#D4AF37]/15 transition-all duration-300">
        <Icon className="h-6 w-6" />
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
          {title}
          <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[#D4AF37]" />
        </h3>
        <p className="text-base text-neutral-400 leading-relaxed">{desc}</p>
      </div>

      <div className="h-[1px] w-0 group-hover:w-full bg-gradient-to-r from-[#D4AF37]/50 via-[#D4AF37]/20 to-transparent transition-all duration-700" />
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white overflow-hidden">
      <Starfield />

      {/* Ambient glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[20%] left-[15%] w-[500px] h-[500px] bg-[#D4AF37]/[0.03] rounded-full blur-[160px]" />
        <div className="absolute bottom-[15%] right-[10%] w-[400px] h-[400px] bg-[#D4AF37]/[0.02] rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <main className="flex-grow">
          {/* ====================================================== */}
          {/*  HERO — Logo centralizada + texto abaixo               */}
          {/* ====================================================== */}
          <section className="max-w-5xl mx-auto px-6 pt-12 pb-24 md:pt-20 md:pb-32 flex flex-col items-center text-center">

            {/* Logo — fundo #000 do PNG se funde com o bg-black da página */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png?v=4"
                alt="MySuperStore"
                className="w-[420px] md:w-[520px] lg:w-[600px] h-auto mx-auto"
              />
            </motion.div>

            {/* Subtítulo */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 text-xl md:text-2xl text-neutral-300 leading-relaxed max-w-2xl"
            >
              Marketplace multi-vendedor com pagamentos automatizados,
              gestão completa de produtos e pedidos em uma única plataforma.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex flex-wrap justify-center gap-5"
            >
              <Link
                href="/store"
                className="group flex items-center gap-3 px-8 py-4 bg-[#D4AF37] text-black font-bold rounded-xl
                  shadow-[0_0_30px_rgba(212,175,55,0.2)]
                  hover:shadow-[0_0_50px_rgba(212,175,55,0.35)]
                  transition-all duration-300 text-base"
              >
                <Store className="h-5 w-5" />
                Acessar Marketplace
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/seller/dashboard"
                className="flex items-center gap-3 px-8 py-4 border border-white/10
                  bg-white/[0.04] hover:bg-white/[0.08] hover:border-[#D4AF37]/30
                  font-semibold rounded-xl transition-all duration-300 text-base"
              >
                <LayoutDashboard className="h-5 w-5 text-[#D4AF37]" />
                Painel do Vendedor
              </Link>
            </motion.div>

            {/* Tech stack */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mt-16 flex items-center gap-8 md:gap-12"
            >
              {[
                { label: "PostgreSQL", sub: "Banco de dados" },
                { label: "Stripe Connect", sub: "Pagamentos" },
                { label: "Celery + Redis", sub: "Tarefas async" },
              ].map((t, i) => (
                <div key={i} className="text-center space-y-1">
                  <span className="text-xs text-neutral-500 uppercase tracking-widest font-medium block">
                    {t.sub}
                  </span>
                  <span className="text-sm font-bold text-neutral-300">
                    {t.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </section>

          {/* ====================================================== */}
          {/*  FEATURES                                                */}
          {/* ====================================================== */}
          <section className="max-w-6xl mx-auto px-6 pb-28">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                O que a <span className="text-[#D4AF37]">plataforma</span> oferece
              </h2>
              <p className="text-lg text-neutral-400 max-w-xl mx-auto">
                Módulos integrados para gerenciar sua loja, processar pagamentos
                e acompanhar vendas em tempo real.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  href: "/store",
                  icon: Store,
                  title: "Marketplace",
                  desc: "Categorias, busca inteligente e filtros para encontrar produtos de múltiplos vendedores.",
                },
                {
                  href: "/seller/dashboard",
                  icon: LayoutDashboard,
                  title: "Painel do Vendedor",
                  desc: "Gerencie produtos, acompanhe métricas de vendas e configure recebíveis automáticos.",
                },
                {
                  href: "/store",
                  icon: CreditCard,
                  title: "Pagamentos",
                  desc: "Split automatizado via Stripe Connect com repasses diretos para cada vendedor.",
                },
                {
                  href: "http://localhost:8000/api/docs/",
                  icon: ShieldCheck,
                  title: "API REST",
                  desc: "Documentação Swagger, autenticação JWT e endpoints otimizados para alta performance.",
                  external: true,
                },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <FeatureCard {...card} />
                </motion.div>
              ))}
            </div>
          </section>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
