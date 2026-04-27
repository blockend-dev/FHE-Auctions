

import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
  if (!privateKey) throw new Error("Set PRIVATE_KEY in packages/cofhe-hardhat-starter/.env");

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

  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Deployer:", account.address);
  console.log("Balance: ", Number(balance) / 1e18, "ETH\n");

  const artifactPath = join(__dirname, "../artifacts/contracts/BlindReview.sol/BlindReview.json");
  const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));

  console.log("Deploying BlindReview...");
  const txHash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args: [],
  });
  console.log("tx:", txHash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  const addr = receipt.contractAddress!;
  console.log("BlindReview:", addr);

  console.log("\n=== Add to packages/frontend/.env.local ===");
  console.log(`NEXT_PUBLIC_REVIEW_CONTRACT=${addr}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
