"use client";

import { motion } from "framer-motion";
import { formatEther } from "viem";
import { Inbox, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react";
import { useReceivable, usePaymentInfo, useClaimPayment } from "../hooks/usePayment";

function PaymentRow({ id, onClaimed }: { id: bigint; onClaimed: () => void }) {
  const { data } = usePaymentInfo(id);
  const { claimPayment, isPending, isConfirming, isSuccess } = useClaimPayment();

  if (!data) return null;
  const [sender, , escrowed, timestamp, claimed] = data as [string, string, bigint, bigint, boolean, `0x${string}`];

  const isBusy = isPending || isConfirming;
  const done = claimed || isSuccess;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 flex items-center justify-between gap-4"
      style={{
        background: done ? "rgba(16,185,129,0.05)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${done ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.08)"}`,
      }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-slate-500">From</span>
          <span className="text-xs font-mono text-slate-300 truncate">
            {sender.slice(0, 6)}…{sender.slice(-4)}
          </span>
          <span className="text-xs text-slate-600">·</span>
          <span className="text-xs text-slate-500">
            {new Date(Number(timestamp) * 1000).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">{formatEther(escrowed)} ETH</span>
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(139,92,246,0.12)", color: "rgba(167,139,250,1)", border: "1px solid rgba(139,92,246,0.2)" }}>
            <EyeOff size={10} /> Amount hidden on-chain
          </span>
        </div>
      </div>

      {done ? (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 shrink-0">
          <CheckCircle2 size={14} /> Claimed
        </div>
      ) : (
        <button
          onClick={async () => { await claimPayment(id); onClaimed(); }}
          disabled={isBusy}
          className="shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399" }}
        >
          {isBusy ? <Loader2 size={12} className="animate-spin" /> : "Claim ETH"}
        </button>
      )}
    </motion.div>
  );
}

interface Props {
  address: `0x${string}`;
}

export function PaymentInbox({ address }: Props) {
  const { data: ids, refetch } = useReceivable(address);

  const paymentIds = (ids as bigint[] | undefined) ?? [];

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4">
        <Inbox size={16} className="text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">Incoming Payments</h3>
        {paymentIds.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            {paymentIds.length}
          </span>
        )}
      </div>

      {paymentIds.length === 0 ? (
        <div className="text-center py-8 text-slate-600 text-sm">
          No incoming payments
        </div>
      ) : (
        <div className="space-y-3">
          {paymentIds.map((id) => (
            <PaymentRow key={id.toString()} id={id} onClaimed={() => refetch()} />
          ))}
        </div>
      )}
    </div>
  );
}
