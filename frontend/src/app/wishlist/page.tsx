"use client";

export const dynamic = "force-dynamic";


import { useEffect, useState } from "react";
import Image from "next/image";
import { Trash2, ShoppingCart, Heart } from "lucide-react";
import { wishlistApi, cartApi } from "@/lib/api";
import { ProductModal } from "@/components/ui/ProductModal";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductSlug, setSelectedProductSlug] = useState<string>("");

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const res = await wishlistApi.get();
      setWishlist(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (id: string) => {
    await wishlistApi.remove(id);
    loadWishlist();
  };

  const handleAddToCart = async (product: any) => {
    try {
      if (product.variants && product.variants.length > 0) {
        // Pega a primeira variante ativa
        const variant = product.variants.find((v: any) => v.is_active && v.stock > 0) || product.variants[0];
        await cartApi.addItem(variant.id, 1);
        alert("Produto movido para o carrinho!");
        removeFromWishlist(product.id);
      } else {
        alert("Produto sem variantes disponíveis.");
      }
    } catch (err) {
      alert("Faça login para adicionar ao carrinho.");
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#05050a] text-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-8 flex items-center gap-3">
          <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
          Meus Favoritos
        </h1>

        {loading ? (
          <div className="animate-pulse flex gap-4">
            <div className="w-32 h-32 bg-white/5 rounded-xl"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-white/5 rounded w-3/4"></div>
              <div className="h-4 bg-white/5 rounded w-1/2"></div>
            </div>
          </div>
        ) : wishlist.length === 0 ? (
          <div className="bg-[#0a0a14] border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center">
            <Heart className="w-16 h-16 text-neutral-600 mb-4" />
            <h2 className="text-xl font-bold text-neutral-300 mb-2">Sua lista de desejos está vazia</h2>
            <p className="text-neutral-500 mb-6">Explore nosso catálogo e salve os produtos que você mais gosta.</p>
            <a href="/" className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-xl transition-all">
              Explorar Produtos
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item) => {
              const p = item;
              return (
                <div key={item.id} className="bg-[#0a0a14]/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden group hover:border-white/20 transition-all">
                  <div 
                    className="relative aspect-square bg-white/5 cursor-pointer"
                    onClick={() => {
                      setSelectedProductSlug(p.slug);
                      setIsModalOpen(true);
                    }}
                  >
                    {p.primary_image ? (
                      <Image src={p.primary_image} alt={p.name} fill className="object-contain p-4 group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600">Sem Imagem</div>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWishlist(p.id);
                      }}
                      className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-neutral-400 hover:text-rose-500 transition-colors z-10"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div 
                    className="p-5 cursor-pointer"
                    onClick={() => {
                      setSelectedProductSlug(p.slug);
                      setIsModalOpen(true);
                    }}
                  >
                    <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{p.category_name}</p>
                    <h3 className="font-bold text-lg text-white mb-2 line-clamp-1">{p.name}</h3>
                    <p className="text-xl font-display font-black text-white mb-4">
                      R$ {Number(p.base_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(p);
                      }}
                      className="w-full py-3 bg-white/5 hover:bg-primary hover:text-white text-neutral-300 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" /> Mover para Carrinho
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Modal de Produto */}
        <ProductModal 
          slug={selectedProductSlug} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </div>
    </div>
    <Footer />
  </>
  );
}
