(function () {
	angular.module('App')
		.service('web3Service', web3Service);

	web3Service.$inject = ['$interval', '$timeout', '$window', '$mdDialog', '$q', 'storage'];
	function web3Service($interval, $timeout, $window, $mdDialog, $q, storage) {
		const _networkConfig = [{
			name: 'Mainnet',
			chainId: '1',
			nativeCurrency: {
				name: 'ETH',
				symbol: 'ETH',
				decimals: 18
			},
			icon: '/img/network_mainnet.png',
			fallbackRPCs: [],
			blockExplorer: 'https://etherscan.io/',
			transactionLU: '/tx/<txHash>',
			accountLU: '/address/<address>'
		},{
			name: 'Optimism',
			chainId: '10',
			nativeCurrency: {
				name: 'ETH',
				symbol: 'ETH',
				decimals: 18
			},
			icon: '/img/network_optimism.png',
			fallbackRPCs: ['https://mainnet.optimism.io'],
			blockExplorer: 'https://optimistic.etherscan.io',
			transactionLU: '/tx/<txHash>',
			accountLU: '/address/<address>'
		},{
			name: 'Mainnet',
			chainId: '1'
		},{
			name: 'Rinkeby',
			chainId: '4'
		},{
			name: 'Kovan',
			chainId: '42'
		},{
			name: 'Ropsten',
			chainId: '3'
		},{
			name: 'Goerli',
			chainId: '5'
		},{
			name: 'Polygon',
			chainId: '137'
		},{
			name: 'Arbitrum',
			chainId: '421611'
		},{
			name: 'Optimism',
			chainId: '10'
		}];
		const _transactionWaitConfirmations = 1;
		const _transactionWaitTimeout = 2 * 60 * 60 * 1000;
		const _transactionWaitPoll = 1 * 1000;
		const _transactionEventWaitTimeout = 4 * 60 * 60 * 1000;
		const _transactionEventWaitPoll = 15 * 1000;
		const _contractCallMaxRetries = 5;
		const _noAccountError = 'No Account';
		const _notEnabledError = 'No Network Connection';
		const _notConnectedError = 'Network Provider Not Connected';
		const _undeterminedNetworkError = 'No Network Specified';
		const _unknownError = 'Unknown Error';
		const _invalidAddressError = 'Invalid Address';
		const _messageSettingsButton = '<div class="messageSettingsLink" onclick="web3ServiceOpenSettings();">settings</div>';
		const _messageStartButton = '<a class="textDark" href="/start">start</a>';
		
		var _state = "not_enabled";
		var _chainId = null;
		var _account = null;
		var _isReadOnly = false;
		var _isPrivacyEnabled = false;
		var _waitingTransactions = [];
		var _waitingTransactionEvents = [];
		var _waitingTransactionsAccount = null;
		var _transactionDataTransformers = [];
		var _contractServices = {};

		// Build web3 providers
		var _web3Provider = null;
		if (window.ethereum) {
			_web3Provider = new ethers.providers.Web3Provider(window.ethereum);
			_state = "ready";
			_isPrivacyEnabled = true;

		} else if (window.web3) {
			//legacy web3
			_web3Provider = new ethers.providers.Web3Provider(window.web3);
			_state = "ready";

		} else {
			//read-only mode
			_state = "ready";
			_isReadOnly = true;
		}
		for(let i = 0; i < _networkConfig.length; i++) {
			let fallbackRPC = getFallbackRPC(_networkConfig[i].chainId);
			if(!fallbackRPC) fallbackRPC = _networkConfig[i].fallbackRPCs ? _networkConfig[i].fallbackRPCs[0] : null;
			if(fallbackRPC) {
				let provider = new ethers.providers.JsonRpcProvider(fallbackRPC);
				_networkConfig[i].fallbackProvider = provider;
			}
		}

		// Poll for state changes
		var _onAccountChangeFunctions = [];
		var _onStateChangeFunctions = [];
		var _onNetworkChangeFunctions = [];
		var _onCheckStateFunctions = [];
		var _onWaitingTransactionsChangeFunctions = [];
		var _firstStateUpdateFinished = false;
		async function checkForWeb3Changes() {
			let [newState, newChainId] = await queryNetworkState();
			let stateChanged = (_state != newState);
			let networkChanged = (_chainId != newChainId);
			_chainId = newChainId;
			_state = newState;

			let newAccount = await queryAccount();
			let accountChanged = (_account != newAccount);
			_account = newAccount;

			if (stateChanged) {
				executeCallbackFunctions(_onStateChangeFunctions, _state);
			}
			if (networkChanged) {
				executeCallbackFunctions(_onNetworkChangeFunctions, _chainId);
				checkWaitingTransactionsForAccount();
			}
			if (accountChanged) {
				executeCallbackFunctions(_onAccountChangeFunctions, _account);
				checkWaitingTransactionsForAccount();
			}
			
			//resolve anyone waiting on state update
			for(let i=0; i<_onCheckStateFunctions.length; i++) _onCheckStateFunctions[i]();
			_onCheckStateFunctions = [];
			_firstStateUpdateFinished = true;
		}
		if (!_isReadOnly) {
			$interval(checkForWeb3Changes, 1000);
			checkForWeb3Changes();
		}

		// Setup functions
		this.getState = getState;
		this.isReadOnly = isReadOnly;
		this.isPrivacyMode = isPrivacyMode;
		this.getCurrentNetwork = getCurrentNetwork;
		this.getTransactionLookupUrl = getTransactionLookupUrl;
		this.getProviderName = getProviderName;
		this.awaitState = awaitState;
		this.requestAccess = requestAccess;
		this.switchNetwork = switchNetwork;
		this.onStateChange = onStateChange;
		this.onNetworkChange = onNetworkChange;
		this.getActiveAccount = getActiveAccount;
		this.onAccountDataChange = onAccountDataChange;
		this.getWaitingTransactions = getWaitingTransactions;
		this.getWaitingTransactionEvents = getWaitingTransactionEvents;
		this.addWaitingTransaction = addWaitingTransaction;
		this.addWaitingTransactionEvent = addWaitingTransactionEvent;
		this.addTransactionDataTransformer = addTransactionDataTransformer;
		this.onWaitingTransactionsChange = onWaitingTransactionsChange;
		this.getContractInterface = getContractInterface;
		this.getContractWithSigner = getContractWithSigner;
		this.getContract = getContract;
		this.getContractDetails = getContractDetails;
		this.registerContractService = registerContractService;
		this.getContractService = getContractService;
		this.verifySendEth = verifySendEth;
		this.sendEth = sendEth;
		this.isAddress = isAddress;
		this.to256Hex = to256Hex;
		this.fromUtf8 = fromUtf8;
		this.toUtf8 = toUtf8;
		this.toEncodedBytes = toEncodedBytes;
		this.hexToInt = hexToInt;
		this.filterTextToByteSize = filterTextToByteSize;
		this.formatAddress = formatAddress;
		this.resolveName = resolveName;
		this.reverseName = reverseName;
		this.compressString = compressString;
		this.scrambleList = scrambleList;
		this.getNetworkName = getNetworkName;
		this.getNetworkIcon = getNetworkIcon;
		this.getMainNetwork = getMainNetwork;
		this.setFallbackRPC = setFallbackRPC;
		this.getFallbackRPC = getFallbackRPC;


		///////////
		// State //
		///////////


		// Gets the state of the web3 service
		function getState() {
			return _state;
		}

		// Gets if web3Provider is read only
		function isReadOnly() {
			return _isReadOnly;
		}

		// Gets if web3Provider has privacy mode enable
		function isPrivacyMode() {
			return _isPrivacyEnabled && !_account;
		}

		// Gets the current connected network
		function getCurrentNetwork() {
			if (_state != "ready" || !_chainId) return null;
			for(let i = 0; i < _networkConfig.length; i++) {
				if(_networkConfig[i].chainId == _chainId) {
					return _networkConfig[i].name;
					break;
				}
			}
			return 'unknown_' + _chainId;
		}

		// Gets url for displaying more details about a transaction
		function getTransactionLookupUrl(txHash, chainId) {			
			let transactionLookupUrl = null;
			let accountLookupUrl = null;
			for(let i = 0; i < _networkConfig.length; i++) {
				if(_networkConfig[i].chainId == chainId && _networkConfig[i].blockExplorer) {
					transactionLookupUrl = (_networkConfig[i].blockExplorer + _networkConfig[i].transactionLU).split('//').join('/').split(':/').join('://');
					accountLookupUrl = (_networkConfig[i].blockExplorer + _networkConfig[i].accountLU).split('//').join('/').split(':/').join('://');
					break;
				}
			}
			if(!txHash || !chainId) {
				//if no accountLookupUrl found, just use the first network with links
				if(accountLookupUrl == null) {
					for(let i = 0; i < _networkConfig.length; i++) {
						if(_networkConfig[i].blockExplorer) {
							accountLookupUrl = (_networkConfig[i].blockExplorer + _networkConfig[i].accountLU).split('//').join('/').split(':/').join('://');
							break;
						}
					}
				}
				if (accountLookupUrl) return accountLookupUrl.replace('<address>', getActiveAccount());
				return '';
			}
			
			if (transactionLookupUrl) return transactionLookupUrl.replace('<txHash>', txHash);
			else if (accountLookupUrl) return accountLookupUrl.replace('<address>', getActiveAccount());
			return '';
		}

		// Register callback for state data change
		function onStateChange(callback, scope, syncWithStateUpdate) {
			var register = function() {
				if (scope) scope.$on('$destroy', cleanSubscriptions);
				_onStateChangeFunctions.push({ func: callback, scope: scope });
			}
			if(syncWithStateUpdate) awaitState().then(register);
			else register();
		}

		// Register callback for network data change
		function onNetworkChange(callback, scope, syncWithStateUpdate) {
			var register = function() {
				if (scope) scope.$on('$destroy', cleanSubscriptions);
				_onNetworkChangeFunctions.push({ func: callback, scope: scope });
			}
			if(syncWithStateUpdate) awaitState().then(register);
			else register();
		}

		// Gets the provider name
		function getProviderName() {
			if (_state != "ready") return null;

			if (window.ethereum && window.ethereum.isMetaMask) return 'MetaMask';
			return 'your Ethereum Account';
		}
		
		// Returns a promise that resolves after the next state update
		function awaitState(firstStateOnly) {
			return $q(async function (resolve, reject) {
				if (_isReadOnly || (firstStateOnly && _firstStateUpdateFinished)) {
					resolve();
				} else {
					_onCheckStateFunctions.push(resolve);
				}
			});
		}

		// Requests for access to the accounts
		function requestAccess() {
			if (_isPrivacyEnabled && window.ethereum) {
				window.ethereum.enable().then(checkForWeb3Changes, function () {
					console.log("User denied access to account");
				});
			}
		}

		// Requests switching to the network with the given chainId
		function switchNetwork(chainId) {
			let networkConfig = null;
			for(let i = 0; i < _networkConfig.length; i++) {
				if(_networkConfig[i].chainId == chainId) {
					networkConfig = _networkConfig[i];
					break;
				}
			}
			if (window.ethereum && networkConfig && networkConfig.fallbackRPCs && networkConfig.fallbackRPCs.length) {
				const data = [{
					chainId: '0x' + parseInt('' + chainId).toString(16),
					chainName: networkConfig.name,
					nativeCurrency: networkConfig.nativeCurrency,
					rpcUrls: networkConfig.fallbackRPCs,
					blockExplorerUrls: networkConfig.blockExplorer ? [networkConfig.blockExplorer] : null
				}];
				window.ethereum.request({method: 'wallet_addEthereumChain', params:data}).then(checkForWeb3Changes, function () {
					console.log("Failed to switch to network: " + networkConfig.name);
				});
			}
		}
		
		// Sets a fallback RPC endpoint
		function setFallbackRPC(chainId, rpcEndpoint) {
			if(chainId) {
				if(rpcEndpoint) {
					//set to new value
					storage.setItem('rpc_backup_' + chainId, '' + rpcEndpoint);
					for(let i = 0; i < _networkConfig.length; i++) {
						if(_networkConfig[i].chainId == chainId) {
							let provider = new ethers.providers.JsonRpcProvider(rpcEndpoint);
							_networkConfig[i].fallbackProvider = provider;
							break;
						}
					}
				} else {
					
					//clear (revert back to hardcoded)
					storage.removeItem('rpc_backup_' + chainId);
					for(let i = 0; i < _networkConfig.length; i++) {
						if(_networkConfig[i].chainId == chainId) {
							if(_networkConfig[i].fallbackRPCs && _networkConfig[i].fallbackRPCs[0]) {
								let provider = new ethers.providers.JsonRpcProvider(_networkConfig[i].fallbackRPCs[0]);
								_networkConfig[i].fallbackProvider = provider;
							} else {
								_networkConfig[i].fallbackProvider = undefined;
							}
							break;
						}
					}
				}
			}
		}
		
		// Gets a fallback RPC endpoint
		function getFallbackRPC(chainId) {
			if(chainId) {
				return storage.getItem('rpc_backup_' + chainId);
			}
			return null;
		}


		/////////////
		// Account //
		/////////////


		// Gets the active account
		function getActiveAccount() {
			return _account;
		}
		
		// Register callback for account data change
		function onAccountDataChange(callback, scope, syncWithStateUpdate) {
			var register = function() {
				if (scope) scope.$on('$destroy', cleanSubscriptions);
				_onAccountChangeFunctions.push({ func: callback, scope: scope });
			}
			if(syncWithStateUpdate) awaitState().then(register);
			else register();
		}


		//////////////////
		// Transactions //
		//////////////////


		// Gets waiting transactions
		function getWaitingTransactions() {
			let transactionsForNetwork = [];
			for (let i = 0; i < _waitingTransactions.length; i++) {
				//make sure transaction chainId has a provider
				if(getWeb3Provider(_waitingTransactions[i].chainId)) {
					transactionsForNetwork.push(_waitingTransactions[i]);
				}
			}
			return transactionsForNetwork;
		}
		
		// Gets waiting transaction events
		function getWaitingTransactionEvents() {
			let transactionEventsForNetwork = [];
			for (let i = 0; i < _waitingTransactionEvents.length; i++) {
				//make sure transaction chainId has a provider
				if(getWeb3Provider(_waitingTransactionEvents[i].chainId)) {
					transactionEventsForNetwork.push(_waitingTransactionEvents[i]);
				}
			}
			return transactionEventsForNetwork;
		}
		
		// Adds a new transaction to the wait list
		function addWaitingTransaction(txHash, params, type, description, chainId) {
			if(!chainId) chainId = _chainId;
			let transaction = {
				txHash: txHash,
				chainId: chainId,
				params: params,
				type: type,
				description: description,
				timestamp: (new Date()).getTime()
			}
			_waitingTransactions.push(transaction);

			//update store and run callbacks
			storeWaitingTransactions();
			executeCallbackFunctions(_onWaitingTransactionsChangeFunctions, null);

			//return promise of transaction end
			return transactionWaitTransformRemove(transaction);
		}
		
		// Adds a new transaction event to the wait list
		function addWaitingTransactionEvent(filter, fromBlock, params, name, info, type, description, chainId) {
			if(!chainId) chainId = _chainId;
			let transactionEvent = {
				filter: filter,
				fromBlock: fromBlock,
				chainId: chainId,
				params: params,
				name: name,
				info: info,
				type: type,
				description: description,
				timestamp: (new Date()).getTime()
			}
			_waitingTransactionEvents.push(transactionEvent);

			//update store and run callbacks
			storeWaitingTransactions();
			executeCallbackFunctions(_onWaitingTransactionsChangeFunctions, null);

			//return promise of transaction event end
			return transactionEventWaitTransformRemove(transactionEvent);
		}

		// Adds a function to be run on a transaction result promise to transform data
		function addTransactionDataTransformer(transactionDataTransformer) {
			_transactionDataTransformers.push(transactionDataTransformer);
		}

		// Register callback for waiting transactions change
		function onWaitingTransactionsChange(callback, scope) {
			if (scope) scope.$on('$destroy', cleanSubscriptions);
			_onWaitingTransactionsChangeFunctions.push({ func: callback, scope: scope });
		}


		///////////////
		// Contracts //
		///////////////
		

		// Gets contract interface object based on given path to ABI
		async function getContractInterface(contractPath) {
			let contractData = await getJSON(contractPath);
			let contractInterface = new ethers.utils.Interface(contractData.abi);
			
			//wrap the parseLog function in a try catch
			let parseLog_unsafe = contractInterface.parseLog;
			contractInterface.parseLog = function() {
				try {
					return parseLog_unsafe.apply(contractInterface, arguments);
				} catch(err) {
					return { name: null }
				}
			}
			
			return contractInterface;
		}
		
		// Gets contract object based on given path to ABI with the current account as signer
		async function getContractWithSigner(contractPath, chainId) {
			//check that the chainId matches the current network
			chainId = await resolveChainId(chainId);
			let currNetworkName = getNetworkName(_chainId);
			let networkName = getNetworkName(chainId);
			if(chainId != _chainId) {
				switchNetwork(chainId);
				throw new UserActionNeededError('Connected to wrong network', 'Please switch your account network from <b>' + currNetworkName + '</b> to <b>' + networkName + '</b>');
			}
			let contract = await getContract(contractPath, chainId);
			let signerContract = contract.connect(_web3Provider.getSigner(0));
			return wrapContractWithErrorHandling(signerContract, contract.abi, contract.blockNumber);
		}

		// Gets contract object based on given path to ABI
		async function getContract(contractPath, chainId) {
			chainId = await resolveChainId(chainId);
			let currNetworkName = getNetworkName(_chainId);
			let networkName = getNetworkName(chainId);
			let contractDetails = await getContractDetails(contractPath, chainId);
			let contractData = await getJSON(contractPath);
			
			//determine the provider and create the contract
			let provider = getWeb3Provider(chainId);
			if(!provider) {
				//check that web3 is enabled
				if(!_chainId) throw new UserActionNeededError('Web3 not connected', 'Get started by visiting the ' + _messageStartButton + ' page or update the fallback RPCs in ' + _messageSettingsButton);

				//try to add network
				switchNetwork(chainId);
				throw new UserActionNeededError('Failed to find network provider', 'Please switch your account network from <b>' + currNetworkName + '</b> to <b>' + networkName + '</b> or update the fallback RPCs in ' + _messageSettingsButton);
			}
			let contract = new ethers.Contract(contractDetails.address, contractData.abi, provider);
			contract.abi = contractData.abi;
			contract.blockNumber = contractDetails.blockNumber;
			return wrapContractWithErrorHandling(contract);
		}

		// Gets the contract details on the current network
		async function getContractDetails(contractPath, chainId) {
			chainId = await resolveChainId(chainId);
			let deploymentData = await getJSON('contracts/deployments.json');
			let contractData = await getJSON(contractPath);
			let contractName = contractData.contractName;

			for (let i = 0; i < deploymentData.length; i++) {
				if (deploymentData[i].id == chainId) {
					for (let j = 0; j < deploymentData[i].contracts.length; j++) {
						if (deploymentData[i].contracts[j].name == contractName) {
							return deploymentData[i].contracts[j];
						}
					}
				}
			}

			throw new Error("Failed to find contract deployed location");
		}

		// Gets the contract deployment data
		var _loadedJSON = {};
		var _loadedJSONWaiting = {};
		function getJSON(path) {
			return $q(async function (resolve, reject) {
				//check if JSON is already fetched
				if (_loadedJSON[path]) {
					resolve(_loadedJSON[path]);
				}

				//check if JSON is already being fetched
				if (_loadedJSONWaiting[path]) {
					//add resolve/reject to array for when fetch returns
					_loadedJSONWaiting[path].push({ resolve: resolve, reject: reject });

				} else {
					//add resolve/reject to array for when fetch returns
					_loadedJSONWaiting[path] = [{ resolve: resolve, reject: reject }];

					try {
						//fetch
						let jsonData = JSON.parse(await httpGet(path));
						_loadedJSON[path] = jsonData;

						//finish promises for anything that was waiting
						if (_loadedJSONWaiting[path]) {
							for (let i = 0; i < _loadedJSONWaiting[path].length; i++) _loadedJSONWaiting[path][i].resolve(jsonData);
						}

					} catch (err) {
						//fail promises for anything that was waiting
						if (_loadedJSONWaiting[path]) {
							for (let i = 0; i < _loadedJSONWaiting[path].length; i++) _loadedJSONWaiting[path][i].reject(new Error("Failed to load JSON data"));
						}
					}
				}
			});
		}
		
		// Wraps the given contract with better error handling
		function wrapContractWithErrorHandling(contract, abi, blockNumber) {
			if(!abi) abi = contract.abi;
			if(!blockNumber) blockNumber = contract.blockNumber;
			
			//wrap contract calls to handle errors that require a retry
			let retryHandler = function(f) {
				return async function() {
					for(let i=0; i<_contractCallMaxRetries; i++){
						try {
							return await f.apply(this, arguments);
						} catch(err) {
							//only allow retry after common error
							if(!err || err.message !== 'header not found' || i >= _contractCallMaxRetries-1) {
								throw err;
							}
						}
					}
				}
			}
			contract.errRetry = {};
			for(let f in contract) {
				if (typeof contract[f] === 'function') {
					for(let i=0; i<abi.length; i++) {
						if(abi[i].name && f.indexOf(abi[i].name) > -1) {
							contract.errRetry[f] = retryHandler(contract[f]);
							break;
						}
					}
				}
			}
			
			//wrap the queryFilter function to handle larger datasets
			let queryFilter_unsafe = contract.queryFilter;
			contract.queryFilter = async function(filter, fromBlock, toBlock) {
				if(!fromBlock) fromBlock = parseInt('' + blockNumber);
				if(!toBlock) toBlock = 'latest';
				//recursively searches smaller and smaller block chunks until we get success or hit a set depth
				const maxRecursionDepth = 15;
				async function queryFilterRec(filter, fromBlock, toBlock, depth) {
					try {
						return await queryFilter_unsafe.call(contract, filter, fromBlock, toBlock);
					} catch(err) {
						if(toBlock === 'latest') toBlock = await contract.provider.getBlockNumber();
						if(depth < maxRecursionDepth && (toBlock - fromBlock) > 1) {
							let halfway = fromBlock + Math.floor((toBlock - fromBlock) / 2);
							let firstHalf = await queryFilterRec(filter, fromBlock, halfway, depth + 1);
							let secondHalf = await queryFilterRec(filter, halfway + 1, toBlock, depth + 1);
							return firstHalf.concat(secondHalf);
						} else throw err;
					}
				}
				return queryFilterRec(filter, fromBlock, toBlock, 0);
			}
			
			return contract;
		}

		// Registers a contract service
		function registerContractService(name, service) {
			_contractServices[name] = service;
		}

		// Retrieves a contract service
		function getContractService(name) {
			return _contractServices[name];
		}


		//////////
		// Send //
		//////////


		// Get estimated send gas price
		function verifySendEth(address, amount) {
			return $q(function (resolve, reject) {
				if (_state == "not_enabled") reject(_notEnabledError);
				else if (_state == "not_connected") reject(_notConnectedError);
				else if (_state != "ready") reject(_unknownError);
				else if (isReadOnly()) reject(_noAccountError);
				else if (!isAddress(address)) reject(_invalidAddressError);
				//else resolve({});
				reject("send eth not yet suported");
			});
		}

		// Send amount of eth to the given address
		function sendEth(address, amount) {
			return $q(async function (resolve, reject) {
				if (_state == "not_enabled") reject(_notEnabledError);
				else if (_state == "not_connected") reject(_notConnectedError);
				else if (_state != "ready") reject(_unknownError);
				else if (isReadOnly()) reject(_noAccountError);
				else if (!isAddress(address)) reject(_invalidAddressError);
				else {
					try {
						let signer = _web3Provider.getSigner(0);
						let transactionResponse = signer.sendTransaction({ to: address, value: ethers.utils.parseEther(""+amount) });
						resolve(transactionResponse.hash);
					} catch (err) {
						reject('Something went wrong while sending eth');
					}
				}
			});
		}


		///////////
		// Utils //
		///////////


		// Verifies if the given address is valid
		function isAddress(address) {
			return ethers.utils.isAddress(address);
		}

		// Converts given number into 256 bit hex code
		function to256Hex(number) {
			try {
				let hex = ethers.utils.hexlify(number);
				while (hex.length < 66) hex = hex.slice(0, 2) + '0' + hex.slice(2);
				return hex;
			} catch (err) { }
			return "0x".padEnd(66, "0");
		}

		// Converts given utf8 text into hex code
		function fromUtf8(text, byteSize) {
			try {
				if (byteSize) {
					let bytes = new Uint8Array(byteSize);
					let textBytes = ethers.utils.toUtf8Bytes(text);
					for (let i = 0; i < byteSize && i < textBytes.length; i++) {
						bytes[i] = textBytes[i];
					}
					return ethers.utils.hexlify(bytes);
				} else {
					return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(text));
				}
			} catch (err) { }
			return (byteSize) ? ethers.utils.hexlify(new Uint8Array(byteSize)) : "0x00";
		}

		// Converts hex code into a full string
		function toUtf8(hex) {
			try {
				while (hex[hex.length - 1] == '0' && hex[hex.length - 2] == '0') hex = hex.slice(0, hex.length - 2);
				return ethers.utils.toUtf8String(hex);
			} catch (err) { }
			return "";
		}
		
		// Encodes the given text array into bytes formatAddress
		function toEncodedBytes(textArray) {
			try {
				for(let i = textArray.length - 1; i >= 0; i--) {
					if(!textArray[i]) {
						textArray.pop();
					} else {
						break;
					}
				}
				
				let bytesTotal = 0;
				let bytes = [];
				for(let i = 0; i < textArray.length; i++) {
					let byteArray = ethers.utils.toUtf8Bytes(textArray[i] ? textArray[i] : '');
					bytes.push(byteArray);
					bytesTotal += byteArray.length;
				}

				let finalBytes = new Uint8Array((bytesTotal + textArray.length) - 1);
				let finalBytesIndex = 0;
				for(let i = 0; i < bytes.length; i++) {
					for(let j = 0; j < bytes[i].length; j++) finalBytes[finalBytesIndex + j] = bytes[i][j];
					finalBytesIndex += bytes[i].length;
					if((i + 1) < bytes.length) {
						finalBytes[finalBytesIndex] = 0;
						finalBytesIndex++;
					}
				}
				return ethers.utils.hexlify(finalBytes);
			} catch (err) { }
			return "0x";
		}


		// Convert a hex string into an integer string
		function hexToInt(hex) {
			try {
				return ethers.BigNumber.from(hex).toString();
			} catch (err) { }
			return "0";
		}

		// Filters the given text down to the given byte size (utf8)
		function filterTextToByteSize(text, byteSize) {
			try {
				for (let i = text.length; i >= 0; i--) {
					let sub = text.substr(0,i);
					try {
						let bytes = ethers.utils.toUtf8Bytes(sub);
						if(bytes.length <= byteSize) return sub;
					} catch (err) { }
				}
			} catch (err) { }
			return "";
		}

		// Formats the given hex address
		function formatAddress(address) {
			try {
				const hexCharacters = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
				if(address) {
					address = address.toLowerCase();
					if(address.indexOf('0x') == 0) address = address.substr(2,address.length);
					if(address.length < 40) return null;
					if(address.length > 40) address = address.substring(address.length-40, address.length);
					for(let i=0; i<40; i++) if(hexCharacters.indexOf(address[i]) == -1) return null;
					return '0x' + address;
				}
				return null;
			} catch (err) { }
			return null;
		}

		// uses ENS to try and resolve the given name
		async function resolveName(name) {
			try {
				if(isAddress(name)) return formatAddress(name);
				let mainnetwork = getMainNetwork();
				let provider = getWeb3Provider(mainnetwork.chainId);
				if(provider) {
					let address = await provider.resolveName(name);
					return formatAddress(address);
				}
			} catch (err) { }
			return null;
		}

		// uses ENS to try and resolve the given address
		async function reverseName(address) {
			try {
				let mainnetwork = getMainNetwork();
				let provider = getWeb3Provider(mainnetwork.chainId);
				if(provider) {
					return await provider.lookupAddress(address);
				}
			} catch (err) { }
			return null;
		}
		
		// Compresses the given string
		function compressString(address, maxChars) {
			let comp = address || '';
			if (maxChars && address.length > maxChars) {
				if (maxChars < 5) comp = '';
				else comp = comp.substr(0, (maxChars / 2) + 1) + '???' + comp.substr(comp.length - ((maxChars / 2) - 1));
			}

			return comp;
		}
		
		// Returns a repeatable scrambled version of the given list
		function scrambleList(list, seed) {
			if(!list) return [];
			
			//generate a seed integer
			let seedStr = ''+seed;
			seed = 123456789;
			for(let i=0; i<seedStr.length; i++) seed += seedStr.charCodeAt(i);
			seed = seed % 2147483648;
			
			//sort based on random inputs
			list = JSON.parse(JSON.stringify(list));
			list.sort(function(a,b) {
				seed = (1103515245 * seed + 12345) % 2147483648;
				let v1 = seed;
				seed = (1103515245 * seed + 12345) % 2147483648;
				let v2 = seed;
				return v1-v2;
			});
			return list;
		}
		
		// Gets the name of a network given its chainId
		function getNetworkName(chainId) {
			for(let i = 0; i < _networkConfig.length; i++) {
				if(_networkConfig[i].chainId == chainId) {
					return _networkConfig[i].name;
				}
			}
			return 'Unknown';
		}
		
		// Gets the icon of a network given its chainId
		function getNetworkIcon(chainId) {
			for(let i = 0; i < _networkConfig.length; i++) {
				if(_networkConfig[i].chainId == chainId) {
					return _networkConfig[i].icon;
				}
			}
			return null;
		}

		// Gets the main network
		function getMainNetwork(index) {
			if(!index) index = 0;
			return {
				name: _networkConfig[index].name,
				chainId: _networkConfig[index].chainId
			}
		}
		
		// Opens the settings dialog
		$window.web3ServiceOpenSettings = function() {
			$mdDialog.show({
				controller: 'SettingsDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: HTMLTemplates['dialog.settings'],
				parent: angular.element(document.body),
				bindToController: true,
				clickOutsideToClose: true
			});
		}


		//////////////////////////
		// Web3 Specific Errors //
		//////////////////////////


		function UserActionNeededError(message, actionNeeded) {
			let instance = new Error(message);
			instance.name = 'UserActionNeededError';
			instance.actionNeeded = actionNeeded;
			Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
			if (Error.captureStackTrace) Error.captureStackTrace(instance, UserActionNeededError);
			return instance;
		}
		UserActionNeededError.prototype = Object.create(Error.prototype, {
			constructor: {
				value: Error,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
		if (Object.setPrototypeOf) Object.setPrototypeOf(UserActionNeededError, Error);
		else UserActionNeededError.__proto__ = Error;


		//////////////////////
		// Helper Functions //
		//////////////////////


		// Helper function to get the current network state
		async function queryNetworkState() {
			if (_web3Provider != null) {
				try {
					let network = await _web3Provider.getNetwork();
					return ["ready", '' + network.chainId];
				} catch (err) {
					if (err.reason == "underlying network changed") {
						_web3Provider = new ethers.providers.Web3Provider(_web3Provider.provider);
						return queryNetworkState();
					}
					return ["not_connected", null];
				}
			}
			return ["not_enabled", null];
		}

		// Helper function to get the current web3 account
		async function queryAccount() {
			if (_web3Provider != null) {
				try {
					let signer = _web3Provider.getSigner(0);
					let signerAddress = await signer.getAddress();
					return formatAddress(signerAddress);
				} catch (err) {
					if (err.reason.indexOf('unknown account') > -1) {
						return null;
					}
					throw err;
				}
			}
			return null;
		}
		
		// Checks the given chainId or returns the current chainId
		async function resolveChainId(chainId) {
			if (!_chainId && !_isReadOnly) await checkForWeb3Changes();
			
			if (chainId) return chainId;
			if (_chainId) return _chainId;
			throw new Error(_undeterminedNetworkError);
		}

		// Helper function to clean up any subscriptions during destroy events
		function cleanSubscriptions(ev) {
			for (let i = 0; i < _onStateChangeFunctions.length;) {
				if (_onStateChangeFunctions[i].scope && _onStateChangeFunctions[i].scope.$id === ev.currentScope.$id) _onStateChangeFunctions.splice(i, 1);
				else i++;
			}
			for (let i = 0; i < _onNetworkChangeFunctions.length;) {
				if (_onNetworkChangeFunctions[i].scope && _onNetworkChangeFunctions[i].scope.$id === ev.currentScope.$id) _onNetworkChangeFunctions.splice(i, 1);
				else i++;
			}
			for (let i = 0; i < _onAccountChangeFunctions.length;) {
				if (_onAccountChangeFunctions[i].scope && _onAccountChangeFunctions[i].scope.$id === ev.currentScope.$id) _onAccountChangeFunctions.splice(i, 1);
				else i++;
			}
			for (let i = 0; i < _onWaitingTransactionsChangeFunctions.length;) {
				if (_onWaitingTransactionsChangeFunctions[i].scope && _onWaitingTransactionsChangeFunctions[i].scope.$id === ev.currentScope.$id) _onWaitingTransactionsChangeFunctions.splice(i, 1);
				else i++;
			}
		}

		// Helper function to execute the given list of functions with the given data
		function executeCallbackFunctions(functions, data) {
			for (let i in functions) {
				let func = functions[i].func;
				let scope = functions[i].scope;

				func(data);
				if (scope && scope.$root && scope.$root.$$phase != '$apply' && scope.$root.$$phase != '$digest') {
					scope.$apply();
				}
			}
		}
		
		// Helper function to get a provider for the given chainId
		function getWeb3Provider(chainId) {
			let provider = null;
			if(chainId == _chainId && _web3Provider) provider = _web3Provider;
			else {
				for(let i = 0; i < _networkConfig.length; i++) {
					if(_networkConfig[i].chainId == chainId && _networkConfig[i].fallbackProvider) {
						provider = _networkConfig[i].fallbackProvider;
						break;
					}
				}
			}
			return provider;
		}
		
		// Helper function to get the current block
		var currentBlockCache = {};
		async function getCurrentBlockNumber(chainId) {
			let time = (new Date()).getTime();
			let cacheEntry = currentBlockCache[chainId];
			if(cacheEntry && (time - cacheEntry.time) < 15*1000) {
				return cacheEntry.block;
			} else {
				try {
					let provider = getWeb3Provider(chainId);
					if(provider) {
						currentBlockCache[chainId] = {
							time: (new Date()).getTime(),
							block: await provider.getBlockNumber()
						}
						return currentBlockCache[chainId].block;
					}
				} catch(err) {
					console.log(err)
				}
			}
			return 0;
		}
		
		// performs a GET REST request
		function httpGet(path) {
			return $q(function (resolve, reject) {
				try {
					var xmlHttp = new XMLHttpRequest();
					xmlHttp.onreadystatechange = function() {
						if (xmlHttp.readyState == 4) {
							if(xmlHttp.status == 200) resolve(xmlHttp.responseText);
							else reject('Request Failed');
						}
					}
					xmlHttp.open("GET", path, true);
					xmlHttp.send(null);
				} catch (err) {
					reject(err);
				}
			});
		}


		///////////////////////////////
		// Helper Functions (events) //
		///////////////////////////////


		// Helper function to get transaction event status
		async function getTransactionEventStatus(filter, fromBlock, chainId) {
			if (_state == "ready") {
				try {
					let provider = getWeb3Provider(chainId);
					if(provider != null) {
						if(fromBlock == 0) fromBlock = (await getCurrentBlockNumber(chainId)) - 5000;
						let tempContract = new ethers.Contract(filter.address, [], provider);
						let events = await tempContract.queryFilter(filter, fromBlock);
						if(events && events.length) {
							return {
								filter: filter,
								fromBlock: fromBlock,
								events: events
							}
						}
					}
				} catch (err) {
					console.log(err);
				}
				return {
					filter: filter,
					fromBlock: fromBlock
				}
			} else {
				throw new Error("no web3");
			}
		}

		// Helper function to watch for transaction event completion
		function transactionEventWait(transactionEvent) {
			return $q(function (resolve, reject) {
				let start = (new Date).getTime();
				let check_transaction_event = async function () {
					try {
						let result = await getTransactionEventStatus(transactionEvent.filter, transactionEvent.fromBlock, transactionEvent.chainId);
						if (result.events && result.events.length > 0) {
							resolve(result);
							return;
						} else if (_transactionEventWaitTimeout > 0 && (new Date).getTime() - start > _transactionEventWaitTimeout) {
							reject(new Error(transactionEvent.name + " event wasn't completed within " + (_transactionEventWaitTimeout / (60 * 60 * 1000)) + " hours"));
							return;
						}
						$timeout(check_transaction_event, _transactionEventWaitPoll);
					} catch (err) {
						reject(err);
					}
				};
				check_transaction_event();
			});
		}

		// Helper function to wait for a transaction event to finish, transform its return data and remove it from waiting list
		async function transactionEventWaitTransformRemove(transactionEvent) {
			let returnData = null;
			try {
				//wait on event to finish
				let result = await transactionEventWait(transactionEvent);
				returnData = {
					filter: result.filter,
					chainId: transactionEvent.chainId,
					success: true,
					name: transactionEvent.name,
					info: transactionEvent.info,
					type: transactionEvent.type,
					description: transactionEvent.description,
					fromBlock: transactionEvent.fromBlock,
					events: result.events
				};

				//transform event data
				for (let i = 0; i < _transactionDataTransformers.length; i++) {
					returnData = await _transactionDataTransformers[i](transactionEvent, returnData);
				}
			} catch (err) {
				console.log(err);

				//event failed or timed out
				returnData = {
					filter: transactionEvent.filter,
					chainId: transactionEvent.chainId,
					success: false,
					name: transactionEvent.name,
					info: transactionEvent.info,
					type: transactionEvent.type,
					description: transactionEvent.description,
					fromBlock: transactionEvent.fromBlock
				};
			}

			//remove event from waiting list
			for (let i = 0; i < _waitingTransactionEvents.length; i++) {
				if (_waitingTransactionEvents[i].txHash === transactionEvent.txHash) {
					_waitingTransactionEvents.splice(i, 1)[0];
					storeWaitingTransactions();
					executeCallbackFunctions(_onWaitingTransactionsChangeFunctions, returnData);
					break;
				}
			}

			return returnData;
		}


		/////////////////////////////////////
		// Helper Functions (transactions) //
		/////////////////////////////////////


		// Helper function to get transaction status
		async function getTransactionStatus(txHash, chainId) {
			if (_state == "ready") {
				try {
					let provider = getWeb3Provider(chainId);
					if(provider != null) {
						let receipt = await provider.getTransactionReceipt(txHash);
						if (receipt != null) {
							return {
								txHash: txHash,
								status: receipt.status,
								confirmations: receipt.confirmations,
								logs: receipt.logs
							}
						}
					}
				} catch (err) { }
				return {
					txHash: txHash
				}
			} else {
				throw new Error("no web3");
			}
		}

		// Helper function to watch for transaction completion
		function transactionWait(transaction) {
			return $q(function (resolve, reject) {
				let start = (new Date).getTime();
				let check_transaction = async function () {
					try {
						let result = await getTransactionStatus(transaction.txHash, transaction.chainId);
						if (result.status === 1 && result.confirmations >= _transactionWaitConfirmations) {
							resolve(result);
							return;
						} else if (result.status === 0) {
							reject(new Error("Transaction " + transaction.txHash + " failed"));
							return;
						} else if (_transactionWaitTimeout > 0 && (new Date).getTime() - start > _transactionWaitTimeout) {
							reject(new Error("Transaction " + transaction.txHash + " wasn't processed within " + _transactionWaitTimeout / 1000 + " seconds"));
							return;
						}
						$timeout(check_transaction, _transactionWaitPoll);
					} catch (err) {
						reject(err);
					}
				};
				check_transaction();
			});
		}

		// Helper function to wait for a transaction to finish, transform its return data and remove it from waiting list
		async function transactionWaitTransformRemove(transaction) {
			let returnData = null;
			try {
				//wait on transaction to finish
				let result = await transactionWait(transaction);
				returnData = {
					txHash: result.txHash,
					chainId: transaction.chainId,
					success: true,
					type: transaction.type,
					description: transaction.description,
					logs: result.logs
				};

				//transform transaction data
				for (let i = 0; i < _transactionDataTransformers.length; i++) {
					returnData = await _transactionDataTransformers[i](transaction, returnData);
				}
			} catch (err) {
				console.log(err);

				//transaction failed or timed out
				returnData = {
					txHash: transaction.txHash,
					chainId: transaction.chainId,
					success: false,
					type: transaction.type,
					description: transaction.description,
				};
			}

			//remove transaction from waiting list
			for (let i = 0; i < _waitingTransactions.length; i++) {
				if (_waitingTransactions[i].txHash === transaction.txHash) {
					_waitingTransactions.splice(i, 1)[0];
					storeWaitingTransactions();
					executeCallbackFunctions(_onWaitingTransactionsChangeFunctions, returnData);
					break;
				}
			}

			return returnData;
		}

		// Helper function to check if waiting transactions should be reloaded for account
		function checkWaitingTransactionsForAccount() {
			let account = getActiveAccount();
			if (_waitingTransactionsAccount != account) {
				_waitingTransactionsAccount = account;
				loadWaitingTransactions();

			} else {
				//run callbacks anyway in case transactions changed
				executeCallbackFunctions(_onWaitingTransactionsChangeFunctions, null);
			}
		}

		// Helper function to update transactions to the current active account
		async function loadWaitingTransactions() {
			let account = getActiveAccount();
			_waitingTransactions = [];
			_waitingTransactionEvents = [];
			if (account && _state == "ready") {
				try {
					let accountHash = ethers.utils.keccak256(account);
					let storageLocation = ethers.utils.keccak256(accountHash);
					let storedTransactionData = storage.getItem('invaders_' + storageLocation, { encryptionKey: accountHash });
					if (storedTransactionData) {
						if(storedTransactionData.waitingTransactions) {
							
							//check the state of each transaction
							let now = (new Date()).getTime();
							for (let i = 0; i < storedTransactionData.waitingTransactions.length; i++) {
								let transaction = storedTransactionData.waitingTransactions[i];
								let timeElapsed = now - transaction.timestamp;
								if (_transactionWaitTimeout <= 0 || timeElapsed < _transactionWaitTimeout) {
									let result = await getTransactionStatus(transaction.txHash, transaction.chainId);
									let failed = (result.status === 0);
									let confirmed = (result.status === 1 && result.confirmations >= _transactionWaitConfirmations);
									if (!failed && !confirmed) {
										//transaction still waiting
										_waitingTransactions.push(transaction);
										
									} else if (!failed && confirmed) {
										//run data transformers for confirmation
										let returnData = {
											txHash: result.txHash,
											chainId: transaction.chainId,
											success: true,
											type: transaction.type,
											description: transaction.description,
											logs: result.logs
										}
										for (let i = 0; i < _transactionDataTransformers.length; i++) {
											returnData = await _transactionDataTransformers[i](transaction, returnData);
										}
									}
								}
							}

							//setup promises to wait for transaction finish
							for (let i = 0; i < _waitingTransactions.length; i++) {
								transactionWaitTransformRemove(_waitingTransactions[i]);
							}
						}
						if(storedTransactionData.waitingTransactionEvents) {
							
							//check the state of each transaction event
							let now = (new Date()).getTime();
							for (let i = 0; i < storedTransactionData.waitingTransactionEvents.length; i++) {
								let transactionEvent = storedTransactionData.waitingTransactionEvents[i];
								let timeElapsed = now - transactionEvent.timestamp;
								if (_transactionEventWaitTimeout <= 0 || timeElapsed < _transactionEventWaitTimeout) {
									let result = await getTransactionEventStatus(transactionEvent.filter, transactionEvent.fromBlock, transactionEvent.chainId);
									let confirmed = (result.events && result.events.length > 0);
									if (!confirmed) {
										//transaction event still waiting
										_waitingTransactionEvents.push(transactionEvent);
										
									} else {
										//run data transformers for confirmation
										let returnData = {
											filter: result.filter,
											chainId: transactionEvent.chainId,
											success: true,
											name: transactionEvent.name,
											info: transactionEvent.info,
											type: transactionEvent.type,
											description: transactionEvent.description,
											fromBlock: transactionEvent.fromBlock,
											events: result.events
										}
										for (let i = 0; i < _transactionDataTransformers.length; i++) {
											returnData = await _transactionDataTransformers[i](transactionEvent, returnData);
										}
									}
								}
							}

							//setup promises to wait for transaction event finish
							for (let i = 0; i < _waitingTransactionEvents.length; i++) {
								transactionEventWaitTransformRemove(_waitingTransactionEvents[i]);
							}
						}

						//save the new updated transaction list
						storeWaitingTransactions();
					}
				} catch (err) {
					console.log("Something went wrong trying to recover transaction history...");
				}
			}
			executeCallbackFunctions(_onWaitingTransactionsChangeFunctions, null);
		}

		// Helper function to store currently waiting transactions for later recovery
		async function storeWaitingTransactions() {
			let account = getActiveAccount();
			if (account && _state == "ready") {
				try {
					let accountHash = ethers.utils.keccak256(account);
					let storageLocation = ethers.utils.keccak256(accountHash);
					let storageData = {
						waitingTransactions: _waitingTransactions,
						waitingTransactionEvents: _waitingTransactionEvents
					}
					storage.setItem('invaders_' + storageLocation, storageData, { encryptionKey: accountHash });
					
				} catch (err) {
					console.log("Something went wrong trying to store transaction history...");
				}
			}
		}
	}
}());
