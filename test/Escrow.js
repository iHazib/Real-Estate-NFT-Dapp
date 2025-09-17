const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {

    let buyer, seller, inspector, lender
    let realEstate, escrow

    beforeEach(async()=>{

        //Setup accounts
        [buyer , seller, inspector, lender] = await ethers.getSigners()
        
        //Deploy RealEstate
        const RealEstate = await ethers.getContractFactory('RealEstate')
        realEstate = await RealEstate.deploy()

        //Mint
        let transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/1.json")
        await transaction.wait()

        const Escrow = await ethers.getContractFactory('Escrow')
        escrow = await Escrow.deploy(
            realEstate.address,
            seller.address,
            inspector.address,
            lender.address
        )

        //Approve property
        transaction = await realEstate.connect(seller).approve(escrow.address, 1)
        await transaction.wait()

        //List property
        transaction = await escrow.connect(seller).list(1, buyer.address, tokens(10), tokens(5))
        await transaction.wait()


    })

    describe('Deployment', () => {
        it ('Return NFT address', async() => {
            const result = await escrow.nftAddress()
            expect(result).to.be.equal(realEstate.address)
        })

        it ('Return seller', async() => {
            const result = await escrow.seller()
            expect(result).to.be.equal(seller.address)
        })

        it ('Return inspector', async() => {
            const result = await escrow.inspector()
            expect(result).to.be.equal(inspector.address)
        })

        it ('Return lender', async() => {
            const result = await escrow.lender()
            expect(result).to.be.equal(lender.address)
        })
    })


    describe('Listing', () => {
        it('Update ownership', async () => {
            expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address)
        })

        it('NFT listed update', async() => {
            const result = await escrow.isListed(1)
            expect(result).to.be.equal(true);
        })

        it('Buyer authorization', async() => {
            const result = await escrow.buyer(1)
            expect(result).to.be.equal(buyer.address);
        })

        it('Returns Purchase Price ', async() => {
            const result = await escrow.purchasePrice(1)
            expect(result).to.be.equal(tokens(10));
        })

        it('Returns Escrow amount', async() => {
            const result = await escrow.escrowAmount(1)
            expect(result).to.be.equal(tokens(5));
        })
    })


    describe('Escrow deposits', async() => {
        it('Updates contract balance', async() => {
            transaction = await escrow.connect(buyer).earnestDeposit(1, {value : tokens(5)});
            await transaction.wait();
            const result = await escrow.getBalance();
            expect(result).to.be.equal(tokens(5));
        } )
    })

    describe('Inspection', async() => {
        it('Updates inspection', async() => {
            transaction = await escrow.connect(inspector).inspectionUpdate(1, true);
            await transaction.wait();
            result = await escrow.inspectionStatus(1);
            expect(result).to.be.equal(true);
        })
    })

    describe('Sale approval', async() => {
        it('Updates approval', async() => {
            const [buyer, seller, inspector, lender] = await ethers.getSigners();

            let tx = await escrow.connect(buyer).approveSale(1);
            await tx.wait();
            expect(await escrow.approval(1, buyer.address)).to.be.equal(true);

            tx = await escrow.connect(seller).approveSale(1);
            await tx.wait();
            expect(await escrow.approval(1, seller.address)).to.be.equal(true);

            tx = await escrow.connect(inspector).approveSale(1);
            await tx.wait();
            expect(await escrow.approval(1, inspector.address)).to.be.equal(true);

            tx = await escrow.connect(lender).approveSale(1);
            await tx.wait();
            expect(await escrow.approval(1, lender.address)).to.be.equal(true);
        })
    })

})
