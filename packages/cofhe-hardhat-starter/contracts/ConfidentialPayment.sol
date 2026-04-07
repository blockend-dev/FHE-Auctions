// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

/**
 * @title ConfidentialPayment
 * @notice Confidential ETH payment splitter powered by FHE + Privara patterns.
 *
 */
contract ConfidentialPayment {
    struct Payment {
        address sender;
        address recipient;
        euint128 encAmount;
        uint256 escrowed;
        uint256 timestamp;
        bool claimed;
        bytes32 refHash;
    }

    uint256 public paymentCount;
    mapping(uint256 => Payment) private _payments;
    mapping(address => uint256[]) public receivable;

    event PaymentCreated(uint256 indexed id, address indexed sender, address indexed recipient, bytes32 refHash);
    event PaymentClaimed(uint256 indexed id, address indexed recipient, uint256 amount);

    error NotRecipient();
    error AlreadyClaimed();
    error InsufficientValue();
    error TransferFailed();

    function sendPayment(
        address recipient,
        InEuint128 memory encAmount,
        bytes32 refHash
    ) external payable returns (uint256 id) {
        if (msg.value == 0) revert InsufficientValue();

        id = paymentCount++;
        euint128 amount = FHE.asEuint128(encAmount);

        _payments[id] = Payment({
            sender: msg.sender,
            recipient: recipient,
            encAmount: amount,
            escrowed: msg.value,
            timestamp: block.timestamp,
            claimed: false,
            refHash: refHash
        });

        FHE.allowThis(_payments[id].encAmount);
        FHE.allow(_payments[id].encAmount, recipient);

        receivable[recipient].push(id);
        emit PaymentCreated(id, msg.sender, recipient, refHash);
    }

    function claimPayment(uint256 id) external {
        Payment storage p = _payments[id];
        if (p.recipient != msg.sender) revert NotRecipient();
        if (p.claimed) revert AlreadyClaimed();

        uint256 amount = p.escrowed;
        p.claimed = true;
        p.escrowed = 0;

        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit PaymentClaimed(id, msg.sender, amount);
    }

    function getPaymentInfo(uint256 id)
        external
        view
        returns (
            address sender,
            address recipient,
            uint256 escrowed,
            uint256 timestamp,
            bool claimed,
            bytes32 refHash
        )
    {
        Payment storage p = _payments[id];
        return (p.sender, p.recipient, p.escrowed, p.timestamp, p.claimed, p.refHash);
    }

    function getReceivable(address addr) external view returns (uint256[] memory) {
        return receivable[addr];
    }
}
