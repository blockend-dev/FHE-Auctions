// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

/**
 * @title IdentityGate
 * @notice FHE-powered on-chain KYC / compliance gate.
 */
contract IdentityGate {
    address public admin;
    uint128 public minAge;

    mapping(address => bool)    public isVerified;
    mapping(address => uint256) public verifiedAt;
    // ctHash of the encrypted pass/fail result; user decrypts via CoFHE permit
    mapping(address => uint256) public kycResultHandle;

    event KYCSubmitted(address indexed user);
    event Verified(address indexed user);
    event VerificationRevoked(address indexed user);

    error AlreadyVerified();
    error NoPendingKYC();
    error ConditionsNotMet();
    error NotAdmin();

    constructor(uint128 _minAge) {
        admin  = msg.sender;
        minAge = _minAge;
    }

    // submit encrypted age + jurisdiction
    // Computes the FHE conditions fully on ciphertext and stores the encrypted
    // result 

    function submitKYC(
        InEuint128 memory encAge,
        InEuint128 memory encJurisdiction
    ) external {
        euint128 eAge          = FHE.asEuint128(encAge);
        euint128 eJurisdiction = FHE.asEuint128(encJurisdiction);

        euint128 ONE  = FHE.asEuint128(1);
        euint128 ZERO = FHE.asEuint128(0);

        // age >= minAge  →  age > (minAge - 1)
        ebool ageOk = FHE.gt(eAge, FHE.asEuint128(minAge - 1));

        // jurisdiction == 0  →  1 > jurisdiction  (valid for binary 0/1 inputs)
        ebool jurisdictionOk = FHE.gt(ONE, eJurisdiction);

        // AND via multiplication: result is 1 only when both conditions pass
        euint128 combined = FHE.mul(
            FHE.select(ageOk,          ONE, ZERO),
            FHE.select(jurisdictionOk, ONE, ZERO)
        );

        FHE.allowThis(combined);
        FHE.allow(combined, msg.sender); // grant ACL so user can decrypt their result

        kycResultHandle[msg.sender] = euint128.unwrap(combined);
        emit KYCSubmitted(msg.sender);
    }

    // claim verification with decrypted result
    //
    // The user calls decryptForTx(kycResultHandle) off-chain to get
    // (decryptedValue, thresholdSignature) from the CoFHE co-processor.
    // They then submit here. decryptedValue == 1 means both FHE conditions passed.
    //
    // TODO: verify `thresholdSignature` against the CoFHE verifier contract once
    //       the on-chain verifier ABI is published. Until then the value is trusted.

    function claimVerified(uint256 decryptedResult) external {
        if (kycResultHandle[msg.sender] == 0) revert NoPendingKYC();
        if (decryptedResult != 1) revert ConditionsNotMet();

        isVerified[msg.sender]    = true;
        verifiedAt[msg.sender]    = block.timestamp;
        kycResultHandle[msg.sender] = 0;
        emit Verified(msg.sender);
    }

    // Admin controls

    function revokeVerification(address user) external {
        if (msg.sender != admin) revert NotAdmin();
        isVerified[user] = false;
        emit VerificationRevoked(user);
    }

    function setMinAge(uint128 _minAge) external {
        if (msg.sender != admin) revert NotAdmin();
        minAge = _minAge;
    }

    function transferAdmin(address newAdmin) external {
        if (msg.sender != admin) revert NotAdmin();
        admin = newAdmin;
    }
}
