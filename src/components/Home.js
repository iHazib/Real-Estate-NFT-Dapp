import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import close from '../assets/close.svg';

const Home = ({ home, provider, account, escrow, toggleProp }) => {
  const [hasBought, setHasBought] = useState(false);
  const [hasSold, setHasSold] = useState(false);
  const [hasInspected, setHasInspected] = useState(false);
  const [hasLended, setHasLended] = useState(false);

  const [buyer, setBuyer] = useState(null);
  const [lender, setLender] = useState(null);
  const [inspector, setInspector] = useState(null);
  const [seller, setSeller] = useState(null);
  const [owner, setOwner] = useState(null);

  const fetchDetails = async () => {
    // -- LOGIC PRESERVED FROM YOUR FIXES --
    const buyer = await escrow.buyer(home.id);
    setBuyer(buyer);

    const seller = await escrow.seller();
    setSeller(seller);

    const inspector = await escrow.inspector();
    setInspector(inspector);

    const lender = await escrow.lender();
    setLender(lender);

    const hasBought = await escrow.approval(home.id, buyer);
    setHasBought(hasBought);

    const hasSold = await escrow.approval(home.id, seller);
    setHasSold(hasSold);

    const hasInspected = await escrow.inspectionStatus(home.id);
    setHasInspected(hasInspected);

    const hasLended = await escrow.approval(home.id, lender);
    setHasLended(hasLended);
  };

  const fetchOwner = async () => {
    const listed = await escrow.isListed(home.id);
    if (listed) return;
    const owner = await escrow.buyer(home.id);
    setOwner(owner);
  };

  const buyHandler = async () => {
    try {
      const amount = await escrow.escrowAmount(home.id);
      const signer = await provider.getSigner();
      
      let tx = await escrow.connect(signer).earnestDeposit(home.id, { value: amount });
      await tx.wait();

      tx = await escrow.connect(signer).approveSale(home.id);
      await tx.wait();

      setHasBought(true);
    } catch (err) {
      console.error('Buy error:', err);
    }
  };

  const sellHandler = async () => {
    try {
      const signer = await provider.getSigner();
      let tx = await escrow.connect(signer).approveSale(home.id);
      await tx.wait();

      tx = await escrow.connect(signer).finalizeSale(home.id);
      await tx.wait();

      setHasSold(true);
    } catch (err) {
      console.error("Sell error", err);
    }
  };

  const inspectHandler = async () => {
    try {
      const signer = await provider.getSigner();
      let tx = await escrow.connect(signer).inspectionUpdate(home.id, true);
      await tx.wait();

      tx = await escrow.connect(signer).approveSale(home.id);
      await tx.wait();

      setHasInspected(true);
    } catch (err) {
      console.error("Inspection error", err);
    }
  };

  const lendHandler = async () => {
    try {
      const signer = await provider.getSigner();
      const purchasePrice = await escrow.purchasePrice(home.id);
      const escrowAmt = await escrow.escrowAmount(home.id);
      const lendAmount = purchasePrice.sub(escrowAmt);

      let tx = await escrow.connect(signer).approveSale(home.id);
      await tx.wait();

      await signer.sendTransaction({ to: escrow.address, value: lendAmount });
      setHasLended(true);
    } catch (err) {
      console.error("Lending error", err);
    }
  };

  useEffect(() => {
    fetchDetails();
    fetchOwner();
  }, [hasSold]);

  return (
    <div className="home">
      <div className="home__details">
        
        <div className="home__image">
          <img src={home.image} alt={home.name} />
        </div>

        <div className="home__overview">
          <h1>{home.name}</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {home.address}
          </p>

          <h2>{home.attributes[0].value} ETH</h2>

          <div style={{ margin: '1rem 0', display: 'flex', gap: '20px' }}>
            <p><strong>{home.attributes[2].value}</strong> Beds</p>
            <p><strong>{home.attributes[3].value}</strong> Bath</p>
            <p><strong>{home.attributes[4].value}</strong> Sqft</p>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid var(--color-border)', margin: '1.5rem 0' }} />

          <h3>About this home</h3>
          <p style={{ margin: '1rem 0', lineHeight: '1.6' }}>{home.description}</p>

          <div style={{ marginTop: 'auto' }}>
            {owner ? (
              <div className="home__owned">
                Owned by {owner.slice(0, 6) + '...' + owner.slice(38, 42)}
              </div>
            ) : account.toLowerCase() === inspector?.toLowerCase() ? (
              <button className="home__buy" onClick={inspectHandler} disabled={hasInspected}>
                {hasInspected ? 'Inspection Approved' : 'Approve Inspection'}
              </button>
            ) : account.toLowerCase() === lender?.toLowerCase() ? (
              <button className="home__buy" onClick={lendHandler} disabled={hasLended}>
                {hasLended ? 'Loan Approved' : 'Approve & Lend'}
              </button>
            ) : account.toLowerCase() === seller?.toLowerCase() ? (
              <button className="home__buy" onClick={sellHandler} disabled={hasSold}>
                {hasSold ? 'Sold' : 'Approve Sale'}
              </button>
            ) : (
              <>
                {hasBought ? (
                  <div className="home__owned">
                    Pending Inspection & Approval
                  </div>
                ) : (
                  <button className="home__buy" onClick={buyHandler} disabled={hasBought}>
                    Buy Now
                  </button>
                )}
                <button className="home__contact">Contact Agent</button>
              </>
            )}
          </div>
        </div>

        <button className="home__close" onClick={toggleProp}>
          <img src={close} alt="Close" />
        </button>
      </div>
    </div>
  );
};

export default Home;