"use client";
import React from "react";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { ThemeToggle } from "./ThemeToggle";
import { BrandLogo, SaturnMark, OfficialLogo } from "./Brand";
import { 
  Store, 
  LayoutDashboard, 
  BookOpen,
  ShoppingCart,
  Menu,
  X,
  LogOut,
  User,
  Heart,
  Zap,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { itemCount, fetchCartCount } = useCartStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchParams = useSearchParams();
  const searchParam = searchParams.get("search") || "";
  const [search, setSearch] = useState(searchParam);

  // Sincroniza a barra de pesquisa com a URL quando ela muda externamente
  useEffect(() => {
    setSearch(searchParam);
  }, [searchParam]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCartCount();
    }
  }, [isAuthenticated, fetchCartCount]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (val.trim() === "") {
      router.push(`/`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/?search=${encodeURIComponent(search.trim())}`);
    } else {
      router.push(`/`);
    }
  };

  const navLinks = [
    { name: "Loja", href: "/", icon: Store, show: true },
    { name: "Vender Aqui", href: "/vender", icon: Store, show: true },
    { name: "White-Label", href: "/white-label", icon: Zap, show: true },
    { name: "Painel Lojista", href: "/seller", icon: LayoutDashboard, show: user?.has_store === true },
    { name: "SuperAdmin", href: "/admin", icon: LayoutDashboard, show: user?.role === "admin" },
  ].filter(link => link.show);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#050510]/80 backdrop-blur-xl transition-colors duration-300">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Marca oficial — Saturno */}
        <Link href="/" className="group" aria-label="MySuperStore — início">
          <OfficialLogo className="h-14 sm:h-16 w-auto drop-shadow-[0_2px_10px_rgba(230,181,60,0.28)] group-hover:scale-105 transition-transform duration-300" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "text-primary bg-primary/[0.08]"
                    : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-[9px] left-3 right-3 h-[2px] bg-gradient-to-r from-primary/0 via-primary to-primary/0"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
          {/* Action Buttons */}
        </nav>

        {/* Search input desktop */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative max-w-xs w-full mx-4">
          <input
            type="text"
            placeholder="Pesquisar produtos..."
            value={search}
            onChange={handleSearchChange}
            className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] focus:border-primary/50 text-white rounded-full pl-10 pr-8 py-1.5 text-xs outline-none transition-all placeholder:text-neutral-500"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
          {search.trim() !== "" && (
            <button 
              type="button" 
              onClick={() => { setSearch(""); router.push("/"); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/wishlist" className="p-2 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors relative group">
              <Heart className="h-5 w-5" />
              <span className="absolute top-14 right-0 scale-0 group-hover:scale-100 transition-all bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap z-50">Favoritos</span>
            </Link>

            {isAuthenticated ? (
              <>
                {user?.is_seller ? (
                  <Link href="/seller/dashboard" className="hidden lg:flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-semibold text-white transition-all">
                    <Store className="w-4 h-4 text-primary" />
                    Painel Lojista
                  </Link>
                ) : (
                  <Link href="/seller/onboarding" className="hidden lg:flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-primary to-[#B38F25] hover:scale-105 rounded-full text-sm font-black text-black transition-all shadow-[0_0_15px_rgba(230,181,60,0.3)]">
                    <Store className="w-4 h-4" />
                    Vender
                  </Link>
                )}

                <Link href="/dashboard/account" className="p-2 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors relative group">
                  <User className="h-5 w-5" />
                  <span className="absolute top-14 right-0 scale-0 group-hover:scale-100 transition-all bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap z-50">Minha Conta</span>
                </Link>
              </>
            ) : (
              <Link href="/login" className="p-2 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors relative group">
                <User className="h-5 w-5" />
                <span className="absolute top-14 right-0 scale-0 group-hover:scale-100 transition-all bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap z-50">Entrar</span>
              </Link>
            )}

            <Link href="/cart" className="p-2 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors relative group">
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-sm">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </div>
              <span className="absolute top-14 right-0 scale-0 group-hover:scale-100 transition-all bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap z-50">Carrinho</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-all"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden border-t border-white/[0.06] bg-[#050510]/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "text-primary bg-primary/[0.08]"
                        : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.name}
                  </Link>
                );
              })}
              {!isAuthenticated && (
                <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center text-sm font-medium text-neutral-400 px-4 py-3 rounded-xl border border-white/[0.06] hover:bg-white/[0.04] transition-all"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center text-sm font-bold bg-gradient-to-r from-primary to-amber-600 text-black px-4 py-3 rounded-xl transition-all"
                  >
                    Cadastrar
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
