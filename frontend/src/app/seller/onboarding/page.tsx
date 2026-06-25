"use client";

export const dynamic = "force-dynamic";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sellerDashboardApi, catalogApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { OfficialLogo } from "@/components/Brand";
import {
  Rocket, Store, Image as ImageIcon, FileText, DollarSign,
  Clock, CheckCircle2, ChevronRight, ShieldCheck, Zap,
  Loader2, Play, Flame, ArrowRight, ArrowLeft, MailCheck, RefreshCw
} from "lucide-react";
import Confetti from "react-confetti";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { ProductMediaUploader } from "@/components/seller/ProductMediaUploader";

export default function SellerOnboardingPage() {
  const router = useRouter();
  
  const { user, updateUser } = useAuthStore();

  // 0 = Criação da Loja, 1 = Regras, 2 = Fase 1 (Base), 3 = Fase 2 (Booster)
  const [phase, setPhase] = useState(0);

  // Gate de verificação de e-mail (double opt-in no nível da conta)
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  // Se a conta logada ainda não confirmou o e-mail, bloqueia antes do formulário.
  useEffect(() => {
    if (user && user.email_verified === false) {
      setNeedsEmailVerification(true);
    }
  }, [user]);

  const handleResendVerification = async () => {
    setResending(true);
    setResendMsg("");
    try {
      const res = await authApi.resendVerification();
      setResendMsg(res.data?.detail || "Link reenviado! Confira sua caixa de entrada.");
    } catch (err: any) {
      setResendMsg(err.response?.data?.detail || "Não foi possível reenviar agora. Tente em instantes.");
    } finally {
      setResending(false);
    }
  };

  const handleAlreadyConfirmed = async () => {
    try {
      const res = await authApi.me();
      updateUser(res.data);
      if (res.data?.email_verified) {
        setNeedsEmailVerification(false);
        setResendMsg("");
      } else {
        setResendMsg("Ainda não detectamos a confirmação. Clique no link do e-mail e tente de novo.");
      }
    } catch {
      setResendMsg("Não foi possível verificar o status agora. Tente novamente.");
    }
  };
  
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [isLoadingCats, setIsLoadingCats] = useState(true);

  // Fase 0 Data (Store Creation)
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [personType, setPersonType] = useState("PF");
  const [storeCpfCnpj, setStoreCpfCnpj] = useState("");
  const [isSubmittingStore, setIsSubmittingStore] = useState(false);

  const formatCpfCnpj = (value: string, type: string) => {
    const digits = value.replace(/\D/g, "");
    if (type === "PF") {
      return digits
        .substring(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2");
    } else {
      return digits
        .substring(0, 14)
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})/, "$1-$2");
    }
  };

  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoreCpfCnpj(formatCpfCnpj(e.target.value, personType));
  };

  // Fase 1 Data (Product Skeleton)
  const [productName, setProductName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [productStock, setProductStock] = useState("");
  const [isSubmittingPhase1, setIsSubmittingPhase1] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);

  // Fase 2 Data
  const [description, setDescription] = useState("");
  const [promotionalPrice, setPromotionalPrice] = useState("");
  const [promoEndsAt, setPromoEndsAt] = useState("");
  const [mediaCount, setMediaCount] = useState(0);
  const [mediaError, setMediaError] = useState("");
  const [isSubmittingPhase2, setIsSubmittingPhase2] = useState(false);
  
  // Confetti / Done
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Busca as categorias reais para o dropdown
    catalogApi.getCategories()
      .then(res => setCategories(res.data.results || res.data))
      .catch(err => console.error("Erro ao buscar categorias:", err))
      .finally(() => setIsLoadingCats(false));
  }, []);

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingStore(true);
    try {
      await sellerDashboardApi.apply({
        store_name: storeName,
        description: storeDescription,
        cpf_cnpj: storeCpfCnpj.replace(/\D/g, '')
      });
      // Refresh user role via authApi.me ou atualiza Zustand manualmente
      updateUser({ is_seller: true, role: "seller" });
      setPhase(1); // Vai para as Regras do Jogo
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403 && err.response?.data?.code === "email_not_verified") {
        setNeedsEmailVerification(true);
        return;
      }
      alert(err.response?.data?.detail || "Erro ao criar loja. O nome pode já estar em uso.");
    } finally {
      setIsSubmittingStore(false);
    }
  };

  const handlePhase1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPhase1(true);
    try {
      const res = await sellerDashboardApi.products.create({
        name: productName,
        category: categoryId,
        base_price: parseFloat(basePrice),
        initial_stock: productStock ? parseInt(productStock, 10) : 0,
      });
      setCreatedProductId(res.data.id);
      setPhase(3); // Vai para o Booster
    } catch (err) {
      console.error(err);
      alert("Erro ao criar o esqueleto do produto. Verifique os dados.");
    } finally {
      setIsSubmittingPhase1(false);
    }
  };

  const handlePhase2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdProductId) return;

    // Fotos já foram enviadas ao vivo pelo uploader; exige ao menos a capa.
    if (mediaCount < 1) {
      setMediaError("Adicione ao menos 1 foto para publicar o produto.");
      return;
    }
    setMediaError("");

    setIsSubmittingPhase2(true);
    try {
      // Atualiza texto/promo e PUBLICA (is_available) — as mídias já estão salvas.
      await sellerDashboardApi.products.update(createdProductId, {
        description,
        is_available: true,
        promotional_price: promotionalPrice ? parseFloat(promotionalPrice) : null,
        promo_ends_at: promoEndsAt ? new Date(promoEndsAt).toISOString() : null
      });

      setShowConfetti(true);
      setTimeout(() => {
        router.push("/seller/dashboard");
      }, 4000);

    } catch (err) {
      console.error(err);
      alert("Erro ao aplicar o booster no produto.");
    } finally {
      setIsSubmittingPhase2(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050510] text-neutral-200 font-sans flex flex-col selection:bg-[#E6B53C] selection:text-black relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#E6B53C]/10 blur-[150px] pointer-events-none"></div>
      
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} />}

      {/* Header Minimalista */}
      <header className="px-6 py-6 border-b border-white/5 flex justify-between items-center relative z-10 bg-[#050510]/80 backdrop-blur-md">
        <OfficialLogo className="w-[180px] h-auto drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]" />
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${phase >= 0 ? "bg-[#E6B53C] shadow-[0_0_10px_#E6B53C]" : "bg-white/20"}`}></span>
            <div className={`w-8 h-px ${phase >= 1 ? "bg-[#E6B53C]" : "bg-white/20"}`}></div>
            <span className={`w-3 h-3 rounded-full ${phase >= 1 ? "bg-[#E6B53C] shadow-[0_0_10px_#E6B53C]" : "bg-white/20"}`}></span>
            <div className={`w-8 h-px ${phase >= 2 ? "bg-[#E6B53C]" : "bg-white/20"}`}></div>
            <span className={`w-3 h-3 rounded-full ${phase >= 2 ? "bg-[#E6B53C] shadow-[0_0_10px_#E6B53C]" : "bg-white/20"}`}></span>
            <div className={`w-8 h-px ${phase >= 3 ? "bg-[#E6B53C]" : "bg-white/20"}`}></div>
            <span className={`w-3 h-3 rounded-full ${phase >= 3 ? "bg-[#E6B53C] shadow-[0_0_10px_#E6B53C]" : "bg-white/20"}`}></span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            {phase === 0 ? "Fundação da Loja" : phase === 1 ? "Preparação" : phase === 2 ? "Criação Básica" : "Booster Algorítmico"}
          </span>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-6 relative z-10">
        {needsEmailVerification ? (
          <motion.div
            key="email-gate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-[#0A0A15] border border-white/10 rounded-3xl p-8 md:p-10 text-center shadow-2xl relative overflow-hidden"
          >
            <div className="w-16 h-16 rounded-full bg-[#E6B53C]/10 border border-[#E6B53C]/30 flex items-center justify-center mx-auto mb-5">
              <MailCheck className="w-9 h-9 text-[#E6B53C]" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Confirme seu e-mail</h2>
            <p className="text-neutral-400 mb-1">
              Para abrir sua loja, confirme o e-mail enviado para
            </p>
            <p className="text-white font-bold mb-6 break-all">{user?.email}</p>
            <p className="text-sm text-neutral-500 mb-8">
              Abra o link que enviamos (verifique também o spam). Assim que confirmar,
              clique em <strong className="text-neutral-300">"Já confirmei"</strong> para continuar.
            </p>

            {resendMsg && (
              <div className="mb-5 text-sm px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-300">
                {resendMsg}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={handleAlreadyConfirmed}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#E6B53C] to-[#B38F25] text-black font-black hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" /> Já confirmei
              </button>
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {resending ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                {resending ? "Reenviando..." : "Reenviar e-mail"}
              </button>
            </div>
          </motion.div>
        ) : (
        <AnimatePresence mode="wait">
          
          {/* FASE 0: FUNDAÇÃO DA LOJA */}
          {phase === 0 && (
            <motion.div 
              key="phase0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-xl w-full bg-[#0A0A15] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
            >
              <div className="mb-4">
                <button onClick={() => router.back()} className="text-neutral-400 hover:text-white flex items-center gap-2 transition-colors text-sm font-semibold uppercase tracking-widest">
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
              </div>
              <div className="mb-10 text-center relative z-10">
                <Store className="w-12 h-12 text-[#E6B53C] mx-auto mb-4" />
                <h2 className="text-3xl font-black text-white mb-3">Fundação da sua Loja</h2>
                <p className="text-neutral-400">Como o mundo vai chamar o seu novo império de vendas?</p>
              </div>

              <form onSubmit={handleStoreSubmit} className="space-y-6 relative z-10">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Nome da Loja</label>
                  <input 
                    type="text" 
                    required 
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    className="w-full mt-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#E6B53C] outline-none transition-colors"
                    placeholder="Ex: Tech Imports"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">O que você vende? (Bio)</label>
                  <textarea 
                    required 
                    rows={3}
                    value={storeDescription}
                    onChange={e => setStoreDescription(e.target.value)}
                    className="w-full mt-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#E6B53C] outline-none transition-colors resize-none"
                    placeholder="Especialistas em produtos importados premium..."
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 block">Tipo de Pessoa</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input 
                        type="radio" 
                        name="personType" 
                        value="PF" 
                        checked={personType === "PF"} 
                        onChange={() => { setPersonType("PF"); setStoreCpfCnpj(""); }}
                        className="accent-[#E6B53C]" 
                      />
                      Pessoa Física (CPF)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input 
                        type="radio" 
                        name="personType" 
                        value="PJ" 
                        checked={personType === "PJ"} 
                        onChange={() => { setPersonType("PJ"); setStoreCpfCnpj(""); }}
                        className="accent-[#E6B53C]" 
                      />
                      Pessoa Jurídica (CNPJ)
                    </label>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{personType === "PF" ? "CPF" : "CNPJ"}</label>
                  <input 
                    type="text" 
                    required 
                    value={storeCpfCnpj}
                    onChange={handleCpfCnpjChange}
                    className="w-full mt-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#E6B53C] outline-none transition-colors"
                    placeholder={personType === "PF" ? "000.000.000-00" : "00.000.000/0001-00"}
                  />
                </div>
                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={isSubmittingStore}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#E6B53C] to-[#B38F25] text-black font-black hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    {isSubmittingStore ? <Loader2 className="w-6 h-6 animate-spin" /> : <ChevronRight className="w-6 h-6" />}
                    {isSubmittingStore ? "Criando Vitrine..." : "Criar Vitrine e Avançar"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* FASE 1: REGRAS DO JOGO */}
          {phase === 1 && (
            <motion.div 
              key="phase1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-4xl w-full bg-[#0A0A15] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldCheck className="w-64 h-64 text-[#E6B53C]" />
              </div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E6B53C]/10 border border-[#E6B53C]/30 text-[#E6B53C] text-sm font-black mb-8 uppercase tracking-widest">
                  <Play className="w-4 h-4" /> Passo Inicial
                </div>
                
                <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
                  Bem-vindo à Máquina. <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FCE6A0] to-[#B38F25]">Aqui estão as Regras do Jogo.</span>
                </h1>
                
                <p className="text-xl text-neutral-400 mb-10 max-w-2xl font-light">
                  Nós não somos uma feira livre. Para o algoritmo jogar seu produto no topo e atrair compradores reais, você precisa cumprir o Padrão Ouro:
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-12">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                    <ImageIcon className="w-10 h-10 text-[#E6B53C] mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Imagens Impecáveis</h3>
                    <p className="text-neutral-400 text-sm">Não use fotos embaçadas ou tiradas no escuro. A proporção ideal é 1080x1080, com fundo limpo (branco ou neutro).</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                    <FileText className="w-10 h-10 text-[#E6B53C] mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Copywriting (Persuasão)</h3>
                    <p className="text-neutral-400 text-sm">Clientes não compram características técnicas, compram transformações. Use gatilhos mentais na descrição do seu produto.</p>
                  </div>
                </div>

                <button 
                  onClick={() => setPhase(2)}
                  className="group relative inline-flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-[#E6B53C] to-[#B38F25] text-black font-black rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(230,181,60,0.4)] w-full md:w-auto"
                >
                  <Store className="w-6 h-6" />
                  <span className="text-lg">Entendi as regras. Criar Meu 1º Produto.</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {/* FASE 2: O ESQUELETO */}
          {phase === 2 && (
            <motion.div 
              key="phase2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-2xl w-full bg-[#0A0A15] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative"
            >
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-black text-white mb-3">Fase 1: O Esqueleto</h2>
                <p className="text-neutral-400">Preencha o básico para cravar a existência do produto no nosso banco de dados.</p>
              </div>

              <form onSubmit={handlePhase1Submit} className="space-y-6">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Nome do Produto</label>
                  <input 
                    type="text" 
                    required 
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    className="w-full mt-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#E6B53C] outline-none transition-colors"
                    placeholder="Ex: Tênis Nike Air Max Pro"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Categoria Principal</label>
                  <select 
                    required 
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full mt-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#E6B53C] outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="bg-[#0A0A15] text-neutral-500">Selecione uma categoria...</option>
                    {isLoadingCats ? (
                      <option value="" disabled className="bg-[#0A0A15]">Carregando categorias...</option>
                    ) : (
                      categories.map(cat => (
                        <option key={cat.id} value={cat.id} className="bg-[#0A0A15] text-white">{cat.name}</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Preço Base (Preço Cheio R$)</label>
                  <div className="relative mt-2">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input 
                      type="number" 
                      step="0.01"
                      required 
                      value={basePrice}
                      onChange={e => setBasePrice(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#E6B53C] outline-none transition-colors font-mono text-lg"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Estoque inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={productStock}
                    onChange={e => setProductStock(e.target.value)}
                    className="w-full mt-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#E6B53C] outline-none transition-colors font-mono text-lg"
                    placeholder="Ex: 10 unidades"
                  />
                  <p className="text-xs text-neutral-500 mt-1.5">Quantas unidades você tem para vender agora.</p>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    disabled={isSubmittingPhase1}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#E6B53C] to-[#B38F25] text-black font-black hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    {isSubmittingPhase1 ? <Loader2 className="w-6 h-6 animate-spin" /> : <ChevronRight className="w-6 h-6" />}
                    {isSubmittingPhase1 ? "Salvando Esqueleto..." : "Avançar para a Fase 2"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* FASE 3: O BOOSTER ALGORÍTMICO */}
          {phase === 3 && (
            <motion.div 
              key="phase3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-4xl w-full bg-gradient-to-br from-[#100A05] to-[#050510] border border-[#E6B53C]/30 rounded-3xl p-8 md:p-12 shadow-[0_0_80px_rgba(230,181,60,0.1)] relative"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 blur-[150px] pointer-events-none rounded-full"></div>
              
              <div className="mb-10 flex flex-col items-center text-center relative z-10">
                <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-4 border border-orange-500/30">
                  <Flame className="w-8 h-8 text-orange-500 animate-pulse" />
                </div>
                <h2 className="text-3xl font-black text-white mb-3">Fase 2: Booster Algorítmico</h2>
                <p className="text-neutral-400 max-w-2xl">
                  Seu produto já existe no banco de dados. Agora vamos injetar esteroides nele.
                  <br/><strong className="text-white">Dica: Configurar uma Oferta Relâmpago joga seu produto para o topo da página inicial automaticamente.</strong>
                </p>
              </div>

              <form onSubmit={handlePhase2Submit} className="space-y-8 relative z-10">
                {/* Mídia: até 6 fotos + 1 vídeo (upload ao vivo) */}
                {createdProductId && (
                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5">
                    <ProductMediaUploader
                      productId={createdProductId}
                      onChange={({ images }) => setMediaCount(images.length)}
                    />
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Coluna Esquerda */}
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Descrição Persuasiva
                      </label>
                      <textarea 
                        rows={6}
                        required
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full mt-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#E6B53C] outline-none transition-colors resize-none"
                        placeholder="Ex: Transforme a sua rotina com o novo tênis que absorve 90% do impacto..."
                      />
                    </div>
                  </div>

                  {/* Coluna Direita (Oferta Relâmpago) */}
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-3 border-b border-orange-500/20 pb-4">
                      <Zap className="w-6 h-6 text-orange-500" />
                      <div>
                        <h3 className="font-bold text-white tracking-wide">Oferta Relâmpago (Opcional)</h3>
                        <p className="text-xs text-orange-400">Ativa o gatilho de escassez (FOMO)</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Preço Promocional (R$)</label>
                      <div className="relative mt-2">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                        <input 
                          type="number" 
                          step="0.01"
                          value={promotionalPrice}
                          onChange={e => setPromotionalPrice(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-black/40 border border-orange-500/30 rounded-xl text-white focus:border-orange-500 outline-none transition-colors font-mono text-lg"
                          placeholder="Ex: 199.90 (Mais barato que o Base)"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Fim da Oferta (Cronômetro)</label>
                      <div className="relative mt-2">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                        <input 
                          type="datetime-local" 
                          value={promoEndsAt}
                          onChange={e => setPromoEndsAt(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-black/40 border border-orange-500/30 rounded-xl text-white focus:border-orange-500 outline-none transition-colors font-mono text-sm [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 space-y-3">
                  {mediaError && (
                    <p className="text-sm text-red-400 font-semibold text-center">{mediaError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmittingPhase2}
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-black hover:opacity-90 transition-opacity flex items-center justify-center gap-3 text-lg shadow-[0_0_40px_rgba(249,115,22,0.4)] disabled:opacity-50"
                  >
                    {isSubmittingPhase2 ? <Loader2 className="w-6 h-6 animate-spin" /> : <Rocket className="w-6 h-6" />}
                    {isSubmittingPhase2 ? "Aplicando Booster Algorítmico..." : "PUBLICAR PRODUTO E ACESSAR PAINEL"}
                  </button>
                  <p className="text-xs text-neutral-500 text-center">
                    {mediaCount > 0
                      ? `${mediaCount} foto(s) adicionada(s) — pronto para publicar.`
                      : "Adicione ao menos 1 foto acima para liberar a publicação."}
                  </p>
                </div>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
        )}
      </main>
    </div>
  );
}
