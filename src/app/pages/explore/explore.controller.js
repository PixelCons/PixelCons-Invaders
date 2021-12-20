(function () {
	angular.module('App')
		.controller('ExplorePageCtrl', ExplorePageCtrl);

	ExplorePageCtrl.$inject = ['$scope', '$mdMedia', '$routeParams', '$route', '$location', '$window', '$sce', '$timeout', 'decoder', 'web3Service', 'coreContract'];
	function ExplorePageCtrl($scope, $mdMedia, $routeParams, $route, $location, $window, $sce, $timeout, decoder, web3Service, coreContract) {
		var _this = this;
		var ownerCheckTimeout;
		const levelMinDefault = null;
		const levelMaxDefault = null;
		const sortByDefault = 'createdDesc';
		const realtimeFilterInPath = false;
		_this.getFilterTitleOwnerString = getFilterTitleOwnerString;
		_this.getFilterTitleString = getFilterTitleString;
		_this.copyLink = copyLink;
		_this.shareOnTwitter = shareOnTwitter;
		_this.shareOnFacebook = shareOnFacebook;
		_this.onLevelChange = onLevelChange;
		_this.onOwnerChange = onOwnerChange;
		_this.onTypeChange = onTypeChange;
		_this.onAttributeChange = onAttributeChange;
		_this.onSortChange = onSortChange;
		_this.filterOpen = false;
		_this.sortBy = sortByDefault;
		_this.levelMin = levelMinDefault;
		_this.levelMax = levelMaxDefault;
		_this.lastLevelMin = _this.levelMin;
		_this.latsLevelMax = _this.levelMax;
		_this.owner = null;
		_this.ownerAddress = null;
		_this.typeWater = true;
		_this.typeForest = true;
		_this.typeFire = true;
		_this.typeDesert = true;
		_this.typeElectric = true;
		_this.typeMetal = true;
		_this.attrDefence = true;
		_this.attrAttack = true;
		_this.attrLongRange = true;
		_this.attrShortRange = true;

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });
		
		loadPathParams();
		function loadPathParams() {
			if ($routeParams.sortBy !== undefined) {
				_this.sortBy = $routeParams.sortBy;
			}
			if ($routeParams.lvlMin !== undefined) {
				_this.levelMin = parseInt($routeParams.lvlMin);
				if(isNaN(_this.levelMin)) _this.levelMin = levelMinDefault;
			}
			if ($routeParams.lvlMax !== undefined) {
				_this.levelMax = parseInt($routeParams.lvlMax);
				if(isNaN(_this.levelMax)) _this.levelMin = levelMaxDefault;
			}
			if ($routeParams.excludeTypes !== undefined) {
				_this.typeWater = ($routeParams.excludeTypes.indexOf('water') == -1);
				_this.typeForest = ($routeParams.excludeTypes.indexOf('forest') == -1);
				_this.typeFire = ($routeParams.excludeTypes.indexOf('fire') == -1);
				_this.typeDesert = ($routeParams.excludeTypes.indexOf('desert') == -1);
				_this.typeElectric = ($routeParams.excludeTypes.indexOf('electric') == -1);
				_this.typeMetal = ($routeParams.excludeTypes.indexOf('metal') == -1);
			}
			if ($routeParams.excludeAttributes !== undefined) {
				_this.attrDefence = ($routeParams.excludeAttributes.indexOf('defence') == -1);
				_this.attrAttack = ($routeParams.excludeAttributes.indexOf('attack') == -1);
				_this.attrLongRange = ($routeParams.excludeAttributes.indexOf('longrange') == -1);
				_this.attrShortRange = ($routeParams.excludeAttributes.indexOf('shortrange') == -1);
			}
			if ($routeParams.owner !== undefined) {
				_this.owner = $routeParams.owner;
				onOwnerChange(true);
			}
		}
		
		function updatePathParams() {
			if(realtimeFilterInPath) {
				let excludeTypes = getExcludeTypesPathParam();
				let excludeAttributes = getExcludeAttributesPathParam();
				if (($routeParams.owner === undefined && _this.ownerAddress) || ($routeParams.owner !== undefined && _this.ownerAddress != $routeParams.owner)) {
					$location.search('owner', (_this.ownerAddress) ? _this.ownerAddress : undefined).replace();
				}
				if (($routeParams.lvlMin === undefined && _this.levelMin !== levelMinDefault) || ($routeParams.lvlMin !== undefined && _this.levelMin != $routeParams.lvlMin)) {
					$location.search('lvlMin', (_this.levelMin !== levelMinDefault) ? _this.levelMin : undefined).replace();
				}
				if (($routeParams.lvlMax === undefined && _this.levelMax !== levelMaxDefault) || ($routeParams.lvlMax !== undefined && _this.levelMax != $routeParams.lvlMax)) {
					$location.search('lvlMax', (_this.levelMax !== levelMaxDefault) ? _this.levelMax : undefined).replace();
				}
				if (($routeParams.excludeTypes === undefined && excludeTypes !== '') || ($routeParams.excludeTypes !== undefined && excludeTypes != $routeParams.excludeTypes)) {
					$location.search('excludeTypes', (excludeTypes !== '') ? excludeTypes : undefined).replace();
				}
				if (($routeParams.excludeAttributes === undefined && excludeAttributes !== '') || ($routeParams.excludeAttributes !== undefined && excludeAttributes != $routeParams.excludeAttributes)) {
					$location.search('excludeAttributes', (excludeAttributes !== '') ? excludeAttributes : undefined).replace();
				}
				if (($routeParams.sortBy === undefined && _this.sortBy !== sortByDefault) || ($routeParams.sortBy !== undefined && _this.sortBy != $routeParams.sortBy)) {
					$location.search('sortBy', (_this.sortBy !== sortByDefault) ? _this.sortBy : undefined).replace();
				}
			}
		}
		
		function getPathParams() {
			let excludeTypes = getExcludeTypesPathParam();
			let excludeAttributes = getExcludeAttributesPathParam();
			let pathParams = '';
			if (_this.ownerAddress) pathParams += (pathParams == '' ? '?' : '&') + 'owner=' + _this.ownerAddress;
			if (_this.levelMin !== levelMinDefault) pathParams += (pathParams == '' ? '?' : '&') + 'lvlMin=' + _this.levelMin;
			if (_this.levelMax !== levelMaxDefault) pathParams += (pathParams == '' ? '?' : '&') + 'lvlMax=' + _this.levelMax;
			if (excludeTypes) pathParams += (pathParams == '' ? '?' : '&') + 'excludeTypes=' + excludeTypes;
			if (excludeAttributes) pathParams += (pathParams == '' ? '?' : '&') + 'excludeAttributes=' + excludeAttributes;
			if (_this.sortBy !== sortByDefault) pathParams += (pathParams == '' ? '?' : '&') + 'sortBy=' + _this.sortBy;
			return pathParams;
		}
		
		function getExcludeTypesPathParam() {
			let excludeTypes = [];
			if(!_this.typeWater) excludeTypes.push('water');
			if(!_this.typeForest) excludeTypes.push('forest');
			if(!_this.typeFire) excludeTypes.push('fire');
			if(!_this.typeDesert) excludeTypes.push('desert');
			if(!_this.typeElectric) excludeTypes.push('electric');
			if(!_this.typeMetal) excludeTypes.push('metal');
			excludeTypes = excludeTypes.join(',');
			if(excludeTypes && excludeTypes != '') return excludeTypes;
			return null;
		}
				
		function getExcludeAttributesPathParam() {
			let excludeAttributes = [];
			if(!_this.attrDefence) excludeAttributes.push('defence');
			if(!_this.attrAttack) excludeAttributes.push('attack');
			if(!_this.attrLongRange) excludeAttributes.push('longrange');
			if(!_this.attrShortRange) excludeAttributes.push('shortrange');
			excludeAttributes = excludeAttributes.join(',');
			if(excludeAttributes && excludeAttributes != '') return excludeAttributes;
			return null;
		}
		
		loadInvaders();
		async function loadInvaders() {
			_this.invadersLoading = true;
			_this.error = null;
			try {
				let invaders = await coreContract.fetchAllInvaders();
				_this.invaders = addInvaderImageData(invaders);
				//TODO: filter
				
				_this.invadersLoading = false;
				//$scope.$apply();
				
			} catch(err) {
				_this.invadersLoading = false;
				_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + err);
			}
		}
		
		function onOwnerChange(noWait) {
			let processOwner = function() {
				if(!_this.owner) {
					_this.ownerAddress = null;
					_this.ownerAddressName = null;
					_this.checkingOwner = false;
					updatePathParams();
					
				} else if(web3Service.isAddress(_this.owner)) {
					_this.ownerAddress = web3Service.formatAddress(_this.owner);
					_this.checkingOwner = false;
					if(!!_this.ownerAddress) {
						_this.ownerAddressNameLoading = true;
						web3Service.awaitState(async function() {
							let owner = web3Service.formatAddress(_this.owner) || _this.owner;
							if(owner != _this.ownerAddress)_this.ownerAddressName = _this.owner.toLowerCase();
							else _this.ownerAddressName = await web3Service.reverseName(_this.ownerAddress);
							_this.ownerAddressNameLoading = false;
							$scope.$apply();
						}, true);
					} else {
						_this.ownerAddressName = null;
					}
					updatePathParams();
					
				} else {
					web3Service.awaitState(async function() {
						_this.ownerAddress = await web3Service.resolveName(_this.owner);
						_this.checkingOwner = false;
						if(!!_this.ownerAddress) {
							_this.ownerAddressNameLoading = true;
							let owner = web3Service.formatAddress(_this.owner) || _this.owner;
							if(owner != _this.ownerAddress) _this.ownerAddressName = _this.owner.toLowerCase();
							else _this.ownerAddressName = await web3Service.reverseName(_this.ownerAddress);
							_this.ownerAddressNameLoading = false;
						} else {
							_this.ownerAddressName = null;
						}
						$scope.$apply();
						updatePathParams();
					}, true);
				}
			}
			
			_this.checkingOwner = true;
			if(ownerCheckTimeout) $timeout.cancel(ownerCheckTimeout);
			if(noWait || !_this.owner) processOwner();
			else ownerCheckTimeout = $timeout(processOwner, 700);
		}
		
		function onLevelChange() {
			if(_this.lastLevelMin != _this.levelMin) {
				if(_this.levelMin === undefined) _this.levelMin = _this.lastLevelMin;
				if(_this.levelMin !== null) {
					_this.levelMin = parseInt("" + _this.levelMin);
					if(isNaN(_this.levelMin)) _this.levelMin = _this.lastLevelMin;
					if(_this.levelMin < 0) _this.levelMin = 0;
					if(_this.levelMin > 30) _this.levelMin = 30;
					if(_this.levelMax != null && _this.levelMax < _this.levelMin) _this.levelMax = _this.levelMin;
				}
				_this.lastLevelMin = _this.levelMin;
			}
			if(_this.lastLevelMax != _this.levelMax) {
				if(_this.levelMax === undefined) _this.levelMax = _this.lastLevelMax;
				if(_this.levelMax !== null) {
					_this.levelMax = parseInt("" + _this.levelMax);
					if(isNaN(_this.levelMax)) _this.levelMax = _this.lastLevelMax;
					if(_this.levelMax < 0) _this.levelMax = 0;
					if(_this.levelMax > 30) _this.levelMax = 30;
					if(_this.levelMin != null && _this.levelMax < _this.levelMin) _this.levelMin = _this.levelMax;
				}
				_this.lastLevelMax = _this.levelMax;
			}
			updatePathParams();
		}
		
		function onTypeChange() {
			updatePathParams();
		}
		
		function onAttributeChange() {
			updatePathParams();
		}
		
		function onSortChange() {
			updatePathParams();
		}
		
		// Returns the owner portion of title for filter
		function getFilterTitleOwnerString() {
			if(_this.ownerAddressName) return _this.ownerAddressName;
			return web3Service.compressString(_this.ownerAddress, 10);
		}
		
		// Returns the title for the filter
		function getFilterTitleString() {
			const filterTitleStart = _this.ownerAddress ? ', ' : 'Filtered By ';
			let filterTitle = filterTitleStart;
			
			if(_this.levelMin !== levelMinDefault ||  _this.levelMax !== levelMaxDefault) filterTitle += (filterTitle != filterTitleStart ? ', ' : '') + 'Level';
			if(getExcludeTypesPathParam()) filterTitle += (filterTitle != filterTitleStart ? ', ' : '') + 'Types';
			if(getExcludeAttributesPathParam()) filterTitle += (filterTitle != filterTitleStart ? ', ' : '') + 'Attributes';

			if(filterTitle == filterTitleStart) return _this.ownerAddress ? '' : 'All Invaders';
			return filterTitle;
		}

		// Copies share link to the clipboard
		function copyLink() {
			let copyText = document.getElementById("copyToClipboard");
			copyText.value = document.location.origin + '/explore' + getPathParams();
			copyText.select();
			document.execCommand("copy");
		}

		// Share this page on twitter
		function shareOnTwitter() {
			let url = "https://twitter.com/intent/tweet?url=";
			url += encodeURI(document.location.origin + '/explore' + getPathParams());
			url += '&text=' + encodeURI("Check out these PixelCon Invaders!");
			return url;
		}

		// Share this page on facebook
		function shareOnFacebook() {
			let url = "https://www.facebook.com/sharer/sharer.php?u="
			url += encodeURI(document.location.origin + '/explore' + getPathParams());
			return url;
		}
		
		// Generates images and adds class and offset details to the invader objects
		function addInvaderImageData(invaders) {
			const numPanels = Math.ceil(invaders.length / decoder.invadersPerPanel);
			let cssRules = decoder.getPanelStyleRules('.invadersExplorePage ', numPanels);
			if(cssRules && cssRules.length == numPanels) {
				for(let i=0; i<numPanels; i++) {
					let panelImage = decoder.generateInvadersPanel(invaders, i*decoder.invadersPerPanel);
					cssRules[i].style.backgroundSize = decoder.invadersPerWidth + '00%';
					cssRules[i].style.backgroundImage = 'url("' + panelImage + '")';
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
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		// Listen for account data changes
		web3Service.onAccountDataChange(function () {
			//checkUpdateData();
		}, $scope, true);

		// Listen for network data changes
		web3Service.onNetworkChange(function () {
			//if(_this.error) $route.reload();
		}, $scope, true);

		// Listen for transactions
		web3Service.onWaitingTransactionsChange(function (transactionData) {
			//if (transaction.type == _mintTypeDescription[0]) loadInvaders();
			//dirtyDatabaseData = transactionData && transactionData.success;
		}, $scope);
	}
}());
