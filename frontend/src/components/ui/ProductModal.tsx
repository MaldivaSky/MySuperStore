"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Star, ShoppingCart, Loader2, Info, ArrowRight, Heart, MessageSquare, Share2, Clock } from "lucide-react";
import { catalogApi, cartApi, wishlistApi, reviewApi } from "@/lib/api";
import { Product, ProductVariant } from "@/types";

interface ProductModalProps {
  slug: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ slug, isOpen, onClose }: ProductModalProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState("");

  const [reviews, setReviews] = useState<any[]>([]);
  
  // Q&A States
  const [questions, setQuestions] = useState<{ id: number; user: string; text: string; reply: string | null; replyBy: string | null; date: string }[]>([
    { id: 1, user: "Visitante", text: "O produto vem na caixa original lacrada?", reply: "Olá! Sim, todos os nossos produtos são 100% originais, enviados na caixa lacrada de fábrica com nota fiscal.", replyBy: "Lojista", date: "Hoje" }
  ]);
  const [questionInput, setQuestionInput] = useState("");
  
  // Image Zoom states
  const [isZooming, setIsZooming] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({});

  useEffect(() => {
    if (!isOpen || !slug) return;
    
    setLoading(true);
    setCartMessage("");
    setQuantity(1);
    setIsZooming(false);
    
    // Carrega o produto
    catalogApi.product(slug)
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
      })
      .catch((err) => console.error("Erro ao carregar produto:", err))
      .finally(() => setLoading(false));

    // Carrega as reviews
    reviewApi.getReviews(slug)
      .then((res) => setReviews(res.data.results || res.data))
      .catch((err) => console.error("Erro ao carregar avaliações", err));

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [slug, isOpen]);

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
                    {product.images.map((img) => (
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
                          const url = `${window.location.origin}/store?product=${product.id}`;
                          try {
                            if (navigator.clipboard && window.isSecureContext) {
                              await navigator.clipboard.writeText(url);
                              alert("Link do produto copiado para a área de transferência!");
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
                            alert("Produto adicionado aos favoritos!");
                          } catch (err) {
                            alert("Faça login para favoritar produtos.");
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
                  <div className="py-4 border-y border-border/40">
                    <span className="text-sm text-muted-foreground">Preço total</span>
                    <div className="text-3xl font-display font-black text-foreground">
                      R$ {Number(selectedVariant?.effective_price || product.base_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Variants Selector */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-sm font-semibold flex items-center gap-2">
                        Opções Disponíveis
                        {selectedVariant?.stock === 0 && <span className="text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">Esgotado</span>}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {product.variants.map((variant) => {
                          const attrs = variant.attributes.map(a => a.value).join(", ");
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
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="shrink-0 w-[200px] snap-start bg-card border border-border/50 rounded-xl p-3 hover:border-primary/50 cursor-pointer transition-colors group">
                        <div className="aspect-square bg-secondary/30 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                          {product.primary_image ? (
                            <Image src={product.primary_image} alt="Similar" fill className="object-cover opacity-60 group-hover:scale-110 group-hover:opacity-100 transition-all" />
                          ) : (
                            <span className="text-xs text-muted-foreground">Similar {item}</span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground truncate">Capa Premium Compatível</p>
                        <p className="text-xs text-primary font-bold mt-1">R$ {(Number(product.base_price) * 0.1).toFixed(2)}</p>
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
    </AnimatePresence>
  );
}
