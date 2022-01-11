(function () {
	angular.module('App')
		.service('storage', storage);

	storage.$inject = ['$q', '$timeout'];
	function storage($q, $timeout) {
		const _localStorage = window.localStorage;
		const _sessionStorage = window.sessionStorage;
		const _LEVEL_LOCAL = 'LEVEL_LOCAL';
		const _LEVEL_SESSION = 'LEVEL_SESSION';
		const _LEVEL_PAGE = 'LEVEL_PAGE';
		const _optionDefaults = {
			level: _LEVEL_LOCAL,
			encryptionKey: null
		}
		var _pageStorage = {};
		
		//Public functions/data
		this.setItem = setItem;
		this.getItem = getItem;
		this.removeItem = removeItem;
		this.clear = clear;
		this.LEVEL_LOCAL = _LEVEL_LOCAL;
		this.LEVEL_SESSION = _LEVEL_SESSION;
		this.LEVEL_PAGE = _LEVEL_PAGE;
		
		
		////////////////////
		// Implementation //
		////////////////////
		
		
		// Sets a value in storage
		function setItem(keyName, keyValue, options) {
			if(!options) options = _optionDefaults;
			for(let n in _optionDefaults) if(options[n] === undefined) options[n] = _optionDefaults[n];
			
			keyValue = JSON.stringify(keyValue);
			if(options.encryptionKey) keyValue = CryptoJS.AES.encrypt(keyValue, options.encryptionKey).toString();
			
			if(options.level == _LEVEL_LOCAL) _localStorage.setItem(keyName, keyValue);
			else if(options.level == _LEVEL_SESSION) _sessionStorage.setItem(keyName, keyValue);
			else if(options.level == _LEVEL_PAGE) _pageStorage[keyName] = keyValue;
		}
		
		// Gets a value in storage
		function getItem(keyName, options) {
			if(!options) options = _optionDefaults;
			for(let n in _optionDefaults) if(options[n] === undefined) options[n] = _optionDefaults[n];
			
			let keyValue = null;
			if(options.level == _LEVEL_LOCAL) keyValue = _localStorage.getItem(keyName);
			else if(options.level == _LEVEL_SESSION) keyValue = _sessionStorage.setItem(keyName);
			else if(options.level == _LEVEL_PAGE) keyValue = _pageStorage[keyName];
			if(keyValue === null || keyValue === undefined) return null;
			
			try {
				keyValue = JSON.parse(keyValue);
			} catch(err) {
				return null;
			}
			if(options.encryptionKey) keyValue = CryptoJS.AES.decrypt(keyValue, options.encryptionKey).toString(CryptoJS.enc.Utf8);
			return keyValue;
		}
		
		// Removes a value in storage
		function removeItem(keyName, options) {
			if(!options) options = _optionDefaults;
			for(let n in _optionDefaults) if(options[n] === undefined) options[n] = _optionDefaults[n];
			
			if(options.level == _LEVEL_LOCAL) _localStorage.removeItem(keyName);
			else if(options.level == _LEVEL_SESSION) _sessionStorage.removeItem(keyName);
			else if(options.level == _LEVEL_PAGE) delete _pageStorage[keyName];
		}
		
		// Clears storage
		function clear(options) {
			if(!options) options = _optionDefaults;
			for(let n in _optionDefaults) if(options[n] === undefined) options[n] = _optionDefaults[n];
			
			if(options.level == _LEVEL_LOCAL) _localStorage.clear();
			else if(options.level == _LEVEL_SESSION) _sessionStorage.clear();
			else if(options.level == _LEVEL_PAGE) _pageStorage = {};
		}

	}
}());
