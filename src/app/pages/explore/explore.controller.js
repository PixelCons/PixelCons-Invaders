(function () {
	angular.module('App')
		.controller('ExplorePageCtrl', ExplorePageCtrl);

	ExplorePageCtrl.$inject = ['$scope', '$mdMedia', '$routeParams', '$route', '$location', '$window', '$mdDialog', '$sce', '$timeout', 'decoder', 'storage', 'web3Service', 'coreContract'];
	function ExplorePageCtrl($scope, $mdMedia, $routeParams, $route, $location, $window, $mdDialog, $sce, $timeout, decoder, storage, web3Service, coreContract) {
		var _this = this;
		var ownerCheckTimeout;
		var levelCheckTimeout;
		const levelMinDefault = null;
		const levelMaxDefault = null;
		const sortByDefault = 'createdAsc';
		const smallViewDefault = $mdMedia('xs');
		const realtimeFilterInPath = false;
		const tooltipDelay = 300;
		_this.getFilterTitleOwnerString = getFilterTitleOwnerString;
		_this.getFilterTitleString = getFilterTitleString;
		_this.invaderMouseEnter = invaderMouseEnter;
		_this.invaderMouseLeave = invaderMouseLeave;
		_this.clearOwner = clearOwner;
		_this.copyLink = copyLink;
		_this.shareOnTwitter = shareOnTwitter;
		_this.shareOnFacebook = shareOnFacebook;
		_this.infoHint = infoHint;
		_this.onLevelChange = onLevelChange;
		_this.onOwnerChange = onOwnerChange;
		_this.onTypeChange = onTypeChange;
		_this.onAttributeChange = onAttributeChange;
		_this.onSortChange = onSortChange;
		_this.onViewSizeChange = onViewSizeChange;
		_this.onInvaderClick = onInvaderClick;
		_this.filterOpen = false;
		_this.smallView = smallViewDefault
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
		_this.attrDefense = true;
		_this.attrAttack = true;
		_this.attrLongRange = true;
		_this.attrShortRange = true;

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });
		
		// Loads the filter according to path params
		loadPathParams();
		function loadPathParams() {
			let ownerChanged = false;
				
			//first apply stored values
			let pathParams = storage.getItem('explore_page_filters', { level: storage.LEVEL_PAGE });
			if(pathParams) {
				_this.levelMin = (pathParams.lvlMin !== undefined) ? pathParams.lvlMin : levelMinDefault;
				_this.levelMax = (pathParams.lvlMax !== undefined) ? pathParams.lvlMax : levelMaxDefault;
				_this.sortBy = (pathParams.sortBy !== undefined) ? pathParams.sortBy : sortByDefault;;
				_this.smallView = (pathParams.smallView !== undefined) ? pathParams.smallView : smallViewDefault;;
				_this.typeWater = (!pathParams.excludeTypes || (pathParams.excludeTypes.indexOf('water') == -1));
				_this.typeForest = (!pathParams.excludeTypes || (pathParams.excludeTypes.indexOf('forest') == -1));
				_this.typeFire = (!pathParams.excludeTypes || (pathParams.excludeTypes.indexOf('fire') == -1));
				_this.typeDesert = (!pathParams.excludeTypes || (pathParams.excludeTypes.indexOf('desert') == -1));
				_this.typeElectric = (!pathParams.excludeTypes || (pathParams.excludeTypes.indexOf('electric') == -1));
				_this.typeMetal = (!pathParams.excludeTypes || (pathParams.excludeTypes.indexOf('metal') == -1));
				_this.attrDefense = (!pathParams.excludeAttributes || (pathParams.excludeAttributes.indexOf('defense') == -1));
				_this.attrAttack = (!pathParams.excludeAttributes || (pathParams.excludeAttributes.indexOf('attack') == -1));
				_this.attrLongRange = (!pathParams.excludeAttributes || (pathParams.excludeAttributes.indexOf('longrange') == -1));
				_this.attrShortRange = (!pathParams.excludeAttributes || (pathParams.excludeAttributes.indexOf('shortrange') == -1));
				if(pathParams.owner) {
					_this.owner = pathParams.owner;
					ownerChanged = true;
				}
			}
			
			//then apply path param values
			if ($routeParams.sortBy !== undefined) {
				_this.sortBy = $routeParams.sortBy;
			}
			if ($routeParams.smallView !== undefined) {
				_this.smallView = ($routeParams.smallView == 'true');
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
				_this.attrDefense = ($routeParams.excludeAttributes.indexOf('defense') == -1);
				_this.attrAttack = ($routeParams.excludeAttributes.indexOf('attack') == -1);
				_this.attrLongRange = ($routeParams.excludeAttributes.indexOf('longrange') == -1);
				_this.attrShortRange = ($routeParams.excludeAttributes.indexOf('shortrange') == -1);
			}
			if ($routeParams.owner !== undefined) {
				_this.owner = $routeParams.owner;
				ownerChanged = true;
			}
			
			if(ownerChanged) onOwnerChange(true);
		}
		
		// Updates the path params according to the current filter
		function updatePathParams() {
			let excludeTypes = getExcludeTypesPathParam();
			let excludeAttributes = getExcludeAttributesPathParam();
			if(realtimeFilterInPath) {
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
				if (($routeParams.smallView === undefined && _this.smallView !== smallViewDefault) || ($routeParams.smallView !== undefined && _this.smallView != $routeParams.smallView)) {
					$location.search('smallView', (_this.smallView !== smallViewDefault) ? _this.smallView : undefined).replace();
				}
			} else {
				
				// at least clear mismatched path params
				if ($routeParams.owner !== undefined && _this.ownerAddress != $routeParams.owner) $location.search('owner', undefined).replace();
				if ($routeParams.lvlMin !== undefined && _this.levelMin != $routeParams.lvlMin) $location.search('lvlMin', undefined).replace();
				if ($routeParams.lvlMax !== undefined && _this.levelMax != $routeParams.lvlMax) $location.search('lvlMax', undefined).replace();
				if ($routeParams.excludeTypes !== undefined && excludeTypes != $routeParams.excludeTypes) $location.search('excludeTypes', undefined).replace();
				if ($routeParams.excludeAttributes !== undefined && excludeAttributes != $routeParams.excludeAttributes) $location.search('excludeAttributes', undefined).replace();
				if ($routeParams.sortBy !== undefined && _this.sortBy != $routeParams.sortBy) $location.search('sortBy', undefined).replace();
				if ($routeParams.smallView !== undefined && _this.smallView != $routeParams.smallView) $location.search('smallView', undefined).replace();
			}
			
			//save params in storage
			let pathParams = {
				owner: _this.ownerAddress,
				lvlMin: _this.levelMin,
				lvlMax: _this.levelMax,
				excludeTypes: excludeTypes,
				excludeAttributes: excludeAttributes,
				sortBy: _this.sortBy,
				smallView: _this.smallView
			}
			storage.setItem('explore_page_filters', pathParams, { level: storage.LEVEL_PAGE });
		}
		
		// Gets the path params as string according to the current filter
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
			if (_this.smallView !== smallViewDefault) pathParams += (pathParams == '' ? '?' : '&') + 'smallView=' + _this.smallView;
			return pathParams;
		}
		
		// Gets list of excluded types for path param
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
		
		// Gets list of excluded attribues for path param
		function getExcludeAttributesPathParam() {
			let excludeAttributes = [];
			if(!_this.attrDefense) excludeAttributes.push('defense');
			if(!_this.attrAttack) excludeAttributes.push('attack');
			if(!_this.attrLongRange) excludeAttributes.push('longrange');
			if(!_this.attrShortRange) excludeAttributes.push('shortrange');
			excludeAttributes = excludeAttributes.join(',');
			if(excludeAttributes && excludeAttributes != '') return excludeAttributes;
			return null;
		}
		
		// Loads invaders for the page
		loadInvaders();
		async function loadInvaders() {
			_this.invadersLoading = true;
			_this.error = null;
			try {
				let invaders = await coreContract.fetchAllInvaders();
				_this.invaders = addInvaderImageData(invaders);
				filterInvaders();
				if(!invaders.length) {
					//no invaders
					_this.error = $sce.trustAsHtml('No Invaders');
					
				} else {
					//restore scroll position
					let pathParams = storage.getItem('explore_page_filters', { level: storage.LEVEL_PAGE });
					if(pathParams && pathParams.scrollTop && pathParams.scrollHeight) {
						$window.document.getElementById('contentBackground').style.height = pathParams.scrollHeight + 'px';
						$window.document.getElementById('scrollTarget').scrollTop = pathParams.scrollTop;
						delete pathParams.scrollHeight;
						delete pathParams.scrollTop;
						storage.setItem('explore_page_filters', pathParams, { level: storage.LEVEL_PAGE });
						$timeout(function(){
							$window.document.getElementById('contentBackground').style.height = null;
						});
					}
				}
				
				_this.invadersLoading = false;
				safeApply();
				
			} catch(err) {
				_this.invadersLoading = false;
				_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + err);
				safeApply();
			}
		}
		
		// Filters and sorts the loaded invaders
		function filterInvaders() {
			if(_this.invaders) {
				//sort
				_this.invaders.sort(function(invA, invB) {
					if(_this.sortBy == 'createdDesc') {
						return invB.number - invA.number;
					} else if(_this.sortBy == 'createdAsc') {
						return invA.number - invB.number;
					} else if(_this.sortBy == 'levelDesc') {
						return invB.level - invA.level;
					} else if(_this.sortBy == 'levelAsc') {
						return invA.level - invB.level;
					} else if(_this.sortBy == 'rarityDesc') {
						return invB.rarityScore - invA.rarityScore;
					}
				});
				
				//filter
				for(let i=0; i<_this.invaders.length; i++) {
					let invHidden = false;
					if(_this.levelMin != null && _this.levelMin != undefined && _this.invaders[i].level < _this.levelMin) invHidden |= true;
					if(_this.levelMax != null && _this.levelMax != undefined && _this.invaders[i].level > _this.levelMax) invHidden |= true;
					if(_this.ownerAddress && _this.invaders[i].owner.toLowerCase() != _this.ownerAddress.toLowerCase()) invHidden |= true;
					if(!_this.typeWater && _this.invaders[i].typeColor == '#29ADFF') invHidden |= true;
					if(!_this.typeForest && _this.invaders[i].typeColor == '#00E756') invHidden |= true;
					if(!_this.typeFire && _this.invaders[i].typeColor == '#FF004D') invHidden |= true;
					if(!_this.typeDesert && _this.invaders[i].typeColor == '#FFA300') invHidden |= true;
					if(!_this.typeElectric && _this.invaders[i].typeColor == '#FFFF27') invHidden |= true;
					if(!_this.typeMetal && _this.invaders[i].typeColor == '#FFF1E8') invHidden |= true;
					if(!_this.attrDefense && _this.invaders[i].skillColor == '#C2C3C7') invHidden |= true;
					if(!_this.attrAttack && _this.invaders[i].skillColor == '#83769C') invHidden |= true;
					if(!_this.attrLongRange && _this.invaders[i].rangeColor == '#5F574F') invHidden |= true;
					if(!_this.attrShortRange && _this.invaders[i].rangeColor == '#1D2B53') invHidden |= true;
					_this.invaders[i].hidden = invHidden;
				}
			}
		}
		
		// On filter item changes
		function onOwnerChange(noWait) {
			let processOwner = async function() {
				if(!_this.owner) {
					_this.ownerAddress = null;
					_this.ownerAddressName = null;
					_this.checkingOwner = false;
					updatePathParams();
					filterInvaders();
					
				} else if(web3Service.isAddress(_this.owner)) {
					_this.ownerAddress = web3Service.formatAddress(_this.owner);
					_this.checkingOwner = false;
					if(!!_this.ownerAddress) {
						_this.ownerAddressNameLoading = true;
						await web3Service.awaitState(true);
						
						let owner = web3Service.formatAddress(_this.owner) || _this.owner;
						if(owner != _this.ownerAddress)_this.ownerAddressName = _this.owner.toLowerCase();
						else _this.ownerAddressName = await web3Service.reverseName(_this.ownerAddress);
						_this.ownerAddressNameLoading = false;
						safeApply();
						
					} else {
						_this.ownerAddressName = null;
					}
					updatePathParams();
					filterInvaders();
					
				} else {
					await web3Service.awaitState(true);
					
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
					safeApply();
					updatePathParams();
					filterInvaders();
				}
			}
			
			_this.checkingOwner = true;
			if(ownerCheckTimeout) {
				$timeout.cancel(ownerCheckTimeout);
				ownerCheckTimeout = null;
			}
			if(noWait || !_this.owner) processOwner();
			else ownerCheckTimeout = $timeout(processOwner, 700);
		}
		function onLevelChange(noWait) {
			let processLevel = function() {
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
				filterInvaders();
			}
			if(levelCheckTimeout) {
				$timeout.cancel(levelCheckTimeout);
				levelCheckTimeout = null;
			}
			if(noWait) processLevel();
			else levelCheckTimeout = $timeout(processLevel, 400);
		}
		function onTypeChange() {
			updatePathParams();
			filterInvaders();
		}
		function onAttributeChange() {
			updatePathParams();
			filterInvaders();
		}
		function onSortChange() {
			updatePathParams();
			filterInvaders();
		}
		function onViewSizeChange(smallView) {
			_this.smallView = smallView;
			updatePathParams();
		}
		function onInvaderClick() {
			let pathParams = storage.getItem('explore_page_filters', { level: storage.LEVEL_PAGE }) || {};
			pathParams.scrollTop = $window.document.getElementById('scrollTarget').scrollTop;
			pathParams.scrollHeight = $window.document.getElementById('contentBackground').offsetHeight;
			storage.setItem('explore_page_filters', pathParams, { level: storage.LEVEL_PAGE });
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
		
		// Show/Hide invader tooltip
		var tooltipShow = {};
		var tooltipElement = {};
		function invaderMouseEnter(invader, ev) {
			if(tooltipShow[invader.id]) $timeout.cancel(tooltipShow[invader.id]);
			tooltipShow[invader.id] = $timeout(function() {
				const vw = Math.max(document.documentElement.clientWidth || 0, $window.innerWidth || 0);
				const rightMargin = vw - ev.srcElement.getBoundingClientRect().right;
				let tooltip = generateTooltip(invader, rightMargin < 140);
				tooltipElement[invader.id] = tooltip;
				ev.srcElement.parentElement.appendChild(tooltip);
				$timeout(function() { tooltip.classList.add('show'); }, 10);
			}, tooltipDelay);
		}
		function invaderMouseLeave(invader, ev) {
			if(tooltipShow[invader.id]) $timeout.cancel(tooltipShow[invader.id]);
			if(tooltipElement[invader.id]) {
				let tooltip = tooltipElement[invader.id];
				delete tooltipElement[invader.id];
				tooltip.classList.remove('show');
				$timeout(function() { tooltip.remove(); }, 100);
			}
		}
		function generateTooltip(invader, left) {
			let tooltip = document.createElement('div');
			tooltip.classList.add('tooltip');
			if(left) tooltip.classList.add('left');
			
			addTooltipLine(tooltip, 'Invader ' + ((invader.number || invader.number===0) ? invader.number : ''), null, null, false, true);
			addTooltipLine(tooltip, invader.type, invader.typeColor, invader.typeRarity);
			addTooltipLine(tooltip, 'Level ' + (invader.level > 0 ? invader.level : 'Uknown'), null, invader.levelRarity);
			addTooltipLine(tooltip, invader.skill, invader.skillColor);
			addTooltipLine(tooltip, invader.range, invader.rangeColor, invader.skillRangeRarity, true);
			
			return tooltip;
		}
		function addTooltipLine(tooltip, lineText, color, rarity, rarityShared, isTitle) {
			let line = document.createElement('div');
			line.className = 'line textLeft textSmall textDark' + (isTitle ? ' textBold' : '');
			
			if(color) {
				let colorDiv = document.createElement('div');
				colorDiv.className = 'color';
				colorDiv.style.backgroundColor = color;
				line.appendChild(colorDiv);
			}
			
			let textSpan = document.createElement('span');
			textSpan.className = (color || isTitle) ? '' : 'offset';
			textSpan.innerText = lineText;
			line.appendChild(textSpan);
			
			if(rarity) {
				let percentageDiv = document.createElement('div');
				percentageDiv.className = 'percentage' + (rarityShared ? ' shared' : '');
				percentageDiv.innerText = (rarity < 0.01) ? '(<0.01%)' : '(' + rarity + '%)';
				line.appendChild(percentageDiv);
			}
			tooltip.appendChild(line);
		}
		
		// Clears owner data
		function clearOwner() {
			_this.owner = null;
			onOwnerChange(true);
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
		
		// Gets info on the given topic
		function infoHint(topic) {
			$mdDialog.show({
				controller: 'InfoDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: HTMLTemplates['dialog.info'],
				parent: angular.element(document.body),
				locals: { topic: topic },
				bindToController: true,
				clickOutsideToClose: true
			});
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

		// Update from transaction
		function updateFromTransaction(transactionData) {
			if (transactionData && transactionData.success && transactionData.invader) {
				
				//update invaders
				if(_this.invaders) {
					let index = -1;
					for(let i=0; i<_this.invaders.length; i++) {
						if(_this.invaders[i].id == transactionData.invader.id) {
							index = i;
							break;
						}
					}
					if(index > -1) {
						angular.extend(_this.invaders[index], transactionData.invader);
						filterInvaders();
						safeApply();
					} else {
						_this.invaders.push(transactionData.invader);
						_this.invaders = addInvaderImageData(_this.invaders);
						filterInvaders();
						safeApply();
					}
				}
			}
		}
		
		// Safe apply to ensure fatest response possible
		function safeApply() {
			if($scope.$root && $scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') $scope.$apply();
		}

		// Listen for network data changes
		web3Service.onNetworkChange(function () {
			if(_this.error) loadInvaders();
		}, $scope, true);

		// Listen for transactions
		web3Service.onWaitingTransactionsChange(function (transactionData) {
			updateFromTransaction(transactionData);
		}, $scope);
	}
}());
