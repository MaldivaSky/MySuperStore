"use client";

export const dynamic = "force-dynamic";


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
import { WelcomeModal } from "@/components/ui/WelcomeModal";

// Mock para o banner rotativo principal (Hero)
const heroBanners = [
  {
    id: 1,
    title: "Apple Revolution",
    subtitle: "Descubra o novo iPhone 15 Pro Max em Titânio.",
    coupon: "",
    cta: "Comprar Apple",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=2070",
    link: "/",
  },
  {
    id: 2,
    title: "Lançamentos Nike",
    subtitle: "A vitrine exclusiva da marca. Conforto e performance.",
    coupon: "",
    cta: "Explorar Loja Oficial",
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=2070",
    link: "/s/nike",
  },
  {
    id: 3,
    title: "Especial Copa do Mundo",
    subtitle: "Preparado para a emoção? Ganhe 10% OFF em toda a loja!",
    coupon: "HEXA",
    cta: "Ver Ofertas",
    image: "/world_cup_banner.png",
    link: "/",
  },
  {
    id: 4,
    title: "Primeira Compra",
    subtitle: "Ganhe 30% OFF na sua primeira compra (*compras acima de R$100)",
    coupon: "PRIMEIRACOMPRA",
    cta: "Aproveitar Agora",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2070",
    link: "/",
  }
];

export default function StorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#050510]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    }>
      <WelcomeModal />
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
  const router = useRouter();
  
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Lista de marcas destaque — edite aqui para promover marcas no marketplace
  const FEATURED_BRAND_NAMES = [
    "Apple", "Samsung", "Sony", "LG", "Motorola",
    "Xiaomi", "Dell", "HP", "Asus", "Nike",
    "Adidas", "Puma", "Lacoste", "Calvin Klein", "Rolex",
    "Casio", "Fossil", "L'Oreal", "Brastemp", "Electrolux",
  ];
  const [featuredBrands, setFeaturedBrands] = useState<{ id: string; name: string; slug: string }[]>([]);

  // Onboarding Survey State
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [surveyData, setSurveyData] = useState({
    date_of_birth: "",
    preferred_category: "",
    education_level: "",
    marital_status: "",
    gender: "",
    preferred_brand: "",
    profession: "",
    primary_intent: ""
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
          if (!d.preferred_category && !d.profession && !d.date_of_birth) {
            setShowSurveyModal(true);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCategories();
    fetchFeaturedBrands();
  }, []);

  const fetchFeaturedBrands = async () => {
    try {
      const res = await api.get("/catalog/brands/?limit=200");
      const allBrands: { id: string; name: string; slug: string }[] = res.data?.results ?? res.data;
      const normalizedList = FEATURED_BRAND_NAMES.map((n) => n.toLowerCase());
      const matched = allBrands.filter((b) =>
        normalizedList.includes(b.name.toLowerCase())
      );
      setFeaturedBrands(matched);
    } catch {
      // silencia — seção some se API falhar
    }
  };

  useEffect(() => {
    if (search) {
      try {
        const stored = JSON.parse(localStorage.getItem('recent_searches') || '[]');
        if (!stored.includes(search)) {
          const updated = [search, ...stored].slice(0, 5); // Max 5 recent searches
          localStorage.setItem('recent_searches', JSON.stringify(updated));
        }
      } catch (e) {}
    }

    setPage(1);
    setHasMore(true);
    fetchProducts(1);
    
    // Scroll smoothly to the top of the store content, not the page header
    setTimeout(() => {
      const storeContent = document.getElementById('store-content');
      if (storeContent) {
        const yOffset = -100; // Account for sticky header
        const y = storeContent.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
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
    }, 6000);
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
      if (discountMin) {
        params.append("discount_min", discountMin.toString());
        params.append("flash_sale_only", "true");
      }
      if (search) {
        params.append("search", search);
      } else if (!selectedCategory && !brand) {
        // Enviar histórico apenas se não houver busca/filtro forte ativo
        try {
          const recentSearches = JSON.parse(localStorage.getItem('recent_searches') || '[]').join(',');
          const recentCategories = JSON.parse(localStorage.getItem('recent_categories') || '[]').join(',');
          if (recentSearches) params.append("recent_searches", recentSearches);
          if (recentCategories) params.append("recent_categories", recentCategories);
        } catch (e) {}
      }
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
    if (product.category_name) {
      try {
        const stored = JSON.parse(localStorage.getItem('recent_categories') || '[]');
        if (!stored.includes(product.category_name)) {
          const updated = [product.category_name, ...stored].slice(0, 5); // Max 5 recent categories
          localStorage.setItem('recent_categories', JSON.stringify(updated));
        }
      } catch (e) {}
    }
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
                <motion.h1 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-4 max-w-4xl drop-shadow-lg"
                >
                  {heroBanners[activeBanner].title}
                </motion.h1>
                <motion.span 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white text-lg md:text-2xl font-medium mb-6 max-w-2xl drop-shadow-md"
                >
                  {heroBanners[activeBanner].subtitle}
                </motion.span>

                {heroBanners[activeBanner].coupon && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="mb-8 flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/30 px-6 py-3 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                  >
                    <span className="text-white/80 font-medium text-sm">Use o cupom:</span>
                    <span className="bg-primary text-primary-foreground font-black text-xl px-4 py-1.5 rounded-xl border-2 border-dashed border-primary-foreground/30 uppercase tracking-widest">
                      {heroBanners[activeBanner].coupon}
                    </span>
                  </motion.div>
                )}

                <motion.button 
                  onClick={() => router.push(heroBanners[activeBanner].link)}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold text-lg hover:bg-primary/90 transition-all hover:scale-105 shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                >
                  {heroBanners[activeBanner].cta}
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Banner Indicators */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-4">
            {heroBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveBanner(idx)}
                className="relative overflow-hidden w-16 h-2 rounded-full bg-white/30 hover:bg-white/50 transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]"
              >
                {idx === activeBanner && (
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 6, ease: "linear" }}
                    className="absolute top-0 left-0 h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]"
                  />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Content Wrapper */}
        <div id="store-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-8">
          
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

              {/* Marcas em destaque — só renderiza se houver marcas cadastradas */}
              {featuredBrands.length > 0 && (
                <div className="mb-8 relative z-10">
                  <h4 className="font-semibold text-xs uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500/50"></span> Marcas em Destaque
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {featuredBrands.map((b) => (
                      <button
                        key={b.id}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border ${
                          brand === b.slug
                            ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105"
                            : "bg-transparent border-white/[0.1] text-neutral-400 hover:text-white hover:border-white/[0.3] hover:bg-white/[0.02]"
                        }`}
                        onClick={() => setBrand(brand === b.slug ? null : b.slug)}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filtro de Promoções */}
              <div className="relative z-10 mb-8">
                <h4 className="font-semibold text-xs uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500/50"></span> Ofertas
                </h4>
                <div className="flex flex-col gap-2">
                  {[10, 20, 30].map((disc) => (
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
                        <img
                          src={product.primary_image}
                          alt={product.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-muted-foreground line-through font-medium">
                                  R$ {Number(product.base_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </p>
                                <span className="text-[10px] font-black text-black bg-yellow-400 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                  <Zap className="w-2.5 h-2.5 fill-current" />
                                  -{product.discount_percentage}%
                                </span>
                              </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold block">Data de Nascimento</label>
                    <input
                      type="date"
                      value={surveyData.date_of_birth}
                      onChange={(e) => setSurveyData({ ...surveyData, date_of_birth: e.target.value })}
                      className="w-full bg-white/[0.02] border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:bg-white/[0.05] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-bold block">Gênero</label>
                    <select
                      value={surveyData.gender}
                      onChange={(e) => setSurveyData({ ...surveyData, gender: e.target.value })}
                      className="w-full bg-[#141428] border border-white/[0.08] text-white rounded-xl px-4 py-3 text-sm focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Selecione...</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                      <option value="O">Outro</option>
                      <option value="N">Prefiro não informar</option>
                    </select>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-bold block text-primary">Qual o seu objetivo principal aqui?</label>
                    <select
                      value={surveyData.primary_intent}
                      onChange={(e) => setSurveyData({ ...surveyData, primary_intent: e.target.value })}
                      className="w-full bg-[#141428] border border-primary/40 text-white rounded-xl px-4 py-3 text-sm focus:border-primary outline-none cursor-pointer shadow-[0_0_15px_rgba(230,181,60,0.1)]"
                    >
                      <option value="">Selecione seu objetivo...</option>
                      <option value="comprar">Apenas Comprar</option>
                      <option value="vender">Apenas Vender (Criar Loja)</option>
                      <option value="ambos">Comprar e Vender</option>
                    </select>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-bold block">Qual categoria de produtos você mais compra?</label>
                    <select
                      value={surveyData.preferred_category}
                      onChange={(e) => setSurveyData({ ...surveyData, preferred_category: e.target.value })}
                      className="w-full bg-[#141428] border border-white/[0.08] text-white rounded-xl px-4 py-3 text-sm focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Nenhuma preferência...</option>
                      {categories.map((c) => (
                        <option key={c.slug} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-bold block">Estado Civil</label>
                    <select
                      value={surveyData.marital_status}
                      onChange={(e) => setSurveyData({ ...surveyData, marital_status: e.target.value })}
                      className="w-full bg-[#141428] border border-white/[0.08] text-white rounded-xl px-4 py-3 text-sm focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Selecione...</option>
                      <option value="Solteiro">Solteiro(a)</option>
                      <option value="Casado">Casado(a)</option>
                      <option value="Divorciado">Divorciado(a)</option>
                      <option value="Viuvo">Viúvo(a)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-bold block">Escolaridade</label>
                    <select
                      value={surveyData.education_level}
                      onChange={(e) => setSurveyData({ ...surveyData, education_level: e.target.value })}
                      className="w-full bg-[#141428] border border-white/[0.08] text-white rounded-xl px-4 py-3 text-sm focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Selecione...</option>
                      <option value="Medio">Ensino Médio</option>
                      <option value="Superior">Ensino Superior</option>
                      <option value="Pos">Pós-Graduação</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-bold block">Sua Profissão</label>
                    <input
                      type="text"
                      placeholder="Ex: Engenheiro, Professor"
                      value={surveyData.profession}
                      onChange={(e) => setSurveyData({ ...surveyData, profession: e.target.value })}
                      className="w-full bg-white/[0.02] border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:bg-white/[0.05] outline-none transition-all placeholder:text-neutral-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-bold block">Marca Favorita</label>
                    <input
                      type="text"
                      placeholder="Ex: Apple, Samsung, Nike"
                      value={surveyData.preferred_brand}
                      onChange={(e) => setSurveyData({ ...surveyData, preferred_brand: e.target.value })}
                      className="w-full bg-white/[0.02] border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:bg-white/[0.05] outline-none transition-all placeholder:text-neutral-600"
                    />
                  </div>
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
