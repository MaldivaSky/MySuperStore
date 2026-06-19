"use client";

import { useAuthStore } from "@/store/authStore";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, Heart, User, LogOut } from "lucide-react";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, logout, user } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const links = [
    { name: "Meus Pedidos", href: "/dashboard/orders", icon: ShoppingBag },
    { name: "Lista de Desejos", href: "/dashboard/wishlist", icon: Heart },
    { name: "Minha Conta", href: "/dashboard/account", icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-6">
          <div className="p-6 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm">
            <h2 className="font-display font-bold text-lg mb-1 truncate">{user?.first_name} {user?.last_name}</h2>
            <p className="text-xs text-muted-foreground truncate mb-6">{user?.email}</p>
            
            <nav className="space-y-1">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                      isActive 
                        ? "bg-primary text-primary-foreground font-semibold shadow-md" 
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground font-medium"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="mt-8 w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="h-4 w-4" />
              Sair da Conta
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-grow min-w-0">
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  );
}
