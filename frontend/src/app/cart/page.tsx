"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { cartApi } from "@/lib/api";
import { Cart } from "@/types";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ShoppingCart, ArrowRight, Loader2, Minus, Plus, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadCart = async () => {
    try {
      const res = await cartApi.get();
      setCart(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQuantity = async (itemId: string, newQtd: number) => {
    if (newQtd < 1) return;
    setUpdatingId(itemId);
    try {
      await cartApi.updateItem(itemId, newQtd);
      await loadCart();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdatingId(itemId);
    try {
      await cartApi.removeItem(itemId);
      await loadCart();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-display font-bold mb-8 flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-primary" />
          Meu Carrinho
        </h1>

        {!cart || cart.items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 border border-dashed border-border/60 rounded-3xl bg-card/20 space-y-4"
          >
            <div className="w-20 h-20 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Seu carrinho está vazio</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Volte para a loja, explore as melhores ofertas e adicione produtos incríveis ao seu carrinho.
            </p>
            <Link 
              href="/store"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95 transition-all mt-4"
            >
              Explorar Loja
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LISTA DE ITENS */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col sm:flex-row gap-6 p-4 rounded-2xl border border-border/40 bg-card/40 hover:bg-card/70 transition-all items-center"
                >
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-white/5 shrink-0 border border-border/20">
                    <Image
                      src={item.variant.product_image || "/placeholder.png"}
                      alt={item.variant.product_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="flex-grow text-center sm:text-left space-y-1">
                    <h4 className="font-bold text-lg leading-tight text-foreground">
                      {item.variant.product_name}
                    </h4>
                    {item.variant.attributes.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {item.variant.attributes.map(a => a.value).join(" • ")}
                      </p>
                    )}
                    <div className="font-semibold text-primary mt-2">
                      R$ {Number(item.variant.effective_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Controles de Qtde */}
                    <div className="flex items-center rounded-xl border border-border/60 bg-background/50 overflow-hidden">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={updatingId === item.id || item.quantity <= 1}
                        className="p-2 hover:bg-secondary/40 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center font-semibold text-sm">
                        {updatingId === item.id ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={updatingId === item.id || item.quantity >= item.variant.stock}
                        className="p-2 hover:bg-secondary/40 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="text-right w-24 font-bold text-foreground">
                      R$ {Number(item.subtotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>

                    <button 
                      onClick={() => removeItem(item.id)}
                      disabled={updatingId === item.id}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                      title="Remover"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* RESUMO DO PEDIDO */}
            <div className="lg:col-span-1">
              <div className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md sticky top-24 space-y-6">
                <h3 className="font-display font-bold text-xl border-b border-border/40 pb-4">Resumo do Pedido</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({cart.item_count} itens)</span>
                    <span>R$ {Number(cart.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Frete</span>
                    <span className="text-green-500 font-semibold">Grátis</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-display font-black text-2xl text-primary">
                    R$ {Number(cart.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <button
                  onClick={() => router.push("/checkout")}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition-all shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5"
                >
                  <CreditCard className="h-5 w-5" />
                  Finalizar Compra
                </button>
                
                <Link href="/store" className="block text-center text-sm text-muted-foreground hover:text-primary transition-colors">
                  Continuar comprando
                </Link>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
