require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); 

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/your-api-key";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17", 
  networks: {
    localhost: {},
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY]
    }
  },
};
