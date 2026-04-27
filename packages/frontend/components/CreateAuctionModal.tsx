"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BarChart2, CheckCircle2, AlertCircle } from "lucide-react";
import { useCreateRequest } from "../hooks/useAuction";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateAuctionModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("24");
  const [deposit, setDeposit] = useState("0.01");
  const [wPrice, setWPrice] = useState(40);
  const [wQuality, setWQuality] = useState(40);
  const [wDelivery, setWDelivery] = useState(20);
  const [error, setError] = useState("");

  const { createRequest, isPending, isConfirming, isSuccess } = useCreateRequest();
  const isBusy = isPending || isConfirming;
  const weightSum = wPrice + wQuality + wDelivery;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("Title is required"); return; }
    if (!duration || Number(duration) < 1) { setError("Duration must be at least 1 hour"); return; }
    if (!deposit || Number(deposit) <= 0) { setError("Deposit must be > 0"); return; }
    if (weightSum !== 100) { setError(`Weights must sum to 100 (currently ${weightSum})`); return; }

    try {
      await createRequest(title.trim(), Number(duration), deposit, wPrice, wQuality, wDelivery);
      setTimeout(() => { onCreated(); onClose(); }, 1800);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.slice(0, 100) || "Transaction failed");
    }
  };

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

          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.22)" }}>
              <BarChart2 size={18} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">New Decision Request</h2>
              <p className="text-xs text-slate-500">Vendor proposals will be FHE-encrypted on-chain</p>
            </div>
          </div>

          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <CheckCircle2 size={52} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-lg font-bold text-white">Request Created!</p>
              <p className="text-sm text-slate-400 mt-1">Vendors can now submit encrypted proposals</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="label">Project / Service Title</label>
                <input
                  className="input-glass"
                  placeholder="e.g. Cloud Infrastructure Migration, Logo Design…"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isBusy}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Duration (hours)</label>
                  <input
                    className="input-glass" type="number" min="1" max="720"
                    value={duration} onChange={(e) => setDuration(e.target.value)} disabled={isBusy}
                  />
                </div>
                <div>
                  <label className="label">Vendor Deposit (ETH)</label>
                  <input
                    className="input-glass" type="number" step="0.001" min="0.001"
                    value={deposit} onChange={(e) => setDeposit(e.target.value)} disabled={isBusy}
                  />
                </div>
              </div>

              {/* Weight inputs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Scoring Weights</label>
                  <span className={`text-xs font-bold ${weightSum === 100 ? "text-emerald-400" : "text-rose-400"}`}>
                    {weightSum}/100
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Price", value: wPrice, set: setWPrice, color: "#8b5cf6" },
                    { label: "Quality", value: wQuality, set: setWQuality, color: "#22d3ee" },
                    { label: "Delivery", value: wDelivery, set: setWDelivery, color: "#10b981" },
                  ].map(({ label, value, set, color }) => (
                    <div key={label} className="rounded-xl p-3 text-center"
                      style={{ background: `${color}0d`, border: `1px solid ${color}25` }}>
                      <div className="text-xs text-slate-500 mb-1">{label}</div>
                      <input
                        type="number" min={0} max={100}
                        value={value}
                        onChange={(e) => set(Math.min(100, Math.max(0, Number(e.target.value))))}
                        disabled={isBusy}
                        className="w-full bg-transparent text-center font-bold text-white text-sm outline-none"
                        style={{ color }}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-600 mt-1.5">
                  Weights define how the contract scores proposals. Must sum to 100.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-rose-400">
                  <AlertCircle size={13} /> {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} disabled={isBusy} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={isBusy} className="btn-cyan flex-1">
                  {isPending ? "Confirm in wallet…" : isConfirming ? "Creating…" : "Create Request"}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
