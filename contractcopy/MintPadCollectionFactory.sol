// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "./MintpadERC721Collection.sol";
import {MintpadERC1155Collection} from "./MintpadERC1155Collection.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract MintPadCollectionFactory is UUPSUpgradeable, OwnableUpgradeable {
    using Address for address payable;

    address public constant PLATFORM_ADDRESS = 0xbEc50cA74830c67b55CbEaf79feD8517E9d9b3B2;
    uint256 public platformFee;
    uint256 public constant MAX_ROYALTY_PERCENTAGE = 10000;

    event CollectionDeployed(
        address indexed collectionAddress,
        address indexed owner,
        uint256 maxSupply,
        string baseURI
    );

    event ERC1155CollectionDeployed(
        address indexed collectionAddress,
        address indexed owner,
        uint256 maxSupply,
        string baseURI
    );

    event PlatformFeeUpdated(uint256 newFee);

    function initialize() external initializer {
        require(msg.sender == PLATFORM_ADDRESS, "Invalid initializer");
        __Ownable_init();
        platformFee = 0.00038 ether;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function deployCollection(
        string memory name,
        string memory symbol,
        uint256 maxSupply,
        string memory baseURI,
        string memory preRevealURI,
        address payable[] memory salesRecipients,
        uint256[] memory salesShares,
        address payable[] memory royaltyRecipients,
        uint256[] memory royaltyShares,
        uint256 royaltyPercentage
    ) external payable {
        require(msg.value == platformFee, "Incorrect platform fee");
        require(royaltyPercentage <= MAX_ROYALTY_PERCENTAGE, "Royalty percentage exceeds maximum");
        Address.sendValue(payable(PLATFORM_ADDRESS), platformFee);
        MintpadERC721Collection newCollection = new MintpadERC721Collection(
            name,
            symbol,
            maxSupply,
            baseURI,
            preRevealURI,
            salesRecipients,
            salesShares,
            royaltyRecipients,
            royaltyShares,
            royaltyPercentage,
            msg.sender
        );

        emit CollectionDeployed(address(newCollection), msg.sender, maxSupply, baseURI);
    }

    function deployERC1155Collection(
        string memory collectionName,
        string memory collectionSymbol,
        string memory baseTokenURI,
        string memory preRevealURI,
        uint256 maxSupply,
        address payable[] memory recipientWallets,
        address payable[] memory royaltyWallets,
        uint256 royaltyPercentage,
        uint256 recipientSplitPercentage,
        uint256 royaltyWalletSplitPercentage
    ) external payable {
        require(msg.value == platformFee, "Incorrect platform fee");
        require(royaltyPercentage <= MAX_ROYALTY_PERCENTAGE, "Royalty percentage exceeds maximum");
        require(recipientSplitPercentage <= MAX_ROYALTY_PERCENTAGE, "Recipient split percentage exceeds maximum");
        require(royaltyWalletSplitPercentage <= MAX_ROYALTY_PERCENTAGE, "Royalty wallet split percentage exceeds maximum");

        Address.sendValue(payable(PLATFORM_ADDRESS), platformFee);

        MintpadERC1155Collection newCollection = new MintpadERC1155Collection(
            collectionName,
            collectionSymbol,
            baseTokenURI,
            preRevealURI,
            maxSupply,
            recipientWallets,
            royaltyWallets,
            royaltyPercentage,
            recipientSplitPercentage,
            royaltyWalletSplitPercentage,
            msg.sender
        );

        emit ERC1155CollectionDeployed(address(newCollection), msg.sender, maxSupply, baseTokenURI);
    }

    function updatePlatformFee(uint256 newFee) external {
        require(msg.sender == PLATFORM_ADDRESS, "Only platform address can update fee");
        platformFee = newFee;
        emit PlatformFeeUpdated(newFee);
    }

    receive() external payable {}
}
