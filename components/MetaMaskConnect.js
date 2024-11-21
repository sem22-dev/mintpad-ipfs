// components/MetaMaskConnect.js

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

export default function MetaMaskConnect() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [chainId, setChainId] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      const ethereumProvider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(ethereumProvider);
    } else {
      alert('Please install MetaMask!');
    }
  }, []);

  const connectWallet = async () => {
    if (provider) {
      try {
        // Request accounts from MetaMask
        const accounts = await provider.send('eth_requestAccounts', []);
        setAccount(accounts[0]);

        // Get network information and set chainId
        const network = await provider.getNetwork();
        setChainId(network.chainId);
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    }
  };

  return (
    <div>
      <button onClick={connectWallet}>Connect MetaMask</button>
      {account && <p>Connected account: {account}</p>}
      {chainId && <p>Connected to chain ID: {chainId}</p>}
    </div>
  );
}
