import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Components
import Navigation from './components/Navigation';
import Search from './components/Search';
import Home from './components/Home';
import Alert from './components/Alert';
import Footer from './components/Footer';

// ABIs
import RealEstate from './abis/RealEstate.json';
import Escrow from './abis/Escrow.json';

// Config
import config from './config.json';

function App() {
  const [provider, setProvider] = useState(null);
  const [escrow, setEscrow] = useState(null);
  const [account, setAccount] = useState(null);
  const [homes, setHomes] = useState([]);
  const [home, setHome] = useState({});
  const [toggle, setToggle] = useState(false);

  const loadBlockchainData = async () => {
    let provider;
    let chainId;

    if (window.ethereum) {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      chainId = network.chainId;

      // Setup listener for account changes
      window.ethereum.on('accountsChanged', async () => {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = ethers.utils.getAddress(accounts[0]);
        setAccount(account);
      });

      // Check if already connected
      const accounts = await provider.listAccounts();
      if(accounts.length > 0) {
          setAccount(ethers.utils.getAddress(accounts[0]));
      }

    } else {
      // Fallback to Read-Only Provider
      // Detect if we are on localhost
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          // Use Localhost RPC
          chainId = 31337;
          provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
      } else {
          // Default to Sepolia
          chainId = 11155111;
          provider = ethers.getDefaultProvider('sepolia');
      }
    }

    // Force Localhost for development if needed (Optional)
    // chainId = 31337;

    setProvider(provider);
    
    // Check if config exists for this chain
    if (!config[chainId]) {
      // Fallback to Sepolia Read-Only if network is not supported
      provider = ethers.getDefaultProvider('sepolia');
      chainId = 11155111;

      // If we were connected to an unsupported network, disconnect the account in UI
      // so the user knows they are in read-only mode and need to switch to transact.
      setAccount(null);
    }

    const realEstate = new ethers.Contract(
      config[chainId].RealEstate.address,
      RealEstate.abi,
      provider
    );

    const escrow = new ethers.Contract(
      config[chainId].Escrow.address,
      Escrow.abi,
      provider
    );
    setEscrow(escrow);

    const totalSupply = await realEstate.totalSupply();
    const homes = [];

    for (let i = 1; i <= totalSupply; i++) {
      const uri = await realEstate.tokenURI(i);
      
      // Use public gateway for better availability
      let url = uri.replace("ipfs.io", "gateway.pinata.cloud");
      
      try {
        const response = await fetch(url);
        const metadata = await response.json();

        // Fetch status from Smart Contract
        // We need to know if it's Rent or Sale, and Price.
        // The contract has `purchasePrice`, `rentPrice`, `isRent`.
        // We should add this to the home object.

        // Note: The original code hardcoded prices for 1,2,3.
        // We should fetch from contract now if possible, or keep simple.
        // Let's fetch from contract to be accurate.

        const isRent = await escrow.isRent(i);
        let price;
        if (isRent) {
            price = await escrow.rentPrice(i);
            metadata.type = "Rent";
        } else {
            price = await escrow.purchasePrice(i);
            metadata.type = "Sale";
        }

        metadata.price = ethers.utils.formatEther(price);
        metadata.id = i; // Store ID for later usage

        // Legacy attribute override (optional, can remove if we trust contract)
        metadata.attributes[0].value = metadata.price;

        homes.push(metadata);
      } catch (error) {
        console.error("Error fetching metadata for token", i, error);
      }
    }

    setHomes(homes);
  };

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const toggleProp = (home) => {
    setHome(home);
    setToggle(!toggle);
  };

  return (
    <div>
      <Alert />
      <Navigation account={account} setAccount={setAccount} />
      <Search />

      <div className='cards__section'>
        <h3>Current Listings</h3>
        
        <div className='cards'>
          {homes.map((home, index) => (
            <div className='card' key={index} onClick={() => toggleProp(home)}>
              <div className='card__image'>
                <img src={home.image} alt={home.name} />
                {home.type === "Rent" && <div className='card__badge'>FOR RENT</div>}
              </div>
              <div className='card__info'>
                <h4>{home.price} ETH {home.type === "Rent" && "/ mo"}</h4>
                <p>
                  <strong>{home.attributes[2].value}</strong> bds |{' '}
                  <strong>{home.attributes[3].value}</strong> ba |{' '}
                  <strong>{home.attributes[4].value}</strong> sqft
                </p>
                <p>{home.address}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toggle && (
        <Home
          home={home}
          provider={provider}
          account={account}
          escrow={escrow}
          toggleProp={toggleProp}
        />
      )}

      <Footer />
    </div>
  );
}

export default App;
