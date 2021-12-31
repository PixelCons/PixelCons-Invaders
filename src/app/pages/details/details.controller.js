(function () {
	angular.module('App')
		.controller('DetailsPageCtrl', DetailsPageCtrl);

	DetailsPageCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$routeParams', '$timeout', '$sce', '$window', 'web3Service', 'coreContract', 'market', 'decoder'];
	function DetailsPageCtrl($scope, $mdMedia, $mdDialog, $routeParams, $timeout, $sce, $window, web3Service, coreContract, market, decoder) {
		var _this = this;
		_this.isOwner = true;
		_this.infoHint = infoHint;
		_this.copyLink = copyLink;
		_this.shareOnTwitter = shareOnTwitter;
		_this.shareOnFacebook = shareOnFacebook;
		_this.sendTo = sendTo;
		_this.createWallpaper = createWallpaper;
		_this.viewOnPixelcons = viewOnPixelcons;
		_this.goBack = goBack;
		_this.marketEnabled = market.isEnabled();
		_this.marketLink = market.getItemLink();
		
		
		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		
		
		
		
		
		
		loadDetails();
		async function loadDetails() {
			_this.detailsLoading = true;
			_this.error = null;
			try {
				let invader = await coreContract.fetchInvader($routeParams.index);
				_this.invader = addInvaderImageData(invader);
				
				_this.detailsLoading = false;
				safeApply();
				
			} catch(err) {
				_this.detailsLoading = false;
				_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + err);
				safeApply();
			}
		}
		
		
		
		

		
		
		// Generates image for the invader
		function addInvaderImageData(invader) {
			invader.image = decoder.generateInvader(invader.id);
			return invader;
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

		// Copies share link to the clipboard
		function copyLink() {
			let copyText = document.getElementById("copyToClipboard");
			copyText.value = document.URL;
			copyText.select();
			document.execCommand("copy");
		}

		// Share this page on twitter
		function shareOnTwitter() {
			let url = "https://twitter.com/intent/tweet?url=";
			url += encodeURI(document.URL);
			url += '&text=' + encodeURI("Check out this PixelCon Invader!");
			return url;
		}

		// Share this page on facebook
		function shareOnFacebook() {
			let url = "https://www.facebook.com/sharer/sharer.php?u="
			url += encodeURI(document.URL);
			return url;
		}
		
		// Transfer ownership of this invader
		function sendTo() {
			//TODO
		}
		
		// Open wallpaper generator
		function createWallpaper() {
			//TODO
		}
		
		// Link to view this invader on pixelcons
		function viewOnPixelcons() {
			let url = "https://pixelcons.io/details/" + _this.invader.id;
			return url;
		}
		
		// Navigates back to the previous page
		function goBack() {
			$window.history.back();
		}
		
		// Safe apply to ensure fatest response possible
		function safeApply() {
			if($scope.$root && $scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') $scope.$apply();
		}
		
		// Listen for account data changes
		web3Service.onAccountDataChange(function () {
			//loadPageData();
		}, $scope, true);
		
		// Listen for network data changes
		web3Service.onNetworkChange(function () {
			//if(_this.error) loadDetails();
		}, $scope, true);

		// Listen for transactions
		web3Service.onWaitingTransactionsChange(function (transactionData) {
			//if (transaction.type == _mintTypeDescription[0]) loadInvaders();
			//dirtyDatabaseData = transactionData && transactionData.success;
		}, $scope);
	}
}());
