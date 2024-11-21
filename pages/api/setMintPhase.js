import { ethers } from 'ethers';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { startTime, endTime, mintPhase, phaseSupply, phaseMintPrice, phaseMintLimit, userAddress } = req.body;
  const collectionAddress = '0x00fbdb146bFd9c1e86ae17b32C89919B7200dbC0'; // Hardcoded collection address

  try {
    // Get the provider from the user's MetaMask wallet
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner(userAddress); // The signer is obtained from the user's wallet

    // Get the contract instance with the signer
    const collectionContract = new ethers.Contract(
      collectionAddress,
      [
        'function setMintPhase(uint256 startTime, uint256 endTime, uint256 mintPhase, uint256 phaseSupply, uint256 phaseMintPrice, uint256 phaseMintLimit) external'
      ],
      signer
    );

    // Send the transaction to set mint phase
    const tx = await collectionContract.setMintPhase(
      startTime,
      endTime,
      mintPhase,
      phaseSupply,
      ethers.parseEther(phaseMintPrice),
      phaseMintLimit
    );
    await tx.wait();

    return res.status(200).json({ message: 'Mint phase set successfully', txHash: tx.hash });
  } catch (error) {
    console.error('Error setting mint phase:', error);
    return res.status(500).json({ error: 'Failed to set mint phase' });
  }
}
