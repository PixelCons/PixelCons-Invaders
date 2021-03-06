(function () {
	angular.module('App')
		.directive('appFooter', appFooter)
		.controller('FooterCtrl', FooterCtrl);

	FooterCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', 'web3Service'];
	function FooterCtrl($scope, $mdMedia, $mdDialog, web3Service) {
		var _this = this;
		_this.tip = tip;
		_this.openSettings = openSettings;
		_this.accountAddress = null;

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Tip the developer
		function tip(ev) {
			$mdDialog.show({
				controller: 'SendDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: HTMLTemplates['dialog.send'],
				parent: angular.element(document.body),
				locals: { ethMode: true },
				bindToController: true,
				clickOutsideToClose: true
			});
		}
		
		// Opens the settings window
		function openSettings(ev) {
			$mdDialog.show({
				controller: 'SettingsDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: HTMLTemplates['dialog.settings'],
				parent: angular.element(document.body),
				bindToController: true,
				clickOutsideToClose: true
			});
		}

		// Account change
		updateUserAccount();
		function updateUserAccount() {
			_this.accountAddress = web3Service.getActiveAccount();
		}

		// Listen for account data changes
		web3Service.onAccountDataChange(function () {
			updateUserAccount();
		}, $scope);
	}

	function appFooter() {
		return {
			restrict: 'E',
			scope: {},
			bindToController: true,
			controller: 'FooterCtrl',
			controllerAs: 'ctrl',
			templateUrl: HTMLTemplates['shared.footer']
		};
	}
}());
