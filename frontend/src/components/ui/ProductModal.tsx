"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Star, ShoppingCart, Loader2, Info, ArrowRight, Heart, MessageSquare, Share2, Clock, Zap, MessageCircle } from "lucide-react";
import { catalogApi, cartApi, wishlistApi, reviewApi, chatApi } from "@/lib/api";
import { Product, ProductVariant } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/Toast";
import { CountdownTimer } from "./CountdownTimer";

interface ProductModalProps {
  slug: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ slug, isOpen, onClose }: ProductModalProps) {
  const [activeSlug, setActiveSlug] = useState(slug);
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuthStore();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState("");

  const [reviews, setReviews] = useState<any[]>([]);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  
  // Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRoom, setChatRoom] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatMessageInput, setChatMessageInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  
  // Q&A States
  const [questions, setQuestions] = useState<{ id: number; user: string; text: string; reply: string | null; replyBy: string | null; date: string }[]>([
    { id: 1, user: "Visitante", text: "O produto vem na caixa original lacrada?", reply: "Olá! Sim, todos os nossos produtos são 100% originais, enviados na caixa lacrada de fábrica com nota fiscal.", replyBy: "Lojista", date: "Hoje" }
  ]);
  const [questionInput, setQuestionInput] = useState("");
  
  // Image Zoom states
  const [isZooming, setIsZooming] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({});

  // Reset active slug when modal reopens
  useEffect(() => {
    if (isOpen) {
      setActiveSlug(slug);
    } else {
      setIsChatOpen(false);
    }
  }, [slug, isOpen]);

  // Poll chat messages while open
  useEffect(() => {
    if (!isChatOpen || !chatRoom) return;
    const interval = setInterval(() => {
      chatApi.listRooms()
        .then((res) => {
          const rooms = res.data.results || res.data;
          const room = rooms.find((r: any) => r.id === chatRoom.id);
          if (room) setChatMessages(room.messages);
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [isChatOpen, chatRoom]);

  useEffect(() => {
    if (!isOpen || !activeSlug) return;
    
    setLoading(true);
    setCartMessage("");
    setQuantity(1);
    setIsZooming(false);
    
    // Track product view in backend
    catalogApi.track(activeSlug, "view").catch(() => {});
    
    // Carrega o produto
    catalogApi.product(activeSlug)
      .then((res) => {
        const prod = res.data;
        setProduct(prod);
        if (prod.images && prod.images.length > 0) {
          const primary = prod.images.find((img: any) => img.is_primary) || prod.images[0];
          setSelectedImage(primary.image);
        }
        if (prod.variants && prod.variants.length > 0) {
          const activeVariant = prod.variants.find((v: any) => v.is_active && v.stock > 0) || prod.variants[0];
          setSelectedVariant(activeVariant);
        }

        // Fetch similar products in same category
        if (prod.category_slug) {
          catalogApi.products({ category: prod.category_slug, limit: 5 })
            .then((simRes) => {
              const filtered = (simRes.data.results || simRes.data).filter((item: any) => item.id !== prod.id);
              setSimilarProducts(filtered.slice(0, 4));
            })
            .catch(() => {});
        }
      })
      .catch((err) => console.error("Erro ao carregar produto:", err))
      .finally(() => setLoading(false));

    // Carrega as reviews
    reviewApi.getReviews(activeSlug)
      .then((res) => setReviews(res.data.results || res.data))
      .catch((err) => console.error("Erro ao carregar avaliações", err));

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [activeSlug, isOpen]);

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    setAddingToCart(true);
    setCartMessage("");
    try {
      await cartApi.addItem(selectedVariant.id, quantity);
      setCartMessage("Produto adicionado ao carrinho com sucesso!");
      setTimeout(() => setCartMessage(""), 3000);
    } catch (err: any) {
      console.error(err);
      setCartMessage(err.response?.data?.detail || "Faça login para adicionar ao carrinho.");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%`, transform: 'scale(2.5)' });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl h-[95vh] max-h-[900px] bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden flex flex-col md:flex-row z-10"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-background/50 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">Carregando detalhes...</p>
            </div>
          ) : !product ? (
            <div className="w-full p-10 text-center">
              <p className="text-destructive font-semibold">Produto não encontrado.</p>
            </div>
          ) : (
            <>
              {/* LEFT: Image Gallery with Zoom */}
              <div className="w-full md:w-1/2 bg-black/5 flex flex-col p-6 gap-4 border-r border-border/20 overflow-y-auto">
                <div 
                  className="relative aspect-square w-full rounded-xl overflow-hidden border border-border/30 bg-background/50 cursor-crosshair group"
                  onMouseEnter={() => setIsZooming(true)}
                  onMouseLeave={() => { setIsZooming(false); setZoomStyle({}); }}
                  onMouseMove={handleMouseMove}
                >
                  {selectedImage ? (
                    <Image
                      src={selectedImage}
                      alt={product.name}
                      fill
                      className={`object-contain transition-transform duration-200 ${isZooming ? "" : "p-4"}`}
                      style={isZooming ? zoomStyle : {}}
                      sizes="(max-w-768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Sem imagem principal
                    </div>
                  )}
                  {!isZooming && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="bg-black/80 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md">
                        <Info className="h-3.5 w-3.5" /> Passe o mouse para dar zoom
                      </span>
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {product.images && product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {product.images.map((img: any) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedImage(img.image)}
                        className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                          selectedImage === img.image ? "border-primary" : "border-transparent hover:border-primary/50"
                        }`}
                      >
                        <Image src={img.image} alt="Thumbnail" fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: Product Details & Reviews */}
              <div className="w-full md:w-1/2 flex flex-col overflow-y-auto">
                <div className="flex-grow p-6 md:p-8 space-y-6">
                  
                  {/* Header */}
                  <div className="relative pr-8">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        {product.category}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span className="text-sm font-bold">{product.avg_rating ? Number(product.avg_rating).toFixed(1) : "5.0"}</span>
                        <span className="text-xs text-muted-foreground ml-1">({product.review_count || 0})</span>
                      </div>
                    </div>
                    
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground leading-tight pr-10">
                      {product.name}
                    </h2>
                    
                    <div className="absolute top-0 right-0 flex items-center gap-2">
                      <button
                        onClick={async () => {
                          if (!isAuthenticated) {
                            toast("Faça login para conversar com o vendedor.", "error");
                            return;
                          }
                          setChatLoading(true);
                          setIsChatOpen(true);
                          try {
                            const res = await chatApi.createRoom({
                              product_id: product.id,
                              seller_id: product.seller_id
                            });
                            setChatRoom(res.data);
                            setChatMessages(res.data.messages || []);
                          } catch (err) {
                            toast("Erro ao iniciar chat com o vendedor.", "error");
                          } finally {
                            setChatLoading(false);
                          }
                        }}
                        className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Falar com o Vendedor"
                      >
                        <MessageSquare className="h-5 w-5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (!product) return;
                          try {
                            await wishlistApi.add(product);
                            toast("Produto adicionado aos favoritos com sucesso!", "success");
                          } catch (err) {
                            toast("Erro ao adicionar aos favoritos.", "error");
                          }
                        }}
                        className="p-2 rounded-full text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Adicionar aos Favoritos"
                      >
                        <Heart className="h-5 w-5" />
                      </button>
                      <button
                        onClick={async () => {
                          const url = `${window.location.origin}/store?product=${product.slug}`;
                          try {
                            if (navigator.clipboard && window.isSecureContext) {
                              await navigator.clipboard.writeText(url);
                              toast("Link do produto copiado com sucesso!", "success");
                            } else {
                              prompt("Copie o link abaixo para compartilhar:", url);
                            }
                          } catch (err) {
                            prompt("Copie o link abaixo para compartilhar:", url);
                          }
                        }}
                        className="p-2 rounded-full text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                        title="Compartilhar Produto"
                      >
                        <Share2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await wishlistApi.add(product);
                            toast("Produto adicionado aos favoritos!", "success");
                          } catch (err) {
                            toast("Faça login para favoritar produtos.", "error");
                          }
                        }}
                        className="p-2 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Adicionar aos Favoritos"
                      >
                        <Heart className="h-6 w-6" />
                      </button>
                    </div>
                  
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                      Vendido por <span className="font-semibold text-foreground underline decoration-primary/30 underline-offset-4">{product.seller_name}</span>
                    </p>
                  </div>

                  {/* Price */}
                  <div className="py-4 border-y border-border/40 space-y-3">
                    {product.is_flash_sale ? (
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold bg-yellow-500 text-black px-2.5 py-1 rounded-md flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 fill-current" /> {product.discount_percentage}% OFF
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            De: R$ {Number(product.base_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="text-sm text-yellow-500 font-bold mt-1">
                          Oferta Relâmpago
                        </div>
                        <div className="text-4xl font-display font-black text-yellow-500 mt-0.5">
                          R$ {Number(selectedVariant?.effective_price || product.promotional_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                        {product.time_remaining_seconds > 0 && (
                          <div className="mt-3">
                            <CountdownTimer 
                              initialSeconds={product.time_remaining_seconds} 
                              className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-2.5 rounded-xl w-fit" 
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="text-sm text-muted-foreground">Preço total</span>
                        <div className="text-3xl font-display font-black text-foreground">
                          R$ {Number(selectedVariant?.effective_price || product.base_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Variants Selector */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-sm font-semibold flex items-center gap-2">
                        Opções Disponíveis
                        {selectedVariant?.stock === 0 && <span className="text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">Esgotado</span>}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {product.variants.map((variant: any) => {
                          const attrs = variant.attributes.map((a: any) => a.value).join(", ");
                          const label = attrs || "Padrão";
                          const isSelected = selectedVariant?.id === variant.id;
                          const isOutOfStock = variant.stock === 0;

                          return (
                            <button
                              key={variant.id}
                              onClick={() => setSelectedVariant(variant)}
                              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                                isSelected 
                                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20" 
                                  : isOutOfStock 
                                    ? "border-border/30 bg-muted/30 text-muted-foreground opacity-60 cursor-not-allowed"
                                    : "border-border/60 hover:border-primary/50 hover:bg-secondary/20 text-foreground"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      {selectedVariant && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5" />
                          Estoque disponível: <strong className="text-foreground">{selectedVariant.stock} unidades</strong>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {product.description && (
                    <div className="space-y-4">
                      <label className="text-sm font-semibold border-b border-border/40 pb-2 flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" /> Sobre o Produto
                      </label>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {product.description}
                      </p>

                      {/* Características Técnicas Dynamicas ou Fixas */}
                      <div className="mt-4 bg-secondary/10 rounded-xl p-4 border border-border/30">
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-3 text-foreground">Características Técnicas</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          {product.variants && product.variants.length > 0 ? (
                             product.variants[0].attributes.map((attr: any, idx: number) => (
                               <div key={idx} className="flex justify-between border-b border-border/20 pb-1">
                                 <span className="text-muted-foreground">{attr.attribute_name}</span>
                                 <span className="font-medium text-foreground">{attr.value}</span>
                               </div>
                             ))
                          ) : (
                             <>
                               <div className="flex justify-between border-b border-border/20 pb-1">
                                 <span className="text-muted-foreground">Marca</span>
                                 <span className="font-medium text-foreground">{product.brand?.name || "Premium"}</span>
                               </div>
                               <div className="flex justify-between border-b border-border/20 pb-1">
                                 <span className="text-muted-foreground">Condição</span>
                                 <span className="font-medium text-foreground">Novo</span>
                               </div>
                               <div className="flex justify-between border-b border-border/20 pb-1">
                                 <span className="text-muted-foreground">Garantia</span>
                                 <span className="font-medium text-foreground">12 meses</span>
                               </div>
                             </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Perguntas e Respostas Section */}
                  <div className="pt-6 border-t border-border/40 space-y-4">
                    <h3 className="font-display font-bold text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-blue-500" /> Perguntas e Respostas
                    </h3>
                    
                    <form 
                      className="relative mb-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (questionInput.trim()) {
                          setQuestions([{
                            id: Date.now(),
                            user: "Você",
                            text: questionInput,
                            reply: null,
                            replyBy: null,
                            date: "Agora mesmo"
                          }, ...questions]);
                          setQuestionInput('');
                        }
                      }}
                    >
                      <input type="text" value={questionInput} onChange={e => setQuestionInput(e.target.value)} placeholder="Tem alguma dúvida sobre este produto?" className="w-full bg-background border border-border/50 rounded-xl pl-4 pr-[100px] py-3 text-sm focus:border-blue-500 outline-none" />
                      <button type="submit" disabled={!questionInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 font-bold text-sm bg-blue-500/10 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 disabled:opacity-50">Perguntar</button>
                    </form>

                    <div className="space-y-4">
                      {questions.map((q) => (
                        <div key={q.id} className="bg-card/30 p-4 rounded-xl border border-border/30">
                          <div className="flex gap-2">
                            <span className="font-bold text-blue-500">P:</span>
                            <div>
                              <p className="text-sm text-foreground font-medium">{q.text}</p>
                              <span className="text-[10px] text-muted-foreground">{q.user} • {q.date}</span>
                            </div>
                          </div>
                          {q.reply ? (
                            <div className="flex gap-2 pl-6 mt-3 border-t border-border/10 pt-3">
                              <span className="font-bold text-neutral-500">R:</span>
                              <div>
                                <p className="text-sm text-muted-foreground">{q.reply}</p>
                                <span className="text-[10px] text-muted-foreground font-semibold mt-1 inline-block">— {product?.seller_name || q.replyBy}</span>
                              </div>
                            </div>
                          ) : (
                             <div className="pl-6 mt-2 text-xs text-amber-500/80 italic flex items-center gap-1.5 font-medium">
                               <Clock className="w-3.5 h-3.5" /> Aguardando resposta do vendedor...
                             </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reviews Section */}
                  <div className="pt-6 border-t border-border/40 space-y-4">
                    <h3 className="font-display font-bold text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" /> Avaliações dos Clientes
                    </h3>
                    
                    {reviews.length === 0 ? (
                      <p className="text-sm text-muted-foreground bg-card/50 p-4 rounded-xl border border-dashed border-border/50 text-center">
                        Este produto ainda não possui avaliações. Seja o primeiro a avaliar após comprar!
                      </p>
                    ) : (
                      <div className="space-y-4 max-h-80 overflow-y-auto pr-2 scrollbar-hide">
                        {reviews.map((rev) => (
                          <div key={rev.id} className="p-4 rounded-xl bg-secondary/10 border border-border/30">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1">
                                {[1,2,3,4,5].map(star => (
                                  <Star key={star} className={`h-3 w-3 ${star <= rev.rating ? "fill-amber-500 text-amber-500" : "text-border"}`} />
                                ))}
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(rev.created_at).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                            <p className="font-semibold text-sm">{rev.subject}</p>
                            <p className="text-xs text-muted-foreground mt-1">{rev.body}</p>
                            <p className="text-[10px] text-muted-foreground mt-3 font-semibold">— {rev.user_name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Produtos Relacionados (AOV Engine UI Mock) */}
                <div className="p-6 md:p-8 border-t border-border/40 bg-secondary/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-lg flex items-center gap-2">
                      <Star className="w-5 h-5 text-primary" /> Produtos Similares
                    </h3>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                    {similarProducts.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic p-4 bg-white/[0.01] rounded-xl border border-white/[0.04] w-full text-center">Nenhum produto similar encontrado.</p>
                    ) : similarProducts.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => {
                          catalogApi.track(item.slug, "click").catch(() => {});
                          setActiveSlug(item.slug);
                        }}
                        className="shrink-0 w-[200px] snap-start bg-card border border-border/50 rounded-xl p-3 hover:border-primary/50 cursor-pointer transition-all hover:scale-[1.02] group"
                      >
                        <div className="aspect-square bg-secondary/30 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                          {item.primary_image ? (
                            <Image src={item.primary_image} alt={item.name} fill className="object-cover opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all" />
                          ) : (
                            <span className="text-xs text-muted-foreground">Sem Imagem</span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{item.name}</p>
                        <p className="text-xs text-primary font-bold mt-1">R$ {Number(item.base_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action (Sticky) */}
                <div className="p-6 md:p-8 border-t border-border/40 bg-card/95 backdrop-blur-md sticky bottom-0 z-20">
                  {cartMessage && (
                    <div className={`mb-4 p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                      cartMessage.includes("sucesso") ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"
                    }`}>
                      <Info className="h-4 w-4" /> {cartMessage}
                    </div>
                  )}

                  <div className="flex gap-4 items-end">
                    <div className="w-24 space-y-1.5 shrink-0">
                      <label className="text-xs font-semibold text-muted-foreground">Quantidade</label>
                      <select 
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        disabled={!selectedVariant || selectedVariant.stock === 0}
                        className="w-full h-12 px-3 rounded-xl border border-border/60 bg-background/50 text-foreground focus:border-primary outline-none"
                      >
                        {[...Array(Math.min(10, selectedVariant?.stock || 1))].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      disabled={addingToCart || !selectedVariant || selectedVariant.stock === 0}
                      className="flex-grow h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 font-bold transition-all shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:hover:shadow-none"
                    >
                      {addingToCart ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <ShoppingCart className="h-5 w-5" />
                      )}
                      {selectedVariant?.stock === 0 ? "Esgotado" : addingToCart ? "Adicionando..." : "Adicionar ao Carrinho"}
                    </button>
                  </div>
                </div>

              </div>
            </>
          )}
        </motion.div>
      </div>
      {/* Floating Chat Drawer */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100, y: 50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 100, y: 50 }}
            className="fixed bottom-24 right-6 z-[200] w-96 h-[480px] bg-[#0c0c1e] border border-white/[0.08] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/[0.08] bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">Falar com o Vendedor</h4>
                <p className="text-xs text-neutral-400 truncate max-w-[200px]">
                  Loja: {product?.seller_name}
                </p>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col">
              {chatLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-xs text-neutral-400">Iniciando conversa...</span>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center p-4">
                  <p className="text-xs text-neutral-500 italic">Nenhuma mensagem ainda. Envie uma mensagem para iniciar!</p>
                </div>
              ) : (
                chatMessages.map((msg: any) => {
                  const isMe = msg.sender_email === user?.email;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
                    >
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-white/[0.04] text-white rounded-tl-none border border-white/[0.04]"
                        }`}
                      >
                        {msg.message}
                      </div>
                      <span className="text-[9px] text-neutral-500 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input area */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!chatMessageInput.trim() || !chatRoom) return;
                const txt = chatMessageInput.trim();
                setChatMessageInput("");
                try {
                  const res = await chatApi.sendMessage(chatRoom.id, txt);
                  setChatMessages((prev) => [...prev, res.data]);
                } catch {
                  toast("Erro ao enviar mensagem.", "error");
                }
              }}
              className="p-3 border-t border-white/[0.08] bg-[#070714] flex gap-2"
            >
              <input
                type="text"
                placeholder="Digite sua mensagem..."
                value={chatMessageInput}
                onChange={(e) => setChatMessageInput(e.target.value)}
                disabled={chatLoading}
                className="flex-grow bg-white/[0.03] border border-white/[0.08] focus:border-primary/50 text-white rounded-xl px-3 py-2 text-xs outline-none"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatMessageInput.trim()}
                className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-3 py-2 rounded-xl text-xs transition-all disabled:opacity-50"
              >
                Enviar
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
