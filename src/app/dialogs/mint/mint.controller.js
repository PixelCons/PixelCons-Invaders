(function () {
	angular.module('App')
		.controller('MintDialogCtrl', MintDialogCtrl);

	MintDialogCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$timeout', '$sce', 'web3Service', 'coreContract', 'decoder'];
	function MintDialogCtrl($scope, $mdMedia, $mdDialog, $timeout, $sce, web3Service, coreContract, decoder) {
		var _this = this;
		var validCheckTimeout;
		var validAddress;
		_this.closeDialog = closeDialog;
		_this.mintInvader = mintInvader;
		_this.mintAcknowledge = mintAcknowledge;
		_this.mintAcknowledge = mintAcknowledge;
		_this.infoHint = infoHint;

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Validate the mint data
		validate();
		function validate() {
			_this.currView = 'loading';
			_this.title = 'Uncover Invader';
			coreContract.verifyMintInvader(_this.invaderPixelcon.pixelcon.id, _this.invaderPixelcon.mintIndex).then(function (data) {
				_this.currView = 'mintInvader';
				_this.invaderImg = decoder.generateInvader(_this.invaderPixelcon.id, 2);
				
			}, function (reason) {
				_this.currView = 'error';
				_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
			});
		}

		// Mint invader
		function mintInvader() {
			_this.currView = 'mintAcknowledge';
		}

		// Mint acknowledge
		function mintAcknowledge() {
			let transaction = coreContract.mintInvader(_this.invaderPixelcon.pixelcon.id, _this.invaderPixelcon.mintIndex);
			$mdDialog.hide({transaction: transaction});
		}

		// Closes the dialog window
		function closeDialog() {
			$mdDialog.cancel();
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

		// Listen for network data changes
		web3Service.onNetworkChange(validate, $scope, true);

		// Close the dialog if page/account changes
		$scope.$on("$locationChangeSuccess", $mdDialog.cancel);
		web3Service.onAccountDataChange($mdDialog.cancel, $scope);
	}
}());
