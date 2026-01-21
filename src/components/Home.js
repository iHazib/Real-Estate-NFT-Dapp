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

  const [tenant, setTenant] = useState(null);
  const [isRent, setIsRent] = useState(false);

  const fetchDetails = async () => {
    // Basic roles
    const seller = await escrow.seller();
    setSeller(seller);

    const inspector = await escrow.inspector();
    setInspector(inspector);

    const lender = await escrow.lender();
    setLender(lender);

    // Check if Rent or Sale
    const isRentStatus = await escrow.isRent(home.id);
    setIsRent(isRentStatus);

    if (isRentStatus) {
        const tenantAddr = await escrow.tenant(home.id);
        if (tenantAddr !== ethers.constants.AddressZero) {
             setTenant(tenantAddr);
        }
    } else {
        // Sale Logic
        const buyer = await escrow.buyer(home.id);
        setBuyer(buyer);

        const hasBought = await escrow.approval(home.id, buyer);
        setHasBought(hasBought);

        const hasSold = await escrow.approval(home.id, seller);
        setHasSold(hasSold);

        const hasLended = await escrow.approval(home.id, lender);
        setHasLended(hasLended);
    }

    const hasInspected = await escrow.inspectionStatus(home.id);
    setHasInspected(hasInspected);
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

      // Only buyer approves initially? Or does this logic need review?
      // Based on original code, buyer approves immediately after deposit.
      tx = await escrow.connect(signer).approveSale(home.id);
      await tx.wait();

      setHasBought(true);
    } catch (err) {
      console.error('Buy error:', err);
    }
  };

  const rentHandler = async () => {
      try {
          const rentPrice = await escrow.rentPrice(home.id);
          const deposit = await escrow.escrowAmount(home.id);
          const total = rentPrice.add(deposit);

          const signer = await provider.getSigner();
          const tx = await escrow.connect(signer).rentProperty(home.id, { value: total });
          await tx.wait();

          setTenant(await signer.getAddress());
      } catch (err) {
          console.error("Rent error:", err);
      }
  }

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

      // Inspector also approves sale in original logic
      if (!isRent) {
        tx = await escrow.connect(signer).approveSale(home.id);
        await tx.wait();
      }

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
  }, [hasSold, tenant]);

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

          <h2>{home.attributes[0].value} ETH {isRent && "/ mo"}</h2>

          <div style={{ margin: '1rem 0', display: 'flex', gap: '20px' }}>
            <p><strong>{home.attributes[2].value}</strong> Beds</p>
            <p><strong>{home.attributes[3].value}</strong> Bath</p>
            <p><strong>{home.attributes[4].value}</strong> Sqft</p>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid var(--color-border)', margin: '1.5rem 0' }} />

          <h3>About this home</h3>
          <p style={{ margin: '1rem 0', lineHeight: '1.6' }}>{home.description}</p>

          <div style={{ marginTop: 'auto' }}>
            {/* Logic Branching for Rent vs Sale */}

            {/* If Property is RENT Type */}
            {isRent ? (
                <>
                    {tenant ? (
                        <div className="home__owned">
                            Rented by {tenant.slice(0, 6) + '...' + tenant.slice(38, 42)}
                        </div>
                    ) : (
                         /* Rent Action */
                         <button className="home__buy" onClick={rentHandler} disabled={!account}>
                            {account ? "Rent Now" : "Connect Wallet to Rent"}
                         </button>
                    )}
                </>
            ) : (
                /* SALE Type */
                <>
                    {owner ? (
                      <div className="home__owned">
                        Owned by {owner.slice(0, 6) + '...' + owner.slice(38, 42)}
                      </div>
                    ) : account && account.toLowerCase() === inspector?.toLowerCase() ? (
                      <button className="home__buy" onClick={inspectHandler} disabled={hasInspected}>
                        {hasInspected ? 'Inspection Approved' : 'Approve Inspection'}
                      </button>
                    ) : account && account.toLowerCase() === lender?.toLowerCase() ? (
                      <button className="home__buy" onClick={lendHandler} disabled={hasLended}>
                        {hasLended ? 'Loan Approved' : 'Approve & Lend'}
                      </button>
                    ) : account && account.toLowerCase() === seller?.toLowerCase() ? (
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
                          <button className="home__buy" onClick={buyHandler} disabled={hasBought || !account}>
                            {account ? "Buy Now" : "Connect Wallet to Buy"}
                          </button>
                        )}
                      </>
                    )}
                </>
            )}

            {(!account || (!tenant && !owner)) && (
                <button className="home__contact">Contact Agent</button>
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
