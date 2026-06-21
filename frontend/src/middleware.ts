import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas que exigem login
const PROTECTED = ["/dashboard", "/checkout"];
// Rotas que exigem login + papel de seller
const SELLER_ONLY = ["/seller/dashboard"];
// Rotas que exigem login + papel de admin
const ADMIN_ONLY = ["/admin"];
// Redirecionar usuários já autenticados para fora de login/registro
const AUTH_REDIRECT = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoggedIn = request.cookies.has("mss_auth");

  // Já logado tentando acessar login/registro → vai para dashboard
  if (AUTH_REDIRECT.some((p) => pathname.startsWith(p)) && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Rotas protegidas sem autenticação → redireciona para /login?next=<rota>
  const needsAuth =
    PROTECTED.some((p) => pathname.startsWith(p)) ||
    SELLER_ONLY.some((p) => pathname.startsWith(p)) ||
    ADMIN_ONLY.some((p) => pathname.startsWith(p));

  if (needsAuth && !isLoggedIn) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/checkout/:path*",
    "/seller/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
