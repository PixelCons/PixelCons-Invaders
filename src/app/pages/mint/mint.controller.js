(function () {
	angular.module('App')
		.controller('MintPageCtrl', MintPageCtrl);

	MintPageCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$routeParams', '$mdToast', '$location', '$window', '$sce', 'web3Service', 'coreContract', 'decoder'];
	function MintPageCtrl($scope, $mdMedia, $mdDialog, $routeParams, $mdToast, $location, $window, $sce, web3Service, coreContract, decoder) {
		var _this = this;
		_this.loadMarketData = loadMarketData;
		
		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });
		
		
		
		
		loadPageData();
		async function loadPageData() {
			_this.accountAddressLoading = true;
			_this.error = null;
			web3Service.awaitState(async function() {
				try {
					let web3state = web3Service.getState();
					if (web3state == "ready") {
						_this.accountAddress = web3Service.getActiveAccount();
						if (_this.accountAddress) {
							_this.accountPixelcons = await coreContract.getAccountPixelcons(_this.accountAddress);
							_this.accountInvaderPixelcons = addPixelconInvaderImageData(_this.accountPixelcons);
							
							
							
						} else {
							if (web3Service.isReadOnly()) _this.error = $sce.trustAsHtml('<b>Account Not Connected:</b><br/>Get started by visiting the <a class="textDark" href="/start">start</a> page');
							else if (web3Service.isPrivacyMode()) _this.error = $sce.trustAsHtml('<b>Account Not Connected:</b><br/>Please connect your Ethereum account');
							else _this.error = $sce.trustAsHtml('<b>Account Not Connected:</b><br/>Please log into ' + web3Service.getProviderName());
						}
					} else if (web3state == "not_enabled") {
						_this.error = $sce.trustAsHtml('<b>Account Not Connected:</b><br/>Get started by visiting the <a class="textDark" href="/start">start</a> page');
					} else {
						_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>Unkown Network');
					}
					
					_this.accountAddressLoading = false;
					safeApply();
					
				} catch(err) {
					_this.accountAddressLoading = false;
					_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + err);
					safeApply();
				}
			}, true);
		}
		
		
		async function loadMarketData() {
			_this.scanOpen = !_this.scanOpen;
			if(_this.marketData === undefined) {
				_this.marketLoading = true;
				let marketData = await coreContract.getPixelconsForSale();
				_this.marketData = addMarketItemImageData(marketData);
				
				
				
				_this.marketLoading = false;
				safeApply();
			}
		}
		
		
		
		
		
		
		
		
		
		
		
		
		
		// Generates images and adds class and offset details to the market item objects
		function addMarketItemImageData(marketItems) {
			//market items
			const numMarketItemPanels = Math.ceil(marketItems.length / decoder.marketItemsPerPanel);
			let marketItemCssRules = decoder.getPanelStyleRules('.invadersMintPage .marketItem', numMarketItemPanels);
			if(marketItemCssRules && marketItemCssRules.length == numMarketItemPanels) {
				for(let i=0; i<numMarketItemPanels; i++) {
					let panelImage = decoder.generateMarketItemsPanel(marketItems, i*decoder.marketItemsPerPanel);
					marketItemCssRules[i].style.backgroundSize = decoder.marketItemsPerWidth + '00%';
					marketItemCssRules[i].style.backgroundImage = 'url("' + panelImage + '")';
					for(let j=0; j<decoder.marketItemsPerPanel; j++) {
						const marketItemIndex = (i*decoder.marketItemsPerPanel)+j;
						if(marketItemIndex < marketItems.length) {
							const marketItemPanelIndex = marketItemIndex % decoder.marketItemsPerPanel;
							const offsetX = ((marketItemPanelIndex % decoder.marketItemsPerWidth) / (decoder.marketItemsPerWidth - 1)) * 100;
							const offsetY = (Math.floor(marketItemPanelIndex/decoder.marketItemsPerWidth) / (decoder.marketItemsPerWidth - 1)) * 100;
							
							marketItems[marketItemIndex].panelClass = 'panel' + i;
							marketItems[marketItemIndex].panelOffset = offsetX + '% ' + offsetY + '%';
						}
					}
				}
			}
			return marketItems;
		}
		
		// Generates images and adds class and offset details to the invader and pixelcon objects
		function addPixelconInvaderImageData(pixelcons) {
			//pixelcons
			const numPixelconPanels = Math.ceil(pixelcons.length / decoder.pixelconsPerPanel);
			let pixelconCssRules = decoder.getPanelStyleRules('.invadersMintPage .pixelcon', numPixelconPanels);
			if(pixelconCssRules && pixelconCssRules.length == numPixelconPanels) {
				for(let i=0; i<numPixelconPanels; i++) {
					let panelImage = decoder.generatePixelconsPanel(pixelcons, i*decoder.pixelconsPerPanel);
					pixelconCssRules[i].style.backgroundSize = decoder.pixelconsPerWidth + '00%';
					pixelconCssRules[i].style.backgroundImage = 'url("' + panelImage + '")';
					for(let j=0; j<decoder.pixelconsPerPanel; j++) {
						const pixelconIndex = (i*decoder.pixelconsPerPanel)+j;
						if(pixelconIndex < pixelcons.length) {
							const pixelconPanelIndex = pixelconIndex % decoder.pixelconsPerPanel;
							const offsetX = ((pixelconPanelIndex % decoder.pixelconsPerWidth) / (decoder.pixelconsPerWidth - 1)) * 100;
							const offsetY = (Math.floor(pixelconPanelIndex/decoder.pixelconsPerWidth) / (decoder.pixelconsPerWidth - 1)) * 100;
							
							pixelcons[pixelconIndex].panelClass = 'panel' + i;
							pixelcons[pixelconIndex].panelOffset = offsetX + '% ' + offsetY + '%';
						}
					}
				}
			}
			
			//convert to invaderPixelcons list
			let invaders = [];
			for(let i=0; i<pixelcons.length; i++) {
				for(let j=0; j<pixelcons[i].invaders.length; j++) {
					pixelcons[i].invaders[j].pixelcon = {
						id: pixelcons[i].id,
						panelClass:	pixelcons[i].panelClass,
						panelOffset: pixelcons[i].panelOffset
					}
					invaders.push(pixelcons[i].invaders[j]);
				}
			}
			
			//invaders
			const numInvaderPanels = Math.ceil(invaders.length / decoder.invadersPerPanel);
			let invaderCssRules = decoder.getPanelStyleRules('.invadersMintPage .invader', numInvaderPanels);
			if(invaderCssRules && invaderCssRules.length == numInvaderPanels) {
				for(let i=0; i<numInvaderPanels; i++) {
					let panelImage = decoder.generateInvadersPanel(invaders, i*decoder.invadersPerPanel);
					invaderCssRules[i].style.backgroundSize = decoder.invadersPerWidth + '00%';
					invaderCssRules[i].style.backgroundImage = 'url("' + panelImage + '")';
					for(let j=0; j<decoder.invadersPerPanel; j++) {
						const invaderIndex = (i*decoder.invadersPerPanel)+j;
						if(invaderIndex < invaders.length) {
							const invaderPanelIndex = invaderIndex % decoder.invadersPerPanel;
							const offsetX = ((invaderPanelIndex % decoder.invadersPerWidth) / (decoder.invadersPerWidth - 1)) * 100;
							const offsetY = (Math.floor(invaderPanelIndex/decoder.invadersPerWidth) / (decoder.invadersPerWidth - 1)) * 100;
							
							invaders[invaderIndex].panelClass = 'panel' + i;
							invaders[invaderIndex].panelOffset = offsetX + '% ' + offsetY + '%';
						}
					}
				}
			}
			return invaders;
		}
		
		
		
		/*
		_this.setPixel = setPixel;
		_this.setColor = setColor;
		_this.clear = clear;
		_this.create = create;
		_this.createCollection = createCollection;
		_this.canCreate = canCreate;
		_this.canCreateCollection = canCreateCollection;
		_this.setTab = setTab;
		_this.filterPixelconName = filterPixelconName;
		_this.tabSelection = ($routeParams.view == 'advanced') ? 'advanced' : ($routeParams.view == 'collection') ? 'collection' : 'canvas';
		_this.pixelconId = '';
		_this.selectedColor = 0;
		_this.colorPalette = {
			'0': '#000000',
			'1': '#1D2B53',
			'2': '#7E2553',
			'3': '#008751',
			'4': '#AB5236',
			'5': '#5F574F',
			'6': '#C2C3C7',
			'7': '#FFF1E8',
			'8': '#FF004D',
			'9': '#FFA300',
			'10': '#FFFF27',
			'11': '#00E756',
			'12': '#29ADFF',
			'13': '#83769C',
			'14': '#FF77A8',
			'15': '#FFCCAA'
		}

		// Start with blank canvas
		_this.canvasPixels = [];
		for (let i = 0; i < 64; i++) _this.canvasPixels[i] = 0;
		generatePixelconId();

		// Check if create is supported
		checkCreateSupported();
		function checkCreateSupported() {
			web3Service.awaitState(function () {
				let web3state = web3Service.getState();
				if (web3state == "ready") {
					if (web3Service.getActiveAccount()) {
						_this.showButtons = true;
					} else {
						if (web3Service.isReadOnly()) {
							_this.infoText = 'You need an Account to create PixelCons';
							_this.showStartButton = true;
						} else if (web3Service.isPrivacyMode()) {
							_this.infoText = 'Please connect your Account';
						} else {
							_this.infoText = 'Please log into ' + web3Service.getProviderName();
						}
						_this.showButtons = false;
					}
				} else if (web3state == "not_enabled") {
					_this.infoText = 'You need an Account to create PixelCons';
					_this.showStartButton = true;
					_this.showButtons = false;
				} else {
					_this.infoText = 'Unkown Network Error';
					_this.showButtons = false;
				}
				fetchForCollection();
			}, true);
		}

		// Set pixel to the selected color
		function setPixel(index, $event) {
			if ($event && $event.buttons != 1) return;
			_this.canvasPixels[index] = _this.selectedColor;
			generatePixelconId();
		}

		// Set color
		function setColor(index) {
			_this.selectedColor = index;
		}

		// Create the pixelcon
		function create(ev, pixelconId) {
			if(_this.tabSelection=='canvas') {
				$mdDialog.show({
					controller: 'PixelconDialogCtrl',
					controllerAs: 'ctrl',
					templateUrl: HTMLTemplates['dialog.pixelcon'],
					parent: angular.element(document.body),
					locals: { pixelconId: _this.pixelconId },
					bindToController: true,
					clickOutsideToClose: true
				});
			} else if(pixelconId) {
				$mdDialog.show({
					controller: 'PixelconDialogCtrl',
					controllerAs: 'ctrl',
					templateUrl: HTMLTemplates['dialog.pixelcon'],
					parent: angular.element(document.body),
					locals: { pixelconId: pixelconId },
					bindToController: true,
					clickOutsideToClose: true
				});
			}
		}

		// Create the pixelcon collection
		function createCollection(ev) {
			let pixelconIds = [];
			for (let i = 0; i < _this.collectionPixelcons.length; i++) {
				if (_this.collectionPixelcons[i].selected) pixelconIds.push(_this.collectionPixelcons[i].id);
			}
			$mdDialog.show({
				controller: 'CollectionDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: HTMLTemplates['dialog.collection'],
				parent: angular.element(document.body),
				locals: { pixelconIds: pixelconIds },
				bindToController: true,
				clickOutsideToClose: true
			});
		}

		// Checks if valid state for creating a pixelcon
		function canCreate() {
			if(_this.tabSelection=='canvas') {
				return _this.pixelconId != '0x0000000000000000000000000000000000000000000000000000000000000000';
			} else {
				return _this.advancedPixelcons && _this.advancedPixelcons.length > 0;
			}
		}

		// Checks if valid state for creating a pixelcon collection
		function canCreateCollection() {
			if(_this.tabSelection=='collection') {
				let selectCount = 0;
				if(_this.collectionPixelcons) {
					for(let i = 0; i < _this.collectionPixelcons.length; i++) {
						if(_this.collectionPixelcons[i].selected) selectCount++;
					}
				}
				return selectCount > 1;
			} else {
				return _this.advancedPixelcons && _this.advancedPixelcons.length > 0;
			}
		}
		
		// Clear the canvas
		function clear(ev) {
			if(_this.tabSelection=='canvas') {
				for (let i = 0; i < 64; i++) _this.canvasPixels[i] = 0;
				generatePixelconId();
			} else if(_this.tabSelection=='collection') {
				if(_this.collectionPixelcons) {
					for(let i = 0; i < _this.collectionPixelcons.length; i++) {
						_this.collectionPixelcons[i].selected = false;
					}
				}
			} else {
				_this.alreadyCreatedPixelconIds = null;
				_this.advancedPixelcons = null;
			}
		}
		
		// Sets the tab mode
		function setTab(selection) {
			if(_this.tabSelection != selection) {
				_this.tabSelection = selection;
				if (($routeParams.view === undefined && _this.tabSelection != 'canvas') || ($routeParams.view !== undefined && _this.tabSelection != $routeParams.view)) {
					$location.search('view', (_this.tabSelection == 'advanced') ? 'advanced' : (_this.tabSelection == 'collection') ? 'collection' : undefined).replace();
				}
				fetchForCollection();
			}
		}
		
		// Queries for collection creating data
		function fetchForCollection() {
			if(_this.tabSelection == 'collection') {
				let account = web3Service.getActiveAccount();
				if(account) {
					_this.loading = true;
					_this.error = null;
					_this.collectionPixelcons = [];
					coreContract.fetchPixelconsByCreator(account).then(function(pixelcons) {
						_this.loading = false;
						
						//filter to only what is owned and not already in a collection
						for(let i = 0; i < pixelcons.length; i++) {
							if(pixelcons[i].owner == account && !pixelcons[i].collection) {
								_this.collectionPixelcons.push(pixelcons[i]);
							}
						}
					}, function (reason) {
						_this.loading = false;
						_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
					});
				} else {
					
					//simply show blank page
					_this.collectionPixelcons = [];
				}
			}
		}
		
		// Processes an uploaded file for create
		$window.advancedCreateFileUpload = function(input) {
			let file = input.files[0];
			input.value = '';
			
			if(file) {
				_this.loading = true;
				let ids = [];
				decoder.decodePNG(file).then(function(decodedIds) {
					ids = decodedIds;
					coreContract.fetchPixelconsByIds(ids).then(function(pixelcons) {
						_this.loading = false;
						_this.alreadyCreatedPixelconIds = [];
						_this.advancedPixelcons = []
						
						//determine which ids already exist
						for(let i = 0; i < ids.length; i++) {
							let exists = false;
							for(let j = 0; j < pixelcons.length; j++) {
								if(ids[i] == pixelcons[j].id) {
									exists = true;
									break;
								}
							}
							if(exists) {
								_this.alreadyCreatedPixelconIds.push(ids[i]);
							} else {
								_this.advancedPixelcons.push({
									id: ids[i],
									name: null
								});
							}
						}
					}, function(err) {
						//failed to validate
						_this.loading = false;
						_this.alreadyCreatedPixelconIds = [];
						_this.advancedPixelcons = [];
						
						//assume they are all good
						for(let i = 0; i < ids.length; i++) {
							_this.advancedPixelcons.push({
								id: ids[i],
								name: null
							});
						}
					});
				}, function(err) {
					// failed to decode
					_this.loading = false;
					$mdToast.show(
						$mdToast.simple()
							.action('Templates')
							.highlightAction(true)
							.highlightClass('md-warn')
							.textContent('Failed to decode PNG! (see tempates for working examples)')
							.position('top right')
							.hideDelay(10000)
					).then(function(response) {
						if (response === 'ok') {
							$window.open('/data/PixelCons_AdvancedCreatorTemplates.zip');
						}
					});
				});
			}
		}

		// Filter name
		function filterPixelconName(pixelcon) {
			pixelcon.name = web3Service.filterTextToByteSize(pixelcon.name, 12);
		}

		// Generate the pixelcon id from canvas
		function generatePixelconId() {
			_this.pixelconId = '0x';
			let hexDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
			for (let i = 0; i < 64; i++) _this.pixelconId += hexDigits[_this.canvasPixels[i]];
		}
		
		// Checks if page needs to be reloaded
		function checkReload(transactionData) {
			if (transactionData && transactionData.success && transactionData.pixelcons) {
				//collection page
				if(_this.tabSelection == 'collection') {
					let effectsLoadedPixelcons = false;
					for(let i = 0; i < transactionData.pixelcons.length; i++) {
						if(_this.collectionPixelcons) {
							for(let j = 0; j < _this.collectionPixelcons.length; j++) {
								if(transactionData.pixelcons[i].id == _this.collectionPixelcons[j].id) {
									effectsLoadedPixelcons = true;
									break;
								}
							}
						}
						if(effectsLoadedPixelcons) break;
					}
					if(effectsLoadedPixelcons) fetchForCollection();
				
				//advanced page
				} else if(_this.tabSelection == 'advanced') {
					for(let i = 0; i < transactionData.pixelcons.length; i++) {
						if(_this.advancedPixelcons) {
							let matches = [];
							for(let j = 0; j < _this.advancedPixelcons.length; j++) {
								if(transactionData.pixelcons[i].id == _this.advancedPixelcons[j].id) {
									matches.push(j);
									break;
								}
							}
							if(matches.length) {
								for(let j=0; j<matches.length; j++) {
									_this.alreadyCreatedPixelconIds.push(_this.advancedPixelcons.splice(matches[j], 1)[0].id);
								}
							}
						}
					}
				}
			}
		}
		*/
		
		

		// Safe apply to ensure fatest response possible
		function safeApply() {
		 if($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') $scope.$apply();
		}
		
		// Listen for account data changes
		web3Service.onAccountDataChange(loadPageData, $scope, true);

		// Listen for transactions
		web3Service.onWaitingTransactionsChange(function (transactionData) {
			//if (transaction.type == _mintTypeDescription[0]) loadInvaders();
			//dirtyDatabaseData = transactionData && transactionData.success;
		}, $scope);
		
	}
}());
