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

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Validate the send data
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

		// Send invader
		function mintInvader() {
			let transaction = coreContract.mintInvader(_this.invaderPixelcon.pixelcon.id, _this.invaderPixelcon.mintIndex);
			$mdDialog.hide({transaction: transaction});
		}

		// Closes the dialog window
		function closeDialog() {
			$mdDialog.cancel();
		}

		// Listen for network data changes
		web3Service.onNetworkChange(validate, $scope, true);

		// Close the dialog if page/account changes
		$scope.$on("$locationChangeSuccess", $mdDialog.cancel);
		web3Service.onAccountDataChange($mdDialog.cancel, $scope);
	}
}());
