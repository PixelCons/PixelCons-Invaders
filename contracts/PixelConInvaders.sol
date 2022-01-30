// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "./openzeppelin/Ownable.sol";
import "./openzeppelin/ERC165.sol";
import "./openzeppelin/IERC721.sol";
import "./openzeppelin/IERC721Receiver.sol";
import "./openzeppelin/IERC721Metadata.sol";
import "./openzeppelin/Strings.sol";
import "./optimism/CrossDomainEnabled.sol";


/**
 * @title PixelConInvaders Core
 * @notice The purpose of this contract is to manage Invader PixelCons. All users are treated equally with the exception 
 * of an admin user who only controls the ERC721 metadata function which points to the app website. No fees are required to 
 * interact with this contract beyond base gas fees. For more information about PixelConInvaders, please visit (https://invaders.pixelcons.io)
 * @dev This contract follows the ERC721 token standard with additional functions for minting
 * See (https://github.com/OpenZeppelin/openzeppelin-solidity)
 * @author PixelCons
 */
contract PixelConInvaders is Ownable, CrossDomainEnabled, ERC165, IERC721, IERC721Metadata {

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////// Structs/Constants /////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	// Data storage structures
	struct TokenData {
		address owner;
		uint64 index;
	}
	
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////// Storage ///////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// Mapping from token ID to owner
	mapping(uint256 => TokenData) internal _tokenData;
	
	// Mapping from token index to token ID
	mapping(uint256 => uint256) internal _tokenIds;

	// Mapping from owner address to balance
	mapping(address => uint256) internal _ownerBalance;

	// Mapping from token ID to approved address
	mapping(uint256 => address) internal _tokenApprovals;

	// Mapping from owner to operator approvals
	mapping(address => mapping(address => bool)) internal _operatorApprovals;
	
	// Array of all invader IDs
	uint256[] internal _tokens;

	// The URI template for retrieving token metadata
	string internal _tokenURITemplate;

	// The address of the PixelCon Invaders bridge contract (L1)
	address internal _pixelconInvadersBridgeContract;


	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////// Events ////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// Invader token events
	event Mint(uint256 indexed invaderId, uint64 indexed invaderIndex, address to);
	event Bridge(uint256 indexed invaderId, address to);
	event Unbridge(uint256 indexed invaderId, address to);


	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////// PixelConInvaders Core ///////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @dev Contract constructor
	 */
	constructor(address l2CrossDomainMessenger) CrossDomainEnabled(l2CrossDomainMessenger) Ownable() {
		//require(l2CrossDomainMessenger != address(0), "Invalid address"); //unlikely
		_pixelconInvadersBridgeContract = address(0);
	}

	/**
     * @dev Sets the Invader bridge contract address on L1
	 * @param pixelconInvadersBridgeContract -Invader bridge contract address
	 */
	function linkBridgeContract(address pixelconInvadersBridgeContract) public onlyOwner {
		//require(pixelconInvadersBridgeContract != address(0), "Invalid address"); //unlikely
		require(_pixelconInvadersBridgeContract == address(0), "Already set");
		_pixelconInvadersBridgeContract = pixelconInvadersBridgeContract;
	}

	/**
	 * @dev Change the token URI template
	 * @param newTokenURITemplate -New token URI template
	 */
	function setTokenURITemplate(string memory newTokenURITemplate) public onlyOwner {
		_tokenURITemplate = newTokenURITemplate;
	}
	
	////////////////// PixelCon Invader Tokens //////////////////
	
    /**
     * @dev Bridge the Invader PixelCon from L1 (callable only by the L2 messenger)
	 * @param tokenId -ID of token
	 * @param to -New owner address
	 */
	function bridgeFromL1(uint256 tokenId, address to) external onlyFromCrossDomainAccount(_pixelconInvadersBridgeContract) {
		require(tokenId != uint256(0), "Invalid ID");
		require(to != address(0), "Invalid address");
		
		TokenData storage tokenData = _tokenData[tokenId];
		address from = tokenData.owner;
		require(from == address(0) || from == address(this), "Invalid state");
		
		if(from == address(0)) {
			//new invader
			tokenData.index = uint64(_tokens.length);
			_tokens.push(tokenId);
			emit Mint(tokenId, tokenData.index, to);
			
		} else {
			//existing invader
			_ownerBalance[from] -= 1;
		}
		
		//transfer invader ownership
		_ownerBalance[to] += 1;
		tokenData.owner = to;
		
        emit Transfer(from, to, tokenId);
		emit Bridge(tokenId, to);
	}
	
	/**
	 * @dev Unbridge an Invader PixelCon to L1
	 * @param tokenId -ID of the Invader to unbridge
	 * @param to -Address of desired Invader pixelcon owner
	 * @param gasLimit -Amount of gas for messenger
	 */
	function unbridgeToL1(uint256 tokenId, address to, uint32 gasLimit) public {
		require(tokenId != uint256(0), "Invalid ID");
		require(to != address(0), "Invalid address");
		
		//check valid invader
		TokenData storage tokenData = _tokenData[tokenId];
		address from = tokenData.owner;
		require(from != address(0), "Does not exist");
		
		//check that caller owns the invader
		require(from == _msgSender(), "Not owner");
		
		//transfer invader to this contract
		_transfer(from, address(this), tokenId);
	
		//unbridge invader from the bridge contract on L1
		_unbridgeToL1(tokenId, to, gasLimit);
	}
	
    /**
     * @dev Returns the total amount of tokens
	 * @return Total amount of tokens
     */
    function totalSupply() public view returns (uint256) {
        return _tokens.length;
    }
	
    /**
     * @dev Returns the token ID from the given index
	 * @param tokenIndex -The token index
	 * @return Token ID
     */
	function tokenByIndex(uint64 tokenIndex) public view returns (uint256) {
		require(tokenIndex < _tokens.length, "Does not exist");
		return _tokens[tokenIndex];
	}
	
    /**
     * @dev Returns the token index from the given ID
	 * @param tokenId -The token ID
	 * @return Token index
     */
	function indexByToken(uint256 tokenId) public view returns (uint64) {
		TokenData storage tokenData = _tokenData[tokenId];
		require(tokenData.owner != address(0), "Does not exist");
		return tokenData.index;
	}	
	
	////////////////// Web3 Only //////////////////

	/**
	 * @dev Gets all token data (web3 only)
	 * @return All token data
	 */
	function getAllTokenData() external view returns (uint256[] memory, address[] memory) {
		uint256[] memory tokenIds = new uint256[](_tokens.length);
		address[] memory owners = new address[](_tokens.length);

		for (uint i = 0; i < _tokens.length; i++) {
			uint256 tokenId = _tokens[i];
			TokenData storage tokenData = _tokenData[tokenId];

			tokenIds[i] = tokenId;
			owners[i] = tokenData.owner;
		}
		return (tokenIds, owners);
	}
	
	/**
	 * @dev Gets the token data in the given range (web3 only)
	 * @param startIndex -Start index
	 * @param endIndex -End index
	 * @return All token data
	 */
	function getTokenData(uint256 startIndex, uint256 endIndex) external view returns (uint256[] memory, address[] memory) {
		require(startIndex <= totalSupply(), "Start index is out of bounds");
		require(endIndex <= totalSupply(), "End index is out of bounds");
		require(startIndex <= endIndex, "End index is less than the start index");

		uint256 dataLength = endIndex - startIndex;
		uint256[] memory tokenIds = new uint256[](dataLength);
		address[] memory owners = new address[](dataLength);
		for (uint i = 0; i < dataLength; i++)	{
			uint256 tokenId = _tokens[i];
			TokenData storage tokenData = _tokenData[tokenId];

			tokenIds[i] = tokenId;
			owners[i] = tokenData.owner;
		}
		return (tokenIds, owners);
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
        require(owner != address(0), "Does not exist");
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
        require(owner != address(0), "Does not exist");
        return _tokenApprovals[tokenId];
    }

    /**
     * @dev Calldata optimized version of setApprovalForAll. See {IERC721-setApprovalForAll}.
     */
    function setApprovalForAll_opt(uint256 operator_approved) public {
		address operator = address(uint160(operator_approved & 0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffff));
		bool approved = ((operator_approved & 0xffffffffffffffffffffffff0000000000000000000000000000000000000000) > 0x00);
		return setApprovalForAll(operator, approved);
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
     * @dev Calldata optimized version of transferFrom. See {IERC721-transferFrom}.
     */
    function transferFrom_opt(uint256 addressTo_tokenIndex) public {
		address from = address(0x0000000000000000000000000000000000000000);
		address to = address(uint160((addressTo_tokenIndex & 0xffffffffffffffffffffffffffffffffffffffff000000000000000000000000) >> (8*12)));
		uint256 tokenId = tokenByIndex(uint64(addressTo_tokenIndex & 0x000000000000000000000000000000000000000000000000ffffffffffffffff));
		return transferFrom(from, to, tokenId);
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
     * @dev Calldata optimized version of safeTransferFrom. See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom_opt(uint256 addressTo_tokenIndex, bytes memory data_p) public {
		address from = address(0x0000000000000000000000000000000000000000);
		address to = address(uint160((addressTo_tokenIndex & 0xffffffffffffffffffffffffffffffffffffffff000000000000000000000000) >> (8*12)));
		uint256 tokenId = tokenByIndex(uint64(addressTo_tokenIndex & 0x000000000000000000000000000000000000000000000000ffffffffffffffff));
		return safeTransferFrom(from, to, tokenId, data_p);
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
		require(tokenData.owner != address(0), "Token does not exist");		

		//Available values: <tokenId>, <tokenIndex>, <owner>

		//start with the token URI template and replace in the appropriate values
		string memory finalTokenURI = _tokenURITemplate;
		finalTokenURI = Strings.replace(finalTokenURI, "<tokenId>", Strings.toHexString(tokenId, 32));
		finalTokenURI = Strings.replace(finalTokenURI, "<tokenIndex>", Strings.toHexString(uint256(tokenData.index), 8));
		finalTokenURI = Strings.replace(finalTokenURI, "<owner>", Strings.toHexString(uint256(uint160(tokenData.owner)), 20));
		return finalTokenURI;
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
		require(from == address(0) || from == tokenData.owner, "Invalid from address");
		from = tokenData.owner;
		
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
     * @dev Returns true if account is a contract
     * @param account -Account address
     * @return True if account is a contract
     */
    function _isContract(address account) private view returns (bool) {
        // This method relies on extcodesize, which returns 0 for contracts in
        // construction, since the code is only stored at the end of the
        // constructor execution.

        uint256 size;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
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
        if (_isContract(to)) {
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
        } else {
            return true;
        }
    }
	
	/**
     * @dev Unbridges the Invader from L1
	 * @param tokenId -ID of the Invader
	 * @param to -The address to receive the Invader PixelCon
	 * @param gasLimit -Amount of gas for messenger
	 */
	function _unbridgeToL1(uint256 tokenId, address to, uint32 gasLimit) private {
		//construct calldata for L1 unbridge function
		bytes memory message = abi.encodeWithSignature("unbridgeFromL2(uint256,address)", tokenId, to);

		//send message to L2
		sendCrossDomainMessage(_pixelconInvadersBridgeContract, gasLimit, message);
		emit Unbridge(tokenId, to);
	}
}
