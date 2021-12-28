(function () {
	var app = angular.module('App', ['ngMaterial', 'ngRoute']);
	var ignoreReload = false;

	// Configuration
	app.config(['$mdThemingProvider', function ($mdThemingProvider) {
		$mdThemingProvider.theme('default')
			.primaryPalette('blue')
			.accentPalette('blue');
	}]);
	app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
		$routeProvider.when("/", {
			templateUrl: HTMLTemplates['page.home'],
			controller: 'HomePageCtrl',
			controllerAs: 'ctrl'
		})
			.when("/details/:index", {
				templateUrl: HTMLTemplates['page.details'],
				controller: 'DetailsPageCtrl',
				controllerAs: 'ctrl'
			})
			.when("/explore", {
				templateUrl: HTMLTemplates['page.explore'],
				controller: 'ExplorePageCtrl',
				controllerAs: 'ctrl',
				reloadOnSearch: false
			})
			.when("/mint", {
				templateUrl: HTMLTemplates['page.mint'],
				controller: 'MintPageCtrl',
				controllerAs: 'ctrl'
			})
			.when("/start", {
				templateUrl: HTMLTemplates['page.start'],
				controller: 'StartPageCtrl',
				controllerAs: 'ctrl'
			})
			.when("/terms", {
				templateUrl: HTMLTemplates['page.terms'],
				controller: 'TermsPageCtrl',
				controllerAs: 'ctrl'
			})
			.otherwise({
				redirectTo: '/'
			});

		// use the HTML5 History API
		$locationProvider.html5Mode(true);
	}]);
	app.run(['$route', '$rootScope', '$location', '$timeout', '$templateCache', '$http', '$window', 'web3Service', 'coreContract', 'decoder',
		function ($route, $rootScope, $location, $timeout, $templateCache, $http, $window, web3Service, coreContract, decoder) {
			var lastPage = $location.path();
			var replacementRoute = null;

			// always scroll to top on page load
			$rootScope.$on("$locationChangeSuccess", function (data) {
				let currPage = $location.path();
				if (replacementRoute !== null) {
					$route.current = replacementRoute;
					replacementRoute = null;
				} else if (lastPage != currPage) {
					let viewElement = $window.document.getElementById('view')
					if(viewElement) {
						viewElement.style.display = 'none';
						$timeout(function () {
							$window.document.getElementById('scrollTarget').scrollTop = 0;
						});
					}
				}
				lastPage = currPage;
			});
			
			
			// add reload parameter to the location path function
			var _locationPath = $location.path;
			$location.path = function (path, reload) {
				if (reload === false) {
					replacementRoute = $route.current;
					ignoreReload = true;
				}
				return _locationPath.apply($location, [path]);
			};

			// pre-load dialogs
			$http.get(HTMLTemplates['dialog.send'], { cache: $templateCache });
			$http.get(HTMLTemplates['dialog.prints'], { cache: $templateCache });
			$http.get(HTMLTemplates['dialog.settings'], { cache: $templateCache });
		}]);


	// Main controller
	app.controller('AppCtrl', AppCtrl);
	AppCtrl.$inject = ['$scope', '$mdMedia'];
	function AppCtrl($scope, $mdMedia) {
		var _this = this;
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });
		
		$scope.$on('$routeChangeStart', function($event, next, current) {
			ignoreReload = false;
		});
	}
	
	
	///////////
	// Utils //
	///////////
	
	//Updates the background image
	var backgroundUpdateTimeout = null;
	function updateBackground(backgroundImage, delay) {
		if(backgroundUpdateTimeout) clearTimeout(backgroundUpdateTimeout);
		backgroundUpdateTimeout = null;
		if(delay) {
			backgroundUpdateTimeout = setTimeout(function() {
				backgroundUpdateTimeout = null;
				updateBackgroundImage(backgroundImage);
			}, delay);
		} else {
			updateBackgroundImage(backgroundImage);
		}
	}
		
	//Updates the background image
	function updateBackgroundImage(backgroundImage) {
		if(backgroundImage) {
			//find the style rule
			let styleRule = null;
			for(let i = 0; i < document.styleSheets.length; i++) {
				if(document.styleSheets[i].href && (document.styleSheets[i].href.indexOf('/style.css') > -1 || document.styleSheets[i].href.indexOf('/style.min.css') > -1)) {
					for(let j = 0; j < document.styleSheets[i].cssRules.length; j++) {
						if(document.styleSheets[i].cssRules[j].selectorText.indexOf('div.pageContentBackground.groupOverride') > -1) {
							styleRule = document.styleSheets[i].cssRules[j];
							break;
						}
					}
					if(styleRule) break;
				}
			}
			if(styleRule) {
				//update and add background class list
				styleRule.style['background-image'] = 'url(' + backgroundImage + ')';
				let background = document.getElementById('contentBackground');
				if(background) background.classList.add('groupOverride');
				
			} else {
				//remove background class list
				let background = document.getElementById('contentBackground');
				if(background) background.classList.remove('groupOverride');
			}
		} else {
			//remove background class list
			let background = document.getElementById('contentBackground');
			if(background) background.classList.remove('groupOverride');
		}
	}
}());
