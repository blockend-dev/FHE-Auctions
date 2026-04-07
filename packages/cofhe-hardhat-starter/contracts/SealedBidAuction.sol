// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

/**
 * @title SealedBidAuction
 * @notice MEV-protected sealed-bid auction using FHE.
 *         Bids are submitted encrypted and never revealed on-chain.
 *         Only the winner is disclosed at settlement.
 *
 */
contract SealedBidAuction {
    struct Auction {
        address seller;
        string itemName;
        uint256 startTime;
        uint256 endTime;
        euint128 highestBid;
        address highestBidder;
        bool settled;
        uint256 minBidWei;
    }

    uint256 public auctionCount;
    mapping(uint256 => Auction) public auctions;
    mapping(address => mapping(uint256 => euint128)) private _bids;
    mapping(address => mapping(uint256 => bool)) public hasBid;
    mapping(address => mapping(uint256 => uint256)) private _escrow;

    event AuctionCreated(uint256 indexed id, address seller, string itemName, uint256 endTime);
    event BidPlaced(uint256 indexed id, address indexed bidder);
    event AuctionSettled(uint256 indexed id, address winner);
    event Refunded(uint256 indexed id, address indexed bidder);

    error AuctionNotActive();
    error AuctionNotEnded();
    error AuctionAlreadySettled();
    error BelowMinBid();
    error AlreadyBid();
    error NotSeller();
    error NotEligibleForRefund();
    error TransferFailed();

    modifier onlyActive(uint256 id) {
        if (block.timestamp < auctions[id].startTime || block.timestamp > auctions[id].endTime)
            revert AuctionNotActive();
        _;
    }

    modifier onlyEnded(uint256 id) {
        if (block.timestamp <= auctions[id].endTime) revert AuctionNotEnded();
        _;
    }

    modifier notSettled(uint256 id) {
        if (auctions[id].settled) revert AuctionAlreadySettled();
        _;
    }

    function createAuction(
        string calldata itemName,
        uint256 durationSeconds,
        uint256 minBidWei
    ) external returns (uint256 id) {
        id = auctionCount++;
        auctions[id] = Auction({
            seller: msg.sender,
            itemName: itemName,
            startTime: block.timestamp,
            endTime: block.timestamp + durationSeconds,
            highestBid: FHE.asEuint128(0),
            highestBidder: address(0),
            settled: false,
            minBidWei: minBidWei
        });

        FHE.allowThis(auctions[id].highestBid);
        emit AuctionCreated(id, msg.sender, itemName, block.timestamp + durationSeconds);
    }

    function placeBid(uint256 id, InEuint128 memory encBid)
        external
        payable
        onlyActive(id)
    {
        if (msg.value < auctions[id].minBidWei) revert BelowMinBid();
        if (hasBid[msg.sender][id]) revert AlreadyBid();

        euint128 bid = FHE.asEuint128(encBid);

        ebool isHigher = FHE.gt(bid, auctions[id].highestBid);

        auctions[id].highestBid = FHE.select(isHigher, bid, auctions[id].highestBid);
        FHE.allowThis(auctions[id].highestBid);

        _bids[msg.sender][id] = bid;
        FHE.allowSender(_bids[msg.sender][id]);

        _escrow[msg.sender][id] = msg.value;
        hasBid[msg.sender][id] = true;

        emit BidPlaced(id, msg.sender);
    }

    function settleAuction(uint256 id, address winner)
        external
        onlyEnded(id)
        notSettled(id)
    {
        Auction storage a = auctions[id];
        if (msg.sender != a.seller) revert NotSeller();

        a.settled = true;
        a.highestBidder = winner;

        uint256 winnerEscrow = _escrow[winner][id];
        _escrow[winner][id] = 0;
        (bool ok, ) = a.seller.call{value: winnerEscrow}("");
        if (!ok) revert TransferFailed();

        emit AuctionSettled(id, winner);
    }

    function claimRefund(uint256 id) external {
        Auction storage a = auctions[id];
        if (!a.settled) revert AuctionNotEnded();
        if (msg.sender == a.highestBidder) revert NotEligibleForRefund();

        uint256 amount = _escrow[msg.sender][id];
        if (amount == 0) revert NotEligibleForRefund();

        _escrow[msg.sender][id] = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Refunded(id, msg.sender);
    }

    function getAuction(uint256 id)
        external
        view
        returns (
            address seller,
            string memory itemName,
            uint256 startTime,
            uint256 endTime,
            address highestBidder,
            bool settled,
            uint256 minBidWei
        )
    {
        Auction storage a = auctions[id];
        return (a.seller, a.itemName, a.startTime, a.endTime, a.highestBidder, a.settled, a.minBidWei);
    }

    function getEscrow(address bidder, uint256 id) external view returns (uint256) {
        return _escrow[bidder][id];
    }
}
