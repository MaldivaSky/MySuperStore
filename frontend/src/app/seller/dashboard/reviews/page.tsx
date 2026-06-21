"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { sellerDashboardApi } from "@/lib/api";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Star, MessageSquare, AlertCircle } from "lucide-react";

export default function SellerReviewsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [reviewsReceived, setReviewsReceived] = useState<any[]>([]);
  const [reviewsGiven, setReviewsGiven] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"received" | "given">("received");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    
    Promise.all([
      sellerDashboardApi.reviewsReceived(),
      sellerDashboardApi.reviewsGiven()
    ])
    .then(([recRes, givRes]) => {
      setReviewsReceived(recRes.data);
      setReviewsGiven(givRes.data);
    })
    .catch((err) => {
      console.error("Error loading reviews", err);
    })
    .finally(() => {
      setLoading(false);
    });
  }, [isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button 
          onClick={() => router.push("/seller/dashboard")}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao Painel
        </button>

        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-display font-black flex items-center gap-3">
            <Star className="h-8 w-8 text-amber-500 fill-amber-500" />
            Gestão de Reputação
          </h1>
          <p className="text-muted-foreground">Veja o que seus clientes dizem sobre você e avalie suas transações.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => setActiveTab("received")}
            className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "received" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Avaliações Recebidas ({reviewsReceived.length})
          </button>
          <button
            onClick={() => setActiveTab("given")}
            className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "given" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Compradores Avaliados ({reviewsGiven.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === "received" && (
            reviewsReceived.length > 0 ? (
              reviewsReceived.map((rev) => (
                <motion.div key={rev.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{rev.customer_name}</h3>
                      <p className="text-xs text-muted-foreground">Em {new Date(rev.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-500/10 px-3 py-1 rounded-full text-amber-500 font-bold">
                      <Star className="h-4 w-4 fill-amber-500" /> {rev.rating}
                    </div>
                  </div>
                  <p className="text-sm bg-background/50 p-4 rounded-lg border border-border/50">
                    "{rev.comment || "Sem comentários."}"
                  </p>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
                <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-bold">Nenhuma avaliação ainda</h3>
                <p className="text-muted-foreground text-sm">Continue vendendo com excelência para receber avaliações.</p>
              </div>
            )
          )}

          {activeTab === "given" && (
            reviewsGiven.length > 0 ? (
              reviewsGiven.map((rev) => (
                <motion.div key={rev.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">Comprador ID: {rev.customer}</h3>
                      <p className="text-xs text-muted-foreground">Em {new Date(rev.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-500/10 px-3 py-1 rounded-full text-amber-500 font-bold">
                      <Star className="h-4 w-4 fill-amber-500" /> {rev.rating}
                    </div>
                  </div>
                  <p className="text-sm bg-background/50 p-4 rounded-lg border border-border/50">
                    "{rev.comment || "Sem comentários."}"
                  </p>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-bold">Você ainda não avaliou ninguém</h3>
                <p className="text-muted-foreground text-sm">Após uma compra finalizada, avalie o comportamento do cliente.</p>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}
