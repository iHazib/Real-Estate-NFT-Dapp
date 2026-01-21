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

  // Minting 9 Properties (Reusing 3 metadata files)
  console.log('Minting 9 properties....');
  for(let i=1; i<=9; i++){
      // Cycle through 1, 2, 3
      let metaId = ((i - 1) % 3) + 1;
      const uri = `https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${metaId}.json`;

      let transaction = await realEstate.connect(deployer).mint(uri);
      await transaction.wait();
  }

  // Deploying Escrow
  const Escrow = await ethers.getContractFactory('Escrow')
  const escrow = await Escrow.deploy(realEstate.address)
  await escrow.deployed();

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
  for(let i=1 ; i<=9 ; i++){
    transaction = await realEstate.connect(deployer).approve(escrow.address, i)
    await transaction.wait()
  }

  // Listing Properties
  console.log("Listing properties...");

  // 1-3: Sale
  transaction = await escrow.connect(deployer).list(1, tokens(10), tokens(5))
  await transaction.wait()

  transaction = await escrow.connect(deployer).list(2, tokens(15), tokens(5))
  await transaction.wait()

  transaction = await escrow.connect(deployer).list(3, tokens(20), tokens(10))
  await transaction.wait()

  // 4-6: Rent
  // listRent(nftID, rentPrice, escrowAmount)
  transaction = await escrow.connect(deployer).listRent(4, tokens(1), tokens(2))
  await transaction.wait()

  transaction = await escrow.connect(deployer).listRent(5, tokens(1.5), tokens(2))
  await transaction.wait()

  transaction = await escrow.connect(deployer).listRent(6, tokens(2), tokens(3))
  await transaction.wait()

  // 7-9: Sale again
  transaction = await escrow.connect(deployer).list(7, tokens(12), tokens(6))
  await transaction.wait()

  transaction = await escrow.connect(deployer).list(8, tokens(18), tokens(9))
  await transaction.wait()

  transaction = await escrow.connect(deployer).list(9, tokens(25), tokens(10))
  await transaction.wait()

  console.log('Finished. SAVE THESE ADDRESSES!');
  console.log(`RealEstate: ${realEstate.address}`);
  console.log(`Escrow: ${escrow.address}`);

  // Save to config.json
  const fs = require('fs');
  const path = require('path');
  const configPath = path.join(__dirname, '../src/config.json');

  let config = {};
  if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  const networkId = hre.network.config.chainId || 31337;

  config[networkId] = {
      "RealEstate": { "address": realEstate.address },
      "Escrow": { "address": escrow.address }
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
  console.log(`Updated config.json for network ${networkId}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
