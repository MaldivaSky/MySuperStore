"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Users, TrendingDown, TrendingUp, DollarSign, ShieldAlert, CheckCircle, Activity, Box } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

// Mock Data for Analytics
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

  return (
    <div className="min-h-screen bg-[#05050a] flex flex-col md:flex-row text-white font-sans">
      {/* Sidebar Admin Premium */}
      <div className="w-full md:w-72 bg-[#0a0a14] border-r border-white/[0.05] flex flex-col shadow-2xl relative z-10">
        <div className="p-8 border-b border-white/[0.05] bg-gradient-to-b from-blue-600/10 to-transparent">
          <h2 className="text-2xl font-display font-bold flex items-center gap-3 text-blue-500">
            <div className="p-2 bg-blue-600/20 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            SuperAdmin
          </h2>
          <p className="text-sm text-neutral-400 mt-3 truncate font-medium">Governança & Controle</p>
        </div>
        <nav className="p-6 flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-visible">
          {[
            { id: "overview", label: "Visão Geral", icon: Activity },
            { id: "churn", label: "Gestão de Churn", icon: TrendingDown },
            { id: "sellers", label: "Lojistas & Comissões", icon: Users },
            { id: "moderation", label: "Moderação NLP", icon: Box },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)} 
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

        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "GMV Total (Mensal)", value: "R$ 4.2M", change: "+24%", isPos: true, icon: DollarSign },
                { title: "Lojistas Ativos", value: "1,492", change: "+5.2%", isPos: true, icon: Users },
                { title: "Taxa de Churn", value: "2.4%", change: "-1.1%", isPos: true, icon: TrendingDown }, // Low churn is positive
                { title: "Aprovações Pendentes", value: "84", change: "+12", isPos: false, icon: ShieldAlert },
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

        {/* Placeholder for other tabs */}
        {(activeTab === "sellers" || activeTab === "moderation") && (
          <div className="w-full h-64 border border-dashed border-white/20 rounded-3xl flex items-center justify-center text-neutral-500 font-semibold animate-in fade-in duration-500">
            Módulo em Desenvolvimento ({activeTab})
          </div>
        )}

      </div>
    </div>
  );
}
