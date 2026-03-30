"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gavel, CheckCircle2, AlertCircle } from "lucide-react";
import { useCreateAuction } from "../hooks/useAuction";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateAuctionModal({ onClose, onCreated }: Props) {
  const [itemName, setItemName] = useState("");
  const [duration, setDuration] = useState("24");
  const [minBid, setMinBid] = useState("0.01");
  const [error, setError] = useState("");

  const { createAuction, isPending, isConfirming, isSuccess } = useCreateAuction();
  const isBusy = isPending || isConfirming;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!itemName.trim()) { setError("Item name is required"); return; }
    if (!duration || Number(duration) < 1) { setError("Duration must be at least 1 hour"); return; }
    if (!minBid || Number(minBid) <= 0) { setError("Min bid must be > 0"); return; }

    try {
      await createAuction(itemName.trim(), Number(duration), minBid);
      setTimeout(() => { onCreated(); onClose(); }, 1800);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError((msg as string)?.slice(0, 100) || "Transaction failed");
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
              <Gavel size={18} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create Auction</h2>
              <p className="text-xs text-slate-500">All bids will be FHE-encrypted on-chain</p>
            </div>
          </div>

          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <CheckCircle2 size={52} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-lg font-bold text-white">Auction Created!</p>
              <p className="text-sm text-slate-400 mt-1">Bidders can now submit encrypted bids</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Item Name</label>
                <input
                  className="input-glass"
                  placeholder="e.g. Rare NFT #42, Company Equity Grant…"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  disabled={isBusy}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Duration (hours)</label>
                  <input
                    className="input-glass"
                    type="number"
                    min="1"
                    max="720"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    disabled={isBusy}
                  />
                </div>
                <div>
                  <label className="label">Min Bid (ETH)</label>
                  <input
                    className="input-glass"
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={minBid}
                    onChange={(e) => setMinBid(e.target.value)}
                    disabled={isBusy}
                  />
                </div>
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
                  {isPending ? "Confirm in wallet…" : isConfirming ? "Creating…" : "Create Auction"}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
