// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "./IPixelCons.sol";
import "./openzeppelin/Ownable.sol";
import "./optimism/CrossDomainEnabled.sol";


/**
 * @title PixelConInvadersBridge
 * @notice The purpose of this contract is to generate, custody and bridge Invader PixelCons. All users are treated equally with the exception 
 * of an admin user who only controls the ability to reseed generation. No fees are required to interact with this contract beyond base gas fees. 
 * For more information about PixelConInvaders, please visit (https://invaders.pixelcons.io)
 * @dev This contract follows the standard Optimism L2 bridging contracts
 * See (https://github.com/ethereum-optimism/optimism)
 * @author PixelCons
 */
contract PixelConInvadersBridge is Ownable, CrossDomainEnabled {

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////// Structs/Constants /////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	// Constants
	uint64 constant MAX_TOKENS = 1000;
	uint64 constant MINT1_PIXELCON_INDEX = 1411;//before Feb 1st, 2022 (620 mintable)
	uint64 constant MINT2_PIXELCON_INDEX = 791; //before Jan 1st, 2021 (156 mintable)
	uint64 constant MINT3_PIXELCON_INDEX = 713; //before Jan 1st, 2020 (186 mintable)
	uint64 constant MINT4_PIXELCON_INDEX = 651; //Genesis (1950 mintable)
	uint64 constant MINT5_PIXELCON_INDEX = 651; 
	uint64 constant MINT6_PIXELCON_INDEX = 651; //2912 Invaders to mint from
	
	
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////// Storage ///////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	// Address of the original PixelCons contract
	address internal _pixelconsContract;
	
	// Address of the PixelCon Invaders contract (L2)
	address internal _pixelconInvadersContract;

	// The base seed used for invader generation
	uint256 internal _generationSeed;


	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////// Events ////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// Invader token events
	event Mint(uint256 indexed invaderId, uint256 generationSeed, uint256 generationId, uint256 generationIndex, address minter);
	event Bridge(uint256 indexed invaderId, address to);
	event Unbridge(uint256 indexed invaderId, address to);


	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////// PixelConInvadersBridge //////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @dev Contract constructor
	 */
	constructor(address pixelconsContract, address l1CrossDomainMessenger) CrossDomainEnabled(l1CrossDomainMessenger) Ownable() {
		//require(pixelconsContract != address(0), "Invalid address"); //unlikely
		//require(l1CrossDomainMessenger != address(0), "Invalid address"); //unlikely
		_pixelconsContract = pixelconsContract;
		_pixelconInvadersContract = address(0);
		_generationSeed = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), block.difficulty)));
	}

	/**
     * @dev Sets the Invader contract address on L2
	 * @param pixelconInvadersContract -Invader contract address
	 */
	function linkInvadersContract(address pixelconInvadersContract) public onlyOwner {
		//require(pixelconInvadersContract != address(0), "Invalid address"); //unlikely
		require(_pixelconInvadersContract == address(0), "Already set");
		_pixelconInvadersContract = pixelconInvadersContract;
	}

	/**
	 * @dev Updates the generation seed
	 */
	function cycleGenerationSeed() public onlyOwner {
		_generationSeed = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), block.difficulty)));
	}
	
	////////////////// PixelCon Invader Tokens //////////////////
	
	/**
	 * @dev Mint an Invader
	 * @param pixelconId -ID of the PixelCon to generate from
	 * @param generationIndex -Index number to generate from
	 * @param gasLimit -Amount of gas for messenger (advise to keep <=1900000)
	 * @return ID of the new invader
	 */
	function mintInvader(uint256 pixelconId, uint32 generationIndex, uint32 gasLimit) public returns (uint256) {
		//require(pixelconId != uint256(0), "Invalid ID"); //duplicate require in 'ownerOf' function
		require(generationIndex < 6, "Invalid index");
		address minter = _msgSender();
		
		//check that minter owns the pixelcon
		address pixelconOwner = IPixelCons(_pixelconsContract).ownerOf(pixelconId);
		require(pixelconOwner == minter, "Not PixelCon owner");
		
		//check that invaders can still be minted
		uint256 numInvadersCreated = IPixelCons(_pixelconsContract).creatorTotal(address(this));
		require(numInvadersCreated < MAX_TOKENS, "Max Invaders have been minted");
		
		//check that the given generation index is valid for the pixelcon
		uint64 pixelconIndex = IPixelCons(_pixelconsContract).getTokenIndex(pixelconId);
		if(generationIndex == 5) require(pixelconIndex <= MINT6_PIXELCON_INDEX, "Index out of bounds");
		if(generationIndex == 4) require(pixelconIndex <= MINT5_PIXELCON_INDEX, "Index out of bounds");
		if(generationIndex == 3) require(pixelconIndex <= MINT4_PIXELCON_INDEX, "Index out of bounds");
		if(generationIndex == 2) require(pixelconIndex <= MINT3_PIXELCON_INDEX, "Index out of bounds");
		if(generationIndex == 1) require(pixelconIndex <= MINT2_PIXELCON_INDEX, "Index out of bounds");
		if(generationIndex == 0) require(pixelconIndex <= MINT1_PIXELCON_INDEX, "Index out of bounds");
		
		//generate the invader
		uint256 invaderId = _generate(pixelconId, generationIndex);
		
		//create the pixelcon
		IPixelCons(_pixelconsContract).create(address(this), invaderId, bytes8(0));

		//bridge pixelcon to the invader contract on L2
		_bridgeToL2(invaderId, minter, gasLimit);

		//emit events
		emit Mint(invaderId, _generationSeed, pixelconId, generationIndex, minter);
		return invaderId;
	}
	
	/**
	 * @dev Bridge an Invader to L2
	 * @param tokenId -ID of the Invader to bridge
	 * @param from -Address of current Invader PixelCon owner
	 * @param to -Address of desired Invader owner
	 * @param gasLimit -Amount of gas for messenger (advise to keep <=1900000)
	 */
	function bridgeToL2(uint256 tokenId, address from, address to, uint32 gasLimit) public {
		//require(tokenId != uint256(0), "Invalid ID"); //duplicate require in 'ownerOf' function
		//require(from != address(0), "Invalid address"); //duplicate require in 'transferFrom' function
		require(to != address(0), "Invalid address");
		
		//check that caller owns the pixelcon
		address pixelconOwner = IPixelCons(_pixelconsContract).ownerOf(tokenId);
		require(pixelconOwner == _msgSender(), "Not owner");
		
		//check that the pixelcon was created by this contract
		address pixelconCreator = IPixelCons(_pixelconsContract).creatorOf(tokenId);
		require(pixelconCreator == address(this), "Not Invader");
		
		//transfer pixelcon to this contract
		IPixelCons(_pixelconsContract).transferFrom(from, address(this), tokenId);
	
		//bridge pixelcon to the invader contract on L2
		_bridgeToL2(tokenId, to, gasLimit);
	}
	
    /**
     * @dev Unbridge the Invader PixelCon from L2 (callable only by the L1 messenger)
	 * @param tokenId -ID of token
	 * @param to -New owner address
	 */
	function unbridgeFromL2(uint256 tokenId, address to) external onlyFromCrossDomainAccount(_pixelconInvadersContract) {
		//require(tokenId != uint256(0), "Invalid ID"); //duplicate require in 'transferFrom' function
		//require(to != address(0), "Invalid address"); //duplicate require in 'transferFrom' function
		
		//transfer
		IPixelCons(_pixelconsContract).transferFrom(address(this), to, tokenId);
		emit Unbridge(tokenId, to);
	}
	
    /**
     * @dev Returns the current seed used in generation
	 * @return Current generation seed
     */
    function getGenerationSeed() public view returns (uint256) {
        return _generationSeed;
    }
	
    /**
     * @dev Returns linked Pixelcons contract
	 * @return Pixelcons contract
     */
    function getPixelconsContract() public view returns (address) {
        return _pixelconsContract;
    }
	
    /**
     * @dev Returns linked PixelconInvaders contract
	 * @return PixelconInvaders contract
     */
    function getPixelconInvadersContract() public view returns (address) {
        return _pixelconInvadersContract;
    }
	

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////// Utils ////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	/**
     * @dev Bridges the Invader to L2
	 * @param tokenId -ID of the Invader
	 * @param to -The address to receive the Invader
	 * @param gasLimit -Amount of gas for messenger
	 */
	function _bridgeToL2(uint256 tokenId, address to, uint32 gasLimit) private {
		//construct calldata for L2 bridge function
		bytes memory message = abi.encodeWithSignature("bridgeFromL1(uint256,address)", tokenId, to);

		//send message to L2
		sendCrossDomainMessage(_pixelconInvadersContract, gasLimit, message);
		emit Bridge(tokenId, to);
	}
	
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////// Invader Generation //////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	/**
	 * @dev Generates an Invader from a PixelCon ID and generation index
	 * @param pixelconId -The PixelCon ID to use in generation
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
	 * @dev Generates an 8x8 mask
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
	 * @dev Generates a single line for 8x8 mask
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
	 * @dev Generates an 5x5 mask
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
	 * @dev Generates a single line for 5x5 mask
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
	 * @dev Gets colors for generation
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
