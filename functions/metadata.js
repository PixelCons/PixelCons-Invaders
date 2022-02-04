/***********************************************************************
 * metadata.js
 * Provides functions for reporting the metadata of Invaders
 ***********************************************************************/
const settings = require('./settings.js');

// Settings
const appWebDomain = settings.appWebDomain;
const detailedMetadataEnabled = settings.detailedMetadataEnabled;

// Gets the metadata JSON for the given invader id
async function getMetadata(invaderId, params) {
	let id = formatId(invaderId);
	let index = formatIndex(params.index);
	if(id === null) throw "Invalid ID";
	if(index === null) throw "Invalid Index";
	
	//calculate data
	let analysis = invaderAnalysis(id);
	let name = "Invader " + index;
	let description = "Level " + (analysis.level == 0 ? '?' : analysis.level) + " - " + analysis.type + " - " + analysis.range + " " + analysis.skill;
	
	//construct metadata
	let metadata = {
		"name": name,
		"description": description, 
		"image": appWebDomain + "meta/image/" + id,
		"image_url": appWebDomain + "meta/image/" + id,
		"external_url": appWebDomain + "details/" + index,
		"home_url": appWebDomain + "details/" + index + '?id=' + id,
		"background_color": '000000',
		"color": '000000',
		"attributes": [{
			"trait_type": "Type", 
			"value": analysis.type
		},{
			"trait_type": "Level", 
			"value": "Level " + (analysis.level == 0 ? '?' : analysis.level)
		},{
			"trait_type": "Range", 
			"value": analysis.range
		},{
			"trait_type": "Skill", 
			"value": analysis.skill
		}]
	}
				
	return metadata;
}

// Utils
const hexCharacters = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
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
	
	let type = 'Unknown (Ancient)';
	if(typeColor == '7') type = 'Metal (Metallum Alloy)';
	else if(typeColor == '8') type = 'Fire (Ignis Magma)';
	else if(typeColor == '9') type = 'Desert (Sicco Solar)';
	else if(typeColor == 'a') type = 'Electric (Lectricus Zap)';
	else if(typeColor == 'b') type = 'Forest (Silva Brush)';
	else if(typeColor == 'c') type = 'Water (Imber Drench)';
	
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
    getMetadata: getMetadata
}
