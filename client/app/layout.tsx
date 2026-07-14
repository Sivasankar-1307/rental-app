import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Antigravity Rentals",
  description: "Premium event and equipment rental platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Rentals",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <CartProvider>
          <main className="page-container min-h-screen">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}