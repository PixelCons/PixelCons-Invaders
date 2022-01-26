(function () {
	angular.module('App')
		.controller('InfoDialogCtrl', InfoDialogCtrl);

	InfoDialogCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$sce', 'web3Service', 'coreContract'];
	function InfoDialogCtrl($scope, $mdMedia, $mdDialog, $sce, web3Service, coreContract) {
		var _this = this;
		_this.closeDialog = closeDialog;

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Loads the dialog
		loadDialog();
		function loadDialog() {
			if(_this.topic == 'typeExplainer') {
				_this.title = 'Invader Types';
			} else if(_this.topic == 'levelExplainer') {
				_this.title = 'Invader Levels';
			} else if(_this.topic == 'attributesExplainer') {
				_this.title = 'Invader Attributes';
			} else if(_this.topic == 'mintExplainer') {
				_this.title = 'How to Uncover Invaders';
			} else if(_this.topic == 'l2Explainer') {
				_this.title = 'Optimistic Ethereum (Layer 2)';
			}
		}
		
		// Closes the dialog window
		function closeDialog() {
			$mdDialog.cancel();
		}

		// Close the dialog if page changes
		$scope.$on("$locationChangeSuccess", $mdDialog.cancel);
	}
}());
