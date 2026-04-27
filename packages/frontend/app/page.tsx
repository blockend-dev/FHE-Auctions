"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, ExternalLink, Send, FileText } from "lucide-react";
import { useAccount } from "wagmi";
import { useRequestCount } from "../hooks/useRequest";
import { useRoundCount } from "../hooks/useBlindReview";
import { RequestCard } from "../components/RequestCard";
import dynamicImport from "next/dynamic";
import { WalletButton } from "../components/WalletButton";
import { HeroSection } from "../components/HeroSection";

const CreateRequestModal = dynamicImport(
  () => import("../components/CreateRequestModal").then(mod => mod.CreateRequestModal),
  { ssr: false }
);
const SendPaymentModal = dynamicImport(
  () => import("../components/SendPaymentModal").then(mod => mod.SendPaymentModal),
  { ssr: false }
);
const PaymentInbox = dynamicImport(
  () => import("../components/PaymentInbox").then(mod => mod.PaymentInbox),
  { ssr: false }
);
const CreateRoundModal = dynamicImport(
  () => import("../components/CreateRoundModal").then(mod => mod.CreateRoundModal),
  { ssr: false }
);
const ReviewRoundCard = dynamicImport(
  () => import("../components/ReviewRoundCard").then(mod => mod.ReviewRoundCard),
  { ssr: false }
);

export default function Home() {
  const { isConnected, address } = useAccount();
  const { data: count, refetch } = useRequestCount();
  const { data: roundCount, refetch: refetchRounds } = useRoundCount();
  const [showCreate,      setShowCreate]      = useState(false);
  const [showSendPayment, setShowSendPayment] = useState(false);
  const [showCreateRound, setShowCreateRound] = useState(false);

  const requestIds = count
    ? Array.from({ length: Number(count) }, (_, i) => BigInt(i)).reverse()
    : [];
  const roundIds = roundCount
    ? Array.from({ length: Number(roundCount) }, (_, i) => BigInt(i)).reverse()
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
              <span className="font-bold text-white text-sm">Sealect</span>
              <span className="ml-2 text-xs text-slate-500 hidden sm:inline">by Fhenix</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a href="https://docs.fhenix.io" target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Docs <ExternalLink size={11} />
            </a>
            <WalletButton />
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 pb-24">
        <HeroSection />

        {/* Decision Requests */}
        <section className="mt-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Decision Requests</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {requestIds.length} request{requestIds.length !== 1 ? "s" : ""} · all proposals encrypted
              </p>
            </div>
            {isConnected && (
              <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
                <Plus size={15} /> New Request
              </button>
            )}
          </div>

          {requestIds.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card text-center py-20">
              <div className="text-4xl mb-4">🔐</div>
              <p className="text-lg font-semibold text-slate-300 mb-2">No requests yet</p>
              <p className="text-sm text-slate-500 mb-6">
                Be the first to post a confidential vendor selection request on Sealect.
              </p>
              {isConnected ? (
                <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex items-center gap-2">
                  <Plus size={15} /> Create First Request
                </button>
              ) : (
                <p className="text-sm text-slate-600">Connect your wallet to get started.</p>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {requestIds.map((id, i) => (
                <RequestCard key={id.toString()} requestId={id} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* Blind Review Rounds */}
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Blind Review Rounds</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {roundIds.length} round{roundIds.length !== 1 ? "s" : ""} · review scores FHE-encrypted
              </p>
            </div>
            {isConnected && (
              <button onClick={() => setShowCreateRound(true)} className="btn-primary flex items-center gap-2">
                <Plus size={15} /> New Round
              </button>
            )}
          </div>

          {roundIds.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card text-center py-20">
              <div className="text-4xl mb-4">🔬</div>
              <p className="text-lg font-semibold text-slate-300 mb-2">No review rounds yet</p>
              <p className="text-sm text-slate-500 mb-6">
                Create a blind peer review round — grant committees, DAO proposals, academic submissions.
              </p>
              {isConnected ? (
                <button onClick={() => setShowCreateRound(true)} className="btn-primary inline-flex items-center gap-2">
                  <FileText size={15} /> Create First Round
                </button>
              ) : (
                <p className="text-sm text-slate-600">Connect your wallet to get started.</p>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {roundIds.map((id, i) => (
                <ReviewRoundCard key={id.toString()} roundId={id} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* Confidential Payments */}
        {isConnected && address && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Confidential Payments</h2>
                <p className="text-sm text-slate-500 mt-0.5">Send ETH with FHE-encrypted amounts · powered by Privara</p>
              </div>
              <button onClick={() => setShowSendPayment(true)} className="btn-emerald flex items-center gap-2">
                <Send size={15} /> Send Private
              </button>
            </div>
            <div className="glass-card">
              <PaymentInbox address={address} />
            </div>
          </section>
        )}

        <footer className="mt-24 text-center space-y-3">
          <div className="divider max-w-xs mx-auto" />
          <div className="flex items-center justify-center gap-6 text-xs text-slate-600">
            <a href="https://fhenix.io" target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 transition-colors">Fhenix</a>
            <a href="https://cofhe-docs.fhenix.zone" target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 transition-colors">CoFHE Docs</a>
            <a href="https://github.com/FhenixProtocol/awesome-fhenix" target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 transition-colors">GitHub</a>
            <a href="https://reineira.xyz/docs" target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 transition-colors">Privara</a>
          </div>
          <p className="text-xs text-slate-700">Arbitrum Sepolia · Sealect · Fhenix CoFHE</p>
        </footer>
      </main>

      {showCreate && <CreateRequestModal onClose={() => setShowCreate(false)} onCreated={() => refetch()} />}
      {showSendPayment && <SendPaymentModal onClose={() => setShowSendPayment(false)} />}
      {showCreateRound && <CreateRoundModal onClose={() => setShowCreateRound(false)} onCreated={() => { refetchRounds(); setShowCreateRound(false); }} />}
    </div>
  );
}
