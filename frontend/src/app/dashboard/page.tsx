"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { userApi } from "@/lib/api";
import { motion } from "framer-motion";
import { 
  Rocket, 
  Sparkles, 
  Crown, 
  ShoppingBag, 
  Heart, 
  Clock, 
  TrendingUp,
  PackageCheck
} from "lucide-react";

export default function BuyerRecapDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [recap, setRecap] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.getRecap()
      .then((res) => {
        setRecap(res.data);
      })
      .catch((err) => console.error("Error fetching recap", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[500px]">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full animate-pulse"></div>
          <Sparkles className="h-10 w-10 text-primary animate-bounce relative z-10" />
        </div>
      </div>
    );
  }

  // Se não houver compras ainda
  if (!recap || recap.total_orders === 0) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-gradient-to-br from-card to-background border border-border/50">
        <Rocket className="h-16 w-16 text-muted-foreground mb-6 opacity-30" />
        <h2 className="text-3xl font-display font-black mb-4">Seu Universo de Compras</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Você ainda não realizou nenhuma compra. Explore nosso catálogo e comece sua jornada para construir seu Recap de Comprador Voraz!
        </p>
        <button 
          onClick={() => router.push("/")}
          className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          Explorar Produtos
        </button>
      </div>
    );
  }

  const memberDate = new Date(recap.member_since).toLocaleDateString("pt-BR", { month: 'long', year: 'numeric' });
  const firstPurchase = recap.first_purchase_date 
    ? new Date(recap.first_purchase_date).toLocaleDateString("pt-BR")
    : null;

  return (
    <div className="space-y-8">
      {/* HEADER GAMIFICADO */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 md:p-12 text-white bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Crown className="w-64 h-64 rotate-12" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-widest mb-4 border border-white/20">
            <Sparkles className="h-3 w-3" /> Meu Universo 2026
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-black leading-tight mb-4 text-white">
            E aí, <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">{user?.first_name}</span>!
            <br/>Pronto para o Recap?
          </h1>
          <p className="text-lg text-white/80 font-medium">
            Você é membro desde {memberDate} e tem deixado sua marca por aqui.
          </p>
        </div>
      </motion.div>

      {/* GRADE DE ESTATÍSTICAS (BENTO BOX) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: Categoria Favorita */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 relative overflow-hidden rounded-3xl p-8 bg-card border border-border/50 group hover:border-primary/50 transition-colors"
        >
          <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <Heart className="w-64 h-64 text-primary" />
          </div>
          
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-8">Sua Vibe Principal</h3>
          <div className="space-y-2">
            <p className="text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500 pb-2">
              {recap.favorite_category}
            </p>
            <p className="text-muted-foreground font-medium">
              Você respirou essa categoria. É literalmente a sua marca registrada.
            </p>
          </div>
        </motion.div>

        {/* CARD 2: Total Gasto */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20"
        >
          <TrendingUp className="h-8 w-8 text-green-500 mb-6" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-green-600/80 dark:text-green-400 mb-2">Total Gasto</h3>
          <p className="text-3xl font-display font-black text-green-600 dark:text-green-400">
            R$ {Number(recap.total_spent).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-2 font-medium">Investidos no seu lifestyle.</p>
        </motion.div>

        {/* CARD 3: Itens */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl p-8 bg-card border border-border/50 flex flex-col justify-between"
        >
          <PackageCheck className="h-8 w-8 text-blue-500 mb-4" />
          <div>
            <p className="text-4xl font-display font-black">{recap.total_items}</p>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Itens Comprados</p>
          </div>
        </motion.div>

        {/* CARD 4: Pedidos */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl p-8 bg-card border border-border/50 flex flex-col justify-between"
        >
          <ShoppingBag className="h-8 w-8 text-orange-500 mb-4" />
          <div>
            <p className="text-4xl font-display font-black">{recap.total_orders}</p>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Pedidos Realizados</p>
          </div>
        </motion.div>

        {/* CARD 5: Jornada */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-3xl p-8 bg-card border border-border/50 flex flex-col justify-between"
        >
          <Clock className="h-8 w-8 text-purple-500 mb-4" />
          <div>
            <p className="text-lg font-bold">
              Primeira compra:<br/>
              <span className="text-purple-500">{firstPurchase || "Nunca"}</span>
            </p>
            <p className="text-xs font-medium text-muted-foreground mt-2">O dia que tudo mudou.</p>
          </div>
        </motion.div>

      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <button 
          onClick={() => router.push("/dashboard/orders")}
          className="w-full flex items-center justify-between p-6 rounded-2xl bg-secondary/30 hover:bg-secondary/60 transition-colors border border-border/50 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag className="h-5 w-5 text-foreground" />
            </div>
            <div className="text-left">
              <h4 className="font-bold">Rastrear Meus Pedidos</h4>
              <p className="text-xs text-muted-foreground">Veja onde estão suas compras.</p>
            </div>
          </div>
        </button>

        {user?.role === "seller" ? (
          <button 
            onClick={() => router.push("/seller/dashboard/chats")}
            className="w-full flex items-center justify-between p-6 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 transition-colors border border-blue-500/20 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <Sparkles className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-blue-600 dark:text-blue-400">Ir para Central de Vendas</h4>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Acesse mensagens e reputação.</p>
              </div>
            </div>
          </button>
        ) : (
          <button 
            onClick={() => router.push("/")}
            className="w-full flex items-center justify-between p-6 rounded-2xl bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-primary">Continuar Comprando</h4>
                <p className="text-xs text-primary/70">Explore novas tendências.</p>
              </div>
            </div>
          </button>
        )}
      </div>

    </div>
  );
}
