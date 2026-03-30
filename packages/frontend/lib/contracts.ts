export const AUCTION_ADDRESS = (process.env.NEXT_PUBLIC_AUCTION_CONTRACT || "0x0000000000000000000000000000000000000000") as `0x${string}`;
export const PAYMENT_ADDRESS = (process.env.NEXT_PUBLIC_PAYMENT_CONTRACT || "0x0000000000000000000000000000000000000000") as `0x${string}`;

// InEuint128 struct — matches Solidity InEuint256 struct layout (ctHash + securityZone)
// We use uint128 client-side since ETH values in wei never exceed uint128 max (~3.4e38)
export const INEUINT_ABI_TYPE = {
  type: "tuple",
  components: [
    { name: "ctHash", type: "uint256" },
    { name: "securityZone", type: "int32" },
  ],
} as const;

export const AUCTION_ABI = [
  {
    name: "createAuction",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "itemName", type: "string" },
      { name: "durationSeconds", type: "uint256" },
      { name: "minBidWei", type: "uint256" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
  },
  {
    name: "placeBid",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "id", type: "uint256" },
      {
        name: "encBid",
        type: "tuple",
        components: [
          { name: "ctHash", type: "uint256" },
          { name: "securityZone", type: "int32" },
        ],
      },
    ],
    outputs: [],
  },
  {
    name: "settleAuction",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "winner", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "claimRefund",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
  },
  {
    name: "getAuction",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      { name: "seller", type: "address" },
      { name: "itemName", type: "string" },
      { name: "startTime", type: "uint256" },
      { name: "endTime", type: "uint256" },
      { name: "highestBidder", type: "address" },
      { name: "settled", type: "bool" },
      { name: "minBidWei", type: "uint256" },
    ],
  },
  {
    name: "hasBid",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "auctionCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getEscrow",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "bidder", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  // Events
  { name: "AuctionCreated", type: "event", inputs: [{ name: "id", type: "uint256", indexed: true }, { name: "seller", type: "address", indexed: true }, { name: "itemName", type: "string" }, { name: "endTime", type: "uint256" }] },
  { name: "BidPlaced", type: "event", inputs: [{ name: "id", type: "uint256", indexed: true }, { name: "bidder", type: "address", indexed: true }] },
  { name: "AuctionSettled", type: "event", inputs: [{ name: "id", type: "uint256", indexed: true }, { name: "winner", type: "address" }] },
] as const;
