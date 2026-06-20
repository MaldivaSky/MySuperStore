"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SaturnMark } from "@/components/Brand";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, User, Phone, Loader2, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const loginStore = useAuthStore((state) => state.login);
  
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSeller, setIsSeller] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== passwordConfirm) {
      setError("As senhas não conferem.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        role: isSeller ? "seller" : "customer",
        password,
        password_confirm: passwordConfirm,
      };

      const { data } = await authApi.register(payload);
      
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      const userRes = await authApi.me();
      loginStore({ access: data.access, refresh: data.refresh }, userRes.data);
      
      router.push(userRes.data.is_seller ? "/seller/dashboard" : "/store");
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || 
                     (err.response?.data && Object.values(err.response.data).flat().join(" ")) ||
                     "Erro ao realizar cadastro.";
      setError(detail);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-12 px-4">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg space-y-6 p-8 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-2xl relative z-10"
      >
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-2">
            <SaturnMark className="h-11 w-auto drop-shadow-[0_2px_12px_rgba(230,181,60,0.3)] group-hover:scale-105 transition-transform duration-300" />
            <span className="font-display text-xl font-extrabold tracking-[-0.02em] text-foreground">
              MySuperStore
            </span>
          </Link>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Criar sua conta
          </h2>
          <p className="text-sm text-muted-foreground">
            Compre ou venda em um ecossistema seguro e de alta performance
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nome
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Nome"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sobrenome
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Sobrenome"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu-email@exemplo.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Telefone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(xx) xxxxx-xxxx"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Seller Option */}
          <div className="py-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={isSeller}
                onChange={(e) => setIsSeller(e.target.checked)}
                className="mt-1 accent-primary h-4 w-4 rounded border-border focus:ring-primary"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  Quero ser um Seller no marketplace
                </span>
                <span className="text-xs text-muted-foreground">
                  Venda seus próprios produtos e receba repasses via Stripe Connect.
                </span>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-sm transition-all shadow-md disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {loading ? "Cadastrando..." : "Cadastrar Conta"}
          </button>
        </form>

        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/40"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Ou cadastre-se com</span>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => alert("A integração com o Google OAuth será ativada em breve. Por enquanto, use o formulário acima.")}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border/60 bg-background hover:bg-secondary/20 transition-all text-sm font-semibold text-foreground shadow-sm hover:shadow"
            >
              <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36 16.6053 6.549L20.0303 3.124C17.9503 1.19 15.2353 0 12.0003 0C7.31028 0 3.25528 2.69 1.25028 6.609L5.27028 9.724C6.21528 6.81 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L20.18 21.28C22.57 19.08 23.49 15.965 23.49 12.275Z" fill="#4285F4" />
                <path d="M5.26498 14.295C5.02498 13.565 4.88498 12.795 4.88498 12.005C4.88498 11.215 5.01998 10.445 5.26498 9.715L1.23998 6.605C0.44998 8.195 0 9.995 0 12.005C0 14.015 0.44998 15.815 1.23998 17.405L5.26498 14.295Z" fill="#FBBC05" />
                <path d="M12.0004 24C15.2404 24 17.9654 22.935 20.1804 21.28L16.0804 18.1C14.8804 18.9 13.5604 19.25 12.0004 19.25C8.87038 19.25 6.21538 17.19 5.26538 14.29L1.24038 17.4C3.25538 21.31 7.31038 24 12.0004 24Z" fill="#34A853" />
              </svg>
              Entrar com Google
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Já possui uma conta?{" "}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Fazer login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
