"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { useSubmitKYC, useClaimVerified, useKycResultHandle } from "../hooks/useIdentityGate";
import dynamic from "next/dynamic";

const EncryptionSteps = dynamic(
  () => import("./EncryptionSteps").then((m) => m.EncryptionSteps),
  { ssr: false },
);

interface Props {
  onClose: () => void;
  onVerified: () => void;
}

type Phase = "form" | "submitting" | "claiming" | "done";

export function KYCModal({ onClose, onVerified }: Props) {
  const { address } = useAccount();
  const [age,           setAge]           = useState(25);
  const [notRestricted, setNotRestricted] = useState(true);
  const [error,         setError]         = useState("");
  const [phase,         setPhase]         = useState<Phase>("form");

  const { submitKYC, steps, isEncrypting, isPending: isSubmitPending, isConfirming: isSubmitConfirming, isSuccess: isSubmitSuccess, reset: resetSubmit } = useSubmitKYC();
  const { claimVerified, isDecrypting, isPending: isClaimPending, isConfirming: isClaimConfirming, isSuccess: isClaimSuccess, error: claimError, reset: resetClaim } = useClaimVerified();
  const { data: kycHandle, refetch: refetchHandle } = useKycResultHandle(address);

  const isBusy = phase !== "form" && phase !== "done";

  // After submitKYC tx confirms → fetch the stored ctHash and call claimVerified
  useEffect(() => {
    if (!isSubmitSuccess || phase !== "submitting") return;
    setPhase("claiming");

    (async () => {
      try {
        const { data: handle } = await refetchHandle();
        if (!handle) throw new Error("Could not read KYC result handle from contract.");
        await claimVerified(handle as bigint);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg.includes("conditions not met") || msg.includes("ConditionsNotMet")
          ? "Verification failed — age < 18 or restricted jurisdiction."
          : msg.slice(0, 160) || "Claim failed");
        setPhase("form");
        resetSubmit();
        resetClaim();
      }
    })();
  }, [isSubmitSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  // After claimVerified confirms → success
  useEffect(() => {
    if (!isClaimSuccess) return;
    setPhase("done");
    onVerified();
    setTimeout(onClose, 2500);
  }, [isClaimSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  // Surface claim errors that bubble up outside the effect
  useEffect(() => {
    if (claimError && phase === "claiming") {
      setError(claimError.slice(0, 160));
      setPhase("form");
      resetSubmit();
      resetClaim();
    }
  }, [claimError]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    setError("");
    if (age < 1 || age > 150) { setError("Enter a valid age (1–150)"); return; }
    setPhase("submitting");
    try {
      await submitKYC(age, notRestricted ? 0 : 1);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.slice(0, 140) || "Transaction failed");
      setPhase("form");
      resetSubmit();
    }
  };

  const claimStatusText = isDecrypting
    ? "Decrypting result…"
    : isClaimPending
    ? "Confirm claim…"
    : isClaimConfirming
    ? "Finalizing…"
    : "Claiming…";

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
          {!isBusy && phase !== "done" && (
            <button onClick={onClose} className="absolute right-5 top-5 text-slate-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          )}

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
              <ShieldCheck size={16} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Identity Verification</h2>
              <p className="text-xs text-slate-500">FHE-encrypted · zero data exposure</p>
            </div>
          </div>

          {/* Privacy banner */}
          <div
            className="rounded-xl px-4 py-3 text-xs text-violet-300 leading-relaxed mb-5"
            style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}
          >
            Your age and jurisdiction are encrypted with FHE before leaving your browser.
            The contract checks conditions on ciphertext — your actual values are
            <span className="text-violet-400 font-medium"> never revealed on-chain</span>.
          </div>

          {/* Form — hidden while busy or done */}
          {phase === "form" && (
            <div className="space-y-5 mb-5">
              {/* Age input */}
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="label">Your Age</label>
                  <span className="text-xs font-bold text-violet-400">{age}</span>
                </div>
                <input
                  type="range" min={1} max={100} step={1}
                  value={age} onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-700 mt-0.5">
                  <span>1</span><span>50</span><span>100</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">Requirement: age ≥ 18</p>
              </div>

              {/* Jurisdiction toggle */}
              <div>
                <label className="label mb-2 block">Jurisdiction</label>
                <button
                  type="button"
                  onClick={() => setNotRestricted(!notRestricted)}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all border ${
                    notRestricted ? "text-emerald-300" : "text-rose-400"
                  }`}
                  style={
                    notRestricted
                      ? { background: "rgba(16,185,129,0.07)", borderColor: "rgba(16,185,129,0.25)" }
                      : { background: "rgba(239,68,68,0.07)",  borderColor: "rgba(239,68,68,0.25)"  }
                  }
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    notRestricted ? "border-emerald-400 bg-emerald-400" : "border-rose-400"
                  }`}>
                    {notRestricted && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span>
                    {notRestricted
                      ? "I am NOT in a restricted jurisdiction"
                      : "I AM in a restricted jurisdiction (verification will fail)"}
                  </span>
                </button>
                <p className="text-xs text-slate-600 mt-1">Requirement: unrestricted jurisdiction</p>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-xs text-rose-400">
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5" /> {error}
                </div>
              )}
            </div>
          )}

          {/* Encryption steps — shown during submitKYC phase */}
          {phase === "submitting" && (
            <div className="mb-5">
              <p className="text-xs text-slate-500 mb-3">
                {isEncrypting ? "Encrypting attributes…" : isSubmitPending ? "Confirm in wallet…" : "Confirming transaction…"}
              </p>
              <EncryptionSteps steps={steps} isEncrypting={isEncrypting} />
            </div>
          )}

          {/* Claim phase indicator */}
          {phase === "claiming" && (
            <div className="mb-5 rounded-xl px-4 py-4 flex items-center gap-3"
              style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
              <Loader2 size={16} className="text-violet-400 animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-violet-300">{claimStatusText}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isDecrypting
                    ? "Decrypting your FHE result via CoFHE permit…"
                    : "Submitting verification claim on-chain…"}
                </p>
              </div>
            </div>
          )}

          {/* Success */}
          {phase === "done" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-lg font-bold text-white">Identity Verified!</p>
              <p className="text-sm text-slate-400 mt-1">
                Your on-chain permit is active. Your raw data was never revealed.
              </p>
            </motion.div>
          )}

          {/* Action buttons */}
          {phase === "form" && (
            <div className="flex gap-3 mt-2">
              <button onClick={onClose} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <ShieldCheck size={14} /> Verify Identity
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
