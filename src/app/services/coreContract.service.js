(function () {
	angular.module('App')
		.service('coreContract', coreContract);

	coreContract.$inject = ['$q', 'web3Service'];
	function coreContract($q, web3Service) {
		const _contractPath = 'contracts/PixelConInvaders.json';
		const _pixelconsContractPath = 'contracts/PixelCons.json';
		const _contractNetworkIndex = 0;
		const _pixelconsContractNetworkIndex = 0;
		const _contractParamMaxTokens = 1000;
		const _contractParamMint1PixelconIndex = 1217;
		const _contractParamMint2PixelconIndex = 792;
		const _contractParamMint3PixelconIndex = 704;
		const _contractParamMint4PixelconIndex = 651;
		const _contractParamMint5PixelconIndex = 100;
		const _contractParamMint6PixelconIndex = 100;
		const _contractParamGenerationSeed = '0x62d4af627bbd87d47cc4ca7ec461ff2bc7333a2dbee35a43aab39d0959a26b4c';
		const _maxFilterParamSize = 100;
		const _maxQueryParamSize = 200;
		const _cacheTotalsFetchTime = 5 * 60 * 1000;
		const _cacheOwnersFetchTime = 5 * 60 * 1000;
		const _cachePixelconsFetchTime = 5 * 60 * 1000;
		const _cacheInvadersFetch = true;
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
						let chainId = web3Service.getMainNetwork(_contractNetworkIndex).chainId;
						let contract = await web3Service.getContract(_contractPath, chainId);
						let total = await getTotalSupply(contract);
						resolve(total);
						
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
						resolve(_contractParamMaxTokens);
						
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
						let chainId = web3Service.getMainNetwork(_contractNetworkIndex).chainId;
						let contract = await web3Service.getContract(_contractPath, chainId);
						
						//get invaders and add owner data
						let invaders = await getAllInvaders(contract);
						invaders = await addOwnerData(contract, invaders);
						resolve(angular.copy(invaders));
						
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
						let chainId = web3Service.getMainNetwork(_contractNetworkIndex).chainId;
						let contract = await web3Service.getContract(_contractPath, chainId);
						
						let invader = (await getAllInvaders(contract))[index];
						invader.owner = web3Service.formatAddress(await contract.errRetry.ownerOf(invader.id));
						resolve(angular.copy(invader));
						
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while fetching Invader');
					}
				}
			});
		}
		
		// Gets pixelcon and related data for the given account
		async function getAccountPixelcons(account) {
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else if (!web3Service.isAddress(account)) reject(_invalidAddressError);
				else {
					try {
						let chainId = web3Service.getMainNetwork(_pixelconsContractNetworkIndex).chainId;
						let contract = await web3Service.getContract(_pixelconsContractPath, chainId);
						
						//get all for owner
						let ownerPixelconIndexes = await contract.errRetry.getForOwner(account);
						let pixelcons = await getPixelconsByIndexes(contract, ownerPixelconIndexes);
						
						//add invader data
						for(let i=0; i<pixelcons.length; i++) {
							pixelcons[i].invaders = [];
							let numInvaders = getNumInvadersForPixelconIndex(pixelcons[i].index);
							for(let j=0; j<numInvaders; j++) {
								let invaderId = generateInvader(pixelcons[i].id, j);
								if(invaderId) {
									let exists = await doesPixelconExist(contract, invaderId);
									if(!exists) {
										let invader = angular.extend({id: invaderId}, invaderAnalysis(invaderId));
										invader.mintIndex = j;
										pixelcons[i].invaders.push(invader);
									}
								}
							}
						}
						resolve(angular.copy(pixelcons));
						
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while fetching account data');
					}
				}
			});
		}
		
		// Gets list of pixelcons for sale and their mintable invaders
		async function getPixelconsForSale() {
			return $q(async function (resolve, reject) {
				let state = web3Service.getState();
				if (state == "not_enabled") reject(_notEnabledError);
				else if (state == "not_connected") reject(_notConnectedError);
				else if (state != "ready") reject(_unknownError);
				else {
					try {
						let marketListings = await getMarketListings();
						if(marketListings === null) reject('Data analysis not enabled');
						else if(!marketListings.length) reject('Issue with market API');
						else {
							await sleep(200); //guarantee animations have time to finish
							
							let forSale = [];
							for(let i=0; i<marketListings.length; i++) {
								marketListings[i].invaders = [];
								let numInvaders = getNumInvadersForPixelconIndex(marketListings[i].index);
								for(let j=0; j<numInvaders; j++) {
									let invaderId = generateInvader(marketListings[i].id, j);
									if(invaderId) {
										let exists = await doesPixelconExist(null, invaderId);
										if(!exists) {
											let invader = angular.extend({id: invaderId}, invaderAnalysis(invaderId));
											invader.mintIndex = j;
											marketListings[i].invaders.push(invader);
										}
									}
								}
								if(marketListings[i].invaders.length > 0) {
									let maxRarity = 0;
									let maxLevel = 0;
									for(let j=0; j<marketListings[i].invaders.length; j++) {
										maxRarity = Math.max(maxRarity, marketListings[i].invaders[j].rarityScore);
										maxLevel = Math.max(maxLevel, marketListings[i].invaders[j].level);
									}
									marketListings[i].maxRarity = maxRarity;
									marketListings[i].maxLevel = maxLevel;
								
									forSale.push(marketListings[i]);
								}
							}
							resolve(forSale);
						}
					} catch (err) {
						console.log(err);
						reject(err.name == 'UserActionNeededError' ? err.actionNeeded : 'Something went wrong while fetching market data');
					}
				}
			});
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
						let chainId = web3Service.getMainNetwork(_pixelconsContractNetworkIndex).chainId;
						let contract = await web3Service.getContractWithSigner(_pixelconsContractPath, chainId);
						
						//index in bounds
						let pixelconIndex = await getPixelconIndex(contract, pixelconId);
						let numInvaders = getNumInvadersForPixelconIndex(pixelconIndex);
						if (index >= numInvaders) reject('Invalid mint index');
						else {
							
							//owns pixelcon
							let owner = web3Service.formatAddress(await contract.errRetry.ownerOf(pixelconId));
							let address = web3Service.getActiveAccount();
							if (owner != address) reject('Account does not own the PixelCon');
							else {
							
								//invader already exist
								let invaderId = generateInvader(pixelconId, index);
								let exists = await doesPixelconExist(contract, invaderId);
								if(exists) reject('Invader already exists');
								else {
									resolve({ });
								}
							}
						}
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
						let chainId = web3Service.getMainNetwork(_contractNetworkIndex).chainId;
						let address = web3Service.getActiveAccount();
						let contract = await web3Service.getContractWithSigner(_contractPath, chainId);
						let owner = web3Service.formatAddress(await contract.errRetry.ownerOf(id));
						if (owner == address) resolve({ owner: owner });
						else reject('Account does not own this Invader');
						
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
						let chainId = web3Service.getMainNetwork(_contractNetworkIndex).chainId;
						let contractWithSigner = await web3Service.getContractWithSigner(_contractPath, chainId);
						let tx = await contractWithSigner.mintToken(pixelconId, index, _defaultGasParameters);

						//add the waiting transaction to web3Service list
						let transactionParams = { invaderId:generateInvader(pixelconId, index), data: {pixelconId:pixelconId, index:index} };
						resolve(web3Service.addWaitingTransaction(tx.hash, transactionParams, _mintTypeDescription[0], _mintTypeDescription[1]));
						
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
						let chainId = web3Service.getMainNetwork(_contractNetworkIndex).chainId;
						let contractWithSigner = await web3Service.getContractWithSigner(_contractPath, chainId);
						let tx = await contractWithSigner.transferFrom(owner, address, id, _defaultGasParameters);

						//add the waiting transaction to web3Service list
						let transactionParams = { invaderId:id, data: {id:id, address:address} };
						resolve(web3Service.addWaitingTransaction(tx.hash, transactionParams, _transferTypeDescription[0], _transferTypeDescription[1]));
						
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
			
			
			let subLists = [];
			let subList = [];
			for(let i=0; i<list.length; i++) {
				if(subList.length >= max) {
					subLists.push(subList);
					subList = [];
				}
				subList.push(list[i]);
			}
			if(subList.length > 0) subLists.push(subList);
			
			let queries = [];
			for(let i=0; i<subLists.length; i++) queries.push(querySubset(subLists[i]));
			
			let results = [];
			for(let i=0; i<queries.length; i++) {
				results = results.concat(await queries[i]);
			}
			
			/*
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
			*/
			
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
		
		// Gets the current total pixelcons
		var lastTotalsValue = 0;
		var lastTotalsFetchTime = 0;
		async function getTotalSupply(contract) {
			let currTime = (new Date()).getTime();
			if(currTime - lastTotalsFetchTime < _cacheTotalsFetchTime) return lastTotalsValue;
			
			if(!contract) {
				let chainId = web3Service.getMainNetwork(_contractNetworkIndex).chainId;
				contract = await web3Service.getContract(_contractPath, chainId);
			}
			lastTotalsValue = (await contract.errRetry.totalSupply()).toNumber();
			lastTotalsFetchTime = (new Date()).getTime();
			return lastTotalsValue;
		}
		
		// Gets basic list of all invaders
		var invaderList = [];
		var invaderListPromises = [];
		function getAllInvaders(contract) {
			return $q(async function (resolve, reject) {
				let othersFetching = invaderListPromises.length > 0;
				invaderListPromises.push({resolve:resolve, reject:reject});
				if(!othersFetching) {
					try {
						if(!contract) {
							let chainId = web3Service.getMainNetwork(_contractNetworkIndex).chainId;
							contract = await web3Service.getContract(_contractPath, chainId);
						}
							
						let total = await getTotalSupply(contract);
						if (!_cacheInvadersFetch || invaderList.length != total) {
							if (total > 0) {
								let mintEvents = await contract.queryFilter(contract.filters.Mint(null, null, null));
								for (let i=0; i<mintEvents.length; i++) {
									if (!invaderList[mintEvents[i].args["invaderIndex"]]) {
										let invader = {
											id: formatInvaderId(web3Service.to256Hex(mintEvents[i].args["invaderId"])),
											number: mintEvents[i].args["invaderIndex"]
										}
										invader = angular.extend(invader, invaderAnalysis(invader.id));
										invaderList[invader.number] = invader;
									}
								}
							}
						}
							
						//resolve for all waiting promises
						for(let i=0; i<invaderListPromises.length; i++) invaderListPromises[i].resolve(invaderList);
						invaderListPromises = [];
						
					} catch (err) {
						for(let i=0; i<invaderListPromises.length; i++) invaderListPromises[i].reject(err);
						invaderListPromises = [];
					}
				}
			});
		}
		
		// Fill owner data
		var lastOwnersFetchTime = 0;
		async function addOwnerData(contract, invaders) {
			if(!invaders || !invaders.length) return [];
			let currTime = (new Date()).getTime();
			if(currTime - lastOwnersFetchTime < _cacheOwnersFetchTime) return invaders;
			if(!contract) {
				let chainId = web3Service.getMainNetwork(_contractNetworkIndex).chainId;
				contract = await web3Service.getContract(_contractPath, chainId);
			}
			
			let ids = [];
			for(let i=0; i<invaders.length; i++) ids.push(invaders[i].id);
			let ownerDataRaw = await breakUpQuery(ids, async function(ids_subset) {
				return await contract.errRetry.getTokenOwners(ids_subset);
			}, _maxQueryParamSize);
			for(let i=0; i<ownerDataRaw.length; i++) {
				invaders[i].owner = web3Service.formatAddress(ownerDataRaw[i].toString());
			}
			
			lastOwnersFetchTime = (new Date()).getTime()
			return invaders;
		}
		
		// Checks if pixelcon exists
		async function doesPixelconExist(contract, pixelconId) {
			let pixelcons = await getAllPixelcons(contract);
			for(let i=0; i<pixelcons.length; i++) {
				if(pixelcons[i].toLowerCase() == pixelconId.toLowerCase()) return true;
			}
			return false;
		}
		
		// Gets pixelcon index from id
		async function getPixelconIndex(contract, pixelconId) {
			let pixelcons = await getAllPixelcons(contract);
			for(let i=0; i<pixelcons.length; i++) {
				if(pixelcons[i] == pixelconId) return i;
			}
			return null;
		}
		
		// Gets basic list of all pixelcons
		var pixelconList = [];
		var pixelconListPromises = [];
		var lastPixelconsFetchTime = 0;
		function getAllPixelcons(contract) {
			return $q(async function (resolve, reject) {
				let othersFetching = pixelconListPromises.length > 0;
				pixelconListPromises.push({resolve:resolve, reject:reject});
				if(!othersFetching) {
					try {
						let currTime = (new Date()).getTime();
						if(currTime - lastPixelconsFetchTime >= _cachePixelconsFetchTime) {
							if(!contract) {
								let chainId = web3Service.getMainNetwork(_pixelconsContractNetworkIndex).chainId;
								contract = await web3Service.getContract(_pixelconsContractPath, chainId);
							}
							
							pixelconList = [];
							let createEvents = await contract.queryFilter(contract.filters.Create(null, null, null));
							for(let i=0; i<createEvents.length; i++) {
								pixelconList[createEvents[i].args["_tokenIndex"].toNumber()] = formatInvaderId(web3Service.to256Hex(createEvents[i].args["_tokenId"]));
							}
							lastPixelconsFetchTime = (new Date()).getTime();
						}
							
						//resolve for all waiting promises
						for(let i=0; i<pixelconListPromises.length; i++) pixelconListPromises[i].resolve(pixelconList);
						pixelconListPromises = [];
						
					} catch (err) {
						for(let i=0; i<pixelconListPromises.length; i++) pixelconListPromises[i].reject(err);
						pixelconListPromises = [];
					}
				}
			});
		}
		
		// Gets pixelcons from the given indexes
		async function getPixelconsByIndexes(contract, indexes) {
			if(!indexes || !indexes.length) return [];
			if(!contract) {
				let chainId = web3Service.getMainNetwork(_pixelconsContractNetworkIndex).chainId;
				contract = await web3Service.getContract(_pixelconsContractPath, chainId);
			}
							
			let basicDataRaw = await breakUpQuery(indexes, async function(indexes_subset) {
				let tokenData = await contract.errRetry.getBasicData(indexes_subset);
				let dataByToken = [];
				for(let i=0; i<tokenData[0].length; i++) dataByToken.push([tokenData[0][i], tokenData[1][i], tokenData[2][i], tokenData[3][i]]);
				return dataByToken;
			}, _maxQueryParamSize);
				
			let pixelcons = [];
			for (let i = 0; i < basicDataRaw.length; i++) {
				pixelcons.push({
					id: web3Service.to256Hex(basicDataRaw[i][0]),
					index: indexes[i].toNumber ? indexes[i].toNumber() : indexes[i],
					name: web3Service.toUtf8(basicDataRaw[i][1]),
					owner: web3Service.formatAddress(basicDataRaw[i][2].toString()),
					collection: basicDataRaw[i][3].toNumber() ? { index: basicDataRaw[i][3].toNumber() } : null
				});
			}
			
			return pixelcons;
		}
		
		// Gets current market listings
		function getMarketListings() {
			return $q(async function (resolve, reject) {
				var url = '/api/opensea';
				var xhr = new XMLHttpRequest();
				xhr.open('GET', url, true);
				xhr.responseType = 'json';
				xhr.onload = function() {
				  var status = xhr.status;
				  if (status === 200) {
					resolve(xhr.response);
				  } else {
					resolve(null);
				  }
				};
				xhr.send();
			});
		}
		
		// Calculates properties and values of an invader from the invader id
		function invaderAnalysis(invaderId) {
			const attackDefense = ['6','d'];
			const longRangeShortRange = ['1','5'];
			const elementalTypes = ['7','8','9','a','b','c'];
			invaderId = formatInvaderId(invaderId).substr(2,64);
			
			let level = 0;
			let typeColor = null;
			let skillColor = null;
			let rangeColor = null;
			for(let i=0; i<invaderId.length; i++) {
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
		
		// Gets color value from single hex character
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
		
		// Gets the number of invaders the given pixelcon index can mint
		function getNumInvadersForPixelconIndex(index) {
			if(index < _contractParamMint6PixelconIndex) return 6;
			if(index < _contractParamMint5PixelconIndex) return 5;
			if(index < _contractParamMint4PixelconIndex) return 4;
			if(index < _contractParamMint3PixelconIndex) return 3;
			if(index < _contractParamMint2PixelconIndex) return 2;
			if(index < _contractParamMint1PixelconIndex) return 1;
			return 0;
		}
		
		// Simple async sleep function
		function sleep(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}
		
		
		///////////////////////////////////////////
		// Utils (invader generation algorithms) //
		///////////////////////////////////////////
		
		
		// Generates an invader id from a pixelcon id and mint index
		function generateInvader(pixelconId, index) {
			let seed = ethers.utils.keccak256('0x' + _contractParamGenerationSeed.substr(2,64).padStart(64,'0') + pixelconId.substr(2,64).padStart(64,'0') + (index).toString(16).padStart(8,'0'));

			//flags
			let horizontalExpand1 = op_ba(seed /*&*/, '0x00000001');
			let verticalExpand1 = op_ba(seed /*&*/, '0x00000002');
			let horizontalExpand2 = op_ba(seed /*&*/, '0x00000004');
			let verticalExpand2 = op_ba(seed /*&*/, '0x00000008');
			seed = op_sr(seed /*>>*/, 32);

			//colors
			let colors = getColors(seed);
			let color1 = colors[0]; let color2 = colors[1]; let color3 = colors[2];
			seed = op_sr(seed /*>>*/, 32);

			//masks
			let mask1 = generateMask_5x5(seed, verticalExpand1, horizontalExpand1);
			seed = op_sr(seed /*>>*/, 32);
			let mask2 = generateMask_5x5(seed, verticalExpand2, horizontalExpand2);
			seed = op_sr(seed /*>>*/, 32);
			let mask3 = generateMask_8x8(seed);
			seed = op_sr(seed /*>>*/, 64);
			let combinedMask = op_ba(mask1 /*&*/, mask2);
			let highlightMask = op_ba(mask1 /*&*/, mask3);

			let result = op_ba(op_ba(op_ba(mask1 /*&*/, op_bn(/*~*/combinedMask)) /*&*/, op_bn(/*~*/highlightMask)) /*&*/, color1);
			result = op_bo(result, op_ba(op_ba(combinedMask /*&*/, op_bn(/*~*/highlightMask)) /*&*/, color2));
			result = op_bo(result, op_ba(highlightMask /*&*/, color3));
			
			if(result == '0x0000000000000000000000000000000000000000000000000000000000000000') return null;
			return result;
		}
		function generateMask_8x8(seed) {
			let mask = generateLine_8x8(seed);
			mask = op_add(op_sl(mask /*<<*/, 32) /*+*/, generateLine_8x8(op_sr(seed /*>>*/, 8)));
			mask = op_add(op_sl(mask /*<<*/, 32) /*+*/, generateLine_8x8(op_sr(seed /*>>*/, 16)));
			mask = op_add(op_sl(mask /*<<*/, 32) /*+*/, generateLine_8x8(op_sr(seed /*>>*/, 24)));
			mask = op_add(op_sl(mask /*<<*/, 32) /*+*/, generateLine_8x8(op_sr(seed /*>>*/, 32)));
			mask = op_add(op_sl(mask /*<<*/, 32) /*+*/, generateLine_8x8(op_sr(seed /*>>*/, 40)));
			mask = op_add(op_sl(mask /*<<*/, 32) /*+*/, generateLine_8x8(op_sr(seed /*>>*/, 48)));
			mask = op_add(op_sl(mask /*<<*/, 32) /*+*/, generateLine_8x8(op_sr(seed /*>>*/, 56)));
			return mask;
		}
		function generateLine_8x8(seed) {
			let line = '0x00000000';
			if(op_eq(op_ba(seed /*&*/, '0x00000003') /*==*/, '0x00000001')) line = op_bo(line /*|*/, '0x000ff000');
			if(op_eq(op_ba(seed /*&*/, '0x0000000c') /*==*/, '0x00000004')) line = op_bo(line /*|*/, '0x00f00f00');
			if(op_eq(op_ba(seed /*&*/, '0x00000030') /*==*/, '0x00000010')) line = op_bo(line /*|*/, '0x0f0000f0');
			if(op_eq(op_ba(seed /*&*/, '0x000000c0') /*==*/, '0x00000040')) line = op_bo(line /*|*/, '0xf000000f');
			return line;
		}
		function generateMask_5x5(seed, verticalExpand, horizontalExpand) {
			let mask = '0x0000000000000000000000000000000000000000000000000000000000000000';
			let line1 = generateLine_5x5(seed, horizontalExpand);
			let line2 = generateLine_5x5(op_sr(seed /*>>*/, 3), horizontalExpand);
			let line3 = generateLine_5x5(op_sr(seed /*>>*/, 6), horizontalExpand);
			let line4 = generateLine_5x5(op_sr(seed /*>>*/, 9), horizontalExpand);
			let line5 = generateLine_5x5(op_sr(seed /*>>*/, 12), horizontalExpand);
			if(op_gt(verticalExpand /*>*/, 0)) {
				mask = op_add(op_sl(line1 /*<<*/, 224) /*+*/, op_sl(line2 /*<<*/, 192) /*+*/, op_sl(line2 /*<<*/, 160) /*+*/, op_sl(line3 /*<<*/, 128) 
						/*+*/, op_sl(line4 /*<<*/, 96) /*+*/, op_sl(line4 /*<<*/, 64) /*+*/, op_sl(line5 /*<<*/, 32) /*+*/, (line5));
			} else {
				mask = op_add(op_sl(line1 /*<<*/, 224) /*+*/, op_sl(line1 /*<<*/, 192) /*+*/, op_sl(line2 /*<<*/, 160) /*+*/, op_sl(line2 /*<<*/, 128) 
						/*+*/, op_sl(line3 /*<<*/, 96) /*+*/, op_sl(line4 /*<<*/, 64) /*+*/, op_sl(line4 /*<<*/, 32) /*+*/, (line5));
			}
			return mask;
		}
		function generateLine_5x5(seed, horizontalExpand) {
			let line = '0x00000000';
			if(op_eq(op_ba(seed /*&*/, '0x00000001') /*==*/, '0x00000001')) line = op_bo(line /*|*/, '0x000ff000');
			if(op_gt(horizontalExpand /*>*/, 0)) {
				if(op_eq(op_ba(seed /*&*/, '0x00000002') /*==*/, '0x00000002')) line = op_bo(line /*|*/, '0x0ff00ff0');
				if(op_eq(op_ba(seed /*&*/, '0x00000004') /*==*/, '0x00000004')) line = op_bo(line /*|*/, '0xf000000f');
			} else {
				if(op_eq(op_ba(seed /*&*/, '0x00000002') /*==*/, '0x00000002')) line = op_bo(line /*|*/, '0x00f00f00');
				if(op_eq(op_ba(seed /*&*/, '0x00000004') /*==*/, '0x00000004')) line = op_bo(line /*|*/, '0xff0000ff');
			}
			return line;
		}
		function getColors(seed) {
			let color1 = '0x0000000000000000000000000000000000000000000000000000000000000000';
			let color2 = '0x0000000000000000000000000000000000000000000000000000000000000000';
			let color3 = '0x0000000000000000000000000000000000000000000000000000000000000000';

			let colorNum = op_ba(seed /*&*/, '0x000000ff');
			if(op_lt(colorNum /*<*/, '0x00000080')) {
				if(op_lt(colorNum /*<*/, '0x00000055')) {
					if(op_lt(colorNum /*<*/, '0x0000002B')) color3 = '0x7777777777777777777777777777777777777777777777777777777777777777';
					else color3 = '0x8888888888888888888888888888888888888888888888888888888888888888';
				} else {
					color3 = '0x9999999999999999999999999999999999999999999999999999999999999999';
				}
			} else {
				if(op_lt(colorNum /*<*/, '0x000000D5')) {
					if(op_lt(colorNum /*<*/, '0x000000AB')) color3 = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
					else color3 = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
				} else {
					color3 = '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
				}
			}

			if(op_eq(op_ba(seed /*&*/, '0x00000100') /*==*/, '0x00000100')) color1 = '0x1111111111111111111111111111111111111111111111111111111111111111';
			else color1 = '0x5555555555555555555555555555555555555555555555555555555555555555';

			if(op_eq(op_ba(seed /*&*/, '0x00000200') /*==*/, '0x00000200')) color2 = '0x6666666666666666666666666666666666666666666666666666666666666666';
			else color2 = '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';

			return [color1, color2, color3];
		}

		// Big number operations
		function op_lt(n1, n2) { // <
			return ethers.BigNumber.from(n1).lt(n2);
		}
		function op_gt(n1, n2) { // >
			return ethers.BigNumber.from(n1).gt(n2);
		}
		function op_eq(n1, n2) { // ==
			return ethers.BigNumber.from(n1).eq(n2);
		}
		function op_add(n1, n2, n3, n4, n5, n6, n7, n8) { // +
			let r = ethers.BigNumber.from(n1).add(n2);
			if(n3) r = r.add(n3);
			if(n4) r = r.add(n4);
			if(n5) r = r.add(n5);
			if(n6) r = r.add(n6);
			if(n7) r = r.add(n7);
			if(n8) r = r.add(n8);
			return '0x' + r.toHexString().substr(2,64).padStart(64,'0');
		}
		function op_sub(n1, n2) { // -
			let r = ethers.BigNumber.from(n1).sub(n2);
			return '0x' + r.toHexString().substr(2,64).padStart(64,'0');
		}
		function op_sl(n1, v) { // <<
			let r = ethers.BigNumber.from(n1).mul(ethers.BigNumber.from(2).pow(v));
			return '0x' + r.toHexString().substr(2,64).padStart(64,'0');
		}
		function op_sr(n1, v) { // >>
			let r = ethers.BigNumber.from(n1).div(ethers.BigNumber.from(2).pow(v));
			return '0x' + r.toHexString().substr(2,64).padStart(64,'0');
		}
		function op_ba(n1, n2) { // &
			n1 = ethers.utils.arrayify('0x' + n1.substr(2,64).padStart(64,'0'));
			n2 = ethers.utils.arrayify('0x' + n2.substr(2,64).padStart(64,'0'));
			for(let i=0; i<32; i++) n1[i] = n1[i] & n2[i];
			return ethers.utils.hexlify(n1);
		}
		function op_bo(n1, n2) { // |
			n1 = ethers.utils.arrayify('0x' + n1.substr(2,64).padStart(64,'0'));
			n2 = ethers.utils.arrayify('0x' + n2.substr(2,64).padStart(64,'0'));
			for(let i=0; i<32; i++) n1[i] = n1[i] | n2[i];
			return ethers.utils.hexlify(n1);
		}
		function op_bn(n1) { // ~
			n1 = ethers.utils.arrayify('0x' + n1.substr(2,64).padStart(64,'0'));
			for(let i=0; i<32; i++) n1[i] = ~n1[i];
			return ethers.utils.hexlify(n1);
		}
		
		
		///////////////////////////////////////////
		// Utils (transaction data transformers) //
		///////////////////////////////////////////


		// Adds data to return for mint transaction
		async function addInvaderDataForMint(params, data) {
			//scan event logs for data
			let invader = {};
			let contractInterface = await web3Service.getContractInterface(_contractPath);
			for (let i = 0; i < data.logs.length; i++) {
				let event = contractInterface.parseLog(data.logs[i]);
				if (event.name == "Mint") {
					invader.id = formatInvaderId(web3Service.to256Hex(event.args["invaderId"]));
					invader.number = event.args["invaderIndex"];
					invader.owner = web3Service.formatAddress(event.args["minter"]);
					invader = angular.extend(invader, invaderAnalysis(invader.id));
				}
			}
			
			//update caches or invalidate them to be updated
			if(lastTotalsValue == invader.number) {
				lastTotalsValue++;
				invaderList[invader.number] = invader;
			} else {
				lastTotalsFetchTime = 0;
			}
			
			//set invader data
			data.invader = invader;
			return data;
		}

		// Adds data to return for transfer transaction
		async function addInvaderDataForTransfer(params, data) {
			//fetch invader
			let invader = {};
			let invaders = await getAllInvaders();
			for(let i=0; i<invaders.length; i++) {
				if(invaders[i].id == params.invaderId) {
					invader = invaders[i];
					break;
				}
			}
			
			//scan event logs for data
			let contractInterface = await web3Service.getContractInterface(_contractPath);
			for (let i = 0; i < data.logs.length; i++) {
				let event = contractInterface.parseLog(data.logs[i]);
				if (event.name == "Transfer") {
					invader.owner = web3Service.formatAddress(event.args["to"]);
				}
			}
			
			//update caches
			if(invader.number < invaderList.length) {
				invaderList[invader.number] = invader;
			}

			//set invader data
			data.invader = invader;
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
