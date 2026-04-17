import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log(`Deployer: ${deployer.address}`)

  console.log('Deploying ConfidentialPayment...')
  const ConfidentialPayment = await ethers.getContractFactory('ConfidentialPayment')
  const confidentialPayment = await ConfidentialPayment.deploy()
  await confidentialPayment.waitForDeployment()
  const confidentialPaymentAddress = await confidentialPayment.getAddress()
  console.log(`ConfidentialPayment deployed at: ${confidentialPaymentAddress}`)

  console.log('Deploying SealedBidAuction...')
  const SealedBidAuction = await ethers.getContractFactory('SealedBidAuction')
  const sealedBidAuction = await SealedBidAuction.deploy()
  await sealedBidAuction.waitForDeployment()
  const sealedBidAuctionAddress = await sealedBidAuction.getAddress()
  console.log(`SealedBidAuction deployed at: ${sealedBidAuctionAddress}`)

    console.log('Deploying VendorSelection...')
  const VendorSelection = await ethers.getContractFactory('VendorSelection')
  const vendorSelection = await VendorSelection.deploy()
  await vendorSelection.waitForDeployment()
  const vendorSelectionAddress = await vendorSelection.getAddress()
  console.log(`VendorSelection deployed at: ${vendorSelectionAddress}`)

  console.log('✅ Deployment complete')
  console.log({ confidentialPaymentAddress, sealedBidAuctionAddress, vendorSelectionAddress })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
