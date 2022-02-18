(function () {
	angular.module('App')
		.service('market', market);

	market.$inject = ['web3Service'];
	function market(web3Service) {
		const _enabled = true;
		const _marketName = 'Quixotic';
		const _storeLink = 'https://quixotic.io/collection/0xB5604Fc106074A140DF727Fe28cd68F0dbB6C1B9';
		const _itemLink = 'https://quixotic.io/asset/opt/0xB5604Fc106074A140DF727Fe28cd68F0dbB6C1B9/<id>';

		// Setup functions
		this.isEnabled = isEnabled;
		this.getMarketName = getMarketName;
		this.getMarketLink = getMarketLink;
		this.getItemLink = getItemLink;


		///////////
		// Utils //
		///////////


		// Gets if the market is enabled
		function isEnabled() {
			return _enabled;
		}

		// Gets the name of the market
		function getMarketName() {
			return _marketName;
		}

		// Gets link to the market
		function getMarketLink() {
			return _storeLink;
		}

		// Gets link to item for the market
		function getItemLink(id) {
			if (!id) return _storeLink;

			let l = _itemLink.split('<id>').join(web3Service.hexToInt(id));
			return l;
		}
		
		// Formats an address to 40 character standard
		function formatAddress(address) {
			const hexCharacters = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
			if(address) {
				address = address.toLowerCase();
				if(address.indexOf('0x') == 0) address = address.substr(2,address.length);
				if(address.length < 40) return null;
				if(address.length > 40) address = address.substring(address.length-40, address.length);
				for(let i=0; i<40; i++) if(hexCharacters.indexOf(address[i]) == -1) return null;
				return address;
			}
			return null;
		}

	}
}());
