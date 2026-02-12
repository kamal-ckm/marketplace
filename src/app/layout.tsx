import type { Metadata } from "next";
import { Raleway, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const raleway = Raleway({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Healthi Marketplace - Your Health, Your Wealth",
  description: "Shop health and wellness products using your employer-funded health wallet. Fitness equipment, nutrition supplements, medical devices, and more.",
  keywords: ["health", "wellness", "marketplace", "fitness", "nutrition", "health wallet"],
};

import { CustomerAuthProvider } from "@/lib/auth-customer";
import { CartProvider } from "@/lib/cart-context";
import { CartDrawer } from "@/components/layout/CartDrawer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${raleway.variable} ${sourceSans.variable} antialiased`}>
        <CustomerAuthProvider>
          <CartProvider>
            {children}
            <CartDrawer />
          </CartProvider>
        </CustomerAuthProvider>
      </body>
    </html>
  );
}


