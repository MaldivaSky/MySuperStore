"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OfficialLogo } from "@/components/Brand";
import { motion } from "framer-motion";
import {
  Store, ArrowRight, ShieldCheck, CreditCard, Zap, Rocket, 
  MessageCircle, Search, Flame, ShoppingCart, TrendingUp,
  CheckCircle2, XCircle, Target, DollarSign, Lock, Smartphone, 
  BarChart3, Clock, AlertTriangle, Users, Globe, ChevronDown, Check, MousePointerClick, Server, Crosshair, Mail, Loader2
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { crmApi } from "@/lib/api";

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};

export default function VenderPage() {
  const router = useRouter();
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLead(true);
    try {
      await crmApi.createLead({
        name: leadName,
        phone: leadPhone,
        email: leadEmail,
        funnel_type: "lojista",
        source: "Landing Page Lojista"
      });
      // Redirect to register with type=seller
      router.push("/register?type=seller");
    } catch (err) {
      console.error(err);
      // Fallback
      router.push("/register?type=seller");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050510] text-neutral-200 font-sans selection:bg-[#E6B53C] selection:text-black">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#E6B53C]/5 blur-[150px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-900/10 blur-[150px]"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen overflow-x-hidden">
        <Header />

        <main className="flex-grow">
          {/* ====================================================== */}
          {/*  HERO SECTION: Foco no Lojista                       */}
          {/* ====================================================== */}
          <section className="relative w-full max-w-7xl mx-auto px-6 pt-20 pb-32 md:pt-32 md:pb-40 flex flex-col items-center text-center">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex flex-col items-center w-full">
              
              <OfficialLogo className="w-[300px] md:w-[480px] lg:w-[650px] h-auto drop-shadow-[0_0_60px_rgba(212,175,55,0.4)] mb-2" />
              
              <h2 className="font-mono text-xs md:text-lg uppercase tracking-[0.4em] text-[#E6B53C] font-black mb-12 drop-shadow-[0_0_15px_rgba(230,181,60,0.6)]">
                Plataforma de Vendas de Alta Conversão
              </h2>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] max-w-6xl tracking-tight">
                O Fim da Escravidão para as Grandes Plataformas. <br className="hidden lg:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FCE6A0] via-[#E6B53C] to-[#A4711B]">
                  A Máquina de Vendas Definitiva é Sua.
                </span>
              </h1>
              
              <p className="mt-8 text-xl md:text-2xl text-neutral-400 leading-relaxed max-w-4xl font-light">
                Pare de perder 20% do seu faturamento em taxas e de ver seus clientes escaparem no carrinho. Descubra o ecossistema que usa <strong className="text-white font-bold">inteligência psicológica de conversão</strong> para forçar vendas e dividir o dinheiro na mesma hora.
              </p>

              <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-2xl">
                <button
                  onClick={() => setShowLeadModal(true)}
                  className="group relative flex items-center justify-center gap-3 px-8 py-6 bg-gradient-to-b from-[#E6B53C] to-[#B38F25] text-black font-black rounded-2xl transition-all duration-300 w-full hover:scale-105 hover:shadow-[0_0_50px_rgba(230,181,60,0.5)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-700 ease-in-out"></div>
                  <Store className="h-7 w-7" />
                  <div className="text-left flex flex-col">
                    <span className="text-lg md:text-xl tracking-tight leading-none mb-1">Criar Minha Loja Grátis</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-80">Isenção de taxa para lojistas fundadores</span>
                  </div>
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform ml-auto sm:ml-0" />
                </button>
              </div>
            </motion.div>
          </section>

          {/* ====================================================== */}
          {/*  THE VILLAIN (A Dor Profunda do Varejo Atual)       */}
          {/* ====================================================== */}
          <section className="py-32 bg-[#080812] border-y border-white/[0.05] relative overflow-hidden">
            <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-red-600/5 blur-[200px] rounded-full pointer-events-none -translate-y-1/2"></div>
            <div className="max-w-6xl mx-auto px-6 relative z-10">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} className="text-center mb-20">
                <div className="inline-flex p-4 rounded-full bg-red-500/10 mb-6 border border-red-500/20">
                  <AlertTriangle className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-8 tracking-tight">
                  O Sistema Atual Foi Desenhado Para <span className="text-red-500">Destruir a Sua Margem.</span>
                </h2>
                <p className="text-2xl text-neutral-400 max-w-4xl mx-auto font-light leading-relaxed">
                  Não é culpa sua não estar lucrando o quanto deveria. As gigantes do mercado criaram um ecossistema viciado onde você assume 100% dos riscos e eles levam a fatia maior do bolo.
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#050510] border border-white/5 hover:border-red-500/30 transition-colors p-8 rounded-3xl group">
                  <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20 group-hover:scale-110 transition-transform">
                    <DollarSign className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">O Roubo Legalizado</h3>
                  <p className="text-neutral-400">Até 20% do seu faturamento bruto é engolido por taxas de comissão, exposição e frete obrigatório.</p>
                </div>

                <div className="bg-[#050510] border border-white/5 hover:border-red-500/30 transition-colors p-8 rounded-3xl group">
                  <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20 group-hover:scale-110 transition-transform">
                    <Crosshair className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Tiro no Próprio Pé</h3>
                  <p className="text-neutral-400">Você atrai o cliente, paga anúncio, e a plataforma mostra o produto do concorrente mais barato na sua página.</p>
                </div>

                <div className="bg-[#050510] border border-white/5 hover:border-red-500/30 transition-colors p-8 rounded-3xl group">
                  <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20 group-hover:scale-110 transition-transform">
                    <Clock className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Dinheiro Sequestrado</h3>
                  <p className="text-neutral-400">Enquanto você tem que pagar seus fornecedores à vista, a plataforma prende o seu dinheiro por 15 a 30 dias.</p>
                </div>

                <div className="bg-[#050510] border border-white/5 hover:border-red-500/30 transition-colors p-8 rounded-3xl group">
                  <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20 group-hover:scale-110 transition-transform">
                    <ShoppingCart className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Vendas Evaporadas</h3>
                  <p className="text-neutral-400">Carrinhos abandonados que nunca são recuperados porque a plataforma não se importa com a sua conversão.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ====================================================== */}
          {/*  B2C SELLER FEATURES (A Máquina de Vendas)          */}
          {/* ====================================================== */}
          <section className="py-32 relative">
            <div className="max-w-7xl mx-auto px-6">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="text-center mb-24">
                <div className="inline-flex p-3 rounded-2xl bg-[#E6B53C]/10 mb-6 border border-[#E6B53C]/20 shadow-[0_0_20px_rgba(230,181,60,0.2)]">
                  <Zap className="w-8 h-8 text-[#E6B53C]" />
                </div>
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-8 tracking-tight">
                  Invertendo as Regras. <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FCE6A0] via-[#E6B53C] to-[#A4711B]">A Primeira Máquina a Seu Favor.</span>
                </h2>
                <p className="text-2xl text-neutral-400 max-w-4xl mx-auto font-light">
                  Nós não apenas exibimos o seu produto. Nós criamos um ambiente psicológico de compra que torna quase impossível o cliente sair do site sem passar o cartão.
                </p>
              </motion.div>

              <div className="space-y-32">
                
                {/* Feature 1: FOMO */}
                <div className="flex flex-col lg:flex-row items-center gap-16">
                  <div className="lg:w-1/2 order-2 lg:order-1 relative">
                    <div className="absolute inset-0 bg-orange-500/20 blur-[120px] rounded-full"></div>
                    <div className="relative bg-[#050510] border border-white/10 rounded-3xl p-10 shadow-2xl overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="flex items-center gap-6 mb-10 relative z-10">
                        <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                          <Flame className="w-10 h-10 text-orange-500" />
                        </div>
                        <div>
                          <div className="text-orange-500 font-bold text-xs tracking-[0.2em] uppercase mb-1">Gatilho Psicológico</div>
                          <div className="text-white text-3xl font-black tracking-tight">Escassez Real</div>
                        </div>
                      </div>
                      <div className="space-y-4 relative z-10">
                        <div className="bg-white/5 p-6 rounded-xl border border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-white/10 transition-colors">
                          <span className="text-white font-medium text-lg">Oferta Relâmpago</span>
                          <div className="flex items-center gap-2 bg-orange-500/20 px-4 py-2 rounded-lg border border-orange-500/30">
                            <Clock className="w-5 h-5 text-orange-400 animate-spin-slow" />
                            <span className="text-orange-500 font-bold font-mono text-xl animate-pulse">04:12:09</span>
                          </div>
                        </div>
                        <div className="bg-white/5 p-6 rounded-xl border border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-white/10 transition-colors">
                          <span className="text-white font-medium text-lg">Seu Produto</span>
                          <span className="text-red-500 font-black bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20 uppercase tracking-wider">Apenas 2 restantes!</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="lg:w-1/2 order-1 lg:order-2">
                    <h3 className="text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-tight">Esgote Estoques com o Medo de Ficar de Fora (FOMO)</h3>
                    <p className="text-xl text-neutral-400 font-light leading-relaxed mb-8">
                      O cérebro humano está programado para não perder oportunidades. Ao invés de uma vitrine morta, nós injetamos contadores regressivos reais e níveis críticos de estoque visíveis. O cliente para de raciocinar e entra no "modo de compra impulsiva".
                    </p>
                    <ul className="space-y-5">
                      <li className="flex items-center gap-4"><CheckCircle2 className="text-[#E6B53C] w-7 h-7 shrink-0"/> <span className="text-white text-lg font-medium">Aumenta a conversão imediata em até 47%.</span></li>
                      <li className="flex items-center gap-4"><CheckCircle2 className="text-[#E6B53C] w-7 h-7 shrink-0"/> <span className="text-white text-lg font-medium">Zera lotes encalhados e gera pico de caixa instantâneo.</span></li>
                      <li className="flex items-center gap-4"><CheckCircle2 className="text-[#E6B53C] w-7 h-7 shrink-0"/> <span className="text-white text-lg font-medium">Totalmente automatizado no seu painel.</span></li>
                    </ul>
                  </div>
                </div>

                {/* Feature 2: Carrinho */}
                <div className="flex flex-col lg:flex-row items-center gap-16">
                  <div className="lg:w-1/2">
                    <h3 className="text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-tight">O Vendedor Invisível Que Nunca Dorme</h3>
                    <p className="text-xl text-neutral-400 font-light leading-relaxed mb-8">
                      O cliente escolheu o produto, preencheu os dados e fechou a janela. Nas outras plataformas, você chora a venda perdida. Na MySuperStore, nosso exército de automação acorda: disparamos sequências persuasivas de e-mail rastreando o cliente até ele voltar e finalizar o pagamento.
                    </p>
                    <ul className="space-y-5">
                      <li className="flex items-center gap-4"><CheckCircle2 className="text-[#E6B53C] w-7 h-7 shrink-0"/> <span className="text-white text-lg font-medium">Recupera até 30% de todo o dinheiro deixado na mesa.</span></li>
                      <li className="flex items-center gap-4"><CheckCircle2 className="text-[#E6B53C] w-7 h-7 shrink-0"/> <span className="text-white text-lg font-medium">Você pode oferecer descontos regressivos (ex: 5% off se pagar hoje).</span></li>
                      <li className="flex items-center gap-4"><CheckCircle2 className="text-[#E6B53C] w-7 h-7 shrink-0"/> <span className="text-white text-lg font-medium">Funciona 24 horas por dia, 7 dias por semana.</span></li>
                    </ul>
                  </div>
                  <div className="lg:w-1/2 relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-[120px] rounded-full"></div>
                    <div className="relative bg-[#050510] border border-white/10 rounded-3xl p-10 shadow-2xl overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="flex items-center gap-6 mb-10 relative z-10">
                        <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                          <ShoppingCart className="w-10 h-10 text-blue-400" />
                        </div>
                        <div>
                          <div className="text-blue-400 font-bold text-xs tracking-[0.2em] uppercase mb-1">Recuperação Ninja</div>
                          <div className="text-white text-3xl font-black tracking-tight">Resgate de Vendas</div>
                        </div>
                      </div>
                      <div className="space-y-6 relative z-10">
                        <div className="bg-blue-500/10 p-6 rounded-xl border border-blue-500/30 backdrop-blur-md">
                          <div className="flex items-center gap-3 mb-3">
                            <Mail className="w-5 h-5 text-blue-400" />
                            <span className="text-blue-200 font-semibold uppercase tracking-wider text-sm">Disparo Automático #1</span>
                          </div>
                          <p className="text-white font-medium text-lg mb-2">"Você esqueceu algo incrível no carrinho..."</p>
                          <p className="text-neutral-400 text-sm">Seu item exclusivo será liberado para o próximo da fila em 30 minutos. Volte agora e finalize a compra.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 3: Split de Pagamento */}
                <div className="flex flex-col lg:flex-row items-center gap-16">
                  <div className="lg:w-1/2 order-2 lg:order-1 relative">
                    <div className="absolute inset-0 bg-green-500/20 blur-[120px] rounded-full"></div>
                    <div className="relative bg-[#050510] border border-white/10 rounded-3xl p-10 shadow-2xl overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="flex items-center gap-6 mb-10 relative z-10">
                        <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
                          <DollarSign className="w-10 h-10 text-green-400" />
                        </div>
                        <div>
                          <div className="text-green-400 font-bold text-xs tracking-[0.2em] uppercase mb-1">Fluxo de Caixa Livre</div>
                          <div className="text-white text-3xl font-black tracking-tight">Split Financeiro Efí Bank</div>
                        </div>
                      </div>
                      <div className="bg-[#0A0A15] p-8 rounded-2xl border border-white/5 flex flex-col gap-6 relative z-10 shadow-inner">
                        <div className="flex justify-between items-center pb-6 border-b border-white/10">
                          <div>
                            <p className="text-neutral-500 text-sm font-bold uppercase tracking-wider mb-1">Pagamento do Cliente</p>
                            <p className="text-white text-3xl font-black">R$ 5.000,00</p>
                          </div>
                          <CreditCard className="w-10 h-10 text-neutral-600" />
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <div className="flex items-center gap-4">
                            <div className="w-2 h-10 bg-green-500 rounded-full"></div>
                            <div>
                              <p className="text-green-500 font-bold text-sm uppercase tracking-wider mb-1">Sua Conta (Imediato)</p>
                              <p className="text-green-400 text-4xl font-black animate-pulse">R$ 5.000,00</p>
                            </div>
                          </div>
                          <Check className="w-8 h-8 text-green-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="lg:w-1/2 order-1 lg:order-2">
                    <h3 className="text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-tight">O Fim das Planilhas: Dinheiro na Sua Mão, Na Hora.</h3>
                    <p className="text-xl text-neutral-400 font-light leading-relaxed mb-8">
                      Ouvimos o grito de desespero dos lojistas sobre dinheiro preso. Acabamos com isso. Através da nossa integração profunda com o **Efí Bank**, o dinheiro da venda cai no exato milissegundo em que o pagamento é aprovado. A sua fatia de lucro voa direto para a sua conta bancária. Sem pedágio.
                    </p>
                    <ul className="space-y-5">
                      <li className="flex items-center gap-4"><CheckCircle2 className="text-[#E6B53C] w-7 h-7 shrink-0"/> <span className="text-white text-lg font-medium">Acabe com a dependência de fluxo de caixa preso.</span></li>
                      <li className="flex items-center gap-4"><CheckCircle2 className="text-[#E6B53C] w-7 h-7 shrink-0"/> <span className="text-white text-lg font-medium">Controle antifraude bancário militar embutido.</span></li>
                      <li className="flex items-center gap-4"><CheckCircle2 className="text-[#E6B53C] w-7 h-7 shrink-0"/> <span className="text-white text-lg font-medium">Totalmente transparente e automatizado. Zero esforço.</span></li>
                    </ul>
                  </div>
                </div>

              </div>

              {/* Massive Push to Action */}
              <div className="mt-40 mb-32 text-center relative z-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[200px] bg-[#E6B53C]/20 blur-[100px] pointer-events-none"></div>
                <h3 className="text-3xl md:text-5xl font-black text-white mb-10 relative tracking-tight">O que você está esperando para explodir de vender?</h3>
                <button
                  onClick={() => setShowLeadModal(true)}
                  className="relative inline-flex items-center justify-center gap-4 px-12 py-6 lg:py-8 bg-gradient-to-b from-[#E6B53C] to-[#B38F25] text-black font-black rounded-full text-xl md:text-3xl hover:scale-105 hover:shadow-[0_0_80px_rgba(212,175,55,0.6)] transition-all duration-300 group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-700 ease-in-out"></div>
                  <Store className="w-8 h-8 md:w-10 md:h-10" />
                  <span className="tracking-tight">CRIAR MINHA LOJA GRÁTIS AGORA</span>
                </button>
                <p className="mt-6 text-neutral-400">Menos de 2 minutos para configurar. Cancele quando quiser.</p>
              </div>

            </div>
          </section>

        </main>

        <Footer />
      </div>

      {/* LEAD CAPTURE MODAL */}
      {showLeadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="bg-[#050510] border border-[#E6B53C]/30 rounded-3xl w-full max-w-md flex flex-col overflow-hidden shadow-[0_0_80px_rgba(230,181,60,0.2)]"
          >
            <div className="p-8 pb-0 text-center">
              <h2 className="text-3xl font-black text-white mb-2">Quase Lá!</h2>
              <p className="text-sm text-neutral-400">Só precisamos de 3 informações para liberar a criação da sua loja.</p>
            </div>
            
            <form onSubmit={handleLeadSubmit} className="p-8 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Nome do Lojista</label>
                <input 
                  type="text" 
                  required 
                  value={leadName}
                  onChange={e => setLeadName(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#E6B53C] focus:ring-1 focus:ring-[#E6B53C] outline-none transition-all"
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">E-mail Profissional</label>
                <input 
                  type="email" 
                  required 
                  value={leadEmail}
                  onChange={e => setLeadEmail(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#E6B53C] focus:ring-1 focus:ring-[#E6B53C] outline-none transition-all"
                  placeholder="joao@minhaloja.com"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">WhatsApp da Loja</label>
                <input 
                  type="tel" 
                  required 
                  value={leadPhone}
                  onChange={e => setLeadPhone(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#E6B53C] focus:ring-1 focus:ring-[#E6B53C] outline-none transition-all"
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div className="pt-4 flex flex-col gap-3">
                <button 
                  type="submit"
                  disabled={isSubmittingLead}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#E6B53C] to-[#B38F25] text-black font-black hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {isSubmittingLead ? <Loader2 className="w-5 h-5 animate-spin" /> : <Store className="w-5 h-5" />}
                  {isSubmittingLead ? "Carregando..." : "Prosseguir e Criar Loja"}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowLeadModal(false)}
                  className="w-full py-3 text-neutral-500 hover:text-white transition-colors text-sm font-semibold"
                >
                  Voltar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
