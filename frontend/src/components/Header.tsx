"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { ThemeToggle } from "./ThemeToggle";
import { 
  Store, 
  LayoutDashboard, 
  BookOpen,
  ShoppingCart,
  Menu,
  X,
  LogOut,
  User,
  Heart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export function Header() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { name: "Loja", href: "/store", icon: Store, show: true },
    { name: "Painel Lojista", href: "/seller", icon: LayoutDashboard, show: user?.role === "seller" },
    { name: "SuperAdmin", href: "/admin", icon: LayoutDashboard, show: user?.role === "admin" },
  ].filter(link => link.show);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#050510]/80 backdrop-blur-xl transition-colors duration-300">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 drop-shadow-xl group-hover:scale-105 transition-transform duration-300">
            <Image
              src="/logo.png?v=4"
              alt="MySuperStore Logo"
              fill
              priority
              className="object-contain"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            MySuperStore
          </span>
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

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/wishlist" className="p-2 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors relative group">
              <Heart className="h-5 w-5" />
              <span className="absolute top-14 right-0 scale-0 group-hover:scale-100 transition-all bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap z-50">Favoritos</span>
            </Link>

            {isAuthenticated ? (
              <>
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
              <ShoppingCart className="h-5 w-5" />
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
