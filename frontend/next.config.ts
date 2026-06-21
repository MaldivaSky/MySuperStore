import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "loremflickr.com" },
      // Railway backend (produção)
      { protocol: "https", hostname: "*.railway.app" },
      // DummyJSON CDN (imagens do seed demo)
      { protocol: "https", hostname: "cdn.dummyjson.com" },
      // Adicione o domínio R2/S3 em produção:
      // { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
