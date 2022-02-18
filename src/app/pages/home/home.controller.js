(function () {
	angular.module('App')
		.controller('HomePageCtrl', HomePageCtrl);

	HomePageCtrl.$inject = ['$scope', '$mdMedia', '$routeParams', '$mdDialog', '$window', '$location', '$timeout', '$interval', 'decoder', 'market'];
	function HomePageCtrl($scope, $mdMedia, $routeParams, $mdDialog, $window, $location, $timeout, $interval, decoder, market) {
		var _this = this;
		_this.infoHint = infoHint;

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });
		
		// Show dialogs on page load
		if($routeParams.typeExplainer) infoHint('typeExplainer');
		else if($routeParams.levelExplainer) infoHint('levelExplainer');
		else if($routeParams.attributesExplainer) infoHint('attributesExplainer');
		else if($routeParams.mintExplainer) infoHint('mintExplainer');
		else if($routeParams.l2Explainer) infoHint('l2Explainer');
		
		// Example Invaders
		_this.exampleInvaders = [
			'6106601661011016000000000000000061066016611001161660066100666600',
			'000dd00000011000000110000001100000011000d717717ddd1111ddd700007d',
			'0068860011611611861111688601106800866800001111001888888111666611',
			'05600650055005500a5aa5a005655650665005666aa00aa66660066606a55a60',
			'11000011dd0000dddd0000dddd0110dd1c1cc1c1111dd111dd0000ddcd0000dc',
			'06b00b600bb00bb0566666655b6bb6b560066006000550000005500006666660',
			'da0aa0adaa0aa0aadd0dd0dd000000000001100000011000000dd000000dd000',
			'0580085055855855855555586000000606655660086886808006600860088006',
			'5006600555966955559559555595595509999990066556600665566005655650'
		];
		_this.exampleInvaderImgs = [];
		for(let i=0; i<_this.exampleInvaders.length; i++) {
			_this.exampleInvaderImgs.push(decoder.generateInvader(_this.exampleInvaders[i], 2));
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
	}
}());
