(function () {
	angular.module('App')
		.directive('accounticon', accounticon)
		.controller('AccountIconCtrl', AccountIconCtrl);

	AccountIconCtrl.$inject = ['$scope', '$timeout'];
	function AccountIconCtrl($scope, $timeout) {
		var _this = this;

		// Watch for address changes
		$scope.$watch('ctrl.address', function () {
			_this.addressIcon = null;
			if (_this.address) {
				_this.addressIcon = blockies.create({
					seed: _this.address.toLowerCase(),
					size: 8,
					scale: 6
				}).toDataURL();
			}
		});
	}

	function accounticon() {
		return {
			restrict: 'E',
			scope: {
				address: '=',
				border: '@'
			},
			bindToController: true,
			controller: 'AccountIconCtrl',
			controllerAs: 'ctrl',
			templateUrl: HTMLTemplates['shared.accounticon']
		};
	}
}());
