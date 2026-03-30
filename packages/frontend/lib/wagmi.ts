import { createConfig, http } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

export const config = createConfig({
  chains: [arbitrumSepolia],
  connectors: [
    injected(),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "demo" }),
  ],
  transports: {
    [arbitrumSepolia.id]: http(),
  },
});

export { arbitrumSepolia };
