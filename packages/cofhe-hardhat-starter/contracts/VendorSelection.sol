// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

/**
 * @title VendorSelection
 * @notice Confidential Vendor Selection Decision Engine powered by FHE.
 *
 *         Vendors submit three encrypted factor scores (price, quality, delivery)
 *         on a 0–100 scale. The contract computes a weighted score entirely on
 *         encrypted values — raw inputs are never visible on-chain.
 *
 *         Scoring: score = wPrice*price + wQuality*quality + wDelivery*delivery
 *         All factors: higher = better (price = price-competitiveness, not raw cost).
 *
 *         NOTE: Uses euint128 — euint256 is disabled on the CoFHE co-processor
 *         on Arbitrum Sepolia.
 */
contract VendorSelection {
    struct Request {
        address requester;
        string title;
        uint256 startTime;
        uint256 endTime;
        euint128 bestScore;   // FHE-encrypted running high-watermark
        address bestVendor;   // set at settlement
        bool settled;
        uint256 depositWei;   // deposit vendors must lock to participate
        uint8 wPrice;         // price-competitiveness weight (0-100)
        uint8 wQuality;       // quality weight (0-100)
        uint8 wDelivery;      // delivery-speed weight (0-100)
    }

    uint256 public requestCount;
    mapping(uint256 => Request) public requests;
    mapping(address => mapping(uint256 => bool)) public hasSubmitted;
    mapping(address => mapping(uint256 => uint256)) private _escrow;

    event RequestCreated(uint256 indexed id, address requester, string title, uint256 endTime);
    event ProposalSubmitted(uint256 indexed id, address indexed vendor);
    event VendorSelected(uint256 indexed id, address winner);
    event Refunded(uint256 indexed id, address indexed vendor);

    error RequestNotActive();
    error RequestNotEnded();
    error RequestAlreadySettled();
    error BelowDeposit();
    error AlreadySubmitted();
    error NotRequester();
    error NotEligibleForRefund();
    error TransferFailed();

    modifier onlyActive(uint256 id) {
        if (block.timestamp < requests[id].startTime || block.timestamp > requests[id].endTime)
            revert RequestNotActive();
        _;
    }

    modifier onlyEnded(uint256 id) {
        if (block.timestamp <= requests[id].endTime) revert RequestNotEnded();
        _;
    }

    modifier notSettled(uint256 id) {
        if (requests[id].settled) revert RequestAlreadySettled();
        _;
    }

    // ── Create a new decision request ─────────────────────────────────────────

    function createRequest(
        string calldata title,
        uint256 durationSeconds,
        uint256 depositWei,
        uint8 wPrice,
        uint8 wQuality,
        uint8 wDelivery
    ) external returns (uint256 id) {
        id = requestCount++;
        requests[id] = Request({
            requester: msg.sender,
            title: title,
            startTime: block.timestamp,
            endTime: block.timestamp + durationSeconds,
            bestScore: FHE.asEuint128(0),
            bestVendor: address(0),
            settled: false,
            depositWei: depositWei,
            wPrice: wPrice,
            wQuality: wQuality,
            wDelivery: wDelivery
        });

        FHE.allowThis(requests[id].bestScore);
        emit RequestCreated(id, msg.sender, title, block.timestamp + durationSeconds);
    }

    // ── Submit encrypted vendor proposal ──────────────────────────────────────

    function submitProposal(
        uint256 id,
        InEuint128 memory encPrice,
        InEuint128 memory encQuality,
        InEuint128 memory encDelivery
    ) external payable onlyActive(id) {
        Request storage r = requests[id];
        if (msg.value < r.depositWei) revert BelowDeposit();
        if (hasSubmitted[msg.sender][id]) revert AlreadySubmitted();

        // Unwrap encrypted inputs
        euint128 ePrice    = FHE.asEuint128(encPrice);
        euint128 eQuality  = FHE.asEuint128(encQuality);
        euint128 eDelivery = FHE.asEuint128(encDelivery);

        // Weighted score computed fully on encrypted values
        // score = wPrice*price + wQuality*quality + wDelivery*delivery
        euint128 score = FHE.add(
            FHE.add(
                FHE.mul(FHE.asEuint128(uint128(r.wPrice)),   ePrice),
                FHE.mul(FHE.asEuint128(uint128(r.wQuality)), eQuality)
            ),
            FHE.mul(FHE.asEuint128(uint128(r.wDelivery)), eDelivery)
        );

        // Update encrypted high-watermark — no raw scores leak
        ebool isBetter = FHE.gt(score, r.bestScore);
        r.bestScore = FHE.select(isBetter, score, r.bestScore);
        FHE.allowThis(r.bestScore);

        _escrow[msg.sender][id] = msg.value;
        hasSubmitted[msg.sender][id] = true;

        emit ProposalSubmitted(id, msg.sender);
    }

    // ── Settle: requester names the winning vendor ─────────────────────────────

    function selectVendor(uint256 id, address winner)
        external
        onlyEnded(id)
        notSettled(id)
    {
        Request storage r = requests[id];
        if (msg.sender != r.requester) revert NotRequester();

        r.settled = true;
        r.bestVendor = winner;

        uint256 winnerDeposit = _escrow[winner][id];
        _escrow[winner][id] = 0;
        (bool ok, ) = r.requester.call{value: winnerDeposit}("");
        if (!ok) revert TransferFailed();

        emit VendorSelected(id, winner);
    }

    // ── Non-winning vendors reclaim their deposit ──────────────────────────────

    function claimDeposit(uint256 id) external {
        Request storage r = requests[id];
        if (!r.settled) revert RequestNotEnded();
        if (msg.sender == r.bestVendor) revert NotEligibleForRefund();

        uint256 amount = _escrow[msg.sender][id];
        if (amount == 0) revert NotEligibleForRefund();

        _escrow[msg.sender][id] = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Refunded(id, msg.sender);
    }

    // ── View helpers ───────────────────────────────────────────────────────────

    function getRequest(uint256 id)
        external
        view
        returns (
            address requester,
            string memory title,
            uint256 startTime,
            uint256 endTime,
            address bestVendor,
            bool settled,
            uint256 depositWei,
            uint8 wPrice,
            uint8 wQuality,
            uint8 wDelivery
        )
    {
        Request storage r = requests[id];
        return (
            r.requester, r.title, r.startTime, r.endTime,
            r.bestVendor, r.settled, r.depositWei,
            r.wPrice, r.wQuality, r.wDelivery
        );
    }

    function getEscrow(address vendor, uint256 id) external view returns (uint256) {
        return _escrow[vendor][id];
    }
}
