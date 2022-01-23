// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

/**
 * @dev String operations.
 */
library Strings {
    bytes16 private constant alphabet = "0123456789abcdef";

    /**
     * @dev Converts a `uint256` to its ASCII `string` decimal representation.
     */
    function toString(uint256 value) internal pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT licence
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation.
     */
    function toHexString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0x00";
        }
        uint256 temp = value;
        uint256 length = 0;
        while (temp != 0) {
            length++;
            temp >>= 8;
        }
        return toHexString(value, length);
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation with fixed length.
     */
    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = alphabet[value & 0xf];
            value >>= 4;
        }
        require(value == 0, "Strings: hex length insufficient");
        return string(buffer);
    }
	
    /**
	 * @dev Replaces the given key with the given value in the given string
	 */
	function replace(string memory str, string memory key, string memory value) internal pure returns(string memory) {
		bytes memory bStr = bytes(str);
		bytes memory bKey = bytes(key);
		bytes memory bValue = bytes(value);

		uint index = indexOf(bStr, bKey);
		if (index < bStr.length) {
			bytes memory rStr = new bytes((bStr.length + bValue.length) - bKey.length);

			uint i;
			for (i = 0; i < index; i++) rStr[i] = bStr[i];
			for (i = 0; i < bValue.length; i++) rStr[index + i] = bValue[i];
			for (i = 0; i < bStr.length - (index + bKey.length); i++) rStr[index + bValue.length + i] = bStr[index + bKey.length + i];

			return string(rStr);
		}
		return string(bStr);
	}

	/**
	 * @dev Gets the index of the key string in the given string
	 */
	function indexOf(bytes memory str, bytes memory key) internal pure returns(uint256) {
		for (uint i = 0; i < str.length - (key.length - 1); i++) {
			bool matchFound = true;
			for (uint j = 0; j < key.length; j++) {
				if (str[i + j] != key[j]) {
					matchFound = false;
					break;
				}
			}
			if (matchFound) {
				return i;
			}
		}
		return str.length;
	}
}
