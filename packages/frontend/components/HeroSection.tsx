"use client";

import { motion } from "framer-motion";
import { ShieldCheck, EyeOff, FileText, Send } from "lucide-react";

const modules = [
  {
    icon: EyeOff,
    title: "Decision Requests",
    desc: "Vendors submit price, quality, and delivery scores FHE-encrypted. The contract scores all proposals on ciphertext — competitors never see each other's inputs.",
    color: "#8b5cf6",
    tag: "VendorSelection.sol",
  },
  {
    icon: FileText,
    title: "Blind Peer Review",
    desc: "Reviewers score proposals on impact, feasibility, and innovation — all encrypted. After finalization, the organizer reveals the winner's score via a CoFHE permit.",
    color: "#22d3ee",
    tag: "BlindReview.sol",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Gate",
    desc: "Age and jurisdiction are FHE-encrypted in the browser. The contract checks both conditions on ciphertext — your raw values are never revealed on-chain.",
    color: "#ec4899",
    tag: "IdentityGate.sol",
  },
  {
    icon: Send,
    title: "Confidential Payments",
    desc: "Send ETH with an FHE-encrypted amount. The value stays hidden until the recipient claims — observable to no one else on-chain.",
    color: "#f59e0b",
    tag: "ConfidentialPayment.sol",
  },
];

export function HeroSection() {
  return (
    <section className="relative pt-24 pb-16 px-4 text-center max-w-5xl mx-auto">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-8"
        style={{
          background: "rgba(139,92,246,0.1)",
          border: "1px solid rgba(139,92,246,0.25)",
          color: "#a78bfa",
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
        Powered by Fhenix CoFHE · Arbitrum Sepolia
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-5xl sm:text-6xl font-black tracking-tight leading-tight mb-6"
      >
        Sealed Inputs.
        <br />
        <span className="gradient-text">Private Decisions.</span>
      </motion.h1>

      {/* Sub */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-lg text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
      >
        Four FHE-powered modules — vendor selection, blind peer review, KYC compliance, and confidential payments —
        all computed on{" "}
        <span className="text-violet-400 font-medium">encrypted data</span>{" "}
        via the Fhenix CoFHE co-processor. Raw inputs never touch plaintext on-chain.
      </motion.p>

      {/* Common FHE pipeline */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="glass-card max-w-2xl mx-auto mb-16"
      >
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-4 font-medium">How every input travels</p>
        <div className="flex items-center justify-center gap-2 flex-wrap gap-y-3">
          {[
            { label: "Plaintext", sub: "browser only", color: "#94a3b8" },
            { label: "→" },
            { label: "FHE Encrypt", sub: "+ ZK Proof", color: "#8b5cf6" },
            { label: "→" },
            { label: "On-Chain", sub: "ciphertext", color: "#22d3ee" },
            { label: "→" },
            { label: "FHE Compute", sub: "gt · mul · add · select", color: "#8b5cf6" },
            { label: "→" },
            { label: "Min. Reveal", sub: "result only", color: "#10b981" },
          ].map((item, i) =>
            item.label === "→" ? (
              <span key={i} className="text-slate-600 text-lg">→</span>
            ) : (
              <div key={i} className="text-center">
                <div className="text-sm font-semibold" style={{ color: item.color }}>
                  {item.label}
                </div>
                <div className="text-xs text-slate-600">{item.sub}</div>
              </div>
            )
          )}
        </div>
      </motion.div>

      {/* Module cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        {modules.map((m, i) => (
          <motion.div
            key={m.title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 + i * 0.08 }}
            className="glass-card group flex flex-col"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
              style={{ background: `${m.color}18`, border: `1px solid ${m.color}30` }}
            >
              <m.icon size={18} style={{ color: m.color }} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">{m.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed flex-1">{m.desc}</p>
            <div className="mt-3 pt-3 border-t border-white/5">
              <span className="text-[10px] font-mono" style={{ color: `${m.color}99` }}>{m.tag}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
