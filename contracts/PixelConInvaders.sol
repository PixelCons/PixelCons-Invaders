// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "./IPixelCons.sol";
import "./openzeppelin/Ownable.sol";
import "./openzeppelin/ERC165.sol";
import "./openzeppelin/IERC721.sol";
import "./openzeppelin/IERC721Receiver.sol";
import "./openzeppelin/IERC721Metadata.sol";
import "./openzeppelin/Strings.sol";


/**
 * @title PixelConInvaders Core
 * @notice The purpose of this contract is to generate and custody Invader PixelCons. All users are treated equally with the exception 
 * of an admin user who only controls the ERC721 metadata function which points to the app website and the ability to reseed generation. 
 * No fees are required to interact with this contract beyond base gas fees. 
 * For more information about PixelConInvaders, please visit (https://invaders.pixelcons.io)
 * @dev This contract follows the ERC721 token standard with additional functions for minting
 * See (https://github.com/OpenZeppelin/openzeppelin-solidity)
 * @author PixelCons
 */
contract PixelConInvaders is Ownable, ERC165, IERC721, IERC721Metadata {

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////// Structs/Constants /////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	// Constants
	uint64 constant MAX_TOKENS = 1000;
	uint64 constant MINT1_PIXELCON_INDEX = 1217;
	uint64 constant MINT2_PIXELCON_INDEX = 792;
	uint64 constant MINT3_PIXELCON_INDEX = 704;
	uint64 constant MINT4_PIXELCON_INDEX = 651;
	uint64 constant MINT5_PIXELCON_INDEX = 100;
	uint64 constant MINT6_PIXELCON_INDEX = 100;
	
	// Data storage structures
	struct TokenData {
		address owner;
		uint32 index;
	}
	
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////// Storage ///////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// Mapping from token ID to owner
	mapping(uint256 => TokenData) internal _tokenData;

	// Mapping from owner address to balance
	mapping(address => uint256) internal _ownerBalance;

	// Mapping from token ID to approved address
	mapping(uint256 => address) internal _tokenApprovals;

	// Mapping from owner to operator approvals
	mapping(address => mapping(address => bool)) internal _operatorApprovals;

	// Keep track of total tokens
	uint256 internal _tokenTotal;

	// The URI template for retrieving token metadata
	string internal _tokenURITemplate;

	// The base seed used for invader generation
	uint256 internal _generationSeed;

	// The address of the PixelCons contract
	address internal _pixelconsContract;


	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////// Events ////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// Invader token events
	event Mint(uint256 indexed invaderId, uint32 indexed invaderIndex, uint256 generationSeed, uint256 generationId, uint256 generationIndex, address minter);


	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////// PixelConInvaders Core ///////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @notice Contract constructor
	 */
	constructor(address pixelconsContract) Ownable() {
		require(pixelconsContract != address(0), "Invalid address");
		_pixelconsContract = pixelconsContract;
		_generationSeed = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), block.difficulty)));
	}

	/**
	 * @dev Change the token URI template
	 * @param newTokenURITemplate -New token URI template
	 */
	function setTokenURITemplate(string memory newTokenURITemplate) public onlyOwner {
		_tokenURITemplate = newTokenURITemplate;
	}

	/**
	 * @dev Updates the generation seed
	 */
	function cycleGenerationSeed() public onlyOwner {
		_generationSeed = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), block.difficulty)));
	}
	
	////////////////// PixelCon Invader Tokens //////////////////

	/**
	 * @dev Mint an invader
	 * @param pixelconId -ID of the pixelcon to generate from
	 * @param generationIndex -Index number to generate from
	 * @return ID of the new invader
	 */
	function mintToken(uint256 pixelconId, uint32 generationIndex) public returns (uint256) {
		require(generationIndex == 0 || generationIndex == 1 || generationIndex == 2 || generationIndex == 3 || generationIndex == 4 || generationIndex == 5, "Invalid index");
		require(pixelconId != uint256(0), "Invalid ID");
		address minter = _msgSender();
		
		//check that minter owns the pixelcon and that the index is valid for the pixelcon
		address pixelconOwner = IPixelCons(_pixelconsContract).ownerOf(pixelconId);
		uint64 pixelconIndex = IPixelCons(_pixelconsContract).getTokenIndex(pixelconId);
		require(pixelconOwner == minter, "Minter not PixelCon owner");
		if(generationIndex == 5) require(pixelconIndex < MINT6_PIXELCON_INDEX, "Index out of bounds");
		if(generationIndex == 4) require(pixelconIndex < MINT5_PIXELCON_INDEX, "Index out of bounds");
		if(generationIndex == 3) require(pixelconIndex < MINT4_PIXELCON_INDEX, "Index out of bounds");
		if(generationIndex == 2) require(pixelconIndex < MINT3_PIXELCON_INDEX, "Index out of bounds");
		if(generationIndex == 1) require(pixelconIndex < MINT2_PIXELCON_INDEX, "Index out of bounds");
		if(generationIndex == 0) require(pixelconIndex < MINT1_PIXELCON_INDEX, "Index out of bounds");
		
		//generate the invader
		uint256 invaderId = _generate(pixelconId, generationIndex);
		TokenData storage tokenData = _tokenData[invaderId];
		require(tokenData.owner == address(0), "Token already exists");
		
		//mint the pixelcon
		IPixelCons(_pixelconsContract).create(minter, invaderId, bytes8(0));

		//get index and incriment total
		uint32 index = uint32(_tokenTotal);
		_tokenTotal += 1;
		
		//set owner and balance data
		_ownerBalance[minter] += 1;
		tokenData.owner = minter;
		tokenData.index = index;

		//emit events
		emit Mint(invaderId, index, _generationSeed, pixelconId, generationIndex, minter);
		emit Transfer(address(0), minter, invaderId);
		return invaderId;
	}
	
    /**
     * @dev Returns the total amount of tokens
	 * @return Total amount of tokens
     */
    function totalSupply() public view returns (uint256) {
        return _tokenTotal;
    }
	
    /**
     * @dev Returns the current seed used in generation
	 * @return Current generation seed
     */
    function generationSeed() public view returns (uint256) {
        return _generationSeed;
    }
	
	
	////////////////// Web3 Only //////////////////

	/**
	 * @dev Gets the token data for the given tokens (web3 only)
	 * @param tokenIds -IDs of tokens to search
	 * @return All token data
	 */
	function getTokenOwners(uint256[] calldata tokenIds) public view returns (address[] memory) {
		address[] memory owners = new address[](tokenIds.length);
		for (uint i = 0; i < tokenIds.length; i++) {
			address owner = _tokenData[tokenIds[i]].owner;
			require(owner != address(0), "Token does not exist");
			
			owners[i] = owner;
		}
		return owners;
	}
	
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////// ERC-721 Implementation ///////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC721).interfaceId
            || interfaceId == type(IERC721Metadata).interfaceId
            || super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {IERC721-balanceOf}.
     */
    function balanceOf(address owner) public view override returns (uint256) {
		require(owner != address(0), "Invalid address");
		return _ownerBalance[owner];
    }

    /**
     * @dev See {IERC721-ownerOf}.
     */
    function ownerOf(uint256 tokenId) public view override returns (address) {
		address owner = _tokenData[tokenId].owner;
        require(owner != address(0), "Token does not exist");
        return owner;
    }
	
    /**
     * @dev See {IERC721-approve}.
     */
    function approve(address to, uint256 tokenId) public override {
		require(tokenId != uint256(0), "Invalid ID");
		address owner = _tokenData[tokenId].owner;
        require(to != owner, "Cannot approve self");
        require(_msgSender() == owner || _operatorApprovals[owner][_msgSender()], "Not owner nor approved for all");
		_approve(owner, to, tokenId);
    }

    /**
     * @dev See {IERC721-getApproved}.
     */
    function getApproved(uint256 tokenId) public view override returns (address) {
		address owner = _tokenData[tokenId].owner;
        require(owner != address(0), "Token does not exist");
        return _tokenApprovals[tokenId];
    }

    /**
     * @dev See {IERC721-setApprovalForAll}.
     */
    function setApprovalForAll(address operator, bool approved) public override {
		require(operator != address(0), "Invalid address");
        require(operator != _msgSender(), "Cannot approve self");
        _operatorApprovals[_msgSender()][operator] = approved;
        emit ApprovalForAll(_msgSender(), operator, approved);
    }

    /**
     * @dev See {IERC721-isApprovedForAll}.
     */
    function isApprovedForAll(address owner, address operator) public view override returns (bool) {
		require(owner != address(0) && operator != address(0), "Invalid address");
        return _operatorApprovals[owner][operator];
    }

    /**
     * @dev See {IERC721-transferFrom}.
     */
    function transferFrom(address from, address to, uint256 tokenId) public override {
		require(to != address(0), "Invalid address");
		require(tokenId != uint256(0), "Invalid ID");
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not owner nor approved for all");
        _transfer(from, to, tokenId);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) public override {
        safeTransferFrom(from, to, tokenId, "");
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data_p) public override {
		//requirements are checked in 'transferFrom' function
		transferFrom(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, data_p), "Transfer to non ERC721Receiver implementer");
    }
	

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////// ERC-721 Metadata Implementation //////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
    /**
     * @dev See {IERC721Metadata-name}.
     */
    function name() public pure override returns (string memory) {
        return "PixelConInvaders";
    }

    /**
     * @dev See {IERC721Metadata-symbol}.
     */
    function symbol() public pure override returns (string memory) {
        return "PCINVDR";
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
		TokenData storage tokenData = _tokenData[tokenId];
		return string(abi.encodePacked(_tokenURITemplate, Strings.toHexString(tokenId), "?index=", Strings.toHexString(tokenData.index, 32)));
    }
	

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////// Utils ////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
    /**
     * @dev Checks if an address is allowed to manage a token
	 * @param spender -Address to check
	 * @param tokenId -ID of token to check
     * @return True if the address is allowed to manage the token
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId) private view returns (bool) {
		address owner = _tokenData[tokenId].owner;
        return (spender == owner || _tokenApprovals[tokenId] == spender || _operatorApprovals[owner][spender]);
    }
	
    /**
     * @dev Approves an address to operate on a token
	 * @param owner -Current token owner
	 * @param to -Address to approve
	 * @param tokenId -ID of token
     */
    function _approve(address owner, address to, uint256 tokenId) private {
		_tokenApprovals[tokenId] = to;
		emit Approval(owner, to, tokenId);
    }
	
    /**
     * @dev Transfers a token form one address to another
	 * @param from -Current token owner
	 * @param to -Address to transfer ownership to
	 * @param tokenId -ID of token
     */
    function _transfer(address from, address to, uint256 tokenId) private {
		TokenData storage tokenData = _tokenData[tokenId];
		require(tokenData.owner == from, "Incorrect from address");
		
        //clear approvals
		if(_tokenApprovals[tokenId] != address(0)) {
			_approve(tokenData.owner, address(0), tokenId);
		}
		
		//update user balances
		_ownerBalance[from] -= 1;
		_ownerBalance[to] += 1;
		
		//change token owner
		tokenData.owner = to;
		
        emit Transfer(from, to, tokenId);
    }
	
    /**
     * @dev Function to invoke {IERC721Receiver-onERC721Received} on a target address
     * @param from -Address representing the previous owner of the given token ID
     * @param to -Target address that will receive the tokens
     * @param tokenId -ID of the token to be transferred
     * @param _data -Optional data to send along with the call
     * @return True if the call correctly returned the expected magic value
     */
    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory _data) private returns (bool) {
		try IERC721Receiver(to).onERC721Received(_msgSender(), from, tokenId, _data) returns (bytes4 retval) {
			return retval == IERC721Receiver(to).onERC721Received.selector;
		} catch (bytes memory reason) {
			if (reason.length == 0) {
				revert("Cannot transfer to non ERC721Receiver implementer");
			} else {
				// solhint-disable-next-line no-inline-assembly
				assembly {
					revert(add(32, reason), mload(reason))
				}
			}
		}
    }
	
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////// Invader Generation //////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	/**
	 * @notice Generates an invader from a pixelconId and generation index
	 * @param pixelconId -The pixelcon id to use in generation
	 * @param generationIndex -The index to use in generation
	 * @return Invader ID
	 */
	function _generate(uint256 pixelconId, uint32 generationIndex) private view returns (uint256) {
		uint256 seed = uint256(keccak256(abi.encodePacked(_generationSeed, pixelconId, generationIndex)));
		/*                      [mask 3         ] [mask 2] [mask 1] [colors] [flags]
		seed: 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000 */

		//flags
		uint8 horizontalExpand1 = uint8(seed & 0x00000001);
		uint8 verticalExpand1 = uint8(seed & 0x00000002);
		uint8 horizontalExpand2 = uint8(seed & 0x00000004);
		uint8 verticalExpand2 = uint8(seed & 0x00000008);
		seed = seed >> 32;

		//colors
		(uint256 color1, uint256 color2, uint256 color3) = _getColors(seed);
		seed = seed >> 32;

		//masks
		uint256 mask1 = _generateMask_5x5(seed, verticalExpand1, horizontalExpand1);
		seed = seed >> 32;
		uint256 mask2 = _generateMask_5x5(seed, verticalExpand2, horizontalExpand2);
		seed = seed >> 32;
		uint256 mask3 = _generateMask_8x8(seed);
		seed = seed >> 64;
		uint256 combinedMask = mask1 & mask2;
		uint256 highlightMask = mask1 & mask3;

		uint256 invaderId = ((mask1 & ~combinedMask & ~highlightMask) & color1) | ((combinedMask & ~highlightMask) & color2) | (highlightMask & color3);
		return invaderId;
	}
	
	/**
	 * @notice Generates an 8x8 mask
	 * @param seed -Randomness for generation
	 * @return 256bit mask
	 */
	function _generateMask_8x8(uint256 seed) private pure returns (uint256){
		uint256 mask = _generateLine_8x8(seed);
		mask = (mask << 32) + _generateLine_8x8(seed >> 8);
		mask = (mask << 32) + _generateLine_8x8(seed >> 16);
		mask = (mask << 32) + _generateLine_8x8(seed >> 24);
		mask = (mask << 32) + _generateLine_8x8(seed >> 32);
		mask = (mask << 32) + _generateLine_8x8(seed >> 40);
		mask = (mask << 32) + _generateLine_8x8(seed >> 48);
		mask = (mask << 32) + _generateLine_8x8(seed >> 56);
		return mask;
	}
	
	/**
	 * @notice Generates a single line for 8x8 mask
	 * @param seed -Randomness for generation
	 * @return 256bit mask line
	 */
	function _generateLine_8x8(uint256 seed) private pure returns (uint256){
		uint256 line = 0x00000000;
		if((seed & 0x00000003) == 0x00000001) line |= 0x000ff000;
		if((seed & 0x0000000c) == 0x00000004) line |= 0x00f00f00;
		if((seed & 0x00000030) == 0x00000010) line |= 0x0f0000f0;
		if((seed & 0x000000c0) == 0x00000040) line |= 0xf000000f;
		return line;
	}
	
	/**
	 * @notice Generates an 5x5 mask
	 * @param seed -Randomness for generation
	 * @param verticalExpand -Flag for vertical expand mode
	 * @param horizontalExpand -Flag for horizontal expand mode
	 * @return 256bit mask
	 */
	function _generateMask_5x5(uint256 seed, uint8 verticalExpand, uint8 horizontalExpand) private pure returns (uint256){
		uint256 mask = 0x0000000000000000000000000000000000000000000000000000000000000000;
		uint256 line1 = _generateLine_5x5(seed, horizontalExpand);
		uint256 line2 = _generateLine_5x5(seed >> 3, horizontalExpand);
		uint256 line3 = _generateLine_5x5(seed >> 6, horizontalExpand);
		uint256 line4 = _generateLine_5x5(seed >> 9, horizontalExpand);
		uint256 line5 = _generateLine_5x5(seed >> 12, horizontalExpand);
		if(verticalExpand > 0) {
			mask = (line1 << 224) + (line2 << 192) + (line2 << 160) + (line3 << 128) + (line4 << 96) + (line4 << 64) + (line5 << 32) + (line5);
		} else {
			mask = (line1 << 224) + (line1 << 192) + (line2 << 160) + (line2 << 128) + (line3 << 96) + (line4 << 64) + (line4 << 32) + (line5);
		}
		return mask;
	}
	
	/**
	 * @notice Generates a single line for 5x5 mask
	 * @param seed -Randomness for generation
	 * @param horizontalExpand -Flag for horizontal expand mode
	 * @return 256bit mask line
	 */
	function _generateLine_5x5(uint256 seed, uint8 horizontalExpand) private pure returns (uint256){
		uint256 line = 0x00000000;
		if((seed & 0x00000001) == 0x00000001) line |= 0x000ff000;
		if(horizontalExpand > 0) {
			if((seed & 0x00000002) == 0x00000002) line |= 0x0ff00ff0;
			if((seed & 0x00000004) == 0x00000004) line |= 0xf000000f;
		} else {
			if((seed & 0x00000002) == 0x00000002) line |= 0x00f00f00;
			if((seed & 0x00000004) == 0x00000004) line |= 0xff0000ff;
		}
		return line;
	}

	/**
	 * @notice Gets colors for generation
	 * @param seed -Randomness for generation
	 * @return 256bit color templates
	 */
	function _getColors(uint256 seed) private pure returns (uint256, uint256, uint256){
		uint256 color1 = 0x0000000000000000000000000000000000000000000000000000000000000000;
		uint256 color2 = 0x0000000000000000000000000000000000000000000000000000000000000000;
		uint256 color3 = 0x0000000000000000000000000000000000000000000000000000000000000000;

		uint256 colorNum = seed & 0x000000ff;
		if(colorNum < 0x00000080) {
			if(colorNum < 0x00000055) {
				if(colorNum < 0x0000002B) color3 = 0x7777777777777777777777777777777777777777777777777777777777777777;
				else color3 = 0x8888888888888888888888888888888888888888888888888888888888888888;
			} else {
				color3 = 0x9999999999999999999999999999999999999999999999999999999999999999;
			}
		} else {
			if(colorNum < 0x000000D5) {
				if(colorNum < 0x000000AB) color3 = 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa;
				else color3 = 0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb;
			} else {
				color3 = 0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc;
			}
		}

		if((seed & 0x00000100) == 0x00000100) color1 = 0x1111111111111111111111111111111111111111111111111111111111111111;
		else color1 = 0x5555555555555555555555555555555555555555555555555555555555555555;

		if((seed & 0x00000200) == 0x00000200) color2 = 0x6666666666666666666666666666666666666666666666666666666666666666;
		else color2 = 0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd;

		return (color1, color2, color3);
	}
}
