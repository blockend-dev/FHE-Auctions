"use client";

import { useState } from "react";
import { useCreateRequest } from "../hooks/useRequest";

export function CreateRequestForm({ onCreated }: { onCreated?: () => void }) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("24");
  const [deposit, setDeposit] = useState("0.01");
  const [wPrice, setWPrice] = useState(40);
  const [wQuality, setWQuality] = useState(40);
  const [wDelivery, setWDelivery] = useState(20);
  const [error, setError] = useState("");

  const { createRequest, isPending, isConfirming, isSuccess } = useCreateRequest();
  const weightSum = wPrice + wQuality + wDelivery;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("Title required"); return; }
    if (weightSum !== 100) { setError(`Weights must sum to 100 (got ${weightSum})`); return; }
    try {
      await createRequest(title.trim(), Number(duration), deposit, wPrice, wQuality, wDelivery);
      setTitle("");
      onCreated?.();
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || "Failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-lg font-bold text-white">Create Decision Request</h2>
      <div>
        <label className="label">Project / Service Title</label>
        <input className="input w-full" placeholder="e.g. Cloud Migration…" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Duration (hours)</label>
          <input className="input w-full" type="number" min="1" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
        <div>
          <label className="label">Deposit (ETH)</label>
          <input className="input w-full" type="number" step="0.001" min="0.001" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Weights (sum to 100): Price {wPrice} · Quality {wQuality} · Delivery {wDelivery}</label>
        <div className="grid grid-cols-3 gap-2">
          {([["Price", wPrice, setWPrice], ["Quality", wQuality, setWQuality], ["Delivery", wDelivery, setWDelivery]] as const).map(([lbl, val, set]) => (
            <input key={lbl} className="input w-full" type="number" min={0} max={100}
              value={val} onChange={(e) => (set as (v: number) => void)(Number(e.target.value))} placeholder={lbl} />
          ))}
        </div>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {isSuccess && <p className="text-green-400 text-sm">Request created!</p>}
      <button type="submit" disabled={isPending || isConfirming} className="btn-primary w-full">
        {isPending ? "Confirm in wallet…" : isConfirming ? "Creating…" : "Create Request"}
      </button>
    </form>
  );
}
