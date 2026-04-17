"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useWalletClient, usePublicClient } from "wagmi";
import { Encryptable, EncryptStep } from "@cofhe/sdk";
import { getCofheClient } from "../lib/cofhe";
import type { CofheClient } from "@cofhe/sdk";

export type EncryptionStep = {
  step: EncryptStep;
  status: "idle" | "active" | "done";
  duration?: number;
};

const STEP_ORDER: EncryptStep[] = [
  EncryptStep.InitTfhe,
  EncryptStep.FetchKeys,
  EncryptStep.Pack,
  EncryptStep.Prove,
  EncryptStep.Verify,
];

const STEP_LABELS: Record<EncryptStep, string> = {
  [EncryptStep.InitTfhe]: "Initialize TFHE",
  [EncryptStep.FetchKeys]: "Fetch FHE Keys",
  [EncryptStep.Pack]: "Pack Data",
  [EncryptStep.Prove]: "Generate ZK Proof",
  [EncryptStep.Verify]: "Verify & Submit",
};

const STEP_ICONS: Record<EncryptStep, string> = {
  [EncryptStep.InitTfhe]: "⚙️",
  [EncryptStep.FetchKeys]: "🔑",
  [EncryptStep.Pack]: "📦",
  [EncryptStep.Prove]: "🔐",
  [EncryptStep.Verify]: "✅",
};

export { STEP_LABELS, STEP_ICONS, STEP_ORDER };

export function useCofheClient() {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const connected = useRef(false);
  const [client, setClient] = useState<CofheClient | null>(null);

  useEffect(() => {
    if (!walletClient || !publicClient || connected.current) return;

    (async () => {
      try {
        const cofhe = await getCofheClient();
        if (!cofhe) return;

        const { WagmiAdapter } = await import("@cofhe/sdk/adapters");
        const { publicClient: pc, walletClient: wc } = await WagmiAdapter(
          walletClient,
          publicClient as any
        );
        await cofhe.connect(pc as any, wc as any);
        connected.current = true;
        setClient(cofhe);
      } catch (e) {
        console.error("[CoFHE] connect failed:", e);
      }
    })();
  }, [walletClient, publicClient]);

  return client;
}

// ── Single-value encryption (used by ConfidentialPayment) ─────────────────────

export function useEncryptBid() {
  const client = useCofheClient();
  const [steps, setSteps] = useState<EncryptionStep[]>(
    STEP_ORDER.map((s) => ({ step: s, status: "idle" }))
  );
  const [isEncrypting, setIsEncrypting] = useState(false);

  const resetSteps = useCallback(() => {
    setSteps(STEP_ORDER.map((s) => ({ step: s, status: "idle" })));
  }, []);

  const encryptBid = useCallback(
    async (bidWei: bigint) => {
      if (!client) throw new Error("CoFHE client not ready");
      setIsEncrypting(true);
      resetSteps();

      try {
        const [encrypted] = await client
          .encryptInputs([Encryptable.uint128(bidWei)])
          .onStep((step, ctx) => {
            setSteps((prev) =>
              prev.map((s) => {
                if (s.step !== step) return s;
                if (ctx?.isStart) return { ...s, status: "active" };
                if (ctx?.isEnd) return { ...s, status: "done", duration: ctx.duration };
                return s;
              })
            );
          })
          .execute();

        return encrypted;
      } finally {
        setIsEncrypting(false);
      }
    },
    [client, resetSteps]
  );

  return { encryptBid, steps, isEncrypting, resetSteps };
}

// ── Three-factor encryption for vendor proposals ───────────────────────────────
//
// All three factors are 0–100 integer scores (higher = better):
//   price    — price-competitiveness (100 = cheapest)
//   quality  — quality score         (100 = best)
//   delivery — delivery speed        (100 = fastest)
//
// Encrypted together in one ZK-proof pass for efficiency.

export function useEncryptProposal() {
  const client = useCofheClient();
  const [steps, setSteps] = useState<EncryptionStep[]>(
    STEP_ORDER.map((s) => ({ step: s, status: "idle" }))
  );
  const [isEncrypting, setIsEncrypting] = useState(false);

  const resetSteps = useCallback(() => {
    setSteps(STEP_ORDER.map((s) => ({ step: s, status: "idle" })));
  }, []);

  const encryptProposal = useCallback(
    async (price: number, quality: number, delivery: number) => {
      if (!client) throw new Error("CoFHE client not ready");
      setIsEncrypting(true);
      resetSteps();

      try {
        const [encPrice, encQuality, encDelivery] = await client
          .encryptInputs([
            Encryptable.uint128(BigInt(price)),
            Encryptable.uint128(BigInt(quality)),
            Encryptable.uint128(BigInt(delivery)),
          ])
          .onStep((step, ctx) => {
            setSteps((prev) =>
              prev.map((s) => {
                if (s.step !== step) return s;
                if (ctx?.isStart) return { ...s, status: "active" };
                if (ctx?.isEnd) return { ...s, status: "done", duration: ctx.duration };
                return s;
              })
            );
          })
          .execute();

        return { encPrice, encQuality, encDelivery };
      } finally {
        setIsEncrypting(false);
      }
    },
    [client, resetSteps]
  );

  return { encryptProposal, steps, isEncrypting, resetSteps };
}
