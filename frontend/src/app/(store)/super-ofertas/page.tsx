"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { catalogApi } from "@/lib/api";
import { Product } from "@/types";
import { motion } from "framer-motion";
import { Zap, Heart, TrendingUp, Filter, Loader2, ArrowLeft } from "lucide-react";
import Image from "next/image";

export default function SuperOfertasPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca produtos com desconto >= 10%
    catalogApi.products({ discount_min: 10, ordering: "relevance" })
      .then((res) => setProducts(res.data.results || res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleProductClick = (product: Product) => {
    router.push(`/product/${product.slug}`);
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Topo da Central de Ofertas */}
        <div className="flex flex-col md:flex-row gap-8 items-center bg-gradient-to-r from-red-600/20 to-rose-900/20 border border-red-500/30 p-8 rounded-3xl mb-12 shadow-[0_0_40px_rgba(239,68,68,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/20 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="flex-1 space-y-4 relative z-10 text-center md:text-left">
            <button 
              onClick={() => router.back()}
              className="text-red-400 hover:text-red-300 font-semibold text-sm flex items-center gap-2 mb-2 mx-auto md:mx-0"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-white flex items-center justify-center md:justify-start gap-4">
              <Zap className="text-yellow-400 w-10 h-10 md:w-12 md:h-12 animate-pulse" />
              SUPER OFERTAS
            </h1>
            <p className="text-lg text-neutral-300 max-w-xl">
              Descontos a partir de 10% nos melhores produtos do marketplace. Garanta as ofertas antes que o estoque acabe!
            </p>
          </div>
        </div>

        {/* Grid de Produtos */}
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="text-red-500 w-5 h-5" /> 
            Em Destaque Agora
          </h2>
          <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30">
            {products.length} Ofertas Ativas
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse bg-secondary/30 rounded-2xl h-[300px]"></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-white/5">
            <Zap className="w-16 h-16 text-neutral-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">Sem ofertas no momento</h3>
            <p className="text-neutral-400">Volte mais tarde para conferir as novidades e descontos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-card rounded-2xl overflow-hidden transition-all cursor-pointer relative border border-border/40 hover:shadow-xl hover:border-red-500/50 hover:shadow-red-500/20"
                onClick={() => handleProductClick(product)}
              >
                {/* Badge SUPER OFERTA / IMPULSIONADO */}
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 flex flex-col gap-1">
                  {product.is_boosted && (
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] sm:text-xs font-extrabold px-2 sm:px-3 py-1 rounded-full shadow-lg shadow-purple-500/30 flex items-center gap-1 uppercase tracking-wider border border-white/20 animate-pulse">
                      🚀 PATROCINADO
                    </div>
                  )}
                  <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] sm:text-xs font-extrabold px-2 sm:px-3 py-1 rounded-full shadow-lg shadow-red-500/30 flex items-center gap-1 border border-white/20 uppercase">
                    <Zap className="w-3 h-3 text-yellow-300" /> {product.discount_percentage}% OFF
                  </div>
                </div>

                <div className="aspect-[4/5] relative bg-secondary/30 overflow-hidden">
                  {product.primary_image ? (
                    <img src={product.primary_image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sem imagem</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="p-3 sm:p-5 relative z-20">
                  <p className="text-[10px] sm:text-xs font-semibold text-neutral-500 mb-1 uppercase tracking-wider">{product.brand?.name || "Premium"}</p>
                  <h3 className="text-sm sm:text-base font-bold text-foreground line-clamp-2 leading-snug mb-2 group-hover:text-red-400 transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-neutral-500 line-through font-medium">
                      R$ {Number(product.base_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-lg sm:text-2xl font-black text-red-500">
                      R$ {Number(product.promotional_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
