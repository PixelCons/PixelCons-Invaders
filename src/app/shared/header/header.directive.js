(function () {
	angular.module('App')
		.directive('appHeader', appHeader)
		.controller('HeaderCtrl', HeaderCtrl);

	HeaderCtrl.$inject = ['$scope', '$mdMedia', '$mdToast', '$mdMenu', '$timeout', '$location', '$window', '$route', 'storage', 'web3Service', 'market'];
	function HeaderCtrl($scope, $mdMedia, $mdToast, $mdMenu, $timeout, $location, $window, $route, storage, web3Service, market) {
		var _this = this;
		_this.noWeb3 = false;
		_this.loggedIn = false;
		_this.web3error = false;
		_this.waitingTransactions = [];
		_this.setAccount = setAccount;
		_this.getNetworkStyle = getNetworkStyle;
		_this.goPath = goPath;
		_this.goDetails = goDetails;
		_this.closeMenu = $mdMenu.hide;
		_this.showActivityMenu = showActivityMenu;
		_this.cancelActivityMenu = cancelActivityMenu;
		_this.hideActivityMenu = hideActivityMenu;
		_this.connect = connect;
		_this.marketName = market.getMarketName();
		_this.marketEnabled = market.isEnabled();
		_this.marketLink = market.getMarketLink();
		var showMenuPromise = null;

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-sm'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-sm'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Watch for path changes
		$scope.$watch(function () { return $location.path(); }, function (value) {
			if (value.indexOf('/explore') == 0) _this.page = 'explore';
			else if (value.indexOf('/mint') == 0) _this.page = 'mint';
			else if (value.indexOf('/details') == 0) _this.page = 'details';
			else _this.page = 'other';
		});

		// Configure state data
		updateState();
		function updateState() {
			let web3state = web3Service.getState();
			_this.noWeb3 = (web3state == "not_enabled" || web3Service.isReadOnly());
			_this.loggedIn = (web3state == "ready" && !web3Service.isReadOnly());
			_this.web3error = (web3state != "not_enabled" && web3state != "ready" && !web3Service.isReadOnly());
			_this.web3ProviderName = web3Service.getProviderName();
			_this.privacyMode = web3Service.isPrivacyMode();
		};

		// Configure user account icon
		updateUserAccount();
		function updateUserAccount() {
			let address = web3Service.getActiveAccount();
			if (address) {
				_this.accountAddress = address;
				_this.userAccountId = web3Service.compressString(address, 16);
			} else {
				_this.accountAddress = null;
				_this.userAccountId = '';
			}
		};

		// Configure transaction indicator
		updateTransactionIndicator();
		function updateTransactionIndicator(transactionData) {
			let waitingTransactions = web3Service.getWaitingTransactions();
			let activeAccount = web3Service.getActiveAccount();
			if (activeAccount) {
				_this.waitingTransactions = waitingTransactions;
				if (transactionData) {
					if (transactionData.success) {
						$mdToast.show(
							$mdToast.simple()
								.action('Confirmed')
								.highlightAction(true)
								.highlightClass('md-primary headerTransactionEndButton ' + transactionData.txHash)
								.textContent(transactionData.type)
								.position('top right')
								.hideDelay(3000)
						).then(function(response) {
							if (response === 'ok') {
								let url = web3Service.getTransactionLookupUrl(transactionData.txHash, transactionData.chainId);
								if(url) $window.open(url);
							}
						});
					} else {
						$mdToast.show(
							$mdToast.simple()
								.action('Failed')
								.highlightAction(true)
								.highlightClass('md-warn headerTransactionEndButton ' + transactionData.chainId + ' ' + transactionData.txHash)
								.textContent(transactionData.type)
								.position('top right')
								.hideDelay(5000)
						).then(function(response) {
							if (response === 'ok') {
								let url = web3Service.getTransactionLookupUrl(transactionData.txHash, transactionData.chainId);
								if(url) $window.open(url);
							}
						});
					}
				}
			}
		};
		
		// Gets the network badge style
		function getNetworkStyle(chainId) {
			let networkIcon = web3Service.getNetworkIcon(chainId);
			if(networkIcon) {
				return {
					backgroundImage: 'url(' + networkIcon + ')',
					display: 'inline-block'
				}
			}
			return {};
		}

		// Set to given user account
		function setAccount(account) {
			web3Service.setActiveAccount(account);
		}

		// Go to the specified path
		function goPath(path) {
			storage.removeItem('explore_page_filters', { level: storage.LEVEL_PAGE });
			if (path.indexOf($location.path()) == 0) {
				$timeout(function() {
					$route.reload();
				}, 0);
			}
		}

		// Go to lookup details page
		function goDetails(txHash, chainId) {
			return web3Service.getTransactionLookupUrl(txHash, chainId);
		}

		// Show menu
		function showActivityMenu(showFunc) {
			showMenuPromise = $timeout(showFunc, 200);
		}

		// Cancel menu
		function cancelActivityMenu() {
			$timeout.cancel(showMenuPromise);
		}

		// Hide menu
		function hideActivityMenu() {
			$mdMenu.hide();
			$timeout.cancel(showMenuPromise);
		}

		// Connect account
		function connect() {
			web3Service.requestAccess();
		}

		// Listen for account data changes and waiting transactions
		web3Service.onStateChange(function () {
			updateState();
		}, $scope);
		web3Service.onAccountDataChange(function () {
			updateUserAccount();
		}, $scope);
		web3Service.onWaitingTransactionsChange(function (transactionData) {
			updateTransactionIndicator(transactionData);
		}, $scope);
	}

	function appHeader() {
		return {
			restrict: 'E',
			scope: {},
			bindToController: true,
			controller: 'HeaderCtrl',
			controllerAs: 'ctrl',
			templateUrl: HTMLTemplates['shared.header']
		};
	}
}());
