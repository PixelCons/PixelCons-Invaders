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
						resolve(generateInvaders());
						
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while fetching Invaders');
					}
				}
			});
		}

		// Gets the details for the given invader id
		function fetchInvader(id) {
			let index = Number.isInteger(id) ? id : null;
			id = formatInvaderId(id);
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (id === null && index === null) reject(_invalidIdError);
				else {
					try {
						let chainId = web3Service.getMainNetwork(_networkIndex).chainId;
						let contract = await web3Service.getContract(_contractPath, chainId);
						
						//TODO
						//let total = (await contract.errRetry.totalSupply()).toNumber();
						resolve({});
						
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
				for(let j=0; j<count; j++) testData[i].invaders.push(generateInvader());
			}
			return testData;
		}
		
		// Gets list of pixelcons for sale and their mintable invaders
		async function getPixelconsForSale() {
			await sleep(2000);
			let testData = [{
				id: '0x0d0000d00dd00de00dddddd00d0d0dd0117e71100d777dd0001edd1001ddddd1',
				price: 0.11,
				unit: 'Ξ',
				invaders: [null,null]
			},{
				id: '0x00999900099999909949090499499f229909ffff0044ffff049940e0499ff400',
				price: 0.21,
				unit: 'Ξ',
				invaders: [null,null,null,null]
			},{
				id: '0x03bbbb303b7bbbb3b3bbbb3bb70bb70bb30bb03b0bbbbbb000b33b00000bb000',
				price: 0.43,
				unit: 'Ξ',
				invaders: [null,null,null]
			},{
				id: '0x0d777d00677777607767767d767007076d6007070677707d000d776000006770',
				price: 0.632,
				unit: 'Ξ',
				invaders: [null,null,null,null]
			},{
				id: '0x0777776007bbb7d0073337d007bbb7d0077777d0078787d0077777d0067776d0',
				price: 1.1,
				unit: 'Ξ',
				invaders: [null,null,null,null,null,null]
			},{
				id: '0x00028000028880000027770004970700004977700002877000028777000d7777',
				price: 2.184,
				unit: 'Ξ',
				invaders: [null,null,null,null,null]
			},{
				id: '0x0d0000d00dd00de00dddddd00d0d0dd0117e71100d777dd0001edd1001ddddd1',
				price: 0.11,
				unit: 'Ξ',
				invaders: [null,null]
			},{
				id: '0x00999900099999909949090499499f229909ffff0044ffff049940e0499ff400',
				price: 0.21,
				unit: 'Ξ',
				invaders: [null,null,null,null]
			},{
				id: '0x03bbbb303b7bbbb3b3bbbb3bb70bb70bb30bb03b0bbbbbb000b33b00000bb000',
				price: 0.43,
				unit: 'Ξ',
				invaders: [null,null,null]
			},{
				id: '0x0d777d00677777607767767d767007076d6007070677707d000d776000006770',
				price: 0.632,
				unit: 'Ξ',
				invaders: [null,null,null,null]
			},{
				id: '0x0777776007bbb7d0073337d007bbb7d0077777d0078787d0077777d0067776d0',
				price: 1.1,
				unit: 'Ξ',
				invaders: [null,null,null,null,null,null]
			},{
				id: '0x00028000028880000027770004970700004977700002877000028777000d7777',
				price: 2.184,
				unit: 'Ξ',
				invaders: [null,null,null,null,null]
			},{
				id: '0x0d0000d00dd00de00dddddd00d0d0dd0117e71100d777dd0001edd1001ddddd1',
				price: 0.11,
				unit: 'Ξ',
				invaders: [null,null]
			},{
				id: '0x00999900099999909949090499499f229909ffff0044ffff049940e0499ff400',
				price: 0.21,
				unit: 'Ξ',
				invaders: [null,null,null,null]
			},{
				id: '0x03bbbb303b7bbbb3b3bbbb3bb70bb70bb30bb03b0bbbbbb000b33b00000bb000',
				price: 0.43,
				unit: 'Ξ',
				invaders: [null,null,null]
			},{
				id: '0x0d777d00677777607767767d767007076d6007070677707d000d776000006770',
				price: 0.632,
				unit: 'Ξ',
				invaders: [null,null,null,null]
			},{
				id: '0x0777776007bbb7d0073337d007bbb7d0077777d0078787d0077777d0067776d0',
				price: 1.1,
				unit: 'Ξ',
				invaders: [null,null,null,null,null,null]
			},{
				id: '0x00028000028880000027770004970700004977700002877000028777000d7777',
				price: 2.184,
				unit: 'Ξ',
				invaders: [null,null,null,null,null]
			},{
				id: '0x0d0000d00dd00de00dddddd00d0d0dd0117e71100d777dd0001edd1001ddddd1',
				price: 0.11,
				unit: 'Ξ',
				invaders: [null,null]
			},{
				id: '0x00999900099999909949090499499f229909ffff0044ffff049940e0499ff400',
				price: 0.21,
				unit: 'Ξ',
				invaders: [null,null,null,null]
			},{
				id: '0x03bbbb303b7bbbb3b3bbbb3bb70bb70bb30bb03b0bbbbbb000b33b00000bb000',
				price: 0.43,
				unit: 'Ξ',
				invaders: [null,null,null]
			},{
				id: '0x0d777d00677777607767767d767007076d6007070677707d000d776000006770',
				price: 0.632,
				unit: 'Ξ',
				invaders: [null,null,null,null]
			},{
				id: '0x0777776007bbb7d0073337d007bbb7d0077777d0078787d0077777d0067776d0',
				price: 1.1,
				unit: 'Ξ',
				invaders: [null,null,null,null,null,null]
			},{
				id: '0x00028000028880000027770004970700004977700002877000028777000d7777',
				price: 2.184,
				unit: 'Ξ',
				invaders: [null,null,null,null,null]
			},{
				id: '0x0d0000d00dd00de00dddddd00d0d0dd0117e71100d777dd0001edd1001ddddd1',
				price: 0.11,
				unit: 'Ξ',
				invaders: [null,null]
			},{
				id: '0x00999900099999909949090499499f229909ffff0044ffff049940e0499ff400',
				price: 0.21,
				unit: 'Ξ',
				invaders: [null,null,null,null]
			},{
				id: '0x03bbbb303b7bbbb3b3bbbb3bb70bb70bb30bb03b0bbbbbb000b33b00000bb000',
				price: 0.43,
				unit: 'Ξ',
				invaders: [null,null,null]
			},{
				id: '0x0d777d00677777607767767d767007076d6007070677707d000d776000006770',
				price: 0.632,
				unit: 'Ξ',
				invaders: [null,null,null,null]
			},{
				id: '0x0777776007bbb7d0073337d007bbb7d0077777d0078787d0077777d0067776d0',
				price: 1.1,
				unit: 'Ξ',
				invaders: [null,null,null,null,null,null]
			},{
				id: '0x00028000028880000027770004970700004977700002877000028777000d7777',
				price: 2.184,
				unit: 'Ξ',
				invaders: [null,null,null,null,null]
			}];
			for(let i=0; i<testData.length; i++) {
				for(let j=0; j<testData[i].invaders.length; j++) {
					let invader = generateInvader();
					testData[i].invaders[j] = invaderAnalysis(invader.id);
				}
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


		// Converts to standard format of a given pixelcon id (or null if invalid)
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
		var allInvaders = [];
		function generateInvaders() {
			if(allInvaders.length == 0) {
				for(let i=0; i<1000; i++) allInvaders.push(generateInvader(i));
			}
			return allInvaders;
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
			let analysis = invaderAnalysis(invaderId);
			return {
				id: invaderId,
				number: (num===undefined) ? Math.floor(Math.random()*1000) : num,
				level: analysis.level,
				levelRarity: analysis.levelRarity,
				type: analysis.type,
				typeColor: analysis.typeColor,
				typeRarity: analysis.typeRarity,
				skill: analysis.skill,
				skillColor: analysis.skillColor,
				range: analysis.range,
				rangeColor: analysis.rangeColor,
				skillRangeRarity: analysis.skillRangeRarity
			}
		}
		
		function invaderAnalysis(invaderId) {
			const attackDefence = ['1','5'];
			const longRangeShortRange = ['6','d'];
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
				skillColor = (attackDefence.indexOf(invaderId[i]) > -1) ? invaderId[i] : skillColor;
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
			if(skillColor == '5') skill = 'Attack';
			else if(skillColor == '1') skill = 'Defence';
			
			let range = 'All Range';
			if(rangeColor == 'd') range = 'Long Range';
			else if(rangeColor == '6') range = 'Short Range';
			
			let typeRarity = 16.7;
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
			if(!skillColor && rangeColor) skillRangeRarity = 1.39;
			else if(skillColor && !rangeColor) skillRangeRarity = 1.39;
			else if(!skillColor && !rangeColor) skillRangeRarity = 0.01;
			
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
				skillRangeRarity: skillRangeRarity
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
		
		var randomIndex = 0;
		var randomNumbers = [0.4567210711258174,0.2910363828393543,0.43717304687105085,0.110790160119693,0.2753542912169804,0.5048609800280464,0.6098822780810658,0.016229760469312238,0.6036579620841032,0.1377566745117933,0.4172183065745414,0.07873217653328424,0.23465159674200398,0.46491710804037156,0.9315765674346528,0.8626878585897939,0.8728041564224858,0.07064295641000173,0.7850648190939982,0.08313975467060386,0.9500421502293581,0.07754063123970778,0.7127856419341143,0.7637449978578092,0.43429197129475905,0.9520427431276348,0.1441251898395246,0.16014277918116848,0.5577737702119203,0.0004354297007334029,0.36060974864522066,0.5137866585497006,0.6395823342839659,0.15600896244731266,0.9101188689061246,0.30092138146017366,0.4467884113915417,0.19219053460062052,0.1797476323846381,0.917596097029749,0.2854600613789584,0.8213416867499317,0.7679682223993527,0.09724069304898175,0.3548535735655318,0.2487602818829009,0.8308760755700613,0.4153918494099502,0.5656060606172768,0.4562355942747991,0.3479315922926207,0.20087017058901768,0.5396318288317992,0.03908022645919185,0.30907282942509906,0.21469646129155606,0.9420909326397475,0.7510775363125088,0.1923756600987303,0.10163282393106532,0.39035621696783696,0.024138629333203543,0.023573683478945506,0.20791914552533974,0.6158550598673314,0.8889015070704274,0.08958690277487014,0.6007454901303515,0.5885985016566162,0.612652847402887,0.0880786315335782,0.3020423385467248,0.6000307510935825,0.09987018133737857,0.36917386880832925,0.2841959073303544,0.4997233644515422,0.15470684352848263,0.25489641410201314,0.5747536374129005,0.765447505560352,0.24038021889092875,0.12674759237990285,0.33866015602217914,0.8823285806585903,0.22491151781594843,0.638084111347005,0.28980825141869815,0.1636811199401822,0.04742496458474288,0.43298736731841214,0.2994539953460662,0.600931731823938,0.14864718329495696,0.04557260332863744,0.6140952932516315,0.04503996534920662,0.38887822127283944,0.7414274019031621,0.6633431276188704,0.36597446058021843,0.5989231379701785,0.7979866306618393,0.19752364211875828,0.18601033895915076,0.3783230175458747,0.5449726305758802,0.13694236070346766,0.12271186332449147,0.6000507650758173,0.5760165553137377,0.3742746828042962,0.19982338871105387,0.31989708406609263,0.1115927092360054,0.21351176307691433,0.17926240333658727,0.7322634012543863,0.9199615107271115,0.14774196834564934,0.2003132091325368,0.516415664296868,0.3351515395194049,0.6416901898229161,0.690105826192033,0.9004603561108113,0.14990060797139404,0.893977778033624,0.21310507694252734,0.17865967746454792,0.9710559712943638,0.5899858782695877,0.15618911775978161,0.25950145097821675,0.08139794378963416,0.18403857650603084,0.681097219507413,0.2845673307754364,0.4531234006764375,0.23852718165745457,0.7316682290425525,0.8749148071013644,0.09185271859936828,0.1934976549540124,0.4045687027308176,0.27171100098017753,0.42764500500424507,0.6559415530048494,0.38926442396653504,0.8205150469443108,0.10639007882794815,0.6158774293060623,0.2817103632408833,0.19474922327106148,0.5123074030917769,0.9018128309997719,0.6178693751994218,0.7642271198961086,0.9363335008882747,0.0057550880279853,0.6326846253310716,0.21618087210167047,0.8370275799661926,0.8889395010213197,0.9082515078294755,0.31277672713718174,0.5661702344111532,0.6965969143036994,0.8062931209816218,0.4550191202452609,0.6606855481949692,0.005557639616690091,0.1918301104253326,0.44811907538684337,0.4882540997681417,0.04471134355912887,0.6834909883934439,0.7307317399429321,0.416665136470143,0.7852084751805832,0.21520275843461434,0.4133930912952706,0.7617538709924094,0.6181308277517354,0.49505414232487266,0.19398305620168665,0.6816354847625208,0.9781308647687965,0.31834233058845873,0.2014301533501055,0.22476248228524964,0.08390642673479021,0.5881143484699827,0.440199607642906,0.7564542477935976,0.9565810290881813,0.6492155284911794,0.12236181530841206,0.2995653105062166,0.9134190949674368,0.5702082163714015,0.42354429711421204,0.48640042592989774,0.029498945639583996,0.535306089558498,0.5603672275039078,0.4385326459273817,0.8328790860259205,0.8047054314324873,0.9213699032122007,0.8587862243997655,0.8022512185411999,0.2333386154007484,0.644560495329304,0.12002736331428232,0.603054658441353,0.8890287165067416,0.36721779777036545,0.026370493387667837,0.08819440674062484,0.7721082968550121,0.007490375460301513,0.6387138849834377,0.6476872002943315,0.10737956929584369,0.16864056402066474,0.38119045727324563,0.4264023488233626,0.7227487218243578,0.6371381837919752,0.9426324271137605,0.5957797518022665,0.8971943317372788,0.21254745650047857,0.3178991687722954,0.5464798123257413,0.4425437058328676,0.7254615142505205,0.4972145220749902,0.27955494392474023,0.6063638503867712,0.862597942572553,0.9912341507883295,0.4509933378556168,0.5731041561875447,0.29277201518166174,0.8197153851458359,0.7037260751475054,0.41357338993198667,0.7213740820643608,0.8424218925003137,0.7949475816032405,0.24874068960377205,0.5091742828764436,0.17172045540388114,0.061303931341458284,0.41134432565295387,0.9838524596447338,0.5709403756653928,0.9324044619113245,0.08501665729398877,0.19657645054941453,0.5426432702148236,0.514477757294932,0.21534278918770045,0.9855348210989863,0.3404386771329537,0.04389031247193942,0.2993396598525373,0.46136667649603313,0.8636922722932125,0.3581880259820307,0.3970260485291892,0.15398396247868362,0.12204961383852808,0.2031719742059488,0.6857622287711267,0.9006015644419421,0.728850239695068,0.722556339986816,0.3572020945667269,0.6575225944907019,0.32551904044465263,0.7980703372895317,0.8397490130207927,0.03491319077059307,0.7948721747180343,0.5688656951204176,0.6897585290894175,0.5865336316968286,0.3464279762056408,0.3818184953237107,0.08115746725521977,0.557570693906529,0.23606331929596513,0.3974326660030161,0.7076550633506555,0.24856685810072876,0.7112324520019455,0.31773577299852374,0.9918172483516676,0.722474822899754,0.36196912532887304,0.1775495262266169,0.4764019952034635,0.3140815519165423,0.4058745272735491,0.13087261747574086,0.04330889016605299,0.6596586118864918,0.31896125638384154,0.4021259097095782,0.32404522860170193,0.9310386005627742,0.24564904081977135,0.3825186124713973,0.5745093580867602,0.36536797111158825,0.8371332999485308,0.6647836127842266,0.7967946192285993,0.2970868562555016,0.0992948555439872,0.8466129963581663,0.1532876374794312,0.6489836395008954,0.5526833591920433,0.8894937974012769,0.8038425012525576,0.8913349855353252,0.653161353816536,0.5437661149470807,0.2670714149117577,0.8797563530340164,0.7213827510234141,0.4201373095075871,0.20726977576370653,0.9519242854746588,0.6566712179430223,0.5463732259629939,0.48772673267966127,0.6266212870515215,0.9614891012126932,0.8930797218028097,0.9259994027865708,0.8021648847284124,0.06635274768729027,0.6546559902803166,0.4929754479527346,0.9477216206608288,0.13224764794902155,0.35754579715910273,0.061139400095368,0.1444532204550557,0.21173633514349577,0.0641849053224468,0.68701988911684,0.8487303735616805,0.020054274945439543,0.710026551794732,0.25699722076526776,0.12253188123685943,0.5578806178050602,0.7136022034712173,0.4520722980469103,0.9082122061324331,0.4760129316131032,0.9019623609239955,0.8423187347122825,0.8824201601735466,0.8392667624253685,0.8580040841377046,0.23842205873589917,0.39131730911721174,0.04760913042324866,0.44120742051665873,0.2015022408877234,0.32175803986640394,0.6087199422149447,0.6347560193182167,0.8520986901302201,0.21715549370084064,0.022872436991991263,0.5557447355388878,0.5545619756016811,0.8404512203219463,0.9362277637642049,0.4755560463332118,0.394700878812295,0.19086017292499569,0.520706035480522,0.2331023878578551,0.7643612014600707,0.6083950268767855,0.3918477577442758,0.9112300978340178,0.9002255701401096,0.613672920580729,0.6837366616344254,0.0005746121556156059,0.35631393832546854,0.17523246622101118,0.017398888068897334,0.7937201129268601,0.5038280858425008,0.40545417927228833,0.4449460016743416,0.20336295763934387,0.22235625843330387,0.5983784896318263,0.9621309449674251,0.12381988057311522,0.43882055285645194,0.9101728829064313,0.009303761279480183,0.6401083808141059,0.0046964439316501405,0.24594254610505284,0.8117911741506592,0.5208651369622328,0.9879488602399746,0.7524187234883049,0.07957353078066554,0.35563547154545705,0.5430171211902424,0.5157586727317216,0.366595545235854,0.7086138039415755,0.3534463284404652,0.5593259782531907,0.7581193555397405,0.027470430060631656,0.16915360659273304,0.18380522880785488,0.5326111969066976,0.2742208099951946,0.873652466481359,0.7969360750005996,0.8350180119159978,0.7194990673863706,0.1957337110816768,0.8830434568916004,0.20695589712681484,0.11137828718176457,0.4464065256759171,0.1968309118661784,0.05030885933429752,0.27410095588480177,0.40704025466697646,0.38268307593377826,0.42541210592666023,0.725176060902297,0.3431665313460439,0.2597859711345485,0.1841779027578565,0.9938817712393502,0.5325057921498162,0.11130683602076252,0.4898693455698977,0.21986321796121278,0.48217621366918806,0.72061073564466,0.6900770011099324,0.1206479175959847,0.2007878558591245,0.3570490437043303,0.29197313019484383,0.6932448896716825,0.26425036433496785,0.40372545529568793,0.7014294375832653,0.8636052654459998,0.216948669891458,0.12951848455967108,0.18712654396654238,0.16579105180942655,0.8539112652927177,0.5269886804751944,0.23002593525509596,0.22006887400574104,0.8157052781436618,0.23865948133764503,0.6051344234158906,0.4130832917533027,0.3759660215199849,0.9772380533047276,0.8567979639708159,0.6981329413895223,0.6952705197377382,0.32157269916114983,0.46088416423908973,0.6674558582897656,0.8098619060794026,0.8423297042893882,0.611203374585159,0.27601335805165217,0.9419575520156918,0.2799991295372659,0.17509670292449764,0.820163932882338,0.19213697875055025,0.6176130169809713,0.42481348102732386,0.7501286504910241,0.7885003560577635,0.747026409456091,0.66077898433789,0.4016628790536392,0.9968253601477588,0.294383147091934,0.1875630041890366,0.8271635363786369,0.26423604803918566,0.20182199953495283,0.550339339732687,0.8115753459472603,0.02083900871726163,0.09406051901702384,0.9736461509041607,0.14907464733772313,0.8568112869953519,0.08619724746545532,0.7036005823642137,0.41042969148763286,0.632855236087174,0.059572192060594276,0.09911044878714903,0.8992557451907006,0.3089648114746266,0.23492307451386663,0.5565189110412101,0.3743395719484397,0.8107329747306895,0.22054465495842135,0.5405498135818076,0.4351091224088124,0.2260936335133037,0.5578104072747647,0.23190719469120769,0.004541362044911068,0.999393316771565,0.6914081945760502,0.04946401829072622,0.49446484597306495,0.17147008788353935,0.8775041950075242,0.020339942751788298,0.32715698625565404,0.9802095499387118,0.6262106939111656,0.7416425829219404,0.9909958691041039,0.36886145081412436,0.22570748352874537,0.5933870003832822,0.8207489830439207,0.8262921080230183,0.7978276971936444,0.3766729234851285,0.5044105380120005,0.7163809327744317,0.13309169762924022,0.3482682464502931,0.9014263888703553,0.17658097430794073,0.8329675340986697,0.35912068369745787,0.7125592495868207,0.7238587535896772,0.29382148574839495,0.9126804004703872,0.4960076643192539,0.46989475892856003,0.03613711145787035,0.9711151763630448,0.33437009354104363,0.14973885349054572,0.662603241588684,0.33237407863479085,0.1853108200135971,0.36150171185304725,0.14019850647277554,0.6620403333002611,0.19351562628626406,0.20606251628768701,0.7638632984712148,0.9615372425964583,0.6433470924852873,0.7908149477586579,0.8835468948539809,0.5567792238652591,0.832881537060042,0.6414986846643853,0.537946459240827,0.3818124887511263,0.2862498319290281,0.9293952905956091,0.6255559942497986,0.3015528921862176,0.40659612650094057,0.00981118141285564,0.47414124941352154,0.5566863964221256,0.7831739483476694,0.4821559477465529,0.4131462400895183,0.38591771591547097,0.4979163950756922,0.2665527283683138,0.8055490206240137,0.867039602225665,0.4935871872976938,0.14571041189062361,0.8928913769820437,0.8066051079150378,0.84748231718123,0.2949736551569955,0.7253165444597913,0.22538456862008793,0.5937934034119361,0.4509705094433867,0.5165968459620054,0.12348317020508515,0.39558226258932083,0.9822434656145926,0.9449612423051841,0.8946411533315961,0.028830418157080873,0.8159959551470639,0.6776701784689525,0.5227193796563903,0.2355825998312564,0.1574272596384405,0.47220282856188933,0.5402920073826465,0.8205166015536798,0.37082469775397353,0.8764225750897121,0.9520599008702189,0.5710095771549855,0.13127341868778286,0.12219651648513996,0.7425577048183789,0.3510668243103876,0.6984966197471725,0.11049234460804125,0.5204025710133375,0.0998572711256438,0.3446753940476024,0.4853993942662682,0.9376537597082011,0.02531582591915682,0.2590233926860812,0.02973285487850985,0.030336410781810486,0.4873316868205877,0.46367479009266765,0.9160950039360358,0.7742144288585229,0.3661222984337653,0.6582105397409057,0.26461991226113457,0.4895964369208745,0.5747841213833627,0.15064499196137837,0.39719472085461205,0.06522623614851186,0.9239725589676107,0.8485702448529506,0.989692543136627,0.002216356324038271,0.48462838021413446,0.1393644060818222,0.9630240989889189,0.6321505852705063,0.3192342551871845,0.9273814098077009,0.5203689606408948,0.6594867410787213,0.6043589968861216,0.30639535004717544,0.3952790135113171,0.3197020862881377,0.19819462595120263,0.3860149391599439,0.14053087848332346,0.892986493976133,0.5612120343546292,0.31607384589064114,0.30273825803588905,0.2032625867932223,0.3681986517244549,0.8202204386225442,0.41458140574460667,0.7606438963596653,0.13531750917889207,0.2917211850652328,0.1912484583436571,0.08062832755904092,0.6599279104861846,0.9144679709857784,0.36633111498004745,0.7024248857327917,0.35750409474879397,0.21368692763490227,0.521562803864708,0.4404217915401767,0.18686769666360714,0.2539621733202586,0.6472515814954631,0.4263728305656598,0.7436106758134586,0.28491802306151714,0.9739931896233607,0.9504078938230922,0.680140214055192,0.32183218710260997,0.6263397169123106,0.24836370983562994,0.5598757344255667,0.25430368718403495,0.799656154107971,0.33163414583021256,0.5706930208452945,0.6567189017729342,0.7157273950283451,0.8926745632798936,0.038626355288185144,0.7656008222168655,0.4561959201603589,0.7006217261887475,0.706366354262602,0.6954946171107566,0.2621803608522004,0.021098369942397444,0.9639771807704081,0.35753257952227235,0.5243215763363396,0.36622160696138173,0.11245975233583172,0.6432471152537413,0.044054353214102226,0.10270675534838025,0.6651222385856099,0.4349107590271155,0.3835789743487017,0.5671138299115723,0.28034457044978955,0.5081460871720196,0.09347698942119576,0.9802855770257335,0.7254882147690584,0.6860165600282742,0.23109307003267854,0.7901913369998019,0.02615248775786605,0.8766031472794213,0.7177420041507379,0.8317359104847684,0.20627490785962665,0.134273500409138,0.9968601361104257,0.23118971579759107,0.5820494075821097,0.7794214979047818,0.895718660098072,0.851165411586543,0.08678092557136563,0.6306686916529469,0.4073146428006049,0.23679172511083402,0.9897360398987969,0.770702125762756,0.6074606941865293,0.19709568318425008,0.5640713244519666,0.8066208867471925,0.44529583300488995,0.6894990275668622,0.6705145141374658,0.09730160413365807,0.9607667060236336,0.41324168668926964,0.33308980310523895,0.027187851480879877,0.3758257867423278,0.029382750985445627,0.6004755487871201,0.9768752326077872,0.3369622481689354,0.918902668829475,0.5439861073335666,0.13931802093782486,0.736165056292412,0.5495485157888516,0.6909299493904033,0.585837681644225,0.7680414773202757,0.4974389291585928,0.7584752412172304,0.9773570631060313,0.6556204109399277,0.8835808931923599,0.36747230401384967,0.12013800576450273,0.8110260438637624,0.20950399571369638,0.8240437697561416,0.8499092155931327,0.44831818046044236,0.218003822767173,0.5860283165497071,0.2188978911200039,0.02198012716764297,0.2846309493547803,0.26166349189856564,0.8636911513455803,0.10922247360749626,0.7815251420228675,0.6536036081214449,0.8193267281163372,0.5911167719143795,0.30761838339867587,0.2961469377684989,0.409112862158064,0.28582363308028746,0.806202642596823,0.1524806768871787,0.4337714344153707,0.5539889064699526,0.10930990853074873,0.062522712237711,0.5957345457150902,0.8598529494418363,0.22574621315288135,0.637245568896377,0.5369038673138891,0.9455609136500418,0.789110385525088,0.8797099409418034,0.35051863759153123,0.8835913365408863,0.2732074253584238,0.565917994426306,0.8395665902596023,0.13919048275427004,0.06589375695734856,0.6242465584965933,0.4845127999318979,0.8285329602028153,0.8775018792077356,0.37410764931124363,0.8443971161255288,0.3786624554189335,0.45175192294882205,0.26162604321123184,0.7104259154322001,0.06878339067799177,0.724068297585126,0.01706167152077054,0.2861723845133215,0.8916985585143313,0.5619349642045268,0.3512320753485383,0.2630028228248591,0.10962033582909236,0.038054745167586335,0.9462742691738251,0.8791663770453131,0.8544593796029556,0.9323041238962155,0.6437147338233811,0.4437064211663104,0.1645908353352048,0.26803792974202434,0.8019173908814976,0.7751639260190417,0.5683081868481938,0.0890804835368082,0.9763270152497256,0.9236345193325781,0.9842028536211542,0.18596651782800322,0.18504106774620066,0.48949521665570517,0.354493741326934,0.9235645289904728,0.2876520152448667,0.4097859622759117,0.45282057796459063,0.9727958301129958,0.9759934485188693,0.5946214911137719,0.46924866445481817,0.1556650138234843,0.09875217394252012,0.4288537890374251,0.43335343641038726,0.445272260702509,0.8635348985509153,0.36226677164102306,0.2889461258110031,0.3964534328409721,0.8367601608339956,0.5236989508146828,0.23621170798422098,0.43269918331587665,0.5036934401416997,0.7270042096130822,0.6024300608955362,0.5741688845892179,0.04686832578582578,0.08742684842398041,0.30129305308139065,0.6728171070526647,0.8401987804300255,0.34281768505777044,0.39945684680276017,0.10621954998537642,0.0316696713712743,0.994129649054194,0.7411636467301908,0.19433765952200854,0.21523913526713434,0.2429083850998417,0.522614306298909,0.2880339558941596,0.7260625910307696,0.03555357152409666,0.8418221954575933,0.3331483061537832,0.967631275529941,0.4428440125810986,0.0759446125481349,0.9409396139935262,0.14256510507974296,0.07954260742328789,0.6136116595998633,0.7645888677600168,0.18971782094883194,0.6799842553415048,0.16925498369924963,0.12318856772289366,0.6909891911351396,0.7461545079831662,0.7291794667486826,0.911824336634091,0.713199126219128,0.3742117882740228,0.27561684690368904,0.7879943628713042,0.12048632741671694,0.9185760301887262,0.6664911952696935,0.8343455289421875,0.21422592265159812,0.8438794888936938,0.002532116360216996,0.6753233020647049,0.9112633788260331,0.2105929182148032,0.37555727200571654,0.7997012852956424,0.43132326144923416,0.238634660733531,0.5255813402769478,0.8512213688567252,0.5953842136349108,0.8388571251376398,0.8096672899886455,0.6505362686885661,0.2708931176869449,0.9175764365189762,0.0010783299693950532,0.9670257704266598,0.33514006529445317,0.5891218430267324,0.8074556652828064,0.9808557794834427,0.25035517929685613,0.6568660825253552,0.14202389698220497,0.8998568552461801,0.39719041048474835,0.6547596624247105,0.8206433132979645,0.9663444174977485,0.8426324067425259,0.45082871044913087,0.0485879968315599,0.4459104599642272,0.7569681106249746,0.6219037980096613,0.03676788116728469,0.8158473104842678,0.4910339880858281,0.736121066433052,0.340904663556888,0.12238144333968681,0.7351446096503134];
		function Math_random() {
			//return Math.random();
			return randomNumbers[(randomIndex++)%(randomNumbers.length-10)];
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
