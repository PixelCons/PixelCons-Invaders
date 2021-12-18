(function () {
	angular.module('App')
		.service('decoder', decoder);

	decoder.$inject = ['$q', '$timeout'];
	function decoder($q, $timeout) {
		const maxImageSize = 256;
		const invaderScale = 3;
		const invaderSize = invaderScale*10;
		const invadersPerWidth = Math.floor(maxImageSize / invaderSize);
		const invadersPerPanel = invadersPerWidth * invadersPerWidth;
		
		//Setup functions
		this.generateInvadersPanel = generateInvadersPanel;
		this.generateDisplayImage = generateDisplayImage;
		this.getPanelStyleRules = getPanelStyleRules;
		
		//Data
		var loadImage_cache = {};
		this.invadersPerWidth = invadersPerWidth;
		this.invadersPerPanel = invadersPerPanel;
		
		//Configuration
		const qrCodeImageLink = document.location.origin + '/_';
		const colorPalette = {
			'0': [0,0,0],		//#000000
			'1': [29,43,83],	//#1D2B53
			'2': [126,37,83],	//#7E2553
			'3': [0,135,81],	//#008751
			'4': [171,82,54],	//#AB5236
			'5': [95,87,79],	//#5F574F
			'6': [194,195,195],	//#C2C3C7
			'7': [255,241,232],	//#FFF1E8
			'8': [255,0,77],	//#FF004D
			'9': [255,163,0],	//#FFA300
			'a': [255,255,39],	//#FFFF27
			'b': [0,231,86],	//#00E756
			'c': [41,173,255],	//#29ADFF
			'd': [131,118,156],	//#83769C
			'e': [255,119,168],	//#FF77A8
			'f': [255,204,170],	//#FFCCAA
		}
		
		//Generates a panel of invaders
		function generateInvadersPanel(invaders, offset) {
			let canvas = document.createElement('canvas');
			canvas.width = invadersPerWidth * invaderSize;
			canvas.height = invadersPerWidth * invaderSize;
			let ctx = canvas.getContext("2d");
			
			for(let i=0; i<invadersPerPanel; i++) {
				const invaderIndex = offset + i;
				if(invaderIndex < invaders.length) {
					const id = formatId(invaders[invaderIndex].id);
					const invaderPanelIndex = invaderIndex % invadersPerPanel;
					const offsetX = (invaderPanelIndex % invadersPerWidth) * invaderSize
					const offsetY = Math.floor(invaderPanelIndex/invadersPerWidth) * invaderSize;
					
					ctx.fillStyle = '#000000';
					for (let y = 0; y < 8; y++) {
						for (let x = 0; x < 8; x++) {
							let index = y * 8 + x;
							if(id[index] != '0') {
								ctx.fillRect(offsetX + (((x+1) * invaderScale)-1), offsetY + (((y+1) * invaderScale)-1), invaderScale+2, invaderScale+2);
							}
						}
					}
					for (let y = 0; y < 8; y++) {
						for (let x = 0; x < 8; x++) {
							let index = y * 8 + x;
							if(id[index] != '0') {
								ctx.fillStyle = getPaletteColorInHex(id[index]);
								ctx.fillRect(offsetX + ((x+1) * invaderScale), offsetY + ((y+1) * invaderScale), invaderScale, invaderScale);
							}
						}
					}
				}
			}
			let data = canvas.toDataURL('image/png');
			canvas.remove();
			return data;
		}
		
		//Generates a display image with the given parameters
		async function generateDisplayImage(pixelcon, orientation, ratio, color, margin, includeQr, includeDetails, detailsSize, texture, intensity, fullRender, imageType) {
			if(!margin) margin = 0;
			let isHorizontal = (orientation != 'vertical');
			
			//determine sizes
			const shortestSideMin = fullRender ? 3000 : 1000;
			const marginW = Math.round((isHorizontal ? margin : margin/ratio) * (fullRender ? 1.0 : 0.333));
			const marginH = Math.round((isHorizontal ? margin/ratio : margin) * (fullRender ? 1.0 : 0.333));
			const width = (isHorizontal ? Math.round(shortestSideMin*ratio) : shortestSideMin) + marginW*2;
			const height = (isHorizontal ? shortestSideMin : Math.round(shortestSideMin*ratio)) + marginH*2;
			const pixelconScale = Math.round(shortestSideMin*0.085);
			
			//build canvas for drawing
			let canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			let ctx = canvas.getContext("2d");
			ctx.fillStyle = color;
			ctx.fillRect(0, 0, width, height);
			
			//draw pixelcon
			let id = formatId(pixelcon.id);
			if (id) {
				const offsetX = Math.round((width - pixelconScale * 8) / 2);
				const offsetY = Math.round((height - pixelconScale * 8) / 2);
				for (let y = 0; y < 8; y++) {
					for (let x = 0; x < 8; x++) {
						let index = y * 8 + x;
						ctx.fillStyle = getPaletteColorInHex(id[index]);
						ctx.fillRect(offsetX + (x * pixelconScale), offsetY + (y * pixelconScale), pixelconScale, pixelconScale);
					}
				}
			}
			
			//details size
			const sizeMult = detailsSize != 'large' ? (detailsSize == 'small' ? 0.6 : 1) : 1.8;
			const qrOffset = Math.round(shortestSideMin*0.015);
			const qrScale = Math.round(shortestSideMin*0.003*sizeMult);
			const fontSize = Math.round(shortestSideMin*0.018*sizeMult);
			if(color == '#C2C3C7' || color == '#FFF1E8' || color == '#FFFF27') ctx.fillStyle = '#444444';
			else ctx.fillStyle = '#FFFFFF';
			
			//draw qr code
			let qrGridSize = 0;
			if(includeQr) {
				let linkStr = qrCodeImageLink.length > 22 ? qrCodeImageLink : (qrCodeImageLink + ModifiedBase64.fromInt(pixelcon.index).padStart(4, '0'));
				let qr = QRCode.makeCode(linkStr);
				if(qr) {
					qrGridSize = qr.length;
					const offsetX = qrOffset + marginW;
					const offsetY = height - ((qrScale * qrGridSize) + qrOffset + marginH);
					for (let y = 0; y < qrGridSize; y++) {
						for (let x = 0; x < qrGridSize; x++) {
							if(qr[x][y]) {
								ctx.fillRect(offsetX + (x * qrScale), offsetY + (y * qrScale), qrScale, qrScale);
							}
						}
					}
				}
			}
			
			//draw details
			if(includeDetails) {
				const offsetX = qrOffset + marginW + (qrGridSize > 0 ? qrScale * (qrGridSize + 3) : 0);
				const offsetY = height - (qrOffset + marginH);
				
				ctx.font = 'bold ' + fontSize + 'px Roboto, "Helvetica Neue", sans-serif';
				ctx.fillText('#' + pixelcon.index, offsetX, offsetY - Math.round(fontSize*1.2));
				ctx.fillText(getDateStr(pixelcon.date), offsetX, offsetY);
			}
			
			//render texture
			if(texture != 'none') {
				try {
					let img = null;
					if(texture == 'film') img = await loadImage('/img/large/texture' + (fullRender ? '' : '_preview') + '_film.png', !fullRender);
					else if(texture == 'wood') img = await loadImage('/img/large/texture' + (fullRender ? '' : '_preview') + '_wood.png', !fullRender);
					else if(texture == 'fabric') img = await loadImage('/img/large/texture' + (fullRender ? '' : '_preview') + '_fabric.png', !fullRender);
					else if(texture == 'stone') img = await loadImage('/img/large/texture' + (fullRender ? '' : '_preview') + '_stone.png', !fullRender);
					else img = await loadImage('/img/large/texture' + (fullRender ? '' : '_preview') + '_metal.png', !fullRender);
					
					ctx.globalAlpha = intensity/100;
					if(isHorizontal) {
						const adjWidth = Math.round(shortestSideMin*2 + marginW*2);
						const adjHeight = Math.round(shortestSideMin + marginH*2);
						const offsetX = Math.round((width - adjWidth) / 2);
						ctx.drawImage(img, offsetX, 0, adjWidth, adjHeight);
					} else {
						const adjWidth = Math.round(shortestSideMin + marginW*2);
						const adjHeight = Math.round(shortestSideMin*2 + marginH*2);
						const offsetY = Math.round((height - adjHeight) / 2);
						ctx.rotate(isHorizontal ? 0 : 1.57079632679);
						ctx.drawImage(img, offsetY, 0, adjHeight, -adjWidth);
						ctx.rotate(isHorizontal ? 0 : -1.57079632679);
					}
					ctx.globalAlpha = 1.0;
				} catch(err) { }
			}
			
			//encode canvas as image
			let data = null;
			if(imageType == 'jpeg') data = canvas.toDataURL('image/jpeg');
			else data = canvas.toDataURL('image/png');
			canvas.remove();
			return data;
		}
		
		//Gets the desired number of css rules
		function getPanelStyleRules(cssPageSelector, count) {
			let styleSheet = null;
			let styleSheetRules = [];
			for(let i=0; i<document.styleSheets.length; i++) {
				if(document.styleSheets[i].href && (document.styleSheets[i].href.indexOf('style.min.css') > -1 || document.styleSheets[i].href.indexOf('style.css') > -1)) {
					styleSheet = document.styleSheets[i];
					break;
				}
			}
			if(styleSheet) {
				for(let i=0; i<count; i++) {
					const panelSelector = cssPageSelector + ' .panel' + i;
					let foundRule = null;
					for(let j=0; j<styleSheet.cssRules.length; j++) {
						if(styleSheet.cssRules[j].selectorText == panelSelector) {
							foundRule = styleSheet.cssRules[j];
							break;
						}
					}
					if(foundRule) {
						styleSheetRules.push(foundRule);
					} else {
						let index = styleSheet.insertRule(panelSelector + ' { background-size: 100%; }');
						styleSheetRules.push(styleSheet.cssRules[index]);
					}
				}
			}
			return styleSheetRules;
		}
		
		///////////
		// Utils //
		///////////
		
		//Gets the palette color represented as a hex string
		function getPaletteColorInHex(color) {
			let rgb = colorPalette[color];
			let r = (rgb[0]).toString(16).padStart(2,'0').toUpperCase();
			let g = (rgb[1]).toString(16).padStart(2,'0').toUpperCase();
			let b = (rgb[2]).toString(16).padStart(2,'0').toUpperCase();
			return '#' + r + g + b;
		}
		
		//Checks if the given id is valid for the color palette
		function formatId(id) {
			if (id && (typeof id === 'string' || id instanceof String)) {
				id = id.toLowerCase();
				if (id.indexOf('0x') == 0) id = id.substr(2, id.length);
				if (id.length == 64) {
					for (let i = 0; i < 64; i++) {
						let v = id.charCodeAt(i);
						if (!(v >= 48 && v <= 57) && !(v >= 97 && v <= 102)) {
							return null;
						}
					}
					return id;
				}
			}
			return null;
		}
		
		//Gets a date string from the given millis
		function getDateStr(millis) {
			let d = new Date(millis);
			return (''+(d.getMonth()+1)).padStart(2,'0') + '/' + d.getFullYear();
		}
		
		//Loads the given image
		function loadImage(src, cache) {
			return $q(function (resolve, reject) {
				if(loadImage_cache[src]) resolve(loadImage_cache[src]);
				
				let img = new Image();
				img.onload = function() {
					if(cache) loadImage_cache[src] = img;
					resolve(img);
				}
				img.onerror = function() {
					reject();
				}
				img.src = src;
			});
		}
		
		//Base64 converter
		const ModifiedBase64 = (function () {
			var digitsStr = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
			var digits = digitsStr.split('');
			var digitsMap = {};
			for (let i = 0; i < digits.length; i++) digitsMap[digits[i]] = i;
			return {
				fromInt: function(int32) {
					if(!Number.isInteger(int32)) return null;
					let result = '';
					while (true) {
						result = digits[int32 & 0x3f] + result;
						int32 >>>= 6;
						if (int32 === 0) break;
					}
					return result;
				},
				toInt: function(digitsStr) {
					let result = 0;
					let digitsArr = digitsStr.split('');
					for (let i = 0; i < digitsArr.length; i++) {
						let digitVal = digitsMap[digitsArr[i]];
						if(digitVal === undefined) return null;
						result = (result << 6) + digitVal;
					}
					return result;
				}
			};
		})();
		
		//Cache manipulation
		function addToCache(cache, key, value, maxEntries) {
			let entryIndex = null;
			if(cache.length < maxEntries) {
				
				//new entry
				entryIndex = cache.length;
				cache.push({});
			} else {
				
				//replace oldest entry
				entryIndex = 0;
				let oldestTime = cache[0].timestamp;
				for(let i=0; i<cache.length; i++) {
					if(cache[i].timestamp < oldestTime) {
						entryIndex = i;
						oldestTime = cache[i].timestamp;
					}
				}
			}
			if(entryIndex !== null) {
				cache[entryIndex] = {
					timestamp: (new Date()).getTime(),
					key: key,
					value: value
				}
			}
		}
		function getFromCache(cache, key) {
			for(let i=0; i<cache.length; i++) {
				if(cache[i].key == key) {
					cache[i].timestamp = (new Date()).getTime();
					return cache[i].value;
				}
			}
			return null;
		}

	}
}());
