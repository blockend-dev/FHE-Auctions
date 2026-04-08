"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { isAddress } from "viem";
import { useSendPayment } from "../hooks/usePayment";
import dynamic from "next/dynamic";

const EncryptionSteps = dynamic(() => import("./EncryptionSteps").then(m => m.EncryptionSteps), { ssr: false });

interface Props {
  onClose: () => void;
}

export function SendPaymentModal({ onClose }: Props) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");

  const { sendPayment, steps, isEncrypting, isPending, isConfirming, isSuccess, reset } = useSendPayment();
  const isBusy = isEncrypting || isPending || isConfirming;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isAddress(recipient)) { setError("Enter a valid recipient address"); return; }
    if (!amount || Number(amount) <= 0) { setError("Enter a valid amount"); return; }

    try {
      await sendPayment(recipient as `0x${string}`, amount, reference);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.slice(0, 120) || "Transaction failed");
      reset();
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

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.22)" }}>
              <Send size={16} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Send Confidential Payment</h2>
              <p className="text-xs text-slate-500">Amount encrypted on-chain — only recipient can see it</p>
            </div>
          </div>

          {/* Privacy callout */}
          <div className="rounded-xl px-4 py-3 mb-5 text-xs text-emerald-300 leading-relaxed flex gap-2.5"
            style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <ShieldCheck size={14} className="mt-0.5 shrink-0" />
            The payment amount is FHE-encrypted before it leaves your browser. No one on-chain can read it — only the recipient with a permit.
          </div>

          {isSuccess ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <CheckCircle2 size={52} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-lg font-bold text-white">Payment Sent!</p>
              <p className="text-sm text-slate-400 mt-1">The recipient can now claim their ETH</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="label">Recipient Address</label>
                <input
                  className="input-glass font-mono text-sm"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => { setRecipient(e.target.value); setError(""); }}
                  disabled={isBusy}
                />
              </div>

              <div>
                <label className="label">Amount (ETH)</label>
                <div className="relative">
                  <input
                    className="input-glass pr-16"
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="0.05"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setError(""); }}
                    disabled={isBusy}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">ETH</span>
                </div>
              </div>

              <div>
                <label className="label">Reference <span className="text-slate-600">(optional)</span></label>
                <input
                  className="input-glass"
                  placeholder="Invoice #42, Salary March…"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  disabled={isBusy}
                />
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400">
                  <AlertCircle size={12} /> {error}
                </div>
              )}

              <EncryptionSteps steps={steps} isEncrypting={isEncrypting} />

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} disabled={isBusy} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={isBusy || !recipient || !amount} className="btn-emerald flex-1 flex items-center justify-center gap-2">
                  <Send size={14} />
                  {isEncrypting ? "Encrypting…" : isPending ? "Confirm…" : isConfirming ? "Sending…" : "Send Private"}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
