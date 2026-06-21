import type { Metadata } from "next";
import { Inter, Sora, Space_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Sora — fonte display da marca Saturno (títulos, wordmark)
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Space Mono — fonte técnica/labels da marca
const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MySuperStore — O Centro da Gravidade Comercial",
    template: "%s | MySuperStore",
  },
  description: "Explore um universo multi-vendedor com split financeiro automatizado e uma experiência de compra que transcende qualquer expectativa terrestre.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "MySuperStore",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "MySuperStore Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MySuperStore — O Centro da Gravidade Comercial",
    description: "Explore um universo multi-vendedor.",
    images: ["/logo.png"],
  },
};

import { ToastProvider } from "@/components/ui/Toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BottomNav } from "@/components/BottomNav";
import { AuthProvider } from "@/components/AuthProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} ${sora.variable} ${spaceMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1019190620170-a86680qpdbrjgu1vk31st0lts4ju3cm5.apps.googleusercontent.com"}>
            <ToastProvider>
              <AuthProvider>
                {/* pb-20 no mobile garante que o conteúdo não fica atrás da BottomNav */}
                <div className="pb-20 md:pb-0">
                  {children}
                </div>
                <BottomNav />
              </AuthProvider>
            </ToastProvider>
          </GoogleOAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
