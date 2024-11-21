// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

library MintpadLibrary {
    /// @dev Maximum royalty percentage (in basis points, where 10000 = 100%).
    uint256 public constant MAX_ROYALTY_PERCENTAGE = 10000;

    /**
     * @dev Checks if the sent msg.value matches the mint price.
     * @param mintPrice The mint price of the collection.
     * @param msgValue The value sent with the transaction.
     */
    function checkMintPrice(uint256 mintPrice, uint256 msgValue) internal pure returns (bool) {
        return mintPrice == msgValue;
    }

    /**
     * @dev Checks if the current time is within the minting period.
     * @param mintStartTime The start time for minting.
     * @param mintEndTime The end time for minting.
     * @param currentTime The current block timestamp.
     */
    function checkMintTime(uint256 mintStartTime, uint256 mintEndTime, uint256 currentTime) internal pure returns (bool) {
        return currentTime >= mintStartTime && currentTime <= mintEndTime;
    }

    /**
     * @dev Verifies if the given address is on the whitelist.
     * @param whitelistAddresses The list of whitelisted addresses.
     * @param user The address to check.
     */
    function checkWhitelist(address[] memory whitelistAddresses, address user) internal pure returns (bool) {
        for (uint256 i = 0; i < whitelistAddresses.length; i++) {
            if (whitelistAddresses[i] == user) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Checks if the royalty percentage is valid (i.e., <= MAX_ROYALTY_PERCENTAGE).
     * @param royaltyPercentage The royalty percentage to check.
     */
    function checkRoyaltyPercentage(uint256 royaltyPercentage) internal pure returns (bool) {
        return royaltyPercentage <= MAX_ROYALTY_PERCENTAGE;
    }

    /**
     * @dev Validates if the given address is non-zero.
     * @param addr The address to check.
     */
    function checkValidAddress(address addr) internal pure returns (bool) {
        return addr != address(0);
    }
    /**
     * @dev Ensures that the base URI is valid.
     * @param baseURI The base URI to check.
     */
    function validateBaseURI(string memory baseURI) internal pure returns (bool) {
        // Perform basic checks, e.g., ensure it's not empty
        return bytes(baseURI).length > 0;
    }
    
    
}
