"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sellerOrdersApi } from "@/lib/api";
import { Header } from "@/components/Header";
import { BrandLoader } from "@/components/ui/BrandLoader";
import { SubOrder } from "@/types";
import { motion } from "framer-motion";
import { Package, Clock, Truck, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

export default function SellerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<SubOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "processing" | "shipped" | "delivered">("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await sellerOrdersApi.getAll();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => filter === "all" || o.status === filter);

  if (loading) return <BrandLoader />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-7xl mx-auto px-4 pt-28 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold font-heading mb-2">Gestão de Pedidos</h1>
            <p className="text-muted-foreground">Acompanhe e despache suas vendas.</p>
          </div>
          <div className="flex bg-card/40 border border-border/40 p-1 rounded-xl">
            {(["all", "pending", "processing", "shipped", "delivered"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {f === "all" ? "Todos" : f === "pending" ? "Pendentes" : f === "processing" ? "A Enviar" : f === "shipped" ? "Em Trânsito" : "Entregues"}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-2xl bg-card/20">
            <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground">Nenhum pedido encontrado.</h3>
            <p className="text-muted-foreground text-sm mt-2">Você ainda não possui pedidos com este status.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map(order => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border/40 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/seller/dashboard/orders/${order.id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl flex-shrink-0 ${
                    order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                    order.status === 'processing' ? 'bg-blue-500/10 text-blue-500' :
                    order.status === 'shipped' ? 'bg-purple-500/10 text-purple-500' :
                    'bg-green-500/10 text-green-500'
                  }`}>
                    {order.status === 'pending' ? <Clock className="w-6 h-6" /> :
                     order.status === 'processing' ? <Package className="w-6 h-6" /> :
                     order.status === 'shipped' ? <Truck className="w-6 h-6" /> :
                     <CheckCircle2 className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Pedido <span className="text-muted-foreground">#{order.id.slice(0, 8)}</span></h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Realizado em {new Date(order.created_at).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="flex gap-2 text-sm text-foreground">
                      <span>{order.items.length} itens</span>
                      <span>•</span>
                      <span className="font-semibold text-primary">R$ {Number(order.subtotal).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    {order.status === "processing" && (
                      <p className="text-sm font-bold text-blue-400 mb-1">Ação Necessária</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Status: {
                        order.status === "pending" ? "Aguardando Pagamento" :
                        order.status === "processing" ? "Pronto para Envio" :
                        order.status === "shipped" ? "Despachado" : "Entregue"
                      }
                    </p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors text-sm font-bold w-full md:w-auto justify-center">
                    Detalhes <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
