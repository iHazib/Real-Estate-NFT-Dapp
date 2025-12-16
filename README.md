# 🏡 Millow - Decentralized Real Estate Exchange

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Network](https://img.shields.io/badge/Network-Sepolia%20Testnet-green)
![Status](https://img.shields.io/badge/Status-Live-success)

**Millow** is a fully functional decentralized application (dApp) that facilitates the buying, selling, and lending of real estate on the Ethereum Blockchain.

> **Project Note:** This project was initially inspired by a *Dapp University* tutorial. However, I have significantly re-engineered the infrastructure, smart contract logic, and UI to transition it from a local simulation to a **live, production-grade application on the Sepolia Testnet**.

---

## 🚀 Live Demo

**View the Live dApp:** [PASTE_YOUR_VERCEL_LINK_HERE]

*(Note: Requires MetaMask installed and connected to Sepolia Testnet)*

---

## ⭐ Key Enhancements & Customizations

While the initial concept was based on a tutorial, I implemented major architectural changes to make this a standalone public dApp:

### 1. Infrastructure Migration (Localhost → Sepolia)
*   **Original:** Ran solely on a local Hardhat node; impossible to share.
*   **My Implementation:** Configured fully for the **Sepolia Public Testnet** using **Alchemy RPC**.
*   **Deployment:** Integrated with **Vercel** for live frontend hosting.

### 2. Smart Contract Logic Overhaul
*   **Dynamic Roles:** Refactored the `Escrow.sol` contract to remove hardcoded constructor addresses. Added Setter functions to allow dynamic assignment of Inspectors and Lenders post-deployment.
*   **Public Sale Logic:** Rewrote the `earnestDeposit` logic to support a "First-Come, First-Served" model, allowing **any public wallet** to interact as a buyer (previously restricted to a hardcoded address).
*   **Security:** Added checks to ensure cross-chain safety (preventing Mainnet wallets from interacting with Testnet contracts).

### 3. Modern UI/UX Redesign
*   **Visuals:** Completely replaced the legacy CSS with a modern, responsive design system using glassmorphism, the Inter font family, and a professional color palette.
*   **Feedback Loops:** Added a "Pending Inspection" state to the UI so buyers receive visual feedback after depositing earnest money.
*   **Safety Banners:** Implemented network detection alerts to guide users to the correct chain.

---

## 🛠 Tech Stack

*   **Blockchain:** Solidity, Hardhat, Sepolia Testnet
*   **Frontend:** React.js, Ethers.js (v5)
*   **Storage:** IPFS (via Pinata) for NFT metadata and images
*   **Infrastructure:** Alchemy (RPC), Vercel (Hosting)

---

## ⚙️ How It Works (The Architecture)

The application relies on two main Smart Contracts working in tandem:

### 1. RealEstate.sol (ERC-721)
This contract mints the properties as Non-Fungible Tokens (NFTs). It stores the property details (Image, Square Footage, Address) on IPFS to ensure decentralized data storage.

### 2. Escrow.sol (The Logic)
This contract acts as the trustless middleman, replacing traditional banks and lawyers.
1.  **Listing:** The Seller lists the NFT in the Escrow contract.
2.  **Earnest Deposit:** A Buyer deposits an earnest amount (ETH) to put the house "Under Contract".
3.  **Inspection:** An authorized **Inspector** (Admin) verifies the property.
4.  **Lending:** An authorized **Lender** (Admin) provides the remaining funds.
5.  **Final Sale:** Once all approvals are met, the contract automatically transfers the Deed (NFT) to the Buyer and the Funds (ETH) to the Seller.

---

## 📖 How to Test the App

Since this runs on a public testnet, you can simulate the role of a **Buyer**.

1.  **Get Sepolia ETH:** Use a faucet (e.g., Alchemy or Google) to get free test ETH.
2.  **Connect Wallet:** Click "Connect" in the top right.
3.  **Buy a Home:** Click **"Buy Now"** on any property.
    *   *This will trigger a transaction of approx 0.0005 ETH.*
4.  **Observe Status:** The UI will update to **"Pending Inspection & Approval"**.
    *   *Note: In a real scenario, an Inspector and Lender would now log in to approve. For this demo, those roles are managed by the Deployer.*

---

## 💻 Local Installation

To run the code locally:

```bash
# Clone the repository
git clone https://github.com/[YOUR_GITHUB_USERNAME]/millow-dapp.git

# Install dependencies
npm install

# Run tests
npx hardhat test

# Start local server
npm start
