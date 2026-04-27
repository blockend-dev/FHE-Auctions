import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

// const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Sealect | Confidential Vendor Selection · Fhenix",
  description:
    "FHE-powered vendor selection engine. Vendors submit encrypted multi-factor proposals — price, quality, delivery — scored on-chain without ever revealing raw inputs.",
  openGraph: {
    title: "Sealect | Confidential Vendor Selection · Fhenix",
    description: "Sealed proposals. Smart selection. Powered by Fhenix CoFHE.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={` antialiased min-h-screen`}>
        {/* Animated background */}
        <div className="bg-scene">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>
        <div className="relative z-10">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
