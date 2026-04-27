"use client";

import { motion } from "framer-motion";
import { ShieldCheck, EyeOff, Zap, BarChart2 } from "lucide-react";

const features = [
  {
    icon: BarChart2,
    title: "Multi-Factor Scoring",
    desc: "Vendors submit price, quality, and delivery scores. The contract computes a weighted total without ever seeing the individual inputs.",
    color: "#8b5cf6",
  },
  {
    icon: EyeOff,
    title: "Zero Information Leak",
    desc: "Proposals are FHE-encrypted before leaving the browser. Competitors cannot observe or undercut each other — cryptographically enforced.",
    color: "#22d3ee",
  },
  {
    icon: ShieldCheck,
    title: "ZK-Verified Inputs",
    desc: "Every encrypted factor carries a zero-knowledge proof of validity. The contract verifies it before the proposal is accepted on-chain.",
    color: "#ec4899",
  },
  {
    icon: Zap,
    title: "On-Chain FHE Compute",
    desc: "Weighted scoring runs fully on ciphertext via the Fhenix CoFHE co-processor. The optimal vendor emerges — raw scores stay encrypted forever.",
    color: "#f59e0b",
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
        Sealed Proposals.
        <br />
        <span className="gradient-text">Smart Selection.</span>
      </motion.h1>

      {/* Sub */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-lg text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
      >
        The first confidential vendor selection engine where multi-factor proposals are{" "}
        <span className="text-violet-400 font-medium">Fully Homomorphic Encrypted</span> on-chain.
        Scores computed in ciphertext. Optimal vendor revealed — nothing else.
      </motion.p>

      {/* Flow diagram */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="glass-card max-w-2xl mx-auto mb-16"
      >
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-4 font-medium">How a proposal travels</p>
        <div className="flex items-center justify-center gap-2 flex-wrap gap-y-3">
          {[
            { label: "3 Factors", sub: "price · quality · delivery", color: "#94a3b8" },
            { label: "→" },
            { label: "FHE Encrypt", sub: "+ ZK Proof", color: "#8b5cf6" },
            { label: "→" },
            { label: "On-Chain", sub: "ciphertext", color: "#22d3ee" },
            { label: "→" },
            { label: "FHE Score", sub: "w1·p + w2·q + w3·d", color: "#8b5cf6" },
            { label: "→" },
            { label: "Best Vendor", sub: "revealed", color: "#10b981" },
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

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 + i * 0.08 }}
            className="glass-card group"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
              style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}
            >
              <f.icon size={18} style={{ color: f.color }} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">{f.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
