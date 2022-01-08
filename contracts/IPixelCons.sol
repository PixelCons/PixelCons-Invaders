// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

/**
 * @title PixelCons interface
 * @dev Interface for the core PixelCons contract
 */
interface IPixelCons {

	/**
	 * @notice Get the current admin
	 * @return The current admin
	 */
	function getAdmin() external view returns(address);

	////////////////// PixelCon Tokens //////////////////

	/**
	 * @notice Create PixelCon
	 * @param to -Address that will own the PixelCon
	 * @param tokenId -ID of the PixelCon to be creates
	 * @param name -PixelCon name (not required)
	 * @return The index of the new PixelCon
	 */
	function create(address to, uint256 tokenId, bytes8 name) external payable returns(uint64);

	/**
	 * @notice Rename PixelCon
	 * @param tokenId -ID of the PixelCon to rename
	 * @param name -New name
	 * @return The index of the PixelCon
	 */
	function rename(uint256 tokenId, bytes8 name) external returns(uint64);

	/**
	 * @notice Check if PixelCon exists
	 * @param tokenId -ID of the PixelCon to query the existence of
	 * @return True if the PixelCon exists
	 */
	function exists(uint256 tokenId) external view returns(bool);

	/**
	 * @notice Get the creator of PixelCon
	 * @param tokenId -ID of the PixelCon to query the creator of
	 * @return Creator address for PixelCon
	 */
	function creatorOf(uint256 tokenId) external view returns(address);

	/**
	 * @notice Get the total number of PixelCons created
	 * @param creator -Address to query the total of
	 * @return Total number of PixelCons created by given address
	 */
	function creatorTotal(address creator) external view returns(uint256);

	/**
	 * @notice Enumerate PixelCon created
	 * @param creator -Creator address
	 * @param index -Counter less than total
	 * @return PixelCon ID
	 */
	function tokenOfCreatorByIndex(address creator, uint256 index) external view returns(uint256);

	/**
	 * @notice Get the index of PixelCon
	 * @param tokenId -ID of the PixelCon to query the index of
	 * @return Index of the given PixelCon ID
	 */
	function getTokenIndex(uint256 tokenId) external view returns(uint64);

	////////////////// Collections //////////////////

	/**
	 * @notice Create PixelCon collection
	 * @param tokenIndexes -Token indexes to group together into a collection
	 * @param name -Name of the collection
	 * @return Index of the new collection
	 */
	function createCollection(uint64[] memory tokenIndexes, bytes8 name) external returns(uint64);

	/**
	 * @notice Rename collection
	 * @param collectionIndex -Index of the collection to rename
	 * @param name -New name
	 * @return Index of the collection
	 */
	function renameCollection(uint64 collectionIndex, bytes8 name) external returns(uint64);

	/**
	 * @notice Clear collection
	 * @param collectionIndex -Index of the collection to clear out
	 * @return Index of the collection
	 */
	function clearCollection(uint64 collectionIndex) external returns(uint64);

	/**
	 * @notice Check if collection exists
	 * @param collectionIndex -Index of the collection to query the existence of
	 * @return True if collection exists
	 */
	function collectionExists(uint64 collectionIndex) external view returns(bool);

	/**
	 * @notice Check if collection has been cleared
	 * @param collectionIndex -Index of the collection to query the state of
	 * @return True if collection has been cleared
	 */
	function collectionCleared(uint64 collectionIndex) external view returns(bool);

	/**
	 * @notice Get the total number of collections
	 * @return Total number of collections
	 */
	function totalCollections() external view returns(uint256);

	/**
	 * @notice Get the collection index of PixelCon
	 * @param tokenId -ID of the PixelCon to query the collection of
	 * @return Collection index of given PixelCon
	 */
	function collectionOf(uint256 tokenId) external view returns(uint256);

	/**
	 * @notice Get the total number of PixelCons in collection
	 * @param collectionIndex -Collection index to query the total of
	 * @return Total number of PixelCons in the collection
	 */
	function collectionTotal(uint64 collectionIndex) external view returns(uint256);

	/**
	 * @notice Get the name of collection
	 * @param collectionIndex -Collection index to query the name of
	 * @return Collection name
	 */
	function getCollectionName(uint64 collectionIndex) external view returns(bytes8);

	/**
	 * @notice Enumerate PixelCon in collection
	 * @param collectionIndex -Collection index
	 * @param index -Counter less than total
	 * @return PixelCon ID
	 */
	function tokenOfCollectionByIndex(uint64 collectionIndex, uint256 index) external view returns(uint256);


	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////// ERC-721 Implementation ///////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @notice Get the balance of address
	 * @param owner -Owner address
	 * @return Owner balance
	 */
	function balanceOf(address owner) external view returns(uint256);

	/**
	 * @notice Get the owner of PixelCon
	 * @param tokenId -ID of the token
	 * @return Owner of the given PixelCon
	 */
	function ownerOf(uint256 tokenId) external view returns(address);

	/**
	 * @notice Approve address to transfer PixelCon (zero indicates no approved address)
	 * @param to -Address to be approved
	 * @param tokenId -ID of the token to be approved
	 */
	function approve(address to, uint256 tokenId) external;

	/**
	 * @notice Get the approved address for PixelCon
	 * @param tokenId -ID of the token
	 * @return Address currently approved for the given PixelCon
	 */
	function getApproved(uint256 tokenId) external view returns(address);

	/**
	 * @notice Set or unset the approval of operator
	 * @param to -Operator address to set the approval
	 * @param approved -Flag for setting approval
	 */
	function setApprovalForAll(address to, bool approved) external;

	/**
	 * @notice Get if address is an approved operator for owner
	 * @param owner -Owner address 
	 * @param operator -Operator address
	 * @return True if the given operator is approved by the given owner
	 */
	function isApprovedForAll(address owner, address operator) external view returns(bool);

	/**
	 * @notice Transfer the ownership of PixelCon (try to use 'safeTransferFrom' instead)
	 * @param from -Current owner
	 * @param to -Address to receive the PixelCon
	 * @param tokenId -ID of the PixelCon to be transferred
	 */
	function transferFrom(address from, address to, uint256 tokenId) external;

	/**
	 * @notice Safely transfer the ownership of PixelCon
	 * @param from -Current owner
	 * @param to -Address to receive the PixelCon
	 * @param tokenId -ID of the PixelCon to be transferred
	 */
	function safeTransferFrom(address from, address to, uint256 tokenId) external;

	/**
	 * @notice Safely transfer the ownership of PixelCon
	 * @param from -Current owner
	 * @param to -Address to receive the PixelCon
	 * @param tokenId -ID of the PixelCon to be transferred
	 * @param data -Data to send along with a safe transfer check
	 */
	function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) external;


	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////// ERC-721 Enumeration Implementation /////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @notice Get the total number of PixelCons in existence
	 * @return Total number of PixelCons in existence
	 */
	function totalSupply() external view returns(uint256);

	/**
	 * @notice Get the ID of PixelCon
	 * @param tokenIndex -Counter less than total
	 * @return PixelCon ID
	 */
	function tokenByIndex(uint256 tokenIndex) external view returns(uint256);

	/**
	 * @notice Enumerate PixelCon assigned to owner
	 * @param owner -Owner address
	 * @param index -Counter less than balance
	 * @return PixelCon ID
	 */
	function tokenOfOwnerByIndex(address owner, uint256 index) external view returns(uint256);


	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////// ERC-721 Metadata Implementation //////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @notice Get the name of this contract token
	 * @return Contract token name
	 */
	function name() external view returns(string memory);

	/**
	 * @notice Get the symbol for this contract token
	 * @return Contract token symbol
	 */
	function symbol() external view returns(string memory);

	/**
	 * @notice Get a distinct Uniform Resource Identifier (URI) for PixelCon
	 * @return PixelCon URI
	 */
	function tokenURI(uint256 tokenId) external view returns(string memory);
}
