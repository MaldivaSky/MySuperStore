"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Store, Package, DollarSign, Tag, Settings, LayoutDashboard, CreditCard, Plus, Truck, CheckCircle, Clock, RefreshCcw, Loader2, Zap } from "lucide-react";
import { api, returnsApi, catalogApi } from "@/lib/api";

export default function SellerDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [returns, setReturns] = useState<any[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  // Promo states
  const [selectedProduct, setSelectedProduct] = useState("");
  const [promoPrice, setPromoPrice] = useState("");
  const [promoEnds, setPromoEnds] = useState("");

  useEffect(() => {
    // Only allow role "seller"
    if (isAuthenticated && user?.role !== "seller") {
      router.push("/");
    } else if (isAuthenticated && user?.role === "seller") {
      fetchOrders();
      fetchReturns();
      fetchProducts();
    }
  }, [isAuthenticated, user, router]);

  const fetchProducts = async () => {
    try {
      const res = await catalogApi.products(); // Will list all, filtering on frontend or could use seller filter if available
      setProducts(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get("/orders/seller/");
      setOrders(res.data.results || res.data);
    } catch (err) {
      console.error("Erro ao buscar pedidos do lojista", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchReturns = async () => {
    setLoadingReturns(true);
    try {
      const res = await api.get("/orders/returns/");
      setReturns(res.data.results || res.data);
    } catch (err) {
      console.error("Erro ao buscar devoluções", err);
    } finally {
      setLoadingReturns(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/orders/seller/${orderId}/update_status/`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      alert("Erro ao atualizar status. Verifique se a transição é válida.");
    }
  };

  const handleUpdateReturnStatus = async (returnId: string, newStatus: string) => {
    try {
      await returnsApi.updateStatus(returnId, newStatus);
      fetchReturns();
    } catch (err) {
      alert("Erro ao atualizar status da devolução.");
    }
  };

  const handleSavePromo = async () => {
    if (!selectedProduct || !promoPrice || !promoEnds) return alert("Preencha todos os campos.");
    try {
      await catalogApi.setPromo(selectedProduct, {
        promotional_price: parseFloat(promoPrice),
        promo_ends_at: new Date(promoEnds).toISOString()
      });
      alert("Promoção Relâmpago configurada com sucesso!");
      setPromoPrice(""); setPromoEnds(""); setSelectedProduct("");
      fetchProducts();
    } catch (err) {
      alert("Erro ao configurar promoção.");
    }
  };

  if (!isAuthenticated || user?.role !== "seller") {
    return <div className="min-h-screen flex items-center justify-center bg-[#05050a] text-white"><div className="animate-pulse">Acessando painel da loja...</div></div>;
  }

  // Dados Mockados Profissionais para o Dashboard
  const metrics = [
    { title: "Vendas Totais", value: "1,248", change: "+12.5%", isPositive: true, icon: Package },
    { title: "Receita Bruta", value: "R$ 45.900", change: "+8.2%", isPositive: true, icon: DollarSign },
    { title: "Custos (Comissão)", value: "R$ 4.590", change: "-2.1%", isPositive: false, icon: Tag },
    { title: "Lucro Líquido", value: "R$ 41.310", change: "+15.3%", isPositive: true, icon: Store },
  ];

  const recentOrders = orders.slice(0, 5); // Fallback para a UI do dashboard

  return (
    <div className="min-h-screen bg-[#05050a] flex flex-col md:flex-row text-white font-sans">
      {/* Sidebar Seller Premium */}
      <div className="w-full md:w-72 bg-[#0a0a14] border-r border-white/[0.05] flex flex-col shadow-2xl relative z-10">
        <div className="p-8 border-b border-white/[0.05] bg-gradient-to-b from-primary/10 to-transparent">
          <h2 className="text-2xl font-display font-bold flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-xl">
              <Store className="text-primary w-6 h-6" />
            </div>
            Central do Lojista
          </h2>
          <p className="text-sm text-neutral-400 mt-3 truncate font-medium">Bem-vindo, {user?.first_name}</p>
        </div>
        <nav className="p-6 flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-visible">
          {["Dashboard", "Produtos", "Vendas", "Devoluções", "Promoções", "Financeiro", "Configurações"].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())} 
              className={`flex-shrink-0 flex items-center gap-4 px-5 py-3.5 rounded-2xl font-semibold transition-all duration-300 ${
                activeTab === tab.toLowerCase() 
                  ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-[0_4px_20px_rgba(var(--primary),0.3)] translate-x-1" 
                  : "hover:bg-white/[0.04] text-neutral-400 hover:text-white"
              }`}
            >
              {tab === "Dashboard" && <LayoutDashboard className="w-5 h-5" />}
              {tab === "Produtos" && <Package className="w-5 h-5" />}
              {tab === "Vendas" && <DollarSign className="w-5 h-5" />}
              {tab === "Devoluções" && <RefreshCcw className="w-5 h-5 text-orange-400" />}
              {tab === "Promoções" && <Tag className="w-5 h-5" />}
              {tab === "Financeiro" && <CreditCard className="w-5 h-5" />}
              {tab === "Configurações" && <Settings className="w-5 h-5" />}
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Premium */}
      <div className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto relative">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

        <header className="mb-12 flex justify-between items-center relative z-10">
          <div>
            <h1 className="text-4xl font-display font-extrabold tracking-tight capitalize">{activeTab}</h1>
            <p className="text-neutral-400 mt-2 font-medium">Acompanhe suas métricas e faturamento em tempo real.</p>
          </div>
          <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:scale-105 transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" /> Novo Produto
          </button>
        </header>

        {activeTab === "dashboard" ? (
          <div className="space-y-8 relative z-10">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((m, idx) => {
                const Icon = m.icon;
                return (
                  <div key={idx} className="bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] p-6 rounded-3xl hover:border-white/[0.1] transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-white/[0.03] rounded-xl group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${m.isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        {m.change}
                      </span>
                    </div>
                    <h3 className="text-neutral-400 font-medium text-sm mb-1">{m.title}</h3>
                    <p className="text-3xl font-bold text-white tracking-tight">{m.value}</p>
                  </div>
                )
              })}
            </div>

            {/* Charts & Tables Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
              {/* Recent Orders */}
              <div className="lg:col-span-2 bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Pedidos Recentes</h3>
                  <button className="text-primary text-sm font-semibold hover:underline">Ver Todos</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.05] text-neutral-400 text-sm">
                        <th className="pb-4 font-medium">Pedido</th>
                        <th className="pb-4 font-medium">Produto</th>
                        <th className="pb-4 font-medium">Cliente</th>
                        <th className="pb-4 font-medium">Valor</th>
                        <th className="pb-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingOrders ? (
                        <tr><td colSpan={6} className="py-8 text-center">Carregando pedidos...</td></tr>
                      ) : orders.length === 0 ? (
                        <tr><td colSpan={6} className="py-8 text-center text-neutral-500">Nenhum pedido recebido ainda.</td></tr>
                      ) : orders.map((order, i) => (
                        <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 font-semibold text-neutral-300">#{order.id.split('-')[0]}</td>
                          <td className="py-4 text-sm">
                            {order.items.map((item: any) => (
                              <div key={item.id}>{item.product_name} (x{item.quantity})</div>
                            ))}
                          </td>
                          <td className="py-4 text-sm text-neutral-400">Cliente</td>
                          <td className="py-4 font-bold">R$ {order.total_price}</td>
                          <td className="py-4">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                              order.status === "delivered" ? "bg-emerald-500/10 text-emerald-400" 
                              : order.status === "preparing" ? "bg-amber-500/10 text-amber-400" 
                              : order.status === "shipped" ? "bg-blue-500/10 text-blue-400"
                              : "bg-neutral-500/10 text-neutral-400"
                            }`}>
                              {order.status === 'pending' ? 'Pendente' : order.status === 'preparing' ? 'Preparando' : order.status === 'shipped' ? 'Enviado' : order.status === 'delivered' ? 'Entregue' : 'Cancelado'}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                             {order.status === 'pending' && (
                               <button onClick={() => handleUpdateStatus(order.id, 'preparing')} className="bg-amber-500/20 text-amber-500 text-xs px-2 py-1 rounded hover:bg-amber-500/40">Preparar</button>
                             )}
                             {order.status === 'preparing' && (
                               <button onClick={() => handleUpdateStatus(order.id, 'shipped')} className="bg-blue-500/20 text-blue-500 text-xs px-2 py-1 rounded hover:bg-blue-500/40">Enviar</button>
                             )}
                             {order.status === 'shipped' && (
                               <button onClick={() => handleUpdateStatus(order.id, 'delivered')} className="bg-emerald-500/20 text-emerald-500 text-xs px-2 py-1 rounded hover:bg-emerald-500/40">Entregar</button>
                             )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Actions / Summary */}
              <div className="bg-gradient-to-br from-primary/20 to-[#0a0a14] border border-primary/20 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-2">Desempenho da Loja</h3>
                  <p className="text-sm text-primary-100/70 mb-6">Sua loja está no top 5% dos vendedores deste mês.</p>
                  
                  <div className="space-y-4">
                    <div className="bg-[#05050a]/50 p-4 rounded-2xl border border-white/[0.05]">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-neutral-400">Meta Mensal (R$ 50k)</span>
                        <span className="font-bold">92%</span>
                      </div>
                      <div className="w-full bg-white/[0.05] rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full w-[92%]"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button className="w-full bg-white text-black font-bold py-3.5 rounded-xl mt-8 hover:bg-neutral-200 transition-colors relative z-10">
                  Gerar Relatório Financeiro
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === "Configurações" ? (
          <div className="space-y-8">
            <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
              <Settings className="w-6 h-6 text-primary" /> Configurações da Loja
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Informações Básicas */}
              <div className="bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Store className="w-5 h-5 text-blue-500" /> Perfil da Loja</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-neutral-500 uppercase tracking-wider font-bold block mb-1">Nome da Loja</label>
                    <input type="text" defaultValue="Minha Loja Premium" className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 uppercase tracking-wider font-bold block mb-1">Descrição</label>
                    <textarea defaultValue="Especialistas em produtos de alta qualidade com entrega expressa." className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none resize-none" rows={3}></textarea>
                  </div>
                </div>
              </div>

              {/* Logística e Frete */}
              <div className="bg-gradient-to-br from-[#0a0a14] to-primary/10 backdrop-blur-xl border border-primary/20 rounded-3xl p-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> Logística e Frete</h3>
                
                <div className="space-y-6">
                  {/* Frete Grátis Rule */}
                  <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-bold text-white flex items-center gap-2">
                        Habilitar Frete Grátis Automático
                      </label>
                      <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer">
                        <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow"></div>
                      </div>
                    </div>
                    <p className="text-xs text-primary-100/70 mb-3">Defina um valor mínimo para que o cliente ganhe frete grátis nos SEUS produtos.</p>
                    
                    <div>
                      <label className="text-[10px] text-primary-100/50 uppercase tracking-wider font-bold block mb-1">Valor Mínimo do Pedido (R$)</label>
                      <input type="number" defaultValue="299.90" className="w-full bg-[#0a0a14] border border-primary/30 rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none" />
                    </div>
                  </div>

                  {/* Regras Regionais */}
                  <div>
                     <label className="text-xs text-neutral-500 uppercase tracking-wider font-bold block mb-2">Acordo de Transportadoras</label>
                     <div className="flex gap-2 flex-wrap">
                       <span className="px-3 py-1 bg-white/[0.05] border border-white/[0.1] rounded-full text-xs text-neutral-300">Correios Sedex</span>
                       <span className="px-3 py-1 bg-white/[0.05] border border-white/[0.1] rounded-full text-xs text-neutral-300">JadLog</span>
                       <span className="px-3 py-1 bg-white/[0.05] border border-white/[0.1] rounded-full text-xs text-neutral-300">Loggi (Express)</span>
                       <button className="px-3 py-1 border border-dashed border-neutral-600 rounded-full text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1">
                         <Plus className="w-3 h-3" /> Adicionar
                       </button>
                     </div>
                  </div>

                  <button className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:scale-[1.02] transition-transform">
                    Salvar Regras de Logística
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "devoluções" ? (
          <div className="space-y-6 relative z-10">
            {loadingReturns ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : returns.length === 0 ? (
              <div className="text-center py-20 bg-card/20 rounded-3xl border border-dashed border-border/50">
                <RefreshCcw className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground">Nenhuma solicitação de devolução.</h3>
                <p className="text-muted-foreground mt-2">Excelente! Seus produtos estão satisfazendo os clientes.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {returns.map((ret) => (
                  <div key={ret.id} className="bg-card/40 backdrop-blur-xl border border-border/40 p-6 rounded-3xl flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          ret.status === "requested" ? "bg-amber-500/20 text-amber-500" :
                          ret.status === "approved" ? "bg-blue-500/20 text-blue-500" :
                          ret.status === "refunded" ? "bg-green-500/20 text-green-500" :
                          "bg-red-500/20 text-red-500"
                        }`}>
                          {ret.status === "requested" ? "Solicitado" : ret.status === "approved" ? "Aguardando Envio" : ret.status === "refunded" ? "Reembolsado" : ret.status}
                        </span>
                        <span className="text-sm text-muted-foreground font-medium">Motivo: {ret.reason}</span>
                      </div>
                      <p className="text-sm text-foreground mt-3"><strong>Nota do Cliente:</strong> {ret.customer_notes || "Nenhuma nota."}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                      {ret.status === "requested" && (
                        <>
                          <button 
                            onClick={() => handleUpdateReturnStatus(ret.id, "approved")}
                            className="flex-1 lg:flex-none px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                          >
                            Aprovar
                          </button>
                          <button 
                            onClick={() => handleUpdateReturnStatus(ret.id, "rejected")}
                            className="flex-1 lg:flex-none px-6 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold rounded-xl transition-all border border-red-500/30"
                          >
                            Recusar
                          </button>
                        </>
                      )}
                      {ret.status === "approved" && (
                        <button 
                          onClick={() => handleUpdateReturnStatus(ret.id, "refunded")}
                          className="flex-1 lg:flex-none px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                        >
                          Confirmar Recebimento e Reembolsar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "promoções" ? (
          <div className="space-y-6 relative z-10">
            <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-500" /> Promoções Relâmpago
            </h2>
            <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-3xl p-8 max-w-2xl">
              <p className="text-muted-foreground mb-6">Crie gatilhos de escassez e aumente suas vendas dando destaque com limite de tempo.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-neutral-500 uppercase tracking-wider font-bold block mb-1">Selecione o Produto</label>
                  <select 
                    value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
                    className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:border-yellow-500 outline-none"
                  >
                    <option value="">-- Escolha um Produto --</option>
                    {products.map(p => (
                      <option key={p.slug} value={p.slug}>{p.name} (Preço Base: R$ {p.base_price})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-neutral-500 uppercase tracking-wider font-bold block mb-1">Preço Promocional (R$)</label>
                    <input 
                      type="number" step="0.01" value={promoPrice} onChange={e => setPromoPrice(e.target.value)}
                      placeholder="Ex: 199.90" 
                      className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:border-yellow-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 uppercase tracking-wider font-bold block mb-1">Termina Em</label>
                    <input 
                      type="datetime-local" value={promoEnds} onChange={e => setPromoEnds(e.target.value)}
                      className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:border-yellow-500 outline-none" 
                    />
                  </div>
                </div>

                <button onClick={handleSavePromo} className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                  Ativar Promoção Relâmpago
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0a0a14]/80 backdrop-blur-xl rounded-3xl border border-white/[0.05] p-12 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
               <Package className="w-16 h-16 text-primary/40 mb-6" />
               <h3 className="text-2xl font-bold mb-2">Aba {activeTab} em Construção</h3>
               <p className="text-neutral-400 max-w-md">Os dados detalhados para a sessão de {activeTab} estão sendo integrados com o backend financeiro.</p>
          </div>
        )}
      </div>
    </div>
  );
}
