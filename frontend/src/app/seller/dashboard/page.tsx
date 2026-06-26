"use client";

export const dynamic = "force-dynamic";


import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { sellerApi } from "@/lib/api";
import { Header } from "@/components/Header";
import { BrandLoader } from "@/components/ui/BrandLoader";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Store, 
  CreditCard, 
  Package, 
  Layers, 
  ShoppingBag, 
  DollarSign, 
  Send,
  Activity,
  Star,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Settings,
  X,
  Loader2
} from "lucide-react";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<any>(null);
  const [errorType, setErrorType] = useState<"no_store" | "other" | null>(null);
  
  // Form para nova loja
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [efiPayeeCode, setEfiPayeeCode] = useState("");
  const [logoExternal, setLogoExternal] = useState("");
  const [bannerExternal, setBannerExternal] = useState("");
  const [banner2External, setBanner2External] = useState("");
  const [banner3External, setBanner3External] = useState("");
  const [originCep, setOriginCep] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");


  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | null>(null);

  // Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const fetchStoreData = async () => {
    setLoading(true);
    setErrorType(null);
    try {
      const { data } = await sellerApi.me();
      setStore(data);
    } catch (err: any) {
      const st = err.response?.status;
      if (st === 403 || st === 404) {
        // Esperado: usuário ainda não tem loja — não é erro, não polui o console
        setErrorType("no_store");
      } else {
        console.error(err);
        setErrorType("other");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated && user?.role !== "seller" && user?.role !== "admin") {
      router.push("/");
    } else if (isAuthenticated) {
      fetchStoreData();
    }
  }, [isAuthenticated, user, router, searchParams]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      await sellerApi.apply({
        store_name: storeName,
        description,
        pix_key: pixKey,
        efi_payee_code: efiPayeeCode,
        origin_cep: originCep,
      });
      await fetchStoreData();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.detail || "Erro ao cadastrar sua loja. Verifique os dados.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      await sellerApi.update({
        store_name: storeName,
        description,
        pix_key: pixKey,
        efi_payee_code: efiPayeeCode,
        logo_external: logoExternal,
        banner_external: bannerExternal,
        banner2_external: banner2External,
        banner3_external: banner3External,
      });
      await fetchStoreData();
      setIsSettingsOpen(false);
      setToastMessage("Loja atualizada com sucesso!");
      setToastType("success");
      setTimeout(() => setToastMessage(""), 3000);
    } catch (err: any) {
      alert("Erro ao atualizar loja.");
    } finally {
      setSettingsLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center py-20">
        <BrandLoader size="lg" text="Carregando informações..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast Notificação */}
      {toastMessage && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          toastType === "success" 
            ? "bg-green-500/10 border-green-500/20 text-green-500" 
            : "bg-red-500/10 border-red-500/20 text-red-500"
        }`}>
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. FORM DE CANDIDATURA */}
      {errorType === "no_store" && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto p-8 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-2xl"
        >
          <div className="text-center space-y-2 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-2">
              <Store className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              Cadastre sua Loja
            </h2>
            <p className="text-sm text-muted-foreground">
              Crie seu perfil de vendedor para começar a anunciar produtos
            </p>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleApply} className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-muted-foreground mb-4 space-y-2">
              <h4 className="font-bold text-foreground flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" /> Como você recebe suas vendas? (Split Efí)
              </h4>
              <p>Para garantir transparência, não bitributação e repasse imediato, nós utilizamos o <strong>Split Nativo do Efí Bank</strong>.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Todo lojista precisa ter uma conta digital gratuita no <strong>Efí Bank</strong>.</li>
                <li>No exato momento em que o cliente paga, o sistema divide automaticamente o dinheiro. Sua parte cai direto na sua conta Efí.</li>
                <li>Você precisa nos informar o seu <strong>Identificador de Conta (Payee Code)</strong> gerado no painel Efí para receber.</li>
                <li><em>A Chave PIX que pedimos serve apenas como fallback de segurança.</em></li>
              </ul>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nome da Loja
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ex: Minha Loja Gamer"
                className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Descrição da Loja
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fale um pouco sobre o que você vende..."
                className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Chave PIX (Fallback)
              </label>
              <input
                type="text"
                required
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF, CNPJ, E-mail ou Aleatória"
                className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Identificador de Conta Efí (Payee Code)
              </label>
              <input
                type="text"
                required
                value={efiPayeeCode}
                onChange={(e) => setEfiPayeeCode(e.target.value)}
                placeholder="Identificador da sua conta Efí"
                className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                CEP de Origem (Postagem)
              </label>
              <input
                type="text"
                required
                value={originCep}
                onChange={(e) => setOriginCep(e.target.value)}
                placeholder="00000-000"
                className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-sm transition-all shadow-md disabled:opacity-50"
            >
              {formLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {formLoading ? "Salvando..." : "Enviar Candidatura"}
            </button>
          </form>
        </motion.div>
      )}

      {/* 2. ERROS DIVERSOS */}
      {errorType === "other" && (
        <div className="text-center py-12 space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto animate-bounce" />
          <h2 className="text-xl font-bold">Erro ao carregar painel</h2>
          <p className="text-muted-foreground">Não foi possível carregar os dados. Verifique sua conexão.</p>
          <button onClick={fetchStoreData} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">Tentar Novamente</button>
        </div>
      )}

      {/* 3. PAINEL DE DADOS */}
      {store && (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border/10 pb-6">
            <div className="space-y-3 w-full md:w-auto">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-black text-foreground tracking-tight">{store.store_name}</h1>
                <p className="text-sm text-muted-foreground mt-1">Gerenciamento financeiro e catálogo do marketplace</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                  store.status === "approved" 
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${store.status === "approved" ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {store.status === "approved" ? "Loja Ativa" : "Pendente"}
                </span>

                {store.efi_payee_code ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Efí Bank Ativo
                  </span>
                ) : (
                  <a 
                    href="https://sejaefi.com.br/abrir-conta" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse hover:bg-rose-500/20 transition-colors"
                    title="Clique para abrir sua conta"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Sem conta no Efí Bank (Abrir)
                  </a>
                )}
              </div>
            </div>

            <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => window.open(`/s/${store.slug}`, '_blank')}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold flex items-center justify-center gap-2 transition-all text-sm shadow-md"
              >
                <Store className="h-4 w-4" />
                <span className="whitespace-nowrap">Ver Minha Loja</span>
              </button>
              
              <button 
                onClick={() => {
                  setStoreName(store.store_name || "");
                  setDescription(store.description || "");
                  setPixKey(store.pix_key || "");
                  setEfiPayeeCode(store.efi_payee_code || "");
                  
                  // Recupera os links de imagens salvos (usando as propriedades expostas no serializer)
                  setLogoExternal(store.logo_url || "");
                  setBannerExternal(store.banner_url || "");
                  setBanner2External(store.banner2_url || "");
                  setBanner3External(store.banner3_url || "");
                  
                  setIsSettingsOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-card border border-border/40 hover:bg-white/5 text-foreground font-semibold flex items-center justify-center gap-2 transition-all text-sm shadow-sm"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="whitespace-nowrap">Configurações</span>
              </button>
            </div>
          </div>

          {/* Menu de Navegação Secundário */}
          <div className="pb-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex items-center gap-3 min-w-max">
              <button
                onClick={() => router.push("/seller/dashboard/products")}
                className="px-4 py-2.5 rounded-xl bg-card border border-border/40 hover:border-primary/50 hover:bg-primary/5 text-foreground font-medium flex items-center gap-2.5 transition-all text-sm group shadow-sm"
              >
                <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                  <Package className="h-4 w-4" />
                </div>
                <span>Produtos</span>
              </button>

              <button
                onClick={() => router.push("/seller/dashboard/analytics")}
                className="px-4 py-2.5 rounded-xl bg-card border border-border/40 hover:border-amber-500/50 hover:bg-amber-500/5 text-foreground font-medium flex items-center gap-2.5 transition-all text-sm group shadow-sm"
              >
                <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                  <Activity className="h-4 w-4" />
                </div>
                <span>Analytics & KPIs</span>
              </button>

              <button 
                onClick={() => router.push("/seller/dashboard/reviews")}
                className="px-4 py-2.5 rounded-xl bg-card border border-border/40 hover:border-yellow-500/50 hover:bg-yellow-500/5 text-foreground font-medium flex items-center gap-2.5 transition-all text-sm group shadow-sm"
              >
                <div className="p-1.5 rounded-md bg-yellow-500/10 text-yellow-500 group-hover:scale-110 transition-transform">
                  <Star className="h-4 w-4" />
                </div>
                <span>Reputação</span>
              </button>

              <button 
                onClick={() => router.push("/seller/dashboard/chats")}
                className="px-4 py-2.5 rounded-xl bg-card border border-border/40 hover:border-blue-500/50 hover:bg-blue-500/5 text-foreground font-medium flex items-center gap-2.5 transition-all text-sm group shadow-sm"
              >
                <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <span>Mensagens</span>
              </button>
            </div>
          </div>



          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm space-y-4">
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Produtos Cadastrados</span>
                <Package className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-display font-bold text-foreground">{store.total_products}</h2>
                <p className="text-xs text-muted-foreground">Total de variantes criadas</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm space-y-4">
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Produtos Ativos</span>
                <Layers className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-display font-bold text-foreground">{store.available_products}</h2>
                <p className="text-xs text-muted-foreground">Visíveis no catálogo da loja</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm space-y-4">
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Total de Vendas</span>
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-display font-bold text-foreground">{store.total_orders}</h2>
                <p className="text-xs text-muted-foreground">Sub-pedidos faturados</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm space-y-4">
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Saldo Pendente</span>
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-display font-bold text-foreground">
                  R$ {Number(store.pending_payout).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </h2>
                <p className="text-xs text-muted-foreground">Comissão da plataforma: {store.commission_rate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAÇÕES */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-[#0F0F1A] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="w-5 h-5 text-primary" /> Editar Loja</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="text-neutral-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleUpdateSettings} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Nome da Loja</label>
                  <input required value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full mt-1.5 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Descrição</label>
                  <textarea rows={3} required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full mt-1.5 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary transition-colors resize-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Chave PIX</label>
                  <input required value={pixKey} onChange={(e) => setPixKey(e.target.value)} className="w-full mt-1.5 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Identificador Efí (Payee Code)</label>
                  <input value={efiPayeeCode} onChange={(e) => setEfiPayeeCode(e.target.value)} placeholder="Cole aqui seu Identificador Efí" className="w-full mt-1.5 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Link da Logo</label>
                  <input value={logoExternal} onChange={(e) => setLogoExternal(e.target.value)} placeholder="https://..." className="w-full mt-1.5 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Link do Banner 1</label>
                  <input value={bannerExternal} onChange={(e) => setBannerExternal(e.target.value)} placeholder="https://..." className="w-full mt-1.5 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Link do Banner 2</label>
                  <input value={banner2External} onChange={(e) => setBanner2External(e.target.value)} placeholder="https://..." className="w-full mt-1.5 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Link do Banner 3</label>
                  <input value={banner3External} onChange={(e) => setBanner3External(e.target.value)} placeholder="https://..." className="w-full mt-1.5 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary transition-colors" />
                </div>
                <button type="submit" disabled={settingsLoading} className="w-full py-3 mt-4 rounded-xl bg-primary text-primary-foreground font-black hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50">
                  {settingsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar Configurações"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SellerDashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
      <Header />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <Suspense fallback={
          <div className="flex-grow flex items-center justify-center py-20">
            <BrandLoader size="lg" text="Iniciando painel..." />
          </div>
        }>
          <DashboardContent />
        </Suspense>
      </main>
    </div>
  );
}
