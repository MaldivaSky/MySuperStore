"use client";

export const dynamic = "force-dynamic";


import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SaturnMark } from "@/components/Brand";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || null;
  const loginStore = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await authApi.login(email, password);
      
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      const userRes = await authApi.me();
      loginStore(data, userRes.data);

      router.push(nextPath || (userRes.data.is_seller ? "/seller/dashboard" : "/"));
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Email ou senha incorretos.");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      const { data } = await authApi.googleLogin(credentialResponse.credential);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      loginStore({ access: data.access, refresh: data.refresh }, data.user);
      router.push(nextPath || (data.user.is_seller ? "/seller/dashboard" : "/"));
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erro no login do Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Background gradients */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8 p-8 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-2xl relative z-10"
      >
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-4">
            <SaturnMark className="h-12 w-auto drop-shadow-[0_2px_12px_rgba(230,181,60,0.3)] group-hover:scale-105 transition-transform duration-300" />
            <span className="font-display text-xl font-extrabold tracking-[-0.02em] text-foreground">
              MySuperStore
            </span>
          </Link>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Bem-vindo de volta
          </h2>
          <p className="text-sm text-muted-foreground">
            Entre na sua conta para gerenciar compras e vendas
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

        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("O login com Google falhou.")}
            theme="filled_black"
            text="signin_with"
            shape="rectangular"
          />
        </div>

        <div className="relative flex items-center py-2 mb-4">
          <div className="flex-grow border-t border-border/60"></div>
          <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs uppercase tracking-widest font-semibold">Ou continue com email</span>
          <div className="flex-grow border-t border-border/60"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
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
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Senha
              </label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
              />
            </div>
          </div>


          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-sm transition-all shadow-md disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Link href="/register" className="text-primary hover:underline font-semibold">
            Cadastre-se
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
