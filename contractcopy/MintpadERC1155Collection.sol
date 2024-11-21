// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title Mintpad ERC-1155 Collection
 * @dev ERC1155 NFT collection contract with adjustable mint price, max supply, and royalties.
 */
contract MintpadERC1155Collection is ERC1155, Ownable {
    using Address for address payable;
    using Strings for uint256;

    enum MintPhase { None, Public, Whitelist }
    MintPhase public currentMintPhase;

    string public collectionName;
    string public collectionSymbol;
    uint256 public maxSupply;
    uint256 public currentSupply;
    string private baseTokenURI;
    string private preRevealURI;
    address payable[] public recipientWallets;
    address payable[] public royaltyWallets;

    uint256 public royaltyPercentage;
    uint256 public recipientSplitPercentage;
    uint256 public royaltyWalletSplitPercentage;

    struct PhaseSettings {
        uint256 mintPrice;
        uint256 mintLimit;
        uint256 mintStartTime;
        uint256 mintEndTime;
    }

    PhaseSettings public publicPhaseSettings;
    PhaseSettings public whitelistPhaseSettings;

    mapping(address => bool) public whitelist;
    mapping(address => uint256) public whitelistMinted;

    modifier onlyDeployer() {
        require(msg.sender == owner(), "Caller is not the owner");
        _;
    }

    constructor(
        string memory _collectionName,
        string memory _collectionSymbol,
        string memory _baseTokenURI,
        string memory _preRevealURI,
        uint256 _maxSupply,
        address payable[] memory _recipientWallets,
        address payable[] memory _royaltyWallets,
        uint256 _royaltyPercentage,
        uint256 _recipientSplitPercentage,
        uint256 _royaltyWalletSplitPercentage,
        address _owner
    ) ERC1155(_baseTokenURI) Ownable(_owner) {
        require(_royaltyPercentage <= 10000, "Invalid royalty percentage");
        require(_recipientSplitPercentage <= 10000, "Invalid recipient split percentage");
        require(_royaltyWalletSplitPercentage <= 10000, "Invalid royalty wallet split percentage");

        collectionName = _collectionName;
        collectionSymbol = _collectionSymbol;
        baseTokenURI = _baseTokenURI;
        preRevealURI = _preRevealURI;
        maxSupply = _maxSupply;
        recipientWallets = _recipientWallets;
        royaltyWallets = _royaltyWallets;
        royaltyPercentage = _royaltyPercentage;
        recipientSplitPercentage = _recipientSplitPercentage;
        royaltyWalletSplitPercentage = _royaltyWalletSplitPercentage;
    }

    function mint(uint256 id, uint256 amount) external payable {
        require(currentSupply + amount <= maxSupply, "Exceeds max supply");
        
        uint256 mintPrice = getCurrentMintPrice();
        require(msg.value == mintPrice * amount, "Incorrect value sent");
        require(block.timestamp >= getMintStartTime() && block.timestamp <= getMintEndTime(), "Minting not allowed at this time");

        if (currentMintPhase == MintPhase.Whitelist) {
            require(whitelist[msg.sender], "Address not whitelisted");
            require(whitelistMinted[msg.sender] + amount <= whitelistPhaseSettings.mintLimit, "Exceeds whitelist mint limit");
            whitelistMinted[msg.sender] += amount;
        } else if (currentMintPhase == MintPhase.Public) {
            require(publicPhaseSettings.mintLimit == 0 || balanceOf(msg.sender, id) + amount <= publicPhaseSettings.mintLimit, "Exceeds public mint limit");
        } else {
            revert("Mint phase is not set");
        }

        // Distribute minting fees among recipient wallets
        uint256 totalAmount = msg.value;
        uint256 splitAmount = totalAmount * recipientSplitPercentage / 10000;
        uint256 recipientShare = splitAmount / recipientWallets.length;

        for (uint256 i = 0; i < recipientWallets.length; i++) {
            recipientWallets[i].sendValue(recipientShare);
        }

        _mint(msg.sender, id, amount, "");
        currentSupply += amount;
    }

    function setBaseURI(string memory _baseTokenURI) external onlyOwner {
        baseTokenURI = _baseTokenURI;
        _setURI(baseTokenURI);
    }

    function setPreRevealURI(string memory _preRevealURI) external onlyOwner {
        preRevealURI = _preRevealURI;
    }

    function revealURI() external onlyOwner {
        baseTokenURI = preRevealURI;
        _setURI(baseTokenURI);
    }

    function addMintPhase(
        uint256 _mintPrice,
        uint256 _mintLimit,
        uint256 _mintStartTime,
        uint256 _mintEndTime,
        bool _whitelistEnabled
    ) external onlyOwner {
        require(_mintStartTime < _mintEndTime, "Invalid mint phase times");

        if (_whitelistEnabled) {
            whitelistPhaseSettings = PhaseSettings({
                mintPrice: _mintPrice,
                mintLimit: _mintLimit,
                mintStartTime: _mintStartTime,
                mintEndTime: _mintEndTime
            });
            currentMintPhase = MintPhase.Whitelist;
        } else {
            publicPhaseSettings = PhaseSettings({
                mintPrice: _mintPrice,
                mintLimit: _mintLimit,
                mintStartTime: _mintStartTime,
                mintEndTime: _mintEndTime
            });
            currentMintPhase = MintPhase.Public;
        }
    }

    function getCurrentMintPrice() public view returns (uint256) {
        if (currentMintPhase == MintPhase.Public) {
            return publicPhaseSettings.mintPrice;
        } else if (currentMintPhase == MintPhase.Whitelist) {
            return whitelistPhaseSettings.mintPrice;
        } else {
            revert("Mint phase is not set");
        }
    }

    function getMintStartTime() public view returns (uint256) {
        if (currentMintPhase == MintPhase.Public) {
            return publicPhaseSettings.mintStartTime;
        } else if (currentMintPhase == MintPhase.Whitelist) {
            return whitelistPhaseSettings.mintStartTime;
        } else {
            revert("Mint phase is not set");
        }
    }

    function getMintEndTime() public view returns (uint256) {
        if (currentMintPhase == MintPhase.Public) {
            return publicPhaseSettings.mintEndTime;
        } else if (currentMintPhase == MintPhase.Whitelist) {
            return whitelistPhaseSettings.mintEndTime;
        } else {
            revert("Mint phase is not set");
        }
    }

    function getPhaseSettings() external view returns (
        uint256 publicMintPrice,
        uint256 publicMintLimit,
        uint256 publicMintStartTime,
        uint256 publicMintEndTime,
        uint256 whitelistMintPrice,
        uint256 whitelistMintLimit,
        uint256 whitelistMintStartTime,
        uint256 whitelistMintEndTime
    ) {
        return (
            publicPhaseSettings.mintPrice,
            publicPhaseSettings.mintLimit,
            publicPhaseSettings.mintStartTime,
            publicPhaseSettings.mintEndTime,
            whitelistPhaseSettings.mintPrice,
            whitelistPhaseSettings.mintLimit,
            whitelistPhaseSettings.mintStartTime,
            whitelistPhaseSettings.mintEndTime
        );
    }

    function setWhitelist(address[] memory _addresses, bool _status) external onlyOwner {
        for (uint256 i = 0; i < _addresses.length; i++) {
            whitelist[_addresses[i]] = _status;
        }
    }

    function setMintLimits(uint256 _publicMintLimit, uint256 _whitelistMintLimit) external onlyOwner {
        publicPhaseSettings.mintLimit = _publicMintLimit;
        whitelistPhaseSettings.mintLimit = _whitelistMintLimit;
    }

    function setRoyalties(address payable[] memory _royaltyWallets, uint256 _royaltyPercentage) external onlyOwner {
        require(_royaltyPercentage <= 10000, "Invalid royalty percentage");
        royaltyWallets = _royaltyWallets;
        royaltyPercentage = _royaltyPercentage;
    }

    function setRecipientWallets(address payable[] memory _recipientWallets, uint256 _recipientSplitPercentage) external onlyOwner {
        require(_recipientSplitPercentage <= 10000, "Invalid recipient split percentage");
        recipientWallets = _recipientWallets;
        recipientSplitPercentage = _recipientSplitPercentage;
    }

    function setContractName(string memory _name, string memory _symbol) external onlyOwner {
        collectionName = _name;
        collectionSymbol = _symbol;
    }

    function splitRoyalties(uint256 _amount) external onlyOwner {
        require(royaltyWallets.length > 0, "No royalty wallets set");
        uint256 splitAmount = _amount * royaltyPercentage / 10000;
        uint256 royaltyShare = splitAmount / royaltyWallets.length;

        for (uint256 i = 0; i < royaltyWallets.length; i++) {
            royaltyWallets[i].sendValue(royaltyShare);
        }
    }

    function withdraw() external onlyOwner {
        payable(owner()).sendValue(address(this).balance);
    }
}
