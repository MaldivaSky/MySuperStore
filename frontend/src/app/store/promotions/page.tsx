"use client";

export const dynamic = "force-dynamic";


import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { 
  ShoppingBag, Star, Zap, Clock, Filter, X, Loader2, ArrowLeft
} from "lucide-react";
import { Header } from "@/components/Header";
import { ProductModal } from "@/components/ui/ProductModal";
import { Footer } from "@/components/Footer";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import Link from "next/link";

export default function PromotionsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [discountMin, setDiscountMin] = useState<number | null>(null);
  const [ordering, setOrdering] = useState<string>("");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchProducts(1);
  }, [selectedCategory, discountMin, ordering]);

  useEffect(() => {
    if (page > 1) {
      fetchProducts(page);
    }
  }, [page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, loadingMore]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/catalog/categories/tree/");
      setCategories(res.data);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  const fetchProducts = async (pageNum: number) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      let params = new URLSearchParams();
      params.append("flash_sale_only", "true");
      if (selectedCategory) params.append("category", selectedCategory);
      if (discountMin) params.append("discount_min", discountMin.toString());
      if (ordering) params.append("ordering", ordering);
      params.append("page", pageNum.toString());

      const res = await api.get(`/catalog/products/?${params.toString()}`);
      if (res.data.results) {
        if (pageNum === 1) {
          setProducts(res.data.results);
        } else {
          setProducts((prev) => [...prev, ...res.data.results]);
        }
        setHasMore(res.data.next !== null);
      } else {
        setProducts(res.data);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Erro ao buscar produtos em promoção:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setDiscountMin(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-white">
      <Header />

      <main className="flex-grow">
        {/* Banner de Promoções Estilo Black Friday Premium */}
        <section className="relative py-20 overflow-hidden bg-gradient-to-r from-red-950 via-[#05050a] to-yellow-950 border-b border-white/[0.05]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.15),transparent_60%)]"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
            
            <Link href="/" className="self-start mb-6 text-sm text-neutral-400 hover:text-white flex items-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Voltar para a Loja
            </Link>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 bg-yellow-500 text-black px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest mb-6 animate-pulse"
            >
              <Zap className="w-4 h-4 fill-current" /> Super Ofertas Relâmpago
            </motion.div>

            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-display font-black tracking-tight"
            >
              O Centro das <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">Promoções Relâmpago</span>
            </motion.h1>

            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-neutral-400 mt-4 max-w-2xl text-lg font-medium"
            >
              Economize até 50% ou mais com ofertas por tempo limitado. Os preços voltam ao normal assim que o cronômetro zerar!
            </motion.p>
          </div>
        </section>

        {/* Content Wrapper */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-8">
          
          {/* Sidebar / Filters */}
          <div className="md:w-72 flex-shrink-0">
            <div className="bg-[#0a0a14]/60 backdrop-blur-3xl p-7 rounded-3xl border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.4)] sticky top-24">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-display font-bold text-xl flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-xl">
                    <Filter className="w-5 h-5 text-yellow-500" />
                  </div>
                  Filtros
                </h3>
                <button 
                  onClick={clearFilters} 
                  className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 bg-white/[0.03] hover:bg-white/[0.08] px-3 py-1.5 rounded-full border border-white/[0.05]"
                >
                  <X className="w-3.5 h-3.5" /> Limpar
                </button>
              </div>

              {/* Categorias */}
              <div className="mb-8">
                <h4 className="font-semibold text-xs uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Categorias
                </h4>
                <div className="flex flex-col gap-2">
                  <button
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
                      !selectedCategory 
                        ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)] translate-x-2' 
                        : 'bg-white/[0.02] hover:bg-white/[0.06] text-neutral-300'
                    }`}
                    onClick={() => setSelectedCategory(null)}
                  >
                    <span>Todas com Desconto</span>
                  </button>
                  {categories.map((cat: any) => (
                    <button
                      key={cat.id}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
                        selectedCategory === cat.slug 
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)] translate-x-2' 
                          : 'bg-white/[0.02] hover:bg-white/[0.06] text-neutral-300'
                      }`}
                      onClick={() => setSelectedCategory(cat.slug)}
                    >
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.1] to-transparent my-8"></div>

              {/* Filtro de Intensidade de Desconto */}
              <div>
                <h4 className="font-semibold text-xs uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Porcentagem de Desconto
                </h4>
                <div className="flex flex-col gap-2">
                  {[10, 20, 50].map((disc) => (
                    <button
                      key={disc}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                        discountMin === disc 
                          ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)] translate-x-2' 
                          : 'bg-white/[0.02] hover:bg-white/[0.06] text-yellow-500'
                      }`}
                      onClick={() => setDiscountMin(discountMin === disc ? null : disc)}
                    >
                      <Zap className="w-4 h-4 fill-current" /> {disc}% OFF ou mais
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                <Zap className="text-yellow-500 h-6 w-6" />
                Listando Ofertas Ativas
              </h2>
              <div className="flex items-center gap-4">
                <select 
                  value={ordering} 
                  onChange={(e) => setOrdering(e.target.value)}
                  className="bg-secondary/40 border border-border text-sm rounded-lg px-4 py-2 outline-none focus:border-yellow-500 text-foreground font-medium appearance-none min-w-[150px] cursor-pointer"
                >
                  <option value="">Mais Relevantes</option>
                  <option value="base_price">Menor Preço</option>
                  <option value="-base_price">Maior Preço</option>
                  <option value="-avg_rating">Melhores Avaliações</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-secondary/30 rounded-2xl h-[400px]"></div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-secondary/10 rounded-2xl border border-border/50">
                <Zap className="w-12 h-12 text-yellow-500/50 mx-auto mb-4" />
                <p className="text-muted-foreground font-semibold">Nenhuma promoção relâmpago ativa com estes filtros no momento.</p>
                <button onClick={clearFilters} className="mt-4 text-yellow-500 hover:underline">Limpar filtros</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group bg-card rounded-2xl overflow-hidden transition-all cursor-pointer relative border-2 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:shadow-[0_0_25px_rgba(234,179,8,0.4)]"
                    onClick={() => handleProductClick(product)}
                  >
                    {/* Badge */}
                    <div className="absolute top-4 left-4 z-10 bg-yellow-500 text-black text-xs font-extrabold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                      <Zap className="w-3 h-3" /> RELÂMPAGO
                    </div>

                    <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-md text-yellow-500 text-xs font-black px-2.5 py-1 rounded-lg border border-yellow-500/30">
                      {product.discount_percentage}% OFF
                    </div>

                    <div className="aspect-[4/5] relative bg-secondary/30 overflow-hidden">
                      {product.primary_image ? (
                        <Image
                          src={product.primary_image}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                          Sem Imagem
                        </div>
                      )}
                      
                      {/* Countdown Overlay */}
                      {product.time_remaining_seconds > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-yellow-500/95 backdrop-blur-md text-black py-1.5 flex justify-center items-center gap-2">
                          <CountdownTimer 
                            initialSeconds={product.time_remaining_seconds} 
                            className="text-black" 
                          />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                          {product.brand?.name || product.category?.name || "Premium"}
                        </p>
                        <div className="flex items-center gap-1 text-xs font-semibold">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {product.avg_rating ? Number(product.avg_rating).toFixed(1) : "5.0"}
                        </div>
                      </div>
                      <h3 className="font-semibold text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-end justify-between mt-4">
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground line-through font-medium">
                            R$ {Number(product.base_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                          <p className="font-display font-bold text-xl text-yellow-500">
                            R$ {Number(product.promotional_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors mb-0.5">
                          <ShoppingBag className="h-4 w-4 text-primary group-hover:text-primary-foreground" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* Infinite Scroll Target */}
            {!loading && products.length > 0 && (
              <div ref={observerTarget} className="w-full h-20 flex items-center justify-center mt-8">
                {loadingMore && <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />}
                {!hasMore && <p className="text-muted-foreground text-sm font-semibold">Você chegou ao fim da lista.</p>}
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedProduct && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProduct(null);
          }}
          slug={selectedProduct.slug}
        />
      )}
      
      <Footer />
    </div>
  );
}
