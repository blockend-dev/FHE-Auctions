"use client";

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { arbitrumSepolia } from "../lib/wagmi";
import { Wallet, LogOut, AlertTriangle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [open, setOpen] = useState(false);

  const wrongChain = isConnected && chainId !== arbitrumSepolia.id;

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isPending}
        className="btn-primary flex items-center gap-2"
      >
        <Wallet size={16} />
        {isPending ? "Connecting…" : "Connect Wallet"}
      </button>
    );
  }

  if (wrongChain) {
    return (
      <button
        onClick={() => switchChain({ chainId: arbitrumSepolia.id })}
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-amber-300 transition-all"
        style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}
      >
        <AlertTriangle size={15} />
        Switch to Arbitrum Sepolia
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-300 transition-all"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
      >
        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
        <span className="font-mono">
          {address?.slice(0, 6)}…{address?.slice(-4)}
        </span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-44 rounded-xl overflow-hidden z-50"
            style={{ background: "rgba(10,10,20,0.95)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)" }}
          >
            <div className="p-1">
              <button
                onClick={() => { disconnect(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <LogOut size={14} />
                Disconnect
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
