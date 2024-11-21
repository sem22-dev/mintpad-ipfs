"use client";
import { useState } from 'react';
import { ethers } from 'ethers';

export default function SetMintPhase() {
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 16));
  const [mintPrice, setMintPrice] = useState('0.004'); // Mint price in Ether
  const [mintLimit, setMintLimit] = useState(4); // Mint limit per wallet
  const [whitelistEnabled, setWhitelistEnabled] = useState(false); // Whitelist status
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState(null);

  const contractAddress = '0x171a2339C0bD6651dA1538b66Ba023C30bF8ff64'; // Your contract address
  const contractABI = [
    'function addMintPhase(uint256 mintPrice, uint256 mintLimit, uint256 mintStartTime, uint256 mintEndTime, bool whitelistEnabled) external'
  ];

  // Function to connect MetaMask wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send('eth_requestAccounts', []); // Request MetaMask accounts
        const signer = provider.getSigner();
        const userAddress = await signer.getAddress();
        setAccount(userAddress); // Store the user address in state
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  // Function to set the mint phase
  const handleSetMintPhase = async () => {
    if (!account) {
      alert('Please connect your wallet first.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Create contract instance
      const collectionContract = new ethers.Contract(contractAddress, contractABI, signer);

      // Convert mint price to Wei (smallest Ether unit)
      const mintPriceInWei = ethers.utils.parseEther(mintPrice);

      // Send the transaction to set the mint phase
      const tx = await collectionContract.addMintPhase(
        mintPriceInWei,
        mintLimit,
        Math.floor(new Date(startDate).getTime() / 1000), // Convert to seconds
        Math.floor(new Date(endDate).getTime() / 1000),   // Convert to seconds
        whitelistEnabled
      );

      // Wait for the transaction to be confirmed
      await tx.wait();

      setMessage(`Mint phase set successfully! Transaction Hash: ${tx.hash}`);
    } catch (error) {
      console.error('Error setting mint phase:', error);
      setMessage('An error occurred while setting the mint phase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Set Mint Phase</h1>

      {!account ? (
        <button
          onClick={connectWallet}
          style={{
            padding: '10px 20px',
            borderRadius: '5px',
            border: 'none',
            backgroundColor: '#0070f3',
            color: '#fff',
            fontSize: '16px',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          Connect Wallet
        </button>
      ) : (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="start-date" style={{ display: 'block', marginBottom: '5px', color: '#333' }}>
   
            </label>
            Select Mint Start Date:
            <input
              id="start-date"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ccc',
                fontSize: '16px',
                width: '250px',
                backgroundColor: '#fff',
                color: '#000',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="end-date" style={{ display: 'block', marginBottom: '5px', color: '#333' }}>
          
            </label>
            Select Mint End Date:
            <input
              id="end-date"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ccc',
                fontSize: '16px',
                width: '250px',
                backgroundColor: '#fff',
                color: '#000',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="mint-price" style={{ display: 'block', marginBottom: '5px', color: '#333' }}>
         
            </label>
            Mint Price (ETH):
            <input
              id="mint-price"
              type="text"
              value={mintPrice}
              onChange={(e) => setMintPrice(e.target.value)}
              style={{
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ccc',
                fontSize: '16px',
                width: '250px',
                backgroundColor: '#fff',
                color: '#000',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="mint-limit" style={{ display: 'block', marginBottom: '5px', color: '#333' }}>
           
            </label>
            Mint Limit Per Wallet:
            <input
              id="mint-limit"
              type="number"
              value={mintLimit}
              onChange={(e) => setMintLimit(Number(e.target.value))}
              style={{
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ccc',
                fontSize: '16px',
                width: '250px',
                backgroundColor: '#fff',
                color: '#000',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="whitelist-enabled" style={{ display: 'block', marginBottom: '5px', color: '#333' }}>
          
            </label>
            Whitelist Enabled:
            <input
              id="whitelist-enabled"
              type="checkbox"
              checked={whitelistEnabled}
              onChange={(e) => setWhitelistEnabled(e.target.checked)}
              style={{
                marginLeft: '10px',
              }}
            />
          </div>

          <button
            onClick={handleSetMintPhase}
            disabled={loading}
            style={{
              padding: '10px 20px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#0070f3',
              color: '#fff',
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '20px',
            }}
          >
            {loading ? 'Setting Mint Phase...' : 'Set Mint Phase'}
          </button>

          {message && <p style={{ marginTop: '20px', color: 'red' }}>{message}</p>}
        </div>
      )}
    </div>
  );
}
