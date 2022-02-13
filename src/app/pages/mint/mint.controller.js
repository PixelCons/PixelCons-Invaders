(function () {
	angular.module('App')
		.controller('MintPageCtrl', MintPageCtrl);

	MintPageCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$timeout', '$sce', 'web3Service', 'coreContract', 'decoder'];
	function MintPageCtrl($scope, $mdMedia, $mdDialog, $timeout, $sce, web3Service, coreContract, decoder) {
		var _this = this;
		const marketSearchEnabled = false;
		const uncoverInvadersEnabled = false;
		const sortByDefault = 'rarityDesc';
		const tooltipDelay = 300;
		_this.marketSearchEnabled = marketSearchEnabled;
		_this.uncoverInvadersEnabled = uncoverInvadersEnabled;
		_this.infoHint = infoHint;
		_this.sortBy = sortByDefault;
		_this.marketSortBy = sortByDefault;
		_this.loadMarketData = loadMarketData;
		_this.mintInvader = mintInvader;
		_this.filterPageData = filterPageData;
		_this.filterMarketData = filterMarketData;
		_this.invaderMouseEnter = invaderMouseEnter;
		_this.invaderMouseLeave = invaderMouseLeave;
		_this.marketMouseEnter = marketMouseEnter;
		_this.marketMouseMove = marketMouseMove;
		_this.marketMouseLeave = marketMouseLeave;
		
		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });
		
		// Loads account related data for invader minting
		loadPageData();
		async function loadPageData() {
			if(uncoverInvadersEnabled) {
				_this.accountAddressLoading = true;
				_this.error = null;
				try {
					await web3Service.awaitState(true);
					
					_this.maxSupply = await coreContract.getMaxInvaders();
					_this.totalSupply = await coreContract.getTotalInvaders(true);
					if(_this.totalSupply >= _this.maxSupply) {
						_this.noMore = true;
					
					} else {
						let web3state = web3Service.getState();
						if (web3state == "ready") {
							_this.accountAddress = web3Service.getActiveAccount();
							if (_this.accountAddress) {
								_this.accountPixelcons = await coreContract.getAccountPixelcons(_this.accountAddress);
								_this.accountInvaderPixelcons = addPixelconInvaderImageData(_this.accountPixelcons);
								filterPageData();
								
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
					}
					
					_this.accountAddressLoading = false;
					safeApply();
					
				} catch(err) {
					_this.accountAddressLoading = false;
					_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + err);
					safeApply();
				}
			} else {
				
				//market not enabled
				_this.accountAddressLoading = true;
				_this.error = null;
				try {
					await web3Service.awaitState(true);
					_this.maxSupply = await coreContract.getMaxInvaders();
					_this.totalSupply = await coreContract.getTotalInvaders(true);
					
					_this.error = $sce.trustAsHtml('<b>Uncovering Invaders Has Not Yet Been Enabled</b>');
					_this.accountAddressLoading = false;
					safeApply();
					
				} catch(err) {
					_this.accountAddressLoading = false;
					_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + err);
					safeApply();
				}
			}
		}
		
		// Loads market data for the more section
		async function loadMarketData() {
			_this.scanOpen = !_this.scanOpen;
			if(_this.scanOpen && _this.marketData === undefined) {
				_this.marketLoading = true;
				_this.marketError = null;
				try {
					let marketData = await coreContract.getPixelconsForSale();
					_this.marketData = addMarketItemImageData(marketData);
					filterMarketData();
					
					_this.marketLoading = false;
					safeApply();
					
				} catch(err) {
					_this.marketLoading = false;
					_this.marketError = $sce.trustAsHtml('<b>Market Error:</b><br/>' + err);
					safeApply();
				}
			}
		}
		
		// Mints an invader
		function mintInvader(invaderPixelcon) {
			$mdDialog.show({
				controller: 'MintDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: HTMLTemplates['dialog.mint'],
				parent: angular.element(document.body),
				locals: { invaderPixelcon: invaderPixelcon },
				bindToController: true,
				clickOutsideToClose: true
			});
		}
		
		// Filters the page data
		function filterPageData() {
			if(_this.accountInvaderPixelcons) {
				_this.accountInvaderPixelcons.sort(function(invA, invB) {
					if(_this.sortBy == 'levelDesc') {
						return invB.level - invA.level;
					} else if(_this.sortBy == 'rarityDesc') {
						return invB.rarityScore - invA.rarityScore;
					} else if(_this.sortBy == 'pixelconDesc') {
						if(invB.pixelcon.index == invA.pixelcon.index) return invA.mintIndex - invB.mintIndex;
						return invB.pixelcon.index - invA.pixelcon.index;
					}
				});
			}
		}
		
		// Filters the market data
		function filterMarketData() {
			if(_this.marketData) {
				_this.marketData.sort(function(invA, invB) {
					if(_this.marketSortBy == 'priceDesc') {
						return invB.priceUSD - invA.priceUSD;
					} else if(_this.marketSortBy == 'priceAsc') {
						return invA.priceUSD - invB.priceUSD;
					} else if(_this.marketSortBy == 'levelDesc') {
						return invB.maxLevel - invA.maxLevel;
					} else if(_this.marketSortBy == 'rarityDesc') {
						return invB.maxRarity - invA.maxRarity;
					}
				});
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
							const marketItemsPerHeight = decoder.marketItemsPerPanel / decoder.marketItemsPerWidth;
							const offsetX = ((marketItemPanelIndex % decoder.marketItemsPerWidth) / (decoder.marketItemsPerWidth - 1)) * 100;
							const offsetY = (Math.floor(marketItemPanelIndex/decoder.marketItemsPerWidth) / (marketItemsPerHeight - 1)) * 100;
							
							marketItems[marketItemIndex].panelClass = 'panel' + i;
							marketItems[marketItemIndex].panelOffset = offsetX + '% ' + offsetY + '%';
						}
					}
				}
			}
			
			//tool tips
			let marketItemTtCssRules = decoder.getPanelStyleRules('.invadersMintPage .marketItemTt', numMarketItemPanels);
			if(marketItemTtCssRules && marketItemTtCssRules.length == numMarketItemPanels) {
				for(let i=0; i<numMarketItemPanels; i++) {
					let panelImage = decoder.generateMarketItemTtsPanel(marketItems, i*decoder.marketItemsPerPanel);
					marketItemTtCssRules[i].style.backgroundSize = decoder.marketItemsPerWidth + '00%';
					marketItemTtCssRules[i].style.backgroundImage = 'url("' + panelImage + '")';
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
						index: pixelcons[i].index,
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
		
		// Show/Hide invader tooltip
		var tooltipShow = {};
		var tooltipElement = {};
		function invaderMouseEnter(invader, ev) {
			if(tooltipShow[invader.id]) $timeout.cancel(tooltipShow[invader.id]);
			tooltipShow[invader.id] = $timeout(function() {
				const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
				const rightMargin = vw - ev.srcElement.getBoundingClientRect().right;
				let tooltip = generateTooltip(invader, rightMargin < 140, false);
				tooltipElement[invader.id] = tooltip;
				ev.srcElement.appendChild(tooltip);
				$timeout(function() { tooltip.classList.add('show'); }, 10);
				delete tooltipShow[invader.id];
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
		function generateTooltip(invader, left, dark) {
			let tooltip = document.createElement('div');
			tooltip.classList.add('tooltip');
			if(left) tooltip.classList.add('left');
			if(dark) tooltip.classList.add('dark');
			
			addTooltipLine(tooltip, 'Invader ' + ((invader.number || invader.number===0) ? invader.number : ''), null, null, false, true);
			addTooltipLine(tooltip, invader.type, invader.typeColor, invader.typeRarity);
			addTooltipLine(tooltip, 'Level ' + (invader.level > 0 ? invader.level : 'Uknown'), null, invader.levelRarity);
			addTooltipLine(tooltip, invader.skill, invader.skillColor);
			addTooltipLine(tooltip, invader.range, invader.rangeColor, invader.skillRangeRarity, true);
			
			return tooltip;
		}
		function updateTooltip(tooltip, invader) {
			while (tooltip.firstChild) tooltip.removeChild(tooltip.firstChild);
			
			addTooltipLine(tooltip, 'Invader ' + ((invader.number || invader.number===0) ? invader.number : ''), null, null, false, true);
			addTooltipLine(tooltip, invader.type, invader.typeColor, invader.typeRarity);
			addTooltipLine(tooltip, 'Level ' + (invader.level > 0 ? invader.level : 'Uknown'), null, invader.levelRarity);
			addTooltipLine(tooltip, invader.skill, invader.skillColor);
			addTooltipLine(tooltip, invader.range, invader.rangeColor, invader.skillRangeRarity, true);
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
		
		// Show/Hide market tooltip
		var marketTooltipShow = {};
		var marketTooltipElement = {};
		var marketTooltipInvaderIndex = {};
		function marketMouseEnter(item, ev) {
			if(marketTooltipShow[item.id]) $timeout.cancel(marketTooltipShow[item.id]);
			marketTooltipShow[item.id] = $timeout(function() {
				let srcEle = ev.srcElement;
				while(!srcEle.classList.contains('marketItemContainer')) srcEle = srcEle.parentElement;
				let contEle = ev.srcElement;
				while(!contEle.classList.contains('moreOptionContainer')) contEle = contEle.parentElement;
				const rightMargin = contEle.getBoundingClientRect().right - srcEle.getBoundingClientRect().right;
				let invaderIndex = marketTooltipInvaderIndex[item.id] ? marketTooltipInvaderIndex[item.id] : 0;
				let tooltip = generateTooltip(item.invaders[invaderIndex], rightMargin < 140, true);
				marketTooltipElement[item.id] = tooltip;
				srcEle.appendChild(tooltip);
				$timeout(function() { tooltip.classList.add('show'); }, 10);
				delete marketTooltipShow[item.id];
			}, tooltipDelay);
		}
		function marketMouseLeave(item, ev) {
			if(marketTooltipShow[item.id]) $timeout.cancel(marketTooltipShow[item.id]);
			if(marketTooltipElement[item.id]) {
				let tooltip = marketTooltipElement[item.id];
				delete marketTooltipElement[item.id];
				delete marketTooltipInvaderIndex[item.id];
				tooltip.classList.remove('show');
				$timeout(function() { tooltip.remove(); }, 100);
			}
		}
		function marketMouseMove(item, ev) {
			let invaderIndex = null;
			if(ev.layerX > 90) {
				if(ev.layerY > 48) {
					if(item.invaders.length > 1) invaderIndex = 1;
				} else if(ev.layerY > 26) {
					if(item.invaders.length > 3) invaderIndex = 3;
				} else {
					if(item.invaders.length > 5) invaderIndex = 5;
				}
			} else if(ev.layerX > 67) {
				if(ev.layerY > 48) {
					if(item.invaders.length > 0) invaderIndex = 0;
				} else if(ev.layerY > 26) {
					if(item.invaders.length > 2) invaderIndex = 2;
				} else {
					if(item.invaders.length > 4) invaderIndex = 4;
				}
			}
			if(invaderIndex != null && invaderIndex != marketTooltipInvaderIndex[item.id]) {
				let tooltip = marketTooltipElement[item.id];
				if(tooltip) updateTooltip(tooltip, item.invaders[invaderIndex]);
				
				marketTooltipInvaderIndex[item.id] = invaderIndex;
			}
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

		// Update from transaction
		function updateFromTransaction(transactionData) {
			if (transactionData && transactionData.success && transactionData.pixelcon) {
				let updated = false;
				
				//remove now minted invaders
				if(_this.accountInvaderPixelcons) {
					let index = -1;
					for(let i=0; i<_this.accountInvaderPixelcons.length; i++) {
						if(_this.accountInvaderPixelcons[i].id == transactionData.pixelcon.id) {
							index = i;
							break;
						}
					}
					if(index > -1) {
						_this.accountInvaderPixelcons.splice(index, 1);
						filterPageData();
						updated = true;
					}
				}
				
				//remove now minted invaders from market
				if(_this.marketData) {
					let marketIndex = -1;
					let invaderIndex = -1;
					for(let i=0; i<_this.marketData.length; i++) {
						for(let j=0; j<_this.marketData[i].invaders.length; j++) {
							if(_this.marketData[i].invaders[j].id == transactionData.pixelcon.id) {
								marketIndex = i;
								invaderIndex = j;
								break;
							}
						}
						if(marketIndex > -1) break;
					}
					if(marketIndex > -1 && invaderIndex > -1) {
						if(_this.marketData[marketIndex].invaders[invaderIndex].length <= 1) _this.marketData.splice(marketIndex, 1);
						else _this.marketData[marketIndex].invaders.splice(invaderIndex, 1);
						filterMarketData();
						updated = true;
					}
				}
				
				if(updated) safeApply();
			}
		}
		
		// Safe apply to ensure fatest response possible
		function safeApply() {
			if($scope.$root && $scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') $scope.$apply();
		}
		
		// Listen for account data changes
		web3Service.onAccountDataChange(function () {
			loadPageData();
		}, $scope, true);

		// Listen for network data changes
		web3Service.onNetworkChange(function () {
			if(_this.error) loadPageData();
		}, $scope, true);

		// Listen for transactions
		web3Service.onWaitingTransactionsChange(function (transactionData) {
			updateFromTransaction(transactionData);
		}, $scope);
		
	}
}());
