"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Users, TrendingDown, DollarSign, ShieldAlert, Activity, Tag, Check, X, Trash2, ArrowLeft, Briefcase, Image as ImageIcon, Upload } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { adminApi } from "@/lib/api";

// Mock Data for Analytics Charts (as these are not fully implemented in API yet)
const growthData = [
  { name: 'Jan', revenue: 4000, users: 2400 },
  { name: 'Fev', revenue: 3000, users: 1398 },
  { name: 'Mar', revenue: 2000, users: 9800 },
  { name: 'Abr', revenue: 2780, users: 3908 },
  { name: 'Mai', revenue: 1890, users: 4800 },
  { name: 'Jun', revenue: 2390, users: 3800 },
  { name: 'Jul', revenue: 3490, users: 4300 },
];

const churnData = [
  { name: 'Jan', churned: 120, acquired: 800 },
  { name: 'Fev', churned: 150, acquired: 900 },
  { name: 'Mar', churned: 100, acquired: 1200 },
  { name: 'Abr', churned: 200, acquired: 700 },
  { name: 'Mai', churned: 90, acquired: 1500 },
  { name: 'Jun', churned: 80, acquired: 1800 },
];

export default function SuperAdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user?.role !== "admin") {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  const [activeTab, setActiveTab] = useState("overview");

  const [metrics, setMetrics] = useState<any>(null);
  const [sellers, setSellers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  
  // Sellers Filter State
  const [sellerFilter, setSellerFilter] = useState("all"); // "all", "pending", "approved", "suspended"
  
  // Reject/Suspend Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [targetSellerId, setTargetSellerId] = useState("");
  const [actionReason, setActionReason] = useState("");

  // Coupon Form State
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscountPerc, setCouponDiscountPerc] = useState("");
  const [couponValidFrom, setCouponValidFrom] = useState("");
  const [couponValidTo, setCouponValidTo] = useState("");
  const [couponSellerId, setCouponSellerId] = useState(""); // optional

  // Banner Form State
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerLink, setBannerLink] = useState("");
  const [bannerOrder, setBannerOrder] = useState("0");
  const bannerFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchDashboard();
      fetchSellers();
      fetchCoupons();
      fetchBanners();
    }
  }, [user]);

  const fetchDashboard = async () => {
    try {
      const res = await adminApi.getDashboardMetrics();
      setMetrics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSellers = async () => {
    try {
      const res = await adminApi.sellers.list();
      setSellers(res.data.results || res.data); // handles paginated or list
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await adminApi.coupons.list();
      setCoupons(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBanners = async () => {
    try {
      const res = await adminApi.banners.list();
      setBanners(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveSeller = async (id: string) => {
    try {
      await adminApi.sellers.approve(id);
      fetchSellers();
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectSeller = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetSellerId) return;
    try {
      await adminApi.sellers.reject(targetSellerId, actionReason);
      setIsRejectModalOpen(false);
      setTargetSellerId("");
      setActionReason("");
      fetchSellers();
      fetchDashboard();
    } catch (err) {
      console.error(err);
      alert("Erro ao rejeitar lojista.");
    }
  };

  const handleSuspendSeller = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetSellerId) return;
    try {
      await adminApi.sellers.suspend(targetSellerId, actionReason);
      setIsSuspendModalOpen(false);
      setTargetSellerId("");
      setActionReason("");
      fetchSellers();
      fetchDashboard();
    } catch (err) {
      console.error(err);
      alert("Erro ao suspender lojista.");
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        code: couponCode,
        discount_percentage: couponDiscountPerc ? parseFloat(couponDiscountPerc) : null,
        valid_from: couponValidFrom,
        valid_to: couponValidTo,
        active: true
      };
      if (couponSellerId) payload.seller = couponSellerId;
      
      await adminApi.coupons.create(payload);
      setCouponCode("");
      setCouponDiscountPerc("");
      setCouponValidFrom("");
      setCouponValidTo("");
      setCouponSellerId("");
      fetchCoupons();
    } catch (err) {
      alert("Erro ao criar cupom. Verifique os dados.");
      console.error(err);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await adminApi.coupons.delete(id);
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = bannerFileRef.current?.files?.[0];
    if (!file) {
      alert("Selecione uma imagem para o banner.");
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append("title", bannerTitle);
      formData.append("link", bannerLink);
      formData.append("order", bannerOrder);
      formData.append("image", file);
      formData.append("active", "true");

      await adminApi.banners.create(formData);
      setBannerTitle("");
      setBannerLink("");
      setBannerOrder("0");
      if (bannerFileRef.current) bannerFileRef.current.value = "";
      fetchBanners();
    } catch (err) {
      alert("Erro ao criar banner. Verifique os dados.");
      console.error(err);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      await adminApi.banners.delete(id);
      fetchBanners();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSellers = sellers.filter(s => {
    if (sellerFilter === "all") return true;
    return s.status === sellerFilter;
  });

  return (
    <div className="min-h-screen bg-[#05050a] flex flex-col md:flex-row text-white font-sans">
      {/* Sidebar Admin Premium */}
      <div className="w-full md:w-72 bg-[#0a0a14] border-r border-white/[0.05] flex flex-col shadow-2xl relative z-10">
        <div className="p-8 border-b border-white/[0.05] bg-gradient-to-b from-blue-600/10 to-transparent">
          <h2 className="text-2xl font-display font-bold flex items-center gap-3 text-blue-500">
            <div className="p-2 bg-blue-600/20 rounded-xl cursor-pointer hover:scale-105 transition-transform" onClick={() => router.push("/")} title="Voltar à Loja">
              <ArrowLeft className="w-6 h-6 text-blue-400" />
            </div>
            SuperAdmin
          </h2>
          <p className="text-sm text-neutral-400 mt-3 truncate font-medium">Governança & Controle</p>
        </div>
        <nav className="p-6 flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-visible">
          {[
            { id: "overview", label: "Visão Geral", icon: Activity },
            { id: "churn", label: "Gestão de Churn", icon: TrendingDown },
            { id: "sellers", label: "Gestão de Lojistas", icon: Users },
            { id: "coupons", label: "Central de Cupons", icon: Tag },
            { id: "banners", label: "Banners da Home", icon: ImageIcon },
            { id: "crm", label: "CRM & Vendas B2B", icon: Briefcase, action: () => router.push("/admin/crm") },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => tab.action ? tab.action() : setActiveTab(tab.id)} 
              className={`flex-shrink-0 flex items-center gap-4 px-5 py-3.5 rounded-2xl font-semibold transition-all duration-300 ${
                activeTab === tab.id 
                  ? "bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-[0_4px_20px_rgba(37,99,235,0.3)] translate-x-1" 
                  : "hover:bg-white/[0.04] text-neutral-400 hover:text-white"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-display font-black text-white tracking-tight">Painel Executivo</h1>
            <p className="text-neutral-400 mt-2 font-medium text-lg">Central de comando do ecossistema MySuperStore.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-6 py-3 bg-blue-600/10 text-blue-500 border border-blue-600/20 rounded-xl font-bold flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              Sistema Seguro
            </div>
          </div>
        </header>

        {activeTab === "overview" && metrics && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "GMV Total (30d)", value: `R$ ${metrics.revenue.value.toLocaleString('pt-BR', {minimumFractionDigits:2})}`, change: metrics.revenue.change, isPos: metrics.revenue.is_positive, icon: DollarSign },
                { title: "Lojistas Ativos", value: metrics.active_sellers.value, change: metrics.active_sellers.change, isPos: metrics.active_sellers.is_positive, icon: Users },
                { title: "Taxa de Churn", value: metrics.churn.value, change: metrics.churn.change, isPos: metrics.churn.is_positive, icon: TrendingDown },
                { title: "Aprovações Pendentes", value: metrics.pending_approvals.value, change: metrics.pending_approvals.change, isPos: metrics.pending_approvals.is_positive, icon: ShieldAlert },
              ].map((m, i) => (
                <div key={i} className="bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] p-6 rounded-3xl hover:border-blue-500/30 transition-colors group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform">
                      <m.icon className="w-6 h-6" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${m.isPos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {m.change}
                    </span>
                  </div>
                  <h3 className="text-neutral-400 text-sm font-semibold mb-1">{m.title}</h3>
                  <p className="text-3xl font-display font-bold text-white">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Main Chart */}
            <div className="bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] p-8 rounded-3xl">
              <h3 className="text-xl font-bold mb-6">Crescimento de Usuários vs Receita</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#ffffff50" axisLine={false} tickLine={false} />
                    <YAxis stroke="#ffffff50" axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a14', border: '1px solid #ffffff20', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "churn" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] p-8 rounded-3xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-rose-400">Análise de Churn (Evasão)</h3>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={churnData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#ffffff50" axisLine={false} tickLine={false} />
                    <YAxis stroke="#ffffff50" axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a14', border: '1px solid #ffffff20', borderRadius: '12px' }}
                      cursor={{fill: '#ffffff05'}}
                    />
                    <Bar dataKey="acquired" fill="#10b981" radius={[4, 4, 0, 0]} name="Novos Usuários" />
                    <Bar dataKey="churned" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Usuários Evadidos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <p className="text-rose-400 text-sm font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  Alerta: O Churn aumentou 12% em Abril devido a falhas de pagamento no Checkout. Investigação necessária.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sellers" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] p-8 rounded-3xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-xl font-bold">Lojistas ({filteredSellers.length})</h3>
                <div className="flex bg-white/[0.05] p-1 rounded-xl">
                  {["all", "pending", "approved", "suspended", "rejected"].map(s => (
                    <button
                      key={s}
                      onClick={() => setSellerFilter(s)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-colors ${sellerFilter === s ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                    >
                      {s === "all" ? "Todos" : s === "suspended" ? "Inativos" : s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-neutral-500 border-b border-white/10">
                      <th className="pb-3">Loja</th>
                      <th className="pb-3">Proprietário</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSellers.map((s: any) => (
                      <tr key={s.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                        <td className="py-4 font-semibold">{s.store_name}</td>
                        <td className="py-4 text-neutral-400">{s.user_name} ({s.user_email})</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            s.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                            s.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                            s.status === 'suspended' ? 'bg-neutral-500/20 text-neutral-400' :
                            'bg-rose-500/10 text-rose-400'
                          }`}>
                            {s.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 flex justify-end gap-2">
                          {s.status === 'pending' && (
                            <>
                              <button onClick={() => handleApproveSeller(s.id)} className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20" title="Aprovar"><Check className="w-4 h-4"/></button>
                              <button onClick={() => { setTargetSellerId(s.id); setIsRejectModalOpen(true); }} className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20" title="Rejeitar"><X className="w-4 h-4"/></button>
                            </>
                          )}
                          {s.status === 'approved' && (
                            <button onClick={() => { setTargetSellerId(s.id); setIsSuspendModalOpen(true); }} className="px-3 py-2 bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
                              Inativar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "coupons" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form */}
              <div className="bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] p-8 rounded-3xl col-span-1 h-fit">
                <h3 className="text-xl font-bold mb-6 text-blue-400 flex items-center gap-2"><Tag className="w-5 h-5"/> Novo Cupom</h3>
                <form onSubmit={handleCreateCoupon} className="space-y-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">Código (Ex: PROMO10)</label>
                    <input type="text" required value={couponCode} onChange={e=>setCouponCode(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none uppercase text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">Desconto (%)</label>
                    <input type="number" step="0.01" required value={couponDiscountPerc} onChange={e=>setCouponDiscountPerc(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">Válido De</label>
                    <input type="datetime-local" required value={couponValidFrom} onChange={e=>setCouponValidFrom(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">Válido Até</label>
                    <input type="datetime-local" required value={couponValidTo} onChange={e=>setCouponValidTo(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">ID do Lojista (Opcional - Cupom Global se vazio)</label>
                    <input type="text" placeholder="UUID do Vendedor" value={couponSellerId} onChange={e=>setCouponSellerId(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none text-white" />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors mt-2">
                    Emitir Cupom
                  </button>
                </form>
              </div>

              {/* List */}
              <div className="bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] p-8 rounded-3xl col-span-2">
                <h3 className="text-xl font-bold mb-6">Cupons Ativos</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-neutral-500 border-b border-white/10">
                        <th className="pb-3">Código</th>
                        <th className="pb-3">Desconto</th>
                        <th className="pb-3">Lojista</th>
                        <th className="pb-3 text-right">Validade</th>
                        <th className="pb-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map((c: any) => (
                        <tr key={c.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                          <td className="py-4 font-bold text-emerald-400">{c.code}</td>
                          <td className="py-4">{c.discount_percentage}%</td>
                          <td className="py-4 text-neutral-400">{c.seller_name || <span className="text-blue-400 font-semibold">Global (Plataforma)</span>}</td>
                          <td className="py-4 text-right text-sm text-neutral-500">{new Date(c.valid_to).toLocaleDateString()}</td>
                          <td className="py-4 flex justify-end">
                            <button onClick={() => handleDeleteCoupon(c.id)} className="p-2 text-neutral-500 hover:text-rose-400 transition-colors">
                              <Trash2 className="w-4 h-4"/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {coupons.length === 0 && <p className="text-neutral-500 text-center py-8">Nenhum cupom ativo no momento.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "banners" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Form */}
              <div className="bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] p-8 rounded-3xl col-span-1 h-fit">
                <h3 className="text-xl font-bold mb-6 text-blue-400 flex items-center gap-2"><ImageIcon className="w-5 h-5"/> Novo Banner</h3>
                <form onSubmit={handleCreateBanner} className="space-y-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">Título</label>
                    <input type="text" required value={bannerTitle} onChange={e=>setBannerTitle(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">Link de Destino</label>
                    <input type="text" value={bannerLink} onChange={e=>setBannerLink(e.target.value)} placeholder="https://..." className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">Ordem (Exibição)</label>
                    <input type="number" required value={bannerOrder} onChange={e=>setBannerOrder(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">Imagem do Banner</label>
                    <input type="file" ref={bannerFileRef} accept="image/*" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors mt-2 flex justify-center items-center gap-2">
                    <Upload className="w-4 h-4" /> Enviar Banner
                  </button>
                </form>
              </div>

              {/* List */}
              <div className="bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] p-8 rounded-3xl col-span-1 xl:col-span-2">
                <h3 className="text-xl font-bold mb-6">Banners Publicados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {banners.map((b: any) => (
                    <div key={b.id} className="relative rounded-2xl overflow-hidden border border-white/10 group aspect-[21/9] bg-neutral-900">
                      <img src={b.image} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                        <h4 className="font-bold text-white truncate">{b.title}</h4>
                        {b.link && <p className="text-xs text-blue-400 truncate">{b.link}</p>}
                        <span className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold">Ordem: {b.order}</span>
                        <button onClick={() => handleDeleteBanner(b.id)} className="absolute top-3 right-3 p-2 bg-rose-500/80 hover:bg-rose-500 text-white rounded-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>
                  ))}
                  {banners.length === 0 && <p className="text-neutral-500 col-span-full text-center py-8">Nenhum banner ativo no momento.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Reject Seller Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-[#0a0a14] border border-white/[0.05] p-8 rounded-3xl max-w-md w-full relative">
            <button onClick={() => setIsRejectModalOpen(false)} className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white bg-white/[0.02] rounded-full"><X className="w-4 h-4"/></button>
            <h3 className="text-xl font-bold text-rose-400 mb-2 flex items-center gap-2"><ShieldAlert className="w-5 h-5"/> Recusar Lojista</h3>
            <p className="text-sm text-neutral-400 mb-6">Informe o motivo da recusa. Este motivo será enviado por e-mail ao lojista.</p>
            <form onSubmit={handleRejectSeller} className="space-y-4">
              <textarea 
                value={actionReason}
                onChange={e => setActionReason(e.target.value)}
                required
                placeholder="Ex: Documentação inválida ou fotos dos produtos não estão no padrão exigido."
                className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500 outline-none min-h-[120px] resize-none"
              ></textarea>
              <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all">
                Confirmar Recusa e Enviar E-mail
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Suspend Seller Modal */}
      {isSuspendModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-[#0a0a14] border border-white/[0.05] p-8 rounded-3xl max-w-md w-full relative">
            <button onClick={() => setIsSuspendModalOpen(false)} className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white bg-white/[0.02] rounded-full"><X className="w-4 h-4"/></button>
            <h3 className="text-xl font-bold text-rose-400 mb-2 flex items-center gap-2"><ShieldAlert className="w-5 h-5"/> Inativar (Suspender) Lojista</h3>
            <p className="text-sm text-neutral-400 mb-6">O lojista perderá acesso e os produtos sairão do ar. Informe o motivo, que será enviado por e-mail.</p>
            <form onSubmit={handleSuspendSeller} className="space-y-4">
              <textarea 
                value={actionReason}
                onChange={e => setActionReason(e.target.value)}
                required
                placeholder="Ex: Violação recorrente dos termos de envio e recebimento de denúncias."
                className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500 outline-none min-h-[120px] resize-none"
              ></textarea>
              <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all">
                Confirmar Inativação
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
