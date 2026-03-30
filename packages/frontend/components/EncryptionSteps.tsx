"use client";

import { motion, AnimatePresence } from "framer-motion";
import { EncryptionStep, STEP_LABELS, STEP_ICONS, STEP_ORDER } from "../hooks/useCofhe";
import { CheckCircle2, Loader2 } from "lucide-react";

interface Props {
  steps: EncryptionStep[];
  isEncrypting: boolean;
}

// Keys match EncryptStep enum values (lowercase strings from SDK)
const STEP_DESCS: Record<string, string> = {
  initTfhe: "Loading TFHE WASM module",
  fetchKeys: "Fetching FHE public key from CoFHE network",
  pack: "Packing bid value into ZK list",
  prove: "Generating zero-knowledge proof (Web Worker)",
  verify: "Submitting proof to CoFHE verifier",
};

export function EncryptionSteps({ steps, isEncrypting }: Props) {
  const hasActivity = steps.some((s) => s.status !== "idle");
  if (!hasActivity && !isEncrypting) return null;

  const doneCount = steps.filter((s) => s.status === "done").length;
  const progress = (doneCount / steps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div
          className="rounded-2xl p-5 mt-4"
          style={{
            background: "rgba(139,92,246,0.05)",
            border: "1px solid rgba(139,92,246,0.15)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-xs font-semibold text-violet-300 uppercase tracking-widest">
                FHE Encryption Pipeline
              </span>
            </div>
            <span className="text-xs text-slate-500">
              {doneCount}/{steps.length} steps
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 rounded-full mb-5" style={{ background: "rgba(139,92,246,0.15)" }}>
            <motion.div
              className="h-1 rounded-full"
              style={{ background: "linear-gradient(90deg, #7c3aed, #22d3ee)" }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-2">
            {steps.map((s, i) => {
              const label = STEP_LABELS[s.step] ?? String(s.step);
              const icon = STEP_ICONS[s.step] ?? "•";
              const desc = STEP_DESCS[String(s.step)] ?? "";

              return (
                <motion.div
                  key={String(s.step)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 py-1.5"
                >
                  {/* Status icon */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base transition-all duration-300"
                    style={{
                      background:
                        s.status === "done"
                          ? "rgba(16,185,129,0.15)"
                          : s.status === "active"
                          ? "rgba(139,92,246,0.2)"
                          : "rgba(255,255,255,0.03)",
                      border:
                        s.status === "done"
                          ? "1px solid rgba(16,185,129,0.3)"
                          : s.status === "active"
                          ? "1px solid rgba(139,92,246,0.4)"
                          : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {s.status === "done" ? (
                      <CheckCircle2 size={15} className="text-emerald-400" />
                    ) : s.status === "active" ? (
                      <Loader2 size={15} className="text-violet-400 animate-spin" />
                    ) : (
                      <span className="text-slate-600 text-sm">{icon}</span>
                    )}
                  </div>

                  {/* Label + desc */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-medium transition-colors duration-200"
                      style={{
                        color:
                          s.status === "done"
                            ? "#34d399"
                            : s.status === "active"
                            ? "#a78bfa"
                            : "#475569",
                      }}
                    >
                      {label}
                      {s.status === "done" && s.duration && (
                        <span className="ml-2 text-xs text-slate-600 font-normal">
                          {s.duration}ms
                        </span>
                      )}
                    </div>
                    {s.status === "active" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-slate-600 mt-0.5"
                      >
                        {desc}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Done message */}
          {doneCount === steps.length && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-center text-xs text-emerald-400 font-medium"
            >
              ✓ Bid encrypted with ZK proof — sending transaction…
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
