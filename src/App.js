import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Components
import Navigation from './components/Navigation';
import Search from './components/Search';
import Home from './components/Home';
import Alert from './components/Alert';

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
    if (!window.ethereum) {
      return; 
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);

    const network = await provider.getNetwork();
    
    if (!config[network.chainId]) {
      alert(`Network not supported. Please switch to Sepolia (Chain ID: 11155111). Current: ${network.chainId}`);
      return;
    }

    const realEstate = new ethers.Contract(
      config[network.chainId].RealEstate.address,
      RealEstate.abi,
      provider
    );

    const escrow = new ethers.Contract(
      config[network.chainId].Escrow.address,
      Escrow.abi,
      provider
    );
    setEscrow(escrow);

    const totalSupply = await realEstate.totalSupply();
    const homes = [];

    for (let i = 1; i <= totalSupply; i++) {
      const uri = await realEstate.tokenURI(i);
      
      let url = uri.replace("ipfs.io", "gateway.pinata.cloud");
      
      const response = await fetch(url);
      const metadata = await response.json();

      if (i === 1) metadata.attributes[0].value = "0.001";
      if (i === 2) metadata.attributes[0].value = "0.002";
      if (i === 3) metadata.attributes[0].value = "0.003";

      homes.push(metadata);
    }

    setHomes(homes);

    // Account Handling
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = ethers.utils.getAddress(accounts[0]);
    setAccount(account);

    window.ethereum.on('accountsChanged', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = ethers.utils.getAddress(accounts[0]);
      setAccount(account);
    });
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
        <h3>New Listings in Sepolia</h3>
        
        <div className='cards'>
          {homes.map((home, index) => (
            <div className='card' key={index} onClick={() => toggleProp(home)}>
              <div className='card__image'>
                <img src={home.image} alt={home.name} />
              </div>
              <div className='card__info'>
                <h4>{home.attributes[0].value} ETH</h4>
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
    </div>
  );
}

export default App;