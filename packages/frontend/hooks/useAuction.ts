"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { useState, useCallback } from "react";
import { AUCTION_ABI, AUCTION_ADDRESS } from "../lib/contracts";
import { useEncryptBid } from "./useCofhe";
import { arbitrumSepolia } from "../lib/wagmi";

const CHAIN_ID = arbitrumSepolia.id;

export function useAuctionInfo(id: bigint) {
  return useReadContract({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    functionName: "getAuction",
    args: [id],
    query: { refetchInterval: 10_000 },
  });
}

export function useAuctionCount() {
  return useReadContract({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    functionName: "auctionCount",
    query: { refetchInterval: 15_000 },
  });
}

export function useHasBid(bidder: `0x${string}` | undefined, auctionId: bigint) {
  return useReadContract({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    functionName: "hasBid",
    args: [bidder!, auctionId],
    query: { enabled: !!bidder },
  });
}

export function useEscrow(bidder: `0x${string}` | undefined, auctionId: bigint) {
  return useReadContract({
    address: AUCTION_ADDRESS,
    abi: AUCTION_ABI,
    functionName: "getEscrow",
    args: [bidder!, auctionId],
    query: { enabled: !!bidder },
  });
}

// ── Place encrypted bid ────────────────────────────────────────────────────

export function usePlaceBid() {
  const { encryptBid, steps, isEncrypting, resetSteps } = useEncryptBid();
  const { writeContractAsync, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const [error, setError] = useState<string | null>(null);

  const placeBid = useCallback(
    async (auctionId: bigint, bidEth: string) => {
      setError(null);
      const bidWei = parseEther(bidEth);

      // Step 1: encrypt client-side with ZK proof
      const encrypted = await encryptBid(bidWei);

      // Step 2: send tx with encrypted input (full InEuint256 struct)
      await writeContractAsync({
        address: AUCTION_ADDRESS,
        abi: AUCTION_ABI,
        functionName: "placeBid",
        args: [auctionId, {
          ctHash: encrypted.ctHash,
          securityZone: encrypted.securityZone,
          utype: encrypted.utype,
          signature: encrypted.signature as `0x${string}`,
        }],
        value: bidWei,
        chainId: CHAIN_ID,
      });
    },
    [encryptBid, writeContractAsync]
  );

  const reset = useCallback(() => {
    resetSteps();
    setError(null);
  }, [resetSteps]);

  return { placeBid, steps, isEncrypting, isPending, isConfirming, isSuccess, error, reset };
}

// ── Create auction ─────────────────────────────────────────────────────────

export function useCreateAuction() {
  const { writeContractAsync, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const createAuction = useCallback(
    async (itemName: string, durationHours: number, minBidEth: string) => {
      await writeContractAsync({
        address: AUCTION_ADDRESS,
        abi: AUCTION_ABI,
        functionName: "createAuction",
        args: [itemName, BigInt(durationHours * 3600), parseEther(minBidEth)],
        chainId: CHAIN_ID,
      });
    },
    [writeContractAsync]
  );

  return { createAuction, isPending, isConfirming, isSuccess };
}

// ── Claim refund ───────────────────────────────────────────────────────────

export function useClaimRefund() {
  const { writeContractAsync, data: txHash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const claimRefund = useCallback(
    async (auctionId: bigint) => {
      await writeContractAsync({
        address: AUCTION_ADDRESS,
        abi: AUCTION_ABI,
        functionName: "claimRefund",
        args: [auctionId],
        chainId: CHAIN_ID,
      });
    },
    [writeContractAsync]
  );

  return { claimRefund, isPending, isSuccess };
}
