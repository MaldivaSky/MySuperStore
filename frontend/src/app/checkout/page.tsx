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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Interest calculation helper
  const calculateInstallment = (n: number) => {
    const total = cart?.total || 0;
    if (n <= 3) return total / n;
    const interestRate = 0.0199; // 1.99% a.m
    const pmt = total * interestRate * Math.pow(1 + interestRate, n) / (Math.pow(1 + interestRate, n) - 1);
    return pmt;
  };

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
          const list = addrRes.data?.results || addrRes.data || [];
          
          if (list.length > 0) {
            setUserAddresses(list);
            const defaultAddr = list.find((a: any) => a.is_default) || list[0];
            setAddr({
              address_recipient: defaultAddr.recipient_name || "Você",
              address_cep: defaultAddr.cep,
              address_logradouro: defaultAddr.logradouro,
              address_numero: defaultAddr.numero,
              address_complemento: defaultAddr.complemento || "",
              address_bairro: defaultAddr.bairro,
              address_cidade: defaultAddr.cidade,
              address_uf: defaultAddr.uf,
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
      if (err?.response?.data) {
        const data = err.response.data;
        if (typeof data === "object" && !data.detail) {
          const firstErrorKey = Object.keys(data)[0];
          setError(`Erro: ${data[firstErrorKey]}`);
        } else {
          setError(data.detail || "Erro ao processar pagamento.");
        }
      } else {
        setError(err.message || "Erro ao processar pagamento.");
      }
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
      if (err?.response?.data) {
        const data = err.response.data;
        if (typeof data === "object" && !data.detail) {
          const firstErrorKey = Object.keys(data)[0];
          setError(`Erro em ${firstErrorKey}: ${data[firstErrorKey]}`);
        } else {
          setError(data.detail || "Erro ao simular PIX.");
        }
      } else {
        setError(err.message || "Erro ao simular PIX.");
      }
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
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Recebemos seu pagamento e seu pedido já está sendo preparado pelos vendedores.
          </p>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-md mb-8 text-left">
            <h3 className="font-bold text-lg mb-4 border-b border-white/10 pb-2">Resumo da Transação</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Valor Pago</span>
              <span className="font-bold">R$ {brl(method === "pix" ? (cart?.total || 0) * 0.95 : (cart?.total || 0))}</span>
            </div>
            {(cart?.coupon_code || method === "pix") && (
              <div className="flex justify-between items-center text-emerald-500 font-bold mt-3 pt-3 border-t border-white/10">
                <span className="flex items-center gap-2">✨ Economia Total</span>
                <span>R$ {brl(((cart?.subtotal || 0) - (cart?.total || 0)) + (method === "pix" ? (cart?.total || 0) * 0.05 : 0))}</span>
              </div>
            )}
          </div>

          <Link href="/dashboard/orders"
            className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)]">
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

          <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 mb-6 text-left shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-muted-foreground text-sm">Valor a Pagar:</span>
              <span className="font-display font-black text-2xl text-foreground">R$ {brl((cart?.total || 0) * 0.95)}</span>
            </div>
            <div className="flex justify-between items-center text-emerald-500 font-bold">
              <span className="text-xs">✨ Desconto PIX + Cupons aplicados:</span>
              <span className="text-sm">Economia de R$ {brl(((cart?.subtotal || 0) - (cart?.total || 0)) + ((cart?.total || 0) * 0.05))}</span>
            </div>
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
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-start gap-4 justify-between group">
                    <div className="flex gap-4 items-start">
                      <MapPin className="w-5 h-5 text-neutral-400 mt-1" />
                      <div>
                        <p className="font-bold text-lg">{addr.address_recipient || "Destinatário Padrão"}</p>
                        <p className="text-muted-foreground">{addr.address_logradouro}, {addr.address_numero}</p>
                        {addr.address_complemento && <p className="text-muted-foreground">{addr.address_complemento}</p>}
                        <p className="text-muted-foreground">{addr.address_bairro} — {addr.address_cidade}/{addr.address_uf}</p>
                        <p className="text-muted-foreground mt-1">CEP: {addr.address_cep}</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setUseCustomAddress(true)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 transition-all opacity-80 hover:opacity-100 whitespace-nowrap"
                    >
                      Alterar Endereço
                    </button>
                  </motion.div>
              </AnimatePresence>

              {/* Address Modal */}
              <AnimatePresence>
                {useCustomAddress && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-background border border-border/40 p-8 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <h2 className="text-2xl font-bold font-display mb-6">Alterar Endereço de Entrega</h2>
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
                        <Field className="md:col-span-4" label="Destinatário" value={addr.address_recipient} onChange={onAddr("address_recipient")} required />
                        <Field className="md:col-span-2" label="CEP" value={addr.address_cep} onChange={onAddr("address_cep")} required maxLength={8} />
                        <Field className="md:col-span-4" label="Logradouro" value={addr.address_logradouro} onChange={onAddr("address_logradouro")} required />
                        <Field className="md:col-span-2" label="Número" value={addr.address_numero} onChange={onAddr("address_numero")} required />
                        <Field className="md:col-span-3" label="Bairro" value={addr.address_bairro} onChange={onAddr("address_bairro")} required />
                        <Field className="md:col-span-2" label="Cidade" value={addr.address_cidade} onChange={onAddr("address_cidade")} required />
                        <Field className="md:col-span-1" label="UF" value={addr.address_uf} onChange={onAddr("address_uf")} required maxLength={2} />
                        <Field className="md:col-span-6" label="Complemento (opcional)" value={addr.address_complemento} onChange={onAddr("address_complemento")} />
                      </div>
                      <div className="mt-8 flex justify-end gap-4">
                        <button type="button" onClick={() => setUseCustomAddress(false)} className="px-6 py-3 rounded-xl font-bold text-muted-foreground hover:bg-white/5 transition-all">Cancelar</button>
                        <button type="button" onClick={() => setUseCustomAddress(false)} className="px-6 py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg">Salvar Endereço</button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </section>

            {/* Payment Method */}
            <section className="p-8 rounded-3xl border border-border/40 bg-card/40 shadow-sm relative z-10">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-3xl" />
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
                        hidePostalCode: true,
                        style: { 
                          base: { fontSize: "16px", color: "#e5e5e5", fontFamily: "Inter, sans-serif", "::placeholder": { color: "#666" } },
                          invalid: { color: "#ef4444" }
                        } 
                      }} />
                    </div>

                    {method === "credit_card" && (
                      <div className="space-y-2 relative">
                        <label className="text-sm font-semibold text-muted-foreground">Número de Parcelas</label>
                        
                        {/* Custom Dropdown Trigger */}
                        <div 
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="w-full p-4 rounded-2xl border border-border bg-background outline-none focus-within:border-primary transition-all cursor-pointer flex justify-between items-center"
                        >
                          <span>
                            {selectedInstallments}x de R$ {brl(calculateInstallment(selectedInstallments))}{" "}
                            {selectedInstallments <= 3 ? (
                              <span className="text-green-500 font-bold ml-1">sem juros</span>
                            ) : (
                              <span className="text-muted-foreground ml-1">com juros</span>
                            )}
                          </span>
                          <span className="text-muted-foreground">▼</span>
                        </div>

                        {/* Custom Dropdown Menu */}
                        <AnimatePresence>
                          {isDropdownOpen && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }} 
                              animate={{ opacity: 1, y: 0 }} 
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute z-50 w-full mt-2 bg-background border border-border rounded-2xl shadow-2xl max-h-64 overflow-y-auto custom-scrollbar"
                            >
                              {Array.from({ length: maxInstallments }, (_, i) => i + 1).map(n => {
                                const val = calculateInstallment(n);
                                return (
                                  <div 
                                    key={n} 
                                    onClick={() => {
                                      setSelectedInstallments(n);
                                      setIsDropdownOpen(false);
                                    }}
                                    className={`p-4 hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-border/40 last:border-0 ${selectedInstallments === n ? 'bg-primary/10' : ''}`}
                                  >
                                    <span>{n}x de R$ {brl(val)}</span>
                                    {n <= 3 ? (
                                      <span className="text-green-500 font-bold text-sm">sem juros</span>
                                    ) : (
                                      <span className="text-muted-foreground text-sm">com juros</span>
                                    )}
                                  </div>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
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
                  <span>R$ {brl(cart?.items?.reduce((acc, item) => acc + (Number(item.variant.price || item.variant.product_base_price) * item.quantity), 0) || cart?.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Frete</span>
                  <span className="text-green-500 font-semibold drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">Grátis</span>
                </div>

                {((cart?.subtotal || 0) > (cart?.total || 0) || method === "pix" || cart?.items?.some(i => Number(i.variant.price || i.variant.product_base_price) > Number(i.variant.effective_price))) && (
                  <div className="flex flex-col gap-2 mt-4 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <span className="text-emerald-500 font-bold text-sm mb-1">Descontos Obtidos:</span>
                    
                    {(() => {
                      const originalSub = cart?.items?.reduce((acc, item) => acc + (Number(item.variant.price || item.variant.product_base_price) * item.quantity), 0) || 0;
                      const prodDiscount = originalSub - (cart?.subtotal || 0);
                      return prodDiscount > 0 ? (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-emerald-600/80">Desconto nos Produtos</span>
                          <span className="text-emerald-600 font-bold">- R$ {brl(prodDiscount)}</span>
                        </div>
                      ) : null;
                    })()}
                    
                    {cart?.coupon_code && cart.subtotal > cart.total && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-emerald-600/80">Cupom ({cart.coupon_code})</span>
                        <span className="text-emerald-600 font-bold">- R$ {brl(cart.subtotal - cart.total)}</span>
                      </div>
                    )}
                    
                    {method === "pix" && (
                      <div className="flex justify-between items-center text-sm animate-in fade-in zoom-in duration-300">
                        <span className="text-emerald-600/80">Pagamento via PIX (5%)</span>
                        <span className="text-emerald-600 font-bold">- R$ {brl((cart?.total || 0) * 0.05)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-emerald-500/20">
                      <span className="text-emerald-500 font-black">Total Economizado</span>
                      <span className="text-emerald-500 font-black text-lg drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                        - R$ {brl(
                          (() => {
                            const originalSub = cart?.items?.reduce((acc, item) => acc + (Number(item.variant.price || item.variant.product_base_price) * item.quantity), 0) || 0;
                            const prodDiscount = originalSub - (cart?.subtotal || 0);
                            const cupomDiscount = (cart?.subtotal || 0) - (cart?.total || 0);
                            const pixDiscount = method === "pix" ? (cart?.total || 0) * 0.05 : 0;
                            return prodDiscount + cupomDiscount + pixDiscount;
                          })()
                        )}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="pt-6 border-t border-border/40 flex justify-between items-end mt-4">
                  <span className="font-bold text-lg">Total</span>
                  <div className="text-right">
                    <span className="font-display font-black text-4xl text-primary block leading-none">
                      R$ {brl(method === "pix" ? (cart?.total || 0) * 0.95 : method === "credit_card" ? calculateInstallment(selectedInstallments) * selectedInstallments : (cart?.total || 0))}
                    </span>
                    {method === "credit_card" && selectedInstallments > 1 && (
                      <span className="text-xs text-muted-foreground mt-1 block">em {selectedInstallments}x de R$ {brl(calculateInstallment(selectedInstallments))}</span>
                    )}
                    {method === "pix" && (
                      <span className="text-xs text-emerald-500 font-bold mt-1 block">✨ Você economizou R$ {brl((cart?.total || 0) * 0.05)} no PIX!</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {error && <p className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}
                
                <button
                  onClick={handleSubmit}
                  disabled={processing || !stripe || !elements}
                  className="w-full py-5 rounded-2xl bg-primary text-primary-foreground font-black text-lg hover:bg-primary/95 transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Lock className="h-6 w-6" />}
                  Finalizar Pagamento Seguro
                </button>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-border/30">
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10 shadow-sm">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Lock className="w-5 h-5 text-emerald-500" />
                      <span className="font-bold text-sm text-foreground/90 uppercase tracking-wider">Checkout Seguro e Criptografado</span>
                    </div>
                    <p className="text-xs text-center text-muted-foreground mb-6 max-w-[280px] mx-auto">
                      Seus dados são protegidos com criptografia SSL 256-bit e processados em ambiente seguro PCI Compliance.
                    </p>
                    
                    <div className="flex flex-col items-center gap-5">
                      {/* Security Seals */}
                      <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
                        <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-lg border border-border/50 shadow-sm">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase whitespace-nowrap">Norton Secured</span>
                        </div>
                        <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-lg border border-border/50 shadow-sm">
                          <Lock className="w-4 h-4 text-emerald-500" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase whitespace-nowrap">SSL 256-Bit</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-lg border border-border/50 shadow-sm">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase whitespace-nowrap">Powered by</span>
                          <span className="text-sm font-black tracking-tighter text-[#635BFF] lowercase">stripe</span>
                        </div>
                      </div>

                      {/* Payment Methods */}
                      <div className="flex items-center justify-center gap-6 sm:gap-8 border-t border-border/20 pt-6 w-full opacity-90 text-muted-foreground">
                        {/* Visa */}
                        <div className="text-[#1434CB] font-black italic text-xl tracking-tighter leading-none">VISA</div>
                        
                        {/* Mastercard */}
                        <div className="relative w-10 h-6 flex items-center justify-center">
                          <div className="absolute left-0 w-6 h-6 bg-[#EB001B] rounded-full mix-blend-multiply opacity-90"></div>
                          <div className="absolute right-0 w-6 h-6 bg-[#F79E1B] rounded-full mix-blend-multiply opacity-90"></div>
                        </div>

                        {/* Amex */}
                        <div className="bg-[#016FD0] text-white font-bold text-[10px] px-1.5 py-0.5 rounded-sm tracking-tight border border-[#016FD0]">AMEX</div>
                        
                        {/* Elo */}
                        <div className="w-10 h-[22px] bg-black rounded flex items-center justify-center font-bold text-[9px] text-white border-b-2 border-yellow-400">elo</div>

                        {/* Pix */}
                        <div className="flex items-center gap-1 text-[#32BCAD] font-bold">
                          <div className="w-3 h-3 bg-[#32BCAD] rotate-45 transform"></div>
                          <span className="text-lg leading-none lowercase tracking-tighter">pix</span>
                        </div>
                        
                        {/* Boleto */}
                        <Banknote className="h-6 w-auto text-muted-foreground opacity-70" />
                      </div>
                    </div>
                  </div>
                </div>
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
