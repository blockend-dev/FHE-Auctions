"use client";

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { arbitrumSepolia } from "../lib/wagmi";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const wrongChain = isConnected && chainId !== arbitrumSepolia.id;

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: connectors[0] })}
        className="btn-primary"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {wrongChain && (
        <button
          onClick={() => switchChain({ chainId: arbitrumSepolia.id })}
          className="btn-warn text-sm"
        >
          Switch to Arbitrum Sepolia
        </button>
      )}
      <div className="bg-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-300">
        {address?.slice(0, 6)}…{address?.slice(-4)}
      </div>
      <button onClick={() => disconnect()} className="btn-ghost text-sm">
        Disconnect
      </button>
    </div>
  );
}
