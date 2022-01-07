/***********************************************************************
 * tagdata.js
 * Provides functions inserting tag data into the plain typical HTML
 ***********************************************************************/
const settings = require('./settings.js');
const webdata = require('./webdata.js');

// Settings
const customizedHTMLTagsEnabled = settings.customizedHTMLTagsEnabled;
const appWebDomain = settings.appWebDomain;
const tagEntryPoint = '<!-- Tag Inserts -->';

// Data
var plain_html_obj = null;

// Gets the main html with the correct tag data
async function getTagDataHTML(path, plainHTMLPath) {
	let htmlData = await getHTMLData(plainHTMLPath);
	if(!htmlData.taglessHTML || !customizedHTMLTagsEnabled) return htmlData.plainHTML;
	
	if(path.indexOf('/details/') === 0) {
		let index = formatIndex(path.substring(path.lastIndexOf('/') + 1, (path.indexOf('?') > -1) ? path.indexOf('?') : path.length));
		let id = formatId((path.indexOf('?id=') == -1) ? null : path.substring(path.lastIndexOf('?id=') + 4, path.length));
		if(index !== null && id !== null) {
			let type = 'summary';
			let name = 'Invader ' + index;
			let description = getDescription(id);
			let imageUrl = appWebDomain + 'meta/image/' + id;

			let tagHTML = insertTagData(htmlData, type, name, description, imageUrl);
			return tagHTML;
		}
	}
	
	return htmlData.plainHTML;
}

// Utils
const hexCharacters = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
async function getHTMLData(plainHTMLPath) {
	if(plain_html_obj) return plain_html_obj;
	
	//fetch the plain html file
	let plainHTML = await webdata.doGET(plainHTMLPath);
	
	//determine line endings
	let lineEnding = '\n';
	if((plainHTML.match(/\r\n/g) || []).length >= (plainHTML.match(/\n/g) || []).length) {
		lineEnding = '\r\n';
	}
	
	//generate html with tag data removed
	let taglessHTML = null;
	let tagStartIndex = plainHTML.indexOf(tagEntryPoint + lineEnding);
	if(tagStartIndex > -1) {
		let tagEndIndex = plainHTML.indexOf(lineEnding + lineEnding, tagStartIndex);
		taglessHTML = plainHTML.substring(0, tagStartIndex + tagEntryPoint.length + lineEnding.length) + plainHTML.substring(tagEndIndex + lineEnding.length, plainHTML.length);
	}
	
	//determine whitespace
	let whitespace = '';
	let whitespaceStartIndex = -1;
	while(whitespaceStartIndex < tagStartIndex) {
		let i = plainHTML.indexOf(lineEnding, whitespaceStartIndex + 1);
		if(i == -1 || i > tagStartIndex) break;
		whitespaceStartIndex = i;
	}
	if(whitespaceStartIndex > -1) whitespace = plainHTML.substring(whitespaceStartIndex + lineEnding.length, tagStartIndex);
	
	plain_html_obj = {
		plainHTML: plainHTML,
		taglessHTML: taglessHTML,
		lineEnding: lineEnding,
		whitespace: whitespace
	}
	return plain_html_obj;
}
function insertTagData(htmlData, type, title, description, imageUrl) {
	let tagHTML = (' ' + htmlData.taglessHTML).slice(1);
	let tagStartIndex = tagHTML.indexOf(tagEntryPoint);
	tagHTML = tagHTML.substring(0, tagStartIndex + tagEntryPoint.length + htmlData.lineEnding.length)
		+ htmlData.whitespace + '<meta name="twitter:card" content="' + type + '">' + htmlData.lineEnding
		+ htmlData.whitespace + '<meta name="twitter:site" content="@PixelConsToken">' + htmlData.lineEnding
		+ htmlData.whitespace + '<meta name="twitter:title" content="' + title + '">' + htmlData.lineEnding
		+ htmlData.whitespace + '<meta name="twitter:description" content="' + description + '">' + htmlData.lineEnding
		+ htmlData.whitespace + '<meta name="twitter:image" content="' + imageUrl + '">' + htmlData.lineEnding
		+ htmlData.whitespace + '<meta property="og:url" content="https://invaders.pixelcons.io/">' + htmlData.lineEnding
		+ htmlData.whitespace + '<meta property="og:title" content="' + title + '">' + htmlData.lineEnding
		+ htmlData.whitespace + '<meta property="og:description" content="' + description + '">' + htmlData.lineEnding
		+ htmlData.whitespace + '<meta property="og:image" content="' + imageUrl + '">' + htmlData.lineEnding
		+ tagHTML.substring(tagStartIndex + tagEntryPoint.length + htmlData.lineEnding.length, tagHTML.length);
	
	return tagHTML;
}
function formatIndex(index) {
	index = parseInt('' + index);
	if(!isNaN(index)) return index;
	return null;
}
function formatId(id) {
	if(!id) return null;
	id = id.toLowerCase();
	if(id.indexOf('0x') == 0) id = id.substr(2, id.length);
	if(id.length != 64) return null;
	for(let i=0; i<64; i++) if(hexCharacters.indexOf(id[i]) == -1) return null;
	return id;
}
function getDescription(invaderId) {
	let analysis = invaderAnalysis(invaderId);
	return "Level " + (analysis.level == 0 ? '?' : analysis.level) + " - " + analysis.type + " - " + analysis.range + " " + analysis.skill;
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

// Export
module.exports = {
    getTagDataHTML: getTagDataHTML
}
