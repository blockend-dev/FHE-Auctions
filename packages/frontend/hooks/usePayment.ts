"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, keccak256, toBytes } from "viem";
import { useCallback } from "react";
import { PAYMENT_ABI, PAYMENT_ADDRESS } from "../lib/contracts";
import { useEncryptBid } from "./useCofhe";
import { arbitrumSepolia } from "../lib/wagmi";

const CHAIN_ID = arbitrumSepolia.id;

export function useReceivable(address: `0x${string}` | undefined) {
  return useReadContract({
    address: PAYMENT_ADDRESS,
    abi: PAYMENT_ABI,
    functionName: "getReceivable",
    args: [address!],
    query: { enabled: !!address, refetchInterval: 15_000 },
  });
}

export function usePaymentInfo(id: bigint) {
  return useReadContract({
    address: PAYMENT_ADDRESS,
    abi: PAYMENT_ABI,
    functionName: "getPaymentInfo",
    args: [id],
  });
}

// ── Send confidential payment ───────────────────────────────────────────────

export function useSendPayment() {
  const { encryptBid, steps, isEncrypting, resetSteps } = useEncryptBid();
  const { writeContractAsync, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const sendPayment = useCallback(
    async (recipient: `0x${string}`, amountEth: string, reference: string) => {
      const amountWei = parseEther(amountEth);

      // Step 1: encrypt the amount client-side
      const encrypted = await encryptBid(amountWei);

      // Step 2: hash the reference string → bytes32
      const refHash = reference.trim()
        ? keccak256(toBytes(reference.trim()))
        : `0x${"00".repeat(32)}` as `0x${string}`;

      // Step 3: send with full InEuint256 struct + ETH value
      await writeContractAsync({
        address: PAYMENT_ADDRESS,
        abi: PAYMENT_ABI,
        functionName: "sendPayment",
        args: [recipient, {
          ctHash: encrypted.ctHash,
          securityZone: encrypted.securityZone,
          utype: encrypted.utype,
          signature: encrypted.signature as `0x${string}`,
        }, refHash],
        value: amountWei,
        chainId: CHAIN_ID,
      });
    },
    [encryptBid, writeContractAsync]
  );

  const reset = useCallback(() => resetSteps(), [resetSteps]);

  return { sendPayment, steps, isEncrypting, isPending, isConfirming, isSuccess, reset };
}

// ── Claim payment ───────────────────────────────────────────────────────────

export function useClaimPayment() {
  const { writeContractAsync, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const claimPayment = useCallback(
    async (id: bigint) => {
      await writeContractAsync({
        address: PAYMENT_ADDRESS,
        abi: PAYMENT_ABI,
        functionName: "claimPayment",
        args: [id],
        chainId: CHAIN_ID,
      });
    },
    [writeContractAsync]
  );

  return { claimPayment, isPending, isConfirming, isSuccess };
}
