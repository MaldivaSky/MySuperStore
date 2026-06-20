"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api, wishlistApi, userApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/Toast";
import { useCartStore } from "@/store/cartStore";
import { 
  ShoppingBag, Star, TrendingUp, Search, 
  ChevronRight, Heart, Filter, X, Loader2, Zap, Clock, Truck
} from "lucide-react";
import { Header } from "@/components/Header";
import { ProductModal } from "@/components/ui/ProductModal";
import { Footer } from "@/components/Footer";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { OfficialLogo } from "@/components/Brand";

// Mock para o banner rotativo principal (Hero)
const heroBanners = [
  {
    id: 1,
    title: "Apple Revolution",
    subtitle: "Descubra o novo iPhone 15 Pro Max em Titânio.",
    cta: "Comprar Apple",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=2070",
    link: "/store?brand=apple",
  },
  {
    id: 2,
    title: "Lançamentos Nike",
    subtitle: "O futuro dos sneakers chegou. Conforto e performance.",
    cta: "Explorar Air Max",
    image: "https://images.unsplash.com/photo-1552346154-21d32810baa3?auto=format&fit=crop&q=80&w=2070",
    link: "/store?brand=nike",
  },
  {
    id: 3,
    title: "Casa Inteligente",
    subtitle: "Sua cozinha mais conectada com Brastemp.",
    cta: "Ver Eletros",
    image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&q=80&w=2070",
    link: "/store?category=eletrodomesticos",
  }
];

export default function StorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#050510]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    }>
      <StorePageContent />
    </Suspense>
  );
}

function StorePageContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const { toast } = useToast();
  const { isAuthenticated } = useAuthStore();
  
  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [brand, setBrand] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [ordering, setOrdering] = useState<string>("");
  const [discountMin, setDiscountMin] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const observerTarget = useRef<HTMLDivElement>(null);

  const [activeBanner, setActiveBanner] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false); // Mobile filter toggle

  // Onboarding Survey State
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [surveyData, setSurveyData] = useState({
    is_parent: false,
    sports_fan: false,
    is_elderly: false,
    music_taste: ""
  });

  // Load product if parameter exists in url (sharing link)
  const productParam = searchParams.get("product");
  useEffect(() => {
    if (productParam) {
      setSelectedProduct({ slug: productParam });
      setIsModalOpen(true);
    }
  }, [productParam]);

  // Check onboarding survey
  useEffect(() => {
    if (isAuthenticated) {
      userApi.getSurvey()
        .then((res) => {
          const d = res.data;
          if (!d.is_parent && !d.sports_fan && !d.is_elderly && !d.music_taste) {
            setShowSurveyModal(true);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchProducts(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategory, minPrice, maxPrice, brand, rating, ordering, discountMin, search]);

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

  // Rotate banner
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
      if (selectedCategory) params.append("category", selectedCategory);
      if (minPrice) params.append("min_price", minPrice);
      if (maxPrice) params.append("max_price", maxPrice);
      if (brand) params.append("brand", brand);
      if (rating) params.append("rating", rating.toString());
      if (ordering) params.append("ordering", ordering);
      if (discountMin) params.append("discount_min", discountMin.toString());
      if (search) params.append("search", search);
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
      console.error("Erro ao buscar produtos:", error);
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
    setMinPrice("");
    setMaxPrice("");
    setBrand(null);
    setRating(null);
    setOrdering("");
    setDiscountMin(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-grow">
        {/* Ante-Página (Brand Splash) */}
        <section className="relative w-full max-w-7xl mx-auto px-6 py-20 flex flex-col items-center text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex flex-col items-center w-full">
            <OfficialLogo className="w-[300px] md:w-[480px] lg:w-[650px] h-auto drop-shadow-[0_0_60px_rgba(212,175,55,0.4)] mb-2" />
            <h2 className="font-mono text-xs md:text-lg uppercase tracking-[0.4em] text-[#E6B53C] font-black drop-shadow-[0_0_15px_rgba(230,181,60,0.6)]">
              Onde Tudo Orbita Você
            </h2>
          </motion.div>
        </section>

        {/* Hero Banner Section */}
        <section className="relative h-[60vh] min-h-[500px] w-full overflow-hidden bg-black">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeBanner}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 bg-black/40 z-10" />
              <Image
                src={heroBanners[activeBanner].image}
                alt="Banner"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
                <motion.span 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-primary font-semibold tracking-wider uppercase mb-4 text-sm md:text-base bg-black/50 px-4 py-1 rounded-full backdrop-blur-sm"
                >
                  {heroBanners[activeBanner].subtitle}
                </motion.span>
                <motion.h1 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-8 max-w-4xl"
                >
                  {heroBanners[activeBanner].title}
                </motion.h1>
                <motion.button 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold text-lg hover:bg-primary/90 transition-all hover:scale-105 shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                >
                  {heroBanners[activeBanner].cta}
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Banner Indicators */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
            {heroBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveBanner(idx)}
                className={`w-12 h-1.5 rounded-full transition-all ${
                  idx === activeBanner ? "bg-primary" : "bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </section>

        {/* Content Wrapper */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-8">
          
          {/* Sidebar / Filters (Ultra Premium Design) */}
          <div className={`md:w-72 flex-shrink-0 flex flex-col space-y-8 ${isFilterOpen ? 'block' : 'hidden md:block'}`}>
            <div className="bg-[#0a0a14]/60 backdrop-blur-3xl p-7 rounded-3xl border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.4)] sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide group">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="font-display font-bold text-xl flex items-center gap-3 text-white">
                  <div className="p-2 bg-primary/20 rounded-xl">
                    <Filter className="w-5 h-5 text-primary" />
                  </div>
                  Filtros
                </h3>
                <button 
                  onClick={() => {
                    clearFilters();
                    setBrand(null);
                    setRating(null);
                  }} 
                  className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 bg-white/[0.03] hover:bg-white/[0.08] px-3 py-1.5 rounded-full border border-white/[0.05]"
                >
                  <X className="w-3.5 h-3.5" /> Limpar
                </button>
              </div>

              {/* Categorias Ultra Premium */}
              <div className="mb-8 relative z-10">
                <h4 className="font-semibold text-xs uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary/50"></span> Categorias
                </h4>
                <div className="flex flex-col gap-2">
                  <button
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
                      !selectedCategory 
                        ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-[0_0_15px_rgba(var(--primary),0.3)] translate-x-2' 
                        : 'bg-white/[0.02] hover:bg-white/[0.06] text-neutral-300'
                    }`}
                    onClick={() => setSelectedCategory(null)}
                  >
                    <span>Todas as Categorias</span>
                  </button>
                  {categories.map((cat: any) => (
                    <button
                      key={cat.id}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
                        selectedCategory === cat.slug 
                          ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-[0_0_15px_rgba(var(--primary),0.3)] translate-x-2' 
                          : 'bg-white/[0.02] hover:bg-white/[0.06] text-neutral-300'
                      }`}
                      onClick={() => setSelectedCategory(cat.slug)}
                    >
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.1] to-transparent my-8 relative z-10"></div>

              {/* Marcas Ultra Premium */}
              <div className="mb-8 relative z-10">
                <h4 className="font-semibold text-xs uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500/50"></span> Marcas Populares
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['nike', 'apple', 'samsung', 'brastemp'].map((b) => (
                    <button
                      key={b}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 capitalize border ${
                        brand === b 
                          ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105' 
                          : 'bg-transparent border-white/[0.1] text-neutral-400 hover:text-white hover:border-white/[0.3] hover:bg-white/[0.02]'
                      }`}
                      onClick={() => setBrand(brand === b ? null : b)}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro de Promoções */}
              <div className="relative z-10 mb-8">
                <h4 className="font-semibold text-xs uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500/50"></span> Ofertas
                </h4>
                <div className="flex flex-col gap-2">
                  {[10, 20, 50].map((disc) => (
                    <button
                      key={disc}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                        discountMin === disc 
                          ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)] translate-x-2' 
                          : 'bg-white/[0.02] hover:bg-white/[0.06] text-yellow-500/80'
                      }`}
                      onClick={() => setDiscountMin(discountMin === disc ? null : disc)}
                    >
                      <Zap className="w-4 h-4" /> {disc}% OFF ou mais
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.1] to-transparent my-8 relative z-10"></div>

              {/* Filtro de Preço Ultra Premium */}
              <div className="relative z-10">
                <h4 className="font-semibold text-xs uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500/50"></span> Faixa de Preço
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium group-focus-within:text-primary transition-colors">R$</span>
                    <input 
                      type="number" 
                      placeholder="Mínimo" 
                      className="w-full bg-[#05050a] border border-white/[0.05] rounded-2xl pl-10 pr-4 py-3.5 text-sm font-semibold text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-neutral-600"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </div>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium group-focus-within:text-primary transition-colors">R$</span>
                    <input 
                      type="number" 
                      placeholder="Máximo" 
                      className="w-full bg-[#05050a] border border-white/[0.05] rounded-2xl pl-10 pr-4 py-3.5 text-sm font-semibold text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-neutral-600"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                <TrendingUp className="text-primary h-6 w-6" />
                {selectedCategory ? categories.find(c => c.slug === selectedCategory)?.name : "Tendências da Semana"}
              </h2>
              <div className="flex items-center gap-4">
                <select 
                  value={ordering} 
                  onChange={(e) => setOrdering(e.target.value)}
                  className="bg-secondary/40 border border-border text-sm rounded-lg px-4 py-2 outline-none focus:border-primary text-foreground font-medium appearance-none min-w-[150px] cursor-pointer"
                >
                  <option value="">Mais Relevantes</option>
                  <option value="base_price">Menor Preço</option>
                  <option value="-base_price">Maior Preço</option>
                  <option value="-avg_rating">Melhores Avaliações</option>
                </select>
                
                <button 
                  className="md:hidden flex items-center gap-2 text-sm font-semibold text-muted-foreground border border-border px-3 py-1.5 rounded-lg"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <Filter className="h-4 w-4" /> Filtros
                </button>
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
                <p className="text-muted-foreground font-semibold">Nenhum produto encontrado com estes filtros.</p>
                <button onClick={clearFilters} className="mt-4 text-primary hover:underline">Limpar filtros</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  const totalStock = product.variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) || 0;
                  const isLowStock = totalStock > 0 && totalStock <= 5;
                  
                  return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`group bg-card rounded-2xl overflow-hidden transition-all cursor-pointer relative ${
                      product.is_flash_sale 
                      ? 'border-2 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:shadow-[0_0_25px_rgba(234,179,8,0.4)]' 
                      : isLowStock 
                      ? 'border border-red-500/30 hover:border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                      : 'border border-border/40 hover:shadow-xl'
                    }`}
                    onClick={() => handleProductClick(product)}
                  >
                    {/* Badge */}
                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                      {product.is_flash_sale && (
                        <div className="bg-yellow-500 text-black text-xs font-extrabold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                          <Zap className="w-3 h-3" /> RELÂMPAGO
                        </div>
                      )}
                      {isLowStock && (
                        <div className="bg-red-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                          🔥 APENAS {totalStock} RESTANTES!
                        </div>
                      )}
                      {!product.is_flash_sale && !isLowStock && product.avg_rating >= 4.5 && (
                        <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                          TOP RATED
                        </div>
                      )}
                    </div>
                    
                    {/* Wishlist Button */}
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation(); // Previne abrir o modal do produto
                        try {
                          await wishlistApi.add(product);
                          toast("Produto adicionado aos favoritos!", "success");
                        } catch (err) {
                          toast("Faça login para favoritar produtos.", "error");
                        }
                      }}
                      className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Heart className="h-4 w-4" />
                    </button>

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
                      {product.is_flash_sale && product.time_remaining_seconds > 0 && (
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
                      
                      {/* Logística */}
                      <div className="flex flex-col gap-1 mb-3">
                        {product.is_free_shipping && (
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit flex items-center gap-1">
                            <Truck className="w-3 h-3" /> FRETE GRÁTIS
                          </span>
                        )}
                        <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Chega em aprox. {product.estimated_delivery_days || 5} dias
                        </span>
                      </div>

                      <div className="flex items-end justify-between mt-auto">
                        <div className="space-y-0.5">
                          {product.is_flash_sale ? (
                            <>
                              <p className="text-xs text-muted-foreground line-through font-medium">
                                R$ {Number(product.base_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </p>
                              <p className="font-display font-bold text-xl text-yellow-500">
                                R$ {Number(product.promotional_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </p>
                            </>
                          ) : (
                            <p className="font-display font-bold text-xl text-foreground">
                              R$ {Number(product.base_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors mb-0.5">
                          <ShoppingBag className="h-4 w-4 text-primary group-hover:text-primary-foreground" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  );
                })}
              </div>
            )}
            
            {/* Infinite Scroll Target */}
            {/* Loading / End of list indicator */}
            <div ref={observerTarget} className="h-20 mt-8 flex flex-col items-center justify-center gap-4">
              {loadingMore && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
              {!hasMore && products.length > 0 && (
                <div className="flex flex-col items-center gap-4">
                  <span className="text-neutral-500 font-medium">Você chegou ao fim da lista.</span>
                  <button 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="px-6 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all font-semibold"
                  >
                    Voltar ao Topo
                  </button>
                </div>
              )}
            </div>
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
      
      {/* Onboarding survey modal */}
      <AnimatePresence>
        {showSurveyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-[#0c0c1e] border border-white/[0.08] p-8 rounded-3xl shadow-2xl relative overflow-hidden text-white"
            >
              {/* Decorative glows */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <button
                onClick={() => setShowSurveyModal(false)}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-2xl font-display font-extrabold mb-2 text-white">
                Personalize sua Experiência 🌌
              </h3>
              <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
                Responda a estas perguntas rápidas para que nosso sistema de recomendação exiba ofertas perfeitas para o seu perfil.
              </p>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                  <div>
                    <label className="text-sm font-bold block">Você tem filhos / é pai ou mãe?</label>
                    <span className="text-xs text-neutral-400">Ver produtos infantis e brinquedos</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={surveyData.is_parent}
                    onChange={(e) => setSurveyData({ ...surveyData, is_parent: e.target.checked })}
                    className="w-5 h-5 accent-primary cursor-pointer bg-transparent border-white/20 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                  <div>
                    <label className="text-sm font-bold block">É fã de esportes ou atividades físicas?</label>
                    <span className="text-xs text-neutral-400">Ver tênis, vestuário e equipamentos</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={surveyData.sports_fan}
                    onChange={(e) => setSurveyData({ ...surveyData, sports_fan: e.target.checked })}
                    className="w-5 h-5 accent-primary cursor-pointer bg-transparent border-white/20 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                  <div>
                    <label className="text-sm font-bold block">Interesse em utilidades e eletrodomésticos?</label>
                    <span className="text-xs text-neutral-400">Recomendar marcas de casa inteligente</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={surveyData.is_elderly}
                    onChange={(e) => setSurveyData({ ...surveyData, is_elderly: e.target.checked })}
                    className="w-5 h-5 accent-primary cursor-pointer bg-transparent border-white/20 rounded"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold block">Qual estilo de música você mais curte?</label>
                  <select
                    value={surveyData.music_taste}
                    onChange={(e) => setSurveyData({ ...surveyData, music_taste: e.target.value })}
                    className="w-full bg-[#141428] border border-white/[0.08] text-white rounded-xl px-4 py-3 text-sm focus:border-primary outline-none cursor-pointer"
                  >
                    <option value="">Nenhum / Prefiro não responder</option>
                    <option value="Rock">Rock / Pop</option>
                    <option value="Eletronica">Eletrônica / Dance</option>
                    <option value="Sertanejo">Sertanejo / Pop Brasil</option>
                    <option value="Classica">Clássica / Jazz</option>
                  </select>
                </div>

                <button
                  onClick={async () => {
                    try {
                      await userApi.saveSurvey(surveyData);
                      toast("Preferências salvas com sucesso! Personalizando vitrine...", "success");
                      setShowSurveyModal(false);
                      fetchProducts(1);
                    } catch (err) {
                      toast("Erro ao salvar preferências.", "error");
                    }
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                >
                  Salvar Preferências e Personalizar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <Footer />
    </div>
  );
}
