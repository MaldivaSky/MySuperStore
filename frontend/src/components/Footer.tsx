"use client";

import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, ShieldCheck, Truck, HeadphonesIcon, CreditCard } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#05050a] border-t border-white/[0.05] pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand & Sobre */}
          <div className="space-y-4">
            <h2 className="text-2xl font-display font-black text-white tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center">
                <span className="text-white text-lg font-bold">M</span>
              </div>
              MySuperStore
            </h2>
            <p className="text-neutral-400 text-sm leading-relaxed">
              O ecossistema definitivo para quem busca produtos premium, entrega acelerada e segurança absoluta em cada transação.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="text-neutral-500 hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="text-neutral-500 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-neutral-500 hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="text-neutral-500 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className="text-white font-bold mb-4">Comprar</h3>
            <ul className="space-y-3">
              <li><Link href="/store" className="text-neutral-400 text-sm hover:text-primary transition-colors">Ver Catálogo</Link></li>
              <li><Link href="/store?category=eletronicos" className="text-neutral-400 text-sm hover:text-primary transition-colors">Eletrônicos</Link></li>
              <li><Link href="/store?category=casa-inteligente" className="text-neutral-400 text-sm hover:text-primary transition-colors">Casa Inteligente</Link></li>
              <li><Link href="/store?brand=apple" className="text-neutral-400 text-sm hover:text-primary transition-colors">Lojas Oficiais</Link></li>
            </ul>
          </div>

          {/* Suporte e Ajuda */}
          <div>
            <h3 className="text-white font-bold mb-4">Atendimento ao Cliente</h3>
            <ul className="space-y-3">
              <li><Link href="/dashboard/orders" className="text-neutral-400 text-sm hover:text-primary transition-colors">Meus Pedidos & Rastreio</Link></li>
              <li><Link href="/dashboard/orders" className="text-neutral-400 text-sm hover:text-primary transition-colors">Solicitar Troca / Devolução</Link></li>
              <li><a href="#" className="text-neutral-400 text-sm hover:text-primary transition-colors">Central de Ajuda (FAQ)</a></li>
              <li><a href="#" className="text-neutral-400 text-sm hover:text-primary transition-colors">Fale com um Especialista</a></li>
            </ul>
          </div>

          {/* Para Lojistas */}
          <div>
            <h3 className="text-white font-bold mb-4">Seja um Vendedor</h3>
            <ul className="space-y-3">
              <li><Link href="/seller" className="text-neutral-400 text-sm hover:text-primary transition-colors">Painel do Lojista</Link></li>
              <li><a href="#" className="text-neutral-400 text-sm hover:text-primary transition-colors">Taxas e Comissões</a></li>
              <li><a href="#" className="text-neutral-400 text-sm hover:text-primary transition-colors">Como funciona o Fulfillment</a></li>
              <li><Link href="/admin" className="text-neutral-400 text-sm hover:text-primary transition-colors">SuperAdmin Portal</Link></li>
            </ul>
          </div>
        </div>

        {/* Garantias */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-y border-white/[0.05] mb-8">
          <div className="flex items-center gap-3">
            <Truck className="w-8 h-8 text-primary/70" />
            <div>
              <p className="text-white font-bold text-sm">Entrega Expressa</p>
              <p className="text-neutral-500 text-xs">Para todo o Brasil</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-500/70" />
            <div>
              <p className="text-white font-bold text-sm">Compra Garantida</p>
              <p className="text-neutral-500 text-xs">Receba ou seu $ de volta</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <HeadphonesIcon className="w-8 h-8 text-blue-500/70" />
            <div>
              <p className="text-white font-bold text-sm">Suporte 24/7</p>
              <p className="text-neutral-500 text-xs">Atendimento Humanizado</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-purple-500/70" />
            <div>
              <p className="text-white font-bold text-sm">Pagamento Seguro</p>
              <p className="text-neutral-500 text-xs">Até 12x Sem Juros</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} MySuperStore. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
