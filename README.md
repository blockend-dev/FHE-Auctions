# Sealect — Confidential Vendor Selection · Fhenix CoFHE

> FHE-powered vendor selection engine. Vendors submit encrypted multi-factor proposals — price, quality, delivery — scored on-chain without ever revealing raw inputs.

## What's Built

### Smart Contracts (Solidity)

**1. VendorSelection.sol**
- Requesters post vendor selection requests with configurable weights (price / quality / delivery)
- Vendors submit 3-factor proposals encrypted with FHE — scores never touch plaintext on-chain
- Weighted score computed fully on ciphertext: `score = wPrice·ePrice + wQuality·eQuality + wDelivery·eDelivery`
- Best vendor tracked in encrypted state via `FHE.gt` + `FHE.select` — no leakage of any losing proposal
- Deposit model: vendors lock ETH; winner's deposit goes to requester, losers reclaim theirs

**2. ConfidentialPayment.sol**
- Encrypted ETH payment transfers using FHE
- Payment amounts stay encrypted until claim
- Powered by Privara SDK patterns

### Tech Stack

| Layer | Tools |
|-------|-------|
| **Smart Contract Dev** | Hardhat + CoFHE Plugin (TS) |
| **Encryption** | @fhenixprotocol/cofhe-contracts |
| **Testnet** | Arbitrum Sepolia (421614) |
| **Frontend** | Next.js 14 + wagmi v2 + CoFHE React hooks |
| **Payment Integration** | @reineira-os/sdk (Privara) |

## Deployed Contracts (Arbitrum Sepolia)

| Contract | Address |
|----------|---------|
| VendorSelection | `0x1f4b388c46e0f487629028a24908001480fea069` |
| ConfidentialPayment | `0x83640911f7dacd52cd50c0d25d929be7057cbbfa` |

## Quick Start

### 1. Build & Test Smart Contracts

```bash
cd packages/cofhe-hardhat-starter

pnpm install
pnpm compile
pnpm test

# Deploy to Arbitrum Sepolia
PRIVATE_KEY=0x... ARBITRUM_SEPOLIA_RPC_URL=https://... \
  pnpm hardhat run scripts/deploy.ts --network arb-sepolia
```

The deploy script prints the new `NEXT_PUBLIC_VENDOR_CONTRACT` value.

### 2. Frontend Setup

```bash
cd packages/frontend

npm install

cat > .env.local <<EOF
NEXT_PUBLIC_VENDOR_CONTRACT=0x1f4b388c46e0f487629028a24908001480fea069
NEXT_PUBLIC_PAYMENT_CONTRACT=0x83640911f7dacd52cd50c0d25d929be7057cbbfa
NEXT_PUBLIC_CHAIN_ID=421614
NEXT_PUBLIC_WC_PROJECT_ID=your-walletconnect-id
EOF

npm run dev
```

Visit `http://localhost:3000` — connect a wallet on Arbitrum Sepolia to start.

## User Flows

### Requester
1. Click **New Request** — set title, duration, ETH deposit, and weights (must sum to 100)
2. Transaction creates the request on-chain; it appears in the Decision Requests grid
3. After the deadline passes, call `selectVendor(id, winnerAddress)` to settle

### Vendor
1. Open any active request card — click **Submit Proposal**
2. Set price competitiveness, quality score, and delivery speed (0–100 each)
3. Live score preview shows your weighted score before you sign
4. Approve the ETH deposit + confirm the FHE-encrypt → submit transaction
5. If you are not the winner after settlement, click **Claim Deposit** to recover your ETH

### Confidential Payments (separate section)
1. Click **Send Private** — enter recipient address and ETH amount
2. Amount is FHE-encrypted before the transaction is broadcast
3. Recipient sees the incoming payment in their inbox and can claim

## Privacy Guarantees

- **Proposals encrypted end-to-end** — FHE ciphertext created in the browser before the transaction is signed
- **Zero information leak** — competitors cannot observe each other's price, quality, or delivery scores
- **ZK-verified inputs** — each encrypted factor carries a ZK proof; the contract verifies it before accepting
- **Score computed on ciphertext** — `FHE.mul`, `FHE.add`, `FHE.gt`, `FHE.select` operate on encrypted values; raw scores are never decrypted on-chain
- **Only the winner is revealed** — the best vendor's address is the only public output of settlement

## Contract API

### VendorSelection

```solidity
// Create a vendor selection request
function createRequest(
    string memory title,
    uint256 durationSeconds,
    uint256 depositWei,
    uint8 wPrice,      // must sum to 100 with wQuality + wDelivery
    uint8 wQuality,
    uint8 wDelivery
) external returns (uint256 id)

// Submit an FHE-encrypted 3-factor proposal (must send depositWei)
function submitProposal(
    uint256 id,
    InEuint128 memory encPrice,
    InEuint128 memory encQuality,
    InEuint128 memory encDelivery
) external payable

// Requester selects winner after deadline
function selectVendor(uint256 id, address winner) external

// Non-winning vendor reclaims deposit
function claimDeposit(uint256 id) external

// Read request metadata (scores stay encrypted)
function getRequest(uint256 id) external view returns (
    address requester, string memory title,
    uint256 startTime, uint256 endTime,
    address bestVendor, bool settled,
    uint256 depositWei,
    uint8 wPrice, uint8 wQuality, uint8 wDelivery
)
```

### ConfidentialPayment

```solidity
function sendPayment(address recipient, InEuint128 memory encAmount, bytes32 reference) payable
function claimPayment(uint256 id)
function getPaymentInfo(uint256 id) → (sender, recipient, timestamp, claimed, reference)
```

## File Structure

```
packages/
├── cofhe-hardhat-starter/
│   ├── contracts/
│   │   ├── VendorSelection.sol       # Core FHE scoring contract
│   │   └── ConfidentialPayment.sol   # FHE payment contract
│   ├── scripts/
│   │   └── deploy.ts                 # Deploys VendorSelection + ConfidentialPayment
│   └── hardhat.config.ts             # arb-sepolia network config
│
└── frontend/
    ├── app/
    │   ├── page.tsx                  # Main UI (Decision Requests + Confidential Payments)
    │   └── layout.tsx                # Sealect metadata + dark theme
    ├── components/
    │   ├── HeroSection.tsx           # Landing — flow diagram + feature cards
    │   ├── RequestCard.tsx           # Request grid card with Submit Proposal CTA
    │   ├── BidModal.tsx              # 3-factor proposal sliders + live score preview
    │   ├── CreateRequestModal.tsx    # New request form with weight validation
    │   ├── PaymentInbox.tsx          # Incoming confidential payments
    │   ├── SendPaymentModal.tsx      # FHE-encrypt + send ETH
    │   └── WalletButton.tsx          # wagmi connect button
    ├── hooks/
    │   ├── useRequest.ts             # useCreateRequest, useSubmitProposal, useClaimDeposit, …
    │   └── useCofhe.ts               # useEncryptProposal, useEncryptBid
    └── lib/
        ├── wagmi.ts                  # Arbitrum Sepolia chain + fee estimation
        └── contracts.ts              # VENDOR_ABI, PAYMENT_ABI, addresses
```

## Resources

- [Fhenix Docs](https://docs.fhenix.io)
- [CoFHE Docs](https://cofhe-docs.fhenix.zone)
- [CoFHE SDK](https://www.npmjs.com/package/@fhenixprotocol/cofhe-contracts)
- [CoFHE React](https://www.npmjs.com/package/@fhenixprotocol/cofhe-react)
- [Privara SDK](https://www.npmjs.com/package/@reineira-os/sdk)
- [Awesome Fhenix](https://github.com/FhenixProtocol/awesome-fhenix)

---

**Sealect** · Sealed proposals. Smart selection. · Powered by Fhenix CoFHE · Arbitrum Sepolia
