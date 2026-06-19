"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { cartApi, ordersApi } from "@/lib/api";
import { Cart } from "@/types";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, ShieldCheck, MapPin, CreditCard, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [successOrder, setSuccessOrder] = useState<string | null>(null);

  // Form (Simulado)
  const [address, setAddress] = useState("Rua Fictícia, 123");
  const [city, setCity] = useState("São Paulo");
  const [cep, setCep] = useState("01000-000");

  useEffect(() => {
    cartApi.get()
      .then(res => {
        if (!res.data || res.data.items.length === 0) {
          router.push("/cart");
        } else {
          setCart(res.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [router]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || cart.items.length === 0) return;
    
    setProcessing(true);
    try {
      // Cria o pedido no backend (o backend lê do carrinho logado)
      const res = await ordersApi.create({});
      setSuccessOrder(res.data.order_number);
    } catch (err) {
      console.error("Erro ao finalizar compra", err);
      alert("Houve um erro ao processar sua compra.");
    } finally {
      setProcessing(false);
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

  if (successOrder) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="h-12 w-12" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">Pedido Confirmado!</h1>
          <p className="text-muted-foreground max-w-md mx-auto mb-2">
            Sua compra foi processada com sucesso. O número do seu pedido é:
          </p>
          <p className="text-xl font-mono font-bold text-primary mb-8 px-4 py-2 bg-primary/10 rounded-lg">
            {successOrder}
          </p>
          <Link 
            href="/dashboard/orders"
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95 transition-all shadow-lg"
          >
            Acompanhar Pedido
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-display font-bold mb-8">Finalizar Compra</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* FORMULÁRIO */}
          <div className="lg:col-span-2 space-y-8">
            <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6">
              
              {/* Endereço */}
              <div className="p-6 rounded-2xl border border-border/40 bg-card/40 space-y-6">
                <h3 className="font-display font-bold text-lg flex items-center gap-2 border-b border-border/40 pb-4">
                  <MapPin className="h-5 w-5 text-primary" /> Endereço de Entrega
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Rua e Número</label>
                    <input type="text" required value={address} onChange={e => setAddress(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Cidade</label>
                    <input type="text" required value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">CEP</label>
                    <input type="text" required value={cep} onChange={e => setCep(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background focus:border-primary outline-none" />
                  </div>
                </div>
              </div>

              {/* Pagamento (Simulado) */}
              <div className="p-6 rounded-2xl border border-border/40 bg-card/40 space-y-6">
                <h3 className="font-display font-bold text-lg flex items-center gap-2 border-b border-border/40 pb-4">
                  <CreditCard className="h-5 w-5 text-primary" /> Dados de Pagamento
                </h3>
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-4">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">Pagamento Seguro via Stripe Connect</p>
                    <p className="text-xs text-muted-foreground">O valor será distribuído automaticamente para os vendedores.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 opacity-50 pointer-events-none">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Número do Cartão (Simulado)</label>
                    <input type="text" value="**** **** **** 4242" readOnly className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background" />
                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* RESUMO */}
          <div className="lg:col-span-1">
            <div className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md sticky top-24 space-y-6">
              <h3 className="font-display font-bold text-xl border-b border-border/40 pb-4 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" /> Seu Pedido
              </h3>
              
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                {cart?.items.map(item => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white/5 border border-border/20 shrink-0">
                      <Image src={item.variant.product_image || "/placeholder.png"} alt={item.variant.product_name} fill className="object-cover" />
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold text-foreground line-clamp-1">{item.variant.product_name}</p>
                      <p className="text-muted-foreground text-xs">{item.quantity}x R$ {Number(item.variant.effective_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border/40 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>R$ {Number(cart?.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Frete</span>
                  <span className="text-green-500 font-semibold">Grátis</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 flex justify-between items-center">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-display font-black text-2xl text-primary">
                  R$ {Number(cart?.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-50"
              >
                {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                {processing ? "Processando..." : "Confirmar e Pagar"}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
