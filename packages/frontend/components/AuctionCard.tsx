"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { Clock, Tag, User, ShieldCheck, Gavel, RefreshCw, Lock } from "lucide-react";
import { useAuctionInfo, useHasBid, useEscrow, useClaimRefund } from "../hooks/useAuction";
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

export function AuctionCard({ auctionId, index }: Props) {
  const { address } = useAccount();
  const { data: info, refetch } = useAuctionInfo(auctionId);
  const { data: hasBid } = useHasBid(address, auctionId);
  const { data: escrow } = useEscrow(address, auctionId);
  const { claimRefund, isPending: isRefunding } = useClaimRefund();
  const [showBid, setShowBid] = useState(false);

  const endTime = info ? Number(info[3]) : 0;
  const { timeLeft, ended } = useCountdown(endTime);

  if (!info) {
    return (
      <div className="glass-card h-64 shimmer" />
    );
  }

  const [seller, itemName, , , highestBidder, settled, minBidWei] = info;
  const ZERO_ADDR = "0x0000000000000000000000000000000000000000";
  const isWinner = address && highestBidder.toLowerCase() === address.toLowerCase();
  const canRefund = settled && !isWinner && escrow && escrow > BigInt(0);
  const isLive = !settled && !ended;

  const statusBadge = settled
    ? <span className="badge-settled">Settled</span>
    : isLive
    ? (
      <span className="badge-live">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Live
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
            <h3 className="text-base font-bold text-white truncate">{itemName}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <User size={11} />
              <span className="font-mono">{seller.slice(0, 8)}…{seller.slice(-4)}</span>
            </div>
          </div>
          {statusBadge}
        </div>

        <div className="divider" />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="stat-box">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Tag size={11} /> Min Bid
            </div>
            <div className="text-sm font-bold text-white">{formatEther(minBidWei)} ETH</div>
          </div>

          <div className="stat-box">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Clock size={11} /> {ended ? "Ended" : "Ends in"}
            </div>
            <div className={clsx("text-sm font-bold", isLive ? "text-emerald-400" : "text-slate-400")}>
              {timeLeft}
            </div>
          </div>
        </div>

        {/* FHE privacy badge */}
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
          style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)" }}
        >
          <ShieldCheck size={13} className="text-violet-400 flex-shrink-0" />
          <span className="text-slate-400">
            All bids are <span className="text-violet-400 font-medium">FHE-encrypted</span> —
            no bid amounts visible on-chain
          </span>
        </div>

        {/* Winner reveal */}
        {settled && highestBidder !== ZERO_ADDR && (
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            <Gavel size={13} className="text-emerald-400 flex-shrink-0" />
            <span className="text-slate-300">
              Winner:{" "}
              {isWinner ? (
                <span className="text-emerald-400 font-semibold">You 🎉</span>
              ) : (
                <span className="font-mono text-slate-400">
                  {highestBidder.slice(0, 8)}…{highestBidder.slice(-4)}
                </span>
              )}
            </span>
          </div>
        )}

        {/* Your bid status */}
        {hasBid && !settled && (
          <div className="text-center text-xs text-violet-300 font-medium py-1">
            🔒 Your encrypted bid is live
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-2 mt-auto">
          {isLive && !hasBid && address && (
            <button
              onClick={() => setShowBid(true)}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Lock size={14} />
              Place Encrypted Bid
            </button>
          )}

          {canRefund && (
            <button
              onClick={() => claimRefund(auctionId).then(() => refetch())}
              disabled={isRefunding}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <RefreshCw size={13} className={isRefunding ? "animate-spin" : ""} />
              {isRefunding ? "Claiming…" : "Claim Refund"}
            </button>
          )}

          {!address && isLive && (
            <p className="flex-1 text-center text-sm text-slate-500 py-2">
              Connect wallet to bid
            </p>
          )}

          {hasBid && isLive && (
            <p className="flex-1 text-center text-sm text-slate-500 py-2">
              Bid submitted ✓
            </p>
          )}
        </div>
      </motion.div>

      {showBid && (
        <BidModal
          auctionId={auctionId}
          itemName={itemName}
          minBidWei={minBidWei}
          onClose={() => { setShowBid(false); refetch(); }}
        />
      )}
    </>
  );
}

