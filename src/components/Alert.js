import { useEffect, useState } from 'react';

const Alert = () => {
  const [show, setShow] = useState(true);

  if (!show) return null;

  return (
    <div className="alert">
      <div className="alert__message">
        <p><strong>🚧 TESTNET DEMO:</strong> This runs on the <strong>Sepolia Test Network</strong>.</p>
        <p>You need <strong>Sepolia ETH</strong> to buy homes. (It's free!)</p>
      </div>
      <button onClick={() => setShow(false)} className="alert__close">
        Dismiss
      </button>
    </div>
  );
}

export default Alert;