"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatEther } from "viem";
import { usePlaceBid } from "../hooks/useAuction";
import { EncryptionSteps } from "./EncryptionSteps";

interface Props {
  auctionId: bigint;
  itemName: string;
  minBidWei: bigint;
  onClose: () => void;
}

export function BidModal({ auctionId, itemName, minBidWei, onClose }: Props) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const { placeBid, steps, isEncrypting, isPending, isConfirming, isSuccess, reset } = usePlaceBid();

  const isBusy = isEncrypting || isPending || isConfirming;
  const minEth = formatEther(minBidWei);

  useEffect(() => {
    if (isSuccess) {
      setTimeout(onClose, 2000);
    }
  }, [isSuccess, onClose]);

  const handleBid = async () => {
    setError("");
    const val = parseFloat(amount);
    if (!amount || isNaN(val)) { setError("Enter a valid amount"); return; }
    if (val < parseFloat(minEth)) { setError(`Minimum bid is ${minEth} ETH`); return; }

    try {
      await placeBid(auctionId, amount);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError((msg as string)?.slice(0, 120) || "Transaction failed");
      reset();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={!isBusy ? onClose : undefined}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-md glass-modal z-10"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          {/* Close */}
          {!isBusy && (
            <button
              onClick={onClose}
              className="absolute right-5 top-5 text-slate-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          )}

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
                <Lock size={16} className="text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Place Encrypted Bid</h2>
                <p className="text-xs text-slate-500">{itemName}</p>
              </div>
            </div>

            {/* Privacy callout */}
            <div className="rounded-xl px-4 py-3 text-xs text-violet-300 leading-relaxed"
              style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
              Your bid is encrypted client-side with a ZK proof before touching the chain.
              No one — not even the contract — can read your bid amount.
            </div>
          </div>

          {/* Input */}
          {!isSuccess && (
            <div className="mb-2">
              <label className="label">Bid Amount (ETH)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  min={minEth}
                  placeholder={`Min: ${minEth} ETH`}
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setError(""); }}
                  disabled={isBusy}
                  className="input-glass pr-16"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">
                  ETH
                </span>
              </div>
              {error && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-400">
                  <AlertCircle size={12} /> {error}
                </div>
              )}
            </div>
          )}

          {/* Encryption steps */}
          <EncryptionSteps steps={steps} isEncrypting={isEncrypting} />

          {/* Success */}
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-lg font-bold text-white">Bid Placed!</p>
              <p className="text-sm text-slate-400 mt-1">
                Your encrypted bid is live on-chain.
              </p>
            </motion.div>
          )}

          {/* Footer */}
          {!isSuccess && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                disabled={isBusy}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleBid}
                disabled={isBusy || !amount}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Lock size={14} />
                {isEncrypting ? "Encrypting…" : isPending ? "Confirm…" : isConfirming ? "Mining…" : "Encrypt & Bid"}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
