import { createConfig, http, fallback } from "wagmi";
import { arbitrumSepolia as _arbitrumSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";

// Add a 30% buffer to maxFeePerGas so the tx is never rejected due to base fee
// fluctuating between wagmi estimation and MetaMask submission.
const arbitrumSepolia = defineChain({
  ..._arbitrumSepolia,
  fees: {
    async estimateFeesPerGas({ block }: { block: any }) {
      const baseFee: bigint = block?.baseFeePerGas ?? BigInt(25_000_000);
      return {
        maxFeePerGas: baseFee + baseFee / BigInt(3),  // baseFee + ~33% headroom
        maxPriorityFeePerGas: BigInt(1_500_000),      // 1.5 Mwei tip
      };
    },
  },
});

export const config = createConfig({
  chains: [arbitrumSepolia],
  connectors: [injected()],
  transports: {
    [arbitrumSepolia.id]: fallback([
      http("https://sepolia-rollup.arbitrum.io/rpc"),
      http("https://rpc.ankr.com/arbitrum_sepolia"),
    ]),
  },
  ssr: true,
});

export { arbitrumSepolia };
