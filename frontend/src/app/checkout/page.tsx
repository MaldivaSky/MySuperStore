"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { cartApi, ordersApi, paymentsApi, PaymentMethodChoice } from "@/lib/api";
import { getStripe } from "@/lib/stripe";
import { Cart } from "@/types";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import {
  Loader2, CheckCircle2, ShieldCheck, MapPin, CreditCard, ShoppingBag,
  QrCode, Copy, Check, Banknote,
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

  const [method, setMethod] = useState<Method>("pix");

  // PIX state
  const [pix, setPix] = useState<{ paymentId: string; copia: string; qr: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [awaitingPix, setAwaitingPix] = useState(false);

  // Endereço de entrega
  const [addr, setAddr] = useState({
    address_recipient: "", address_cep: "", address_logradouro: "", address_numero: "",
    address_complemento: "", address_bairro: "", address_cidade: "", address_uf: "",
  });

  const [couponCode, setCouponCode] = useState("");

  useEffect(() => {
    cartApi.get()
      .then((res) => {
        if (!res.data || res.data.items.length === 0) router.push("/cart");
        else setCart(res.data);
      })
      .catch(() => router.push("/cart"))
      .finally(() => setLoading(false));
  }, [router]);

  const onAddr = (k: keyof typeof addr) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddr((a) => ({ ...a, [k]: e.target.value }));

  async function createOrderAndIntent(): Promise<{ paymentId: string; clientSecret?: string; pixData?: any } | null> {
    // 1. Cria o pedido a partir do carrinho logado
    const payload = { ...addr };
    if (couponCode.trim()) {
      (payload as any).coupon_code = couponCode.trim();
    }
    const orderRes = await ordersApi.create(payload);
    const order = orderRes.data;
    setSuccessOrder(null);

    // 2. Inicia o pagamento no método escolhido
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

      // Cartão (crédito/débito) → confirma no Stripe Elements
      if (!stripe || !elements) throw new Error("Stripe não carregado.");
      const card = elements.getElement(CardElement);
      if (!card) throw new Error("Formulário de cartão indisponível.");

      const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(res.clientSecret!, {
        payment_method: { card },
      });
      if (stripeErr) throw new Error(stripeErr.message || "Pagamento recusado.");

      if (paymentIntent?.status === "succeeded") {
        // Confirmação autoritativa no backend (rede de segurança ao webhook)
        const confirmed = await paymentsApi.confirm(res.paymentId);
        setSuccessOrder(confirmed.data.order?.toString() ?? "OK");
        // Recarrega para pegar o order_number — usamos o do pedido criado
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

  // ── Sucesso ───────────────────────────────────────────────────────────────
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

  // ── Aguardando PIX ──────────────────────────────────────────────────────────
  if (awaitingPix && pix) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto w-full">
          <QrCode className="h-10 w-10 text-primary mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Pague com PIX</h1>
          <p className="text-muted-foreground mb-6">Escaneie o QR Code no app do seu banco ou use o Copia e Cola.</p>

          <div className="bg-white p-4 rounded-2xl shadow-lg mb-6">
            <img src={`data:image/png;base64,${pix.qr}`} alt="QR Code PIX" className="w-56 h-56" />
          </div>

          <button onClick={copyPix}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border/60 bg-card/40 hover:bg-card/70 transition-all mb-4 font-mono text-xs break-all">
            {copied ? <Check className="h-4 w-4 text-green-500 shrink-0" /> : <Copy className="h-4 w-4 shrink-0" />}
            <span className="truncate">{copied ? "Copiado!" : pix.copia}</span>
          </button>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          {/* DEV: simula a baixa do banco. Em produção o webhook confirma sozinho. */}
          <button onClick={handleSimulatePix} disabled={processing}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition-all shadow-lg disabled:opacity-50">
            {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
            Já paguei (simular confirmação)
          </button>
          <p className="text-xs text-muted-foreground mt-3">Ambiente de teste — nenhuma cobrança real é feita.</p>
        </main>
      </div>
    );
  }

  // ── Formulário ──────────────────────────────────────────────────────────────
  const methods: { id: Method; label: string; icon: any; hint: string }[] = [
    { id: "pix", label: "PIX", icon: QrCode, hint: "Aprovação imediata" },
    { id: "credit_card", label: "Crédito", icon: CreditCard, hint: "Em até 12x" },
    { id: "debit_card", label: "Débito", icon: Banknote, hint: "À vista" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-display font-bold mb-8">Finalizar Compra</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Endereço */}
            <div className="p-6 rounded-2xl border border-border/40 bg-card/40 space-y-6">
              <h3 className="font-display font-bold text-lg flex items-center gap-2 border-b border-border/40 pb-4">
                <MapPin className="h-5 w-5 text-primary" /> Endereço de Entrega
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Field className="md:col-span-4" label="Destinatário" value={addr.address_recipient} onChange={onAddr("address_recipient")} required />
                <Field className="md:col-span-2" label="CEP" value={addr.address_cep} onChange={onAddr("address_cep")} required maxLength={8} />
                <Field className="md:col-span-4" label="Logradouro" value={addr.address_logradouro} onChange={onAddr("address_logradouro")} required />
                <Field className="md:col-span-2" label="Número" value={addr.address_numero} onChange={onAddr("address_numero")} required />
                <Field className="md:col-span-3" label="Bairro" value={addr.address_bairro} onChange={onAddr("address_bairro")} required />
                <Field className="md:col-span-2" label="Cidade" value={addr.address_cidade} onChange={onAddr("address_cidade")} required />
                <Field className="md:col-span-1" label="UF" value={addr.address_uf} onChange={onAddr("address_uf")} required maxLength={2} />
                <Field className="md:col-span-6" label="Complemento (opcional)" value={addr.address_complemento} onChange={onAddr("address_complemento")} />
              </div>
            </div>

            {/* Método de pagamento */}
            <div className="p-6 rounded-2xl border border-border/40 bg-card/40 space-y-6">
              <h3 className="font-display font-bold text-lg flex items-center gap-2 border-b border-border/40 pb-4">
                <ShieldCheck className="h-5 w-5 text-primary" /> Forma de Pagamento
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {methods.map((m) => (
                  <button type="button" key={m.id} onClick={() => setMethod(m.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      method === m.id ? "border-primary bg-primary/10 ring-2 ring-primary/30" : "border-border/60 hover:border-border"
                    }`}>
                    <m.icon className={`h-6 w-6 ${method === m.id ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="font-semibold text-sm">{m.label}</span>
                    <span className="text-[10px] text-muted-foreground">{m.hint}</span>
                  </button>
                ))}
              </div>

              {/* Card Element para crédito/débito */}
              {(method === "credit_card" || method === "debit_card") && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-border/60 bg-background">
                    <CardElement options={{ style: { base: { fontSize: "16px", color: "#888" } } }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cartão de teste: <span className="font-mono">4242 4242 4242 4242</span> · validade futura · CVC qualquer
                  </p>
                </div>
              )}

              {method === "pix" && (
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-3">
                  <QrCode className="h-6 w-6 text-primary" />
                  <p className="text-sm text-muted-foreground">Geramos um QR Code PIX no próximo passo. Aprovação na hora.</p>
                </div>
              )}
            </div>
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <div className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md sticky top-24 space-y-6">
              <h3 className="font-display font-bold text-xl border-b border-border/40 pb-4 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" /> Seu Pedido
              </h3>
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {cart?.items.map((item) => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white/5 border border-border/20 shrink-0">
                      <Image src={item.variant.product_image || "/placeholder.png"} alt={item.variant.product_name} fill className="object-cover" />
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold line-clamp-1">{item.variant.product_name}</p>
                      <p className="text-muted-foreground text-xs">{item.quantity}x R$ {brl(item.variant.effective_price)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-border/40 flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="font-display font-black text-2xl text-primary">R$ {brl(cart?.total || 0)}</span>
              </div>

              <div className="pt-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Cupom de Desconto</label>
                <div className="flex gap-2 mt-1">
                  <input type="text" placeholder="Código do Cupom" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background focus:border-primary outline-none uppercase" />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button type="submit" disabled={processing || (method !== "pix" && !stripe)}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-50">
                {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                {processing ? "Processando..." : method === "pix" ? "Gerar PIX" : "Pagar agora"}
              </button>
              <p className="text-[11px] text-center text-muted-foreground">
                Pagamento protegido · split automático por vendedor
              </p>
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
      <label className="text-xs font-semibold text-muted-foreground uppercase">{label}</label>
      <input {...props}
        className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background focus:border-primary outline-none" />
    </div>
  );
}
