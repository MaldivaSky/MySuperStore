"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { sellerDashboardApi } from "@/lib/api";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Loader2, 
  ArrowLeft,
  Star,
  Activity,
  Package
} from "lucide-react";

export default function SellerAnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    sellerDashboardApi.getAnalytics()
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error("Analytics Error", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-xl">
          <p className="text-sm font-semibold mb-1">{new Date(label).toLocaleDateString('pt-BR')}</p>
          <p className="text-sm text-primary">Receita: R$ {Number(payload[0].value).toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">Pedidos: {payload[1].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button 
          onClick={() => router.push("/seller/dashboard")}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao Painel
        </button>

        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-display font-black flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            Ciência de Dados & Inteligência
          </h1>
          <p className="text-muted-foreground">Analise suas vendas, identifique padrões e escale seu negócio.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-4">
              <span className="text-xs uppercase tracking-wider font-semibold">Receita Total</span>
              <DollarSign className="h-5 w-5" />
            </div>
            <h2 className="text-3xl font-bold">R$ {Number(data.kpis.total_revenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
            <p className="text-xs text-green-500 mt-2 font-medium flex items-center gap-1"><TrendingUp className="h-3 w-3" /> GMV do período</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-4">
              <span className="text-xs uppercase tracking-wider font-semibold">Pedidos Entregues</span>
              <ShoppingBag className="h-5 w-5" />
            </div>
            <h2 className="text-3xl font-bold">{data.kpis.total_orders}</h2>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Transações com sucesso</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-4">
              <span className="text-xs uppercase tracking-wider font-semibold">Ticket Médio (AOV)</span>
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">R$ {Number(data.kpis.avg_ticket).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Gasto médio por cliente</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-4">
              <span className="text-xs uppercase tracking-wider font-semibold">Sua Reputação</span>
              <Star className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex items-end gap-2">
              <h2 className="text-3xl font-bold">{data.reputation.avg_rating}</h2>
              <span className="text-sm font-medium text-amber-500 mb-1">/ 5.0</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Baseado em {data.reputation.review_count} avaliações</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Receita nos Últimos 30 Dias</h3>
            <div className="h-[350px] w-full">
              {data.sales_over_time.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.sales_over_time} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} stroke="currentColor" className="opacity-50 text-xs" />
                    <YAxis yAxisId="left" stroke="currentColor" className="opacity-50 text-xs" tickFormatter={(val) => `R$${val}`} />
                    <YAxis yAxisId="right" orientation="right" stroke="currentColor" className="opacity-50 text-xs" />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--primary)" }} activeDot={{ r: 8 }} />
                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">Não há dados suficientes neste período.</div>
              )}
            </div>
          </div>

          {/* Top Products Table */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Curva ABC (Top 5)</h3>
            <div className="space-y-4">
              {data.top_products.length > 0 ? data.top_products.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50">
                  <div>
                    <p className="text-sm font-semibold line-clamp-1">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} unidades vendidas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">R$ {Number(item.revenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-muted-foreground text-center py-10">Nenhum produto vendido ainda.</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
