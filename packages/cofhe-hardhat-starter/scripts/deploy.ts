

import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

function readArtifact(name: string) {
  const p = join(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`);
  return JSON.parse(readFileSync(p, "utf8"));
}

async function main() {
  const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
  if (!privateKey || privateKey === "0x_your_private_key_here") {
    throw new Error(
      "Set PRIVATE_KEY in packages/cofhe-hardhat-starter/.env\n" +
      "Example: PRIVATE_KEY=0xabc123..."
    );
  }

  const account = privateKeyToAccount(privateKey);
  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http("https://sepolia-rollup.arbitrum.io/rpc"),
  });
  const walletClient = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http("https://sepolia-rollup.arbitrum.io/rpc"),
  });
+
  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Deployer:", account.address);
  console.log("Balance:", Number(balance) / 1e18, "ETH\n");

  if (balance < BigInt(1e14)) {
    throw new Error("Insufficient balance. Get testnet ETH from https://faucet.quicknode.com/arbitrum/sepolia");
  }

  // Deploy VendorSelection
  console.log("Deploying VendorSelection...");
  const vendorArtifact = readArtifact("VendorSelection");
  const vendorHash = await walletClient.deployContract({
    abi: vendorArtifact.abi,
    bytecode: vendorArtifact.bytecode,
    args: [],
  });
  console.log("tx:", vendorHash);
  const vendorReceipt = await publicClient.waitForTransactionReceipt({ hash: vendorHash });
  const vendorAddr = vendorReceipt.contractAddress!;
  console.log("VendorSelection:", vendorAddr);

  // Deploy ConfidentialPayment
  console.log("\nDeploying ConfidentialPayment...");
  const paymentArtifact = readArtifact("ConfidentialPayment");
  const paymentHash = await walletClient.deployContract({
    abi: paymentArtifact.abi,
    bytecode: paymentArtifact.bytecode,
    args: [],
  });
  console.log("tx:", paymentHash);
  const paymentReceipt = await publicClient.waitForTransactionReceipt({ hash: paymentHash });
  const paymentAddr = paymentReceipt.contractAddress!;
  console.log("ConfidentialPayment:", paymentAddr);

  console.log("\n=== Copy these into packages/frontend/.env.local ===");
  console.log(`NEXT_PUBLIC_VENDOR_CONTRACT=${vendorAddr}`);
  console.log(`NEXT_PUBLIC_PAYMENT_CONTRACT=${paymentAddr}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
