const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {

    let deployer, buyer, seller, inspector, lender, tenant
    let realEstate, escrow

    beforeEach(async () => {
        // 1. Setup accounts
        [deployer, seller, buyer, inspector, lender, tenant] = await ethers.getSigners()

        // 2. Deploy Real Estate
        const RealEstate = await ethers.getContractFactory('RealEstate')
        realEstate = await RealEstate.deploy()
        await realEstate.deployed()

        // 3. Mint Logic
        // Mint 2 properties
        let transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/1.json")
        await transaction.wait()

        transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/2.json")
        await transaction.wait()

        // 4. Deploy Escrow
        const Escrow = await ethers.getContractFactory('Escrow')
        escrow = await Escrow.deploy(realEstate.address)
        await escrow.deployed()

        // 5. SET THE ROLES
        await escrow.connect(deployer).setSeller(seller.address)
        await escrow.connect(deployer).setInspector(inspector.address)
        await escrow.connect(deployer).setLender(lender.address)

        // 6. Approve Properties
        transaction = await realEstate.connect(seller).approve(escrow.address, 1)
        await transaction.wait()

        transaction = await realEstate.connect(seller).approve(escrow.address, 2)
        await transaction.wait()

        // 7. List Property 1 for SALE
        transaction = await escrow.connect(seller).list(1, tokens(10), tokens(5))
        await transaction.wait()
    })

    describe('Deployment', () => {
        it('Returns NFT address', async () => {
            const result = await escrow.nftAddress()
            expect(result).to.be.equal(realEstate.address)
        })

        it('Returns seller', async () => {
            const result = await escrow.seller()
            expect(result).to.be.equal(seller.address)
        })

        it('Returns inspector', async () => {
            const result = await escrow.inspector()
            expect(result).to.be.equal(inspector.address)
        })

        it('Returns lender', async () => {
            const result = await escrow.lender()
            expect(result).to.be.equal(lender.address)
        })
    })

    describe('Listing (Sale)', () => {
        it('Updates ownership', async () => {
            expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address)
        })

        it('Returns Buyer', async () => {
            const result = await escrow.buyer(1)
            expect(result).to.be.equal(ethers.constants.AddressZero)
        })

        it('Returns Purchase Price', async () => {
            const result = await escrow.purchasePrice(1)
            expect(result).to.be.equal(tokens(10))
        })

        it('Returns Escrow amount', async () => {
            const result = await escrow.escrowAmount(1)
            expect(result).to.be.equal(tokens(5))
        })

        it('Checks isRent is false', async () => {
             const result = await escrow.isRent(1)
             expect(result).to.be.equal(false)
        })
    })

    describe('Deposits (Sale)', () => {
        it('Updates contract balance', async () => {
            const transaction = await escrow.connect(buyer).earnestDeposit(1, { value: tokens(5) })
            await transaction.wait()
            const result = await escrow.getBalance()
            expect(result).to.be.equal(tokens(5))
        })
    })

    describe('Inspection', () => {
        it('Updates inspection status', async () => {
            const transaction = await escrow.connect(inspector).inspectionUpdate(1, true)
            await transaction.wait()
            const result = await escrow.inspectionStatus(1)
            expect(result).to.be.equal(true)
        })
    })

    describe('Approval', () => {
        it('Updates approval status', async () => {
            let transaction = await escrow.connect(buyer).approveSale(1)
            await transaction.wait()
            expect(await escrow.approval(1, buyer.address)).to.be.equal(true)

            transaction = await escrow.connect(seller).approveSale(1)
            await transaction.wait()
            expect(await escrow.approval(1, seller.address)).to.be.equal(true)

            transaction = await escrow.connect(lender).approveSale(1)
            await transaction.wait()
            expect(await escrow.approval(1, lender.address)).to.be.equal(true)
        })
    })

    describe('Sale', () => {
        beforeEach(async () => {
            let transaction = await escrow.connect(buyer).earnestDeposit(1, { value: tokens(5) })
            await transaction.wait()

            transaction = await escrow.connect(inspector).inspectionUpdate(1, true)
            await transaction.wait()

            transaction = await escrow.connect(buyer).approveSale(1)
            await transaction.wait()

            transaction = await escrow.connect(seller).approveSale(1)
            await transaction.wait()

            transaction = await escrow.connect(lender).approveSale(1)
            await transaction.wait()

            await lender.sendTransaction({ to: escrow.address, value: tokens(5) })

            transaction = await escrow.connect(seller).finalizeSale(1)
            await transaction.wait()
        })

        it('Updates ownership', async () => {
            expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address)
        })

        it('Updates balance', async () => {
            expect(await escrow.getBalance()).to.be.equal(0)
        })
    })

    describe('Renting', () => {
        beforeEach(async () => {
             // List Property 2 for RENT
             // Rent Price: 1 ETH, Deposit: 2 ETH
             const transaction = await escrow.connect(seller).listRent(2, tokens(1), tokens(2))
             await transaction.wait()
        })

        it('Updates ownership to escrow', async () => {
            expect(await realEstate.ownerOf(2)).to.be.equal(escrow.address)
        })

        it('Sets isRent to true', async () => {
             expect(await escrow.isRent(2)).to.be.equal(true)
        })

        it('Returns Rent Price', async () => {
             expect(await escrow.rentPrice(2)).to.be.equal(tokens(1))
        })

        it('Allows tenant to rent', async () => {
             // Tenant must pay Rent + Deposit = 1 + 2 = 3 ETH
             const transaction = await escrow.connect(tenant).rentProperty(2, { value: tokens(3) })
             await transaction.wait()

             expect(await escrow.tenant(2)).to.be.equal(tenant.address)
             expect(await escrow.isListed(2)).to.be.equal(false)

             // Contract should hold only the deposit (2 ETH)
             expect(await escrow.getBalance()).to.be.equal(tokens(2))
        })

        it('Ends lease correctly', async () => {
             await escrow.connect(tenant).rentProperty(2, { value: tokens(3) })

             // End Lease
             const transaction = await escrow.connect(seller).endLease(2)
             await transaction.wait()

             expect(await escrow.tenant(2)).to.be.equal(ethers.constants.AddressZero)
             expect(await escrow.isListed(2)).to.be.equal(true)
             expect(await escrow.getBalance()).to.be.equal(0)
        })

        it('Prevents sale deposit on rent property', async () => {
             await expect(escrow.connect(buyer).earnestDeposit(2, { value: tokens(5) })).to.be.revertedWith("Property is for rent, not sale")
        })
    })
})
