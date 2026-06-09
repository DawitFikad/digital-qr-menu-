import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import AppInit from "@/components/AppInit";

export const metadata: Metadata = {
  title: "Paramount Cafe & Pizzeria",
  description: "A Taste of Home — Premium Ethiopian Cuisine",
  manifest: "/manifest.json",
  icons: {
    icon: "/images/logo3.png",
    apple: "/images/logo3.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Welcome",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#1A0D06",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:wght@400;600;700&family=Cinzel:wght@400;600;700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AppInit />
        <LanguageProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
