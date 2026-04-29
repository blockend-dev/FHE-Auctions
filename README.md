# Sealect — Confidential Decision Platform · Fhenix CoFHE

> Four FHE-powered modules on a single frontend — vendor selection, blind peer review, KYC compliance gate, and confidential payments — all running on Arbitrum Sepolia via the Fhenix CoFHE co-processor.

## What's Built

### Smart Contracts

**1. VendorSelection.sol**
- Requesters post vendor selection rounds with configurable per-factor weights (price / quality / delivery, must sum to 100)
- Vendors submit 3-factor proposals encrypted client-side — raw scores never touch plaintext on-chain
- Weighted score computed fully on ciphertext: `score = wPrice·ePrice + wQuality·eQuality + wDelivery·eDelivery`
- Running best tracked via `FHE.gt` + `FHE.select` — no information about losing proposals leaks
- ETH deposit model: winner's deposit goes to requester, losers can reclaim

**2. BlindReview.sol**
- Organizers create peer review rounds with 3 encrypted scoring dimensions: impact, feasibility, innovation
- Reviewers submit scores via FHE — no reviewer can observe another's inputs at any point
- Scores accumulate homomorphically across all reviewers per proposal
- After deadline, organizer finalises and declares a winner
- **Reveal Score**: organizer can decrypt the winner's encrypted total score client-side using a CoFHE EIP-712 permit + `decryptForView` — proves the computation without ever publishing raw scores on-chain

**3. IdentityGate.sol**
- FHE-powered KYC/compliance gate: age ≥ 18 AND jurisdiction ≠ restricted, both checked on ciphertext
- Two-step flow:
  1. `submitKYC(encAge, encJurisdiction)` — computes FHE AND condition, stores encrypted result, grants ACL to user
  2. `claimVerified(1)` — user decrypts result off-chain via CoFHE permit, submits plaintext to finalise on-chain verification
- Raw age and jurisdiction values are never revealed — not to the contract, not to any observer

**4. ConfidentialPayment.sol**
- Send ETH with FHE-encrypted amounts — payment value stays hidden until the recipient claims
- Powered by Privara SDK patterns

### Tech Stack

| Layer | Tools |
|-------|-------|
| Smart Contract Dev | Hardhat + cofhe-hardhat-plugin |
| FHE Library | @fhenixprotocol/cofhe-contracts |
| Testnet | Arbitrum Sepolia (421614) |
| Frontend | Next.js 14 + wagmi v2 + viem v2 |
| FHE Client SDK | @cofhe/sdk (encryptInputs, decryptForView, permits) |
| Payment Integration | Privara SDK |

## Deployed Contracts (Arbitrum Sepolia)

| Contract | Address |
|----------|---------|
| VendorSelection | `0x1f4b388c46e0f487629028a24908001480fea069` |
| ConfidentialPayment | `0x83640911f7dacd52cd50c0d25d929be7057cbbfa` |
| BlindReview | *(deploy with `scripts/deployBlindReview.ts`)* |
| IdentityGate | *(deploy with `scripts/deployIdentityGate.ts`)* |

## Quick Start

### 1. Build & Deploy Contracts

```bash
cd packages/cofhe-hardhat-starter
pnpm install
pnpm compile

# Deploy all contracts
PRIVATE_KEY=0x... pnpm hardhat run scripts/deploy.ts --network arb-sepolia
PRIVATE_KEY=0x... pnpm hardhat run scripts/deployBlindReview.ts --network arb-sepolia
PRIVATE_KEY=0x... pnpm hardhat run scripts/deployIdentityGate.ts --network arb-sepolia
```

### 2. Frontend

```bash
cd packages/frontend
npm install

cat > .env.local <<EOF
NEXT_PUBLIC_VENDOR_CONTRACT=0x...
NEXT_PUBLIC_PAYMENT_CONTRACT=0x...
NEXT_PUBLIC_REVIEW_CONTRACT=0x...
NEXT_PUBLIC_KYC_CONTRACT=0x...
NEXT_PUBLIC_CHAIN_ID=421614
NEXT_PUBLIC_WC_PROJECT_ID=your-walletconnect-id
EOF

npm run dev
```

Visit `http://localhost:3000` and connect a wallet on Arbitrum Sepolia.

## User Flows

### Decision Requests (VendorSelection)
1. **Requester** clicks **New Request** — sets title, duration, ETH deposit, and weights
2. **Vendor** opens a request card → **Submit Proposal** → sets price / quality / delivery sliders (live score preview) → FHE-encrypts and signs
3. After deadline, requester calls `selectVendor` to settle; non-winners claim deposit back

### Blind Review Rounds (BlindReview)
1. **Organizer** clicks **New Round** — sets title, description, duration, and Impact/Feasibility/Innovation weights (must sum to 100)
2. Any connected wallet can **Add Proposal** to an active round (title + summary, public)
3. Reviewers open the proposal list → **Review** → score each dimension on sliders → FHE-encrypts all three and submits
4. After deadline, organizer clicks **Finalize Round** and enters the winner ID
5. Organizer clicks **Reveal Score** — CoFHE self-permit is created client-side, `decryptForView` decrypts the winner's total score and displays it inline

### Compliance Gate (IdentityGate)
1. Connect wallet → **Compliance Gate** section appears in the page header area
2. Click **Get Verified** → set age slider and jurisdiction toggle
3. **Step 1**: attributes are FHE-encrypted in the browser → `submitKYC` tx stores the encrypted result on-chain
4. **Step 2**: app auto-fetches the encrypted result handle → creates a CoFHE permit → `decryptForView` reveals whether conditions passed → `claimVerified(1)` tx marks wallet as verified
5. Banner flips to "Identity Verified" — permit is active on-chain

### Confidential Payments
1. Click **Send Private** — enter recipient address and ETH amount
2. Amount is FHE-encrypted before broadcast; recipient sees it in their inbox and can claim

## Privacy Model

| Feature | What's encrypted | What's public |
|---------|-----------------|---------------|
| Vendor proposals | Price, quality, delivery scores | Requester address, weights, deadline |
| Peer review scores | All three dimension scores per reviewer | Proposal titles, reviewer addresses, review count |
| Winner score reveal | Score until organizer decrypts client-side | Decrypted value (shown only to organizer in UI) |
| KYC attributes | Age, jurisdiction value | Whether wallet is verified (boolean) |
| Payments | ETH amount | Sender, recipient, timestamp |

## Contract API

### VendorSelection

```solidity
function createRequest(string memory title, uint256 durationSeconds, uint256 depositWei,
    uint8 wPrice, uint8 wQuality, uint8 wDelivery) external returns (uint256 id)

function submitProposal(uint256 id, InEuint128 memory encPrice,
    InEuint128 memory encQuality, InEuint128 memory encDelivery) external payable

function selectVendor(uint256 id, address winner) external
function claimDeposit(uint256 id) external
```

### BlindReview

```solidity
function createRound(string calldata title, string calldata description,
    uint256 durationSeconds, uint8 wImpact, uint8 wFeasibility, uint8 wInnovation)
    external returns (uint256 roundId)

function addProposal(uint256 roundId, string calldata title, string calldata summary)
    external returns (uint256 proposalId)

function submitReview(uint256 roundId, uint256 proposalId,
    InEuint128 memory encImpact, InEuint128 memory encFeasibility,
    InEuint128 memory encInnovation) external

function finalizeRound(uint256 roundId, uint256 winnerProposalId) external

// Returns raw ctHash of proposal's encrypted score — pass to decryptForView
function getProposalScoreHandle(uint256 roundId, uint256 proposalId)
    external view returns (uint256)
```

### IdentityGate

```solidity
// Step 1: FHE computation + store encrypted result
function submitKYC(InEuint128 memory encAge, InEuint128 memory encJurisdiction) external

// Step 2: user decrypts result off-chain, submits 1 to claim verification
function claimVerified(uint256 decryptedResult) external

function isVerified(address) external view returns (bool)
function kycResultHandle(address) external view returns (uint256) // ctHash for decryptForView
```

### ConfidentialPayment

```solidity
function sendPayment(address recipient, InEuint128 memory encAmount,
    bytes32 refHash) external payable returns (uint256 id)
function claimPayment(uint256 id) external
```

## File Structure

```
packages/
├── cofhe-hardhat-starter/
│   ├── contracts/
│   │   ├── VendorSelection.sol          # FHE vendor scoring + deposit
│   │   ├── BlindReview.sol              # FHE blind peer review engine
│   │   ├── IdentityGate.sol             # FHE KYC compliance gate
│   │   └── ConfidentialPayment.sol      # FHE payment escrow
│   ├── scripts/
│   │   ├── deploy.ts                    # Deploys VendorSelection + ConfidentialPayment
│   │   ├── deployBlindReview.ts         # Deploys BlindReview only
│   │   └── deployIdentityGate.ts        # Deploys IdentityGate (minAge=18)
│   └── hardhat.config.ts                # arb-sepolia + cofhe-hardhat-plugin
│
└── frontend/
    ├── app/
    │   └── page.tsx                     # All four sections wired together
    ├── components/
    │   ├── HeroSection.tsx
    │   ├── RequestCard.tsx              # VendorSelection card
    │   ├── BidModal.tsx                 # Proposal submit (3-factor FHE)
    │   ├── CreateRequestModal.tsx
    │   ├── ReviewRoundCard.tsx          # BlindReview card + Reveal Score
    │   ├── ReviewModal.tsx              # Encrypted review sliders
    │   ├── CreateRoundModal.tsx
    │   ├── AddProposalModal.tsx
    │   ├── KYCModal.tsx                 # 2-step FHE identity verification
    │   ├── PaymentInbox.tsx
    │   ├── SendPaymentModal.tsx
    │   ├── EncryptionSteps.tsx          # FHE progress indicator
    │   └── WalletButton.tsx
    ├── hooks/
    │   ├── useRequest.ts                # VendorSelection hooks
    │   ├── useBlindReview.ts            # BlindReview hooks
    │   ├── useIdentityGate.ts           # IdentityGate hooks (2-step)
    │   └── useCofhe.ts                  # useEncryptProposal, useEncryptKYC, useDecryptForView
    └── lib/
        ├── wagmi.ts                     # Arbitrum Sepolia chain config
        └── contracts.ts                 # All ABIs + addresses
```

## Resources

- [Fhenix Docs](https://docs.fhenix.io)
- [CoFHE Docs](https://cofhe-docs.fhenix.zone)
- [CoFHE SDK npm](https://www.npmjs.com/package/@cofhe/sdk)
- [Privara SDK](https://reineira.xyz/docs)
- [Awesome Fhenix](https://github.com/FhenixProtocol/awesome-fhenix)

---

**Sealect** · Sealed proposals. Smart selection. · Powered by Fhenix CoFHE · Arbitrum Sepolia
