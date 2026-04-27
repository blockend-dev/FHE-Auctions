"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { Clock, Coins, User, ShieldCheck, Trophy, RefreshCw, Lock } from "lucide-react";
import { useRequestInfo, useHasSubmitted, useEscrow, useClaimDeposit } from "../hooks/useAuction";
import dynamic from "next/dynamic";
import clsx from "clsx";

const BidModal = dynamic(() => import("./BidModal").then(mod => mod.BidModal), { ssr: false });

interface Props {
  auctionId: bigint;
  index: number;
}

function useCountdown(endTime: number) {
  const [timeLeft, setTimeLeft] = useState("");
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = endTime - Math.floor(Date.now() / 1000);
      if (diff <= 0) { setTimeLeft("Ended"); setEnded(true); return; }
      setEnded(false);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setTimeLeft(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return { timeLeft, ended };
}

function WeightPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
      style={{ background: `${color}12`, border: `1px solid ${color}30`, color }}>
      <span className="font-bold">{value}</span>
      <span className="text-xs opacity-70">{label}</span>
    </div>
  );
}

export function AuctionCard({ auctionId, index }: Props) {
  const { address } = useAccount();
  const { data: info, refetch } = useRequestInfo(auctionId);
  const { data: hasSubmitted } = useHasSubmitted(address, auctionId);
  const { data: escrow } = useEscrow(address, auctionId);
  const { claimDeposit, isPending: isClaiming } = useClaimDeposit();
  const [showProposal, setShowProposal] = useState(false);

  // getRequest returns: [requester, title, startTime, endTime, bestVendor, settled, depositWei, wPrice, wQuality, wDelivery]
  const endTime = info ? Number(info[3]) : 0;
  const { timeLeft, ended } = useCountdown(endTime);

  if (!info) {
    return <div className="glass-card h-64 shimmer" />;
  }

  const [requester, title, , , bestVendor, settled, depositWei, wPrice, wQuality, wDelivery] = info;
  const ZERO_ADDR = "0x0000000000000000000000000000000000000000";
  const isWinner = address && bestVendor.toLowerCase() === address.toLowerCase();
  const canClaim = settled && !isWinner && escrow && escrow > BigInt(0);
  const isLive = !settled && !ended;

  const statusBadge = settled
    ? <span className="badge-settled">Settled</span>
    : isLive
    ? (
      <span className="badge-live">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Active
      </span>
    )
    : <span className="badge-ended">Ended</span>;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.07 }}
        className="glass-card flex flex-col gap-4"
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white truncate">{title}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <User size={11} />
              <span className="font-mono">{requester.slice(0, 8)}…{requester.slice(-4)}</span>
            </div>
          </div>
          {statusBadge}
        </div>

        <div className="divider" />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="stat-box">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Coins size={11} /> Deposit
            </div>
            <div className="text-sm font-bold text-white">{formatEther(depositWei)} ETH</div>
          </div>

          <div className="stat-box">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Clock size={11} /> {ended ? "Ended" : "Closes in"}
            </div>
            <div className={clsx("text-sm font-bold", isLive ? "text-emerald-400" : "text-slate-400")}>
              {timeLeft}
            </div>
          </div>
        </div>

        {/* Weight pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-600">Weights:</span>
          <WeightPill label="Price" value={Number(wPrice)} color="#8b5cf6" />
          <WeightPill label="Quality" value={Number(wQuality)} color="#22d3ee" />
          <WeightPill label="Delivery" value={Number(wDelivery)} color="#10b981" />
        </div>

        {/* FHE privacy badge */}
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
          style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)" }}
        >
          <ShieldCheck size={13} className="text-violet-400 flex-shrink-0" />
          <span className="text-slate-400">
            Proposals are <span className="text-violet-400 font-medium">FHE-encrypted</span> —
            scores computed without revealing inputs
          </span>
        </div>

        {/* Selected vendor reveal */}
        {settled && bestVendor !== ZERO_ADDR && (
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            <Trophy size={13} className="text-emerald-400 flex-shrink-0" />
            <span className="text-slate-300">
              Selected vendor:{" "}
              {isWinner ? (
                <span className="text-emerald-400 font-semibold">You 🎉</span>
              ) : (
                <span className="font-mono text-slate-400">
                  {bestVendor.slice(0, 8)}…{bestVendor.slice(-4)}
                </span>
              )}
            </span>
          </div>
        )}

        {/* Proposal status */}
        {hasSubmitted && !settled && (
          <div className="text-center text-xs text-violet-300 font-medium py-1">
            🔒 Your encrypted proposal is live
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-2 mt-auto">
          {isLive && !hasSubmitted && address && (
            <button
              onClick={() => setShowProposal(true)}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Lock size={14} />
              Submit Proposal
            </button>
          )}

          {canClaim && (
            <button
              onClick={() => claimDeposit(auctionId).then(() => refetch())}
              disabled={isClaiming}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <RefreshCw size={13} className={isClaiming ? "animate-spin" : ""} />
              {isClaiming ? "Claiming…" : "Claim Deposit"}
            </button>
          )}

          {!address && isLive && (
            <p className="flex-1 text-center text-sm text-slate-500 py-2">
              Connect wallet to submit
            </p>
          )}

          {hasSubmitted && isLive && (
            <p className="flex-1 text-center text-sm text-slate-500 py-2">
              Proposal submitted ✓
            </p>
          )}
        </div>
      </motion.div>

      {showProposal && (
        <BidModal
          requestId={auctionId}
          title={title}
          depositWei={depositWei}
          weights={{ wPrice: Number(wPrice), wQuality: Number(wQuality), wDelivery: Number(wDelivery) }}
          onClose={() => { setShowProposal(false); refetch(); }}
        />
      )}
    </>
  );
}
