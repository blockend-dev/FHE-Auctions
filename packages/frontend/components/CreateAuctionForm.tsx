"use client";

import { useState } from "react";
import { useCreateAuction } from "../hooks/useAuction";

export function CreateAuctionForm({ onCreated }: { onCreated?: () => void }) {
  const [itemName, setItemName] = useState("");
  const [duration, setDuration] = useState("24");
  const [minBid, setMinBid] = useState("0.01");
  const [error, setError] = useState("");

  const { createAuction, isPending, isConfirming, isSuccess } = useCreateAuction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!itemName.trim()) { setError("Item name required"); return; }
    try {
      await createAuction(itemName.trim(), Number(duration), minBid);
      setItemName("");
      onCreated?.();
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || "Failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-lg font-bold text-white">Create Sealed-Bid Auction</h2>

      <div>
        <label className="label">Item Name</label>
        <input
          className="input w-full"
          placeholder="e.g. Rare NFT #42"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Duration (hours)</label>
          <input
            className="input w-full"
            type="number"
            min="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Min Bid (ETH)</label>
          <input
            className="input w-full"
            type="number"
            step="0.001"
            min="0.001"
            value={minBid}
            onChange={(e) => setMinBid(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {isSuccess && <p className="text-green-400 text-sm">Auction created!</p>}

      <button
        type="submit"
        disabled={isPending || isConfirming}
        className="btn-primary w-full"
      >
        {isPending ? "Confirm in wallet…" : isConfirming ? "Creating…" : "Create Auction"}
      </button>
    </form>
  );
}
