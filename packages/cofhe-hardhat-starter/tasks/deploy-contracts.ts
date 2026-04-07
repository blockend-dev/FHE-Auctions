import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { saveDeployment } from './utils'

// Task to deploy the ConfidentialPayment contract
task('deploy-confidential payment', 'Deploy the ConfidentialPayment contract to the selected network').setAction(async (_, hre: HardhatRuntimeEnvironment) => {
	const { ethers, network } = hre

	console.log(`Deploying ConfidentialPayment to ${network.name}...`)

	// Get the deployer account
	const [deployer] = await ethers.getSigners()
	console.log(`Deploying with account: ${deployer.address}`)

	// Deploy the contract
	const ConfidentialPayment = await ethers.getContractFactory('ConfidentialPayment')
	const confidentialPayment = await ConfidentialPayment.deploy()
	await confidentialPayment.waitForDeployment()

	const ConfidentialPaymentAddress = await confidentialPayment.getAddress()
	console.log(`ConfidentialPayment deployed to: ${ConfidentialPaymentAddress}`)

	// Save the deployment
	saveDeployment(network.name, 'ConfidentialPayment', ConfidentialPaymentAddress)

	return ConfidentialPaymentAddress
})

task('deploy-SealedBidAuction ', 'Deploy the SealedBidAuction contract to the selected network').setAction(async (_, hre: HardhatRuntimeEnvironment) => {
	const { ethers, network } = hre

	console.log(`Deploying SealedBidAuction to ${network.name}...`)

	// Get the deployer account
	const [deployer] = await ethers.getSigners()
	console.log(`Deploying with account: ${deployer.address}`)

	// Deploy the contract
	const SealedBidAuction = await ethers.getContractFactory('SealedBidAuction')
	const sealedBidAuction = await SealedBidAuction.deploy()
	await sealedBidAuction.waitForDeployment()

	const SealedBidAuctionAddress = await sealedBidAuction.getAddress()
	console.log(`SealedBidAuction deployed to: ${SealedBidAuctionAddress}`)

	// Save the deployment
	saveDeployment(network.name, 'SealedBidAuction', SealedBidAuctionAddress)

	return SealedBidAuctionAddress
})
