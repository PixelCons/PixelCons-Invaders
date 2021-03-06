/***********************************************************************
 * invaders.spec
 * Unit tests for the PixelCon Invaders smart contracts
 * (assumes PixelCon contract has already been deployed and dataloaded)
 ***********************************************************************/
import * as fs from 'fs'
import * as path from 'path'
import { ethers } from 'hardhat'
import { Contract, Signer, Wallet, BigNumber } from 'ethers'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
chai.use(solidity);

// Settings
const l1Network = 'optimism_l1';
const l2Network = 'optimism_l2';
const l1CrossDomainMessenger = '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318';
const l2CrossDomainMessenger = '0x4200000000000000000000000000000000000007';
const deploymentsFile = resolvePath('contracts/deploy/deployments.json');
const defaultGasParams = {
  gasLimit: 10000000
}

// Tests
describe('PixelCon Invaders', () => {
	let createdTokens = [];
	let falseID: string = "0x0000000000000000000000000000000000000000000000000000000000000123";
	let emptyID: string = "0x0000000000000000000000000000000000000000000000000000000000000000";
	let emptyAddress: string = "0x0000000000000000000000000000000000000000";
	let pixelconsContract: Contract = null;
	let pixelconInvadersBridgeContract: Contract = null;
	let pixelconInvadersContract: Contract = null;
	let notReceiverContract: Contract = null;
	let l1RpcProvider = null;
	let l2RpcProvider = null;
	let l1Accounts: Signer[] = [];
	let l2Accounts: Signer[] = [];
	let l1Addresses: string[] = [];
	let l2Addresses: string[] = [];
	let invaders = [];
	let errorText: string = null;
	before(async () => {
		//set up our RPC provider connections and signers
		let { config } = require('hardhat');
		l1RpcProvider = new ethers.providers.JsonRpcProvider(config.networks[l1Network].url);
		l2RpcProvider = new ethers.providers.JsonRpcProvider(config.networks[l2Network].url);
		for(let i=0; i<10; i++) {
			let l1acct = ethers.Wallet.fromMnemonic(config.networks[l1Network].accounts.mnemonic, "m/44'/60'/0'/0/" + i).connect(l1RpcProvider);
			let l2acct = ethers.Wallet.fromMnemonic(config.networks[l2Network].accounts.mnemonic, "m/44'/60'/0'/0/" + i).connect(l2RpcProvider);
			l1Accounts.push(l1acct);
			l2Accounts.push(l2acct);
			l1Addresses.push(l1acct.address);
			l2Addresses.push(l2acct.address);
		}

		//find pixelcons contract
		errorText = "Could not find deployed addresses";
		let l1ChainId = (await l1RpcProvider.getNetwork()).chainId;
		let pixelconsContractAddress = await fetchContractAddress(l1ChainId, 'PixelCons');
		await expect(pixelconsContractAddress, str(errorText)).to.not.be.null;
		pixelconsContract = await (await ethers.getContractFactory('PixelCons')).attach(pixelconsContractAddress);
		
		//deploy bridge contract (l1)
		pixelconInvadersBridgeContract = await (await ethers.getContractFactory('PixelConInvadersBridge')).connect(l1Accounts[0]).deploy(pixelconsContractAddress, l1CrossDomainMessenger, defaultGasParams);
		
		//deploy invaders and notreceiver contract (l2)
		pixelconInvadersContract = await (await ethers.getContractFactory('PixelConInvaders')).connect(l2Accounts[0]).deploy(l2CrossDomainMessenger, defaultGasParams);
		notReceiverContract = await (await ethers.getContractFactory('NotReceiver')).connect(l2Accounts[0]).deploy();
		
		//link l1 and l2 contracts
		errorText = "Failed to link contracts";
		await expect(pixelconInvadersBridgeContract.connect(l1Accounts[0]).linkInvadersContract(pixelconInvadersContract.address, defaultGasParams), str(errorText)).to.not.be.reverted;
		await expect(pixelconInvadersContract.connect(l2Accounts[0]).linkBridgeContract(pixelconInvadersBridgeContract.address, defaultGasParams), str(errorText)).to.not.be.reverted;
	});

	//Check Mint Invaders
	describe('invader minting', () => {
		it('should allow minting invaders', async () => {
			errorText = "Failed to mint invader";
			for(let i=0; i<5; i++) await expect(pixelconInvadersBridgeContract.connect(l1Accounts[0]).mintInvader('0x'+pixelconDataIds[i], 0, 1900000, defaultGasParams), str(errorText)).to.not.be.reverted;
			for(let i=0; i<5; i++) await expect(pixelconInvadersBridgeContract.connect(l1Accounts[0]).mintInvader('0x'+pixelconDataIds[i], 1, 1900000, defaultGasParams), str(errorText)).to.not.be.reverted;
			for(let i=0; i<5; i++) await expect(pixelconInvadersBridgeContract.connect(l1Accounts[1]).mintInvader('0x'+pixelconDataIds[10+i], 0, 1900000, defaultGasParams), str(errorText)).to.not.be.reverted;
			
			//check on mint event from l1
			errorText = "Invalid invader mint events";
			let mintEvents = await pixelconInvadersBridgeContract.connect(l1Accounts[0]).queryFilter(pixelconInvadersBridgeContract.filters.Mint(null));
			expect(mintEvents.length, str(errorText)).to.equal(15);
			for(let i=0; i<mintEvents.length; i++) {
				invaders.push({ id:to256Hex(mintEvents[i].args.invaderId), owner:mintEvents[i].args.minter });
			}
			
			//check on mint event from l2
			errorText = "Invader mint failed to bridge to L2";
			for(let i=0; i<invaders.length; i++) {
				let events = await transactionEventWait(pixelconInvadersContract.filters.Mint(invaders[i].id, null), l2RpcProvider);
				expect(events, str(errorText)).to.not.be.null;
				invaders[i].index = parseInt(events[0].topics[2]);
			}
		});
		it('should not allow minting from invalid pixelcons', async () => {
			errorText = "Was able to mint invader from invalid pixelcon";
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[0]).mintInvader(emptyID, 0, 1900000, defaultGasParams), str(errorText)).to.be.revertedWith('Invalid ID');
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[0]).mintInvader(falseID, 0, 1900000, defaultGasParams), str(errorText)).to.be.revertedWith('PixelCon does not exist');
		});
		it('should not allow minting from bad index', async () => {
			errorText = "Was able to mint invader with bad index";
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[0]).mintInvader('0x'+pixelconDataIds[9], 100, 1900000, defaultGasParams), str(errorText)).to.be.revertedWith('Invalid index');
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[0]).mintInvader('0x'+pixelconDataIds[655], 4, 1900000, defaultGasParams), str(errorText)).to.be.revertedWith('Index out of bounds');
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[0]).mintInvader('0x'+pixelconDataIds[1000], 2, 1900000, defaultGasParams), str(errorText)).to.be.revertedWith('Index out of bounds');
		});
		it('should not allow minting from unowned pixelcon', async () => {
			errorText = "Was able to mint invader from unowned pixelcon";
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[0]).mintInvader('0x'+pixelconDataIds[20], 0, 1900000, defaultGasParams), str(errorText)).to.be.revertedWith('Not PixelCon owner');
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[0]).mintInvader('0x'+pixelconDataIds[21], 0, 1900000, defaultGasParams), str(errorText)).to.be.revertedWith('Not PixelCon owner');
		});
		it('should not allow minting duplicate invader', async () => {
			errorText = "Was able to mint a duplicate invader";
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[0]).mintInvader('0x'+pixelconDataIds[0], 0, 1900000, defaultGasParams), str(errorText)).to.be.revertedWith('PixelCon already exists');
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[0]).mintInvader('0x'+pixelconDataIds[1], 1, 1900000, defaultGasParams), str(errorText)).to.be.revertedWith('PixelCon already exists');
		});
	});
	
	//Check Data Fetching
	describe('data fetching', () => {
		it('should fetch correct total', async () => {
			errorText = "Got incorrect data";
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).totalSupply(), str(errorText)).to.equal(invaders.length);
		});
		it('should fetch correct indexes', async () => {
			errorText = "Got incorrect data";
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).tokenByIndex(invaders[1].index), str(errorText)).to.equal(invaders[1].id);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).tokenByIndex(invaders[5].index), str(errorText)).to.equal(invaders[5].id);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).tokenByIndex(invaders[12].index), str(errorText)).to.equal(invaders[12].id);
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).tokenByIndex(100), str(errorText));
		});
		it('should fetch correct ids', async () => {
			errorText = "Got incorrect data";
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).indexByToken(invaders[1].id), str(errorText)).to.equal(invaders[1].index);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).indexByToken(invaders[5].id), str(errorText)).to.equal(invaders[5].index);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).indexByToken(invaders[12].id), str(errorText)).to.equal(invaders[12].index);
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).indexByToken(falseID), str(errorText));
		});
	});
	
	// Check Token Transfers
	describe('token transfers', () => {
		it('should report correct data', async () => {
			errorText = "Got incorrect data";
			expect(await pixelconInvadersContract.connect(l2Accounts[1]).balanceOf(l2Addresses[0]), str(errorText)).to.equal(10);
			expect(await pixelconInvadersContract.connect(l2Accounts[2]).balanceOf(l2Addresses[1]), str(errorText)).to.equal(5);
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).balanceOf(emptyAddress), str(errorText));
			
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).ownerOf(invaders[1].id), str(errorText)).to.equal(invaders[1].owner);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).ownerOf(invaders[3].id), str(errorText)).to.equal(invaders[3].owner);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).ownerOf(invaders[6].id), str(errorText)).to.equal(invaders[6].owner);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).ownerOf(invaders[12].id), str(errorText)).to.equal(invaders[12].owner);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).ownerOf(invaders[14].id), str(errorText)).to.equal(invaders[14].owner);
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).ownerOf(falseID), str(errorText));
		});
		
		it('should allow transfer tokens', async () => {
			errorText = "Failed to transfer token";
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).transferFrom(l2Addresses[0], l2Addresses[1], invaders[2].id, defaultGasParams), str(errorText));
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0])['safeTransferFrom(address,address,uint256)'](l2Addresses[0], l2Addresses[1], invaders[9].id, defaultGasParams), str(errorText));
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[1]).transferFrom(emptyAddress, l2Addresses[4], invaders[2].id, defaultGasParams), str(errorText));
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[1])['safeTransferFrom(address,address,uint256)'](emptyAddress, l2Addresses[4], invaders[11].id, defaultGasParams), str(errorText));
			
			errorText = "Failed check transfer";
			expect(await pixelconInvadersContract.ownerOf(invaders[0].id), str(errorText)).to.equal(l2Addresses[0]);
			expect(await pixelconInvadersContract.ownerOf(invaders[2].id), str(errorText)).to.equal(l2Addresses[4]);
			expect(await pixelconInvadersContract.ownerOf(invaders[9].id), str(errorText)).to.equal(l2Addresses[1]);
			expect(await pixelconInvadersContract.ownerOf(invaders[11].id), str(errorText)).to.equal(l2Addresses[4]);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).balanceOf(l2Addresses[0]), str(errorText)).to.equal(8);
			expect(await pixelconInvadersContract.connect(l2Accounts[1]).balanceOf(l2Addresses[1]), str(errorText)).to.equal(5);
			expect(await pixelconInvadersContract.connect(l2Accounts[4]).balanceOf(l2Addresses[4]), str(errorText)).to.equal(2);
		});
		
		it('should not allow bad transfer tokens', async () => {
			errorText = "Was able to transfer invader2 as account0";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).transferFrom(l2Addresses[1], l2Addresses[0], invaders[2].id, defaultGasParams), str(errorText));
			
			errorText = "Was able to transfer invader0 with incorrect from address";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).transferFrom(l2Addresses[1], l2Addresses[1], invaders[0].id, defaultGasParams), str(errorText));
			
			errorText = "Was able to transfer with invalid token id";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).transferFrom(l2Addresses[0], l2Addresses[1], emptyID, defaultGasParams), str(errorText));
			
			errorText = "Was able to transfer token with id that doesnt exist";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).transferFrom(l2Addresses[0], l2Addresses[1], falseID, defaultGasParams), str(errorText));
			
			errorText = "Was able to transfer invader0 to an invalid address";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).transferFrom(l2Addresses[0], emptyAddress, invaders[0].id, defaultGasParams), str(errorText));
		});
		
		it('should allow approvals', async () => {
			errorText = "Failed to set approval";
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).setApprovalForAll(l2Addresses[1], true, defaultGasParams), str(errorText));
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).approve(l2Addresses[2], invaders[1].id, defaultGasParams), str(errorText));
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).approve(l2Addresses[3], invaders[8].id, defaultGasParams), str(errorText));
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[4]).approve(l2Addresses[2], invaders[2].id, defaultGasParams), str(errorText));
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[2]).setApprovalForAll(l2Addresses[0], true, defaultGasParams), str(errorText));
			
			errorText = "Failed to set approval (optimized)";
			let operator_approved = '0x100000000000000000000000' + l2Addresses[0].substr(2);
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[5]).setApprovalForAll_opt(operator_approved, defaultGasParams), str(errorText));
			
			errorText = "Failed to stop approval (optimized)";
			let bad_operator_approved = '0x100000000000000000000000' + l2Addresses[5].substr(2);
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[5]).setApprovalForAll_opt(bad_operator_approved, defaultGasParams), str(errorText));
			
			errorText = "Failed check approvals";
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).isApprovedForAll(l2Addresses[0], l2Addresses[1]), str(errorText)).to.equal(true);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).getApproved(invaders[1].id), str(errorText)).to.equal(l2Addresses[2]);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).getApproved(invaders[8].id), str(errorText)).to.equal(l2Addresses[3]);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).getApproved(invaders[2].id), str(errorText)).to.equal(l2Addresses[2]);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).isApprovedForAll(l2Addresses[5], l2Addresses[0]), str(errorText)).to.equal(true);
		});
		
		it('should allow transfer approved tokens', async () => {
			errorText = "Failed to transfer token";
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).transferFrom(l2Addresses[0], l2Addresses[1], invaders[0].id, defaultGasParams), str(errorText));
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[1]).transferFrom(l2Addresses[1], l2Addresses[2], invaders[0].id, defaultGasParams), str(errorText));
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).transferFrom(emptyAddress, l2Addresses[0], invaders[0].id, defaultGasParams), str(errorText));
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[2]).transferFrom(l2Addresses[0], l2Addresses[4], invaders[1].id, defaultGasParams), str(errorText));
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[3]).transferFrom(l2Addresses[0], l2Addresses[4], invaders[8].id, defaultGasParams), str(errorText));
			
			errorText = "Failed to transfer token (optimized)";
			let addressTo_tokenIndex = l2Addresses[1] + (invaders[0].index).toString(16).padStart(24,'0');
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).transferFrom_opt(addressTo_tokenIndex, defaultGasParams), str(errorText));
			let addressTo_tokenIndex2 = l2Addresses[2] + (invaders[0].index).toString(16).padStart(24,'0');
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[1]).safeTransferFrom_opt(addressTo_tokenIndex2, 0, defaultGasParams), str(errorText));
			let addressTo_tokenIndex3 = l2Addresses[0] + (invaders[0].index).toString(16).padStart(24,'0');
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).transferFrom_opt(addressTo_tokenIndex3, defaultGasParams), str(errorText));
			
			errorText = "Bad transfer token did not fail (optimized)";
			let addressTo_tokenIndex_bad = l2Addresses[1] + (100).toString(16).padStart(24,'0');
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).transferFrom_opt(addressTo_tokenIndex_bad, defaultGasParams), str(errorText));
			let addressTo_tokenIndex_bad2 = emptyAddress + (invaders[0].index).toString(16).padStart(24,'0');
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).transferFrom_opt(addressTo_tokenIndex_bad2, defaultGasParams), str(errorText));
			
			errorText = "Failed check transfer";
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).ownerOf(invaders[0].id), str(errorText)).to.equal(l2Addresses[0]);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).ownerOf(invaders[1].id), str(errorText)).to.equal(l2Addresses[4]);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).ownerOf(invaders[8].id), str(errorText)).to.equal(l2Addresses[4]);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).balanceOf(l2Addresses[0]), str(errorText)).to.equal(6);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).balanceOf(l2Addresses[4]), str(errorText)).to.equal(4);
		});
		
		it('should allow remove approvals', async () => {
			errorText = "Failed to remove approval";
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).setApprovalForAll(l2Addresses[1], false, defaultGasParams), str(errorText));
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[4]).approve(emptyAddress, invaders[2].id, defaultGasParams), str(errorText));
			
			errorText = "Failed to remove approval (optimized)";
			let operator_approved = '0x000000000000000000000000' + l2Addresses[0].substr(2);
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[5]).setApprovalForAll_opt(operator_approved, defaultGasParams), str(errorText));
			
			errorText = "Failed check approvals";
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).isApprovedForAll(l2Addresses[0], l2Addresses[1]), str(errorText)).to.equal(false);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).isApprovedForAll(l2Addresses[5], l2Addresses[0]), str(errorText)).to.equal(false);
		});
		
		it('should not allow bad transfer/approve tokens', async () => {
			errorText = "Account1 was able to transfer on behalf of account0";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[1]).transferFrom(l2Addresses[0], l2Addresses[1], invaders[0].id, defaultGasParams), str(errorText));
			
			errorText = "Account2 was able to transfer invader2";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[2]).transferFrom(emptyAddress, l2Addresses[2], invaders[2].id, defaultGasParams), str(errorText));
			
			errorText = "Account2 was able to transfer invader8";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[2]).transferFrom(emptyAddress, l2Addresses[2], invaders[8].id, defaultGasParams), str(errorText));
			
			errorText = "Was able to approve for invader0 that account1 doesnt own";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[1]).approve(l2Addresses[1], invaders[0].id, defaultGasParams), str(errorText));
			
			errorText = "Was able to approve with invalid token id";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).approve(l2Addresses[0], emptyID, defaultGasParams), str(errorText));
			
			errorText = "Was able to approve with token id that doesnt exist";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).approve(l2Addresses[0], falseID, defaultGasParams), str(errorText));
			
			errorText = "Was able to get approved with invalid token id";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).getApproved(emptyID), str(errorText));
			
			errorText = "Was able to get approved with token id that doesnt exist";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).getApproved(falseID), str(errorText));
			
			errorText = "Was able to approve for all for invalid address";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).setApprovalForAll(emptyAddress, true, defaultGasParams), str(errorText));
			
			errorText = "Was able to get approved for all for invalid owner address";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).isApprovedForAll(emptyAddress, l2Addresses[0]), str(errorText));
			
			errorText = "Was able to get approved for all for invalid operator address";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).isApprovedForAll(l2Addresses[0], emptyAddress), str(errorText));
		});
		
		it('should not allow unsafe transfer', async () => {
			errorText = "Was able to safe transfer to a not safe address";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0])['safeTransferFrom(address,address,uint256)'](l2Addresses[0], notReceiverContract.address, invaders[0].id, defaultGasParams), str(errorText));
		});
	});
	
	// Check Owner Enumeration
	describe('owner enumeration', () => {
		it('should report owner of', async () => {
			errorText = "Owner of was not as expected";
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).ownerOf(invaders[0].id), str(errorText)).to.equal(l2Addresses[0]);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).ownerOf(invaders[1].id), str(errorText)).to.equal(l2Addresses[4]);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).ownerOf(invaders[8].id), str(errorText)).to.equal(l2Addresses[4]);
		});
		
		it('should report balance of', async () => {
			errorText = "Balance of was not as expected";
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).balanceOf(l2Addresses[0]), str(errorText)).to.equal(6);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).balanceOf(l2Addresses[4]), str(errorText)).to.equal(4);
		});
		
		it('should report token of owner by index', async () => {
			errorText = "Token of owner by index was not as expected";
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).tokenOfOwnerByIndex(l2Addresses[0], 0), str(errorText)).to.equal(invaders[7].id);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).tokenOfOwnerByIndex(l2Addresses[0], 1), str(errorText)).to.equal(invaders[5].id);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).tokenOfOwnerByIndex(l2Addresses[0], 2), str(errorText)).to.equal(invaders[6].id);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).tokenOfOwnerByIndex(l2Addresses[0], 3), str(errorText)).to.equal(invaders[3].id);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).tokenOfOwnerByIndex(l2Addresses[0], 4), str(errorText)).to.equal(invaders[4].id);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).tokenOfOwnerByIndex(l2Addresses[0], 5), str(errorText)).to.equal(invaders[0].id);
		});
		
		it('should not report bad owner of', async () => {
			errorText = "Was able to get owner of token with invalid id";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).ownerOf(emptyID), str(errorText));
			
			errorText = "Was able to get owner of token with id that doesnt exist";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).ownerOf(falseID), str(errorText));
		});
		
		it('should not report bad balance of', async () => {
			errorText = "Was able to check balance of an invalid address";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).balanceOf(emptyAddress), str(errorText));
		});
		
		it('should not report bad token of owner by index', async () => {
			errorText = "Was able to get token id by index for owner with invalid address";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).tokenOfOwnerByIndex(emptyAddress, 0), str(errorText));
			
			errorText = "Was able to get token id by index for owner with invalid index";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).tokenOfOwnerByIndex(l2Addresses[0], invaders.length), str(errorText));
		});
	});
	
	// Check Bridge functiond
	describe('token bridging', () => {
		it('should not allow incorrect L1 bridge access', async () => {
			errorText = "Was able to access L1 bridge function";
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[0]).bridgeToL2('0x'+pixelconDataIds[6], l1Addresses[0], emptyAddress, 1900000, defaultGasParams), str(errorText)).to.be.revertedWith('Invalid address');
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[0]).bridgeToL2('0x'+pixelconDataIds[6], emptyAddress, l1Addresses[0], 1900000, defaultGasParams), str(errorText)).to.be.revertedWith('Not Invader');
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[0]).bridgeToL2(invaders[0].id, emptyAddress, l1Addresses[0], 1900000, defaultGasParams), str(errorText)).to.be.revertedWith('Not owner');
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[0]).bridgeToL2(emptyID, l1Addresses[0], l1Addresses[0], 1900000, defaultGasParams), str(errorText)).to.be.reverted;
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[0]).bridgeToL2(invaders[0].id, l1Addresses[0], l1Addresses[0], 1900000, defaultGasParams), str(errorText)).to.be.revertedWith('Not owner');
			
			errorText = "Was able to access L1 unbridge function";
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[0]).unbridgeFromL2(invaders[0].id, l1Addresses[0], defaultGasParams), str(errorText)).to.be.reverted;
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[0]).unbridgeFromL2(invaders[1].id, emptyAddress, defaultGasParams), str(errorText)).to.be.reverted;
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[0]).unbridgeFromL2(emptyID, l1Addresses[0], defaultGasParams), str(errorText)).to.be.reverted;
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[1]).unbridgeFromL2(invaders[1].id, l1Addresses[1], defaultGasParams), str(errorText)).to.be.reverted;
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[2]).unbridgeFromL2(invaders[2].id, l1Addresses[2], defaultGasParams), str(errorText)).to.be.reverted;
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[3]).unbridgeFromL2(invaders[3].id, l1Addresses[3], defaultGasParams), str(errorText)).to.be.reverted;
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[4]).unbridgeFromL2(invaders[4].id, l1Addresses[4], defaultGasParams), str(errorText)).to.be.reverted;
		});
		
		it('should not allow incorrect L2 bridge access', async () => {
			errorText = "Was able to access L2 bridge functions";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[1]).unbridgeToL1(invaders[0].id, l2Addresses[0], 2000000, defaultGasParams), str(errorText));
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[3]).unbridgeToL1(invaders[1].id, l2Addresses[0], 2000000, defaultGasParams), str(errorText));
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[2]).unbridgeToL1(invaders[8].id, l2Addresses[0], 2000000, defaultGasParams), str(errorText));
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).unbridgeToL1(emptyID, l2Addresses[0], 2000000, defaultGasParams), str(errorText));
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).unbridgeToL1(invaders[0].id, emptyAddress, 2000000, defaultGasParams), str(errorText));
			
			errorText = "Was able to access L1 bridge functions";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).bridgeFromL1(invaders[0].id, l2Addresses[0], defaultGasParams), str(errorText));
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).bridgeFromL1(invaders[1].id, l2Addresses[0], defaultGasParams), str(errorText));
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).bridgeFromL1(falseID, l2Addresses[0], defaultGasParams), str(errorText));
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).bridgeFromL1(emptyID, l2Addresses[0], defaultGasParams), str(errorText));
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).bridgeFromL1(invaders[0].id, emptyAddress, defaultGasParams), str(errorText));
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[1]).bridgeFromL1(emptyID, l2Addresses[0], defaultGasParams), str(errorText));
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[2]).bridgeFromL1(emptyID, l2Addresses[0], defaultGasParams), str(errorText));
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[3]).bridgeFromL1(emptyID, l2Addresses[0], defaultGasParams), str(errorText));
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[4]).bridgeFromL1(emptyID, l2Addresses[0], defaultGasParams), str(errorText));
		});
		
		it('should allow correct L2 bridge access', async () => {
			errorText = "Was not able to unbridge";
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[0]).unbridgeToL1(invaders[0].id, l2Addresses[0], 2000000, defaultGasParams), str(errorText));
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[4]).unbridgeToL1(invaders[1].id, l2Addresses[0], 2000000, defaultGasParams), str(errorText));
			await expectToNotBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[4]).unbridgeToL1(invaders[8].id, l2Addresses[0], 2000000, defaultGasParams), str(errorText));
		});
	});
	
	// Check Admin Functions
	describe('admin functions', () => {
		let tokenURITemplate: string = '<tokenId>: <tokenIndex>';
		
		it('should allow update of tokenURI', async () => {
			errorText = "Was able to update token URI template not as admin";
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[2]).setTokenURITemplate(tokenURITemplate, defaultGasParams), str(errorText));
			
			errorText = "Failed to set token URI template";
			await expect(pixelconInvadersContract.connect(l2Accounts[0]).setTokenURITemplate(tokenURITemplate, defaultGasParams), str(errorText)).to.not.be.reverted;
		});
		
		it('should allow admin change', async () => {
			errorText = "Was able to change admin not as admin";
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[2]).transferOwnership(l1Addresses[2], defaultGasParams), str(errorText)).to.be.revertedWith('Caller is not the owner');
			await expectToBeRevertedL2(pixelconInvadersContract.connect(l2Accounts[2]).transferOwnership(l2Addresses[2], defaultGasParams), str(errorText));
			
			errorText = "Failed to change admin as admin";
			await expect(pixelconInvadersBridgeContract.connect(l1Accounts[0]).transferOwnership(l1Addresses[1], defaultGasParams), str(errorText)).to.not.be.reverted;
			await expect(pixelconInvadersContract.connect(l2Accounts[0]).transferOwnership(l2Addresses[1], defaultGasParams), str(errorText)).to.not.be.reverted;
		});
		
		it('should report correct data', async () => {
			let expectedURI = tokenURITemplate.replace('<tokenId>', invaders[1].id).replace('<tokenIndex>', '0x' + (invaders[1].index).toString(16).padStart(16, '0'));
			
			errorText = "The reported token URI is not what was expected";
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).tokenURI(invaders[1].id), str(errorText)).to.equal(expectedURI);
			
			errorText = "The reported admin is not what was expected";
			expect(await pixelconInvadersBridgeContract.connect(l1Accounts[0]).owner(), str(errorText)).to.equal(l1Addresses[1]);
			expect(await pixelconInvadersContract.connect(l2Accounts[0]).owner(), str(errorText)).to.equal(l2Addresses[1]);
		});
	});
});

// Utils
function to256Hex(number) {
	try {
		let hex = ethers.utils.hexlify(number);
		while (hex.length < 66) hex = hex.slice(0, 2) + '0' + hex.slice(2);
		return hex;
	} catch (err) { }
	return "0x".padEnd(66, "0");
}
function toBytes8(text) {
	let bytes8 = new Uint8Array(8);
	let textBytes = ethers.utils.toUtf8Bytes(text);
	for(let i=0; i<8 && i<textBytes.length; i++) {
		bytes8[i] = textBytes[i];
	}
	return ethers.utils.hexlify(bytes8);
}
function randomID() {
	return ethers.utils.keccak256(ethers.utils.toUtf8Bytes('Random Token ' + Math.random()*100));
}
function str(text) {
	return (' ' + text).slice(1);
}
function resolvePath(p) {
	let paths = [path.join(__dirname, '..')];
	paths = paths.concat(p.split('/'));
	return path.join.apply(null, paths);
}
async function fetchContractAddress(chainId, contractName) {
	let deployAddresses = require(deploymentsFile);
	for(let i=0; i<deployAddresses.length; i++) {
		if(deployAddresses[i].id == chainId) {
			for(let j=0; j<deployAddresses[i].contracts.length; j++) {
				if(deployAddresses[i].contracts[j].name == contractName) {
					return deployAddresses[i].contracts[j].address;
				}
			}
		}
	}
	return null;
}
async function expectToBeRevertedL2(tx, errorText) {
	let reverted = 'was not reverted';
	try {
		tx = await (await tx).wait();
	} catch(err) {
		reverted = 'was reverted';
	}
	return expect(reverted, errorText).to.equal('was reverted');
}
async function expectToNotBeRevertedL2(tx, errorText) {
	let reverted = 'was not reverted';
	try {
		tx = await (await tx).wait();
	} catch(err) {
		reverted = 'was reverted';
	}
	return expect(reverted, errorText).to.equal('was not reverted');
}
async function getTransactionEventStatus(filter, provider) {
	try {
		let tempContract = new ethers.Contract(filter.address, [], provider);
		let events = await tempContract.queryFilter(filter);
		if(events && events.length) return events;
	} catch (err) { }
	return null;
}
function transactionEventWait(filter, provider) {
	const eventPollMillis = 500;
	const eventWaitMillis = 3000;
	return new Promise((resolve, reject) => {
		let start = (new Date).getTime();
		let check_transaction_event = async function () {
			try {
				let events = await getTransactionEventStatus(filter, provider);
				if (events && events.length > 0) resolve(events);
				else if (eventWaitMillis > 0 && (new Date).getTime() - start > eventWaitMillis) resolve(null);
				else setTimeout(check_transaction_event, eventPollMillis);
			} catch (err) {
				resolve(null);
			}
		};
		check_transaction_event();
	});
}

// Data
const pixelconDataIds = ["9a999999990990999909909999999999907777099400004999477499999aa999","9a9999999949949994944949ee9999eee499994e99400499999aa99999999999","9a9999999999909990049099999999999499994999400499999aa99999999999","9a99999999499499949449499999999991777719901dd10994777749999aa999","9a9999999949949c9494494c99999999907777099022220999088099999aa999","9a99944999994999944490999909909999999999999900999999aa9999999999","9a99999999099099990990999999999999477499947447499449944999999999","9a9999999999999997099709977997799999999999422499999aa99999999999","9a9999999999999999099099990990999999999999422499949aa94999999999","9a99999999999099900490999999999994999949994224999998899999988999","9a99999994099049990990999999999992eeee29992882999997e99999999999","9a9999999949949994944949c999999c927777299428824999477499999aa999","9a99999999499499949449499999999994999949994224999998899999988999",
	"9a9999999909909999099099999999999999a499999909999999a49999999999","9a9999999949949994944949ee9999eeee99a4ee999909999999a49999999999","9a99999999099099990990999c9999999c944999994aa4999999999999999999","9a499499949999499909909999099099999999999990099999900999999aa999","9a9999999449944999999999900990099999999999900999999009999999c999","9a9999999449944999044099990990999999999999422499949aa94999999999","8e8888888228822888022088880880888888888888e77e8882777728888ee888","9a4994999499994999999999920990299cc99cc99cc77cc99cc00cc99cc9acc9","cc1cc1ccc1cccc1cc77cc77c97099079977997799990099999900999999aa999","cc1cc1ccc1cccc1ccc0cc0cc990990999c9999999c99999999900999999aa999","3b1331333133331333033033330330333331333333b303333333133333333333","9a99999999999999944994499999999994000049903bb30994bbbb4999bbbb99","9a99999999999999977997099079977999999999990099099099009999999999",
	"0d0000d00dd00de00dddddd00d0d0dd0117e71100d777dd0001edd1001ddddd1","00999900099999909949090499499f229909ffff0044ffff049940e0499ff400","11111110111fffe000010010fdf00e00ffffff200effeee00e2fffe00ee22000","03bbbb303b7bbbb3b3bbbb3bb70bb70bb30bb03b0bbbbbb000b33b00000bb000","0dccccd0dc7ccccdcdccccdcc70cc70ccd0cc0dc0cccccc000cddc00000cc000","00088270008822000777666006eeeed0f72fe26ef7f76e6e067e26d000676d00","ff4444fff467764f46dccd6467c70c7667c00c7647dccd7efe7777efffffffff","ff4444fff467764f46b33b64673703766730037647b33b7efe7777efffffffff","00b3b300000b300000ee28000e8e88800ee88280028288200028820000022000","00000000070000700cd66dc006d77d600d622dd001688d1000d6d10000000000","001282100128a811128a988228aaaaa88aaaaa822889a821118a821001282100","11112121212112921191112129a9211111911212112129212111121111121112","00110000019a100019a100001aa100101aa911a119aaaa91019aa91000111100",
	"2119111219299291129aa92119aaaa9999aaaa91129aa9211929929121119112","000008880008899900899aaa089aabbb089abccc89abccdd89abcd0089abcd00","0008800000878800000880000071160007100160070000600070060000066000","000cc00000c7cc00000cc0000071160007100160070000600070060000066000","00000000000000000a0aa0900cabba80099999400aaaaa900000000000000000","0000000000e777e00ee777ee088eee88008eee800008e8000000e00000000000","0000000000c777c00cc777cc066ccc66006ccc600006c6000000c00000000000","0000000000a777a00aa777aa099aaa99009aaa900009a9000000a00000000000","0000000000b777b00bb777bb033bbb33003bbb300003b3000000b00000000000","00000000077777a00a100a900a400a900a747a900aa40a900aa77a9000000000","0128218101298221122898101828982112899921289aa98229aaaa9212888821","0d777d00677777607767767d767007076d6007070677707d000d776000006770","0000000000770000066700000776d990000d6999000444990002444400002442",
	"000000000e808e00e7e8e8e08e8888e008888e000088e000000e000000000000","000000000e807600e7e767608e87776008877600008760000006000000000000","0000000006707600666767607677776007777600007760000006000000000000","7600000067600000067600400067d090000d7d900000d9200049928200000028","7600000067600000067600400067d090000d7d900000d9d000499dcd000000dc","7600000067600000067600400067d090000d7d900000d940004994a40000004a","7600000067600000067600400067d090000d7d900000d930004993b30000003b","0188881018e77e818e7887e887877878878778788e7887e818e77e8101888810","0000000000aaa900aa99949aa0aaa90a90aaa909099aa49000094000009aa400","0000000000822200082002800800008002800820002aa200000aa00000000000","0000000000c111000c1001c00c0000c001c00c10001aa100000aa00000000000","000001dd0992010d42a90d000079000000a49a790074444000a94a90004aa940","9444444094444440a9999990412121206161616070707070767676706dddddd0",
	"0000000000ddd6000d100d700d100d60811108e8810108822111022200000000","0000000000ddd6000d100d700d100d60b1110b7bb1010bb33111033300000000","00000000000000000866a66d01d76d10047dd642046dc6420446644200000000","00d000d0000d0d00dddddd99d7600844d6000c44d0006d44d0067d44dddddd44","0777776007bbb7d0073337d007bbb7d0077777d0078787d0077777d0067776d0","1ac128829cc967761ca128829cc1677628822882677667762882288267766776","00001000000001000000110000066600d6722270d0d777601ddd6660001d6610","000000000777600007776dd0099940600aaa90d00aaa9d1009aa400000000000","00000000004994000097a900009aa9000099990009a7aa900009400000000000","000000000cc7c7c00cc677c00cccccc00c7777c00c7777c00d6666d000000000","0000000008878780088677800888888008777780087777800266662000000000","00f6aa000fec9970feec977777e0077777700e777779ceef0799cef000aa6f00","6000000dd70000dd06700dd00067dd0000067000022d68802020080822100288",
	"6000000dd70000dd06700dd00067dd0000067000011d6cc010100c0c111006cc","00ee00000efa9000eea7ee0089988ee0142888ef112288f701122fff00114442","00ee00000efa9000eea7dd00299ccdd014dcccdf11ddccf7011ddfff00114442","00ee00000efa4000eea79900244aa990149aaa9f1199aaf701199fff00114442","00ee00000efa9000eea73300299bb330143bbb3f1133bbf701133fff00114442","00028000028880000027770004970700004977700002877000028777000d7777","776ccccc77888ecc788888ecc8777826c8888827cc8882ccbbbd1bbb3336d333","ccccccc6ccbbb3676b8bb31773bb3816763311ccccc42cccb8b9413b33333333","c7cccccccccb3ccccb3b3ccccb3b1b3cc3bb1b3ccc3bb3ccaaab324999999999","ccc7cccccc8822ccc888222c88882222cd7d616cc777666cb7d76663bbbbbbbb","ccccccccccc33cccca913ccccc33ccccc447cc6cc47776cccc67777c11111111","cc1110ccc111110ccc070dccc9976dcccc8822cc46778644c71786dc677766d6","eeeeeeee9aaaaaaed9d9d9cec0c0c0ce8aaaa9aa9009900a10011001dddddddd",
	"eeeeeeeeee3333eee36636eee3cc3cee8333333a3003300310011001dddddddd","9aa9e888e99eeeeeeeee88888887688eee7766eee333111e33333111bbbbb333","88888888899944488cc7112889994448ecc7112ef999444fd9c94141dddddddd","ccc77cccccc66cccc76a976cc769476cccc773ccccc66c3ccccccc3c44444434","cccccccccc8722ccc7e8826cc888722cccc94ccccccf9ccc3bbb333313bbbb31","ccccccccc44cc99ccffc9ff9ddddeeeefdd99eeffd9ff9efb1f88feb31188223","ccccccccc44cc99ccffc9ff9ddddeeeefdd44eeffddffeefb1fccfeb311cc223","3333bbb3333bb89b33101a8b316101bb301000b3310001334410144444444444","7e7d644447e7644444707e44447777441dd11000400000044110000421d10002","0877770088888888b1616160b371716b00777700075500000788700000110000","0aaaaaa09aaaaaa0b911611a39c77c909977779097ee99a00744700000220000","0000000007677760777171707771717677677776000cc000007cc50000076000","0bbbbbb033b9bbb33355b55b339f77f0039fff000076700000f7690000442000",
	"000000001747747066466466677667766716671646466466264664620dd00110","0dd11110d111661d165575501617717016777770110300110067b7000300d100","001cccc0001c82c0001c22c000977c700694fff0686f44006772600055001100","0bbbbbb033b9bbb33355b55b339272f0339fff300376733000f7690000dd5000","0077770007776770671e61e077777770775772600755500000ddd70000766000","0066700009ffff009f7ff7f0678778709f7ff7f009ffff006777700055005500","00677770067577576775775777e7777e7077777670033b0600763b0000776670","00444440022444440224494403b73b73707b77b7703777700033300000776600","500ddd0050d55570055111550528110000111110005515000dd05d50515d1d51","03bb03bb3b1bbb1b3b1bbb1b3b1bbb1b37bbbbb76b11111b67777770033b033b","0000000070070700077777700075577777777777007557770777777070070700","0677600067777600757757507577575077577750077774570044456007676770","077777707557755777777777676767670776767033bbbbbb77bbbbb607766770",
	"0066665066644442066404026654444200dd422000dd1d0004dd1d0000440220","e0dddd500ed0dd050dd0d505ddd77776d0d78760d001100500ddc0000dd55d50","600000d06d6666606d686860dd666660dd600060dd6666600055000000606000","007700000887600000677700069ffff043977f77f3977f774bb9fff040b33300","00499990049899740499944403976764777b8b76679bbb74067b8b7600990440","067777706e5e7e5e6777777777878878706eee860077b6700b77337006551110","00ddd5000dddddd0dd77d775dfddddd5fffdddd50ddddd5000055000000d5000","0877770088888888b0616160b371716b0077770007550ccc078870c001110000","0008887000088888004f40f0004ff44f0004fff0088acc9070cccc1d00400020","000bbb70000bbbbb00444ff0004f40f0000ff44f0bbafff070cccc1d00400020","077888007778887088777780887fff8077f0f06000ffff00fcc7714004402200","00090900000c98000aafaaa0aaff0f090acffff1aaee8890ae877d6008888880","008b3b0008b0bbbb0077bbbb0877bbbb008677703833663003b3663300880220",
	"00aaa79000aaaaaa0f4f0ee00ff00ee000ffffff0a97ee6070eeee2d00d00010","00022700002222200f4f0f0000f000e0021f77002292ff2d7111110009000400","0011c100011fff000cf0f000001fff001cccd11a101110000cc0dd0011101110","09911400991f1f4097f0f040941fff401d11151a7019100009d0540077101660","00eee0090007e708769eed1179ccdd8179cc0d40006060000700060007700660","0099449000997700000ffff00088fffd6702801d700220000099004400660ddd","0ccccc00cccfccc00cccc0c0cccdfff401cc44000c1cff1d070c010000870d20","09999990097999090099090000977771d409dd000494664dd2740400000862d0","0888880088e88880828880808282fff1827644000876ff5d000b035d00890420","000ff00000fcfc004444822204449220888a892271161d160011110000100100","000aaa9000aa0a0900aa0a090aaaaaa999aa8809990aaa920088022008880222","000bbb3001cc0c0000bbbbb304bbbeb3443444004b3a9a3004b9990000b00300","000bbb300288080000bbbbb304bb33b3443444004b3a9a3004b9990000b00300",
	"000bbb3002ee0e0000bbbbb304bbb3b3443444004b3a9a3004b9990000b00300","000bbb300499090000b77bb304b777b3443444004b3a9a3004b9990000b00300","04444200044f442044f0f02044ffffd1009f4dd10fa994f00faaa0000070d000","0400200004442200444040204444441102244411828222004228822004000200","00066d000066ddd0066d0e0d066d6ddd021222202d55225d2f00550e216055d2","000dd8d0000dd8d00dddada011ddddd060111010f0d110100d00010001000100","0994424000ee1e100299744d23899440338d4620998844249055555400800020","00788020037b0fff734fffff394ffee0790afff9340a69090996649009a00490","000aaa0000aaaaa000aa0a0000affff000afff40077777f0aacccc1900cc0110","0cccc100ccccaa10ccca0a000caaaaa0000aaa000aaaa990a0bbb30900882200","00a9a9a000aaaaa000aa0a0000aaaaa000aaaa000888882090cccc1900cc0110","00a0a0000aaaaa00aaa0a0a00aaaaa0000aa90000a882900a888229000994000","0000000000acca000aaaaaa000aa0a000aaaa880000aa8800ccc1100cccac190",
	"0099990009097970000999910009440000999900099499009944940099949400","0000000010050500010550500105a8a010c55555155cc0000555500005505100","00d0010f00ddddff02dd0dff0ddddddddd9dddd042999942dd44442000400020","0887776088770706027707060877777608877770882499408288888201110111","0088620008666d0006070000998fff008699922a808820000660dd0088202220","077fffd076ff0f0d776f777d000f7f70777686d0f77686dd077cccd001100110","000700d000078880d008f0f1d008ffff78278d2088288820700700d088088022","0000000000044000004444000440402044722227444444420029900000442200","000878000078888002887766028772260b222220b002d2000b000000bbb33300","0000a09000090a00000aaaaa0b7a9aaab7a669903a4676040369764000bb0330","70d0a09077d90a0077daaaaa087a9aaa87a669902a4676040269764000880220","00eaaa900eaa0a0900aa0a090aaaaaa999aaaea9990aaa92002e022000ee0222","00000000008882000888882088778ff2887080f2888888228888882280880822",
	"0000000000ccc1000ccccc10cc07c061cc77c661cccccc11cccccc11c0cc0c11","000000000099940009999940997090f499779ff4999999449999994490990944","0000000000eee2000eeeee20ee70eff2ee77e0f2eeeeee22eeeeee22e0ee0e22","00033000000aaa00333aaaa303aa0a8009daffff99ddfff477bbb33d08880222","02822820888888882888a8a2888a0a02000aaaa000a7aa000ab3b39004440222","00ccc100077ccc6000ccaa1000ca0a00000aaaa000a7aa000ab3b39000440220","00444400044a0a0004aaaaaa0eeaaa90eeeeeee0aaeaaaa0aa11111901110110","0444440004aaaa0004a7f7000aa4440000aaaa0033ee4e00a333339005501100","0101111111144411111404000414444000024400330022034339aa9401110111","00700060007777700070ff00bb7ffff03cbcccc0f3ccccc40011111000f00040","0000000000999990094799470994909404944944999999909099999400900040","0eeea000eeaaaa00eee0f000eeefff00eee88e00eeeffe00eee22e0008888000","0004440006444f20f64f0f00f22fff002fcfc0dd40ccdff00f44f00004000400",
	"00e1110000eeb00000ee22000eeeeb00e02ee22200eeeb200eeee2200bbbbb30","000b3000000ba00000bb330000bba30000bb33000bbbaa300bbb33300aaaaa90","0001d11001111f10001ff0f00001fff000fff4000f0bb3400001110000800200","0004442208288820ff7ff0f0ff7ffff0fff4fff00ff4fd240777ddd40f000040","000aaa9000aaa9a9ff9a90f9ff8a9ff0fff0fff00ff0f204088822240f000040","00aaaa99000a9ff0cfb9f0f08f3ffff0ffff4ff20fff43420bb3033004000020","077444d0077ff440004f0f00cc1fff10ff1c111004f1f204004cc400070cc0d0","499999400499bbb0999bb0b0bb3bbb30bb34bbb0bbb332034bb02233bb000330","00044440000ffff0fff4f040ff2444f0ff9ff4420f9f4400ff88224088000220","0011000000111110ff4f18f0f44f80f0fff4fff40ff44ff4ffc101d0ff0cd140","000f88f0ff0ff0f0ff078ff47700fff40ff74d44000ff40000aa499000f00040","000888000088faa000af0f09ff88ff00f88830280903b32200fb034004000002","00444440004f4f44ff4ff0f4f444fff00fff440000444044055555500600000d",
	"0004444044244040422477704469977204699d22099220000990440044002200","087711100011c1c1fc1f70f0ffc4fff0ff7ff41400444400ccc1111044000220","000111100cc1444044c4404044c44440444e8440044881200cc1111004000020","0004442000446762004f6062ffa77777ffa22dd0408882000ad019dd04000200","0000ff400ff4f0f0fff40ff0ff477ffdff77740d0f788200008c111000f00040","000028920008881166d1f0f088fffff286ff1ff206d2114f88821210600000d0","0008800055128880f5588ff0ff5ff0f0fff22ff20ff2f124055511100f000040","0000000000eeee000ee7e7e0eee0e0eeee8eee8e22ee2ee2088eee2088882222","0000444400044f40004f40f0024fffff2242f44442448fff21449920f4ff8840","000000000200880020088888200f40f0020fffff0448fffff02982040ff04400","ee000000ee77760007f0f00007f0f0000077760007cc1120e070d0000ee02200","00011000000110000111f140011f0f010000ff4010011100017182d000990440","00011000000810000181f140011f0f010700ff4010111116011ee80000990440",
	"000ccd0000177700000717000009999000cc800077c7d1d00776600099044400","008882000887b830088bbb30994880209777c4400cccd9040044440000800200","00bbaa9007bafaa937fa0f00070ffff007bbf306ccc4943d0f0bb30d00040200","00a998400aaaaf900afa0f000aaffff0afee8800a74ee8407499a96000eec800","00000000000bb00000b7730000717000009999006bb3000007b6000099044000","00000000000cc00000c77d0000717000009999006ccd000007c6000099044000","0000000000088000008772000071700000999900688200000786000099044000","00047999f00717100ff9999904499ee0404299927004220d00ff444005500011","000e8000001d110000e1810011e8886667e188d0701e81000110001007700066","0094994004b930331149bb3341193330411199901101122044244dd001111220","00099000099cccd009cc0c0d00cc0c0d09c9d7d4088ccccd988c7776cdc88772","00099000099bbb3009bb0b0300bb0b0309b93734088bbbb3988b7776b3b88772","000d1100000822000011111000d71700607999908cc8212d76c7d00298042402",
	"009040000699f00006619100099fff100782200077382d00903a34000070d000","00001000001111111111f11001ff0f00201fff00229940f009f1144001100011","0000000000ffe0000ff00e000fff0f00f0ffff00049940f00991144001100011","0110000100a90009000aaaa9990a0aa09908aaa9090a999009a9a9a000a94490","1555555111ccc1c11011cc111001110117700771100000011ff77ff151ffff15","54444445444444f44477fff40000000007700770000ff000fff77fff5ffffff5","de5555edddeeeeddd1dddd1d1f1111f117b11b71111111111ff88ff155ffff55","53b33b353b3bb3b3b773377b7377773770377307777777777800008757888875","5000775700557c7505ffccc50fffc00cf0ff0aacffff444cfff7794c5fff44c5","5e855e85588e788502288220088888800a2882a0028888200880088000000000","1555555105aaaa50c0aaa90cc10a901c070a9071100a900114f77f415ffffff5","500000050000000003030030300b300337bbbb733bb77bb33bb00bb353bbbb35","500000050701107077100177756116577b3113b7777117770710017050000005",
	"5ccaacc5a1a99a1aaa9999aa900000099710017990dddd099d7777d95dddddd5","5777777577777777700770077777777770077007e777777e7707707757700775","50000005711111177011110777100177777007771660066110077001510ee015","5000000500011000044004400544444068544404054444400400004004044040","58eeee858888e788008888000118811007000070000000000058850058888885","588888858828828889a22a78899aa97827799772299aaa7299a55a7959aaaa95","5cccccc57cc77cc771711717117c17111f1cc1f111cffc1114f77f415ffffff5","5333333533bbbb333b0053333066760335576553306776033065560353333335","5cccccc5c111111c10000001aaaaaaaaa888888a0111111014f77f415ffffff5","5e8888e5e828828e8dd22dd88d1dd1d88d7117d88dffffd882dffd2858dffd85","5999797599999747499994944444444407000070494994944990099459944995","5888888588888888a888888aaf4884fa8ff88ff8888ff8888ff77ff858ffff85","588888e588eaa88e82e1188e822cc28e81acca1881cccc1881c88c18821cc128",
	"533bbb353033b30302033020088ee88000a88a0002288220028ee82052888825","5eeeeee588888888802882082702207227700772277007728002200858888885","500000050011010001f0ff100fff0ff0fcffffcffffffffffff77fff5ffffff5","d555555dd521125dd122221dd121121dd71ee17d211ff11221f77f1252ffff25","5770077570000007044774400004400007744770044444400448844070444407","800000080000000077f0ff777fff0ff7f0ffff0ffff00fffff0440ff8f0ff0f8","51111115100aa0011aa88aa11ffffff11cffffc10ffffff00ff88ff010ffff01","5855558588888888882222888211112887211278822888888ff77ff85ffffff5","5544445554477945944444949224422997f44f799f4444f9944ff44944422444","55cccc555c1111c5c1faaf1ccffffffcc7ffff7ccffaaffccfaffafc5caaaac5","5444444544444444404ccc100f4ffff0080ff0811ffffff116f77f61516ff615","785555075588005558880005877777708000000080c00c005777777555777755","511151111cc11c111fffff1f27eeee722eeffee2affffffa9ff88ff95ffffff5",
	"5e8888e5e88eee8ee888888ee2eeee2e0728827020822802528aa82552e88e25","5cccccc5c666666cc777777ccc6776ccca6776acc677776cc676676c56777765","54444445444444444f44f4f4cccccccc77c11c77cccffcccfff77fff5ffffff5","54444445444444444f44fff4333ff3330703307000333300fff77fff5ffffff5","5aaaaa5aaa99a99a8088a8088088880887088078808888088088880858888885","544444454444444470ff44777f0ffff7fcf00000fffff00f6ff77ff656ffff65","5333333533bbbbb33333b3b3a033330a07000070a00ff00aafa44afa5faaaaf5","544444454444444477f44f777ffffff7f0ffff0ffffffffffff77fff5ffffff5","5011110501a11a10001aa100880aa088870880780866668084f77f485ffffff5","7755557757666675776666776ffaaff66cffffc66ffffff6a6f77f6aa6ffff6a","5bbbbbb5bbaaaabbb3a33a3b30b33b0b3a0bb0a33dddddd33ddbbdd353bbbb35","8544445888444488888488888f7477f884f77f488ffffff848f88f8448ffff84","50000005333333334ffffff4ddddddddd711117d11ffff11fff77fff5ffffff5",
	"5888eee52888887e288888820444404007fff0700ffff0f00ff88ff005ffff50","5ffffff5ffffffff000ff000f40ff04ff7ffff7ffffffffffff77fff5ffffff5","5777774574477774400407074ff4f7f440ffff044ffffff44ff88ff445ffff54","52eeee25222ee222b232232bba0330abbaa00aabb3b33b3b53b77b35553bb355","5aaaaaa5aaaaaaaaa9a99a9aa4a4444a07f44f7000ffff004f7777f4a47ff74a","5055550501011010001001000111111007111170000000000000000050000005","5a5aaa5aa989a8aaa89a9a8aa888988a0a8888a0008888000887788050888805","000000000500005077ffff77700ff007f4ffff4ffff00ffffff77fff5ffffff5","5777777570600607700660070006600060000006670770766007700656077065","5888888588882285001cc00804f11f4117ffff711ffffff11ffeeff15cffffc5","5000000501111110044aa440776aa67774466447777447777744447757444475","5777777577ff667760ffff066f0000f667f00f76600ff0066ffeeff665ffff56","0000000006500560077557700077770008077080006776000600006056066065",
	"55567555566676656657756665555556650ff05665ffff5666f77f6666666666","522222252222222220000002200ee0022eeeeee220e00e022007700222222222","5000000500077000000770000f0000f007f00f70000ff00000f77f0050ffff05","56666665677777766555575666555566655555566655556626666662e266662e","50000500000000000111111011cccc111a0cc0a1c001100c5c0770c55cc11cc5","57222275276006722076670220077002222442222ffffff22ff77ff252ffff25","5bbbbbb5bb0000bbb003300bb7f00f7bb0ffff0bbffffffbbff33ffbb5ffff5b","59a90a050a00009000000009000000000a0000a000000000000aa00090000009","59999aa59999999a94449449888898ee8ff88ffe888ff88e28f77f8218ffff81","8e5555e88ea99ae888a99a88988aa8899a8888a9898888985887788588ffff88","5553b5555bb3bbb5bbb3bbbb00bbbb00370330733bbbbbb33bb77bb353beeb35","5178e7151878e78111888e1188888888177887781144441118ffff8158788785","1555555111555511c111111cc11cc11c1a0cc0a110cccc011cc77cc151cccc15",
	"5444444544444444494949944099490443099034499999944994499445999954","a55aa55aa3aaaa3a9aaaaaa9599aa9955ffaaff59aaaaaa9aaf77faaa3ffff3a","5dddddd5dddddddddffddffd000ff00007700770400ff004fff77fff5ffffff5","7765767756666676111111111111077717010767100107771111077750000775","5aaaaaa5aaaaaaaaa09aa90a009aa900070aa070a0aaaa0aaffffffa5ffffff5","50000005001111000ffffff088888888888ff888fffffffffff77fff5ffffff5","5667766567777776786776877887788776855867656666566050050656000065","50000005011111009a9aa9a999a99a9907444470044444400440044004444440","5c1771c5c116711c671671766716617618866881c166661cc111111c61cccc16","5558e5555ff8eff58ff88ff8888ff88e2f8888fe288ff88e28f77f8852ffff85","5888888588844888888ff4888989998880b99b08880990888998899885999958","5000000500000000666777660446744040444404444444444447744454444445","577777757777777777777777767777677a6776a7777777777ffffff75ffffff5",
	"00000000050000500f7777f000077000f0ffff0ffff00fffff0770ff5f0000f5","5bbbbbb5bbbbbbbb33bbbb33003bb300380330833b0000b333b77b3353bbbb35","5aaaaaa5aa9aa9aaaaa99aaaaffaaffaa0ffff0a9af44fa99a4774a99a4444a9","5000000500000000ffff40ff7777777770077007777ff777ffffffff5ffffff5","5bb33bb5bb3333bb5bb33bb5370bb0733aa00aa3b44ff44bb4f77f4b533bb335","5cccccc5cc7777cccccc7cccc1cccc1c177cc77111cccc111cc77cc151cccc15","5aaaaaa5aaaaaaaaa111a11aa1ccac1aa7f11f7aa111111aaff88ffaa5ffff5a","5cccccc5ccccccccc01cc10c1a711a711aa11aa1111ff1111ff77ff15ffffff5","5000000501111110066666600766667085766758655665566577775606777760","0111111000011000066116606778877608777780007777006775577656777765","588aa8e5888aa88e88aaaa8e002aa80007788770808888088882288858888885","5000000507000070700000077707707778777787088778800077770050777705","555aa5555aaa7aa5aaaa7aa999a77a9997aa7a7996aa7a699aaa7aa95aaaaaa5",
	"00ccc0000c1c1c000e1c1e000cc7cc0000ccc060076767000776700000707000","00500500009889000087780060511506508ee005055665500849940008558550","000000000bbbbb00bb7bbbb0bbb0b0b0bbb0b0b00bbbbb00b00000b000000000","0005500000057000005550007555755705577000005555005750007505000050","06c66c6000c22c0000cffcc00867768c0f5665f0006776000080080000700700","01cc1cc11c7ccc7c1c0c4c0c11c444c10111111f00f383f00f09a90000c0c000","00555500055fff5005f1f1f00ff1f1f000ffff000076670000f4490000011000","0078880007888880088008800000780000078000000880000000000000078000","007ccc0007ccccc00cc00cc000007c000007c000000cc000000000000007c000","1189900008988800001c1c00819999809899c990801991899080080000980980","0077700007262000072999000079900007655550474467000976000009099000","00055500005544500054ff400054ff000455b55004533350000f0f0000440440","99999fff99440f7f47f702ff4fff08004444200028280000f111000004040000",
	"0cccccc0c11cc11cccc11cccc1cccc1cc171171ccccccccc0001100000c00c00","0bbbabb0bbbabbbbb07bb77bb77bb70bbb3333bbbbbaabbb0003300000b00b00","0888888088828888888828888788887882822828888888880002200000800800","40444400044fff4004f4f40004f4f40000ffff0000c88c000f0890f000500500","0011100007799700070333330333737331333333311881000311113000303000","099a99909999a999979999799199491999a44a99999aa9990004400000900900","007eee0007eeeee00ee00ee000007e000007e000000ee000000000000007e000","00ccc0000cc7c7000c99f9000c9ff940cdcccd00cd3c3000c4d3d00000404400","000444000074744000fef740007774400034443000d343d0040d3d4000440400","0003b000003bb300b37777300bbbbbbb12f1f1f312fefef1022fff2001222210","000bb00000bbbb0000b1310000bb3b0303bbbb303003300000b3300000b0bb00","007bbb0007bbbbb00bb00bb000007b000007b000000bb000000000000007b000","000aa0f00ffaaaf0007cec70006777600f86668f0f8f6f8f0701910700ff0ff0",
	"0079990007999990099009900000790000079000000990000000000000079000","0072220007222220022002200000720000072000000220000000000000072000","00000000000000000000000055556600025256605555555a5115511501100110","008ee00008eeee0008e6860008ee8e00008ee8000808808000e8800000e0ee00","000000000000000090099700a9997170a9ff979090fff555044fff0000000000","09088000808878080888888005757700445665504222ee22442ee20000500550","000bbbb000b1bb1b00bbbbbb00b1111b00bb11bb030bbbb000333330000b0b03","b3b33b3bb3b33b3b0b0bb0b088beeb000b8888b00b0880b00033330000b00b00","007fff0007fffff00ff00ff000007f000007f000000ff000000000000007f000","007aaa0007aaaaa00aa00aa000007a000007a000000aa000000000000007a000","000004400003333300037b730000bbb0000b88b000bbbb000bbb000000000000","000004400003333300039a930000aaa0000a88a000aaaa000aaa000000000000","0000044000033333000378730000888000084480008888000888000000000000",
	"0000000a00000898044489a044444a0014144800414440000444000000000000","000e770000777770007e7ee000f7eee000ff99700ff990e00f900000090000e0","00b303b000333b000003b3000004390000449490004949400044949000044400","00000000003333000b1bb1b033133133bbbbbbbb387777830b8888b000333300","00aaaa000a199190a9199199a199991999111199999999990009900000aaaa00","000000000a99999009aaaa9009a99a9009a99a9009aaaa90099999a000000000","0000000000999900099aa99009a99a9009a99a90099aa9900099990000000000","00000000000a900000a9990000a9a9000a999a900a999a90a9aaa9a900000000","0000000000090000009a900009a9a9009a999a9009a9a900009a900000090000","00000000000000000000033000b3b3330bdbb33300b0bb3b0bbbdbbd0030b30b","0000000000000800000388200b3b3223bdbb33300b0bb3b0bbbdbbd0030b30b0","000088000082a92800388280b355b443bbbbb53b0bb0bb53bddbbbbb0300b30b","00000000000000000999900000909000099990a00044908000aa940009a94000",
	"0000000000888800080808000888880a00022809008aa808000aa28000080800","009990909990949099999dd900449dd909aa49d809aa498a049a949879407900","000000000000000000cccc00000c0c0000cccc40000a9c2c0009a1c100010c00","0060007000ccc7600c0c06000ccccc4000111c2700ca9c2600c9a16000100c00","6ccc1007ccc0c476ccccc4604aaadc402c999c202ca9a121019a9c1071000700","00000000000080800000b8b000000b0b0000aba30a00033b00b00a930003a930","00000000000b000000bb0000003bb0000bb0b300033bb000003b3b000003b330","6050576075d5767668d857660dcd56767655576067dd567606c0c76700000000","0000000000700000097900000090900009894007004490090089849400089840","0000000000aa90000a0a09000aa99900044444000a4a490004a4940000494000","505670670595967608a897670a9996700054456005059656705a507670a59070","0000000000440000094a400000404040088a4240029a44200499a49000800800","00888000088428042040504a288a54a902aaa990009a980000092a80008080a8",
	"000089808008489809890405009488a500444aa989442a920292992000080080","00000000000000d0dd0dd00dfdddfd0dd0d0d00d0fff2dd00d72ddd0040f40f0","440442004444209004042009fff2400907ff42090fff429090f9240004400400","00040400044440000040440008844004004488240266288202dd622000800800","0208080402888064204046442884424488442440002242000004242400808042","0002000000202000022220a00082a09000092002000220520222952922995a90","00220200007e7220029020920289098200280820200022505205222505225222","005005500a00aa000aaaa00000a0a00a0aaa80aa009aa0a90099a490099a9000","0040440009994090909090999999a009044490900ff790050f77455049049000","00000000000a0a0000a9a900000a0a0000fff900000eea09007f79a9009eaa90","0040240002a2a9420aaa942400a0a2420fffea20079efa7970aff970079007a0","00000000000d066000dd6cc606666c60006066d006666d6d0076666600606d06","110cccc0cccc11c00c0c1c00ccccc000ccc11c00011ccccc0d1c11c0061717c0",
	"0c110cc0c0c0cfc0ccccc1000fff1c0011ccccc701fcf1100c1c1c1c7d0177c0","00000000000d0dd0dd22d33d0dddd3d000d0dd200dddd2d2007ddddd0020d20d","d0000000dd20dddd0dddd33d00d0d3d00dddd20007872dd00022d22d0062727d","0d220d3dd0d0d3d0dddddd007887d2002dddddd702ddd2720dff2d2d750277d0","0000000000000000040ef04000efff00000e0f000ef8fff000efffef07fe7f2e","040000400f0ef0f00feffffe0e0e0fe00ff2fffe0effffef00ffff2e007007e0","0000000004889080098992820090982899999992044499990049949900409409","00000a0a00949aaa09494a8a4949aaaa9494499a494aaaaa09a99a0990aa9a09","00000000000020000e2ee2e002e22ee00eceece0eee88eee02eeee2000200e00","700220070e2e2ee000e2ee00000e0e000e787ee000777e0000777e0000e00e00","0010c000010c20011cccc012200cc122200ccc220211cc20000ccc000000c0c0","00c00c0010cccc01210c0c1222707c2222000c2202000c2000cccc0000100c00","00b0bb000b3bb3b003bb3b0000ddd0000d8d8d000ddddd0000ddd00000d0d000",
	"904994090a9449a0a9dddd9a955dd5590deeeed0dddd77dd0dddd7d000d00d00","082942808f8498f88828f288028f8820002222000d82822000ddd20000d00d00","000000000000000008a08a800a4498a009994940979794904999494994009049","0008800000a88a00008a88800a8888a088a8a888079794904999494094049404","07007000007007000007070000ddd2000d8d28200dd88220f2f22f2f0f2222f0","6d0d00d6d6dd0d6d6dddd6d607d7dd600ddd46d60074d4fd06d64f4f006004f4","0000000000000000000440000044440000040400004842000f4422f0fefeffef","004440000004040000284400044242440040204004842484f442f444efefefef","000000000559055005f9fe50000f0f0400fff004000eefe0000fef0004f00e40","000050550000f8f50f000f0ff0f0fffff000eeef0f0fffff00feef0e00ffef0e","000000000000a900000aaa9000a0a09a00afff9a009ff9a90f0aaaaf00f999f0","0010c0c000c8cc00000c0c000aaacc0000011c0c000c17c000010c0000710c70","0000000000f000f000efffe000f0f0f00fff88f0f0ffffef400f0e0400440440",
	"0f0000f00effffe004f0f0f04eff88f454effff544eeff440050050004400440","0000000000f000009ff9000fff990fff0909595ff8f945950ff49f99040f9409","00ff00f09ff9f00fff9900ff090ff0ffffff595f0ff4959005e5f9f904090409","0000000000ccc0000c0c0c000ccecc000c777c0000c6c6000000677000000670","000000000000000000c00c00007cc7000cc77cc00c7557c07056650700c00c00","0000000000c00c00007cc7000cccccc0cdc57cdc767757676075770600c00c00","0000000000000000000a00a0000aaaa0000aaaa00000a440009049a00099aa90","000a0a00000a8a006047a74060a4a4a00a0f4f0a0000aa0a000a99a4007a0970","000a0a00000aaa006047a74660a2a2a6a40f2f2a0000990000040040007a00a7","0000000000f900000f9660000868600006ee6600d0ddd060000d600000d00600","000f900000f9dd00008d8d0000dddd200d2222dd0d0ddd0d00009500000d00d0","060f906060f966066086860606fffd600d6dd6dd0d06660d00d595d000060600","0000ff00008f0ff0008ffff0000002000000200000004b00000304b000002040",
	"00000990000aaa0030aaaaa0337a7a90039aa9b008899bbb080890bb00880000","00bbb3000bb380200080080430988904337a792039aaaabb099aa3bb00999030","008cc80008cc888002ccc88000c8cc000c7c7cc0002cc0400200000400400040","008cc80008dcd88008c8cc80cc0dc0cc00700700024cd420240c004220400420","000000000000000000066000007676000d6e6660d06e6606dd066066dd000066","0dd000660dd00066dd666606d67676660d666d6006d6d66000666d000dd00660","0003353003f953330898f5350ffff3f393eef53f70555357009335f0009000f0","000000000000098000808ffa0900f0f9089ffff800feeff00ff9f0e00d50d050","f89a0a800ff898000f0f800affff989800fffff800effaff00ef9e0f005d050d","09990000999999704449997708e444f70bbee883999bbb33499999f700099970","000043b0000bb03b00babb0000babb000babbb300babbb3003bbb33000333300","00000aa00000009a00000949aaaaaa4a9aaaa4aa49944aaa9aaaaaa009aaaa00","00b0b0b0000bbb000093b4000949494004949440094949400494944000444400",
	"00fffe000fffffe0fffffffefffffffeefeffffe0eeeffe0bbeeeeeb0000bbb0","00000b000888b88087e888888e88888888888888888888880888888000888800","0000000000000000780888877888808778808887b788887b3b7777b303bbbb30","0000bbb0000b0b0000b00b0000b0088008808878887808888888088008800000","0088bb0009993b809aa999889aa99988999999889a9999880999988000888800","0f4444f0f24ffffff4ff444ff24fff2f7f2222f7f777777f9ffffff909999990","0eeee000eeeeeeeeee788888eeeeeeee7eeee667d6776ddddddddddd0dddd000","0777770077777a707a77799079a799770799aa0707aaaa070aaaaa7004999400","00077770000cccc0ccdccccc0cdccccc0077777700cccccc00cccccc00777777","0000000077777700777777777777770777777770d7777d000d66d00077777700","7777770077777d7777777607777776077777760777777d7067776600d6666d00","7222222778788887787888877888888707222270007227000007700000777700","070009900070977907cc9c790799997007999970007777000007700000777700",
	"0000aaa00009a99a0008a89a098aaaaaaaaa88aa889822898899889999999999","000bb00000b3133b0b31bb300b37bb1bb3fbb13b3bbb33b00bb3bb00003b0000","070000700779997007a99970079999700779997007999970079999700d7777d0","029220002429f22042442942244244f924244f7f0224f7790024ff9000024400","9aaaaaa9a99a99a9a94a94a9aaaaaaaaa99a99a9a94a94a9aaaaaaaaa99a99a9","0224000092274000f9227400ff9227400ff9227400ff9222000ff9220000ff90","0004499000fff49904499f49fff49999999f4999999999944999994004444400","004444000499494094a4a994a000a944000004a4000009a900000aa000000a00","000ffff0000999ff00ffff9f0fffff94fff9888f8882282f8822fff0ffff0000","044aa440444aa444f444444f4f2ffff4f424444f4f4ffff4f444444f0f4ffff0","000000000ff00ff0f99ff99f9009900990099009499449940040040009000090","0000033b0003ab3b0033bb3b03ab33bb33bb3bb0ab33bb00bb3bb00033bb0000","00000000000000d076666d670768b67000733700000770000007700000777700",
	"0007000000077070000f2077002442f002444240042444404424244044244200","0424424024444442242442422444444262222226677777764777777422222222","0048e8400484848428e828888484848488288828228484822222222202444420","00000bb000000bb300007bb3000bbb3000bbb3003bbb3b003bb3300003330000","00bb00bb00bbb0bb00003b30000030b30088b0bb088880000e888000fee80000","000bb0bb0000b3bb00009b30000999bb009f990b09a990000999000099000000","0000000000000066000006600079440007794420d77a922d6dddddd606666660","0f4444f0ffffffffffffffff04444440077aa770f999999fffffffff0ffffff0","0cc00cc0cc7ccc7ccccdcc7dcccdcccdcccdcccdcccccccc044004400ff00ff0","00d76d00088888800888887008e777e00e777e80078888800888888000d6dd00","0004bbb0000403bb02e0223b2fe208202e220820222282202222222002222200","0000b00b00003bb30002e2b00227223b2ef22220222222202222220002222000","0007700000777700077774400774444004444440099999900044440000999900",
	"00004406044aa466049a9a600aa9a99099a8a897789898877799997707777770","0b7777b0b788aa7bb7ff887b0b7777b030000003333333333333333303333330","00ffff000ffffff0ffffffffffffffff00044400000fff0000ffff0000fff000","4992499244424442222022204992499244424442222022204992499244424442","00ffff000ff4fff0fffff44ff24ff42ff22fffffffff44ff0f4f42f000ffff00","0004044000994900099f9490947f994994fa994992a999290929929000044000","000dd000000770000024420000444400004bb400007bb700004bb40000244200","00ff00ff0094499f000fff900ff9f440f99f4ff09aa409909aa4000009400000","0999999099999999888888883aaaaaa3444aa444444444449999999909999990","000f80000ee88ee0e8ee8ee8ee8ee8ee8888888807f7f7f00f9f9f900f9f9f90","0bb009a900bb9a9a33b9a9a90b9a9a900ba9a9b00bba9bbbb3bbb30bbb000300","0000040077fff4f90877ffff088877ff77bb887700778888000077bb00000077","0000000000000000099999909a88aa8988aa88a8888888889999999909999990",
	"00000000003333000303b33033333b333b3333330bbb33300bab3333babbb333","0000077000000777099977779999970099999400949994004999440004444000","0006060000066000000dd00000676600067767607677676776776767076dd670","0000f9f0000f9f9f0009f4f90f9f4f99f9f9f9909f4f9000f4f9900009990000","0000004000000f490000f7f90ff77fa9f77ffa90f7ffa9009faa990009999000","000000000000000004444ff04244fe8f4442f87f2444f88f2222f8ef02222ff0","0bb0bbb0b0bbb0bb000b00000eeeee00effeffe0777f77700777770000070000","999900004449990098944990888aa490989aa499aaaa8849a88a8849a88aa949","0000033000099aa30b9994a3ba444ab3baaaab333bbbb3300333330000333000","00777700077777700777777077a99a77779999777799997707a99a7000777700","000000000979997097999799f999f999999f999f949444494f7777f007777770","00b33b000737b3b0b37bbb3bb3bbb3b7bb333b7b3bb3bbb3b33b33330bb33330","00444400042442400424424004244240042442400444444000022000000ff000",
	"0033330033ffff3337777ff3bff7ff77377f77f33f7f773bb3fff3bb0b333bb0","009919000c199990911a911999a9911949999994044444400949494002494920","00008880007728880c7c7888cc17772801cc7c70044c1770ff41cc00ff00c000","00000000030bb030083333808383383887e888888e8888888888888808888880","000887700078877707777777777777774ff44ff4f44ff44f44444444f777777f","0bbbbbb0b303303bb3b77b0bb033033b2bbbbbb2222222222244444202244420","077b33007aa7bb307a27b7b37aa7bbb372a7b3337aa7bbb37a27bb30077b3300","02222220222222222400004222f4442242222224944444499f4ffff90ffffff0","00aaaaa00aaaaa99aaaaaaa9aaaaaaa9aa9aaaa9aaa9a999bba99990bba99900","000b000000033000099449909a9999999a9aa9a99a9aa9a99a4aa9a909499490","0000000000004440004f4442044444f244444442494444202444420002222000","0004990009490040900909949009900977777777d777777d067777600d7777d0","009999000999999099bbbb999b4b88b9b444888b4aaaaaa8aaaaaaaa99999999",
	"00fffff007fee8ef7eefeeef7e8effef7e88eef7477777744444444404888840","048e8400048e84000048f8400048f840048f8400048f84000048e8400048e840","0000000b00cc0c7000111cc00c1c71100c1cc1c7011111ccc1c71110c1cc0cc0","0088bb0b087883b00788bb3b2988bb8b88898888888888888988888028882000","0078e066077887607f777ff777fff47707444470007227000007700000777700","008eee0007f8efe0077f8ee80077228e80008eef8800288888e8eef000ee8e00","000909009049090994494949494949940999999007777770067777600d7777d0","0000bb60000b99b600b999bf0b999bf7b999bf7fb99bf7f66bbf7f6006666600","000000000000000000888900088977a0228977aa08899aaa08899aab0088aab0","000099f0000fff9f00ffff4f0444ff494ff94499f388f990f44499000ff99000","088800008788e0008888e200888e28000ee28200002827000000007000000007","07000bb00078867b007ee67b07eeee6007eeee70007ee7000007700000777700","0008b000008bbb0003bbbbb003333bb00bbbb3b088bbbb0088bbb30003333000",
	"00888000000e8800800028008e088020882e28000880e8280002028800000880","0444444049f949f44f49949404929940049929400449944004f49f4004444440","000000b300077733007777600777776007777660677766006776600066600000","00bb03b30bb33bbb0b33bb330b3bb33006363bbb077bbbb37776333077000000","0000b00000000b0000000bb0000088800008e880008e88208888820002222000","0677776067777776707777077077770777777777770000777777777777077077","0000000080000008880000880800008000000000800880080888888000800800","0008800000888800088888808888888822288222000882000008820000022200","0088888800288888002288880008888800888288088822280282202200220002","0077cc0003c3cc7033333cc73333ccccc3cccccccc3c333c0ccc333000ccc300","0000000000ee88000ee8888088222288022762200888888000e8880000000000","00007000000760008807600080866d668886d660000880000008080000088800","0800080000888008800000800800008008000080080000088008880000800080",
	"0000003b000000bb000003b300000b30bb00b3003b3bb00003bb300000b30000","0000008288000888028088820028820000288000008228000800008080000002","00aaaa000aaaaaa0a0aaaa0aa0aaaa0aaaaaaaaaa0aaaa0a0a0000a000aaaa00","00aaaa000aaaaaa0a0aaaa0aaa0aa0aaaaaaaaaaaaa00aaa0a0aa0a000aaaa00","00aaaa000aaaaaa0a00aa00aacaaaacaacaaaacaaaa00aaa0aa00aa000aaaa00","00aaaa000aaaaaa0a0aaaa0a0a0aa0a0aaaaaaaaa000000a0a0000a000aaaa00","00aaaa000aaaaaa0a0aaaa0aa0aaaa0aaaaaaaaaaaaa00aa0a00aaa000aaaa00","0088880008888880808888088808808888888888880000880800008000888800","00aaaa000aaaaaa0a0aaaa0aa0aaaa0aeeaaaaeeeeaaaaee0aa00aa000aaaa00","00aaaa000aaaaaa0a00aa00aaaaaaaaaaaaaaaaaa000000a0aaa88a000aa8800","00aaaa000aaaaaa0a0aaaa0aa0aaaa0aaaaaaaaaaaa00aaa0a0aa0a000aaaa00","00aaaa000aaaaaa070000700000aa000000aa000aaaaaaaa0a0000a000aaaa00","088008807788888878888888e88888880e888880008888000008800000000000",
	"0880088078008888e88808888880888808880880008088000000800000000000","0004000000044000004450000055440004444440044455505555444444444444","00b00b003bbbbbb0b0b00b003bbbbbb300b00b0b00b00b0bbbbbbbb300b00b00","0777777077777777770000770000007700077770000770000000000000077000","0007700000777700007777000077770000077000000770000000000000077000","000cc000000cc000cccccccc0cccccc000cccc000cccccc00cc00cc00c0000c0","0000dddd0000dddd0000d0000000d0000000d0000dddd000ddddd000dddd0000","00000ddd00dddddd00ddd00d00d0000d00d0000d00d00dddddd00dd0dd000000","00080000000800000089080008898980898a998889a77a9889a77a98089aa980","009aa90000aa900009a900000aa000009aaaaa900000a900000a900000090000","0006660000666660006666606666666600000000c00c00c0000000000c00c00c","9909909990aaaa090aaaaaa09aaaaaa99aaaaaa90aaaaaa090aaaa0999099099","0007000000777000000700700707777777777070070070000007770000007000",
	"000c0000000c0000007cc000077ccc00c7ccccc0ccccccc0c7ccccc00ccccc00","000000000099900009aaa9009aaaddd09aad666d9aad666609d66666dd666666","0067770006760060677000007770000077700000677600060677776000666600","0000000000bb0bb00bbb3bbb0bbb3bbb0033b3300bbb3bbb0bbb3bbb00bb0bb0","000b3000003b310000b3330003bb33100b3333303bbb33310004200000242200","067777606777777677777777d007700dd0d66d0d777007770777777007077070","0222222022ff022222ff0f2202fff22208888f22f88888f00088880000f00f00","4444440004f0f4000ff0ff000ffff00000cccc000fccc0f000ddd00000d0d000","00ccc0000ccc0c000ccc0c00aacccc000ccccccc0ccc1cc000ccc10000a00a00","04000040042004e004424ee004444440204404404044044424e4444002044200","0000000000774220027404227774042200744422727777220e2077220ee67777","0097a9007a97a9aaa09aa90a909aa90a04999990004999000004400000999900","0007a0000009900007a44aa07887a88aa887a88a922aa229092992909aa7aaa9",
	"0000600000060060006006000060600600660060066666006660000066000000","0000006700000667000066670006666700666670066677006660000066000000","000666600067766600676666006666d60d666dd606666660666d000066000000","000ff000000ff000000ff000ff449f00ffff4fffffff4fffffff4ff00ff4ff00","0ffff000ffffff00ffffffffffffffffffffff00044ff00000ff000000ff0000","000000ff000000ff000000ff00ff44440ff4ffff0ff444ff099994ff0009fff0","000ff0ff000ff0ff0000f4f400ff44440ff4ffff0ff444ff099994ff0009fff0","000a90000077a9000077a90000aaaa000999944009aaa990aa4444990044a900","0000000007ccccd0777ccddd7777dddddddd111c0ddd11c000dd1c00000dc000","760000777660076607d17660001766006076610606661d60046006404006d004","777766667ddd11167ddd11166ddd11166ddd11176ddd111706dd1d7000666700","0dddd000d676dd00d7766d00d6666d00dd76dd000dddd0400000024400000024","00000d6d0d0006061d0d0d6dd100600060060d006d60000067d01dd07666d100",
	"0077770007777770077007700770077007700770077007700777777000777700","0007700000777000007770000007700000077000000770000077770000777700","0077770007777770077007700000077000077700007770000777777007777770","0077770007777770077007700000770000007770077007700777777000777700","0077770000777700077077000770770077777770777777700000770000007700","0777770007777700077000000777770007777770000007700777777007777700","0077770007777700077000000777770007777770077007700777777000777700","0777777007777770000007700000770000007700000770000007700000077000","0077770007777770077007700077770007777770077007700777777000777700","0077770007777770077007700777777000777770000007700077777000777700","0000007700001707011101001dd110101d111100111111001111110001111000","0077780007777870887778776877787766877787668777880626777000266600","0474440047447440644447446244444422244477222247240222622200226222",
	"007dd70007777770d77dd77d77dddd77d70011761d60166101dddd1000dddd00","00bb7b000bbbb7703bbbbbbb3bb777bb337bbb7b336bbb730d3336d000333d00","0099490009949990949499492222224992929922429299240542445000525200","0066660006707760677077766770707667700776677777760677776000666600","0000000077777777d777777d6d7777d670d77d07d77dd77d7777777700000000","ccccc100111c100000c100000c100ccccccc10c111111c100000cccc00c01111","880000888880088802222220fff82fff099829900ff82ff00ff82ff00ff82ff0","0076660007600660060000600660066000666600000660000006660000066d00","00cccc6000c66c7c0cccc67c0cccc7c0cccc67c0cccc7c00c6667c000cccc000","0008800000088000008778000087780008877880088888808887788888888888","0088880088288288889aa98888288288008888000000b0000b30b0b000b3b300","00000fe000006eee000aa6ee00aaa9d00f9a99000ff49000dff90000dd000000","0777777077777777777777777070707777777777077777700000770000007000",
	"0676666006766660d11dd11dd1d76d1dd6d76d6d06dddd6006766660066dd660","66066066666666660dddddd006666660066dd66006d99d6006d99d6006d99d60","0088066000888860088886200888876288886770068870700666707000067000","0000000000888800088886280666268d0777288d888888007667d0000d00d000","77611677770000777700007760d00d0610000001100000016000000677700777","77777777e8e77e8e888ee8888888888888888888788888877788887777788777","777117777710017771000017d000000d0000000000000000d106601d77700777","777ee77777e88e777e8888e7e888888ee888888e7e8888e777e88e77777ee777","d117711d777777777117711777777777611771166666666666666666d666666d","d117711d777777777771177777777777611771166666666666666666d666666d","d777777d711771177777777771177117677777766666666666666666d666666d","d777711d777777777771177777777777611777766666666666666666d666666d","d117777d777777777777777777777777677771166666666666666666d666666d",
	"d777777d777227777728827777788777677777766666666666666666d666666d","0505500500055550a0a555006e60000050000000500050500505505005050550","1010011011100001a1a000116861111101111111011101011010010110101001","2020022022200002929000227e72222202222222022202022020020220202002","3030033033300003c3c000337e73333303333333033303033030030330303003","4040044044400004b4b000447e74444404444444044404044040040440404004","5050055055500005959000557e75555505555555055505055050050550505005","6060066066600006363000667e76666606666666066606066060060660606006","7070077077700007c7c00077fef7777707777777077707077070070770707007","8080088088800008b8b000887e78888808888888088808088080080880808008","9090099099900009c9c000997e79999909999999099909099090090990909009","a0a00aa0aaa0000acac000aa7e7aaaaa0aaaaaaa0aaa0a0aa0a00a0aa0a0a00a","b0b00bb0bbb0000baba000bb7e7bbbbb0bbbbbbb0bbb0b0bb0b00b0bb0b0b00b",
	"c0c00cc0ccc0000c9c9000cc7e7ccccc0ccccccc0ccc0c0cc0c00c0cc0c0c00c","d0d00dd0ddd0000dbdb000dd7e7ddddd0ddddddd0ddd0d0dd0d00d0dd0d0d00d","e0e00ee0eee0000eaea000ee686eeeee0eeeeeee0eee0e0ee0e00e0ee0e0e00e","f0f00ff0fff0000f3f3000ff7e7fffff0fffffff0fff0f0ff0f00f0ff0f0f00f","ff0ffffff0fff00ffffffffff07ff07fffffffff0ef00ef0f007700fffffffff","eee11eee2eeeeee21e7ee7e1e222222e2eeeeee22e2ee2e22eeeeee2e222222e","7771177757777775170770717eeeeee7effffffeefeffefeeffffffe7eeeeee7","000000000880088088888888e8888888e88888880e88888000e88800000e8000","00aaa9000aaaaa90aa0aa0a9aa0aa0a9aaaaaaa9a0aaaa090a00009000aaa900","000000000880088088880888e8808888e88088880e88088000e80800000e8000","00aaa9000aaaaa90aa0aa0a9aa0aa0a9aaaaaaa9aa0000a90aaaaa9000aaa900","977977997997cc77999ccc7977ccc9977ccc9979ccc97997cccc7979ccccc797","0007777000787000078000007777780000877777000008700007870007777000",
	"e01ee10e0e2112e012e22e21e12ee21ee12ee21e12e22e210e2112e0e01ee10e","7777777776666667765555677650056776500567765555677666666777777777","00aaa9000aaaaa90aa0aa0a9aa0aa0a9aaaaaaa9aaa00aa90aa00a9000aaa900","00aaa9000aaaaa90aa0aa0a9aa0aa0a9aaaaaaa9a07777090a00009000aaa900","00aaa9000aaaaa90aa0aa0a9aa0aa0a9acaaaaa9aaa00aa90a0aa09000aaa900","00aaa9000aaaaa90aa0aa0a9aa0aa0a9aaaaaaa9a0aaaaa90a00009000aaa900","5000000500000000030030303003b00337bbbb733bb77bb33bb00bb353bbbb35","000550000005f00000555000f555755f05577000005555005f5000f505000050","00feee000feeeee00ee00ee00000fe00000fee00000ee00000000000000fe000","000000000bbbbbb0bb7bbbbbbbb0bb0bbbb0bb0b00bbbbb00b0b0b0b000b0b00","0000700000076000880760008086656688865660000880000008080000088800","0bb0bb00bbb3bbb0bbb3bbb0033b3300bbb3bbb0bbb3bbb00bb0bb0300000003","ccccc100111c100000c100000c10cccccccc10c111111c100000cccc0c101110",
	"7799997779900997990990999999999999099099990990997999999777999977","0800008008800880008008000000000000000000800880080888888000800800","009aaa9000aaa90009a900000aa000009aaaaaa900000a900000a90000009000","0077cc000ccc3c30ccc33333cccc333ccccc33cc33c3cccc033ccc700033c700","000ccc0000c0ccc000c0ccc000cccc99ccccccc01cc1ccc0011ccc0000900900","0007a0000009900007a44aa0a88aa88aa887788a922aa229092992909aaaaaa9","000000000cc7c7c00cc677c00cccccc00c7777c00c7777c00166661000000000","7799999b9999909990099099999999999e9999e999eeee9999988999b998899b","8888888880000008855005588050000880000008880000880800008008888880","000880000086880000088000003b3b000b355330035555b000b553000003b000","0577750067777760776776767678878765688787067770760005776000006770","7dddddddd1111111d1ccccccd1cbbbbbd1cbaaaad1cba999d1cba988d1cba980","99906bbb98960b3b99906bbb0606060660606060ccc60aaac1c06a9accc60aaa",
	"cccccccccccddccccaaccaaccccddcccccccccccca7777accaaaaaaccccccccc","c7cccccc777ccc7cccccc777cccccccccfccccfcf9faaf8fa4aaaaeabbbbbbbb","000000000000aaa000888a0000808a0000888000008000000080000000000000","0000000007500570075005700750057005000050000550000057750000000000","080080c0080080c0080080c0088880c0088880c0080080c0080080c0080080c0","222aa222211aa1122aaaaaa22a7117a22a1111a22a7117a26a6666a66a6666a6","00ffff000ffffff0ffeeeeffffe22effffe22effffeeeeff0ffffff000ffff00","66660ffe666600ee0060fe0eff0fee00efffe066eeef066600fee06660eee066","550077055077777007799977779aa797779aaa97777999970777777750777770","000eee0000e8eee000e8eee000eeee99eeeeeee02ee2eee0022eee0000900900","8008000b008070b008000b00800000700700000800b000800b070800b0008008","dddddddd222882222b2882b22228822288800888808888088800008888888888","0077777007777777070070070780780707770777007777700070707088888880",
	"b800008b8b8008b808b88b80008bb800008bb80008b88b808b8008b8b800008b","0000a00000ccccc000fffff000f7f7f000fffff00a88888a0088888000444440","0000000000bbbbb000bfffb000b7f7b000fffff00b99999b0099999000333330","000080000011111000fffff000f7f7f000fffff0084444480044444000111110","9999999999797999977777799979997999777779997999799777777999797999","0e8008e0088008e00e8008800e8ee8800ee88ee008800e8008e0088008e008e0","0090900009999000090009000900090009999000090009000900090009999000","9979799997777999979997999799979997977999979997999799979997777999","7797977779999777797779777977797779799777797779777977797779999777","7aaa4aa67aaaa66677aa6666776666667665666666665666666665666666665a","707777777a477677aa476667aaa46666aa6656677666657765666a476656aaa0","1666666118788881188777711888998117779971177777711777887116666661","1666666117888871187777811889988117799771177777711778877116666661",
	"1666666118888781177778811899888117997771177777711788777116666661","1666666118887881177788811998888119977771177777711887777116666661","1666666118878881177888811988888119777771177777711877777116666661","1666666118887881188887711888889117777791177777711777778116666661","1666666118878881188877711888899117777991177777711777788116666661","9979799997777999979997999799979997777999979997999799979997777999","7797977779999777797779777977797779999777797779777977797779999777","7779797779999977779777977797779777999977779777977797779779999977","0009090009999900009000900090009000999900009000900090009009999900","9997979997777799997999799979997999777799997999799979997997777799","1191111111191119119999991991999199999999919999999191111111199199","1111111111111111111919119199999199919199199999991919191999111119","1119911111999911199999919919919999999999119119111919919191911919",
	"1111111111191911119999911999999999119119999999999999999991919191","1119999119999999999199199999999999999999119911991991991999111111","1119191111999991199191999999999991999991919999911119191111991991","1191111191191119919999999991999119999999119999991191111119911111","1199999119999999991191199919919999999999999999999999999991919191","1111999111919991199999991991111199999999999999999111999191111111","1111119911111999111999991199919119999999999999991199911911191111","1111111111911191111999119199999199199919919999919119991199111119","1191111991191191919999999991991919919919199999991919119199111111","1119999111999999199199199999999999999999911911911191111911191191","0090900009999900009000900090009000999900009000900090009009999900","7797977779999977779777977797779777999977779777977797779779999977","9979799997777799997999799979997999777799997999799979997997777799",
	"0090900009999000090009000900090009099000090009000900090009999000","7766665777666657665777776657777766577777665777777766665777666657","88838388833333338383838383b383b883333333888383838333333388838388","8838388833333338383838383b383b8833333338883838383333333888383888","0030300033333330303030303b303b0033333330003030303333333000303000","7737377733333337373737373b373b7733333337773737373333333777373777","1131311133333331313131313b313b1133333331113131313333333111313111","11131311133333331313131313b313b113333333111313131333333311131311","77737377733333337373737373b373b773333333777373737333333377737377","00030300033333330303030303b303b003333333000303030333333300030300","66636366633333336363636363b363b663333333666363636333333366636366","6636366633333336363636363b363b6633333336663636363333333666363666","883b3b883333333b3b3b3b3b3b3b3b883333333b883b3b3b3333333b883b3b88",
	"88b3b388bbbbbbb3b3b3b3b3b3b3b388bbbbbbb388b3b3b3bbbbbbb388b3b388","883b3b883bbbbbbb3b3b3b3b3b3b3b883bbbbbbb883b3b3b3bbbbbbb883b3b88","88b3b388b3333333b3b3b3b3b3b3b388b333333388b3b3b3b333333388b3b388","cca9a9cca9999999a9a9a9a9a9a9a9cca9999999cca9a9a9a9999999cca9a9cc","cc9a9acc9aaaaaaa9a9a9a9a9a9a9acc9aaaaaaacc9a9a9a9aaaaaaacc9a9acc","cca9a9ccaaaaaaa9a9a9a9a9a9a9a9ccaaaaaaa9cca9a9a9aaaaaaa9cca9a9cc","cc9a9acc9999999a9a9a9a9a9a9a9acc9999999acc9a9a9a9999999acc9a9acc","55555fff5555ffff555fffff55efffff555fffff555ffeff555fffff555fffff","ffffffffffffffffeffffffeffffffffffffffffffffffffffffffffffffffff","ffffff55fffffff5fffffffefffffff5fefffff5ffffff55ffffff55ffffff55","555fffff55ffffff5effffff55fffeff555fffff555fffff555fffff555fffff","554ff445554ff4455544f44555ffffff55effeff555fffff55ffffff55ff4fff","5555555555555555ff555555fffe5555ffff5555ffff5555fffff555ffffffff",
	"055555585000000550770775507c07c550005005850000050808080880858580","8888888799999966aa222fffdd2121eeee2221ddfff111aa6699999978888888","35313531935393531135359113535353193159311111511111155511b55bb5bb","ad2ec72b25b8a0e88ad557d5bce527cae25bdea55558572bcdae508c8a2bc7d5","0000d006050d00ff5070d70e500101e00e101005e07d0705ff00d050600d0000","114141414444444144ffff1144fffc1114fffff114ffff11444fff11441ff111","177188881171800817118008177188885555dddd055077d705507d775555dddd","eeeecaace111caaceee1caace111ccccbbbbd11db888d1d1b888ddd1bbbbd11d","00000c00003e0880c030300000383030033aa3300833a30d8033333080033030","0353350035000353503530053050300330305035530030500500503803533083","0005500070755707000550007075570700055000555555555555555580855808","0008800000088000000880000708807000088000888888888888888800088000","8888888888888888888888888888888888888888888888888888888888888888",
	"00eff0000efffff0efffffffeff5ff5feff0ff0f00fffff00f0f0f0f000f0f00","89abcdefb000000120b07b0ce000700d5077770440788702c00000039abcf675","8880000099988000aaa99800bbbaa980cccba980ddccba9800dcba9800dcba98","0000000003300330333333303370370033333330c3444440c3333300cccccc00","004004004940049499f99f997f0990f707f99f70007997000070070000077000","7007777077a97779777aaaa9997a0aa09978aaa9747a999774a9a9a777a94497","0000000008800880888818888881888808881880008188000008100000000000","000820000008882000777200007079400777940007782000777820007777d000","e000000e0e0202e0002828200287778202878782002777200e0282e0e000200e","bbccccbbccccccccb777777bb707707bb709907bb799997bb999999bbbb88bbb","aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","ccccccccc11111cc111070cc1c1fffccc111111cc11ff11cc71ff17ccc8cc8cc","000999000099999099f9090599f99f559909ffff0055ffff059950e0599ff500",
	"7777777777777777777777777777777777777777777777777777777777777777","03bbbb303b7bb033b3bbbb3bb70bb70bb30bb03b0bbbbbb000b33b00000bb000","cc0000ccc088880c08888880008008000707707007700770c077770ccc0000cc","cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc","eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee","055500605ffff060ff0f0060888880608b8883f03bb8b0403333300040004f00","777747727e7744727ee744442e2f4040222f44247244fffe77444ff777427427","0000000000044000000440000044440004404040444444440000000000000000","7888888788888888008888000008800007000070000000000008800078888887","b33333bb3355533bb50505bbb50505bbb57775b8b5774444bb555bbbbbbbbbbb","0000000000800800080880808080080808000080008008000008800000000000","7000000700000030030300033003300337333373333773333330033333333333","bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
	"eecccceecccccccce777777ee707707ee709907ee799997ee999999eeee88eee","0777777000000000000000000000000007700770000000000ff77ff070ffff07","01110aaa111100aa0110000a0005050055585800555545005500500005000000","000099900009099900099999a00998800909ff0909099ff00099555000098098","6660006660660660600660006066666666666066066060660600600000660060","cc9333ccc9303333cc773333c9773333cc86777c3933663cc3b36633cc44c22c","7888888788888888855885585758857557755775577557758558855878888887","eee11eee2eeeeee21efeefe1e222222e2eeeeee22e2ee2e22eeeeee2e222222e","7000000770000007700000077700007777700777077007700000000070088007","0080008000980000000898000808980000899900089aa9889aaaaaa000888808","067777700d7bbb700d7333700d7bbb700d7777700d7878700d7777700d677760","04444444044444440999999a021212140616161607070707076767670dddddd6","60888806068ff860888ff888861ff168f57ff57fff0440fff0e00e0f0f0ee0f0",
	"007777000777777007c77c700777777007788770077777700777777007077070","111111111ee11ee1e89eec2ee89abc2ee89abc2e1e9abce111eabe11111ee111","0000000007770080777778887070708070707080777770800777000007770000","5888888588888888a888888aad4884da8dd88dd8888dd8888dd11dd858dddd85","78888887888888888558855885f55f58857ff75885ffff58885ff588785ff587","000dddc000dd0d0000dddddc088ddddc88c444008dca9ac008d99900d0c00c00","00777f0007777ff007070ff007070ff007887ff007777ff006776ff566666665","6666666666666666666666666666666666666666666666666666666666666666","bcbcbcbccbcbcbcbbcbcbcbccbcbcbcbbcbcbcbccbcbcbcbbcbcbcbccbcbcbcb","6677776676666667666666666ffaaff66cffffc66ffffff6a6f77f6aa6ffff6a","ccc99ccccc9999ccc999999cc999999cc888888c99999999cccccccccccccccc","099990009999990099fff0009ff0f0009fffff009ff880009fff00000fff0000","00011000000110000111f140011f0f01000fff4010011100017182d000aa0440",
	"000aaa70000aaaaa004f40f0004ff44f0004fff00aa8cce070cccc02004000d0","00000770000999790000909007709909aaa9977700a922700004404000000000","8a8a8a8aa8a8a8a88a8a8a8aa8a8a8a88a8a8a8aa8a8a8a88a8a8a8aa8a8a8a8","bb8888bbb888888bbb8888bbbb8888bbbbb88bbbb33ee33bbbbeebbbbbbeebbb","00070aa0440a7aa040a70700400a78a009047740009a77000007007000440044","3636363663636363363636366363636336363636636363633636363663636363","000cca0000a77700000707000009999000cc800077c72d400776600099099900","777117775777777517077071722222272ffffff22f0ff0f22ffffff272222227","7000000700777700071771700779977000777700007777000777777009977990","044444404444444400a44a000aaaaaa0a0aaaa0aaaaaaaaaaaa77aaa0aaaaaa0","0000000003300330333333303370370033333330d3444440d3333300dddddd00","000cc000000cc000c000000cc0ffff0cc08ff80ccffffffccff77ffcccaaaacc","0055550005ffff50550ff05555ffff5505f00f5005f77f50005ff500005ff500",
	"7070707007070707707070700707070770707070070707077070707007070707","888eee0099988e00aaa998ee333aa98eccc3a98eddcc3a9800dc3a9800dc3a98","0050050000455400055555500505505005055050055005500555555505050550","0099999009fffff90f77f77f0f7ef7ef0fff9fff00fffff000f888f00aafffaa","bccccccbccccccccb000000b77777777770770777799997799999999bbbccbbb","788aa887888aa88888aaaa88008aa80007788770808888088884488878888887","e0e00ee0eee0000eaea000ee7d7eeeee0eeeeeee0eee0e0ee0e00e0ee0e0e00e","00aaaa000aa00aa0aa0aa0aaaaaaaaaaaa0aa0aaaa0aa0aa0aaaaaa000aaaa00","1111111113311331333333313361361133333331234444412333331122222211","707777077a7777a77aaaaaa7aaaaaaaaaa0aa0aaa8aaaa8aaaaaaaaa7aaaaaa7","ddccccddccccccccd777777dd707707dd709907dd799997dd999999dddd88ddd","77777aa778888aa778888aa7788887777888877770077777a0077118a7700118","00a0a0a00aaaaaaaaaaaaaaaa56675111ffffff1ffcffcffafcffcf104ffff40",
	"c0c00cc0ccc0000c8c8000cc797ccccc0ccccccc0ccc0c0cc0c00c0cc0c0c00c","00000000ccc0c00c00c0c0c0ccc0cc00c00cccccccc0cc0000c0c0c0ccc0cc0c","aaa8aaaaaa88888aa8aaa8aaa000000aa0a00a0aa000000aa0aaaaaaa000000a","9979799997777799997999799977779999799979977777999979799999999999","1cccccc1cccccccc1000000177777777770770777799997799999999111cc111","a0a00aa0aaa0000acac000aaf5faaaaa0aaaaaaa0aaa0a0aa0a00a0aa0a0a00a","0005000000555000055555000755570005777500005550000005000000000000","8880088888888888088888800ffffff0ff0ff0ffff0ff0ffaff00ffafff00fff","666666666777777667ccc17667c3bb766798ea76666776666777777666666666","0666666006777760067777600677776006666660006666000555555007777770","8888888888aa8aa888a8a8a888a8a8a88aa8a8aa8a88a88a8a88888a8a88888a","6888888688888888008888000008800007000070000000000008800068888886","7000000700000000030300303003300337333373333773333330033333333333",
	"7bbbbbb7bbbbbbbbbfbbfffbfbffffbff0bffb0ffffffffff80000807f8888f7","70777707700770077000000777b007b770000007700ee0077000000777777777","77777777777777778888888899999999aaaaaaaabbbbbbbbcccccccc77777777","044444404ffffff4470ff7044ffffff404ff9ff004ffff7004777770444ff444","41b41b4184344811148b14b1b3444b81141434111b841b411114181133443333","888ff888888ff888828ff828828ff828888ee888818ee818f1ffff1ff111111f","0090900009999900009900900099990000990090009900900999990000909000","0110000100a90009000aaaa9990a0aa09908aaa9090a999009a9a9a000a9ff90","82ef194794084b74f05d37b92d5e73413c46ed8fa964550e169cd04261a32f98","9090099099900009c0c000996369999909999999099909099090090990909009","6bbbbbb6bb0000bbb003300bb7f00f7bb0ffff0bbffffffbbff33ffbb6ffff6b","6060066066600006a0a000663136666606666666066606066060060660606006","101001101110000181800011cac1111101111111011101011010010110101001",
	"00088270008822000777666006eeeed0f72fe26ef7f76e6e067e26d000f76d00","00bb0bb00bbb3bbb0bbb3bbb0033b3300bbb3bbb0bbb3bbb30bb0bb030000000","e0e00ee0eee0000eaea000ee7c7eeeee0eeeeeee0eee0e0ee0e00e0ee0e0e00e","111111111eeeeee11ebbbbe11ebccbe11ebccbe11ebbbbe11eeeeee111111111","77aa77777aaaaaa77affffa77f0ff0f77ffffff77fa00af777aaaa77111ff111","759f7957575f7575957f7759ffff77777777ffff9577f7595757f5757597f957","000000000bb00bb0bb77b770bb70b700bbbbbbb01b4444401bbbbb0011111100","6dd6666d66a96669666aaaa9996a0aa09968aaa9696a999669a9a9a666a98896","00aaa9000aaaaa90aa0aa0a9aa0aa0a9aaaaaaa9a0aaaaa90a00009000aaaa00","11111111161111611761167117b66b7117370371199909911599995111555511","7770808007088888070088807770080090090909990900909099009090090090","03bbbb303b7bb0b3b3bbbb3bb70bb70bb30bb03b0bbbbbb000b33b00000bb003","fffffffffaffffaffaaaaaafaaaaaaaaaa0aa0aaa8aaaa8aaaaaaaaafaaaaaaf",
	"0000000003300330333333303370370033333330c3999990c3333300cccccc00","7772277757777775270770727eeeeee7effffffeefeffefeeffffffe7eeeeee7","eeeeeeee222882222a2882a22228822288800888808888088800008888888888","6666bbb6666b0bbb666bbbbba66bb8866b6baa6b6b6bbaa666bb4446666b8698","0000000000555000055555000555555005555550055555500555550000555500","7700007770778807077888800888878000000000707777077077770777000077","0000000006000006606000606060660006660000606066006060006006000006","0003003000053770030330f03003ffff37373930333399906006006033033033","facbe8c0facbe8c0facbe8c0facbe8c0facbe8c0facbe8c0facbe8c0facbe8c0","7600000067600000067600400067509000056590000059200049928200000028","00aaaa000a7aa7a00a0990a00a9999a0a0a99a0a0aa99aa000aaaa000aaaaaa0","eecccceecccccccce777777ee707707ee709907ee799997ee999999eeee22eee","00ffff005ffffff05f2f0ff05f2f0ff05f99fff05ffffff05ffffffd6666666d",
	"ceddddeccceeeeccc1cccc1c1f1111f117b11b71111111111ff88ff100ffff00","cc0000ccc088880c08888880008008000707707007000070c077770ccc0770cc","00fff4000ffff4400f0f04400f0f04400f88f4400ffff44006ff644555555555","008008000a8aaaa0a0800800a08008000aaaa8a00080080a0080080a0aaaaaa0","7cccccc7cc7777cccccc7cccc0cccc0c077cc77000cccc000cc77cc070cccc07","0bb0bb00bbb3bbb0bbb3bbb0033b3300bbb3bbb0bbb3bbb00bb0bb0000000003","74444447444444f444fffff40000000007700770000ff000fff77fff7ffffff7","000cc01000c0cc00ccc0c11100cc11100000f10000ff110f011100f000110000","00800800aa8aaaa0a080080aa080080aaaaaa8a0a080080aa080080aaa8aaaa0","63b3646733bb36463f0f07477ffff64633bbb3f073bbb6466111174770760476","051282105128a811128a988228aaaaa88aaaaa822889a821118a821505182150","a99999999999909a900490999999999994999949994224999998899999988999","0333330033333333383383333333333333707073300000033707070333333333",
	"000aaa0000a999a00a90009a0a0099a00009aa000009a0000009a00000088000","0d777d00677777607767767d767007076d6007070677707d006d776000006770","ccc8cccccc888ccc007770000777770017717710117171100199910008998800","44444444444444444ffffff4fffffffff7cffc7ffff44fffff4ff4ffff4444ff","99999999999ee999aaaeeaaaaaa44aaaaaa44aaaccc44ccccc4444cccc4444cc","0dccccd0dc7ccccdcdccccdccf0ccf0ccd0cc0c00cccccc000c11c00000cc000","9b999999990990999909909999999999907777099400004999477499999aa999","000bbb3001cc0c0000bbbbb304bbbdb3443444004b3a9a3004b9990000b00300","0008886000088888004f40f0004ff44f0004fff0088acca060cccc1d00400020","55cccc55cccccccc577777755707707557099075579999755999999555588555","0088620008666d0006070000998fff0086999228808820000660dd0088202220","00aaaa000aaaaaa9aa0aa0a9aa0aa0a9aaaaaaa9aa0000a90aaaaaa000aaaa00","5556666555566655665665660756557055555555557777555706607557655675",
	"03bbbb30330bb033b3bbbb3bb70bb70bb30bb03b0bbbbbb000b33bb0000bb000","a0a00aa0aaa0000acac000aafbfaaaaa0aaaaaaa0aaa0a0aa0a00a0aa0a0a00a","7000000700000033030300033003300337333373333773333330033333333333","d88aa8ed888aa88e88aaaa8e002aa200077007708088880888822888d888888d","0008880000088888004f40f0004ff44f0004fff0088acc9000cccc1500400020","00aa90000aafe000769fe00057fccccc06676600044420007770766044000042","0b0000000bd330003b3636100bd3330343f31ff3f5f22f00ff4224f003301300","0d110000d1fe100011fe1000076655510777fe000d6600000777d000d7776d00","8888888880000008800000088000000880000008800000088000000888888888","000444000044f200065ff00061561055f55656f0021110000210110051001500","0000420000044f100064422005262000044411410244d0002410110044201220","000cd0000067150000cc810006d66d5007677cd00cd77c10065d6150076505d0","00aa000000aa00000aaa4000a09a94000a051400000a900000a9000000aa9000",
	"001100000011d000005510010101211110511100100588881011000000500100","088888880f1111110dc1cd1cffdccdcd0ffddfe007fffee00277670001101100","aa977f74aaac7fc900fffff00004e000000fee0000ff70000000700000eee220","bbb88bbbbb8ee8bbb8eeee8b8eeeeee88eeeeee88ee88ee8b88bb88bbbbbbbbb","0c77777c0c7c7c7c0c77777c0c7ccc7c077ccc770c7ccc7c0c77777c0ccc3ccc","4449944444999944499999949909909999999999999999990970079000077000","0700007070700707007777000700007070700707707007077000000707777770","0877700088888888b1616160b371716000777700075500000788700000660000","050000500f0ef0f00feffffe0e0e0fe00ff2fffe0effffe000ffff2e007007e0","0677600067777600757757507577575077577750077774560044456007676770","0007006000078880d008f0f3d008ffff78278d2088288820700700d088088022","6000000600077000000770000f0000f007f00f70000ff00000f77f0060ffff06","0775577000000000000000000000000007700770000000000ff77ff070ffff07",
	"033b03bb3b1bbb1b3b1bbb1b3b1bbb1b37bbbbb76b11111b67777770033b033b","0000000007577750777171707771717577577775000cc000007cc60000076000","61111116100aa0011aa88aa11ffffff11cffffc10ffffff00ff88ff010ffff01","5553b5555bb3bbb5bbb3bbbb00bbbb00370330733bbbbbb33bb77bb363beeb36","0888998000999f9000f70f7000f0efe0009fff0009fee4000007600000011000","0acaaac0aa9aafa900f70f7000f0cfc0000fff0000fcc4000007600000011000","0001110011111f1011f70f7001f0bfb0000fff0000fbb4000007600000011000","00000f000000ff00008c898088ccc8c022f2cc1402228200000cd1d000080080","00001f000000ff00008c898088ccc8c022f2cc1402228200000cd1d000080080","00ddd0000ddfdf00ddf2f2f00ff2f2f000ffff00000990000004400000066000","cc9cec9cca9eee9ca9a9aaa999aaf99a9aa0f0faa9f0f0fc99fffffc9aff8ffc","0000a28800888a880a0288ff0f088720000aa00f00288880922008000000a000","0001110003b1bb00bb33b700bb333310bbb331330bb21033022011000bb03330",
	"0008a9000008a9000000880000a8c29008088202070a02070c08090c01000201","00088200cc878711801882028012210200c2100000c111dd0080002000800200","00010100000111000001ff0001dd11501d1dd5511501a901101d115000500010","03333000703770002278820720277020002ce000022920000210120005000050","0001110000014400551144005878200057761585937789005999960005501100","000111000001ff005511ff005843200054421535934439005999920005501100","000aaaa0000aff00551aff0058be20005bb315e593bbe9005999930005501100","000999000009ff005519ff0058f420005ff4154593ff49005999940005501100","000bb00000b8b8000b0776000b000300b3b88833b13b88030033880003310000","8778777778877887788878877888787778887788788878777887788787787887","7755557757700775507777055007700555555555500000055007700575000057","0880088078008888e88808888880888808880880008088000008800000000000","0067770006760060677000067770000077700000677600060677776000666600",
	"0006a0000009900007a44aa07887a88aa886a88a944aa449094994909aa6aaa9","778888777788878777f1f17777ff4477f818818f771111777711117777477477","0077cc0003c3cc6033333cc73333ccccc3cccccccc3c333c0ccc333000ccc300","aa0000aaaaa00aaa02222220fff82fff099829900ff82ff00ff82ff00ff82ff0","0000088800888888008880080080000800800888008008808880000088000000","000b3000003b310000b3330003bb33100b3333303bbb33310009400000494400","00ac8a000aaaaaa00aa1f1a00fff9fa07eeeeee70aeece0000eeee0008888880","c88888cc7c7777cccc9090cccc9fffccc388883cc388883ccf8888fc444cc444","0000220020000020005550000555550277555770577577500522250000555000","00011000000110000111f120011f0f01000fff20c0011100017198d000aa0aa0","dccddddcdda9ddd9dddaaaa999da0aa099d8aaa9d9da999dd9a9a9addda9449d","00877700088788708877887777787777070f077000ffff000f7ff7f000788700","33337757733337577a0f07577ffef757333333f1733337177222277774774777",
	"6664466666444466644444464f0000f44f0440f46444444640ffff66040f0006","00000000000000000000000000ccccc00aaaaaa6060060600000000000000000","00cc000800cc000833cc377800cca77800cca77800cca778aaaaaaa8aaaaaaa8","55555555544aa445544aa4455aa44aa55aa44aa5544aa445544aa44555555555","0000000000e807600e7e767608e8777600887760000876000000600000000000","aaa00aaa0010010000700700000000000010010000011000aaa00aaaaaa00aaa","0444440004aaaa0004a7f7000aa4440004aaaa0033ee4e00a333339005501100","6776776667067066686686666866866688888688880088808888868886868666","00000000099900000a999000a0a99aa0aaa99aaa0999aaaa00aaa0aaaaaa0aa0","0066000006666660606666666666666667766666606606666066066060760760","04a00000404a0000444444404044444a0044444a000400400040000400040040","0009990009977000909000009999999009999999000799990099009909909990","0077770007777770777707777777007777007777777077770777777000777700",
	"00090900000c98000aafaaa0aaff1f190acffff1aaee8890ae877d7008888880","0090900009999900009009900099990000900990009009900999990000909000","dd11111dd1fff111d1ffff11d10f0f11d1fffff1d1feff11d11ff111d0ffff01","6cc6666c66a96669666aaaa9996a0aa09968aaa9696a999669a9a9a666a94496","7670767767f07f776f105176d000000f600000f77600017767800f6666600666","5cc5555c55a95559555aaaa9995a0aa09958aaa9595a999559a9a9a555a94495","222222422444442220ff04222ffff422f8888f22288884222eeee4222f22f442","999999999eeeee99eeeefee9ef1ff1e9eeffffe9eeccce999977799999898999","000701001007000000f76705577777711777771001777f0000a7710000077000","ceeccccecca9ccc9cccaaaa999ca0aa099c8aaa9c9ca999cc9a9a9accca9449c","000aa000000af0000077c9000077790000707700000fcc00000cc00000099200","000e800000887800000230000022b2f0002722000000ee000007f0000007f000","00022000000270000009900000999900007494f0000880000007f00000042000",
	"000440000004700000037000007b3000007bbf00007bbf000008200000082000","000042000000440000004110000044400101c50001024a000012420000244240","0011110000177700007fff00007fff0007ccccf00759c5f00f95c9f000774f00","0000000000aaaa0000a77700007fff000f44f4f0074111f00f4444f000774f00","088088000888ff000008ff000000f000000f770000f776f000077000000ff000","000c11000011ff000001ff000000f000000fcc0000fccf00000cc000000ff000","0000870000008ff000002ff00000cd0028101800008081810081888000288181","00099000709ff900079ff9000ffc8c4094cffd29f02442040ff02f4004402420","000ccd0000ccffd000cc42d009b99940043b94300f244402003b032000990440","08988000088ff000008ff00000999000070796000f76940000ff400000882000","0dddd02400daa0560ddaa1051cd11dccccdccdc1c01dd1050ccddcd50dd01d15","00000bb00b00e2200300b770003b700eb0eeeeb0bb3ae2003bbe273003bb77b3","00099990099fff00099f7f7000fffff0000f77000088f2000ff8724000ccdd00",
	"0221222022222772220f27722200fee0020f7f700033676400f1111f00055150","7cc7777c77a97779777aaaa9997a0aa09978aaa9797a999779a9a9a777a94497","000d666000d6717600ddddd000dd77700d66666011ddddd1dd11011d00dd0dd0","0066d0000117f10000fff000066fe0006d66dd0044dd71204d66dd400cc1c100","00994000009ff000094ff40000282000028762000f28240000b0300000802000","7949940000977000094998900049999000280000009990000949940000949000","fccffffcffa9fff9fffaaaa999fa0aa099f8aaa9f9fa999ff9a9a9afffa9449f","00111100011f1f10011f7f7001fffff00eeffff0f0eeaaef00ccccc000e000e0","0006660000666d6006666d766666ddd606d5d2506dd5555d0611551100770066","0011110001111110011777108814441288eee822100111010122011000200100","0ff770000ff7770000f7700000070000077bb70000666600000e200000070000","00888000088998000087780009cccc0070119140700c8c400049490000cc1c00","000dd000006ddd00000666000dc6d100d01c6c10d0018110001d1d0000cc1c00",
	"0079940000779f0000077f00073984008033c320800ccc2000d7570000cc1c00","00aa90000aa9400000a77000078f200070288400702820f00092400000802000","000aa900000d1100000a690004a974920a065d09007aa960000a090000070600","000ccd00000d1100000c6d000dcd71d10c065d0d007ccd60000c0d0000070600","000bb300000d1100000b630003aa79910b069d03007bb360000b030000070600","00088200000d1100000862000282712108065d02007882600008020000070600","00055100000d1100000561000151711105065d01007551600005010000070600","000ee800000d1100000e680002e872810e065d08007eee600008080000070600","00d68600d6d767d667ccacc71d49c91d672818d71d6aea6d0176167002882880","7ab7ab37b0aab033baaaab3330880003738833377bbbbb377b33b3b3ab7ab3b3","cc000cccc07770ccc070799cc07770ccc07770ccc07770ccc07770cccc99c99c","999779999a9779a9999999997909909709099090999999990064460079666697","000424000004f4f0004f0780004ff77000089f60048989820044ff2002440222",
	"0014110002222222024f0710004ff77000066fd00411161200444f2002440222","0ecc99e00e9ff9e0009f0f00099fffe099ddfd009f922f0009ddd00000d01000","0e2cce000e244e000088280006ffff0066dff110666331d0466331d004402400","0051d10000516100882cc8c2602888858216dd62510511510011011001dd01d5","009aaa00009a6a00d1daaaa111d9aa91491ccc149a011149009a0490097a049d","005d6d0050d6d6005677277d1d8666215601115d11561d01501101100576056d","00d0050000ddd500117d17110dddd550ddd56155dd5656150d6666500dd66d50","0a91874900aa1190000166000168882060d176d180071d02001d011000d80120","440040000044a00100fffff0004490000404f000044f02202042000004422000","0dcd011000dc010000cc0990000c0c000011dc00000dc1000000900000099400","0ed052000edada000dd7160000dd60000dd6d50070d6606000d5d0006d706000","000000000ee40e000e4444000ee471000004ff00204240000429920000242000","0001111000447700044ff190424f7790444f8892002f7700224f940004400240",
	"666d0000006600000077799000d6d0d30d077dd0076770000060d00007706600","0001709000499940000600000011100001011100011110000042000009944000","a93bb000a4b00300a3b7070000bb0300008220990708226000bb300007706600","00001100000678700000660000001d0000011700000716d00d11110000067dd0","00000000000000000000000000aaa00000aca00000aa9000000a000000994000","0009aa000009f9000009f9000022288000f2d1f0001f11000218200021022000","000011100000ff106d10ff1001fcd8c0000dc8df00cc222c0001101100010001","01110000011f000000ff000d08888dd588672000f2552220851552000d00d000","00011100000f110000088c0000e8e8800f212204811288002821120000012800","008880000e822800082ff20002fff00f28822870087f82600171100005000500","008aaa8000aaff9000aeff0007ccec60087888207cccccc60aefef900a282890","000444000434ff40044eff0007bbeb60037eee307bbbbbb604efef00003b3b00","000333000033ff30003eff0007dded600d7cccd07dddddd600efef00001d1d00",
	"000111000011ff10001eff000788e860027222107888888601efef1001282810","0088aa0000aaffa00aaeff00a799e960a471114a799999960aefefa000494900","0018100001111100088888000f0f0f0008fff800248884208442448001111100","03bbb3000b333b00bb333bb0bf0f0fb003fff30049333940b99499b001333100","00caac000cccccc00aaaaaa00f0ff0f00effffe0888ee888f888288f02444420","009990000924290092fff290920f049094fff490094249002994992001222100","00a6700000a78770007aff4006677f007f0862660006f7700887728007000007","0b3bb0000abb8bb000aaff10063bbf00bf1333b7001ddf330ddbb1d00b01010b","007aa7600a77a76000a7ffa0076a7f007f066677000cf7700cc771c007000007","000e7e70006e37300e6eff300e367feeef33e2ee060efe200bbb63b00e00600e","000691900077998001174400066d7f00ef19696600011fe2011ee1100e02020e","0a0222009a92ff209192ff00092644000f4277202122d6f2212667d201676760","0000000000000000000000000007700000077000000000000000000000000000",
	"0000000000000000000000000008800000088000000000000000000000000000","7f7f7f7ff7f7f7f77f7f7f7ff7f7f7f77f7f7f7ff7f7f7f77f7f7f7ff7f7f7f7","9999999999999999999999999999999999999999999999999999999999999999","7776577777665577766505577555000777750777766775577766557777765777","7700007770077007707777077070770777707007770000777707777770078777","ddddddddd777dddd77d7d77d7ddd7d7777d7ddd7d77d7d77dddd777ddddddddd","9988889990999909900990098997779887700078877707788777077888776788","000000000666666006c66c6006c66c6006666660066cc6600666666000000000","00bbb0000bbbbb000b5b5b000bbbb77000bb76670bb077770000077000007000","008888000800008090000000900000009000ccccb000000c0b0000c000bbbb00","8888aaaa8000a00a8000a00a8000aaaa8888000a8008000a8008000a8888aaaa","000000700000067000006670aa06670000a60000044a0000440a00000aa00000","00000000000f0000000f0000000f000000ffff000fffff000fffff00000ff000",
	"00c33bb002cc330000000000022cc3000022cc300000000000822cc008882200","aecccccaaecaaacaaecaaacaaecccccaaeeeeecaaeaaaecaaeaaaecaaeeeeeca","3333333333333333333333333333333333333333333333333333333333333333","2222222222222222222222222222222222222222222222222222222222222222","0000000008880080080008800888008008000080080000800800088800000000","0dd0000d00a90009000aaaa9990a0aa09908aaaa0900999009a9a9a000a94490","00aaaa000aaaaaa9aa0aa0aaaa0aa0aaaaaaaaaaaa0000a90aaaaaa000aaaa00","00600bbb06000bbb006bbbbb060007ff0060ffff06000fff008444ff00000fff","f0ffff0ffaffffaffaaaaaafaaaaaaaaaa0aa0aaa8aaaa8aaaaaaaaafaaaaaaf","00600ccc06000ccc006ccccc060007ff0060ffff06000fff008444ff00000fff","00001f000000ff00008c898088ccc8c022f2cc1402228200000cd5d000080080","000cc60000577700000717000009999900cc800077c7d1d00776600099044400","0000000000777700071771700774477000777700007777000777777004477440",
	"76977c776797c711797c717797c7177e9c717ee7c117ee7bc1ae7bb6eeeab767","01000010010110100111111016c66c6111555511115555110155551001055010","cc0000ccc0edde0c0edddde000d00d000707707007700770c077770ccc0000cc","3b33b33b3aa88aabbac9c9a338988c8338c8898bba9c9ca33aa88aa33b33b33b","3bb33bb3baa99aabbac8c8ab39899c9339c99893ba8c8cabbaa99aab3bb33bb3","8888888888887888888777888877788887778878777887778888888888888888","0707070770707070070707077070707007070707707070700707070770707070","0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","00aaaa000aaaaaa0aa0aa0aaaaaaaaaaa0aaaa0aaa0000aa0aaaaaa000aaaa00","4444444444444444444444444444444444444444444444444444444444444444","5555555555555555555555555555555555555555555555555555555555555555","1111111111111111111111111111111111111111111111111111111111111111","ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
	"dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd","0550055055555555588668855666666556666665560000650660066000666600","a000000aaa0aa0aaaaaaaaaa0ac66ca00a6666a0aa6006aaaa6666aa00066000","008888000886688008688680a8c66c8aa866668aa860068aaa6666aa0a9999a0","600000066022220662000026200aa002200aa002020000200022220000000000","1010010110111101111111111888888168877886677777766777777600777700","44444444fffffff4f07f07f4f77f77f4ffffffffff77ffffff00fff40ffffff0","cccc7ccccccc77ccccc7777ccc77777ccccc77cccccc7cccc7777777cc77777c","66ccccc666cccccc66666666cc6cccc6cc6cccc66666666666cc666666cc6666","00011000000110000111f120011f0f01000fff2030011000013198d000aa0aa0","776c676c3333777cbbb3c888b3b3c8a8b4b3c888c4ccccbcb4bbbbbb44444444","01000010011771100711117077c11c7777dddd7777dddd7777d00d7707dddd70","0800008088888888882222888211112887211278822888888ff77ff80ffffff0",
	"8888887787777788877777888778887787788877877888888777778888888888","08bc444048bc444448bc444448b77444ff7007ffff0060fffff00fff0ffffff0","0999999099997799999979799977779997977979977777799977779909999990","0dddddd0dddddddddd7dd7ddd777777dd7d77d7dd777777ddd7dd7dd0dddddd0","0000000000c7778000c777780c777800c7707800c77078000c77700000000000","0aaaaaa0aaa00aaaaa0770aaaa0770aaaa0770aaa070070aaa0aa0aa0aaaaaa0","0cccccc0cccc77ccc77c777ccc7777ccc7c777cccc777ccccc77cccc0cccccc0","0111111011111111111177711111771111177771111177111111771101111110","0bbbbbb0b7bb777bb7bb7b7bb77b7bbbbb7bb77bbb7777bbbbb77bbb0bbbbbb0","000000000ff0ff00eefffee0eef0fee0efffffe00fffff000ff0ff000ff0ff00","00070000000000000000e0000000f0000000f0000000f000000fff0000000000","00bbbb000bbbbbb0bbbbbbbbbb4444bb00044000000440000004400004444440","000000000fffff00eef0fee0eefffee0efffffe00ff0ff000ff0ff000ff0ff00",
	"0ffffff0ffffffffffffffffffeeefffffe8efffffeeefffffffffff0ffffff0","0ffffff0fffffffffffffffffffeeefffffe8efffffeeeffffffffff0ffffff0","0000000000fffff00eef0fee0eefffee0efffffe00ff0ff000ff0ff000ff0ff0","cc7777ccc777070c77777700777770007770000077000000c707000ccc0000cc","1111111110111101100000011000000110000001100000010070070000000000","eeeeeeeee000500ee077577ee072727ee077077ee078887ee077777eeeeeeeee","0ff0000f00a90009000aaaa9000a0aa09908aaa89900999009a9a9a000a94490","0bb00bb0bb77b770bb70b700bbbbbbb05b4444405bbbbb005555550000000000","11cccc11cccccccc177777711707707117099071179999711999999111188111","03bbbb303b7bb0b3b3bbbb3b370bb70bb30bb03b0bbbbbb000b33b00000bb000","70000007000000bb0b0b000bb00bb00bb7bbbb7bbbb77bbbbbb00bbbbbbbbbbb","cc1110ccc111110ccc070dccc9976dcccc8822cc46778655c71786dc677766d6","ccfffcc0cfffffc0ff0f0ff0efffffe0f8f2f8f00f888f0000fff00000000000",
	"00033030003333330037070303333336033333063344996633333000ccccc000","0800008099800809909880099009800990089009900889099008809900000000","0900000009008000090808000980008009800080099898990080008000800080","ccccccc80ccccc08077777087717177877171770799999709499949009444900","0000000000040000000400000004000000444400044444000444440000044000","cccccccccccccccc0000aaa000cca7a08aaaaaa806006060bbbbbbbbbbbbbbbb","00600eee06000eee006eeeee060007ff0060ffff06000fff008444ff00000fff","0088880008877780087e7e800087870007999900708888708099990800800800","0cccc000c77c7100c7787600c7777600088a8800cc777c707c777c0007700700","00003300000330000493999049a9a99949a9a999499999a94a9a9a9904a9a990","0000330000033000004999000409099004090990049099900409090000000000","d1111ddddd1010dddd1199dddd1177dddd1177dddd1177dddd1177dddd9dd9dd","00aaa90000a7a70000aff40000aff400007776000a77769000ccc10000c00100",
	"11111111115115111155551100a5a50010555001110550111111010111111111","0000000000bbbb00bbbbbbbbfb07b07fbbb33bbb0bbbebb000bbbb000ffffff0","33bb330333b88000338808033880808bb808088bb88088b3bb8883b33b33b3b3","550000555650056556600665065555600705705005500550055005500055e500","0018100008888800808980800800080000888000088888808088880800888800","8000000808000080008008000008800000088000008008000800008080000008","6000000606000060006006000006600000066000006006000600006060000006","7000000707000070007007000007700000077000007007000700007070000007"
];
