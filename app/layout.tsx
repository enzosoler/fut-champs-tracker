import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import AuthProvider from "@/components/AuthProvider";
import { LanguageProvider } from "@/components/LanguageProvider";

export const metadata: Metadata = {
  title: "FUT Champs Tracker",
  description: "Rastreie seus resultados no FUT Champions do FC 26",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FC Tracker",
    startupImage: [],
  },
  icons: {
    apple: [
      { url: "/icons/icon-180.png", sizes: "180x180" },
      { url: "/icons/icon-152.png", sizes: "152x152" },
      { url: "/icons/icon-167.png", sizes: "167x167" },
    ],
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192" },
      { url: "/icons/icon-512.png", sizes: "512x512" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0B0E14",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-[#F1F5F9] font-sans min-h-screen">
        <LanguageProvider>
          <AuthProvider>
            <Header />
            <main className="pb-28 pt-4 max-w-2xl mx-auto lg:pb-8 lg:pt-8">{children}</main>
            <BottomNav />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
