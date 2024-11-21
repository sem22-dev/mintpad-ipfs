import { ethers } from 'ethers';

// Replace with your actual contract address and updated ABI
const factoryAddress = "0x7769DDfe10576863FE681a4639B3d059a7aBa978";
const factoryABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "symbol", "type": "string" },
      { "internalType": "uint256", "name": "maxSupply", "type": "uint256" },
      { "internalType": "string", "name": "baseURI", "type": "string" },
      { "internalType": "address payable", "name": "recipient", "type": "address" },
      { "internalType": "address payable", "name": "royaltyRecipient", "type": "address" },
      { "internalType": "uint256", "name": "royaltyPercentage", "type": "uint256" }
    ],
    "name": "deployCollection",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "platformFee",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "collectionAddress", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "maxSupply", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "baseURI", "type": "string" }
    ],
    "name": "CollectionDeployed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "collectionAddress", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "maxSupply", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "baseURI", "type": "string" }
    ],
    "name": "ERC1155CollectionDeployed",
    "type": "event"
  }
];

export async function deployCollection({
  name,
  symbol,
  maxSupply,
  baseURI,
  recipient,
  royaltyRecipient,
  royaltyPercentage,
  provider,
}) {
  if (!provider) throw new Error("Provider is required");

  const signer = provider.getSigner();
  const factory = new ethers.Contract(factoryAddress, factoryABI, signer);

  // Retrieve the platform fee from the factory contract
  const platformFee = await factory.platformFee();

  // Deploy a new collection with the specified parameters
  const tx = await factory.deployCollection(
    name,
    symbol,
    maxSupply,
    baseURI,
    recipient,
    royaltyRecipient,
    royaltyPercentage,
    { value: platformFee }
  );

  console.log("Transaction sent:", tx.hash);

  // Wait for the transaction to be mined
  const receipt = await tx.wait();

  // Extract and log the deployed collection's address from the event logs
  const event = receipt.events.find(event => event.event === 'CollectionDeployed' || event.event === 'ERC1155CollectionDeployed');
  if (!event) {
    throw new Error("CollectionDeployed or ERC1155CollectionDeployed event not found");
  }

  const collectionAddress = event.args.collectionAddress;
  console.log("Collection deployed at:", collectionAddress);

  return collectionAddress;
}
