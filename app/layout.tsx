import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "FUT Champs Tracker FC 26",
  description: "Rastreie seus resultados no FUT Champions do FC 26",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#121212",
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
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-white font-sans min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">
            FUT CHAMPS <span className="text-primary">TRACKER</span>
          </h1>
          <span className="text-xs text-gray-500 font-medium">FC 26</span>
        </header>

        {/* Page content — extra bottom padding for nav */}
        <main className="pb-24 px-4 pt-4 max-w-lg mx-auto">{children}</main>

        <BottomNav />
      </body>
    </html>
  );
}
