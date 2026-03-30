"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, ExternalLink } from "lucide-react";
import { useAccount } from "wagmi";
import { useAuctionCount } from "../hooks/useAuction";
import { AuctionCard } from "../components/AuctionCard";
import dynamicImport from "next/dynamic";
import { WalletButton } from "../components/WalletButton";
import { HeroSection } from "../components/HeroSection";

const CreateAuctionModal = dynamicImport(() => import("../components/CreateAuctionModal").then(mod => mod.CreateAuctionModal), { ssr: false });

export default function Home() {
  const { isConnected } = useAccount();
  const { data: count, refetch } = useAuctionCount();
  const [showCreate, setShowCreate] = useState(false);

  const auctionIds = count
    ? Array.from({ length: Number(count) }, (_, i) => BigInt(i)).reverse()
    : [];

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-40 w-full"
        style={{ background: "rgba(3,3,8,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{ background: "linear-gradient(135deg,#7c3aed,#22d3ee)" }}>
              🔐
            </div>
            <div>
              <span className="font-bold text-white text-sm">FHE Auctions</span>
              <span className="ml-2 text-xs text-slate-500 hidden sm:inline">by Fhenix</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://docs.fhenix.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Docs <ExternalLink size={11} />
            </a>
            <WalletButton />
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 pb-24">
        {/* Hero */}
        <HeroSection />

        {/* Auctions section */}
        <section className="mt-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Live Auctions</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {auctionIds.length} auction{auctionIds.length !== 1 ? "s" : ""} · all bids encrypted
              </p>
            </div>

            {isConnected && (
              <button
                onClick={() => setShowCreate(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={15} />
                New Auction
              </button>
            )}
          </div>

          {/* Grid */}
          {auctionIds.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card text-center py-20"
            >
              <div className="text-4xl mb-4">🔐</div>
              <p className="text-lg font-semibold text-slate-300 mb-2">No auctions yet</p>
              <p className="text-sm text-slate-500 mb-6">
                Be the first to create a privacy-preserving sealed-bid auction on Fhenix.
              </p>
              {isConnected ? (
                <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex items-center gap-2">
                  <Plus size={15} /> Create First Auction
                </button>
              ) : (
                <p className="text-sm text-slate-600">Connect your wallet to get started.</p>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {auctionIds.map((id, i) => (
                <AuctionCard key={id.toString()} auctionId={id} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-24 text-center space-y-3">
          <div className="divider max-w-xs mx-auto" />
          <div className="flex items-center justify-center gap-6 text-xs text-slate-600">
            <a href="https://fhenix.io" target="_blank" rel="noopener noreferrer"
              className="hover:text-violet-400 transition-colors">Fhenix</a>
            <a href="https://cofhe-docs.fhenix.zone" target="_blank" rel="noopener noreferrer"
              className="hover:text-violet-400 transition-colors">CoFHE Docs</a>
            <a href="https://github.com/FhenixProtocol/awesome-fhenix" target="_blank" rel="noopener noreferrer"
              className="hover:text-violet-400 transition-colors">GitHub</a>
            <a href="https://reineira.xyz/docs" target="_blank" rel="noopener noreferrer"
              className="hover:text-violet-400 transition-colors">Privara</a>
          </div>
          <p className="text-xs text-slate-700">Arbitrum Sepolia · Privacy-by-Design · Fhenix CoFHE</p>
        </footer>
      </main>

      {showCreate && (
        <CreateAuctionModal
          onClose={() => setShowCreate(false)}
          onCreated={() => refetch()}
        />
      )}
    </div>
  );
}
