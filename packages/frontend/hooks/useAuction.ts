"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { parseEther } from "viem";
import { useState, useCallback } from "react";
import { VENDOR_ABI, VENDOR_ADDRESS } from "../lib/contracts";
import { useEncryptProposal } from "./useCofhe";
import { arbitrumSepolia } from "../lib/wagmi";

const CHAIN_ID = arbitrumSepolia.id;

// ── Read hooks ─────────────────────────────────────────────────────────────────

export function useRequestInfo(id: bigint) {
  return useReadContract({
    address: VENDOR_ADDRESS,
    abi: VENDOR_ABI,
    functionName: "getRequest",
    args: [id],
    query: { refetchInterval: 10_000 },
  });
}

export function useRequestCount() {
  return useReadContract({
    address: VENDOR_ADDRESS,
    abi: VENDOR_ABI,
    functionName: "requestCount",
    query: { refetchInterval: 15_000 },
  });
}

export function useHasSubmitted(vendor: `0x${string}` | undefined, requestId: bigint) {
  return useReadContract({
    address: VENDOR_ADDRESS,
    abi: VENDOR_ABI,
    functionName: "hasSubmitted",
    args: [vendor!, requestId],
    query: { enabled: !!vendor },
  });
}

export function useEscrow(vendor: `0x${string}` | undefined, requestId: bigint) {
  return useReadContract({
    address: VENDOR_ADDRESS,
    abi: VENDOR_ABI,
    functionName: "getEscrow",
    args: [vendor!, requestId],
    query: { enabled: !!vendor },
  });
}

// ── Submit encrypted 3-factor proposal ────────────────────────────────────────

export function useSubmitProposal() {
  const { encryptProposal, steps, isEncrypting, resetSteps } = useEncryptProposal();
  const { writeContractAsync, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  const submitProposal = useCallback(
    async (
      requestId: bigint,
      price: number,    // 0-100: price-competitiveness (100 = cheapest)
      quality: number,  // 0-100: quality score
      delivery: number, // 0-100: delivery speed (100 = fastest)
      depositWei: bigint
    ) => {
      setError(null);

      // Step 1: encrypt all 3 factors in one ZK-proof pass (10-30s)
      const { encPrice, encQuality, encDelivery } = await encryptProposal(price, quality, delivery);

      // Step 2: fetch fresh fees — stale estimate after ZK proof causes rejection
      const fees = await publicClient!.estimateFeesPerGas();
      const maxFeePerGas = fees.maxFeePerGas! * BigInt(4) / BigInt(3); // add 33% headroom for network volatility between estimation and submission

      // Step 3: submit with all 3 encrypted InEuint128 structs + deposit
      await writeContractAsync({
        address: VENDOR_ADDRESS,
        abi: VENDOR_ABI,
        functionName: "submitProposal",
        args: [
          requestId,
          { ctHash: encPrice.ctHash, securityZone: encPrice.securityZone, utype: encPrice.utype, signature: encPrice.signature as `0x${string}` },
          { ctHash: encQuality.ctHash, securityZone: encQuality.securityZone, utype: encQuality.utype, signature: encQuality.signature as `0x${string}` },
          { ctHash: encDelivery.ctHash, securityZone: encDelivery.securityZone, utype: encDelivery.utype, signature: encDelivery.signature as `0x${string}` },
        ],
        value: depositWei,
        chainId: CHAIN_ID,
        maxFeePerGas,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas ?? BigInt(1_500_000),
      });
    },
    [encryptProposal, writeContractAsync, publicClient]
  );

  const reset = useCallback(() => {
    resetSteps();
    setError(null);
  }, [resetSteps]);

  return { submitProposal, steps, isEncrypting, isPending, isConfirming, isSuccess, error, reset };
}

// ── Create decision request ────────────────────────────────────────────────────

export function useCreateRequest() {
  const { writeContractAsync, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const createRequest = useCallback(
    async (
      title: string,
      durationHours: number,
      depositEth: string,
      wPrice: number,
      wQuality: number,
      wDelivery: number
    ) => {
      await writeContractAsync({
        address: VENDOR_ADDRESS,
        abi: VENDOR_ABI,
        functionName: "createRequest",
        args: [title, BigInt(durationHours * 3600), parseEther(depositEth), wPrice, wQuality, wDelivery],
        chainId: CHAIN_ID,
      });
    },
    [writeContractAsync]
  );

  return { createRequest, isPending, isConfirming, isSuccess };
}

// ── Claim deposit (non-winning vendors) ───────────────────────────────────────

export function useClaimDeposit() {
  const { writeContractAsync, data: txHash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const claimDeposit = useCallback(
    async (requestId: bigint) => {
      await writeContractAsync({
        address: VENDOR_ADDRESS,
        abi: VENDOR_ABI,
        functionName: "claimDeposit",
        args: [requestId],
        chainId: CHAIN_ID,
      });
    },
    [writeContractAsync]
  );

  return { claimDeposit, isPending, isSuccess };
}

// ── Back-compat aliases (used by any stale imports) ────────────────────────────
export const useAuctionInfo = useRequestInfo;
export const useAuctionCount = useRequestCount;
export const useHasBid = useHasSubmitted;
export const usePlaceBid = useSubmitProposal;
export const useCreateAuction = useCreateRequest;
export const useClaimRefund = useClaimDeposit;
