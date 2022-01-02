(function () {
	angular.module('App')
		.service('coreContract', coreContract);

	coreContract.$inject = ['$q', 'web3Service'];
	function coreContract($q, web3Service) {
		const _contractPath = 'contracts/PixelCons.json';
		const _networkIndex = 0;
		const _maxFilterParamSize = 100;
		const _maxQueryParamSize = 100;
		const _defaultGasParameters = {};

		const _noAccountError = 'No Account';
		const _accountPrivateError = 'Account Not Connected';
		const _notEnabledError = 'No Network Connection';
		const _notConnectedError = 'Network Provider Not Connected';
		const _unknownError = 'Unknown Error';
		const _invalidIdError = 'Invalid ID';
		const _invalidIndexError = 'Invalid Index';
		const _invalidAddressError = 'Invalid Address';
		const _duplicateTransactionError = 'Duplicate Transaction Already Processing';
		const _verificationError = 'Something went wrong while verifying';

		// Setup functions
		this.getTotalInvaders = getTotalInvaders;
		this.getMaxInvaders = getMaxInvaders;
		this.fetchAllInvaders = fetchAllInvaders;
		this.fetchInvader = fetchInvader;
		this.verifyMintInvader = verifyMintInvader;
		this.verifyTransferInvader = verifyTransferInvader;
		this.mintInvader = mintInvader;
		this.transferInvader = transferInvader;
		this.formatInvaderId = formatInvaderId;
		this.getAccountPixelcons = getAccountPixelcons;
		this.getPixelconsForSale = getPixelconsForSale;

		// Transaction type/description
		var _mintTypeDescription = ["Uncover Invader", "Uncovering Invader..."];
		var _transferTypeDescription = ["Transfer PixelCon", "Sending PixelCon..."];

		// Init
		web3Service.addTransactionDataTransformer(addInvaderDataForTransaction);
		web3Service.registerContractService('coreContract', this);


		///////////
		// Query //
		///////////


		// Gets the number of invaders currently in existence
		function getTotalInvaders() {
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else {
					try {
						let chainId = web3Service.getMainNetwork(_networkIndex).chainId;
						let contract = await web3Service.getContract(_contractPath, chainId);
						
						//TODO
						//let total = (await contract.errRetry.totalSupply()).toNumber();
						resolve(1000);
						
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while getting total');
					}
				}
			});
		}
		
		// Gets the maximum number of invaders that can exist
		function getMaxInvaders() {
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else {
					try {
						let chainId = web3Service.getMainNetwork(_networkIndex).chainId;
						let contract = await web3Service.getContract(_contractPath, chainId);
						
						//TODO
						//let total = (await contract.errRetry.totalSupply()).toNumber();
						resolve(1000);
						
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while getting supply max');
					}
				}
			});
		}
		
		// Gets list of all invaders
		function fetchAllInvaders() {
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else {
					try {
						let chainId = web3Service.getMainNetwork(_networkIndex).chainId;
						let contract = await web3Service.getContract(_contractPath, chainId);
						
						//TODO
						//let total = (await contract.errRetry.totalSupply()).toNumber();
						resolve(JSON.parse(JSON.stringify(getInvaders())));
						
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while fetching Invaders');
					}
				}
			});
		}

		// Gets the details for the given invader id
		function fetchInvader(index) {
			index = formatInvaderIndex(index);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (index === null) reject(_invalidIndexError);
				else {
					try {
						let chainId = web3Service.getMainNetwork(_networkIndex).chainId;
						let contract = await web3Service.getContract(_contractPath, chainId);
						
						//TODO
						//let total = (await contract.errRetry.totalSupply()).toNumber();
						await sleep(1000);
						resolve(JSON.parse(JSON.stringify(getInvader(index))));
						
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while fetching Invader');
					}
				}
			});
		}
		
		// Gets pixelcon and related data for the given account
		async function getAccountPixelcons(account) {
			await sleep(1000);
			let testData = [{
				id: '0xccccccc6ccbbb3676b8bb31773bb3816763311ccccc42cccb8b9413b33333333'
			},{
				id: '0x0008887000088888004f40f0004ff44f0004fff0088acc9070cccc1d00400020'
			},{
				id: '0x0110000100a90009000aaaa9990a0aa09908aaa9090a999009a9a9a000a94490'
			},{
				id: '0x88888888899944488cc7112889994448ecc7112ef999444fd9c94141dddddddd'
			},{
				id: '0x000bb00000b8b8000b0776000b000300b3b88833b13b88030033880003310000'
			}];
			for(let i=0; i<testData.length; i++) {
				testData[i].invaders = [];
				let count = i > 1 ? 2 : 3;
				for(let j=0; j<count; j++) {
					let invader = generateInvader();
					invader.mintIndex = j;
					testData[i].invaders.push(invader);
				}
			}
			return testData;
		}
		
		// Gets list of pixelcons for sale and their mintable invaders
		async function getPixelconsForSale() {
			await sleep(2000);
			let testData = [{
				id: '0x0d0000d00dd00de00dddddd00d0d0dd0117e71100d777dd0001edd1001ddddd1',
				priceUSD: 0.11,
				price: 0.11,
				unit: 'Ξ',
				invaders: [null,null]
			},{
				id: '0x00999900099999909949090499499f229909ffff0044ffff049940e0499ff400',
				priceUSD: 0.21,
				price: 0.21,
				unit: 'Ξ',
				invaders: [null,null,null,null]
			},{
				id: '0x03bbbb303b7bbbb3b3bbbb3bb70bb70bb30bb03b0bbbbbb000b33b00000bb000',
				priceUSD: 0.43,
				price: 0.43,
				unit: 'Ξ',
				invaders: [null,null,null]
			},{
				id: '0x0d777d00677777607767767d767007076d6007070677707d000d776000006770',
				priceUSD: 0.632,
				price: 0.632,
				unit: 'Ξ',
				invaders: [null,null,null,null]
			},{
				id: '0x0777776007bbb7d0073337d007bbb7d0077777d0078787d0077777d0067776d0',
				priceUSD: 1.1,
				price: 1.1,
				unit: 'Ξ',
				invaders: [null,null,null,null,null,null]
			},{
				id: '0x00028000028880000027770004970700004977700002877000028777000d7777',
				priceUSD: 2.184,
				price: 2.184,
				unit: 'Ξ',
				invaders: [null,null,null,null,null]
			},{
				id: '0x0d0000d00dd00de00dddddd00d0d0dd0117e71100d777dd0001edd1001ddddd1',
				priceUSD: 0.11,
				price: 0.11,
				unit: 'Ξ',
				invaders: [null,null]
			},{
				id: '0x00999900099999909949090499499f229909ffff0044ffff049940e0499ff400',
				priceUSD: 0.21,
				price: 0.21,
				unit: 'Ξ',
				invaders: [null,null,null,null]
			},{
				id: '0x03bbbb303b7bbbb3b3bbbb3bb70bb70bb30bb03b0bbbbbb000b33b00000bb000',
				priceUSD: 0.43,
				price: 0.43,
				unit: 'Ξ',
				invaders: [null,null,null]
			},{
				id: '0x0d777d00677777607767767d767007076d6007070677707d000d776000006770',
				priceUSD: 0.632,
				price: 0.632,
				unit: 'Ξ',
				invaders: [null,null,null,null]
			},{
				id: '0x0777776007bbb7d0073337d007bbb7d0077777d0078787d0077777d0067776d0',
				priceUSD: 1.1,
				price: 1.1,
				unit: 'Ξ',
				invaders: [null,null,null,null,null,null]
			},{
				id: '0x00028000028880000027770004970700004977700002877000028777000d7777',
				priceUSD: 2.184,
				price: 2.184,
				unit: 'Ξ',
				invaders: [null,null,null,null,null]
			},{
				id: '0x0d0000d00dd00de00dddddd00d0d0dd0117e71100d777dd0001edd1001ddddd1',
				priceUSD: 0.11,
				price: 0.11,
				unit: 'Ξ',
				invaders: [null,null]
			},{
				id: '0x00999900099999909949090499499f229909ffff0044ffff049940e0499ff400',
				priceUSD: 0.21,
				price: 0.21,
				unit: 'Ξ',
				invaders: [null,null,null,null]
			},{
				id: '0x03bbbb303b7bbbb3b3bbbb3bb70bb70bb30bb03b0bbbbbb000b33b00000bb000',
				priceUSD: 0.43,
				price: 0.43,
				unit: 'Ξ',
				invaders: [null,null,null]
			},{
				id: '0x0d777d00677777607767767d767007076d6007070677707d000d776000006770',
				priceUSD: 0.632,
				price: 0.632,
				unit: 'Ξ',
				invaders: [null,null,null,null]
			},{
				id: '0x0777776007bbb7d0073337d007bbb7d0077777d0078787d0077777d0067776d0',
				priceUSD: 1.1,
				price: 1.1,
				unit: 'Ξ',
				invaders: [null,null,null,null,null,null]
			},{
				id: '0x00028000028880000027770004970700004977700002877000028777000d7777',
				priceUSD: 2.184,
				price: 2.184,
				unit: 'Ξ',
				invaders: [null,null,null,null,null]
			},{
				id: '0x0d0000d00dd00de00dddddd00d0d0dd0117e71100d777dd0001edd1001ddddd1',
				priceUSD: 0.11,
				price: 0.11,
				unit: 'Ξ',
				invaders: [null,null]
			},{
				id: '0x00999900099999909949090499499f229909ffff0044ffff049940e0499ff400',
				priceUSD: 0.21,
				price: 0.21,
				unit: 'Ξ',
				invaders: [null,null,null,null]
			},{
				id: '0x03bbbb303b7bbbb3b3bbbb3bb70bb70bb30bb03b0bbbbbb000b33b00000bb000',
				priceUSD: 0.43,
				price: 0.43,
				unit: 'Ξ',
				invaders: [null,null,null]
			},{
				id: '0x0d777d00677777607767767d767007076d6007070677707d000d776000006770',
				priceUSD: 0.632,
				price: 0.632,
				unit: 'Ξ',
				invaders: [null,null,null,null]
			},{
				id: '0x0777776007bbb7d0073337d007bbb7d0077777d0078787d0077777d0067776d0',
				priceUSD: 1.1,
				price: 1.1,
				unit: 'Ξ',
				invaders: [null,null,null,null,null,null]
			},{
				id: '0x00028000028880000027770004970700004977700002877000028777000d7777',
				priceUSD: 2.184,
				price: 2.184,
				unit: 'Ξ',
				invaders: [null,null,null,null,null]
			},{
				id: '0x0d0000d00dd00de00dddddd00d0d0dd0117e71100d777dd0001edd1001ddddd1',
				priceUSD: 0.11,
				price: 0.11,
				unit: 'Ξ',
				invaders: [null,null]
			},{
				id: '0x00999900099999909949090499499f229909ffff0044ffff049940e0499ff400',
				priceUSD: 0.21,
				price: 0.21,
				unit: 'Ξ',
				invaders: [null,null,null,null]
			},{
				id: '0x03bbbb303b7bbbb3b3bbbb3bb70bb70bb30bb03b0bbbbbb000b33b00000bb000',
				priceUSD: 0.43,
				price: 0.43,
				unit: 'Ξ',
				invaders: [null,null,null]
			},{
				id: '0x0d777d00677777607767767d767007076d6007070677707d000d776000006770',
				priceUSD: 0.632,
				price: 0.632,
				unit: 'Ξ',
				invaders: [null,null,null,null]
			},{
				id: '0x0777776007bbb7d0073337d007bbb7d0077777d0078787d0077777d0067776d0',
				priceUSD: 1.1,
				price: 1.1,
				unit: 'Ξ',
				invaders: [null,null,null,null,null,null]
			},{
				id: '0x00028000028880000027770004970700004977700002877000028777000d7777',
				priceUSD: 2.184,
				price: 2.184,
				unit: 'Ξ',
				invaders: [null,null,null,null,null]
			}];
			for(let i=0; i<testData.length; i++) {
				let maxRarity = 0;
				let maxLevel = 0;
				for(let j=0; j<testData[i].invaders.length; j++) {
					let invader = generateInvader();
					testData[i].invaders[j] = invaderAnalysis(invader.id);
					maxRarity = Math.max(maxRarity, testData[i].invaders[j].rarityScore);
					maxLevel = Math.max(maxLevel, testData[i].invaders[j].level);
				}
				testData[i].maxRarity = maxRarity;
				testData[i].maxLevel = maxLevel;
			}
			return testData;
		}


		//////////////////
		// Verification //
		//////////////////


		// Verifies the invader can be minted
		function verifyMintInvader(pixelconId, index) {
			pixelconId = formatInvaderId(pixelconId);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (pixelconId == null) reject(_invalidIdError);
				else if (isDuplicateTransaction(_mintTypeDescription[0], [pixelconId])) reject(_duplicateTransactionError);
				else {
					try {
						let chainId = web3Service.getMainNetwork(_networkIndex).chainId;
						let contract = await web3Service.getContractWithSigner(_contractPath, chainId);
						//let exists = await contract.errRetry.exists(id);
						//if(exists) reject('PixelCon already exists');
						//else resolve({ });
						
						//TODO
						resolve({ });
						
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : _verificationError);
					}
				}
			});
		}

		// Verifies the invader can be transfered
		function verifyTransferInvader(id) {
			id = formatInvaderId(id);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (id == null) reject(_invalidIdError);
				else if (isDuplicateTransaction(_transferTypeDescription[0], [id])) reject(_duplicateTransactionError);
				else {
					try {
						let chainId = web3Service.getMainNetwork(_networkIndex).chainId;
						let address = web3Service.getActiveAccount();
						let contract = await web3Service.getContractWithSigner(_contractPath, chainId);
						//let owner = web3Service.formatAddress(await contract.errRetry.ownerOf(id));
						//if (owner == address) resolve({ owner: owner });
						//else reject('Account does not own this PixelCon');
						
						//TODO
						resolve({ });
						
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : _verificationError);
					}
				}
			});
		}


		//////////////////////////
		// Create/Update/Delete //
		//////////////////////////


		// Mints a new invader
		function mintInvader(pixelconId, index) {
			pixelconId = formatInvaderId(pixelconId);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (pixelconId == null) reject(_invalidIdError);
				else {
					try {
						let to = web3Service.getActiveAccount();

						//do transaction
						//let chainId = web3Service.getMainNetwork(_networkIndex).chainId;
						//let contractWithSigner = await web3Service.getContractWithSigner(_contractPath, chainId);
						//let tx = await contractWithSigner.create(to, id, name, _defaultGasParameters);

						//add the waiting transaction to web3Service list
						//let transactionParams = { pixelconIds: [id], data: {id:id, name:name} };
						//resolve(web3Service.addWaitingTransaction(tx.hash, transactionParams, _mintTypeDescription[0], _mintTypeDescription[1]));
						
						//TODO
						
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while minting Invader');
					}
				}
			});
		}

		// Transfers invader
		function transferInvader(id, address) {
			id = formatInvaderId(id);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (web3Service.isReadOnly()) reject(_noAccountError);
				else if (web3Service.isPrivacyMode()) reject(_accountPrivateError);
				else if (!web3Service.isAddress(address)) reject(_invalidAddressError);
				else if (id == null) reject(_invalidIdError);
				else {
					try {
						let owner = web3Service.getActiveAccount();

						//do transaction
						//let chainId = web3Service.getMainNetwork(_networkIndex).chainId;
						//let contractWithSigner = await web3Service.getContractWithSigner(_contractPath, chainId);
						//let tx = await contractWithSigner.transferFrom(owner, address, id, _defaultGasParameters);

						//add the waiting transaction to web3Service list
						//let transactionParams = { pixelconIds: [id], data: {id:id, address:address} };
						//resolve(web3Service.addWaitingTransaction(tx.hash, transactionParams, _transferTypeDescription[0], _transferTypeDescription[1]));
						
						//TODO
						
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while transfering Invader');
					}
				}
			});
		}


		///////////
		// Utils //
		///////////


		// Converts to standard format of a given invader id (or null if invalid)
		function formatInvaderId(id) {
			if (!id) return null;
			id = (' ' + id).slice(1);
			if (id.indexOf('0x') != 0) id = '0x' + id;
			if (id.length != 66) id = null;
			else {
				id = id.toLowerCase();
				for (let i = 2; i < 66; i++) {
					let v = id.charCodeAt(i);
					if (!(v >= 48 && v <= 57) && !(v >= 97 && v <= 102)) {
						id = null;
						break;
					}
				}
			}

			if (id == '0x0000000000000000000000000000000000000000000000000000000000000000') return null;
			return id;
		}
		
		// Converts to standard format of a given invader index (or null if invalid)
		function formatInvaderIndex(index) {
			if (index === null || index === undefined) return null;
			index = parseInt(index);
			if(isNaN(index)) return null;
			return index;
		}
		
		// Breaks up the given list to query for data in chunks
		async function breakUpQuery(list, querySubset, max) {
			if(list && !Array.isArray(list)) list = [list];
			if(!max) max = 1000;
			
			let subList = [];
			let results = [];
			for(let i=0; i<list.length; i++) {
				if(subList.length >= max) {
					results = results.concat(await querySubset(subList));
					subList = [];
				}
				subList.push(list[i]);
			}
			if(subList.length > 0) results = results.concat(await querySubset(subList));
			
			return results;
		}
		
		// Checks if the given data looks like a currently processing transaction
		function isDuplicateTransaction(transactionType, pixelconIds) {
			let transactions = web3Service.getWaitingTransactions();
			for (let i = 0; i < transactions.length; i++) {
				if (transactions[i].type == transactionType && transactions[i].params) {
					if (transactions[i].params.pixelconIds && transactions[i].params.pixelconIds.length == pixelconIds.length) {
						let containsAll = true;
						for (let x = 0; x < pixelconIds.length; x++) {
							let found = false;
							for (let y = 0; y < transactions[i].params.pixelconIds.length; y++) {
								if (pixelconIds[x] == transactions[i].params.pixelconIds[y]) {
									found = true;
									break;
								}
							}
							if (!found) {
								containsAll = false;
								break;
							}
						}
						if (containsAll) return true;
					}
				}
			}
			return false;
		}
		
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		var invaders = ["0969969005566550095005900660066060099006000000000000000000055000","9dd00dd91dd00dd100099000000dd000990000990001100000011000000dd000","0000000000000000dd1111dddda11add00daad0011011011dd0dd0dddaaaaaad","00066000000cc000000cc0000000000000000000000000006660066666c00c66","d888888d11811811811001188180081811811811000880000001100000d88d00","1c6006c1c660066c000000000000000000066000000000000000000006c00c60","000cc00000066000c500005ccc0000cc66066066005005000050050055500555","09199190099999900001100000011000ddd00ddd000dd0000009900000000000","5000000507d77d7007d77d700dd00dd07d5005d7d750057dd005500dd005500d","a5a66a5a05600650056006500a6aa6a005a00a5005a00a500555555005666650","6666666600999900009119001106601166911966669119661111111111111111","d000000d0000000000000000d000000d00000000000000000dd11dd009d99d90","0dd00dd00a5005a055a00a55a550055a0dd55dd0500000055000000500000000","a660066a00000000000000000006600000000000000000000000000000000000","006556000050050000a00a0000600600a550055a6a5005a60006600000066000","55c55c5550000005500000050dc00cd0ccdccdccd555555dd005500d500dd005","1dd00dd110011001100dd00100000000011111100d9119d00000000000000000","000dd000000dd0000cdccdc00dcddcd0055005500dd00dd00dc00cd050000005","00000000000000000c6cc6c0066116606660066606c66c600116611011c00c11","5aa00aa55aa00aa5000aa000000dd000000000000050050000a00a00ad0dd0da","00dddd001110011111b00b11000110000000000000000000db0000bddb0000bd","1b0bb0b1b101101bb111111b1bbbbbb1001bb1000010010000b00b001b0000b1","000aa000000aa000000aa000a000000a60000006600000061aa00aa111a00a11","0660066006611660011661100a1001a00a6aa6a0066666600000000000000000","0001100019000091660000666660066666600666999009991101101169099096","5000000559900995669009666990099605500550099009906000000660000006","55b00b55b600006b6b0000b6bb5bb5bb550000555b0000b5000bb00000055000","000aa000000000000000000011a00a1100000000000000000000000000000000","100dd001d001100dd000000dd000000dddd11ddd00011000000cc000c000000c","c665566c000000000000000000c55c0000566500005cc50055c00c5555c00c55","0550055009600690900660095005500590000009665005666650056666500566","ad0dd0dadd0000dda100001aa10dd01a00a11a0000d11d001a0aa0a1da0aa0ad","00d00d0000a00a00a500005a5500005500d00d00d500005dd500005dda5005ad","0dd11dd01cdccdc11dddddd1000cc00011100111ddd00ddd0000000000000000","006556000065560000055000000cc00055055055000000000000000000500500","0860068088888888558668550550055005555550055555500685586006855860","0656656060066006900660096696696699699699695995969000000950000005","6a0000a6650000566555555666a66a6600000000aa0000aa55000055a500005a","06500560665665665c5cc5c5555555550cc00cc00c6006c05cc00cc5c650056c","0dd00dd000000000000000000000000001b11b100bbbbbb00bb00bb00dd00dd0","d550055d0000000000000000550000550058850000855800dd0000dd55000055","d00dd00dd00dd00db00bb00bb000000b00000000000000000000000000000000","bd0000db000dd0000001100000d00d00bb0bb0bbdd0dd0ddddddddddbbdbbdbb","0070070000100100d101101dd101101d001111007110011711100111117dd711","111001110000000000000000000dd0000000000000000000b00dd00bd00dd00d","0181181001811810100880011006600110000001618008166180081600066000","d50dd05d000000000000000000500500ddd00dddd880088d0055550000555500","0001100000011000116116116b1bb1b61110011111000011b100001b00600600","016006100a1001a0011001100000000000000000000000000000000000000000","5500005500055000000cc000000cc000c506605c55066055c506605c66055066","555665556660066666600666500bb0055000000550000005bb6bb6bb5b6bb6b5","dccccccddc0000cd5c0000c5005cc500dd0000dd5500005500c00c0000d00d00","55c55c55555dd555cc0cc0cc550dd055000dd000cdd00ddcdcc00ccd00055000","5d0000d585500558588008858d0550d80080080000800800555dd55558588585","00d00d0000d00d00dd0000dd5700007500d77d00550000555700007575000057","7750057700500500007007000007700067077076660550660007700000077000","6000000666600666666006660006600061800816611001168000000810000001","0595595055d00d5555900955555dd555559dd95555dddd559000000990000009","000dd000000dd00010011001c001100c0000000000011000000110001dd00dd1","5760067555700755550000556600006600555500000550000006600000600600","5860068505855850068668600006600066800866556006550000000000000000","5006600555966955559559555595595509999990066556600665566005655650","05b55b500db55bd00d5005d00d5005d00005500000055000000dd000500dd005","00600600006006000060060000100100611001166a0000a66100001600a00a00","60000006b000000b6000000610000001bbbbbbbbb660066b6b6006b6b000000b","0016610000166100660110666601106666066066669119666661166600000000","0011110000088000000660006808808668000086660000660010010000100100","00d00d0000500500dd5005dddd9009dd000000000050050000d00d0095d55d59","9006600950066005500000055000000550000005555665559999999909699690","6601106600000000000000001100001166066066660660666b0000b611000011","0005500066555566868668686006600666855866665665666686686655655655","0000000000000000671001761160061166000066660660666601106666011066","59000095d595595dd555555d0000000000000000000000009500005955000055","000110000001100001dddd1001dddd100000000011d00d111ad00da111d00d11","11000011d900009d00dddd0000dddd001d0000d19d0000d91d0000d100000000","11000011dd0000dddd0000dddd0110dd1c1cc1c1111dd111dd0000ddcd0000dc","06b00b600bb00bb0566666655b6bb6b560066006000550000005500006666660","da0aa0adaa0aa0aadd0dd0dd000000000001100000011000000dd000000dd000","01a11a100111111001111110066666600000000001a00a1001100110a000000a","add00dda1dd00dd10111111001a11a10000dd0000111111001a11a1001100110","000000000000000005c00c5005500550ddddddddd000000dc000000c00000000","b600006b0000000000000000000bb000b5b55b5b555555555b0000b555000055","000000000000000000011000000110001c1001c1000000000000000066100166","dadaadadadddddda0000000000000000a00dd00a000dd000000aa000100dd001","c5d00d5c55c00c55cd0000dcdd0000ddcd0dd0dc00d00d0000d00d0000500500","0580085055855855855555586000000606655660086886808006600860088006","d180081dd110011d100dd001100dd0011dd11dd1111001111880088118188181","00066000000550000005500000066000000aa0006aa00aa65550055555566555","0086680066666666555665550056650000066000000880006600006686000068","00000000000aa000000550000005500000666600006aa600a566665a5a6aa6a5","66066066a600006a11000011111661111100001166000066660660661a0aa0a1","18d00d81d110011dd10dd01d11011011dd0dd0ddddd00dddd880088d00000000","00000000d909909ddd0dd0dd11dddd1100199100001111000001100000099000","9001100960099006069119600661166000066000019119100111111019199191","5dddddd5d505505d95055059000dd00000d00d00009009000090090000d00d00","0556655005566550000000000000000066600666655005566550055600000000","006bb6000066660000166100000660000000000000000000b110011b11600611","cd0110dc000000000000000000011000000000000000000011dddd1111dddd11","85555558d58dd85d055dd5500d8dd8d0d000000dd005500d8005500885855858","0017710061000016610000160000000000066000000660006707707676066067",
						"00599500d50dd05dd909909d0000000000d00d0000d00d0099d00d999dd00dd9","dd5555dd888888880d8008d00dd00dd000088000d005500d8005500800000000","0dd00dd007d00d700d7007d07dd00dd70dd00dd00dd00dd00dddddd00dddddd0","a505505aa505505a000000000000000000d00d005dd55dd55dd55dd5d5a55a5d","55555555575775757dd55dd75d7557d5500000057dd55dd7ddd55ddd50000005","d700007ddd0000dd0005500000055000007777007dd55dd7dd7557dd7d0dd0d7","cd0dd0dcd505505dc505505ccd0dd0dc55c00c555c0000c55d0000d55c0cc0c5","000660000050050000500500000aa000005aa500005aa5006600006666000066","1007700170011007000110000001100001166110011001100110011000000000","6106601661011016000000000000000061066016611001161660066100666600","b550055b000000000000000000000000600bb006600550060555555005555550","7000000710000001100dd001d001100d10077001000000000000000001d00d10","0005500000055000600770067005500755755755000550000005500006655660","0ad00da000000000000000000000000055d55d5555d55d55aad00daaddd00ddd","00099000000dd0000009900009d00d905000000550000005055dd550055dd550","000dd00000a00a0000d00d0000055000005dd500005dd500555005555a5005a5","700110070d1111d007d77d70100dd00110011001700110070710017007100170","0166661001666610066006600960069000000000600000069000000906600660","bb5bb5bbb555555b55000055b500005b555005555dd00dd55bb00bb5000dd000","09d00d9009900990059dd950055dd550959dd95909d99d9005dddd50ddd55ddd","07d00d70057007500000000000000000500770055000000550000005d777777d","0aaaaaa0d00aa00d5005500555a00a55500dd005d00dd00d0000000000000000","0000000000000000066006600660066060066006055555500c5cc5c00c5cc5c0","0050050096666669666666660060060000000000000000009909909995066059","006cc600000660000001100061011016cc1cc1cc111111111101101111011011","66666666ccc00ccc6c6006c60001100000066000000110000010010000100100","01a00a100000000000000000a00aa00ad000000dd000000d0000000000000000","ad0000dad100001d0010010000a00a00ddd11ddd00d00d0000a00a0000d00d00","01cddc100dd11dd0c00cc00cc00dd00c0dd00dd01dd11dd1ccdccdcc00000000","00500500000dd000000dd0000000000055000055dd0000dd009dd900009dd900","006006006a0aa0a66106601600611600000aa000000660000011110000111100","00000000600000066000000600000000000aa00000066000a006600a60011006","dd7007dd77700777005005000050050057577575005dd500007dd70055500555","000000000000000055a00a55a5a00a5a55000055aaaaaaaa5555555500055000","00000000000000007d0110d777077077000dd000dddddddd7d7dd7d700011000","0000000000000000000dd000000dd00005c55c500000000000000000000dd000","0c6006c0066666600666666000066000011001100c1001c011c00c1111600611","9000000910099001100dd0011dd00dd1dddddddd9d9119d9d001100d10099001","db0bb0bddd0110dd00d00d0000d00d00000110001dd00dd1b1b00b1bd1b11b1d","b660066b660550666b0bb0b66556655600000000000000000000000000000000","000110000001100000d00d0000d00d001d0000d100099000000dd00000000000","0bb00bb0b550055b55500555b00dd00b0bdbbdb00bbbbbb0055dd5500dd55dd0","0000000000088000000880000050050068800886666006668600006865000056","00d55d0000d55d0000bbbb00000dd000db0bb0bddb0bb0bd000dd00000055000","d000000d1001100110011001000cc000ddd00dddcdc00cdcddd00ddddcd00dcd","0000000050066005500770056660066605500550055005500650056006700760","0000000059d99d95555dd5550000000000000000000000000000000000000000","6666666666666666000000000000000000066000600000066000000650055005","00d88d00008dd80000500500005005008808808800d00d0000d00d00d8d88d8d","000550000006600000000000000000005b0000b5000bb0000005500000000000","6c1cc1c600166100006666006666666611100111111001110010010000600600","5000000560000006088008800650056066800866000000000000000066555566","110110116601106600b00b0000b00b006b0bb0b6000bb0000001100000011000","7601106700011000000110000061160011000011110000110066660000666600","0000000000000000600550066005500606655660000000000000000066500566","0050050000500500d850058dddd00ddd8d0000d8d858858d55dddd5558d00d85","ddd00ddd88d00d88d110011dd110011d00d00d000000000000000000000dd000","ddd00ddddd5005ddd000000da000000add5dd5dddaaaaaaddddddddd0dd00dd0","6111111661111116100110017001100700011000600000067000000766700766","001dd100d808808ddd0110dd18d00d81110000111100001111dddd1111dddd11","000bb00000066000000660000005500066600666006006000050050065055056","000dd000000dd000110000119100001900099000dd1001dddd1001dd000dd000","00000000000dd0000001100000011000001111000011110011000011dd0000dd","0000000001166110011111109110011900000000000000000110011009100190","80088008d005500d088888800d8558d0500000050dd00dd00dd00dd058888885","066006600660066000000000000000000000000056a55a65566556656a6aa6a6","66c66c6660000006c000000c0660066000000000000000005665566556666665","1710017170077007100110010111111000011000000110006661166666611666","100dd001100dd001dd1dd1dddc1cc1cd10000001100000011000000101dddd10","0000000000000000100660011006600111900911096006900690096010000001","0000000000000000bdd00ddbbd1001db100110010bd00db00db00bd00dd00dd0","c6c00c6c000660000005500000000000c005500c500660055556655566c66c66","0660066066600666665005666656656600066000000880008556655855655655","d00aa00d100dd001000dd000000dd000add00dda000aa000000aa00010011001","0009900000055000000000000000000055500555000660000009900056666665","6580085668600686860660686605506600066000860660685506605585866858","0010010000166100001771000000000000666600001771000010010000100100","0006600000066000005005000050050056055065c555555c55c55c55005cc500","0005500050055005d00dd00d0757757000000000000000000dddddd00d7557d0","0007700000066000000110007000000706600660076006706000000660000006","00a00a0000a00a000055550000555500a5a66a5a6a6006a66660066600666600","d808808d5d0000d58d0000d8555dd555558008558550055858d00d858dd00dd8","000000000d1001d00db00bd000000000000dd000000dd0000110011001100110","ddd55dddd555555d0555555005555550a5adda5a055dd5500dddddd00dd00dd0","0009900000099000009559000056650095655659550000559600006900600600","0665566066600666aa5005aa0555555050066005500aa0055a5005a555500555","000dd00000011000000110000001100000011000d717717ddd1111ddd700007d","000660000006600000066000000660006a6aa6a600a00a000050050000055000","5560065555600655000000000000000067077076007007000050050066000066","0dd00dd0bdd00ddbdbd00dbdd00dd00ddbd00dbdddd00ddd0db55bd00dddddd0","0000000000000000000000000000000085655658006556000056650066800866","0a5aa5a00665566006655660066556600a5005a0000000000000000005500550","1aaaaaa1001001000060060000000000006006000010010011011011aa0aa0aa","dd0dd0dddd0000dd8d0000d80081180011000011810000181100001111000011","ddddddddd9d99d9d0095590000dddd0000000000d959959d55dddd5555000055","000110001c0cc0c16c0cc0c600011000cc6cc6cc116116110061160000111100","000000000dc55cd005d55d505cdccdc50d5005d005d00d50c000000cd000000d","1100001111000011960000696600006666666666001661000016610000699600","5750057576700767566556655767767500000000550550556606606677600677","0066660000766700001001000070070000000000666116666767767600166100",
						"ddddddddd00dd00dd00aa00d01111110d000000d100000010ad00da001100110","6660066676500567770770776605506655600655557667556656656600066000","100dd00100011000000110001000000111bddb11111dd111b1dddd1b11bddb11","00a00a00a660066a66600666000000006a5aa5a66a5aa5a60000000000000000","00066000000cc0000000000000000000c505505c000000000000000000000000","99099099d101101dd101101d0010010000dddd00001dd100d110011dd990099d","06600660066006600a6006a00a6006a06a5aa5a660066006a006600aa00aa00a","d55dd55d00a00a00005005005d0550d55505505555055055add55ddaadd55dda","cc0000cc660000661cccccc116c11c6100011000cc6006cc6660066600000000","6600006666000066aaa00aaa5560065500a00a000060060000a00a00a6a55a6a","0777777005766750065555600675576000000000000660000006600060000006","dc0cc0cdd10dd01d1cc00cc111100111d101101d1dd00dd11cd00dc1001cc100","0005500000055000655665567777777700666600555665557556655700577500","0008800000066000000000000000000065500556000000000000000000655600","11100111661001660b1bb1b0011661101bbbbbb1016116100161161010011001","8818818868688686600660066008800666800866668668666666666660000006","05d55d5050000005c000000c000dd000000dd000000dd000dd5555ddcc5cc5cc","000000000000000011000011d800008d001111000000000000000000d810018d","0000000066b00b66666006666b6bb6b66111111661b11b166601106666011066","00b00b0000000000000000001db11bd100d00d0000b00b000000000000000000","000550000005500055c00c5555c00c5556666665005005000050050065000056","55b00b55006bb600005665000006600000066000000660000060060000600600","10088001018008100180081000011000081881800111111010011001d00dd00d","550000555500005500d00d0000d00d00cc5005cc000550000005500000d00d00","0068860011611611861111688601106800866800001111001888888111666611","000dd00000000000000000001d9dd9d190011009900110091000000110000001","05600650055005500a5aa5a005655650665005666aa00aa66660066606a55a60","0655556006955960500990055005500566666666099009900550055090099009","0000000000000000b00dd00bd00dd00d11111111db1001bddb1001bdd001100d","0bb00bb055500555b5b00b5bbbbbbbbb0005500000055000655555566b5bb5b6","0750057005500550075005700dd00dd0d000000d00077000000dd00007d00d70","5000000590000009000660000006600005900950600000066000000600000000","cdd00ddc5dd00dd500dddd0000cddc0000d00d005cd00dc5d550055d00055000","0050050099699699966556690000000055066055590990956606606696066069","dd0550dd5500005555000055cd0000dcdc5005cddd5005dd0000000000000000","ddd00ddd555005550000000000000000d808808d000dd000000550008d0000d8","0770077006600660000000000000000057600675700000077000000705700750","dcd00dcd00c11c0000dccd001cccccc100111100001111000001100000011000","5005500560066006765005675570075566555566600000065000000507700770","550000550050050000d00d000000000000d55d00008558008585585855dddd55","0006600060055006600550060005500006666660066666600008800000066000","6006600670077007667007666650056660066006667007667770077707600670","0000000060011006600110066008800618600681166006610680086006600660","0dc00cd00cc00cc0c001100c100cc0010c1001c01c1001c1dcd00dcd000cc000","100000011000000110066001100cc00110066001166006611110011111166111","001bb100001dd100001dd100001dd10000011000dd0000dddd0000dd11011011","0190091010000001600000066000000669199196696996960660066009900990","a100001a1a0000a1ad1dd1daad1dd1dadd1dd1dd00a00a000010010011d11d11","d000000ddd1111dddddddddd0dd00dd0da1aa1ad11a11a11011111100dddddd0","000770000007700077077077110dd01100000000dd0000ddd700007d00011000","5006600585566558885885880000000066500566665005660000000000000000","1001100110011001ddb00bddddb00bddb00dd00b0000000000000000000bb000","0aaaaaa00aaaaaa0000000000000000010011001000000000000000060000006","00dddd0000dddd0000099000000990000010010011000011110000111d0dd0d1","0000000000000000b660066bb660066b666666666b0bb0b61606606116066061","5505505575055057005555000055550000000000000550000005500076655667","0086680000666600866116681661166111011011186886818686686800000000","1dd00dd191100119011dd1100dddddd001100110119dd9111919919110000001","000dd00000088000d800008ddd0000dd555dd555000dd000000dd00000000000","d005500dd005500d000dd000000cc0000dd00dd005cddc500c5cc5c0cdd00ddc","0750057005500550756666575566665500077000077007700560065000000000","0055550000bbbb000050050000b00b00db0bb0bdbbd00dbbddd00ddddd5005dd","6a6006a6a6a66a6a566666650660066055500555555005556550055665500556","1000000100000000000000000a6006a010000001600000060000000000000000","dd0110dd0000000000000000000880000000000000000000110dd011dd0110dd","8665566856655665555555555585585556866865000000000000000055000055","00099000000dd000d00dd00d100110010dd00dd00dd00dd00190091000000000","00166100001661001100001116000061611661166b0bb0b61b0bb0b116000061","006cc60000655600006cc600006cc60000055000000cc0000060060000500500","005555000000000000000000555dd555bd5005dbdd5005dddd0000dddd0000dd","0bbbbbb0b001100bb001100bd110011dddd00ddd11b00b1110000001d000000d","1106601100000000000000006c1cc1c611c11c1166c66c666606606666011066","0001100000066000166006618880088800000000600000066000000600066000","611111166111111600066000000aa00000a00a0011a11a1111a11a1100111100","0000000000000000bdd11ddbd11dd11dd001100d00011000000dd000d000000d","5b0bb0b55506605500b00b0000500500006bb60000500500005005006b0bb0b6","110000116aa00aa66660066600a00a0000600600006006001606606116066061","1110011111100111170770717101101717000071000660000006600011100111","5000000550000005556006556660066605a00a5005a00a5005a00a5005555550","0dd00dd008d00d8011d00d1111800811188008818110011881800818d000000d","610110166c0cc0c600011000000cc0001c0cc0c10061160000c66c0000666600","660000666c0000c611000011110110110010010000c00c000001100000011000","0db00bd0055005500b5005b005500550000bb0000000000000000000d005500d","5500005585600658668008660085580055000055550000558808808866055066","0000000000000000001dd10000b11b00000dd000000dd00000011000bd1001db","11c11c1111111111d1c00c1dc110011c0000000000000000000000001dc00cd1","5850058568500586655005566006600600088000000660006000000660000006","0000000000000000066006600660066000000000000000000000000000000000","b005500bd005500d000bb000000dd000b550055b55555555555555555dd00dd5","dd1111dd7d1111d711000011110000117d7117d777077077110dd011ddd00ddd","cc0cc0cc1101101100d00d0000c00c00cd1001dc0010010000d00d0000000000","7670076700011000000110000001100000011000000110000660066006600660","0a6aa6a010066001a006600a066666606000000660000006666006661aa00aa1","0006600000011000000770000676676066611666667117666767767666611666","0000000060066006c00cc00cc560065c5565565566566566c00cc00c50055005","57777775575775755575575500d00d0000dddd00007dd700557dd75557d77d75","5006600550088005500660055586685585800858555005555006600550066005","0dd11dd00d8118d010000001800000080d8dd8d0d880088dd110011d0dd00dd0","0880088006600660600000068000000800000000500880058006600800066000","dd1001dd0170071001d00d100d7007d000000000000000000000000000000000",
						"ddd55dddd000000dd000000d95900959000dd000000dd000055005500dd00dd0","0556655090066009600990069555555956600665966006699006600960055006","0005500000066000695995965959959555655655000000000000000099699699","6cc00cc6c000000cc000000c55c66c55c00cc00c500550050c6006c006c00c60","1760067111600611116116117767767700166100006776000061160000166100","55555555d55dd55dd55dd55ddd9dd9dd0d9559d00dd55dd0055dd55000000000","0006600066066066560660655c0cc0c56c0000c6c500005c00c00c0000c00c00","6000000670000007067007600760067000000000000000000000000006700760","0096690000566500000000000000000065055056000660000006600000999900","0000000000000000000000000000000000500500555555558858858800000000","5000000550000005500000055000000506666660000000000000000006a55a60","5850058558800885566006650888888050088005500880050005500000055000","666006666b0000b66b0000b6655665560000000000000000b665566bb6b55b6b","0dd00dd0d000000dd000000d500dd005cddddddcddcddcdd0c5cc5c0055dd550","555dd555755005575dd00dd557d77d7500000000000000000000000000000000","0111111011700711717007171001100170077007d007700dddd11ddd17d77d71","0b1bb1b00d1111d00000000000000000d00dd00dd001100dd001100d1b1bb1b1","00000000800000088000000850088005000dd0000008800080000008d000000d","1100001111100111c110011c00011000c610016cc610016c00066000000cc000","00100100001001000001100000011000ddd00ddd9100001911000011911dd119","8dddddd81dddddd1000000000000000000000000008008000010010000011000","00066000000660000000000000000000611661161110011111a00a1100000000","a005500a6006600660066006500aa00500000000055005500a5005a005555550","0000000000000000000110000008800016000061000000000000000000888800","5000000550000005500770057005500777d00d77000000000000000070000007","a550055a55500555500000055000000506a66a60555005555550055505a66a50","81000018dd0000dd00811800008118008100001811dddd111181181100100100","000bb000d110011dbdd00ddb00011000d111111d111dd111011001100bd00db0","add11dda0001100000011000a100001ada0aa0adda0aa0adda0aa0ada10dd01a","bb5bb5bb66566566055005500550055000055000666666666666666600000000","00055000000bb0000060060000b00b0000b66b00000000000000000066600666","065665600556655050066005a005500a066006606a6aa6a65566665550066005","0055550000555500005005000050050067777776760660675707707500077000","66b00b6666600666116666111166661111b11b1106b00b600bb00bb000066000","6660066611c00c1111166111c616616c00000000600660066006600660000006","665555666000000660000006600000060bbbbbb0066666606000000660000006","00000000000000001aaaaaa11111111100011000000000000000000000000000","ddd00dddada00ada0000000000000000a000000a000dd000000dd0001a1aa1a1","b000000b10000001100000010db11bd0000dd000000bb000000dd000000dd000","dc0cc0cddd0000dd11000011000110001c0000c11100001111100111cd1001dc","00088000000dd00000d00d0000d00d0000d00d00d8d00d8ddd8008dd008dd800","1170071111700711000000000000000000d00d00ddd00dddddd00ddd001dd100","059009500dd00dd00dd00dd050000005dd5005ddd950059d0959959009599590","6000000670000007600000066000000610066001711001171170071107177170","7d0000d77d0000d7dd7007ddd550055dd550055dd555555d7dddddd7007dd700","0005500000055000000660000006600060066006600550067550055756600665","600bb0060650056005b00b500556655050055005600660060bb00bb005600650","5000000580000008500000055000000500088000d000000d8000000880000008","055005500c5005c0000cc000000cc000000dd0000d5555d00d5555d050000005","000cc00000000000000000000065560000555500005555000005500000055000","0001100066600666171001710010010000066000000110000061160000666600","b100001bbb0bb0bb6b0bb0b6660000661b1bb1b11bbbbbb10000000000000000","999009999dd00dd9000000000000000000000000000000000000000055000055","0919919009600690016006101000000100000000000000001161161111611611","100110016a6006a666600666000000001aa00aa11110011160066006600aa006","bb5005bb5b0000b555000055b600006b00066000000660005bb00bb556600665","ddd00ddddb1001bd0000000000000000bb0000bb0010010000d00d0000d00d00","00000000000000000c6006c00160061000000000c160061c1160061106111160","8600006800811800006886000000000000611600001881001106601111066011","c6c66c6c000000000000000006c00c60000cc000000550006550055655c00c55","600cc00660011006c001100c100cc00101100110111111116c6cc6c66cc00cc6","8610016866100166661661666666666606600660666006666610016660000006","000dd000000dd0001110011191100119000dd00011d11d1111d11d1100000000","500dd005500dd005500000059000000955500555500dd005500dd00509599590","0000000085555558555555550dddddd0000dd000000dd000558dd85588588588","77100177777007770000000000000000000dd00000dddd0000dddd0000000000","c660066ccc5005ccc550055c566666650050050000500500566006655cc00cc5","7dddddd700077000000dd0000001100071100117111001110000000000000000","1100001100000000000000001100001186611668668118666616616666166166","05a66a500556655055555555a5a55a5aa550055a066006600aa00aa060066006","c110011c1dd00dd10dd00dd00110011000000000000cc000000dd00001100110","00600600c666666c5666666500c00c00566006655660066556655665cc6cc6cc","065555606660066666600666000660005a6aa6a555666655a000000a60000006","6680086668100186600000066000000660011006061001600680086006600660","0000000050000005b000000b50000005600000066000000650055005b005500b","00055000000550000dd00dd00dd00dd0000dd000d00dd00dd00dd00d000dd000","061661600c1cc1c01c1cc1c1111111110001100011c00c111160061100000000","919119190000000000000000d001100d000dd000000dd00009d00d900d9009d0","95d00d599d5005d9dd5005dddd5005dddddddddd00dddd000055550000555500","1c0cc0c1cc0cc0cc0006600000011000611111160010010000c00c0000611600","b000000bb000000bdd5555dddd5555ddb00dd00b0d5dd5d00d5dd5d0000dd000","555005556b5005b60b5005b0055005500b5005b0500000056000000665566556","000000000000000000000000566666655000000550000005066556600a5aa5a0","6c0cc0c66601106661000016c100001ccc1cc1cccc0cc0ccc106601c16011061","6606606666566566666666660006600000900900005005000050050000600600","6007700600000000000000000660066000000000000000000006600000066000","66a00a666610016666000066660000660001100066a11a666a1aa1a666600666","dc1001cddd1001dd11c00c111100001100d11d0000d11d0000d00d0000100100","00dddd0000dddd000080080000d00d008dd00dd80000000000000000000dd000","00100100006006006606606611011011000110000060060000100100c1c66c1c","8660066800055000000880005000000505500550058008505006600580066008","0556655000066000000660000006600000066000000660005aa00aa566500566","0008800000066000000880000006600086100168668008668680086800000000","6a5005a6a650056a66600666666006666605506600000000000000006a0000a6","ad0000dadd0000ddda1001adda1001ad000aa000000110000001100000011000","5000000500055000000bb00055b00b555555555555555555b000000b50000005","bb0000bbdb0000bd00d00d0000d00d00dd0110dd00bddb0000dddd00000dd000","911dd119d900009ddd0000dddd0000dd99d99d9919d99d919101101911011011","00000000ddc00cddddd00ddd00055000dd5005dddd5005dd0000000000000000","55dddd5555dddd5500d55d00009999009d5005d99d5005d9dd5005ddd990099d",
						"9919919916911961996996990001100090011009600990060666666006666660","000000000bbbbbb0016666101000000100066000000660000660066001100110","d8d88d8dddd11ddd1dd11dd1800110080dd00dd0018008100000000000000000","00c00c00000000000000000000011000cddddddcdd1dd1dd00c00c0000100100","700000071000000110000001d001100dd00dd00d700dd0070d1111d007177170","0070070077600677766006670057750077000077570000750070070000600600","055dd55009d99d909d9009d9d9d00d9dd000000d00099000000dd00095500559","9d0dd0d90090090000d00d00dd0000dd59999995555dd55500999900005dd500","0050050000500500775775776656656600066000000550000005500000555500","000bb00066b55b6666b55b66555005550b5bb5b0055555505000000550000005","0011110000000000000000001b0000b1dd0000dd1b0000b1000dd000000dd000","d1c11c1dc100001cd100001d000cc00011000011c100001c00011000000cc000","000000008d8008d88180081810000001088008800dd00dd00001100000011000","000dd000000dd000000dd00000000000d550055dd550055d00d00d0000d00d00","000000000000000000600600005005006b0000b6660000666500005600055000","dd0dd0dddd0550dddd0550dd9dd55dd900dddd0000999900d550055dd990099d","00000000000000001b0bb0b1160110611111111100166100001bb10000000000","1001100110099001d00dd00dd009900d00000000100110019001100900000000","bb0bb0bb00dddd0000dddd000050050000555500005555000000000000000000","09999990100dd001d00dd00dd000000d10099001900110090000000000000000","0110011006100160661001668680086866600666666006661110011108800880","600000066006600660011006000000006666666611111111a111111a16611661","000000000000000000dbbd0000dddd0055000055005005000050050000d00d00","1001100111100111611001160001100061966916611661166006600690066009","7500005755000055007777000075570075500557677777766757757667000076","01b00b100000000000000000000bb000dbd00dbd1dd00dd10db00bd00b1001b0","0080080000500500006666000088880058888885005665000058850066066066","66000066660000666605506666055066bb6006bbb660066bbb6006bb55b66b55","7000000760000006000110000001100061100116677777766661166600066000","000550000005500000055000005005005d0000d559000095d909909dd909909d","00500500dda00add55d00d550005500000055000000dd000000dd000000dd000","00000000a00dd00ad001100dd001100d00000000000000000dd11dd00da11ad0","00011000bdd11ddbddd11ddd00100100dd0000dddd0000dd1110011111100111","0aaaaaa0a000000a500000055ad00da55ad00da55a5005a50000000000000000","005cc5006660066666600666000cc00000000000000000000000000000000000","000000000000000055800855858008580000000000055000000880000d8dd8d0","0000000069500596665005660066660000500500009009006600006666000066","0065560000655600000550000009900000055000555555559565565900000000","0000000000000000500770055005500500055000666006666660066666600666","0110011001100110000aa0000006600000066000066006600660066010066001","061001606000000660000006061001600006600000066000c000000c60000006","000bb0000001100000011000000bb00016600661b00bb00b10011001000bb000","0016610000688600006006000060060000011000666116668186681881866818","05d00d5055b00b5555500555000000005550055555b00b55500dd005500dd005","dd0000dd9d0000d91909909199099099001001009d0000d9dd0000dd00000000","600000060000000000000000666556665000000560000006600aa006500aa005","00011000000770000000000000000000dd0000dd7d7007d7dd7007ddd700007d","00d55d00550550555505505500d00d0058d00d85ddd00ddd0085580000588500","0000000000066000000110000010010088188188666116660060060000600600","0006600000077000110000111100001171111117771001771710017111000011","7d0000d7d55dd55dd57dd75d00000000005dd500007777005d0550d557077075","1bb00bb1b110011b0b1001b001100110000bb00001b11b1001b11b1000000000","005005000055550000cccc00ddd00dddcd0000dcdd0000dd5dd00dd55dc00cd5","0666666066600666118008110000000000000000000000001000000160000006","0d1001d010011001100880010000000000000000000000000000000000000000","0006600000088000580000855500005500055000580880855505505555500555","c550055c5550055500000000000000000050050000c00c0000500500c660066c","00066000c500005cc500005c550000555c0000c5c500005c5500005555000055","55d00d555550055500088000000550000880088080055008800dd008d000000d","daaaaaad000000000000000055000055550dd055aa0aa0aaaadaadaa55dddd55","0000000000000000000660000001100016666661006666000066660066600666","660660666b0bb0b6110000111b0000b111b00b11001001000010010066100166","006cc600000000000000000066655666000000000000000065c66c5666655666","1d0110d11db11bd1dbbbbbbd00d00d001d0110d1db0bb0bd0000000000000000","d001100d70011007dddddddddddddddd0000000070000007d000000d0dd00dd0","0000000000000000006556000067760067077076000770000006600000566500","000dd0001aa00aa11a1001a1aa1aa1aa0aa00aa00a1001a010000001a000000a","d000000da000000ad000000d000dd00000000000000000000daddad00adaada0","6bb00bb616b00b61bb6006bb61100116000bb000000bb00061066016b106601b","5000000550000005555005557d7007d7000dd000d757757dd555555d05555550","d888888d88000088110000111110011100188100008dd8001d0dd0d1dd0dd0dd","1006600100000000000000006660066606666660068118606000000680000008","01a66a10a006600a600660060660066001a66a10016666100000000000000000","0dd00dd00dc55cd00cdccdc0d00cc00dd000000dd000000d0005500000055000","11100111666006660000000000000000166006611666666116b11b6110000001","0d9009d005900950555dd5555dddddd5900550090000000000000000d009900d","0000000000d11d0000111100a100001a0000000000000000000aa000000dd000","110dd011d100001dd100001ddd0110dd0001100000011000bb1001bbbb1001bb","016666100116611010000001a000000a00000000000aa0000006600001100110","0550055005500550766666677767767770000007066006600670076000066000","000dd000000dd000dcdccdcddccccccd00000000d00cc00dd001100d11100111","000aa000dd0110dddd0dd0ddaddddddadd0110dddd0110dd0011110000111100","665005666c5005c6c600006c6c0000c600066000c660066c6660066655666655","00055000dd0000dddd0000dd00bbbb0055000055db0000bd000bb000000dd000","9001100960011006000110000006600010000001000000000000000006111160","0008800000088000100000011000000101111110611001166110011681166118","0000000000000000b161161b116666110001100066b00b661110011111b00b11","1110011111011011860660680066660011166111168118611868868186811868","ddd00ddd1cd00dc1000cc000000dd00011100111000000000000000010011001","bbd00dbb00011000000110000001100000000000000000000000000000000000","dc0cc0cddd0dd0dddd0000ddcc0000cc555005555c0cc0c5cc0cc0ccddc00cdd","05a66a50555555555aaaaaa505a55a5050000005a000000aa005500aa005500a","07177170077777700d7007d001d00d1007d00d700000000000000000700dd007","1110011111100111111661111116611119100191190990911606606166066066","110dd011cdc00cdcddc00cdddc1cc1cd0010010000c00c00000dd000000dd000","1666666116666661888888888111111800866800166666611116611118800881","dccccccd1cdccdc100d00d00001001000010010011000011dd0000dd00011000","0000000000000000000660000006600060000006011001100110011011111111","9dd00dd990055009d005500d000990000000000000000000d595595dd959959d","005665006c5005c66c5005c600555500c600006c6c0000c60056650000c55c00",
						"dd0dd0dddd0dd0dd00dddd0000dddd00000bb000dbd00dbddbd00dbddd1001dd","00dddd00000110000001100000d00d0000d00d0000d00d001100001111000011","0006600000066000767667677676676756766765066666600676676006666660","000bb000000dd000000dd00055bddb5500000000000000005dd00dd5bbd00dbb","9560065900000000000000009909909900900900005005005506605595066059","557dd755550dd055dd0dd0ddddd00ddddd0000dd7d0000d700d55d0000777700","9dd00dd919d00d9191d11d1999d99d99000dd00011d00d11d9d00d9d9dd00dd9","0006600000600600006006006556655666066066cc0cc0cc00c55c0000655600","00555500006666000060060000600600a600006a66055066550660555a0000a5","1001100101100110077007701007700101600610016006100000000000000000","05500550066006600005500000055000055005505c5cc5c56665566600055000","bb5bb5bb0000000000000000db5005bd000dd000000dd00005bddb50055dd550","600bb0066000000660000006000000006001100610066001b116611b11b11b11","7750057756700765500000055000000550066005055665500757757055500555","0010010096600669196006911910019111911911111111110010010000100100","0dd00dd00dd00dd05cdccdc55dd55dd5d000000d0dd00dd00550055000000000","0000000000000000006666000066660066000066690000969600006900999900","000dd00000d00d0000100100c100001c00d00d0000d00d001d0000d11d0000d1","100dd001100dd001000000000000000000000000ddd00ddddda00add0da00ad0","55d00d55558008550055550000555500dd5005dd000880000008800055500555","1100001111000011000660000006600011000011000770000006600000766700","0000000010011001100110010171171000011000000770000dd00dd00dd00dd0","6600006666666666855665588580085800000000000000006660066658500585","1111111111911911011001100110011000000000666006666990099696166169","0000000066700766666006666660066666655666556556555560065566500566","5555555566a55a66000aa00000055000600000066a5005a656a00a6556600665","000000000000000000066000000cc00055555555000000000000000000566500","0000000000000000011dd110011dd110000000001000000110000001011dd110","0dd00dd00d7007d00dd00dd0100000017dd00dd71d7007d10dd00dd007d00d70","000000005b5bb5b5566556655665566566000066560000650065560000bbbb00","0010010076611667167117610006600017677671166116617606606766066066","00088000000dd0000d8dd8d00111111008d00d80800dd0088008800800011000","d001100dd00dd00ddd7dd7dd11dddd117d1dd1d70d7dd7d00d1dd1d0d00dd00d","0695596050066005500660059596695960055006900550095005500550099005","0009900059d00d9559d00d959dddddd955500555595005950050050000500500","00600600006006000000000000000000006006000060060000b00b00b506605b","dda00addadd00dda055dd550055dd55000000000d005500da00aa00ad5adda5d","00c55c00005dd500005dd500c55dd55c5c5cc5c5555dd55500d00d0000d00d00","000dd000000dd0001100001111000011000bb000b101101bb101101b00000000","0060060000600600550660555506605500000000000550000005500055000055","0c5cc5c005c55c5055c55c556666666600055000cc5005cc55c00c55500cc005","0009900090000009100000019000000900011000000990009dd00dd91dd00dd1","5506605500b00b0000b00b000005500065066056560660650006600000055000","c00dd00cd00dd00d0005500000055000d550055d0dd55dd00dc55cd050000005","0000000000000000188008816660066616611661866116688116611800000000","d005500dd005500d500550055009900500000000000990000009900055900955","666116666116611661166116b661166b6b6bb6b666b11b666000000660000006","00077000000dd000d757757d7d5555d7057007500d5dd5d00d7dd7d000055000","000000000000000000d00d00008008001808808111dddd1118d88d8100000000","6000000610000001111001116670076611666611016666100717717000000000","0000000000088000000110008d0dd0d811d11d1111d11d118d0110d88d0110d8","6660066600600600006006006600006600566500005665006665566666c55c66","0010010000d00d000070070000d00d00000110001dd11dd11717717111711711","6696696691911919000990000001100001166110619669166191191600000000","1100001100d99d0000d11d0019000091009dd900009dd9000000000000000000","0aa00aa006600660100000011000000100000000011111100a1aa1a001166110","b5d55d5bddb00bddbdd00ddb000dd00000b00b0000b00b0000d00d0000d00d00","00b55b00ddb00bdddd5005dd000bb00000000000000000005505505555055055","0000000000000000600660068006600800000000800000086000000655500555","0006600000000000000000006665566665000056750000575500005555000055","000660000006600066b11b66b611116b600000060000000000000000b1b66b1b","00066000a5a55a5a5a5aa5a5066006600a5005a0065005600a6006a005600650","0660066007600670000000000000000070000007000770000001100000000000","00000000000990000001100000d00d000009900000011000dddddddd9dddddd9","55adda555555555500055000000aa000000550005a5aa5a555d55d55a000000a","5600006566066066660660666660066656066065b606606b0000000000000000","0550055005900950966006696660066650066005600000066000000659600695","0000000000000000000000000000000060077006500000055000000500066000","1767767161166116000000000000000066666666600000067000000776600667","90000009d000000dd000000d9000000901dddd1001dddd100d1dd1d0dd1001dd","8110011811100111100000018000000810000001166006616110011681111118","00d55d0000d55d0000000000000000005b5bb5b5bd0000dbdd0000dd00bddb00","610000166100001600b11b00001bb1000011110016611661b661166b16000061","000550006bbbbbb6b5b66b5b600bb006b006600b500550055555555556655665","000dd00000011000b1b00b1b111001110dd11dd0ddd11ddd1bbbbbb1100dd001","10000001c000000c01c66c1001c11c1000066000166666616c1cc1c600000000","0000000000000000000000000000000000100100681881861186681111066011","000dd000000dd00000099000000110000010010000900900d9d00d9d11100111","550000555a0000a5a550055a5550055500d00d000055550000555500ad0dd0da","7000000710000001000110000006600007100170700000071000000100066000","dd0110ddb10dd01b0010010000b00b00d100001dd11dd11d11111111000bb000","6100001681000018610110166601106600100100618668161186681100100100","ddd11ddd000000000000000011011011db1bb1bd111dd111000dd000000bb000","0007700000055000575005755560065550055005500550055007700570000007","cdd11ddc100000011000000100000000000dd000000110001dd11dd1d111111d","0c5005c00d5005d0c00dd00c500dd0050cdccdc050000005c000000c05500550","d999999ddd9dd9dd00900900005005009dddddd900d00d0000d00d00d900009d","00000000000aa000000dd0005aaaaaa55a5005a5dd5005ddda5aa5ad55dddd55","8555555800055000000880006580085600800800005005000005500000088000","5d0000d55d0000d55d0000d5dcd00dcd555005555cc00cc5ddc00cddddd00ddd","001881000018810011d11d1181811818810110181180081111d00d1100011000","dd1dd1ddddd11ddd00000000000000000090090011d11d11911dd11919000091","500dd00500000000000000008555555880000008d000000d5005500550088005","000bb0000006600066b00b66bb5005bb00066000666666665556655500000000","000bb0000005500000055000ddb00bdd555005555bb00bb5db0bb0bddd0550dd","0d1111d0099999900999999009d99d90d000000d11d00d111190091110000001","1910019100099000000dd00090000009d000000d100000010910019001900910","000bb000600bb006b00bb00b10011001116006111b6006b10110011001100110","0161161090011009900660090990099001911910019119101000000110000001","110110110019910000111100911111190000000000000000000dd000000dd000",
						"075775700757757075500557555005550dd00dd00777777005dddd50055dd550","0000000000000000a101101a1a0aa0a100a00a0000dddd0000dddd0000000000","5550055555500555660550666707707677777777675775767777777700755700","01a00a10a661166a1661166101a66a101661166116a11a61a001100aa001100a","db1001bd1db00bd110000001b000000b0bdbbdb00bdbbdb001b11b1000000000","d000000d0d9559d00dd55dd000000000d000000dd000000dd009900dd005500d","6655556655566555000770000006600007500570600550065005500505555550","0550055006800860068008600580085050055005568008655680086586800868","8111111881d11d1811800811d810018ddd1001dd0001100000011000d888888d","000dd000000bb000d550055dd550055db000000bd000000dd000000dd000000d","001661006a0aa0a6610110166a0000a6000660000006600061166116a1a66a1a","00b66b0000655600006bb60000bbbb000060060055000055b600006b66000066","d00dd00dd00dd00d000dd000000dd000700110070dd11dd007d77d7000000000","01c00c100d1001d000011000000dd000100000010000000000000000000dd000","0999999000000000000000006000000600011000000110006691196696611669","1110011110000001d000000d01111110019dd910011dd110d11dd11d1dddddd1","5d8008d558800885d808808dd808808d85055058000dd000000dd000000dd000","0000000066066066550660555506605566866866866556686660066655600655","1000000111700711767007677000000700077000000660000000000000000000","66b55b660005500000055000000000000b6bb6b006666660600bb00660066006","5550055500daad0000adda00005dd5005d0dd0d55d0dd0d55dd00dd55da00ad5","0056650000566500000660000005500088588588680880865506605555800855","01c11c100160061001600610100000010c1001c00c1001c00000000000000000","66600666666666665b5bb5b505b00b500005500000066000066006600bb00bb0","dd5555dddddddddd00cddc00005cc5000005500000055000000dd00000500500","0d9dd9d0dddddddd99599599095005900005500000099000d000000d50000005","1106601111066011190990911101101100000000110000111900009100099000","7560065755600655570000757500005700600600665005666750057655500555","00000000000000000000000000000000a5a55a5a555555555a5aa5a5a5a55a5a","d000000d0d5005d00dd00dd000000000a000000aa000000a0000000000000000","0001100000077000111001111710017166000066007007000070070077000077","00000000d000000d700000070dd00dd0071001700dd00dd0ddd11dddd717717d","ddd00ddd00d00d0000d00d00000000005c0000c55500005500cddc0000d55d00","6009900600000000000000000000000066900966691001969111111966911966","005dd5000090090000d00d009d0550d9dd0000dddd0000dd0050050000500500","0010010000100100680000861800008116666661160660611601106100000000","0710017006600660000000000000000071100117000000000000000010011001","0006600000011000b000000b6000000600000000066006600660066066b11b66","5606606500600600005005000056650067000076750000575700007566000066","06166160a110011a1a1001a1aa1001aa600aa006a001100a0006600000066000","ddddddddddd11ddd0000000000000000d10dd01d001cc100001cc100c100001c","bd0000db11000011b111111bdbbbbbbd0001100000b00b0000d00d0000011000","00000000000cc000000dd000000110001cccccc11cdccdc1110dd0111c0cc0c1","1180081188800888dd8008dd11d00d11000000000001100000088000ddd00ddd","d000000d8000000800000000000000000d1dd1d0000000000000000001100110","66a66a6666566566000000000000000055500555a506605a5506605566055066","00000000000000000050050000b00b00000bb000dd0550dd550550555bd00db5","0005500000055000000550000000000000d99d0000d55d00555dd555555dd555","0060060000600600001001000010010000c11c00001661000016610011000011","66000066550000550050050000500500006556005605506566066066a6a00a6a","0005500000066000006666000055550055600655bb0bb0bbbb0bb0bb00000000","00199100001dd100d10dd01d910dd019009009000091190000dddd0000d00d00","aa0aa0aaaa0aa0aa55d00d55a5d00d5a00d00d00dda55addadd55dda00500500","00a66a00006aa600000000000000000055500555560550655a0aa0a500600600","bddddddb5b5bb5b50000000000000000b5b00b5b55b00b555550055500000000","11adda11a1adda1aad0110daad0110da000dd000dd0dd0dddd0dd0dd00d00d00","500dd005500dd0055dd55dd5bbdbbdbb055555500dd55dd00bdbbdb0d555555d","1001100100000000000000000000000000000000000000006006600660066006","57777775755555570050050000500500000000000005500000077000dd0000dd","8d0000d8580000850008800000055000dd0550dd00d00d0000d00d0000000000","0080080061066016810660186110011611000011810000180008800000066000","cc5005cc60066006500cc0055550055506666660066666606660066655500555","dd0000dddda55add55d55d55550550550000000000000000dd0000dd55000055","1d0000d100dddd000017710000000000170770711d0dd0d11d0dd0d177077077","0001100000011000011dd110011dd110d000000d000000000000000000000000","6606606611011011001001000060060061000016610000166800008666666666","0aa00aa00a5005a0000aa000000660005a5aa5a5055005500550055005a00a50","000000001dddddd11dddddd100111100000000000000000000daad0000d11d00","0666666006666660666006668860068860088006088888800666666060000006","055005506cc00cc6c650056c600000066665566666c55c666c6cc6c6c665566c","0110011001100110011001100dd00dd09990099919100191d9d00d9ddd9119dd","d110011d001dd100001bb10000b00b0000d00d0000d00d00d111111db111111b","0000000000000000000dd000000cc000dddddddd0000000000000000055dd550","55500555900dd009500dd005059dd95000000000000000000009900000055000","9dddddd909d00d900190091019900991100dd00110011001011001100d1001d0","00b00b00b106601b110660111b0bb0b166011066bb0bb0bbb106601b1b0bb0b1","0d8dd8d001811810000110000001100000088000d00dd00dd00dd00d0dd00dd0","000dd000d770077d7dd00dd7d000000d7000000710000001117dd7111dddddd1","00011000000dd0000000000000000000ddc00cdd0cd00dc00c1001c0c000000c","0b1bb1b0011111100000000000000000b000000b0110011001100110b11dd11b","0dd55dd0a00aa00aa005500a0a5aa5a005a00a5005500550a550055ad5a00a5d","0dddddd00dddddd0d000000dd000000dd5bddb5db000000bb000000bb00dd00b","00011000000dd000000dd00000011000da1001ad000000000000000000000000","11dddd1111dddd1101dddd1001bddb1010000001000000000000000000011000","0000000000000000000bb000000660000066660066666666b116611bbb1bb1bb","a000000a000aa000000aa00066666666055555500555555000055000000aa000","1dd11dd111111111110110117d0110d7000dd000d10dd01d7d0110d700700700","00d88d000000000000000000008dd800dd0000ddd800008d0055550000555500","0000000006555560065555600550055066800866665005660000000000000000","0000000000000000771771771171171100d11d000070070000d00d0000177100","0000000096600669996006991919919110066001100660010000000000000000","1808808100088000000dd000001001001dd11dd1d11dd11d000dd000000dd000","0018810000d11d008888888811dddd110000000000011000000dd00000800800","aa5aa5aada5aa5ad5dddddd5000dd0000000000000000000ddaddadd5adaada5","dd0dd0dddd0dd0dd1cd00dc111d00d110010010000d00d0000d00d0011000011","0000000057577575555555556006600600000000000000006655556667577576","000bb0006b1bb1b61661166100000000160110616b0bb0b6660660661b0bb0b1","00d11d00c101101c11011011c1dddd1c00cddc0000dddd0000dccd0000d11d00","0061160096066069690990960001100099099099190990911100001191000019","000000000000000000111100001111001101101100dddd0000dddd0000000000",
						"0006600000011000671771761171171100677600676776761666666116000061","6606606600000000000000009600006900600600009009000056650000599500","7005500765566556655665560005500005766750075775700000000000000000","1191191100900900001001000010010096900969661001661166661191966919","600000060550055006600660500550050000000000000000b550055b56600665","0000000000000000556006559950059906966960000000000000000090000009","666006666a6006a66650056600055000a506605a6a0aa0a60060060000a00a00","5868868500000000000000005606606558088085580880856888888665566556","59000095990000999d9009d99d5005d9000550000000000000000000950dd059","999009999d9009d9900dd009d00dd00d59500595d00dd00dd00dd00dd000000d","00c00c0000d00d005c0cc0c5550dd05555055055cc5cc5cc5cccccc555000055","0011110000777700000dd000000dd000d111111d1d0000d117000071001dd100","00c55c000000000000000000000cc0006c5cc5c6665665660056650000566500","5500005575000057006006000060060066500566550660555506605575566557","005dd50000d00d0000d00d000000000055900955959009595500005555000055","9600006916000061006006000060060000011000960110696106601600000000","cc1cc1cc000dd000000dd000d10dd01dc100001cdd0000ddddd11dddc111111c","9110011961100116000990000009900069699696006006000060060066600666","00000000dd0dd0dd1b0bb0b10000000000d00d0000b00b00bb0000bbdd0000dd","01111110111001111110011110011001d009900dd00dd00d0009900000011000","0090090000955900005dd5005959959500d00d0000d00d00dd0dd0dd55055055","000aa000000dd0000dddddd005a55a5050000005000000000000000000000000","0000000000000000661001666cc00cc61cc00cc1001001000010010000100100","d005500dd00dd00dd00dd00d00000000000cc00000055000d000000dc000000c","d00cc00d100cc00111d11d11dcdccdcd10011001100cc001d001100dc001100c","0095590000566500969669696655556655055055596006956690096600000000","0001100000011000100cc0011001100111666611c111111c1c1cc1c1100cc001","555555557dd55dd700d55d0000d55d00dd0000dddd0000dd5d0000d5000dd000","0000000055000055660000660050050066055066660660660060060000600600","8000000810000001000880000001100060000006066006600680086086666668","dd7117dd10000001100000011000000171111117111111110001100000011000","5005500550055005000000000000000000000000756006575760067555566555","a100001a110000111a0000a11100001111011011aa0aa0aa00a11a00006aa600","6610016600100100006006000070070011000011670000760001100000077000","1180081118600681006666000066660066000066001001000080080000600600","1690096119100191900660091006600110066001069669600666666090000009","0060060000000000000000006909909666111166996996996660066611600611","00dddd00000000000000000000d00d00da0000adad0000daa50dd05a550dd055","00cccc001101101111011011000000000000000000000000dc0000cddc0000cd","0c5005c005500550ddd00dddddc00cdd000dd00050000005500000055dd00dd5","5c5005c555555555c5c66c5c0066660066500566666006666606606655055055","00000000000000000005500000055000dddddddd0dd00dd00550055050088005","bb6006bb5b6006b5b560065b665005666600006666000066b600006bbb0000bb","05c00c50000000000000000066600666055555500c5cc5c05005500560066006","b001100bdd1001ddb1d00d1b100bb001ddd00ddd11b00b1101b00b1001d00d10","600aa0060a1aa1a00a6aa6a006600660a000000a60000006011001100aa00aa0","0006600061a00a166110011661a66a16000660000006600001a11a1001111110","0005500000055000555005555550055555000055550550555505505500000000","0160061006600660600990061001100160099006600000069000000911900911","110dd011118dd811181881810010010000011000000dd000000dd00000011000","05500550066006600c6006c00000000000055000000550000665566006c55c60","0000000000000000d000000dd000000d055dd5500005500000055000a5d00d5a","0160061011a00a11a610016a06a00a60aa1aa1aa111661110a1aa1a006a66a60","c100001c0010010000c00c00c600006c11111111111661110010010000100100","000770007dd00dd7ddd00ddd0000000000077000000550007000000750000005","11000011dd0000dd00011000000dd000000aa00000011000000aa00011100111","1000000110000001a000000a1000000166600666600000066000000610066001","0dd00dd00dc00cd00005500000055000d550055dd550055dccd00dccd000000d","5555555550000005500000050556655005566550055555509009900950066005","81100118000000000000000000d11d00110dd011dd0110dd8d0000d8d800008d","700000077000000707d77d7007d77d700000000070077007100dd001700dd007","0aaaaaa0aa1001aa1a1001a10dd00dd0a00dd00a100dd0010000000000000000","000dd0000aaaaaa0055dd55005500550d00dd00dd00dd00d0dd55dd00dd55dd0","0969969006911960900990099006600900000000969009699660066906966960","dd7007dd750000575500005500077000005dd5000057750077000077d500005d","000cc0000006600000066000c000000c00000000000000000c5cc5c00c5cc5c0","055dd5500550055005900950000990000550055005500550d005500d90055009","000dd00000055000c5c00c5c555005555cd00dc5000000000000000050000005","05d00d500d5005d00d5005d00007700077d00d77ddd00ddd0000000000000000","005005000050050000b55b0000b55b00006006005600006565000056b500005b","1116611111966911911001191110011100000000600110066001100600066000","011111100a1aa1a0000000000000000066166166061001600a6006a060000006","1c1cc1c1c11dd11cc000000c1000000101c00c10d11dd11dd11dd11d00000000","00011000000110001001100110077001111dd111011dd1100171171011d00d11","0da55ad00d5555d0daa00aaddd5005dd00000000000dd000000dd000d00dd00d","55dddd5505dddd5005dddd5090000009500dd00550099005000dd00000055000","005dd500005dd50000d55d00dd0550dd000000000000000000d00d0000500500","00555500005555005a6006a5566006650050050056055065a605506a00a00a00","009009000005500000055000559dd95559999995555dd55500dddd0000d99d00","055dd550055dd5500550055005500550b000000b50055005500550050b5005b0","00000000000000006b0bb0b66b0bb0b6000000001b1001b11b1001b111166111","0001100000099000001991000019910000166100110000111100001166111166","000000000011110000dddd001aaaaaa100000000000000000000000000000000","d1c11c1dd111111d00011000000110000000000000011000000110001cd00dc1","0050050000055000000550000005500000d00d0000c00c00dc0000cddc0000cd","0060060000699600009119001900009100000000000000006601106669099096","dd0000dddd0000dd111111111111111100000000ddd11dddddd11dddddd00ddd","01a00a1010011001100dd001a000000a1daddad1ddddddddddd00dddddd00ddd","6006600650066005500000055000000505600650000550000006600007677670","d000000dd555555d95955959d00dd00d90000009d000000d0005500000055000","00d00d001d0000d11b0000b1bdd00ddb0001100000011000110dd011110dd011","6100001600166100006116006660066616066061660110660000000000000000","0660066006600660666556666665566606666660068008600660066000055000","06655660055555500550055006600660500aa005000000000000000060000006","01100110100660011006600106c00c6060000006600000061116611111166111","05a00a50066556600a6aa6a00005500000066000000aa0006005500660055006","1a1001a111a00a11a110011aa1a00a1a60066006100000011000000161100116","111dd111000000000000000011111111110110111101101111d00d1181800818","550dd055550dd0550000000000000000009dd900000000000000000059d00d95","d00dd00dd00dd00d0000000000000000000dd000d000000d1000000111900911",
						"1006600110088001100880011161161101111110088888800001100000011000","6860068606655660066666600860068060066006800880085000000550000005","00d00d0000d00d00dd9009ddddd00ddd000550000099990000999900ddd55ddd","1006600170066007111661111176671100077000661111666671176667100176","5000000550000005500000056000000600000000055665500666666000000000","61c11c16c110011c61100116c101101c00000000000000000000000000000000","00b00b0000100100d101101d1d0110d100100100111001111bb00bb100b11b00","000660000b1001b00b1001b06b6bb6b610000001100000010000000000000000","570770757d0dd0d7000770000005500000700700005dd500005775005dddddd5","00dddd0000dbbd001db00bd1bdd00ddb00d00d00b111111bd1b11b1dd10dd01d","100000016000000666666666116116110000000000011000000bb00000000000","00000000000dd00000055000d005500d0adaada005adda50055005500da00ad0","11d00d11d7d00d7d0000000000000000dd7007dd000110000007700000d11d00","08d88d80000880000005500080055008500000055000000550088005d00dd00d","6666666666666666055665500556655050066005b5b66b5bb556655b00000000","5500005566055066660550660085580055800855586006850055550000855800","011111100110011001100110a1a00a1adda00adda1d00d1aa1d00d1adda00add","ddd00ddddda00addd000000dd000000d0d5dd5d0000dd000000550000aa00aa0","91d00d199190091900011000000dd0000000000000999900001dd10000900900","00000000000000005dddddd55d8dd8d500d00d00550000555500005585000058","500dd005000550000005500000055000500cc005c00dd00c000dd000000dd000","0070070000600600000660000006600000077000670000766500005677777777","cc0cc0cc110dd0111c0cc0c11111111100d00d0000d00d00000dd000000cc000","000aa00000000000000000000000000055d00d55ddd00ddd00055000000dd000","110660116606606600c00c0000c00c006600006600c00c000060060011c00c11","000aa000000dd000001dd100001aa100d110011daa1001aa11a00a11110dd011","0068860016600661166006610000000000011000000110000001100000066000","d750057dd55dd55d577777755dddddd500055000000550000005500000077000","91100119009dd90000d99d00190990911d0110d11d0110d1199999911dd11dd1","0006600069000096660000665506605500000000000000006605506696055069","1b0000b166600666666006666660066600000000000000000000000000000000","0000000055000055d500005d000dd0000000000000000000ddd00ddd75700757","0000000000000000d710017d7d1001d771dddd1771dddd17111dd111001dd100","00d00d0000d00d0000d00d0000d99d00000dd000000dd000d50dd05d99099099","111dd111000aa00000011000da1001ad0010010000a00a000000000000000000","555665555a5aa5a5555555550000000000600600006006000000000000000000","660660666b0000b66b0000b6000110000066660000b11b00006bb600006bb600","c000000c00066000000550005555555560066006600cc006c666666c5c6cc6c5","0091190000166100001661000066660000966900911001196960069666000066","56000065a500005aa500005a5550055566a66a66aa6aa6aa66a00a6666600666","000aa00060055006600aa00666500566600aa006a006600a0006600000066000","5696696595555559555005556590095695955959650000569600006900966900","aa0000aa006aa600006666005660066556655665aa6aa6aa0050050000500500","0001100000d00d00001001000010010000000000000000000000000000000000","0005500055655655576776750060060000066000000550005555555555766755","0066660000666600000550000005500000b66b00006006000060060000055000","50077005055dd550057dd75075dddd570d7557d00dd55dd0dd5555dddd7557dd","6611116676166167660660661106601100666600000660000001100071611617","6000000611966911111661111000000166111166969119690190091001100110","dd0000dddd0000dd000990000009900000d00d0000d55d0000955900dd0dd0dd","c555555c66c55c6606c55c600cccccc060055006000000000000000006c55c60","00000000000000000550055005a00a50500aa005556556555565565506500560","000000000055550000a55a000060060000500500005005000050050000500500","000dd00000111100001991009110011900dddd0000dddd0019d99d9119d99d91","0570075057d77d7557777775d000000d70000007d000000d0570075005700750","6606606655055055550550555c0cc0c555555555550550556606606600500500","5000000550000005000dd000000dd000d005500dd005500d500dd00505adda50","0000000000000000d000000dd000000d55dddd559d5005d9dd5005dd000dd000","11cddc11dcdccdcddd0000dddd0000dd00c00c00d101101d1d0dd0d100d00d00","d11dd11dd717717d00711700007777001dddddd11d7dd7d11111111100000000","666006666b0000b66100001600066000b110011b6b1001b6bb1bb1bb1bbbbbb1","55c00c55555555556c5cc5c66c0000c6cc5cc5cc566666655c6006c5c660066c","1100001166000066660000666700007600111100111111117166661717600671","5dd55dd50dddddd00dddddd000055000c000000c50000005c550055c55c00c55","007007000000000000000000000dd00000d00d0000d00d000000000000000000","6600006600066000000770007600006767077076660660660070070000600600","1dddddd188100188811001180d8008d000088000000110000001100000011000","00dddd0000dddd00dd5005dddd5005ddd858858d00d55d0000888800000dd000","000000000000000005d00d500580085000000000dd5555dddd5555dd800dd008","7000000760000006000660000006600006755760700550076005500660000006","0008800000088000000110001100001100000000000000008601106811066011","b001100bd00bb00ddb1bb1bdbdd11ddb0db00bd0d00dd00d100dd00111100111","1d0000d1177777717111111700000000111111111dddddd100d00d0000d00d00","61b11b1666b66b66b666666b61b11b1666b00b6600011000000bb00001b11b10","0000000000011000000990006660066600900900001001000000000000000000","b660066bb600006b66000066001001001bb00bb1111001110000000000000000","11dddd1111dddd110088880000dddd0000088000881001888810018811011011","0850058005500550055555500555555080000008085005800550055008588580","dc0000cddc0000cd000cc000000cc00000c00c00cc0000ccdd0000ddcdc00cdc","000000000d1001d00d1001d00710017077d00d77dd7007dd00077000000dd000","d5c00c5ddcc00ccdd000000dd000000d05555550055005500550055000000000","000000000050050000500500dc5cc5cd55000055dd0000ddcc0000cccd0000dc","6000000610066001100660010000000090011009100110019009900990066009","bb6006bb06b00b60066006605005500560055006600bb006b000000b60000006","d555555dd5c55c5d00c00c0000d00d0055555555c550055c5c5005c500d55d00","a160061a66a66a66a616616a0666666006a00a60066006600001100000011000","1cdccdc10cdccdc00cdccdc00dcddcd0c00dd00cd00dd00d1000000110000001","11d00d11d007700dd007700dd7d00d7d000000000000000001dddd1001dddd10","0110011009100190111661116999999600000000100000011000000101100110","001dd100d7d00d7dd7d00d7d71100117d100001dd100001d77d00d77ddd00ddd","a101101aa606606a6a6006a6666006661a6006a1aa6006aa6a6006a66a0aa0a6","1180081168100186800000088000000811600611100880011006600110066001","1d0000d1000cc000000cc000111111111dc00cd11110011100cddc00001dd100","0000000000555500005aa500005aa500000000000000000055d00d55dda00add","9660066956600665006996000066660000000000655005565660066500699600","a50dd05ad50dd05d000000000000000000dddd00000550000005500000555500","000000000000000000011000000bb000d11dd11d00dddd0000dddd0000100100","0000000000000000a6a00a6a5660066566600666000aa0000006600000000000","0760067006700760061001600000000070077007100770010111111007677670","0005500000055000b000000bb000000b5550055550000005b000000bd5b00b5d",
						"0000000000a55a0000aaaa006aa00aa66a6aa6a65565565555a55a55aa6aa6aa","0001100006611660066666606000000610011001700660077710017717100171","d555555d5d0000d55d0000d5000000000050050000500500950dd05999099099","05555550055555505008800550088005800dd0080dd00dd00dd00dd005555550","d001100d0d7117d00d1111d00000000000000000000000000000000000000000","0060060000600600000110000006600069000096666116669116611900000000","0bd00db00dd00dd0100dd001100dd001d000000db000000b1000000110000001","00055000000550000dd00dd00da00ad005a00a500ad00da00dd00dd0500dd005","d00cc00d0111111001c11c10100dd001000000000000000010000001c000000c","005665005550055566600666bb6bb6bb5b0bb0b55506605500b66b00005bb500","99d99d9999d99d990000000000000000ddd55ddd000dd000000dd000000dd000","1100001119000091000990000001100096000069006666000096690000611600","000660000006600066066066b606606b00000000001bb100006666006b0000b6","0666666066600666b660066bb6b55b6b5b5bb5b5666556660665566005555550","0000000005b55b500bbbbbb0000660000bb00bb00b6006b00b6006b005600650","55000055550000556605506666055066550000550060060000c00c0000000000","5566665555b66b550660066006b00b6000000000000000000000000006600660","55500555005cc50000cddc0055000055d500005dd500005d00055000000dd000","0060060055055055550660550066660069600696666006666900009655000055","0bdbbdb000011000000110000dd00dd000011000000bb0000bd00db00bd00db0","001dd100001dd10000d00d0000d00d0000adda0000011000000aa00000a11a00","0000000000000000750000575500005500077000550dd055550dd055000dd000","dd1111ddddc11cddcc0cc0cccc0cc0ccddd00ddd000000000000000011c00c11","dd1001dd0010010000d00d00110dd0110090090000d00d000000000000000000","bdb00bdb000bb000000dd000110dd0111bbbbbb1111111110000000000000000","0060060000600600196996911666666100011000611001169110011916011061","0058850000555500005dd500000dd0008dddddd8d555555d0080080000500500","1d0000d11dddddd1911dd119910dd01900111100009119000001100000011000","0005500000055000b000000b50000005500bb005bb6bb6bbb566665bb000000b","aa0000aa00d00d0000a00a005a0aa0a500a00a0000d00d0000d55d0000aaaa00","000000000000000011b00b1111b00b110db00bd00001100000011000b000000b","d000000d00011000000110000d9009d000000000000000001910019199900999","d00dd00dd00dd00dd550055dd550055d0000000055a55a55a5a55a5a000aa000","0000000000000000999999996919919600000000061111600661166000000000","8d5dd5d858d88d8588d88d88558dd8550080080000588500005dd500dd0dd0dd","055555500550055007500570d000000d57d00d75ddd00ddd000dd00000055000","00600600556666555a5aa5a555a55a555aaaaaa5556556555505505566066066","5005500550055005666556667777777750000005500000057000000705655650","0adaada010011001a001100a0000000011111111111111111aaaaaa11dddddd1","00000000c600006cc600006c000cc00000000000000000000000000000000000","00066000000cc000c555555c5565565560066006600cc006c006600c66666666","1808808118088081006006000080080088600688006116000068860086000068","000000000000000000000000000000000d1001d0111001111710017110011001","6570075600500500006006006605506600500500006006005676676565566556","00d11d0000111100d100001d99000099d110011d0010010000d00d009dddddd9","00c55c0000d00d0000d00d00c500005c00c00c00005005000000000000000000","c005500cc00cc00c000660000006600055566555000660000005500060055006","000000001c6006c1c6c00c6c06611660c660066cc110011c0000000000000000","1dddddd1d717717dd111111d711dd1170110011011100111ddd00dddd7d00d7d","0110011007100170700660076006600660011006600000066000000600000000","00000000cd5dd5dcddd55ddd0000000055055055cd0dd0dcdd0000ddcc0000cc","d110011d00011000000cc000011dd11010000001c000000c0000000000000000","0009900000011000110110111909909111d11d11119119119d9dd9d9dd0000dd","00000000000dd000000dd00000000000008dd80000d88d000000000000000000","000000000000000011600611a6a00a6a6601106600a00a0000a00a001a1aa1a1","0000000000000000000000000000000076600667610000166100001600011000","00055000000dd00000700700005005007d7557d70000000000000000000dd000","000cc000000dd00000d00d0000d00d0000c00c000000000000000000000dd000","0061160000666600666006669660066991066019911661196116611600000000","05d55d5075d55d57dd5dd5dd0d7007d0055005500dd00dd0d00dd00d700dd007","55055055550550550070070000d00d005dd00dd5000000000000000000055000","00d00d00a50dd05ada0aa0ad00000000ad0dd0daad0dd0da00d00d0000d00d00","9d9009d991100119011001100d1001d011100111100dd0011001100190011009","dd5005ddd000000dc000000c0550055050000005d000000d0000000000000000","5cd00dc5cdc00cdc5d0000d55c0000c500d00d00dc5005cdcc5005ccd5cddc5d","00d11d00dd0110dd910dd019d10dd01d00d99d00001991000000000000000000","a100001aaa0000aaaa0aa0aa1d0dd0d1000dd000110110111a0aa0a100011000","0dddddd0000dd000000dd0000dbddbd00000000000000000000dd000000bb000","0000000000dbbd0000dbbd00000dd0000000000000000000dd0dd0ddbd0dd0db","55555555dd5005dddd5005dd55dddd55dd5dd5dddd5dd5ddc000000c50000005","09d99d9005dddd50500dd00550099005d000000ddd9559dd99d99d9905d00d50","0dd11dd00dd11dd01000000110000001d000000dc000000cc000000cc000000c","00011000000bb000000dd000000110000dddddd0d00dd00dd00bb00d000bb000","c110011c11c00c11001cc100001cc10000d11d000010010000100100dc0000cd","00a00a00dd0000dddd0000dd1a1aa1a10000000000000000dd0000dddd0000dd","1990099111900911000000000000000060099006600000061000000101100110","11d11d1100d11d00001dd100da1aa1ad0000000000000000000aa00000011000","660000666c0000c655000055c500005c000cc00055555555c555555c55c66c55","0000000000000000d000000da000000a11adda11a00aa00ad001100dd000000d","1660066116600661a1a00a1a61100116600aa006100110010000000000000000","bb1001bbb001100bd00bb00d01d11d10000dd000000bb00001d00d100bd00db0","5b5bb5b500055000000bb00000000000db5005bdd5b00b5dd000000db000000b","5808808555055055005005000080080000000000865005686650056600800800","0655556060055006900660090000000090055009500550050000000000000000","a000000ad000000d00000000000000000001100001a11a100dddddd0ada00ada","0006600080000008600000060580085006655660068558605550055555500555","b116611b1116611116b11b611bbbbbb10006600000066000000bb00000611600","01d00d1001800810800000081000000111d00d1101d00d100d1001d0dd1dd1dd","dda00addadd00ddaa50dd05a5a0aa0a5005aa500000aa000000dd000550dd055","6556655666666666006666000069960000000000009009000060060066000066","0a1001a00da00ad0dddddddd1aaaaaa1dadaadad0dd00dd00110011001111110","0110011001100110600110061006600190000009011111100661166000000000","0171171070066007600660061000000161166116611661160000000000000000","0006600000066000681881866116611611000011006006000080080000011000","d000000d5000000555755755757557575000000575d00d57dd5005ddd000000d","1000000190000009011111100161161006966960000000000000000006600660","0c6006c00c6006c001100110000110000000000000000000100cc001c001100c","5556655566555566b655556b005665000060060000b00b006b0000b6b600006b","6770077666611666667667667006600760000006100000010110011001700710","6176671600166100001111000007700000100100006006000060060000100100"];
		
		function getInvaders() {
			let allInvaders = [];
			for(let i=0; i<invaders.length; i++) allInvaders.push(fillinInvader(invaders[i], i));
			return allInvaders;
		}
		function getInvader(index) {
			return fillinInvader(invaders[index], index);
		}
		
		function generateInvader(num) {
			let colors = getColorsTri();
			let invaderGrid = [];
			for(let y=0; y<8; y++){ invaderGrid[y] = []; for(let x=0; x<8; x++) invaderGrid[y][x] = '0'; }
			
			let backGrid = [];
			for(let y=0; y<5; y++){ backGrid[y] = []; for(let x=0; x<5; x++) backGrid[y][x] = '0'; }
			for(let y=0; y<5; y++) {
				for(let x=0; x<2; x++) {
					let color = Math.floor(Math_random()*2) ? '0' : colors[0];
					backGrid[y][x] = color;
					backGrid[y][4-x] = backGrid[y][x];
				}
				for(let x=2; x<=2; x++) {
					let color = Math.floor(Math_random()*2) ? '0' : colors[0];
					backGrid[y][x] = color;
				}
			}
			
			let midsGrid = [];
			for(let y=0; y<5; y++){ midsGrid[y] = []; for(let x=0; x<5; x++) midsGrid[y][x] = '0'; }
			for(let y=0; y<5; y++) {
				for(let x=0; x<2; x++) {
					let color = Math.floor(Math_random()*2) ? '0' : colors[1];
					midsGrid[y][x] = color;
					midsGrid[y][4-x] = midsGrid[y][x];
				}
				for(let x=2; x<=2; x++) {
					let color = Math.floor(Math_random()*2) ? '0' : colors[1];
					midsGrid[y][x] = color;
				}
			}
			
			let highsGrid = [];
			for(let y=0; y<8; y++){ highsGrid[y] = []; for(let x=0; x<8; x++) highsGrid[y][x] = '0'; }
			for(let y=0; y<8; y++) {
				for(let x=0; x<4; x++) {
					let color = Math.floor(Math_random()*4) ? '0' : colors[2];
					highsGrid[y][x] = color;
					highsGrid[y][4-x] = highsGrid[y][x];
				}
				for(let x=4; x<=4; x++) {
					let color = Math.floor(Math_random()*4) ? '0' : colors[2];
					highsGrid[y][x] = color;
				}
			}
			
			//////////////
			let f1 = Math.floor(Math_random()*2) ? true : false;
			let f2 = Math.floor(Math_random()*2) ? true : false;
			for(let y=0; y<8; y++) {
				let x=0;
				let bX=0;
				let bY = Math.round((y/8)*5);
				let mY = f1 ? y : (7-y);
				
				x = 0;
				bX = 0;
				invaderGrid[mY][x] = backGrid[bY][bX];
				invaderGrid[mY][7-x] = invaderGrid[mY][x];
				
				x = 1;
				bX = f2 ? 1 : 0;
				invaderGrid[mY][x] = backGrid[bY][bX];
				invaderGrid[mY][7-x] = invaderGrid[mY][x];
				
				x = 2;
				bX = 1;
				invaderGrid[mY][x] = backGrid[bY][bX];
				invaderGrid[mY][7-x] = invaderGrid[mY][x];
				
				x = 3;
				bX = 2;
				invaderGrid[mY][x] = backGrid[bY][bX];
				invaderGrid[mY][7-x] = invaderGrid[mY][x];
			}
			
			//////////////
			f1 = Math.floor(Math_random()*2) ? true : false;
			f2 = Math.floor(Math_random()*2) ? true : false;
			for(let y=0; y<8; y++) {
				let x=0;
				let bX=0;
				let bY = Math.round((y/8)*5);
				let mY = f1 ? y : (7-y);
				
				x = 0;
				bX = 0;
				invaderGrid[mY][x] = invaderGrid[mY][x] != '0' ? (midsGrid[bY][bX] != '0' ? midsGrid[bY][bX] : invaderGrid[mY][x]) : invaderGrid[mY][x];
				invaderGrid[mY][7-x] = invaderGrid[mY][x];
				
				x = 1;
				bX = f2 ? 1 : 0;
				invaderGrid[mY][x] = invaderGrid[mY][x] != '0' ? (midsGrid[bY][bX] != '0' ? midsGrid[bY][bX] : invaderGrid[mY][x]) : invaderGrid[mY][x];
				invaderGrid[mY][7-x] = invaderGrid[mY][x];
				
				x = 2;
				bX = 1;
				invaderGrid[mY][x] = invaderGrid[mY][x] != '0' ? (midsGrid[bY][bX] != '0' ? midsGrid[bY][bX] : invaderGrid[mY][x]) : invaderGrid[mY][x];
				invaderGrid[mY][7-x] = invaderGrid[mY][x];
				
				x = 3;
				bX = 2;
				invaderGrid[mY][x] = invaderGrid[mY][x] != '0' ? (midsGrid[bY][bX] != '0' ? midsGrid[bY][bX] : invaderGrid[mY][x]) : invaderGrid[mY][x];
				invaderGrid[mY][7-x] = invaderGrid[mY][x];
			}
			
			///////////////////
			for(let y=0; y<8; y++) {
				for(let x=0; x<4; x++) {
					let bX = x;
					let bY = y;
					invaderGrid[y][x] = (invaderGrid[y][x] != '0') ? (highsGrid[bY][bX] != '0' ? highsGrid[bY][bX] : invaderGrid[y][x]) : invaderGrid[y][x];
					invaderGrid[y][7-x] = invaderGrid[y][x];
				}
			}
			
			let invaderId = gridToId(invaderGrid);
			return fillinInvader(invaderId, num);
		}
		
		function fillinInvader(invaderId, num) {
			let analysis = invaderAnalysis(invaderId);
			return {
				id: invaderId,
				number: num,
				level: analysis.level,
				levelRarity: analysis.levelRarity,
				type: analysis.type,
				typeColor: analysis.typeColor,
				typeRarity: analysis.typeRarity,
				skill: analysis.skill,
				skillColor: analysis.skillColor,
				range: analysis.range,
				rangeColor: analysis.rangeColor,
				skillRangeRarity: analysis.skillRangeRarity,
				rarityScore: analysis.rarityScore,
				owner: (num > 900) ? '0x1a5805e6bE1f495b8346cEfA32F2a567c063598C' : '0x9f2fedFfF291314E5a86661e5ED5E6f12e36dd37'
			}
			
		}
		
		function invaderAnalysis(invaderId) {
			const attackDefense = ['6','d'];
			const longRangeShortRange = ['1','5'];
			const elementalTypes = ['7','8','9','a','b','c'];
			invaderId = formatInvaderId(invaderId).substr(2,64);
			
			let shadow = '0x';
			let level = 0;
			let typeColor = null;
			let skillColor = null;
			let rangeColor = null;
			for(let i=0; i<invaderId.length; i++) {
				shadow += (invaderId[i] == '0') ? '0' : '7';
				level += (elementalTypes.indexOf(invaderId[i]) > -1) ? 1 : 0;
				typeColor = (elementalTypes.indexOf(invaderId[i]) > -1) ? invaderId[i] : typeColor;
				skillColor = (attackDefense.indexOf(invaderId[i]) > -1) ? invaderId[i] : skillColor;
				rangeColor = (longRangeShortRange.indexOf(invaderId[i]) > -1) ? invaderId[i] : rangeColor;
			}
			level = level/2;
			
			let type = 'Ancient';
			if(typeColor == '7') type = 'Metallum Alloy';
			else if(typeColor == '8') type = 'Ignis Magma';
			else if(typeColor == '9') type = 'Sicco Solar';
			else if(typeColor == 'a') type = 'Lectricus Zap';
			else if(typeColor == 'b') type = 'Silva Brush';
			else if(typeColor == 'c') type = 'Imber Drench';
			
			let skill = 'Versatile';
			if(skillColor == '6') skill = 'Attack';
			else if(skillColor == 'd') skill = 'Defense';
			
			let range = 'All Range';
			if(rangeColor == '5') range = 'Long Range';
			else if(rangeColor == '1') range = 'Short Range';
			
			let typeRarity = 16.15;
			if(!typeColor) typeRarity = 3.1;
			
			let levelRarity = null;
			if(level == 1) levelRarity = 9.21;
			else if(level == 2) levelRarity = 15.08;
			else if(level == 3) levelRarity = 18.00;
			else if(level == 4) levelRarity = 17.17;
			else if(level == 5) levelRarity = 13.93;
			else if(level == 6) levelRarity = 9.93;
			else if(level == 7) levelRarity = 6.33;
			else if(level == 8) levelRarity = 3.65;
			else if(level == 9) levelRarity = 1.93;
			else if(level == 10) levelRarity = 0.93;
			else if(level == 11) levelRarity = 0.44;
			else if(level == 12) levelRarity = 0.19;
			else if(level == 13) levelRarity = 0.07;
			else if(level == 14) levelRarity = 0.03;
			else if(level == 15) levelRarity = 0.01;
			else if(level > 15) levelRarity = 0.001;
			
			let skillRangeRarity = 24.3;
			if(!skillColor && rangeColor) skillRangeRarity = 1.41;
			else if(skillColor && !rangeColor) skillRangeRarity = 1.41;
			else if(!skillColor && !rangeColor) skillRangeRarity = 0.01;
			
			let rarityScore = level;
			if(level >= 15) rarityScore += 700; //crazy high level < 0.014
			else if(!skillColor && !rangeColor) rarityScore += 600; //all range versatile 0.014
			else if(level >= 13 && level <= 14) rarityScore += 500; //levels 13to14 0.03-0.07
			else if(level == 0 && (!skillColor || !rangeColor)) rarityScore += 400; //all range or versatile ancient 0.17
			else if(level >= 9 && level <= 12) rarityScore += 300; //levels 9to12 0.19-1.93
			else if(level > 0 && (!skillColor || !rangeColor)) rarityScore += 200; //all range or versatile 2.8
			else if(level == 0) rarityScore += 100; //ancient 3.1
			
			return {
				shadow: shadow,
				level: level,
				levelRarity: levelRarity,
				type: type,
				typeColor: getColorFromHex(typeColor),
				typeRarity: typeRarity,
				skill: skill,
				skillColor: getColorFromHex(skillColor),
				range: range,
				rangeColor: getColorFromHex(rangeColor),
				skillRangeRarity: skillRangeRarity,
				rarityScore: rarityScore
			}
		}
		
		function getColorsTri() {
			const base = ['1','5'];
			const mids = ['6','d'];
			const highs = ['7','8','9','a','b','c'];
			
			let colors = [];
			colors.push(base.splice([Math.floor(Math_random() * base.length)], 1));
			colors.push(mids.splice([Math.floor(Math_random() * mids.length)], 1));
			colors.push(highs.splice([Math.floor(Math_random() * highs.length)], 1));
			return colors;
		}
		
		function gridToId(grid) {
			let invader = '';
			for(let y=0; y<8; y++) {
				for(let x=0; x<8; x++) {
					invader += grid[y][x];
				}
			}
			return '0x' + invader;
		}
		
		function getColorFromHex(hex) {
			if(hex == '0') return '#000000';
			if(hex == '1') return '#1D2B53';
			if(hex == '2') return '#7E2553';
			if(hex == '3') return '#008751';
			if(hex == '4') return '#AB5236';
			if(hex == '5') return '#5F574F';
			if(hex == '6') return '#C2C3C7';
			if(hex == '7') return '#FFF1E8';
			if(hex == '8') return '#FF004D';
			if(hex == '9') return '#FFA300';
			if(hex == 'a') return '#FFFF27';
			if(hex == 'b') return '#00E756';
			if(hex == 'c') return '#29ADFF';
			if(hex == 'd') return '#83769C';
			if(hex == 'e') return '#FF77A8';
			if(hex == 'f') return '#FFCCAA';
			return null;
		}
		
		function Math_random() {
			return Math.random();
		}
		
		function sleep(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		///////////////////////////////////////////
		// Utils (transaction data transformers) //
		///////////////////////////////////////////


		// Adds data to return for create transaction
		async function addInvaderDataForMint(params, data) {
			//scan event logs for data
			//let pixelcon = {};
			//let contractInterface = await web3Service.getContractInterface(_contractPath);
			//for (let i = 0; i < data.logs.length; i++) {
			//	let event = contractInterface.parseLog(data.logs[i]);
			//	if (event.name == "Create") {
			//		pixelcon.id = web3Service.to256Hex(event.args["_tokenId"].toHexString())
			//		pixelcon.index = event.args["_tokenIndex"].toNumber();
			//		pixelcon.name = web3Service.toUtf8(params.data.name),
			//		pixelcon.creator = web3Service.formatAddress(event.args["_creator"]);
			//		pixelcon.owner = web3Service.formatAddress(event.args["_to"]);
			//		pixelcon.collection = null;
			//	}
			//}
			
			//set pixelcon data
			//data.pixelcons = [pixelcon];
			return data;
		}

		// Adds data to return for transfer transaction
		async function addInvaderDataForTransfer(params, data) {
			//fetch pixelcon
			//let pixelcon = await fetchPixelcon(params.pixelconIds[0]);
			
			//scan event logs for data
			//let contractInterface = await web3Service.getContractInterface(_contractPath);
			//for (let i = 0; i < data.logs.length; i++) {
			//	let event = contractInterface.parseLog(data.logs[i]);
			//	if (event.name == "Transfer") {
			//		pixelcon.owner = web3Service.formatAddress(event.args["_to"]);
			//	}
			//}

			//set pixelcon data
			//data.pixelcons = [pixelcon];
			return data;
		}

		// Adds data to return for the given transaction
		async function addInvaderDataForTransaction(transaction, returnData) {
			if (transaction.type == _mintTypeDescription[0]) return await addInvaderDataForMint(transaction.params, returnData);
			if (transaction.type == _transferTypeDescription[0]) return await addInvaderDataForTransfer(transaction.params, returnData);
			return returnData;
		}
	}
}());
