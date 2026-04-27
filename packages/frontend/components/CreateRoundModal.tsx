"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, CheckCircle2 } from "lucide-react";
import { useCreateRound } from "../hooks/useBlindReview";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateRoundModal({ onClose, onCreated }: Props) {
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration]     = useState("72");
  const [wImpact, setWImpact]       = useState(40);
  const [wFeasibility, setWFeasibility] = useState(35);
  const [wInnovation, setWInnovation]   = useState(25);
  const [error, setError]           = useState("");

  const { createRound, isPending, isConfirming, isSuccess } = useCreateRound();
  const weightSum = wImpact + wFeasibility + wInnovation;
  const isBusy = isPending || isConfirming;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim())         { setError("Title is required"); return; }
    if (!description.trim())   { setError("Description is required"); return; }
    if (weightSum !== 100)     { setError(`Weights must sum to 100 (currently ${weightSum})`); return; }
    try {
      await createRound(title.trim(), description.trim(), Number(duration), wImpact, wFeasibility, wInnovation);
      onCreated();
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
          className="relative w-full max-w-lg glass-modal z-10 overflow-y-auto max-h-[90vh]"
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
              style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
              <FileText size={16} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create Review Round</h2>
              <p className="text-xs text-slate-500">Blind peer scoring · FHE-encrypted</p>
            </div>
          </div>

          {isSuccess ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-lg font-bold text-white">Round Created!</p>
              <p className="text-sm text-slate-400 mt-1">Proposals can now be submitted.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Round Title</label>
                <input
                  className="input w-full" placeholder="e.g. Q3 Ecosystem Grants"
                  value={title} onChange={(e) => setTitle(e.target.value)} disabled={isBusy}
                />
              </div>

              <div>
                <label className="label">Description / Scope</label>
                <textarea
                  className="input w-full resize-none" rows={3}
                  placeholder="Describe what proposals should cover, evaluation criteria, eligibility…"
                  value={description} onChange={(e) => setDescription(e.target.value)} disabled={isBusy}
                />
              </div>

              <div>
                <label className="label">Review Window (hours)</label>
                <input
                  className="input w-full" type="number" min="1"
                  value={duration} onChange={(e) => setDuration(e.target.value)} disabled={isBusy}
                />
              </div>

              <div>
                <label className="label">
                  Scoring Weights (must sum to 100) ·{" "}
                  <span className={weightSum === 100 ? "text-emerald-400" : "text-rose-400"}>
                    {weightSum}/100
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ["Impact",      wImpact,      setWImpact     ],
                    ["Feasibility", wFeasibility, setWFeasibility],
                    ["Innovation",  wInnovation,  setWInnovation ],
                  ] as const).map(([lbl, val, set]) => (
                    <div key={lbl}>
                      <p className="text-xs text-slate-500 mb-1">{lbl}</p>
                      <input
                        className="input w-full text-center" type="number" min={0} max={100}
                        value={val}
                        onChange={(e) => (set as (v: number) => void)(Number(e.target.value))}
                        disabled={isBusy}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="text-rose-400 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} disabled={isBusy} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={isBusy} className="btn-primary flex-1">
                  {isPending ? "Confirm in wallet…" : isConfirming ? "Creating…" : "Create Round"}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
