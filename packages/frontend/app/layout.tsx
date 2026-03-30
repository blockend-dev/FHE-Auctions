import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "FHE Sealed-Bid Auction | Fhenix",
  description:
    "MEV-protected sealed-bid auctions powered by Fully Homomorphic Encryption on Fhenix. Bids stay encrypted — on-chain, always.",
  openGraph: {
    title: "FHE Sealed-Bid Auction | Fhenix",
    description: "Bid privately. Win fairly. Powered by FHE.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased min-h-screen`}>
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
