"use client";
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function MintComponent() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [status, setStatus] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [mintPrice, setMintPrice] = useState('');
  const [totalPhases, setTotalPhases] = useState(0);
  const [phases, setPhases] = useState([]);

  // Address of the deployed contract
  const collectionAddress = "0x171a2339C0bD6651dA1538b66Ba023C30bF8ff64"; // Replace with your deployed contract address

  useEffect(() => {
    const fetchPhaseDetails = async () => {
      if (!account) return;

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const collectionContract = new ethers.Contract(collectionAddress, [
          "function getTotalPhases() external view returns (uint256)",
          "function getPhase(uint256 phaseId) external view returns (uint256 mintPrice, uint256 mintLimit)",
          "function mint(uint256 phaseId, uint256 tokenId) external payable",
          "function tokenURI(uint256 tokenId) external view returns (string)"
        ], signer);

        const total = await collectionContract.getTotalPhases();
        setTotalPhases(total.toNumber()); // Convert BigNumber to number

        const phaseDetails = [];
        for (let i = 0; i < total; i++) {
          const [mintPriceBig, mintLimitBig] = await collectionContract.getPhase(i);
          const mintPrice = ethers.utils.formatEther(mintPriceBig); // Convert BigNumber to string
          const mintLimit = mintLimitBig.toString(); // Convert BigNumber to string
          phaseDetails.push({ mintPrice, mintLimit });
        }
        setPhases(phaseDetails);

      } catch (error) {
        console.error('Error fetching phase details:', error);
        setStatus('Failed to fetch phase details.');
      }
    };

    fetchPhaseDetails();
  }, [account]);

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

  const handleMint = async () => {
    if (!account) {
      alert('Please connect your wallet first.');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const collectionContract = new ethers.Contract(collectionAddress, [
        "function getPhase(uint256 phaseId) external view returns (uint256 mintPrice, uint256 mintLimit)",
        "function mint(uint256 phaseId, uint256 tokenId) external payable",
        "function tokenURI(uint256 tokenId) external view returns (string)"
      ], signer);

      const phaseId = 0; // Adjust as needed
      const [mintPriceBig] = await collectionContract.getPhase(phaseId);

      const mintPriceInEther = ethers.utils.formatEther(mintPriceBig);
      setMintPrice(mintPriceInEther); // Display mint price in ETH

      if (!tokenId) {
        alert('Please enter a token ID.');
        return;
      }

      const value = ethers.utils.parseEther(mintPriceInEther);

      console.log(`Minting token with ID ${tokenId}...`);
      const tx = await collectionContract.mint(phaseId, tokenId, {
        value: value,
      });
      console.log("Minting transaction sent:", tx.hash);

      const receipt = await tx.wait();
      console.log(`Minting transaction confirmed in block ${receipt.blockNumber}`);

      const tokenURI = await collectionContract.tokenURI(tokenId);
      console.log(`Token URI for token ID ${tokenId}: ${tokenURI}`);
      setStatus(`Token ID ${tokenId} minted successfully! Token URI: ${tokenURI}`);

    } catch (error) {
      console.error('Error minting token:', error);
      setStatus('Failed to mint token.');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {account ? (
        <div>
          <p><strong>Connected account:</strong> {account}</p>
          <p><strong>Connected chain ID:</strong> {chainId}</p>
          <div style={{ display: 'grid', gridGap: '10px', marginBottom: '20px' }}>
            <label>
              Token ID:
              <input
                type="number"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                style={{ width: '100%', padding: '8px', color: 'black' }}
              />
            </label>
            <p>Mint Price (ETH): {mintPrice}</p>
            <p>Total Phases: {totalPhases}</p>
            {phases.map((phase, index) => (
              <div key={index}>
                <p><strong>Phase {index}:</strong></p>
                <p>Mint Price: {phase.mintPrice} ETH</p>
                <p>Mint Limit: {phase.mintLimit}</p>
              </div>
            ))}
          </div>
          <button
            onClick={handleMint}
            style={{ width: '100%', padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            Mint Token
          </button>
          {status && <p style={{ marginTop: '20px' }}>{status}</p>}
        </div>
      ) : (
        <button
          onClick={connectWallet}
          style={{ width: '100%', padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          Connect MetaMask
        </button>
      )}
    </div>
  );
}
