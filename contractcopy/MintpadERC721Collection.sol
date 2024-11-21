// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {MintpadLibrary} from "./MintpadLibrary.sol";

contract MintpadERC721Collection is ERC721Enumerable, Ownable {
    using Address for address payable;
    using Strings for uint256;
    using MintpadLibrary for *;

    uint256 public maxSupply;
    string private baseTokenURI;
    string private preRevealURI;
    bool public revealState;
    
    // Custom name and symbol
    string private _collectionName;
    string private _collectionSymbol;

    address payable[] public salesRecipients;
    uint256[] public salesShares;
    address payable[] public royaltyRecipients;
    uint256[] public royaltyShares;
    uint256 public royaltyPercentage;

    struct PhaseSettings {
        uint256 mintPrice;
        uint256 mintLimit;
        uint256 mintStartTime;
        uint256 mintEndTime;
        bool whitelistEnabled;
    }

    PhaseSettings[] public phases;
    mapping(address => bool) public whitelist;
    mapping(address => uint256) public whitelistMinted;
    mapping(address => uint256) public publicMinted;

    modifier onlyDeployer() {
        require(msg.sender == owner(), "Not deployer");
        _;
    }

    constructor(
        string memory _initialName,
        string memory _initialSymbol,
        uint256 _maxSupply,
        string memory _baseTokenURI,
        string memory _preRevealURI,
        address payable[] memory _salesRecipients,
        uint256[] memory _salesShares,
        address payable[] memory _royaltyRecipients,
        uint256[] memory _royaltyShares,
        uint256 _royaltyPercentage,
        address _owner
    ) ERC721(_initialName, _initialSymbol) Ownable(_owner) {
        require(_royaltyPercentage <= 10000, "Royalties exceed 100%");
        require(_salesRecipients.length == _salesShares.length, "Sales: Mismatched recipients and shares");
        require(_royaltyRecipients.length == _royaltyShares.length, "Royalties: Mismatched recipients and shares");

        maxSupply = _maxSupply; ok
        baseTokenURI = _baseTokenURI; ok
        preRevealURI = _preRevealURI; ok
        salesRecipients = _salesRecipients; ok
        salesShares = _salesShares; ok
        royaltyRecipients = _royaltyRecipients; ok
        royaltyShares = _royaltyShares; 
        royaltyPercentage = _royaltyPercentage;

        _collectionName = _initialName; ok
        _collectionSymbol = _initialSymbol; ok
    }

    // Override the `name` function to return the updated collection name
    function name() public view virtual override returns (string memory) {
        return _collectionName;
    }

    // Override the `symbol` function to return the updated collection symbol
    function symbol() public view virtual override returns (string memory) {
        return _collectionSymbol;
    }

    // Change contract name and symbol
    function changeNameAndSymbol(string memory newName, string memory newSymbol) external onlyDeployer {
        _collectionName = newName;
        _collectionSymbol = newSymbol;
    }

    // Add mint phase functionality
    function addMintPhase(
        uint256 _mintPrice,
        uint256 _mintLimit,
        uint256 _mintStartTime,
        uint256 _mintEndTime,
        bool _whitelistEnabled
    ) external onlyDeployer {
        require(_mintStartTime < _mintEndTime, "Invalid phase times");
        phases.push(PhaseSettings({
            mintPrice: _mintPrice,
            mintLimit: _mintLimit,
            mintStartTime: _mintStartTime,
            mintEndTime: _mintEndTime,
            whitelistEnabled: _whitelistEnabled
        }));
    }

    function getPhase(uint256 phaseIndex) external view returns (
        uint256 mintPrice,
        uint256 mintLimit,
        uint256 mintStartTime,
        uint256 mintEndTime,
        bool whitelistEnabled
    ) {
        require(phaseIndex < phases.length, "Invalid phase index");
        PhaseSettings memory phase = phases[phaseIndex];
        return (
            phase.mintPrice,
            phase.mintLimit,
            phase.mintStartTime,
            phase.mintEndTime,
            phase.whitelistEnabled
        );
    }

    function getTotalPhases() external view returns (uint256) {
        return phases.length;
    }

    // Minting with real-time sales and royalty distribution
    function mint(uint256 phaseIndex, uint256 tokenId) external payable {
        require(phaseIndex < phases.length, "Invalid phase index");
        PhaseSettings memory phase = phases[phaseIndex];

        require(block.timestamp >= phase.mintStartTime && block.timestamp <= phase.mintEndTime, "Phase not active");
        require(totalSupply() < maxSupply, "Exceeds max supply");
        require(msg.value == phase.mintPrice, "Incorrect mint price");

        if (phase.whitelistEnabled) {
            require(whitelist[msg.sender], "Not whitelisted");
            require(whitelistMinted[msg.sender] < phase.mintLimit, "Whitelist limit reached");
            whitelistMinted[msg.sender]++;
        } else {
            require(publicMinted[msg.sender] < phase.mintLimit, "Public mint limit reached");
            publicMinted[msg.sender]++;
        }

        // Distribute mint price to sales recipients
        distributeSales(msg.value);

        _safeMint(msg.sender, tokenId);
    }

    // Distribute sales to recipients in real-time
    function distributeSales(uint256 totalAmount) internal {
        for (uint256 i = 0; i < salesRecipients.length; i++) {
            uint256 share = (totalAmount * salesShares[i]) / 10000;
            salesRecipients[i].sendValue(share);
        }
    }

    function setRevealState(bool _state, string memory _newBaseURI) external onlyDeployer {
        revealState = _state;
        if (_state) {
            baseTokenURI = _newBaseURI;
        }
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return revealState ? baseTokenURI : preRevealURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Nonexistent token");
        return string(abi.encodePacked(_baseURI(), tokenId.toString(), ".json"));
    }

    // Sales and royalties management
    function updateSalesRecipients(address payable[] memory _newRecipients, uint256[] memory _newShares) external onlyDeployer {
        require(_newRecipients.length == _newShares.length, "Sales: Mismatched recipients and shares");
        salesRecipients = _newRecipients;
        salesShares = _newShares;
    }

    function updateRoyaltyRecipients(address payable[] memory _newRecipients, uint256[] memory _newShares) external onlyDeployer {
        require(_newRecipients.length == _newShares.length, "Royalties: Mismatched recipients and shares");
        royaltyRecipients = _newRecipients;
        royaltyShares = _newShares;
    }

    // Whitelist management
    function setWhitelist(address[] memory _addresses, bool _status) external onlyDeployer {
        for (uint256 i = 0; i < _addresses.length; i++) {
            whitelist[_addresses[i]] = _status;
        }
    }

    // Set royalties details
    function setRoyalties(address payable _royaltyRecipient, uint256 _royaltyPercentage) external onlyDeployer {
        require(_royaltyPercentage <= 10000, "Royalty too high");
        delete royaltyRecipients;
        delete royaltyShares;
        royaltyRecipients.push(_royaltyRecipient);
        royaltyShares.push(10000);
        royaltyPercentage = _royaltyPercentage;
    }

    // Set recipient of sales
    function setRecipient(address payable _recipient) external onlyDeployer {
        delete salesRecipients;
        delete salesShares;
        salesRecipients.push(_recipient);
        salesShares.push(10000);
    }
}
