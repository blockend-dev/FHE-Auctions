"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatEther } from "viem";
import { useSubmitProposal } from "../hooks/useAuction";
import dynamic from "next/dynamic";

const EncryptionSteps = dynamic(() => import("./EncryptionSteps").then(mod => mod.EncryptionSteps), { ssr: false });

interface Props {
  requestId: bigint;
  title: string;
  depositWei: bigint;
  weights: { wPrice: number; wQuality: number; wDelivery: number };
  onClose: () => void;
}

function ScoreSlider({
  label, hint, value, onChange, disabled,
}: { label: string; hint: string; value: number; onChange: (v: number) => void; disabled: boolean }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <label className="label">{label}</label>
        <span className="text-xs font-bold text-violet-400">{value}</span>
      </div>
      <input
        type="range"
        min={0} max={100} step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full accent-violet-500 cursor-pointer disabled:opacity-40"
      />
      <p className="text-xs text-slate-600 mt-0.5">{hint}</p>
    </div>
  );
}

export function BidModal({ requestId, title, depositWei, weights, onClose }: Props) {
  const [price, setPrice] = useState(50);      // price-competitiveness 0-100
  const [quality, setQuality] = useState(50);  // quality score 0-100
  const [delivery, setDelivery] = useState(50); // delivery speed 0-100
  const [error, setError] = useState("");

  const { submitProposal, steps, isEncrypting, isPending, isConfirming, isSuccess, reset } = useSubmitProposal();
  const isBusy = isEncrypting || isPending || isConfirming;

  useEffect(() => {
    if (isSuccess) setTimeout(onClose, 2000);
  }, [isSuccess, onClose]);

  const handleSubmit = async () => {
    setError("");
    try {
      await submitProposal(requestId, price, quality, delivery, depositWei);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.slice(0, 120) || "Transaction failed");
      reset();
    }
  };

  const depositEth = formatEther(depositWei);

  // Preview score contribution (plaintext, for UX — same formula as contract)
  const previewScore =
    weights.wPrice * price + weights.wQuality * quality + weights.wDelivery * delivery;
  const maxScore = (weights.wPrice + weights.wQuality + weights.wDelivery) * 100;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={!isBusy ? onClose : undefined}
        />

        <motion.div
          className="relative w-full max-w-md glass-modal z-10"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          {!isBusy && (
            <button onClick={onClose} className="absolute right-5 top-5 text-slate-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          )}

          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
                <Lock size={16} className="text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Submit Encrypted Proposal</h2>
                <p className="text-xs text-slate-500">{title}</p>
              </div>
            </div>

            <div className="rounded-xl px-4 py-3 text-xs text-violet-300 leading-relaxed"
              style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
              All three factor scores are FHE-encrypted before leaving your browser.
              The contract computes a weighted score without ever seeing your values.
            </div>
          </div>

          {/* Factor sliders */}
          {!isSuccess && (
            <div className="space-y-4 mb-5">
              <ScoreSlider
                label={`Price Competitiveness  ×${weights.wPrice}`}
                hint="100 = most competitive price"
                value={price} onChange={setPrice} disabled={isBusy}
              />
              <ScoreSlider
                label={`Quality Score  ×${weights.wQuality}`}
                hint="100 = highest quality offering"
                value={quality} onChange={setQuality} disabled={isBusy}
              />
              <ScoreSlider
                label={`Delivery Speed  ×${weights.wDelivery}`}
                hint="100 = fastest delivery"
                value={delivery} onChange={setDelivery} disabled={isBusy}
              />

              {/* Preview score bar */}
              <div
                className="rounded-xl px-4 py-3 text-xs"
                style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.12)" }}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-slate-400">Preview score</span>
                  <span className="font-bold text-cyan-400">{previewScore} / {maxScore}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${maxScore > 0 ? (previewScore / maxScore) * 100 : 0}%`,
                      background: "linear-gradient(90deg, #7c3aed, #22d3ee)"
                    }}
                  />
                </div>
                <p className="text-slate-600 mt-1.5">This preview is local only — encrypted before submission</p>
              </div>

              {/* Required deposit notice */}
              <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs"
                style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}>
                <span className="text-amber-400 font-medium">Deposit required:</span>
                <span className="text-slate-300">{depositEth} ETH (refundable if not selected)</span>
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400">
                  <AlertCircle size={12} /> {error}
                </div>
              )}
            </div>
          )}

          <EncryptionSteps steps={steps} isEncrypting={isEncrypting} />

          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-lg font-bold text-white">Proposal Submitted!</p>
              <p className="text-sm text-slate-400 mt-1">Your encrypted proposal is live on-chain.</p>
            </motion.div>
          )}

          {!isSuccess && (
            <div className="flex gap-3 mt-2">
              <button onClick={onClose} disabled={isBusy} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isBusy}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Lock size={14} />
                {isEncrypting ? "Encrypting…" : isPending ? "Confirm…" : isConfirming ? "Mining…" : "Encrypt & Submit"}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
