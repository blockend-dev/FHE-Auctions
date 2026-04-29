// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

/**
 * @title BlindReview
 * @notice FHE-powered blind peer review engine for grants, DAOs, and academic rounds.
 */
contract BlindReview {
    struct Round {
        address organizer;
        string title;
        string description;
        uint256 deadline;
        uint8 wImpact;       // weight for impact (0–100)
        uint8 wFeasibility;  // weight for feasibility (0–100)
        uint8 wInnovation;   // weight for innovation (0–100)
        uint256 proposalCount;
        euint128 bestScore;      // encrypted running high-watermark across all proposals
        uint256 winnerProposalId;
        bool finalized;
    }

    struct Proposal {
        address submitter;
        string title;
        string summary;
        euint128 totalScore;  // accumulated FHE score from all reviewers
        uint256 reviewCount;
    }

    uint256 public roundCount;
    mapping(uint256 => Round) private _rounds;
    mapping(uint256 => mapping(uint256 => Proposal)) private _proposals;
    // roundId => proposalId => reviewer => reviewed
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasReviewed;

    event RoundCreated(uint256 indexed roundId, address indexed organizer, string title, uint256 deadline);
    event ProposalAdded(uint256 indexed roundId, uint256 indexed proposalId, address indexed submitter, string title);
    event ReviewSubmitted(uint256 indexed roundId, uint256 indexed proposalId, address reviewer);
    event RoundFinalized(uint256 indexed roundId, uint256 winnerProposalId);

    error RoundNotActive();
    error RoundNotEnded();
    error RoundAlreadyFinalized();
    error AlreadyReviewed();
    error NotOrganizer();
    error InvalidProposal();

    modifier onlyActive(uint256 roundId) {
        if (block.timestamp > _rounds[roundId].deadline) revert RoundNotActive();
        _;
    }

    modifier onlyEnded(uint256 roundId) {
        if (block.timestamp <= _rounds[roundId].deadline) revert RoundNotEnded();
        _;
    }

    //  Create a new review round 

    function createRound(
        string calldata title,
        string calldata description,
        uint256 durationSeconds,
        uint8 wImpact,
        uint8 wFeasibility,
        uint8 wInnovation
    ) external returns (uint256 roundId) {
        roundId = roundCount++;
        Round storage r = _rounds[roundId];
        r.organizer = msg.sender;
        r.title = title;
        r.description = description;
        r.deadline = block.timestamp + durationSeconds;
        r.wImpact = wImpact;
        r.wFeasibility = wFeasibility;
        r.wInnovation = wInnovation;
        r.bestScore = FHE.asEuint128(0);
        FHE.allowThis(r.bestScore);
        emit RoundCreated(roundId, msg.sender, title, r.deadline);
    }

    //  Submit a proposal to be reviewed

    function addProposal(
        uint256 roundId,
        string calldata title,
        string calldata summary
    ) external onlyActive(roundId) returns (uint256 proposalId) {
        Round storage r = _rounds[roundId];
        proposalId = r.proposalCount++;
        Proposal storage p = _proposals[roundId][proposalId];
        p.submitter = msg.sender;
        p.title = title;
        p.summary = summary;
        p.totalScore = FHE.asEuint128(0);
        FHE.allowThis(p.totalScore);
        emit ProposalAdded(roundId, proposalId, msg.sender, title);
    }

    //  Submit encrypted review scores for one proposal 

    function submitReview(
        uint256 roundId,
        uint256 proposalId,
        InEuint128 memory encImpact,
        InEuint128 memory encFeasibility,
        InEuint128 memory encInnovation
    ) external onlyActive(roundId) {
        Round storage r = _rounds[roundId];
        if (proposalId >= r.proposalCount) revert InvalidProposal();
        if (hasReviewed[roundId][proposalId][msg.sender]) revert AlreadyReviewed();

        euint128 eImpact      = FHE.asEuint128(encImpact);
        euint128 eFeasibility = FHE.asEuint128(encFeasibility);
        euint128 eInnovation  = FHE.asEuint128(encInnovation);

        // Weighted score for this review — fully on ciphertext
        euint128 reviewScore = FHE.add(
            FHE.add(
                FHE.mul(FHE.asEuint128(uint128(r.wImpact)),      eImpact),
                FHE.mul(FHE.asEuint128(uint128(r.wFeasibility)), eFeasibility)
            ),
            FHE.mul(FHE.asEuint128(uint128(r.wInnovation)), eInnovation)
        );

        // Accumulate into proposal's running total
        Proposal storage p = _proposals[roundId][proposalId];
        p.totalScore = FHE.add(p.totalScore, reviewScore);
        FHE.allowThis(p.totalScore);
        p.reviewCount++;

        // Update round's encrypted high-watermark across all proposals
        ebool isBest = FHE.gt(p.totalScore, r.bestScore);
        r.bestScore = FHE.select(isBest, p.totalScore, r.bestScore);
        FHE.allowThis(r.bestScore);

        hasReviewed[roundId][proposalId][msg.sender] = true;
        emit ReviewSubmitted(roundId, proposalId, msg.sender);
    }

    //  Organizer finalizes after deadline 

    function finalizeRound(uint256 roundId, uint256 winnerProposalId)
        external
        onlyEnded(roundId)
    {
        Round storage r = _rounds[roundId];
        if (r.finalized) revert RoundAlreadyFinalized();
        if (msg.sender != r.organizer) revert NotOrganizer();
        if (winnerProposalId >= r.proposalCount) revert InvalidProposal();

        r.finalized = true;
        r.winnerProposalId = winnerProposalId;

        // Grant organizer ACL access to decrypt the winner's score client-side via permit
        FHE.allow(_proposals[roundId][winnerProposalId].totalScore, msg.sender);

        emit RoundFinalized(roundId, winnerProposalId);
    }

    //  View helpers 

    function getRound(uint256 roundId)
        external
        view
        returns (
            address organizer,
            string memory title,
            string memory description,
            uint256 deadline,
            uint8 wImpact,
            uint8 wFeasibility,
            uint8 wInnovation,
            uint256 proposalCount,
            uint256 winnerProposalId,
            bool finalized
        )
    {
        Round storage r = _rounds[roundId];
        return (
            r.organizer, r.title, r.description, r.deadline,
            r.wImpact, r.wFeasibility, r.wInnovation,
            r.proposalCount, r.winnerProposalId, r.finalized
        );
    }

    function getProposal(uint256 roundId, uint256 proposalId)
        external
        view
        returns (
            address submitter,
            string memory title,
            string memory summary,
            uint256 reviewCount
        )
    {
        Proposal storage p = _proposals[roundId][proposalId];
        return (p.submitter, p.title, p.summary, p.reviewCount);
    }

    /// @notice Returns the raw ctHash of a proposal's encrypted total score.
    ///         Use with a CoFHE permit + decryptForView to reveal the score client-side.
    function getProposalScoreHandle(uint256 roundId, uint256 proposalId)
        external
        view
        returns (uint256)
    {
        return euint128.unwrap(_proposals[roundId][proposalId].totalScore);
    }
}
