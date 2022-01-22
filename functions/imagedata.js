/***********************************************************************
 * imagedata.js
 * Provides functions for generating Invader images
 ***********************************************************************/
const settings = require('./settings.js');
const webdata = require('./webdata.js');
const png = require('fast-png');
const qrcode = require('qrcode');

// Settings
const appWebStatic = settings.appWebStatic;
const qrCodeImageLink = settings.appWebDomain + 'details/';
const standardImageScaleMultiplier = 2;

// Data
var backgroundImages = {};

// Gets the standard PNG for the given invader id
async function getStandardImage(invaderId, index) {
	const invaderBorder = 4 * standardImageScaleMultiplier;
	const invaderScale = 14 * standardImageScaleMultiplier;
	
	let id = formatId(invaderId);
	if(!id) throw "Invalid ID";
	
	//get the background
	let backgroundImageData = await getBackgroundImage(id);
	const width = backgroundImageData.width;
	const height = backgroundImageData.height;
	let dataArray = backgroundImageData.dataArray;
	
	//draw the invader
	const offsetX = Math.round((width-(invaderScale*8))/2);
	const offsetY = Math.round((height-(invaderScale*8))/2);
	drawInvaderShadow(dataArray, width, height, offsetX, offsetY, invaderScale, invaderBorder, id);
	drawInvader(dataArray, width, height, offsetX, offsetY, invaderScale, id);
	
	return Buffer.from(png.encode({width:width, height:height, data:dataArray, channels:3}));
}

// Utils
function formatId(id) {
	if(!id) return null;
	id = id.toLowerCase();
	if(id.indexOf('0x') == 0) id = id.substr(2, id.length);
	if(id.length != 64) return null;
	for(let i=0; i<64; i++) if(hexCharacters.indexOf(id[i]) == -1) return null;
	return id;
}
function formatIndex(index) {
	index = parseInt('' + index);
	if(!isNaN(index)) return index;
	return null;
}
function invaderAnalysis(invaderId) {
	const attackDefense = ['6','d'];
	const longRangeShortRange = ['1','5'];
	const elementalTypes = ['7','8','9','a','b','c'];
	invaderId = formatId(invaderId);
	
	let level = 0;
	let typeColor = null;
	let skillColor = null;
	let rangeColor = null;
	for(let i=0; i<invaderId.length; i++) {
		level += (elementalTypes.indexOf(invaderId[i]) > -1) ? 1 : 0;
		typeColor = (elementalTypes.indexOf(invaderId[i]) > -1) ? invaderId[i] : typeColor;
		skillColor = (attackDefense.indexOf(invaderId[i]) > -1) ? invaderId[i] : skillColor;
		rangeColor = (longRangeShortRange.indexOf(invaderId[i]) > -1) ? invaderId[i] : rangeColor;
	}
	level = level/2;
	
	let type = 'Unknown Type (Ancient)';
	if(typeColor == '7') type = 'Metal Type (Metallum Alloy)';
	else if(typeColor == '8') type = 'Fire Type (Ignis Magma)';
	else if(typeColor == '9') type = 'Desert Type (Sicco Solar)';
	else if(typeColor == 'a') type = 'Electric Type (Lectricus Zap)';
	else if(typeColor == 'b') type = 'Forest Type (Silva Brush)';
	else if(typeColor == 'c') type = 'Water Type (Imber Drench)';
	
	let skill = 'Versatile';
	if(skillColor == '6') skill = 'Attack';
	else if(skillColor == 'd') skill = 'Defense';
	
	let range = 'All Range';
	if(rangeColor == '5') range = 'Long Range';
	else if(rangeColor == '1') range = 'Short Range';
	
	return {
		level: level,
		type: type,
		skill: skill,
		range: range
	}
}
function drawSquare(dataArray, arrayW, arrayH, x, y, w, h, color) {
	let xStart = Math.max(Math.min(x, arrayW),0);
	let xEnd = Math.max(Math.min(x+w, arrayW),0);
	let yStart = Math.max(Math.min(y, arrayH),0);
	let yEnd = Math.max(Math.min(y+h, arrayH),0);
	for(let x2=xStart; x2<xEnd; x2++) {
		for(let y2=yStart; y2<yEnd; y2++) {
			let index = (y2*arrayW + x2)*3;
			dataArray[index+0] = color[0];
			dataArray[index+1] = color[1];
			dataArray[index+2] = color[2];
		}
	}
}
function drawQrCode(dataArray, arrayW, arrayH, x, y, s, str, color) {
	if(!color) color = [0, 0, 0];
	let qr = qrcode.create(str, {
		errorCorrectionLevel: 'low'
	});
	let size = qr.modules.size;
	let data = qr.modules.data;
	for(let x2=0; x2<size; x2++) {
		for(let y2=0; y2<size; y2++) {
			if(data[y2*size + x2]) {
				drawSquare(dataArray, arrayW, arrayH, x + x2*s, y + y2*s, s, s, color);
			}
		}
	}
}
function drawQrCode_b(dataArray, arrayW, arrayH, x, y, s, str, color) {
	drawQrCode(dataArray, arrayW, arrayH, x, arrayH - (y + 25*s), s, str, color);
}
function drawInvaderShadow(dataArray, arrayW, arrayH, x, y, s, w, id) {
	for(let i=0; i<id.length; i++) {
		let xPos = x + (i%8)*s;
		let yPos = y + Math.floor(i/8)*s;
		if(id[i] != '0') {
			drawSquare(dataArray, arrayW, arrayH, xPos-w, yPos-w, s+w*2, s+w*2, [0,0,0]);
		}
	}
}
function drawInvader(dataArray, arrayW, arrayH, x, y, s, id) {
	for(let i=0; i<id.length; i++) {
		let xPos = x + (i%8)*s;
		let yPos = y + Math.floor(i/8)*s;
		if(id[i] != '0') {
			drawSquare(dataArray, arrayW, arrayH, xPos, yPos, s, s, colorPalette[id[i]]);
		}
	}
}
async function getBackgroundImage(invaderId) {
	let analysis = invaderAnalysis(invaderId);
	let background = 'background_black';
	if(analysis.type == 'Metal Type (Metallum Alloy)') background = 'background_white';
	else if(analysis.type == 'Fire Type (Ignis Magma)') background = 'background_red';
	else if(analysis.type == 'Desert Type (Sicco Solar)') background = 'background_orange';
	else if(analysis.type == 'Electric Type (Lectricus Zap)') background = 'background_yellow';
	else if(analysis.type == 'Forest Type (Silva Brush)') background = 'background_green';
	else if(analysis.type == 'Water Type (Imber Drench)') background = 'background_blue';

	if(backgroundImages[background]) return backgroundImages[background];
	else {
		let data = await webdata.doGET(appWebStatic + 'img/gen/' + background + '.png', null, true);
		data = png.decode(data);
		let width = data.width * standardImageScaleMultiplier;
		let height = data.height * standardImageScaleMultiplier;
		let dataArray = new Uint8Array(width*height*3);
		for(let w=0; w<data.width; w++) {
			for(let h=0; h<data.height; h++) {
				let imageIndex = h*data.width + w;
				
				for(let mw=0; mw<standardImageScaleMultiplier; mw++) {
					for(let mh=0; mh<standardImageScaleMultiplier; mh++) {
						let arrayIndex = ((h*standardImageScaleMultiplier) + mh)*width + (w*standardImageScaleMultiplier) + mw;
						dataArray[arrayIndex*3 + 0] = data.data[imageIndex*3 + 0];
						dataArray[arrayIndex*3 + 1] = data.data[imageIndex*3 + 1];
						dataArray[arrayIndex*3 + 2] = data.data[imageIndex*3 + 2];
					}
				}
			}
		}
		backgroundImages[background] = {
			width: width,
			height: height,
			dataArray: dataArray
		}
		return backgroundImages[background];
	}
}

// Data Constants
const hexCharacters = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
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
};

// Export
module.exports = {
	getStandardImage: getStandardImage
}
