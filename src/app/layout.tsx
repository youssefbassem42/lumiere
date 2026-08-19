import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "LUMIÈRE | Premium E-Commerce",
    template: "%s | LUMIÈRE",
  },
  description:
    "Elevate your everyday surroundings. Discover a curated collection of premium objects designed for intentional living.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </head>
      <body className="flex flex-col min-h-screen antialiased bg-[#FAF8FF] text-slate-900">
        <Providers>
          <Navbar />
          <main className="flex-1 pt-20">{children}</main>
          <Footer />
        </Providers>
        <Script  
          
  src="https://aicommerce-ai-service-production.up.railway.app/widget/v1/widget.js"
  data-widget-key="wi_yafbuVLOmGMYFaCm30cLf2ajOAqtBJlKZ91Kbi5G42g"

/>
      </body>
    </html>
  );
}
