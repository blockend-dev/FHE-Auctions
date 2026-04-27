"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, CheckCircle2 } from "lucide-react";
import { useAddProposal } from "../hooks/useBlindReview";

interface Props {
  roundId: bigint;
  roundTitle: string;
  onClose: () => void;
  onAdded: () => void;
}

export function AddProposalModal({ roundId, roundTitle, onClose, onAdded }: Props) {
  const [title, setSTitle]     = useState("");
  const [summary, setSummary]  = useState("");
  const [error, setError]      = useState("");

  const { addProposal, isPending, isConfirming, isSuccess } = useAddProposal();
  const isBusy = isPending || isConfirming;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim())   { setError("Title is required"); return; }
    if (!summary.trim()) { setError("Summary is required"); return; }
    try {
      await addProposal(roundId, title.trim(), summary.trim());
      onAdded();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.slice(0, 140) || "Transaction failed");
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
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
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

          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.2)" }}>
              <Send size={15} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Submit Proposal</h2>
              <p className="text-xs text-slate-500 truncate max-w-xs">{roundTitle}</p>
            </div>
          </div>

          {isSuccess ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-lg font-bold text-white">Proposal Submitted!</p>
              <p className="text-sm text-slate-400 mt-1">Reviewers can now score your proposal.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Proposal Title</label>
                <input
                  className="input w-full" placeholder="e.g. Privacy-preserving oracle network"
                  value={title} onChange={(e) => setSTitle(e.target.value)} disabled={isBusy}
                />
              </div>

              <div>
                <label className="label">Summary</label>
                <textarea
                  className="input w-full resize-none" rows={4}
                  placeholder="Describe your proposal — what it does, why it matters, and how you'll execute it…"
                  value={summary} onChange={(e) => setSummary(e.target.value)} disabled={isBusy}
                />
              </div>

              <div
                className="rounded-xl px-4 py-2.5 text-xs"
                style={{ background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.12)" }}
              >
                <span className="text-cyan-400 font-medium">Proposal metadata is public</span>
                <span className="text-slate-500"> — only review scores are FHE-encrypted.</span>
              </div>

              {error && <p className="text-rose-400 text-sm">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} disabled={isBusy} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={isBusy} className="btn-primary flex-1">
                  {isPending ? "Confirm…" : isConfirming ? "Submitting…" : "Submit Proposal"}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
