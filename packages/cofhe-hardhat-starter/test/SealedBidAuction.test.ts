import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import hre from 'hardhat'
import { cofhejs, Encryptable, FheTypes } from 'cofhejs/node'
import { expect } from 'chai'

describe('SealedBidAuction', function () {
	async function deployAuctionFixture() {
		const [signer, seller, bidder1, bidder2, bidder3] = await hre.ethers.getSigners()
		const Auction = await hre.ethers.getContractFactory('SealedBidAuction')
		const auction = await Auction.deploy()
		return { auction, signer, seller, bidder1, bidder2, bidder3 }
	}

	describe('Functionality', function () {
		beforeEach(function () {
			if (!hre.cofhe.isPermittedEnvironment('MOCK')) this.skip()
		})

		it('Should create an auction', async function () {
			const { auction, seller } = await loadFixture(deployAuctionFixture)
			const minBid = hre.ethers.parseEther('0.01')

			await auction.connect(seller).createAuction('Rare NFT', 3600, minBid)
			const info = await auction.getAuction(0)

			expect(info.seller).to.equal(seller.address)
			expect(info.itemName).to.equal('Rare NFT')
			expect(info.settled).to.equal(false)
			expect(info.minBidWei).to.equal(minBid)
		})

		it('Should place encrypted bid', async function () {
			const { auction, seller, bidder1 } = await loadFixture(deployAuctionFixture)
			const minBid = hre.ethers.parseEther('0.01')

			await auction.connect(seller).createAuction('Item 1', 3600, minBid)

			await hre.cofhe.expectResultSuccess(hre.cofhe.initializeWithHardhatSigner(bidder1))

			const bidAmount = hre.ethers.parseEther('0.05')
			const [encBid] = await hre.cofhe.expectResultSuccess(
				cofhejs.encrypt([Encryptable.uint256(bidAmount)] as const)
			)

			await auction.connect(bidder1).placeBid(0, encBid, { value: bidAmount })
			expect(await auction.hasBid(bidder1.address, 0)).to.equal(true)
		})

		it('Should reject bid below minimum', async function () {
			const { auction, seller, bidder1 } = await loadFixture(deployAuctionFixture)
			const minBid = hre.ethers.parseEther('0.1')

			await auction.connect(seller).createAuction('Expensive Item', 3600, minBid)

			await hre.cofhe.expectResultSuccess(hre.cofhe.initializeWithHardhatSigner(bidder1))

			const tinyBid = hre.ethers.parseEther('0.01')
			const [encBid] = await hre.cofhe.expectResultSuccess(
				cofhejs.encrypt([Encryptable.uint256(tinyBid)] as const)
			)

			await expect(
				auction.connect(bidder1).placeBid(0, encBid, { value: tinyBid })
			).to.be.revertedWithCustomError(auction, 'BelowMinBid')
		})

		it('Should reject duplicate bid from same bidder', async function () {
			const { auction, seller, bidder1 } = await loadFixture(deployAuctionFixture)
			const minBid = hre.ethers.parseEther('0.01')

			await auction.connect(seller).createAuction('Item', 3600, minBid)

			await hre.cofhe.expectResultSuccess(hre.cofhe.initializeWithHardhatSigner(bidder1))

			const bidAmount = hre.ethers.parseEther('0.05')
			const [encBid] = await hre.cofhe.expectResultSuccess(
				cofhejs.encrypt([Encryptable.uint256(bidAmount)] as const)
			)

			await auction.connect(bidder1).placeBid(0, encBid, { value: bidAmount })

			await expect(
				auction.connect(bidder1).placeBid(0, encBid, { value: bidAmount })
			).to.be.revertedWithCustomError(auction, 'AlreadyBid')
		})

		it('Should settle auction after time ends', async function () {
			const { auction, seller, bidder1 } = await loadFixture(deployAuctionFixture)
			const minBid = hre.ethers.parseEther('0.01')

			await auction.connect(seller).createAuction('Item', 3600, minBid)

			await hre.cofhe.expectResultSuccess(hre.cofhe.initializeWithHardhatSigner(bidder1))

			const bidAmount = hre.ethers.parseEther('0.05')
			const [encBid] = await hre.cofhe.expectResultSuccess(
				cofhejs.encrypt([Encryptable.uint256(bidAmount)] as const)
			)

			await auction.connect(bidder1).placeBid(0, encBid, { value: bidAmount })

			// Fast-forward time
			await hre.ethers.provider.send('evm_increaseTime', [3601])
			await hre.ethers.provider.send('evm_mine')

			// Settle
			await auction.connect(seller).settleAuction(0, bidder1.address)

			const info = await auction.getAuction(0)
			expect(info.settled).to.equal(true)
			expect(info.highestBidder).to.equal(bidder1.address)
		})

		it('Privacy: bids stay encrypted (no plaintext leakage)', async function () {
			const { auction, seller, bidder1, bidder2 } = await loadFixture(deployAuctionFixture)
			const minBid = hre.ethers.parseEther('0.01')

			await auction.connect(seller).createAuction('Item', 3600, minBid)

			await hre.cofhe.expectResultSuccess(hre.cofhe.initializeWithHardhatSigner(bidder1))
			await hre.cofhe.expectResultSuccess(hre.cofhe.initializeWithHardhatSigner(bidder2))

			const bid1 = hre.ethers.parseEther('0.1')
			const bid2 = hre.ethers.parseEther('0.2')

			const [encBid1] = await hre.cofhe.expectResultSuccess(
				cofhejs.encrypt([Encryptable.uint256(bid1)] as const)
			)
			const [encBid2] = await hre.cofhe.expectResultSuccess(
				cofhejs.encrypt([Encryptable.uint256(bid2)] as const)
			)

			await auction.connect(bidder1).placeBid(0, encBid1, { value: bid1 })
			await auction.connect(bidder2).placeBid(0, encBid2, { value: bid2 })

			// Verify events don't leak bid amounts
			const filter = auction.filters.BidPlaced()
			const events = await auction.queryFilter(filter)
			events.forEach((event) => {
				// BidPlaced should only have id and bidder, no amount
				expect(event.args.length).to.equal(2)
			})
		})
	})
})
