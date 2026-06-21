"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Zap, ShoppingCart, User } from "lucide-react";
import { motion } from "framer-motion";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

const HIDDEN_PREFIXES = ["/seller", "/admin", "/login", "/register", "/checkout", "/white-label", "/vender"];

export function BottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const accountHref = isAuthenticated ? "/dashboard/account" : "/login";

  const tabs = [
    { key: "home",    href: "/",              icon: Home,          label: "Início"   },
    { key: "offers",  href: "/?discount=10",  icon: Zap,           label: "Ofertas"  },
    { key: "cart",    href: "/cart",          icon: ShoppingCart,  label: "Carrinho" },
    { key: "account", href: accountHref,     icon: User,          label: "Conta"    },
  ];

  const activeKey =
    pathname === "/cart" ? "cart" :
    pathname.startsWith("/dashboard") ? "account" :
    pathname === "/" ? "home" : null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#050510]/96 backdrop-blur-xl border-t border-white/[0.06]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navegação principal"
    >
      <div className="flex items-stretch justify-around h-[60px] px-1">
        {tabs.map(({ key, href, icon: Icon, label }) => {
          const isActive = key === activeKey;
          const badge = key === "cart" && itemCount > 0 ? itemCount : 0;

          return (
            <Link
              key={key}
              href={href}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className="relative flex flex-col items-center justify-center gap-[3px] flex-1 h-full outline-none"
            >
              {/* Active pill indicator — slides with layoutId */}
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-pill"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}

              <div className="relative">
                <Icon
                  className={`w-[22px] h-[22px] transition-colors duration-150 ${
                    isActive ? "text-primary" : "text-neutral-500"
                  }`}
                />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[9px] font-black h-[15px] min-w-[15px] px-0.5 rounded-full flex items-center justify-center leading-none">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] font-semibold leading-none transition-colors duration-150 ${
                  isActive ? "text-primary" : "text-neutral-500"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
