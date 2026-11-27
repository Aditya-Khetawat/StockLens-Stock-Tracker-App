import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const description =
  "Paper-trade stocks with $100,000 in virtual cash, track a watchlist, and get AI analysis of your portfolio.";

export const metadata: Metadata = {
  // Absolute URLs for link previews; the image comes from app/opengraph-image.tsx.
  metadataBase: new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000"),
  title: { default: "StockLens", template: "%s · StockLens" },
  description,
  applicationName: "StockLens",
  openGraph: {
    type: "website",
    siteName: "StockLens",
    title: "StockLens: paper trading with live prices",
    description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "StockLens: paper trading with live prices",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
