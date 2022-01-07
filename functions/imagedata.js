/***********************************************************************
 * imagedata.js
 * Provides functions for generating Invader images
 ***********************************************************************/
const settings = require('./settings.js');
const png = require('fast-png');
const qrcode = require('qrcode');

// Settings
const qrCodeImageLink = settings.appWebDomain + 'details/';
const standardImageScaleMultiplier = 2;

// Gets the standard PNG for the given invader id
async function getStandardImage(invaderId, index) {
	const width = 265 * standardImageScaleMultiplier;
	const height = 175 * standardImageScaleMultiplier;
	const invaderScale = 15 * standardImageScaleMultiplier;
	const qrCodeMargin = 5 * standardImageScaleMultiplier;
	let dataArray = new Uint8Array(width*height*3);
	
	let id = formatId(invaderId);
	if(!id) throw "Invalid ID";
	
	//draw the background
	drawSquare(dataArray, width, height, 0, 0, width, height, [0,0,0]);
	
	//draw the qr code
	index = Number.isInteger(parseInt(index)) ? parseInt(index) : null;
	if(index !== null && index !== undefined) {
		let linkStr = qrCodeImageLink + index;
		drawQrCode_b(dataArray, width, height, qrCodeMargin, qrCodeMargin, standardImageScaleMultiplier, linkStr, [250,250,250]);
	}
	
	//draw the invader
	const offsetX = Math.round((width-(invaderScale*8))/2);
	const offsetY = Math.round((height-(invaderScale*8))/2);
	drawInvader(dataArray, width, height, offsetX, offsetY, invaderScale, id);
	
	return Buffer.from(png.encode({width:width, height:height, data:dataArray, channels:3}));
}

// Utils
function formatId(id) {
	id = id.toLowerCase();
	if(id.indexOf('0x') == 0) id = id.substr(2,id.length);
	if(id.length != 64) return null;
	for(let i=0; i<64; i++) if(hexCharacters.indexOf(id[i]) == -1) return null;
	return id;
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
function drawInvader(dataArray, arrayW, arrayH, x, y, s, id) {
	for(let i=0; i<id.length; i++) {
		let xPos = x + (i%8)*s;
		let yPos = y + Math.floor(i/8)*s;
		drawSquare(dataArray, arrayW, arrayH, xPos, yPos, s, s, colorPalette[id[i]]);
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
