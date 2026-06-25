"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Store, Package, DollarSign, Tag, Settings, LayoutDashboard, CreditCard, Plus, Truck, 
  CheckCircle, Clock, RefreshCcw, Loader2, Zap, MessageSquare, Users, Trash2, Edit2, 
  Eye, Check, X, Send, Upload, ChevronRight, AlertTriangle, TrendingUp, Award
} from "lucide-react";
import { api, returnsApi, catalogApi, chatApi, sellerDashboardApi, sellerOrdersApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

export default function SellerPage() {
  return (
    <Suspense fallback={null}>
      <SellerDashboard />
    </Suspense>
  );
}

function SellerDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [returns, setReturns] = useState<any[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Categories & Brands
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  // Product CRUD states
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editorTab, setEditorTab] = useState<"general" | "images" | "variants">("general");
  const [imageUploading, setImageUploading] = useState(false);
  const [addingVariant, setAddingVariant] = useState(false);

  // Product Form states
  const [productForm, setProductForm] = useState({
    name: "",
    slug: "",
    category: "",
    brand: "",
    description: "",
    base_price: "",
    is_available: true,
    meta_title: "",
    meta_description: ""
  });

  // Variant Form states
  const [variantSku, setVariantSku] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [variantStock, setVariantStock] = useState("");
  const [variantActive, setVariantActive] = useState(true);
  const [variantAttrs, setVariantAttrs] = useState<number[]>([]);
  const [attributeOptions, setAttributeOptions] = useState<any[]>([]);

  // Sales Mentor states
  const [mentorData, setMentorData] = useState<any>(null);
  const [loadingMentor, setLoadingMentor] = useState(false);

  // Leads states
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Chat/Messaging states
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [chatMessageInput, setChatMessageInput] = useState("");

  // Promo states (From original page)
  const [selectedProduct, setSelectedProduct] = useState("");
  const [promoPrice, setPromoPrice] = useState("");
  const [promoEnds, setPromoEnds] = useState("");

  useEffect(() => {
    if (isAuthenticated && user?.role !== "seller") {
      router.push("/");
    } else if (isAuthenticated && user?.role === "seller") {
      fetchOrders();
      fetchReturns();
      fetchProducts();
      fetchCategoriesAndBrands();
      fetchGlobalAttributes();
      fetchMentorData();
      fetchLeads();
      fetchChatRooms();
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    // Retirado o callback do Stripe
  }, [searchParams, router]);

  // Chat Polling
  useEffect(() => {
    let interval: any;
    if (activeTab === "mensagens") {
      fetchChatRooms(true);
      interval = setInterval(() => {
        fetchChatRooms(true);
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, selectedRoom?.id]);

  const fetchCategoriesAndBrands = async () => {
    try {
      const [catsRes, brandsRes] = await Promise.all([
        catalogApi.categories(),
        catalogApi.brands()
      ]);
      setCategories(catsRes.data.results || catsRes.data);
      setBrands(brandsRes.data.results || brandsRes.data);
    } catch (err) {
      console.error("Erro ao buscar categorias e marcas", err);
    }
  };

  const fetchGlobalAttributes = async () => {
    try {
      const res = await catalogApi.products({ limit: 100 });
      const productsList = res.data.results || res.data;
      const list: any[] = [];
      productsList.forEach((prod: any) => {
        prod.variants?.forEach((v: any) => {
          v.attributes?.forEach((attr: any) => {
            if (!list.find((item) => item.id === attr.id)) {
              list.push({
                id: attr.id,
                name: attr.attribute_name,
                value: attr.value,
              });
            }
          });
        });
      });
      setAttributeOptions(list);
    } catch (err) {
      console.error("Erro ao buscar atributos de variantes", err);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await sellerDashboardApi.products.list();
      setProducts(res.data.results || res.data);
    } catch (err) {
      console.error(err);
      toast("Erro ao carregar produtos.", "error");
    } finally {
      setLoadingProducts(false);
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

  const fetchMentorData = async () => {
    setLoadingMentor(true);
    try {
      const res = await sellerDashboardApi.getMentor();
      setMentorData(res.data);
    } catch (err) {
      console.error("Erro ao carregar mentor de vendas", err);
    } finally {
      setLoadingMentor(false);
    }
  };

  const fetchLeads = async () => {
    setLoadingLeads(true);
    try {
      const res = await sellerDashboardApi.getLeads();
      setLeads(res.data);
    } catch (err) {
      console.error("Erro ao carregar leads", err);
    } finally {
      setLoadingLeads(false);
    }
  };

  const fetchChatRooms = async (silent = false) => {
    try {
      const res = await chatApi.listRooms();
      const roomsList = res.data.results || res.data;
      setChatRooms(roomsList);
      if (selectedRoom) {
        const updated = roomsList.find((r: any) => r.id === selectedRoom.id);
        if (updated) {
          setSelectedRoom(updated);
        }
      }
    } catch (err) {
      if (!silent) {
        console.error("Erro ao buscar salas de chat", err);
      }
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await sellerOrdersApi.updateStatus(orderId, newStatus);
      toast("Status do pedido atualizado com sucesso!", "success");
      fetchOrders();
    } catch (err) {
      toast("Erro ao atualizar status. Verifique se a transição é válida.", "error");
    }
  };

  const handleUploadInvoice = async (orderId: string) => {
    const link = prompt("Cole o link (URL) da Nota Fiscal em PDF:");
    if (!link) return;
    try {
      await sellerOrdersApi.uploadInvoice(orderId, link);
      toast("Nota Fiscal anexada e cliente notificado!", "success");
      fetchOrders();
    } catch (err) {
      toast("Erro ao anexar Nota Fiscal.", "error");
    }
  };

  const handleUpdateReturnStatus = async (returnId: string, newStatus: string) => {
    try {
      await returnsApi.updateStatus(returnId, newStatus);
      toast("Status da devolução atualizado com sucesso!", "success");
      fetchReturns();
    } catch (err) {
      toast("Erro ao atualizar status da devolução.", "error");
    }
  };

  const handleSavePromo = async () => {
    if (!selectedProduct || !promoPrice || !promoEnds) {
      toast("Preencha todos os campos da promoção.", "warning");
      return;
    }
    try {
      await catalogApi.setPromo(selectedProduct, {
        promotional_price: parseFloat(promoPrice),
        promo_ends_at: new Date(promoEnds).toISOString()
      });
      toast("Promoção Relâmpago configurada com sucesso!", "success");
      setPromoPrice(""); setPromoEnds(""); setSelectedProduct("");
      fetchProducts();
    } catch (err) {
      toast("Erro ao configurar promoção. Preço promocional deve ser menor que o preço base.", "error");
    }
  };

  // Sales Mentor actions
  const handleTriggerMentorAction = async (actionType: string, slug: string) => {
    try {
      const res = await sellerDashboardApi.triggerMentorAction(actionType, slug);
      toast(res.data.detail || "Ação do mentor executada com sucesso!", "success");
      fetchMentorData();
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast("Erro ao executar ação do mentor.", "error");
    }
  };

  // Product CRUD Handlers
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      slug: "",
      category: "",
      brand: "",
      description: "",
      base_price: "",
      is_available: true,
      meta_title: "",
      meta_description: ""
    });
    setEditorTab("general");
    setIsEditing(true);
  };

  const handleOpenEditProduct = async (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || "",
      slug: product.slug || "",
      category: product.category || product.category_id || "",
      brand: product.brand || product.brand_id || "",
      description: product.description || "",
      base_price: product.base_price ? String(product.base_price) : "",
      is_available: product.is_available ?? true,
      meta_title: product.meta_title || "",
      meta_description: product.meta_description || ""
    });
    setEditorTab("general");
    setIsEditing(true);
    
    // Load full details for variants/images
    try {
      const res = await api.get(`/sellers/me/products/${product.id}/`);
      setEditingProduct(res.data);
    } catch (err) {
      console.error("Erro ao carregar detalhes completos", err);
    }
  };

  const fetchProductDetail = async (id: string) => {
    try {
      const res = await api.get(`/sellers/me/products/${id}/`);
      setEditingProduct(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.category || !productForm.base_price) {
      toast("Por favor, preencha os campos obrigatórios (Nome, Categoria e Preço).", "warning");
      return;
    }

    const payload: any = {
      name: productForm.name,
      category: productForm.category,
      description: productForm.description,
      base_price: parseFloat(productForm.base_price),
      is_available: productForm.is_available,
      meta_title: productForm.meta_title,
      meta_description: productForm.meta_description
    };

    if (productForm.brand) {
      payload.brand = productForm.brand;
    }
    if (productForm.slug.trim()) {
      payload.slug = productForm.slug.trim();
    }

    try {
      if (editingProduct) {
        await sellerDashboardApi.products.update(editingProduct.id, payload);
        toast("Produto atualizado com sucesso!", "success");
        fetchProducts();
        setIsEditing(false);
      } else {
        const res = await sellerDashboardApi.products.create(payload);
        toast("Produto criado com sucesso! Adicione fotos e variantes agora.", "success");
        fetchProducts();
        // Keep editor open but switch to edit mode of the created product
        handleOpenEditProduct(res.data);
      }
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || err.response?.data?.slug || "Erro ao salvar produto.";
      toast(Array.isArray(detail) ? detail[0] : detail, "error");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      await sellerDashboardApi.products.delete(id);
      toast("Produto excluído com sucesso!", "success");
      fetchProducts();
    } catch (err: any) {
      toast(err.response?.data?.detail || "Erro ao excluir produto. Ele pode ter pedidos vinculados.", "error");
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editingProduct) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("image", file);
    try {
      setImageUploading(true);
      await sellerDashboardApi.products.uploadImage(editingProduct.id, formData);
      toast("Imagem enviada com sucesso!", "success");
      await fetchProductDetail(editingProduct.id);
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast("Erro ao enviar imagem.", "error");
    } finally {
      setImageUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!editingProduct) return;
    try {
      await sellerDashboardApi.products.deleteImage(editingProduct.id, imageId);
      toast("Imagem excluída com sucesso!", "success");
      await fetchProductDetail(editingProduct.id);
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast("Erro ao excluir imagem.", "error");
    }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!variantSku.trim() || !variantStock) {
      toast("SKU e Estoque são obrigatórios para a variante.", "warning");
      return;
    }

    const payload: any = {
      sku: variantSku.trim(),
      stock: parseInt(variantStock),
      is_active: variantActive,
      attributes: variantAttrs
    };

    if (variantPrice) {
      payload.price = parseFloat(variantPrice);
    }

    try {
      setAddingVariant(true);
      await sellerDashboardApi.products.createVariant(editingProduct.id, payload);
      toast("Variante criada com sucesso!", "success");
      setVariantSku("");
      setVariantPrice("");
      setVariantStock("");
      setVariantActive(true);
      setVariantAttrs([]);
      await fetchProductDetail(editingProduct.id);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || err.response?.data?.sku || "Erro ao criar variante.";
      toast(Array.isArray(detail) ? detail[0] : detail, "error");
    } finally {
      setAddingVariant(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!editingProduct) return;
    try {
      await sellerDashboardApi.products.deleteVariant(editingProduct.id, variantId);
      toast("Variante excluída com sucesso!", "success");
      await fetchProductDetail(editingProduct.id);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      toast(err.response?.data?.detail || "Erro ao excluir variante.", "error");
    }
  };

  const handleToggleAttrSelection = (id: number) => {
    setVariantAttrs(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Lead chat initiator
  const handleInitiateChatFromLead = async (lead: any) => {
    try {
      const res = await chatApi.createRoom({
        customer_id: lead.customer_id,
        product_id: lead.product_id
      });
      toast("Canal de atendimento aberto!", "success");
      setSelectedRoom(res.data);
      setActiveTab("mensagens");
    } catch (err) {
      console.error(err);
      toast("Não foi possível iniciar chat com este cliente.", "error");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !chatMessageInput.trim()) return;
    const text = chatMessageInput.trim();
    setChatMessageInput("");
    try {
      const res = await chatApi.sendMessage(selectedRoom.id, text);
      setSelectedRoom((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...(prev.messages || []), res.data]
        };
      });
      setChatRooms((prevList) =>
        prevList.map((room) =>
          room.id === selectedRoom.id
            ? { ...room, messages: [...(room.messages || []), res.data] }
            : room
        )
      );
    } catch (err) {
      console.error(err);
      toast("Erro ao enviar mensagem.", "error");
    }
  };

  if (!isAuthenticated || user?.role !== "seller") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05050a] text-white">
        <div className="animate-pulse flex items-center gap-2 font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          Acessando painel da loja...
        </div>
      </div>
    );
  }

  // Seller metrics calculation
  const totalViews = products.reduce((acc, p) => acc + (p.views_count || 0), 0);
  const totalClicks = products.reduce((acc, p) => acc + (p.clicks_count || 0), 0);
  const overallCTR = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0";

  const metrics = [
    { title: "Visualizações Totais", value: totalViews.toLocaleString(), icon: Eye, change: "Acessos à loja", isPositive: true },
    { title: "Cliques em Produtos", value: totalClicks.toLocaleString(), icon: Zap, change: "Ações de interesse", isPositive: true },
    { title: "CTR da Vitrine", value: `${overallCTR}%`, icon: TrendingUp, change: "Taxa de cliques", isPositive: Number(overallCTR) > 20 },
    { title: "Pedidos Faturados", value: orders.length, icon: Package, change: "Conversões totais", isPositive: true },
  ];

  const sidebarTabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "produtos", label: "Produtos", icon: Package },
    { id: "mentor", label: "Mentor de Vendas", icon: Award },
    { id: "leads", label: "Leads (Interesses)", icon: Users },
    { id: "mensagens", label: "Mensagens", icon: MessageSquare },
    { id: "vendas", label: "Vendas", icon: DollarSign },
    { id: "devolucoes", label: "Devoluções", icon: RefreshCcw },
    { id: "promocoes", label: "Promoções", icon: Tag },
    { id: "configuracoes", label: "Configurações", icon: Settings },
  ];

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
          <p className="text-sm text-neutral-400 mt-3 truncate font-medium">Vendedor: {user?.first_name} {user?.last_name}</p>
        </div>
        <nav className="p-6 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
          {sidebarTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button 
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsEditing(false);
                }} 
                className={`flex-shrink-0 flex items-center gap-4 px-5 py-3.5 rounded-2xl font-semibold transition-all duration-300 ${
                  activeTab === tab.id 
                    ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-[0_4px_20px_rgba(var(--primary),0.3)] translate-x-1" 
                    : "hover:bg-white/[0.04] text-neutral-400 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Premium */}
      <div className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto relative min-h-screen">
        {/* Glow background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

        <header className="mb-12 flex justify-between items-center relative z-10">
          <div>
            <h1 className="text-4xl font-display font-extrabold tracking-tight capitalize">
              {activeTab === "devolucoes" ? "Devoluções" : activeTab === "promocoes" ? "Promoções" : activeTab === "configuracoes" ? "Configurações" : activeTab}
            </h1>
            <p className="text-neutral-400 mt-2 font-medium">Acompanhe seu desempenho de mentor de vendas e converta leads.</p>
          </div>
          {activeTab === "produtos" && !isEditing && (
            <button 
              onClick={handleOpenCreateProduct}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:scale-105 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Novo Produto
            </button>
          )}
        </header>

        {/* Tab content rendering */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 relative z-10">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((m, idx) => {
                const Icon = m.icon;
                return (
                  <div key={idx} className="bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] p-6 rounded-3xl hover:border-white/[0.1] transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-white/[0.03] rounded-xl group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${m.isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        {m.change}
                      </span>
                    </div>
                    <h3 className="text-neutral-400 font-medium text-sm mb-1">{m.title}</h3>
                    <p className="text-3xl font-bold text-white tracking-tight">{m.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Recents */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
              <div className="lg:col-span-2 bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Pedidos Recentes</h3>
                  <button onClick={() => setActiveTab("vendas")} className="text-primary text-sm font-semibold hover:underline">Ver Todos</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.05] text-neutral-400 text-sm">
                        <th className="pb-4 font-medium">Pedido</th>
                        <th className="pb-4 font-medium">Produto</th>
                        <th className="pb-4 font-medium">Valor</th>
                        <th className="pb-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingOrders ? (
                        <tr><td colSpan={4} className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
                      ) : orders.length === 0 ? (
                        <tr><td colSpan={4} className="py-8 text-center text-neutral-500">Nenhum pedido recebido ainda.</td></tr>
                      ) : orders.slice(0, 5).map((order, i) => (
                        <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 font-semibold text-neutral-300">#{order.id.split('-')[0].toUpperCase()}</td>
                          <td className="py-4 text-sm">
                            {order.items?.map((item: any) => (
                              <div key={item.id} className="text-white font-medium">{item.product_name} <span className="text-neutral-400 text-xs">(x{item.quantity})</span></div>
                            ))}
                          </td>
                          <td className="py-4 font-bold text-primary">R$ {Number(order.total_price || order.total).toFixed(2)}</td>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sidebar helper */}
              <div className="bg-gradient-to-br from-primary/20 to-[#0a0a14] border border-primary/20 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Mentor do Lojista</h3>
                  <p className="text-sm text-primary-100/70 mb-6">Receba insights em tempo real de produtos parados na wishlist ou carrinhos.</p>
                  
                  <div className="space-y-4">
                    <div className="bg-[#05050a]/50 p-4 rounded-2xl border border-white/[0.05]">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-neutral-400">Conversão de Leads</span>
                        <span className="font-bold">{leads.length} Oportunidades</span>
                      </div>
                      <p className="text-xs text-neutral-400">Tente fechar compras iniciando chats diretamente com clientes da aba Leads.</p>
                    </div>
                  </div>
                </div>
                
                <button onClick={() => setActiveTab("mentor")} className="w-full bg-white text-black font-bold py-3.5 rounded-xl mt-8 hover:bg-neutral-200 transition-colors">
                  Acessar Mentor de Vendas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Produtos */}
        {activeTab === "produtos" && (
          <div className="space-y-8 z-10 relative">
            {!isEditing ? (
              // Products list view
              <div className="bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8">
                {loadingProducts ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-20 text-neutral-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
                    <h3 className="text-lg font-bold text-white mb-2">Nenhum produto cadastrado</h3>
                    <p className="text-sm text-neutral-400">Comece a cadastrar e vender na MySuperStore.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.05] text-neutral-400 text-sm">
                          <th className="pb-4 font-medium">Imagem</th>
                          <th className="pb-4 font-medium">Nome</th>
                          <th className="pb-4 font-medium">Categoria</th>
                          <th className="pb-4 font-medium">Preço Base</th>
                          <th className="pb-4 font-medium">Acessos (V / C)</th>
                          <th className="pb-4 font-medium">Status</th>
                          <th className="pb-4 font-medium text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors">
                            <td className="py-4">
                              <div className="w-12 h-12 bg-white/[0.03] border border-white/[0.05] rounded-lg overflow-hidden flex items-center justify-center">
                                {product.primary_image ? (
                                  <img src={product.primary_image} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-5 h-5 text-neutral-600" />
                                )}
                              </div>
                            </td>
                            <td className="py-4 font-medium text-white max-w-[200px] truncate">{product.name}</td>
                            <td className="py-4 text-sm text-neutral-400">{product.category_name}</td>
                            <td className="py-4 font-bold text-white">R$ {Number(product.base_price).toFixed(2)}</td>
                            <td className="py-4 text-sm text-neutral-400">
                              <span className="text-blue-400 font-semibold">{product.views_count || 0}</span> / <span className="text-emerald-400 font-semibold">{product.clicks_count || 0}</span>
                            </td>
                            <td className="py-4">
                              <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
                                product.is_available ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                              }`}>
                                {product.is_available ? "Disponível" : "Pausado"}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleOpenEditProduct(product)}
                                  className="p-2 bg-white/[0.03] border border-white/[0.05] hover:border-primary/50 hover:bg-primary/20 text-neutral-300 hover:text-white rounded-lg transition-colors"
                                  title="Editar produto"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="p-2 bg-white/[0.03] border border-white/[0.05] hover:border-red-500/50 hover:bg-red-500/20 text-neutral-300 hover:text-red-400 rounded-lg transition-colors"
                                  title="Excluir produto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              // Product Create/Edit form & Tabs
              <div className="bg-[#0a0a14]/90 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8 relative">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="absolute top-6 right-6 text-neutral-400 hover:text-white font-medium flex items-center gap-1 text-sm transition-colors"
                >
                  <X className="w-4 h-4" /> Fechar Editor
                </button>

                <h3 className="text-xl font-bold text-white mb-6">
                  {editingProduct ? `Editando: ${editingProduct.name}` : "Novo Produto"}
                </h3>

                {editingProduct && (
                  // Tabs inside editor
                  <div className="flex gap-4 border-b border-white/[0.05] pb-4 mb-6">
                    {(["general", "images", "variants"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setEditorTab(tab)}
                        className={`text-sm font-bold pb-2 border-b-2 px-1 transition-all ${
                          editorTab === tab 
                            ? "border-primary text-white" 
                            : "border-transparent text-neutral-400 hover:text-white"
                        }`}
                      >
                        {tab === "general" && "Informações Gerais"}
                        {tab === "images" && "Galeria de Fotos"}
                        {tab === "variants" && "Estoque e Variantes"}
                      </button>
                    ))}
                  </div>
                )}

                {editorTab === "general" && (
                  <form onSubmit={handleSaveProduct} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider block mb-2">Nome do Produto *</label>
                        <input
                          type="text"
                          required
                          value={productForm.name}
                          onChange={e => setProductForm({...productForm, name: e.target.value})}
                          placeholder="Ex: Teclado Mecânico RGB"
                          className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider block mb-2">Slug (URL amigável)</label>
                        <input
                          type="text"
                          value={productForm.slug}
                          onChange={e => setProductForm({...productForm, slug: e.target.value})}
                          placeholder="deixe em branco para gerar automático"
                          className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider block mb-2">Categoria *</label>
                        <select
                          value={productForm.category}
                          required
                          onChange={e => setProductForm({...productForm, category: e.target.value})}
                          className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                        >
                          <option value="">-- Selecione --</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider block mb-2">Marca</label>
                        <select
                          value={productForm.brand}
                          onChange={e => setProductForm({...productForm, brand: e.target.value})}
                          className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                        >
                          <option value="">-- Nenhuma --</option>
                          {brands.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider block mb-2">Preço Base (R$) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={productForm.base_price}
                          onChange={e => setProductForm({...productForm, base_price: e.target.value})}
                          placeholder="Ex: 299.90"
                          className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider block mb-2">Descrição do Produto</label>
                      <textarea
                        rows={4}
                        value={productForm.description}
                        onChange={e => setProductForm({...productForm, description: e.target.value})}
                        placeholder="Escreva detalhes técnicos e benefícios do produto..."
                        className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none resize-none"
                      />
                    </div>

                    <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">Disponível para venda</h4>
                        <p className="text-xs text-neutral-400 mt-1">Habilite para que este produto seja listado no catálogo público.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={productForm.is_available}
                        onChange={e => setProductForm({...productForm, is_available: e.target.checked})}
                        className="w-5 h-5 rounded border-white/[0.1] text-primary focus:ring-primary bg-[#141420]" 
                      />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/[0.05]">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Settings className="w-4 h-4 text-primary" /> SEO Otimização
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-xs text-neutral-400 font-bold uppercase block mb-1">
                            Meta Título (máx. 70 caracteres)
                          </label>
                          <input
                            type="text"
                            maxLength={70}
                            value={productForm.meta_title}
                            onChange={e => setProductForm({...productForm, meta_title: e.target.value})}
                            className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-neutral-400 font-bold uppercase block mb-1">
                            Meta Descrição (máx. 160 caracteres)
                          </label>
                          <textarea
                            rows={2}
                            maxLength={160}
                            value={productForm.meta_description}
                            onChange={e => setProductForm({...productForm, meta_description: e.target.value})}
                            className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                    >
                      {editingProduct ? "Salvar Alterações" : "Criar Produto & Ir para Fotos"}
                    </button>
                  </form>
                )}

                {editorTab === "images" && editingProduct && (
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-sm font-bold text-white mb-4">Enviar Nova Foto</h4>
                      <label className="border border-dashed border-white/[0.1] hover:border-primary/50 bg-[#141420]/30 hover:bg-[#141420]/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all">
                        {imageUploading ? (
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        ) : (
                          <Upload className="w-8 h-8 text-neutral-500 mb-2" />
                        )}
                        <span className="text-sm font-semibold text-white">Escolher Arquivo</span>
                        <span className="text-xs text-neutral-400 mt-1">Formato JPG, PNG ou WEBP</span>
                        <input type="file" onChange={handleUploadImage} disabled={imageUploading} className="hidden" accept="image/*" />
                      </label>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white mb-4">Fotos Enviadas</h4>
                      {(!editingProduct.images || editingProduct.images.length === 0) ? (
                        <p className="text-sm text-neutral-500">Nenhuma imagem enviada para este produto ainda.</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          {editingProduct.images.map((img: any) => (
                            <div key={img.id} className="relative group bg-[#141420] border border-white/[0.05] rounded-2xl overflow-hidden aspect-square">
                              <img src={img.image} alt="Produto" className="w-full h-full object-cover" />
                              {img.is_primary && (
                                <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  Principal
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteImage(img.id)}
                                className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-red-500/80 rounded-xl text-neutral-300 hover:text-white transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {editorTab === "variants" && editingProduct && (
                  <div className="space-y-8">
                    {/* Add Variant Form */}
                    <form onSubmit={handleAddVariant} className="bg-[#141420]/40 p-6 border border-white/[0.05] rounded-2xl space-y-6">
                      <h4 className="font-bold text-white text-sm">Criar Nova Variante</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="text-xs text-neutral-400 font-bold block mb-1">SKU da Variante *</label>
                          <input
                            type="text"
                            required
                            value={variantSku}
                            onChange={e => setVariantSku(e.target.value)}
                            placeholder="Ex: PROD-M-PRETO"
                            className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-neutral-400 font-bold block mb-1">Estoque Inicial *</label>
                          <input
                            type="number"
                            required
                            value={variantStock}
                            onChange={e => setVariantStock(e.target.value)}
                            placeholder="Ex: 50"
                            className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-neutral-400 font-bold block mb-1">Preço Override (Opcional)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={variantPrice}
                            onChange={e => setVariantPrice(e.target.value)}
                            placeholder={`Padrão: R$ ${editingProduct.base_price}`}
                            className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none"
                          />
                        </div>
                      </div>

                      {attributeOptions.length > 0 && (
                        <div>
                          <label className="text-xs text-neutral-400 font-bold block mb-2">Selecione Atributos correspondentes</label>
                          <div className="flex flex-wrap gap-3">
                            {attributeOptions.map((opt) => {
                              const selected = variantAttrs.includes(opt.id);
                              return (
                                <button
                                  type="button"
                                  key={opt.id}
                                  onClick={() => handleToggleAttrSelection(opt.id)}
                                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                    selected 
                                      ? "bg-primary/20 border-primary text-white" 
                                      : "bg-white/[0.02] border-white/[0.05] text-neutral-400 hover:text-white"
                                  }`}
                                >
                                  {opt.name}: {opt.value}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={addingVariant}
                        className="bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:scale-[1.02] transition-transform disabled:opacity-50"
                      >
                        {addingVariant ? "Criando Variante..." : "Salvar Variante"}
                      </button>
                    </form>

                    {/* Variants list */}
                    <div>
                      <h4 className="text-sm font-bold text-white mb-4">Variantes Ativas</h4>
                      {(!editingProduct.variants || editingProduct.variants.length === 0) ? (
                        <p className="text-sm text-neutral-500">Este produto não possui variantes criadas. Uma variante padrão (STD) foi criada para estoque geral.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-white/[0.05] text-neutral-400 text-xs uppercase tracking-wider">
                                <th className="pb-3 font-medium">SKU</th>
                                <th className="pb-3 font-medium">Atributos</th>
                                <th className="pb-3 font-medium">Estoque</th>
                                <th className="pb-3 font-medium">Preço Efetivo</th>
                                <th className="pb-3 font-medium text-right">Ação</th>
                              </tr>
                            </thead>
                            <tbody>
                              {editingProduct.variants.map((v: any) => (
                                <tr key={v.id} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                                  <td className="py-3 font-semibold text-white text-sm">{v.sku}</td>
                                  <td className="py-3 text-xs text-neutral-400">
                                    {v.attributes && v.attributes.length > 0 ? (
                                      v.attributes.map((a: any) => `${a.attribute_name}: ${a.value}`).join(", ")
                                    ) : (
                                      <span className="text-neutral-600">Nenhum</span>
                                    )}
                                  </td>
                                  <td className="py-3 font-medium text-white text-sm">{v.stock}</td>
                                  <td className="py-3 font-bold text-primary text-sm">
                                    R$ {Number(v.effective_price || v.price || editingProduct.base_price).toFixed(2)}
                                  </td>
                                  <td className="py-3 text-right">
                                    <button
                                      onClick={() => handleDeleteVariant(v.id)}
                                      className="p-1.5 bg-white/[0.02] hover:bg-red-500/20 border border-white/[0.05] hover:border-red-500/50 text-neutral-400 hover:text-red-400 rounded-lg transition-colors"
                                      title="Remover variante"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab: Mentor de Vendas */}
        {activeTab === "mentor" && (
          <div className="space-y-8 z-10 relative">
            {/* KPI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((m, idx) => {
                const Icon = m.icon;
                return (
                  <div key={idx} className="bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] p-6 rounded-3xl transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-white/[0.03] rounded-xl">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-neutral-400 font-medium text-sm mb-1">{m.title}</h3>
                    <p className="text-3xl font-bold text-white tracking-tight">{m.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Mentor Recommendations */}
            <div className="bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-500/20 text-yellow-500 rounded-xl">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Conselhos do Mentor de Vendas</h3>
                  <p className="text-sm text-neutral-400 mt-1">Recomendações automáticas baseadas nas visualizações e cliques de seus produtos.</p>
                </div>
              </div>

              {loadingMentor ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : !mentorData || !mentorData.suggestions || mentorData.suggestions.length === 0 ? (
                <div className="text-center py-12 bg-white/[0.02] border border-dashed border-white/[0.05] rounded-2xl">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                  <h4 className="text-white font-bold mb-1">Sem novos insights</h4>
                  <p className="text-sm text-neutral-400">Todos os seus produtos estão performando de forma equilibrada ou aguardando mais tráfego.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mentorData.suggestions.map((suggestion: any, idx: number) => {
                    const isPromo = suggestion.type === "promotion";
                    return (
                      <div 
                        key={idx} 
                        className={`p-6 border rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all ${
                          isPromo 
                            ? "bg-gradient-to-r from-yellow-500/10 via-[#0a0a14] to-transparent border-yellow-500/20" 
                            : "bg-gradient-to-r from-blue-500/10 via-[#0a0a14] to-transparent border-blue-500/20"
                        }`}
                      >
                        <div className="space-y-2 max-w-2xl">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isPromo ? "bg-yellow-500/10 text-yellow-400" : "bg-blue-500/10 text-blue-400"
                          }`}>
                            {suggestion.title}
                          </span>
                          <h4 className="font-bold text-white text-base">{suggestion.product_name}</h4>
                          <p className="text-sm text-neutral-400 leading-relaxed">{suggestion.description}</p>
                        </div>

                        <button
                          onClick={() => handleTriggerMentorAction(suggestion.type, suggestion.product_slug)}
                          className={`px-5 py-3 rounded-xl font-bold text-sm shrink-0 transition-transform hover:scale-105 flex items-center gap-2 ${
                            isPromo 
                              ? "bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:bg-yellow-600" 
                              : "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:bg-blue-600"
                          }`}
                        >
                          <Zap className="w-4 h-4 shrink-0" />
                          {isPromo ? "Ativar 10% OFF" : "Reajustar (+5%)"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Leads */}
        {activeTab === "leads" && (
          <div className="space-y-8 z-10 relative">
            <div className="bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/20 text-primary rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Leads de Vendas Recentes</h3>
                  <p className="text-sm text-neutral-400 mt-1">Clientes que favoritaram seus produtos ou abandonaram itens no carrinho de compras.</p>
                </div>
              </div>

              {loadingLeads ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-16 bg-white/[0.01] border border-dashed border-white/[0.05] rounded-2xl">
                  <Users className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <h4 className="text-white font-bold mb-1">Nenhum lead disponível</h4>
                  <p className="text-sm text-neutral-400">Assim que algum cliente favoritar seus produtos ou abandonar um carrinho, ele aparecerá aqui.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {leads.map((lead: any, idx: number) => {
                    const isCart = lead.source === "carrinho";
                    return (
                      <div 
                        key={idx} 
                        className={`p-6 border bg-[#141420]/30 backdrop-blur-md rounded-2xl flex flex-col justify-between gap-4 transition-all hover:bg-[#141420]/50 border-white/[0.05]`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-white text-base capitalize">{lead.customer_name}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isCart ? "bg-amber-500/10 text-amber-400" : "bg-purple-500/10 text-purple-400"
                            }`}>
                              Interesse no {lead.source}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400">{lead.customer_email}</p>
                          <div className="pt-2 border-t border-white/[0.03]">
                            <span className="text-xs text-neutral-400">Produto Relacionado:</span>
                            <p className="text-sm font-bold text-white truncate mt-0.5">{lead.product_name}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleInitiateChatFromLead(lead)}
                          className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Falar com Cliente
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Mensagens */}
        {activeTab === "mensagens" && (
          <div className="z-10 relative">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#0a0a14]/65 border border-white/[0.05] rounded-3xl overflow-hidden min-h-[600px] h-[calc(100vh-280px)] backdrop-blur-xl">
              {/* Left Panel: Rooms list */}
              <div className="border-r border-white/[0.05] flex flex-col h-full bg-[#0a0a14]/40">
                <div className="p-6 border-b border-white/[0.05] bg-gradient-to-b from-primary/5 to-transparent">
                  <h3 className="text-lg font-bold text-white mb-2">Conversas</h3>
                  <p className="text-xs text-neutral-400">Atendimento aos clientes em tempo real</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatRooms.length === 0 ? (
                    <div className="text-center py-10 text-neutral-500 text-sm">Nenhuma conversa ativa no momento.</div>
                  ) : (
                    chatRooms.map((room) => {
                      const isSelected = selectedRoom?.id === room.id;
                      const lastMsg = room.messages?.[room.messages.length - 1]?.message || "Sem mensagens";
                      return (
                        <button
                          key={room.id}
                          onClick={() => setSelectedRoom(room)}
                          className={`w-full text-left p-4 rounded-2xl transition-all border ${
                            isSelected
                              ? "bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                              : "bg-white/[0.02] border-transparent hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-semibold text-sm text-white truncate max-w-[70%]">
                              {room.customer_name || room.customer_email.split("@")[0]}
                            </h4>
                            <span className="text-[10px] text-neutral-500">
                              {new Date(room.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {room.product_name && (
                            <div className="text-[11px] text-primary font-medium truncate mb-1">
                              Interesse: {room.product_name}
                            </div>
                          )}
                          <p className="text-xs text-neutral-400 truncate mt-1">
                            {lastMsg}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Panel: Chat Flow */}
              <div className="lg:col-span-2 flex flex-col h-full bg-[#05050a]/20">
                {selectedRoom ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-6 border-b border-white/[0.05] bg-[#0a0a14]/60 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-white text-base">
                          {selectedRoom.customer_name || selectedRoom.customer_email.split("@")[0]}
                        </h3>
                        <p className="text-xs text-neutral-400 mt-1">{selectedRoom.customer_email}</p>
                      </div>
                      {selectedRoom.product_name && (
                        <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-2">
                          <span className="text-xs text-primary font-semibold truncate max-w-[150px]">
                            Anúncio: {selectedRoom.product_name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Chat Messages flow */}
                    <div className="flex-grow overflow-y-auto p-6 space-y-4 flex flex-col bg-[#05050a]/10">
                      {selectedRoom.messages?.map((msg: any) => {
                        const isMe = msg.sender === user?.id || msg.sender_email === user?.email;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            <div
                              className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                isMe
                                  ? "bg-primary text-white rounded-tr-none shadow-[0_4px_15px_rgba(var(--primary),0.2)]"
                                  : "bg-[#141420] text-neutral-200 rounded-tl-none border border-white/[0.05]"
                              }`}
                            >
                              <p>{msg.message}</p>
                            </div>
                            <span className="text-[10px] text-neutral-500 mt-1 px-1">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Message Input form */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-white/[0.05] bg-[#0a0a14]/60 flex gap-3">
                      <input
                        type="text"
                        value={chatMessageInput}
                        onChange={(e) => setChatMessageInput(e.target.value)}
                        placeholder="Escreva uma resposta para o cliente..."
                        className="flex-grow bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!chatMessageInput.trim()}
                        className="bg-primary text-white px-5 py-3 rounded-xl font-bold shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-12">
                    <MessageSquare className="w-16 h-16 text-neutral-600 mb-4 animate-pulse" />
                    <h3 className="text-xl font-bold text-white mb-2">Suas Conversas</h3>
                    <p className="text-neutral-400 max-w-sm text-sm">
                      Selecione um cliente no painel esquerdo para responder mensagens ou inicie novos contatos a partir de leads de interesse.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Vendas */}
        {activeTab === "vendas" && (
          <div className="space-y-6 relative z-10">
            <div className="bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8">
              <h3 className="text-xl font-bold mb-6">Histórico de Pedidos Recebidos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.05] text-neutral-400 text-sm">
                      <th className="pb-4 font-medium">Pedido</th>
                      <th className="pb-4 font-medium">Produto</th>
                      <th className="pb-4 font-medium">Comissão</th>
                      <th className="pb-4 font-medium">Líquido Receber</th>
                      <th className="pb-4 font-medium">Valor Total</th>
                      <th className="pb-4 font-medium">Status</th>
                      <th className="pb-4 font-medium text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingOrders ? (
                      <tr><td colSpan={7} className="py-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></td></tr>
                    ) : orders.length === 0 ? (
                      <tr><td colSpan={7} className="py-8 text-center text-neutral-500">Nenhum pedido recebido ainda.</td></tr>
                    ) : orders.map((order, i) => (
                      <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 font-semibold text-neutral-300">#{order.id.split('-')[0].toUpperCase()}</td>
                        <td className="py-4 text-sm">
                          {order.items?.map((item: any) => (
                            <div key={item.id} className="text-white font-medium">{item.product_name} <span className="text-neutral-400 text-xs">(x{item.quantity})</span></div>
                          ))}
                        </td>
                        <td className="py-4 text-sm text-red-400">- R$ {Number(order.commission || 0).toFixed(2)}</td>
                        <td className="py-4 text-sm font-semibold text-emerald-400">R$ {Number(order.seller_amount || 0).toFixed(2)}</td>
                        <td className="py-4 font-bold text-white">R$ {Number(order.total_price || order.total).toFixed(2)}</td>
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
                          <div className="flex justify-end gap-1.5">
                            {order.status === 'pending' && (
                              <button onClick={() => handleUpdateStatus(order.id, 'preparing')} className="bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-400 text-xs px-2.5 py-1.5 rounded-lg transition-colors font-bold">Preparar</button>
                            )}
                            {order.status === 'preparing' && (
                              <button onClick={() => handleUpdateStatus(order.id, 'shipped')} className="bg-blue-500/20 border border-blue-500/40 hover:bg-blue-500/30 text-blue-400 text-xs px-2.5 py-1.5 rounded-lg transition-colors font-bold">Enviar</button>
                            )}
                            {order.status === 'shipped' && (
                              <button onClick={() => handleUpdateStatus(order.id, 'delivered')} className="bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-400 text-xs px-2.5 py-1.5 rounded-lg transition-colors font-bold">Entregar</button>
                            )}
                            {!order.invoice_link && (
                              <button onClick={() => handleUploadInvoice(order.id)} className="bg-neutral-500/20 border border-neutral-500/40 hover:bg-neutral-500/30 text-white text-xs px-2.5 py-1.5 rounded-lg transition-colors font-bold">Anexar NF</button>
                            )}
                            {order.invoice_link && (
                              <a href={order.invoice_link} target="_blank" rel="noreferrer" className="bg-primary/20 border border-primary/40 hover:bg-primary/30 text-primary text-xs px-2.5 py-1.5 rounded-lg transition-colors font-bold flex items-center gap-1">
                                Ver NF
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Devoluções */}
        {activeTab === "devolucoes" && (
          <div className="space-y-6 relative z-10">
            {loadingReturns ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : returns.length === 0 ? (
              <div className="text-center py-20 bg-white/[0.01] rounded-3xl border border-dashed border-white/[0.05]">
                <RefreshCcw className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Nenhuma solicitação de devolução</h3>
                <p className="text-neutral-400 max-w-sm mx-auto text-sm">Excelente! Seus produtos estão satisfazendo os clientes.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {returns.map((ret) => (
                  <div key={ret.id} className="bg-[#0a0a14]/60 backdrop-blur-xl border border-white/[0.05] p-6 rounded-3xl flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
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
                        <span className="text-sm text-neutral-400 font-medium">Motivo: {ret.reason}</span>
                      </div>
                      <p className="text-sm text-neutral-200 mt-3"><strong>Nota do Cliente:</strong> {ret.customer_notes || "Nenhuma nota."}</p>
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
        )}

        {/* Tab: Promoções */}
        {activeTab === "promocoes" && (
          <div className="space-y-6 relative z-10">
            <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-500" /> Promoções Relâmpago
            </h2>
            <div className="bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8 max-w-2xl">
              <p className="text-neutral-400 mb-6">Crie gatilhos de escassez e aumente suas vendas dando destaque com limite de tempo.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-neutral-400 uppercase tracking-wider font-bold block mb-1">Selecione o Produto</label>
                  <select 
                    value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
                    className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:border-yellow-500 outline-none"
                  >
                    <option value="">-- Escolha um Produto --</option>
                    {products.map(p => (
                      <option key={p.slug} value={p.slug}>{p.name} (Preço Base: R$ {Number(p.base_price).toFixed(2)})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-neutral-400 uppercase tracking-wider font-bold block mb-1">Preço Promocional (R$)</label>
                    <input 
                      type="number" step="0.01" value={promoPrice} onChange={e => setPromoPrice(e.target.value)}
                      placeholder="Ex: 199.90" 
                      className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:border-yellow-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 uppercase tracking-wider font-bold block mb-1">Termina Em</label>
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
        )}

        {/* Tab: Configurações */}
        {activeTab === "configuracoes" && (
          <div className="space-y-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Informações Básicas */}
              <div className="bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Store className="w-5 h-5 text-blue-500" /> Perfil da Loja</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-neutral-400 uppercase tracking-wider font-bold block mb-1">Nome da Loja</label>
                    <input type="text" defaultValue={(user as any)?.seller_profile?.store_name || "Minha Loja Premium"} className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 uppercase tracking-wider font-bold block mb-1">Descrição</label>
                    <textarea defaultValue={(user as any)?.seller_profile?.description || "Especialistas em produtos de alta qualidade com entrega expressa."} className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none resize-none" rows={3}></textarea>
                  </div>
                </div>
              </div>

              {/* Premium Glassdoor */}
              <div className="bg-gradient-to-br from-[#0a0a14] to-[#E6B53C]/10 backdrop-blur-xl border border-[#E6B53C]/20 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#E6B53C]/20 rounded-full blur-[50px]"></div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#E6B53C] relative z-10"><Store className="w-5 h-5" /> Premium Glassdoor</h3>
                <p className="text-sm text-neutral-300 mb-6 relative z-10">
                  Sua loja possui uma vitrine exclusiva. Exiba seus produtos em um ambiente livre de concorrência com design premium.
                </p>
                <div className="space-y-4 relative z-10">
                  <a 
                    href={`/s/${(user as any)?.seller_profile?.slug}`} 
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#E6B53C] to-[#B38F25] text-black font-black py-3 rounded-xl hover:opacity-90 transition-opacity"
                  >
                    <Eye className="w-5 h-5" /> Acessar Minha Vitrine
                  </a>
                  <p className="text-xs text-neutral-500 text-center">Para alterar os 3 banners rotativos, entre em contato com o suporte provisoriamente.</p>
                </div>
              </div>
              {/* Recebimentos */}
              <div className="bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8 col-span-1 md:col-span-2">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-500" /> Recebimentos e Conta</h3>
                <div className="space-y-4">
                  {(user as any)?.seller_profile?.efi_account_id ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="text-emerald-500 font-bold">Conta Conectada</h4>
                          <p className="text-xs text-emerald-500/70">Você está pronto para receber pagamentos e comissões.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                      <div className="flex items-center gap-4 mb-4">
                        <AlertTriangle className="w-8 h-8 text-amber-500" />
                        <div>
                          <h4 className="text-amber-500 font-bold">Ação Necessária</h4>
                          <p className="text-xs text-amber-500/70">Sua conta ainda não está apta a receber pagamentos automáticos.</p>
                        </div>
                      </div>
                      <button 
                        onClick={async () => {
                          try {
                            toast("Redirecionando para Efí Bank...", "success");
                            const res = await sellerDashboardApi.onboard(
                              `${window.location.origin}/seller?efi_callback=success`,
                              `${window.location.origin}/seller?efi_callback=refresh`
                            );
                            window.location.href = res.data.onboarding_url;
                          } catch (err: any) {
                            console.error(err);
                            toast("Erro ao iniciar conexão com a Efí Bank.", "error");
                          }
                        }}
                        className="w-full bg-[#F37021] hover:bg-[#F37021]/90 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(243,112,33,0.3)] flex items-center justify-center gap-2"
                      >
                        <CreditCard className="w-5 h-5" /> Conectar com Efí Bank
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Logística */}
              <div className="bg-gradient-to-br from-[#0a0a14] to-primary/10 backdrop-blur-xl border border-primary/20 rounded-3xl p-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> Logística e Frete</h3>
                
                <div className="space-y-6">
                  <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-bold text-white flex items-center gap-2">
                        Habilitar Frete Grátis Automático
                      </label>
                      <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer">
                        <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow"></div>
                      </div>
                    </div>
                    <p className="text-xs text-primary-100/70 mb-3">Defina um valor mínimo para que o cliente ganhe frete grátis.</p>
                    
                    <div>
                      <label className="text-[10px] text-primary-100/50 uppercase tracking-wider font-bold block mb-1">Valor Mínimo (R$)</label>
                      <input type="number" defaultValue="299.90" className="w-full bg-[#0a0a14] border border-primary/30 rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none" />
                    </div>
                  </div>

                  <button onClick={() => toast("Regras de logística salvas com sucesso!", "success")} className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:scale-[1.02] transition-transform">
                    Salvar Regras de Logística
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
