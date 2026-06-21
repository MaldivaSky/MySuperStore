"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OfficialLogo } from "@/components/Brand";
import { motion } from "framer-motion";
import {
  Rocket, ShieldCheck, CreditCard, 
  MessageCircle, Search, Target, DollarSign, Lock, Smartphone, 
  BarChart3, Clock, AlertTriangle, Users, Globe, ChevronDown, XCircle, CheckCircle2, Server, Loader2
} from "lucide-react";
import { useState } from "react";
import { crmApi } from "@/lib/api";

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};

export default function WhiteLabelPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  
  const WHATSAPP_URL = "https://wa.me/5511919889233?text=Rafael, quero agir rápido. Como compro a licença White-label da plataforma e crio o meu marketplace?";

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLead(true);
    try {
      await crmApi.createLead({
        name: leadName,
        phone: leadPhone,
        email: leadEmail,
        funnel_type: "white_label",
        source: "Landing Page White-Label"
      });
      // Redirecionar para o WhatsApp
      window.location.href = WHATSAPP_URL;
    } catch (err) {
      console.error(err);
      // Fallback de segurança: se der erro na API, vai pro whats igual pra n perder a venda
      window.location.href = WHATSAPP_URL;
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const faqs = [
    {
      q: "Eu não sei programar. Posso ter meu próprio marketplace?",
      a: "Absolutamente sim. Nós entregamos a plataforma pronta, rodando nos nossos servidores, com a SUA marca. O seu único trabalho será trazer os lojistas e os clientes. A tecnologia é 100% gerenciada por nós."
    },
    {
      q: "Como funciona o repasse de pagamentos? Vou ter dor de cabeça?",
      a: "Nenhuma. Nossa integração nativa com o Stripe Connect faz o 'Split de Pagamento' no exato milissegundo da compra. A sua comissão (take-rate) cai na sua conta, e o restante cai direto na conta do lojista. Risco zero de chargeback ou bitributação para você."
    },
    {
      q: "A plataforma aguenta tráfego pesado? E na Black Friday?",
      a: "Construímos a arquitetura com Next.js Edge + Django serverless. Isso significa que ela escala automaticamente. Se você tiver 10 acessos ou 100.000 acessos simultâneos, o site continuará rápido como a luz."
    },
    {
      q: "Quanto tempo demora para colocar o meu marketplace no ar?",
      a: "Enquanto criar um marketplace do zero leva de 12 a 18 meses, a nossa solução White-Label é implementada, personalizada com as suas cores e logomarca, e entregue pronta para faturar em apenas 48 horas."
    }
  ];

  return (
    <div className="min-h-screen bg-[#020205] text-neutral-200 font-sans selection:bg-[#E6B53C] selection:text-black">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#E6B53C]/5 blur-[150px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[150px]"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen overflow-x-hidden">
        <Header />

        <main className="flex-grow">
          {/* ====================================================== */}
          {/*  HERO SECTION: Foco no Investidor "God Mode"           */}
          {/* ====================================================== */}
          <section className="relative w-full max-w-7xl mx-auto px-6 pt-20 pb-32 md:pt-32 md:pb-40 flex flex-col items-center text-center">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex flex-col items-center w-full">
              
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E6B53C]/10 border border-[#E6B53C]/30 text-[#E6B53C] text-sm md:text-base font-black mb-10 uppercase tracking-widest shadow-[0_0_30px_rgba(230,181,60,0.3)]">
                <Target className="w-6 h-6" />
                <span>Para Investidores, Empreendedores e Visionários</span>
              </div>
              
              <OfficialLogo className="w-[200px] md:w-[300px] h-auto drop-shadow-[0_0_40px_rgba(212,175,55,0.4)] mb-8" />
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] max-w-6xl tracking-tight">
                Por Que Apenas Jogar O Jogo <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FCE6A0] via-[#E6B53C] to-[#A4711B]">
                  Quando Você Pode Ser O Dono Do Cassino?
                </span>
              </h1>
              
              <p className="mt-8 text-xl md:text-2xl text-neutral-400 leading-relaxed max-w-5xl font-light">
                Esqueça a briga por margens pequenas. A verdadeira riqueza está em fornecer a infraestrutura. Com a nossa <strong className="text-white font-bold">Licença White-Label</strong>, você coloca a sua logomarca em cima da nossa tecnologia, convida lojistas, e <strong className="text-white font-bold">recolhe uma porcentagem de absolutamente TUDO que for vendido.</strong>
              </p>

              <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-2xl">
                <button
                  onClick={() => setShowLeadModal(true)}
                  className="group relative flex items-center justify-center gap-3 px-8 py-6 bg-gradient-to-b from-[#E6B53C] to-[#B38F25] text-black font-black rounded-2xl transition-all duration-300 w-full hover:scale-105 hover:shadow-[0_0_50px_rgba(230,181,60,0.5)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-700 ease-in-out"></div>
                  <Rocket className="h-7 w-7" />
                  <div className="text-left flex flex-col">
                    <span className="text-lg md:text-xl tracking-tight leading-none mb-1">Adquirir Licença White-Label</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-80">Falar com Fundador via WhatsApp</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </section>

          {/* ====================================================== */}
          {/*  B2B / WHITE-LABEL: O PITCH DE "GOD MODE"           */}
          {/* ====================================================== */}
          <section id="white-label" className="relative py-32 bg-[#020205] border-t border-white/[0.05]">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
              
              {/* The "God Mode" Comparison */}
              <div className="bg-[#050510] border border-white/10 rounded-[3rem] p-8 md:p-20 mb-32 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 blur-[150px]"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-500/10 blur-[150px]"></div>
                
                <h3 className="text-4xl lg:text-5xl font-black text-white mb-16 text-center tracking-tight">O Caminho Lento vs. A Via Expressa</h3>
                
                <div className="grid lg:grid-cols-2 gap-16 relative">
                  <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent -translate-x-1/2"></div>
                  
                  {/* Lado Perdedor */}
                  <div className="pr-0 lg:pr-8">
                    <h4 className="text-red-500 font-black text-3xl mb-10 flex items-center gap-4">
                      <XCircle className="w-10 h-10"/> Construir do Zero
                    </h4>
                    <ul className="space-y-8">
                      <li className="flex gap-5 items-start">
                        <Clock className="w-8 h-8 text-red-500 shrink-0 mt-1"/>
                        <div>
                          <p className="text-white font-bold text-xl mb-1">12 a 18 Meses de Agonia</p>
                          <p className="text-neutral-400 text-base">Contratar programadores, gerenciar escopo, e atrasos intermináveis.</p>
                        </div>
                      </li>
                      <li className="flex gap-5 items-start">
                        <DollarSign className="w-8 h-8 text-red-500 shrink-0 mt-1"/>
                        <div>
                          <p className="text-white font-bold text-xl mb-1">Investimento Inicial de R$ 300.000+</p>
                          <p className="text-neutral-400 text-base">Salários de devs seniores, servidores cloud caríssimos e APIs de pagamento.</p>
                        </div>
                      </li>
                      <li className="flex gap-5 items-start">
                        <AlertTriangle className="w-8 h-8 text-red-500 shrink-0 mt-1"/>
                        <div>
                          <p className="text-white font-bold text-xl mb-1">Risco Absurdo de Fracasso</p>
                          <p className="text-neutral-400 text-base">Você lança um produto cheio de bugs que espanta clientes no primeiro dia.</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* Lado Vencedor */}
                  <div className="pl-0 lg:pl-8">
                    <h4 className="text-green-400 font-black text-3xl mb-10 flex items-center gap-4">
                      <CheckCircle2 className="w-10 h-10"/> Nossa Licença White-Label
                    </h4>
                    <ul className="space-y-8">
                      <li className="flex gap-5 items-start">
                        <Rocket className="w-8 h-8 text-green-400 shrink-0 mt-1"/>
                        <div>
                          <p className="text-white font-bold text-xl mb-1">Sua Marca no Ar em 48 Horas</p>
                          <p className="text-neutral-400 text-base">Plug and play. Trocamos as cores, inserimos seu logotipo, conectamos seu domínio e pronto.</p>
                        </div>
                      </li>
                      <li className="flex gap-5 items-start">
                        <DollarSign className="w-8 h-8 text-green-400 shrink-0 mt-1"/>
                        <div>
                          <p className="text-white font-bold text-xl mb-1">Fração Minúscula do Custo</p>
                          <p className="text-neutral-400 text-base">Sem equipe técnica, sem CTO caro. O modelo de licenciamento salva o seu caixa para investir em marketing.</p>
                        </div>
                      </li>
                      <li className="flex gap-5 items-start">
                        <ShieldCheck className="w-8 h-8 text-green-400 shrink-0 mt-1"/>
                        <div>
                          <p className="text-white font-bold text-xl mb-1">Testada à Prova de Balas</p>
                          <p className="text-neutral-400 text-base">O código já está refinado, lidando com milhares de requisições. Conversão otimizada e segurança bancária nativa.</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Feature Grid Detalhado B2B */}
              <div className="text-center mb-16">
                <h3 className="text-4xl font-extrabold text-white mb-6">Tudo Que Você Precisa Para Comandar o Show</h3>
                <p className="text-xl text-neutral-400 max-w-3xl mx-auto">Não somos apenas um template. Somos a espinha dorsal de um banco, a velocidade de uma big tech e a conversão de uma loja campeã.</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
                <div className="bg-[#050510] border border-white/5 hover:border-[#E6B53C]/40 rounded-3xl p-8 transition-all duration-300 group shadow-lg">
                  <div className="w-16 h-16 bg-[#E6B53C]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-8 h-8 text-[#E6B53C]" />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-4">Seu Take-Rate, Suas Regras</h4>
                  <p className="text-neutral-400 leading-relaxed">Você dita a porcentagem. Cobre 10%, 15% ou 25% de taxa por venda. O sistema recorta o seu dinheiro da venda automaticamente e deposita na sua conta. Lucro passivo puro.</p>
                </div>
                <div className="bg-[#050510] border border-white/5 hover:border-[#E6B53C]/40 rounded-3xl p-8 transition-all duration-300 group shadow-lg">
                  <div className="w-16 h-16 bg-[#E6B53C]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Smartphone className="w-8 h-8 text-[#E6B53C]" />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-4">Totalmente White-Label</h4>
                  <p className="text-neutral-400 leading-relaxed">Seu cliente nunca ouvirá falar da plataforma original. O sistema terá o seu nome, o seu logotipo, no seu domínio. Todo o crédito e valor da marca ficam com você.</p>
                </div>
                <div className="bg-[#050510] border border-white/5 hover:border-[#E6B53C]/40 rounded-3xl p-8 transition-all duration-300 group shadow-lg">
                  <div className="w-16 h-16 bg-[#E6B53C]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Server className="w-8 h-8 text-[#E6B53C]" />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-4">Nós Cuidamos da TI</h4>
                  <p className="text-neutral-400 leading-relaxed">Hospedagem robusta, manutenção constante, prevenção de ataques DDoS, backups diários de banco de dados. Foque nas vendas, nós focamos nos servidores.</p>
                </div>
                <div className="bg-[#050510] border border-white/5 hover:border-[#E6B53C]/40 rounded-3xl p-8 transition-all duration-300 group shadow-lg">
                  <div className="w-16 h-16 bg-[#E6B53C]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Globe className="w-8 h-8 text-[#E6B53C]" />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-4">SEO Nativo Implacável</h4>
                  <p className="text-neutral-400 leading-relaxed">A arquitetura permite renderização no servidor (SSR). O que isso significa? O Google vai indexar a sua loja e de seus vendedores como um raio, dominando as buscas orgânicas.</p>
                </div>
                <div className="bg-[#050510] border border-white/5 hover:border-[#E6B53C]/40 rounded-3xl p-8 transition-all duration-300 group shadow-lg">
                  <div className="w-16 h-16 bg-[#E6B53C]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8 text-[#E6B53C]" />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-4">Painel Super-Admin</h4>
                  <p className="text-neutral-400 leading-relaxed">Tenha visão onipotente do seu negócio. Veja faturamento global em tempo real, gerencie lojistas, aprove produtos e bloqueie contas maliciosas em um clique.</p>
                </div>
                <div className="bg-[#050510] border border-white/5 hover:border-[#E6B53C]/40 rounded-3xl p-8 transition-all duration-300 group shadow-lg">
                  <div className="w-16 h-16 bg-[#E6B53C]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Search className="w-8 h-8 text-[#E6B53C]" />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-4">Busca Hyper-Inteligente</h4>
                  <p className="text-neutral-400 leading-relaxed">Motor de busca que entende erros de digitação e auto-completa. Resultados instantâneos. Quem acha fácil, compra rápido.</p>
                </div>
              </div>

              {/* ====================================================== */}
              {/*  FAQ SECTION                                           */}
              {/* ====================================================== */}
              <div className="max-w-4xl mx-auto mb-32">
                <h3 className="text-4xl font-extrabold text-white mb-12 text-center">Dúvidas Frequentes</h3>
                <div className="space-y-4">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                      <button 
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        className="w-full px-8 py-6 text-left flex justify-between items-center focus:outline-none"
                      >
                        <span className="text-xl font-bold text-white">{faq.q}</span>
                        <ChevronDown className={`w-6 h-6 text-[#E6B53C] transition-transform duration-300 ${openFaq === idx ? "rotate-180" : ""}`} />
                      </button>
                      {openFaq === idx && (
                        <div className="px-8 pb-6 text-neutral-400 text-lg leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ====================================================== */}
              {/*  THE ULTIMATE CLOSING PITCH & URGENCY                  */}
              {/* ====================================================== */}
              <div className="bg-gradient-to-r from-red-600 to-orange-600 p-1.5 rounded-[3rem] animate-pulse-slow shadow-[0_0_80px_rgba(239,68,68,0.3)] mb-32">
                <div className="bg-[#050510] rounded-[2.8rem] p-10 md:p-20 flex flex-col items-center text-center">
                  
                  <h3 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-tight">
                    O Custo da Inação é Ver os Outros <br className="hidden lg:block"/> 
                    Enriquecerem no Seu Lugar.
                  </h3>
                  
                  <p className="text-2xl text-neutral-300 font-light max-w-4xl mb-16 leading-relaxed">
                    Você pode fechar essa página, continuar tentando criar sua plataforma do zero e gastar milhares de reais e anos da sua vida. Ou você pode clicar no botão abaixo, adquirir a licença pronta, e ter o **seu próprio mercado operando com a sua marca na próxima segunda-feira.**
                  </p>

                  <button
                    onClick={() => setShowLeadModal(true)}
                    className="group relative flex flex-col items-center justify-center gap-2 px-12 py-8 bg-[#25D366] hover:bg-[#1DA851] text-white font-black rounded-full transition-all duration-500 hover:scale-[1.03] shadow-[0_0_50px_rgba(37,211,102,0.5)] w-full max-w-2xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-700 ease-in-out"></div>
                    <div className="flex items-center gap-4 text-2xl md:text-4xl tracking-tight z-10">
                      <MessageCircle className="w-10 h-10 md:w-12 md:h-12" />
                      FALAR COM O FUNDADOR AGORA
                    </div>
                    <span className="text-sm md:text-lg font-normal opacity-90 z-10">(Atendimento Direto pelo WhatsApp de Alto Nível)</span>
                  </button>
                  <p className="mt-6 text-neutral-500 flex items-center gap-2 justify-center"><Lock className="w-4 h-4"/> Conversa 100% confidencial e sem compromisso imediato.</p>
                </div>
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
              <h2 className="text-3xl font-black text-white mb-2">Liberação de Acesso</h2>
              <p className="text-sm text-neutral-400">Preencha rapidamente para ser redirecionado ao WhatsApp Pessoal do Fundador.</p>
            </div>
            
            <form onSubmit={handleLeadSubmit} className="p-8 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Nome Completo</label>
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
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">E-mail Corporativo</label>
                <input 
                  type="email" 
                  required 
                  value={leadEmail}
                  onChange={e => setLeadEmail(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#E6B53C] focus:ring-1 focus:ring-[#E6B53C] outline-none transition-all"
                  placeholder="joao@empresa.com"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">WhatsApp</label>
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
                  {isSubmittingLead ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                  {isSubmittingLead ? "Carregando..." : "Prosseguir para o WhatsApp"}
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
