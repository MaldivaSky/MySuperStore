"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { cartApi, ordersApi, paymentsApi, PaymentMethodChoice, userApi } from "@/lib/api";
import { getStripe } from "@/lib/stripe";
import { Cart } from "@/types";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, CheckCircle2, ShieldCheck, MapPin, CreditCard, ShoppingBag,
  QrCode, Copy, Check, Banknote, Lock, FileText, Gift
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type Method = PaymentMethodChoice;

const brl = (v: number | string) =>
  Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

export default function CheckoutPage() {
  return (
    <Elements stripe={getStripe()}>
      <CheckoutInner />
    </Elements>
  );
}

function CheckoutInner() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [successOrder, setSuccessOrder] = useState<string | null>(null);

  const [method, setMethod] = useState<Method>("credit_card");

  // PIX state
  const [pix, setPix] = useState<{ paymentId: string; copia: string; qr: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [awaitingPix, setAwaitingPix] = useState(false);

  // Address
  const [addr, setAddr] = useState({
    address_recipient: "", address_cep: "", address_logradouro: "", address_numero: "",
    address_complemento: "", address_bairro: "", address_cidade: "", address_uf: "",
  });
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [userAddresses, setUserAddresses] = useState<any[]>([]);

  const [couponCode, setCouponCode] = useState("");
  const [maxInstallments, setMaxInstallments] = useState(1);
  const [selectedInstallments, setSelectedInstallments] = useState(1);

  useEffect(() => {
    async function loadData() {
      try {
        const cartRes = await cartApi.get();
        if (!cartRes.data || cartRes.data.items.length === 0) {
          router.push("/cart");
          return;
        }
        setCart(cartRes.data);

        // Compute max installments: min of all sellers' max_installments
        let maxAllowed = 12;
        cartRes.data.items.forEach((item: any) => {
          const sellerMax = item.variant.seller_max_installments || 12;
          if (sellerMax < maxAllowed) maxAllowed = sellerMax;
        });
        setMaxInstallments(maxAllowed);

        // Load addresses
        try {
          const addrRes = await userApi.getAddresses();
          if (addrRes.data && addrRes.data.length > 0) {
            setUserAddresses(addrRes.data);
            const defaultAddr = addrRes.data.find((a: any) => a.is_default) || addrRes.data[0];
            setAddr({
              address_recipient: defaultAddr.recipient_name || "Você",
              address_cep: defaultAddr.cep,
              address_logradouro: defaultAddr.street,
              address_numero: defaultAddr.number,
              address_complemento: defaultAddr.complement || "",
              address_bairro: defaultAddr.neighborhood,
              address_cidade: defaultAddr.city,
              address_uf: defaultAddr.state,
            });
            setUseCustomAddress(false);
          } else {
            setUseCustomAddress(true);
          }
        } catch (e) {
          setUseCustomAddress(true);
        }

      } catch (err) {
        router.push("/cart");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const onAddr = (k: keyof typeof addr) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddr((a) => ({ ...a, [k]: e.target.value }));

  async function createOrderAndIntent(): Promise<{ paymentId: string; clientSecret?: string; pixData?: any } | null> {
    const payload = { ...addr };
    if (couponCode.trim()) {
      (payload as any).coupon_code = couponCode.trim();
    }
    const orderRes = await ordersApi.create(payload);
    const order = orderRes.data;
    setSuccessOrder(null);

    const payRes = await paymentsApi.createIntent(order.id, method);
    const payment = payRes.data;
    return {
      paymentId: payment.id,
      clientSecret: payment.client_secret,
      pixData: method === "pix" ? { copia: payment.pix_qr_code, qr: payment.pix_qr_code_base64 } : undefined,
    };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart) return;
    setError("");
    setProcessing(true);

    try {
      const res = await createOrderAndIntent();
      if (!res) throw new Error("Falha ao iniciar pagamento.");

      if (method === "pix") {
        setPix({ paymentId: res.paymentId, copia: res.pixData.copia, qr: res.pixData.qr });
        setAwaitingPix(true);
        return;
      }

      if (!stripe || !elements) throw new Error("Stripe não carregado.");
      const card = elements.getElement(CardElement);
      if (!card) throw new Error("Formulário de cartão indisponível.");

      // For credit cards, if the user selected multiple installments, we could theoretically pass it
      // if Stripe elements automatically collects it, but in custom elements we let the backend handle the enablement.
      const confirmParams: any = {
        payment_method: { card },
      };

      const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(res.clientSecret!, confirmParams);
      if (stripeErr) throw new Error(stripeErr.message || "Pagamento recusado.");

      if (paymentIntent?.status === "succeeded") {
        const confirmed = await paymentsApi.confirm(res.paymentId);
        setSuccessOrder(confirmed.data.order?.toString() ?? "OK");
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Erro ao processar pagamento.");
    } finally {
      setProcessing(false);
    }
  };

  const handleSimulatePix = async () => {
    if (!pix) return;
    setProcessing(true);
    setError("");
    try {
      await paymentsApi.simulatePix(pix.paymentId);
      setSuccessOrder("PIX-OK");
      setAwaitingPix(false);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Erro ao confirmar PIX.");
    } finally {
      setProcessing(false);
    }
  };

  const copyPix = () => {
    if (!pix) return;
    navigator.clipboard.writeText(pix.copia);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  // ── Success ───────────────────────────────────────────────────────────────
  if (successOrder) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-12 w-12" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold mb-4">Pagamento Confirmado!</h1>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Recebemos seu pagamento e seu pedido já está sendo preparado pelos vendedores.
          </p>
          <Link href="/dashboard/orders"
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95 transition-all shadow-lg">
            Acompanhar Pedido
          </Link>
        </main>
      </div>
    );
  }

  // ── Awaiting PIX ──────────────────────────────────────────────────────────
  if (awaitingPix && pix) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto w-full">
          <QrCode className="h-10 w-10 text-primary mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Pague com PIX</h1>
          <p className="text-muted-foreground mb-6">Escaneie o QR Code no app do seu banco ou use o Copia e Cola para finalizar.</p>

          <div className="bg-white p-4 rounded-3xl shadow-2xl mb-6 border border-border/20">
            <img src={`data:image/png;base64,${pix.qr}`} alt="QR Code PIX" className="w-56 h-56" />
          </div>

          <button onClick={copyPix}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-border/60 bg-card/40 hover:bg-card/70 transition-all mb-4 font-mono text-xs break-all shadow-inner">
            {copied ? <Check className="h-4 w-4 text-green-500 shrink-0" /> : <Copy className="h-4 w-4 shrink-0" />}
            <span className="truncate">{copied ? "Copiado!" : pix.copia}</span>
          </button>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <button onClick={handleSimulatePix} disabled={processing}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)] disabled:opacity-50">
            {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
            Já paguei (simular confirmação)
          </button>
        </main>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────
  const methods: { id: Method; label: string; icon: any; hint: string }[] = [
    { id: "credit_card", label: "Crédito", icon: CreditCard, hint: `Até ${maxInstallments}x` },
    { id: "pix", label: "PIX", icon: QrCode, hint: "Aprovação imediata" },
    { id: "debit_card", label: "Débito", icon: Banknote, hint: "À vista" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-10">
          <Lock className="w-6 h-6 text-green-500" />
          <h1 className="text-3xl font-display font-bold">Checkout Seguro</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-10">
            
            {/* Delivery Address */}
            <section className="p-8 rounded-3xl border border-border/40 bg-card/40 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-xl flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-primary" /> Endereço de Entrega
                </h3>
                {userAddresses.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => setUseCustomAddress(!useCustomAddress)}
                    className="text-sm text-primary hover:underline"
                  >
                    {useCustomAddress ? "Usar endereço cadastrado" : "Usar outro endereço"}
                  </button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {!useCustomAddress ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-start gap-4">
                    <MapPin className="w-5 h-5 text-neutral-400 mt-1" />
                    <div>
                      <p className="font-bold text-lg">{addr.address_recipient}</p>
                      <p className="text-muted-foreground">{addr.address_logradouro}, {addr.address_numero}</p>
                      {addr.address_complemento && <p className="text-muted-foreground">{addr.address_complemento}</p>}
                      <p className="text-muted-foreground">{addr.address_bairro} — {addr.address_cidade}/{addr.address_uf}</p>
                      <p className="text-muted-foreground mt-1">CEP: {addr.address_cep}</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-6 gap-5">
                    <Field className="md:col-span-4" label="Destinatário" value={addr.address_recipient} onChange={onAddr("address_recipient")} required />
                    <Field className="md:col-span-2" label="CEP" value={addr.address_cep} onChange={onAddr("address_cep")} required maxLength={8} />
                    <Field className="md:col-span-4" label="Logradouro" value={addr.address_logradouro} onChange={onAddr("address_logradouro")} required />
                    <Field className="md:col-span-2" label="Número" value={addr.address_numero} onChange={onAddr("address_numero")} required />
                    <Field className="md:col-span-3" label="Bairro" value={addr.address_bairro} onChange={onAddr("address_bairro")} required />
                    <Field className="md:col-span-2" label="Cidade" value={addr.address_cidade} onChange={onAddr("address_cidade")} required />
                    <Field className="md:col-span-1" label="UF" value={addr.address_uf} onChange={onAddr("address_uf")} required maxLength={2} />
                    <Field className="md:col-span-6" label="Complemento (opcional)" value={addr.address_complemento} onChange={onAddr("address_complemento")} />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Payment Method */}
            <section className="p-8 rounded-3xl border border-border/40 bg-card/40 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <h3 className="font-display font-bold text-xl flex items-center gap-3 mb-6">
                <ShieldCheck className="h-6 w-6 text-primary" /> Como você prefere pagar?
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {methods.map((m) => (
                  <button type="button" key={m.id} onClick={() => setMethod(m.id)}
                    className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                      method === m.id ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.2)] scale-[1.02]" : "border-border/60 hover:border-border hover:bg-white/5"
                    }`}>
                    <m.icon className={`h-8 w-8 ${method === m.id ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="font-semibold">{m.label}</span>
                    <span className="text-xs text-muted-foreground">{m.hint}</span>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {(method === "credit_card" || method === "debit_card") && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                    <div className="p-5 rounded-2xl border border-border bg-background focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                      <CardElement options={{ 
                        style: { 
                          base: { fontSize: "16px", color: "#e5e5e5", fontFamily: "Inter, sans-serif", "::placeholder": { color: "#666" } },
                          invalid: { color: "#ef4444" }
                        } 
                      }} />
                    </div>

                    {method === "credit_card" && maxInstallments > 1 && (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Número de Parcelas</label>
                        <select 
                          value={selectedInstallments}
                          onChange={(e) => setSelectedInstallments(Number(e.target.value))}
                          className="w-full p-4 rounded-2xl border border-border bg-background outline-none focus:border-primary transition-all"
                        >
                          {Array.from({ length: maxInstallments }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>
                              {n}x de R$ {brl((cart?.total || 0) / n)} {n === 1 ? "sem juros" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground bg-green-500/10 text-green-500 p-3 rounded-xl">
                      <Lock className="w-4 h-4" /> Pagamento processado com segurança via Stripe. Seus dados não são armazenados.
                    </div>
                  </motion.div>
                )}

                {method === "pix" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-6 rounded-2xl border border-primary/30 bg-primary/5 flex items-start gap-4">
                    <QrCode className="h-8 w-8 text-primary shrink-0" />
                    <div>
                      <p className="font-bold text-lg mb-1">Aprovação Imediata</p>
                      <p className="text-sm text-muted-foreground">Ao clicar em finalizar compra, geraremos um QR Code exclusivo para o seu pedido. Você terá 15 minutos para pagar.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="p-8 rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl sticky top-28 shadow-2xl">
              <h3 className="font-display font-bold text-2xl border-b border-border/40 pb-5 mb-6 flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" /> Resumo da Compra
              </h3>
              
              <div className="space-y-5 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {cart?.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/5 border border-border/20 shrink-0">
                      <Image src={item.variant.product_image || "/placeholder.png"} alt={item.variant.product_name} fill className="object-cover" />
                    </div>
                    <div className="flex-grow flex flex-col justify-center">
                      <p className="font-bold text-sm line-clamp-2 leading-tight">{item.variant.product_name}</p>
                      <p className="text-primary text-sm font-semibold mt-1">
                        {item.quantity}x R$ {brl(item.variant.effective_price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-border/40 space-y-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>R$ {brl(cart?.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Frete</span>
                  <span className="text-green-500 font-semibold">Grátis</span>
                </div>
                
                <div className="pt-4 border-t border-border/40 flex justify-between items-end">
                  <span className="font-bold text-lg">Total</span>
                  <div className="text-right">
                    <span className="font-display font-black text-4xl text-primary block leading-none">R$ {brl(cart?.total || 0)}</span>
                    {method === "credit_card" && selectedInstallments > 1 && (
                      <span className="text-xs text-muted-foreground mt-1 block">em {selectedInstallments}x de R$ {brl((cart?.total || 0)/selectedInstallments)}</span>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <button type="submit" disabled={processing || (method !== "pix" && !stripe)}
                className="w-full mt-8 flex items-center justify-center gap-3 py-5 rounded-2xl bg-primary text-primary-foreground font-black text-lg hover:bg-primary/90 transition-all shadow-[0_0_30px_rgba(var(--primary),0.4)] hover:shadow-[0_0_40px_rgba(var(--primary),0.6)] hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none">
                {processing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Lock className="h-6 w-6" />}
                {processing ? "Processando Segurança..." : method === "pix" ? "Finalizar via PIX" : `Pagar R$ ${brl(cart?.total || 0)}`}
              </button>

              {/* Trust Badges */}
              <div className="mt-8 flex items-center justify-center gap-6 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                <div className="flex items-center gap-1 font-bold text-[10px]"><Lock className="w-3 h-3"/> SSL 256-bit</div>
                <div className="flex items-center gap-1 font-bold text-[10px]"><ShieldCheck className="w-3 h-3"/> MCAFEE SECURE</div>
                <div className="flex items-center gap-1 font-bold text-[10px]"><CreditCard className="w-3 h-3"/> STRIPE</div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({ label, className = "", ...props }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">{label}</label>
      <input {...props}
        className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-neutral-600 font-medium" />
    </div>
  );
}
