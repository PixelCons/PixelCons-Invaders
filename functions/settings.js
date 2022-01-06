/***********************************************************************
 * settings.js
 * Defines a set of common settings accross multiple modules
 ***********************************************************************/
let privateSettings = {};
try{ privateSettings = require('./settings.private.json'); }catch(e){}

/* Enables automatically adjusting the HTML tag data with details about the page being requested */
const customizedHTMLTagsEnabled = false;

/* Enables advanced API features */
const advancedApiEnabled = true;

/* Web domain that the app is hosted on */
const appWebDomain = 'https://invaders.pixelcons.io/';

/* Deployed PixelCons contract address */
const contractAddress = '0x5536b6aadd29eaf0db112bb28046a5fad3761bd4';

/* JSON RPC endpoint to query PixelCons contract state from */
const jsonRpc = '';

/* Redirect link for opensea */
const openseaLink = 'https://opensea.io/collection/pixelcons?search[sortAscending]=true&search[sortBy]=PRICE&search[stringTraits][0][name]=Genesis&search[stringTraits][0][values][0]=2018%20Genesis';

/* Opensea API key */
const openseaApiKey = '';

/* Number of genesis pixelcons */
const genesisCount = 651;

/* List of all genesis pixelcn artists */
const genesisArtists = ['0x9f2fedfff291314e5a86661e5ed5e6f12e36dd37', '0x3bf64000788a356d9d7c38a332adbce539fff13d', '0x0507873482d57637e8d975640316b0a6b2ebbfc1', '0xf88e77f202db096e75596b468eef7c16282156b1', '0x4ff81761e0e8d3d311163b1b17607165c2d4955f'];

/* List of PixelCon ids that default to a gray background instead of black */
const defaultGrayBackground = [];

// Export
let settings = {
	customizedHTMLTagsEnabled: customizedHTMLTagsEnabled,
	advancedApiEnabled: advancedApiEnabled,
    appWebDomain: appWebDomain,
	contractAddress: contractAddress,
	jsonRpc: jsonRpc,
	openseaLink: openseaLink,
	openseaApiKey: openseaApiKey,
	genesisCount: genesisCount,
	genesisArtists: genesisArtists,
	defaultGrayBackground: defaultGrayBackground
}
for(let n in settings) if(privateSettings[n]) settings[n] = privateSettings[n];
module.exports = settings;
