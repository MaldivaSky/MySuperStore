import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "loremflickr.com" },
      // Railway backend (produção)
      { protocol: "https", hostname: "*.railway.app" },
      // DummyJSON CDN (imagens do seed demo)
      { protocol: "https", hostname: "cdn.dummyjson.com" },
      // Logo Nike
      { protocol: "https", hostname: "upload.wikimedia.org" },
      // Adicione o domínio R2/S3 em produção:
      // { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
  },
  async rewrites() {
    // Extrai a base URL do backend (remove /api/v1) para o proxy de media local
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const backendBase = apiUrl.replace(/\/api.*$/, "");

    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
      {
        source: "/media/:path*",
        destination: `${backendBase}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
