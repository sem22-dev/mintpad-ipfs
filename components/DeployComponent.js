"use client"
import { useState } from 'react';
import { ethers } from 'ethers';
import { deployCollection } from '../lib/deploy';
import UploadComponent from "../components/UploadComponent";
import SetMintPhase from "../components/SetMintPhase";

export default function DeployComponent() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [status, setStatus] = useState('');

  // State for form inputs
  const [name, setName] = useState('MyNFTCollection');
  const [symbol, setSymbol] = useState('MNC');
  const [maxSupply, setMaxSupply] = useState('100');
  const [baseURI, setBaseURI] = useState('ipfs:///');
  const [recipient, setRecipient] = useState('0x68EB182aF9DC1e818798F5EA75F061D9cA7CC76a');
  const [royaltyRecipient, setRoyaltyRecipient] = useState('0x68EB182aF9DC1e818798F5EA75F061D9cA7CC76a');
  const [royaltyPercentage, setRoyaltyPercentage] = useState('50'); // 5% royalties

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        const signer = provider.getSigner();
        const userAddress = await signer.getAddress();
        const network = await provider.getNetwork();

        setAccount(userAddress);
        setChainId(network.chainId);
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const handleDeploy = async () => {
    if (!account) {
      alert('Please connect your wallet first.');
      return;
    }

    if (!ethers.utils.isAddress(recipient) || !ethers.utils.isAddress(royaltyRecipient)) {
      setStatus('Invalid address format.');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const contractAddress = await deployCollection({
        name,
        symbol,
        maxSupply: parseInt(maxSupply, 10),
        baseURI,
        recipient,
        royaltyRecipient,
        royaltyPercentage: parseInt(royaltyPercentage, 10),
        provider,
      });

      setStatus(`Collection successfully deployed at address: ${contractAddress}`);

    } catch (error) {
      console.error('Error deploying collection:', error);
      setStatus('Failed to deploy collection.');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {account ? (
        <div>
          <UploadComponent />
          <SetMintPhase />
          <p><strong>Connected account:</strong> {account}</p>
          <p><strong>Connected chain ID:</strong> {chainId}</p>
          <div style={{ display: 'grid', gridGap: '10px', marginBottom: '20px' }}>
            <label>
              Name:
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '8px', color: 'black' }} />
            </label>
            <label>
              Symbol:
              <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value)} style={{ width: '100%', padding: '8px', color: 'black' }} />
            </label>
            <label>
              Max Supply:
              <input type="number" value={maxSupply} onChange={(e) => setMaxSupply(e.target.value)} style={{ width: '100%', padding: '8px', color: 'black' }} />
            </label>
            <label>
              Base URI:
              <input type="text" value={baseURI} onChange={(e) => setBaseURI(e.target.value)} style={{ width: '100%', padding: '8px', color: 'black' }} />
            </label>
            <label>
              Recipient Address:
              <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} style={{ width: '100%', padding: '8px', color: 'black' }} />
            </label>
            <label>
              Royalty Recipient Address:
              <input type="text" value={royaltyRecipient} onChange={(e) => setRoyaltyRecipient(e.target.value)} style={{ width: '100%', padding: '8px', color: 'black' }} />
            </label>
            <label>
              Royalty Percentage (in basis points):
              <input type="number" value={royaltyPercentage} onChange={(e) => setRoyaltyPercentage(e.target.value)} style={{ width: '100%', padding: '8px', color: 'black' }} />
            </label>
          </div>
          <button onClick={handleDeploy} style={{ width: '100%', padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px' }}>
            Deploy Collection
          </button>
          {status && <p style={{ marginTop: '20px' }}>{status}</p>}
        </div>
      ) : (
        <button onClick={connectWallet} style={{ width: '100%', padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px' }}>
          Connect MetaMask
        </button>
      )}
    </div>
  );
}
