(function () {
	angular.module('App')
		.controller('SearchPageCtrl', SearchPageCtrl);

	SearchPageCtrl.$inject = ['$scope', '$mdMedia', '$routeParams', '$route', '$location', '$window', '$sce', '$timeout', 'web3Service', 'coreContract'];
	function SearchPageCtrl($scope, $mdMedia, $routeParams, $route, $location, $window, $sce, $timeout, web3Service, coreContract) {
		var _this = this;
		var ownerCheckTimeout;
		_this.formatAddressString = formatAddressString;
		_this.copyLink = copyLink;
		_this.shareOnTwitter = shareOnTwitter;
		_this.shareOnFacebook = shareOnFacebook;
		_this.onLevelChange = onLevelChange;
		_this.onOwnerChange = onOwnerChange;
		_this.filterOpen = false;
		_this.sortBy = 'createdDesc';
		_this.levelMin = 0;
		_this.levelMax = 20;
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
		
		_this.owner = '0x1a5805e6bE1f495b8346cEfA32F2a567c063598C';
		onOwnerChange(true);
		function updatePathParams() {
			
				//update url parameters
				if (($routeParams.search === undefined && _this.filter.searchText) || ($routeParams.search !== undefined && _this.filter.searchText != $routeParams.search)) {
					$location.search('search', _this.filter.searchText ? _this.filter.searchText : undefined).replace();
				}
				if (($routeParams.desc === undefined && _this.filter.sortDesc) || ($routeParams.desc !== undefined && _this.filter.sortDesc == ($routeParams.desc != 'true'))) {
					$location.search('desc', (_this.filter.sortDesc) ? 'true' : undefined).replace();
				}
		}
		
		
		// Returns the formatted address string for filter header
		function formatAddressString(length) {
			if(_this.ownerAddressNameLoading) return web3Service.compressString(_this.ownerAddress, 12);
			let address = _this.ownerAddressName || _this.ownerAddress;
			return web3Service.compressString(address, 16);
		}

		// Copies share link to the clipboard
		function copyLink() {
			let copyText = document.getElementById("copyToClipboard");
			copyText.value = document.location.origin + '/owner/' + _this.accountAddress;
			copyText.select();
			document.execCommand("copy");
		}

		// Share this page on twitter
		function shareOnTwitter() {
			let url = "https://twitter.com/intent/tweet?url=";
			url += encodeURI(document.location.origin + '/owner/' + _this.accountAddress);
			url += '&text=' + encodeURI("Check out these PixelCons!");
			return url;
		}

		// Share this page on facebook
		function shareOnFacebook() {
			let url = "https://www.facebook.com/sharer/sharer.php?u="
			url += encodeURI(document.location.origin + '/owner/' + _this.accountAddress);
			return url;
		}
		
		function onOwnerChange(noWait) {
			let processOwner = function() {
				if(!_this.owner) {
					_this.ownerAddress = null;
					_this.ownerAddressName = null;
					_this.checkingOwner = false;
					
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
					if(_this.levelMax < _this.levelMin) _this.levelMax = _this.levelMin;
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
					if(_this.levelMax < _this.levelMin) _this.levelMin = _this.levelMax;
				}
				_this.lastLevelMax = _this.levelMax;
			}
		}
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		const maxInPage = 50;
		const minGrade = 8;
		_this.pixelcons = [];
		_this.filter = {
			searchText: $routeParams.search ? $routeParams.search : '',
			sortBy: 'dateCreated',
			sortDesc: $routeParams.desc == 'true'
		}
		_this.displayHeight = '';
		_this.currPage = 0;
		_this.setSortOrder = setSortOrder;
		_this.checkUpdateData = checkUpdateData;
		_this.updatePage = updatePage;
		_this.disableFilters = false;

		var loadedFilter = {};

		// Database data
		var dirtyDatabaseData = false;
		var pixelconCount;
		var pixelconNames;
		var pixelconFilterGrades;
		var pixelconFilterGradeMax;
		var pixelconFilterCount;

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Fetch database to search through
		fetchDatabaseData();
		function fetchDatabaseData() {
			dirtyDatabaseData = false;
			_this.grabbingData = true;
			_this.loading = true;
			_this.currPage = 0;
			_this.pixelcons = [];

			coreContract.getTotalPixelcons().then(function (total) {
				pixelconCount = total;

				_this.grabbingData = false;
				let page = $routeParams.page ? parseInt($routeParams.page) : null;
				checkUpdateData(true, page);
			}, function (reason) {
				_this.grabbingData = false;
				_this.loading = false;
				_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
			});
		}

		// Check if data parameters have changed
		function checkUpdateData(forceUpdate, gotoPage) {
			web3Service.awaitState(function () {
				if (_this.error) return;
				if (dirtyDatabaseData) {
					fetchDatabaseData();
					return;
				}

				//update url parameters
				if (($routeParams.search === undefined && _this.filter.searchText) || ($routeParams.search !== undefined && _this.filter.searchText != $routeParams.search)) {
					$location.search('search', _this.filter.searchText ? _this.filter.searchText : undefined).replace();
				}
				if (($routeParams.desc === undefined && _this.filter.sortDesc) || ($routeParams.desc !== undefined && _this.filter.sortDesc == ($routeParams.desc != 'true'))) {
					$location.search('desc', (_this.filter.sortDesc) ? 'true' : undefined).replace();
				}

				//name grading related filter changes?
				if (forceUpdate || _this.filter.searchText != loadedFilter.searchText) {
					loadedFilter = JSON.parse(JSON.stringify(_this.filter));

					// get list of names or just grade?
					if (loadedFilter.searchText) fetchNames(gotoPage);
					else gradeNames(gotoPage);
					return;
				}

				//other filter parameters changed?
				let needToUpdate = false;
				for (let i in _this.filter) {
					if (_this.filter[i] != loadedFilter[i]) {
						needToUpdate = true;
						break;
					}
				}
				if (needToUpdate) {
					loadedFilter = JSON.parse(JSON.stringify(_this.filter));
					updatePage(1);
				}
			}, true);
		}

		// Grades the database names based on filter data
		function fetchNames(gotoPage) {
			if (!pixelconNames) {
				_this.grabbingData = true;
				_this.loading = true;
				_this.currPage = 0;
				_this.pixelcons = [];

				coreContract.getAllNames().then(function (names) {
					_this.grabbingData = false;
					pixelconNames = names;
					pixelconCount = pixelconNames.length;
					gradeNames(gotoPage);
				});
			} else {
				gradeNames(gotoPage);
			}
		}

		// Grades the database names based on filter data
		function gradeNames(gotoPage) {
			_this.loading = true;
			_this.currPage = 0;

			pixelconFilterCount = 0;
			pixelconFilterGradeMax = 0;
			pixelconFilterGrades = new Uint8Array(pixelconCount);

			//all
			for (let i = 0; i < pixelconCount; i++) {
				let grade = 200;
				if (grade > minGrade) pixelconFilterCount++;
				if (grade > pixelconFilterGradeMax) pixelconFilterGradeMax = grade;
				pixelconFilterGrades[i] = grade;
			}

			_this.totalFound = pixelconFilterCount;
			updatePage(gotoPage ? gotoPage : 1);
		}

		// Updates data to be displayed based on paging details
		function updatePage(page) {
			let scrollTarget = $window.document.getElementById('scrollTarget');
			let resultsCard = $window.document.getElementById('searchPagePixelconWindow');
			if (scrollTarget && resultsCard && resultsCard.offsetHeight < scrollTarget.offsetHeight) {
				_this.displayHeight = resultsCard.offsetHeight + 'px';
			} else {
				_this.displayHeight = '';
			}
			$location.search('page', (page > 1) ? page : undefined).replace();

			_this.loading = true;
			_this.currPage = 0;
			_this.pixelcons = [];

			//loop from high score to low score, until page slots are filled
			let indexes = [];
			let startIndex = (page - 1) * maxInPage;
			if (loadedFilter.sortDesc) {
				//all desc
				for (let grade = pixelconFilterGradeMax; grade > minGrade && indexes.length < maxInPage; grade--) {
					for (let i = pixelconFilterGrades.length - 1; i >= 0 && indexes.length < maxInPage; i--) {
						if (pixelconFilterGrades[i] == grade) {
							if (startIndex > 0) startIndex--;
							else indexes.push(i);
						}
					}
				}
			} else {
				//all asc
				for (let grade = pixelconFilterGradeMax; grade > minGrade && indexes.length < maxInPage; grade--) {
					for (let i = 0; i < pixelconFilterGrades.length && indexes.length < maxInPage; i++) {
						if (pixelconFilterGrades[i] == grade) {
							if (startIndex > 0) startIndex--;
							else indexes.push(i);
						}
					}
				}
			}

			//get the details for the pixelcon indexes
			_this.error = null;
			_this.currPage = page;
			_this.maxPage = Math.ceil(pixelconFilterCount / maxInPage);
			coreContract.fetchPixelconsByIndexes(indexes, {asynchronousLoad: true}).then(function (data) {
				_this.loading = false;
				_this.pixelcons = data;
				_this.displayHeight = '';
			}, function (reason) {
				_this.loading = false;
				_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
				_this.currPage = 0;
				_this.displayHeight = '';
			});
		}

		// Set the sort order
		function setSortOrder(desc) {
			_this.filter.sortDesc = desc;
			checkUpdateData();
		}

		// Listen for account data changes
		web3Service.onAccountDataChange(function () {
			checkUpdateData();
		}, $scope, true);

		// Listen for network data changes
		web3Service.onNetworkChange(function () {
			if(_this.error) $route.reload();
		}, $scope, true);

		// Listen for transactions
		web3Service.onWaitingTransactionsChange(function (transactionData) {
			dirtyDatabaseData = transactionData && transactionData.success;
		}, $scope);
	}
}());
