// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ConfidentialPaymentModule = buildModule("ConfidentialPaymentModule", (m) => {
  const payment = m.contract("ConfidentialPayment");

  return { payment };
});

export default ConfidentialPaymentModule;
