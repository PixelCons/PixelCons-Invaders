/***********************************************************************
 * settings.js
 * Defines a set of common settings accross multiple modules
 ***********************************************************************/
let privateSettings = {};
try{ privateSettings = require('./settings.private.json'); }catch(e){}

/* Enables automatically adjusting the HTML tag data with details about the page being requested */
const customizedHTMLTagsEnabled = true;

/* Enables advanced API features */
const advancedApiEnabled = true;

/* Web domain that the app is hosted on */
const appWebDomain = 'https://invaders.pixelcons.io/';

/* Deployed PixelCons contract address */
const contractAddress = '0x5536b6aadd29eaf0db112bb28046a5fad3761bd4';

/* Redirect link for opensea */
const openseaLink = '';

/* Opensea API key */
const openseaApiKey = '';

// Export
let settings = {
	customizedHTMLTagsEnabled: customizedHTMLTagsEnabled,
	advancedApiEnabled: advancedApiEnabled,
    appWebDomain: appWebDomain,
	contractAddress: contractAddress,
	openseaLink: openseaLink,
	openseaApiKey: openseaApiKey
}
for(let n in settings) if(privateSettings[n]) settings[n] = privateSettings[n];
module.exports = settings;
