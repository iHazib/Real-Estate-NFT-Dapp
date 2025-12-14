const hre = require("hardhat");
const { ethers } = require("hardhat");

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

async function main() {
  // Accounts setup
  const [deployer] = await ethers.getSigners();
  
  console.log(`Deploying contracts with the account: ${deployer.address}`);
  console.log(`Account balance: ${(await deployer.getBalance()).toString()}`);

  // Deploying Real Estate
  const RealEstate = await ethers.getContractFactory('RealEstate')
  const realEstate = await RealEstate.deploy()
  await realEstate.deployed(); // v5 syntax

  console.log(`Deployed Real Estate contract at: ${realEstate.address}`);

  // Minting Properties
  console.log('Minting 3 properties....');
  for(let i=1; i<4; i++){
      const uri = `https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${i}.json`;
      let transaction = await realEstate.connect(deployer).mint(uri);
      await transaction.wait();
  }

  // Deploying Escrow
  const Escrow = await ethers.getContractFactory('Escrow')
  const escrow = await Escrow.deploy(realEstate.address)
  await escrow.deployed(); // v5 syntax

  console.log(`Deployed Escrow contract at: ${escrow.address}`)

  // Assigning Roles
  console.log("Setting roles...");
  let transaction = await escrow.connect(deployer).setSeller(deployer.address);
  await transaction.wait();
  
  transaction = await escrow.connect(deployer).setInspector(deployer.address);
  await transaction.wait();

  transaction = await escrow.connect(deployer).setLender(deployer.address);
  await transaction.wait();

  // Property approval
  console.log("Approving properties...");
  for(let i=1 ; i<4 ; i++){
    transaction = await realEstate.connect(deployer).approve(escrow.address, i)
    await transaction.wait()
  }

  // Listing Properties
  console.log("Listing properties...");
  console.log("Listing properties...");
  
  transaction = await escrow.connect(deployer).list(1, tokens(0.001), tokens(0.0005)) 
  await transaction.wait()

  transaction = await escrow.connect(deployer).list(2, tokens(0.002), tokens(0.001))
  await transaction.wait()

  transaction = await escrow.connect(deployer).list(3, tokens(0.003), tokens(0.0015))
  await transaction.wait()
  console.log('Finished. SAVE THESE ADDRESSES!');
  console.log(`RealEstate: ${realEstate.address}`);
  console.log(`Escrow: ${escrow.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});