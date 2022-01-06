/***********************************************************************
 * openseadata.js
 * Provides functions for fetching data from the opensea market
 ***********************************************************************/
const settings = require('./settings.js');
const webdata = require('./webdata.js');
const cachedata = require('./cachedata.js');

// Settings
const advancedApiEnabled = settings.advancedApiEnabled;
const openseaApiKey = settings.openseaApiKey;
const contractAddress = settings.contractAddress;
const marketUrl = 'https://api.opensea.io/api/v1';
const saleListingsCacheSeconds = 10*60;
const maxMarketSearch = 50;

// Grabs the current for sale listings
async function getSaleListings(url, data) {
	return await cachedata.cacheData('openseadata_getSaleListings()', async function() {
		if(!advancedApiEnabled || !openseaApiKey) throw "API not enabled";
		try {
			let marketItems = await getMarketState();
			let forSale = [];
			if(marketItems) {
				for(let i=0; i<marketItems.length; i++) {
					if(marketItems[i].listing) {
						forSale.push({
							id: marketItems[i].id,
							index: marketItems[i].index,
							link: marketItems[i].link,
							price: marketItems[i].listing.amount,
							unit: marketItems[i].listing.token,
							priceUSD: marketItems[i].listing.valueUSD
						});
					}
				}
			}
			return forSale;
		} catch (err) {
			console.log(err);
		}
		
		throw "failed to fetch data";
	}, saleListingsCacheSeconds);
}

// Gets the state of the current market
async function getMarketState() {
	//compile a list of all market items
	let offset = 0;
	let marketItems = [];
	while(true) {
		let url = marketUrl + '/assets';
		url += '?asset_contract_address=' + contractAddress;
		url += '&offset=' + offset;
		url += '&limit=' + maxMarketSearch;
		let headers = {
			"Accept": "application/json",
			"X-API-KEY": openseaApiKey
		};
		let data = null;
		try{ data = await webdata.doGET(url, headers); } catch(err) {console.log(err)}
		if(!data) { //retry
			await sleep(1000);
			try{ data = await webdata.doGET(url, headers); } catch(err) {console.log(err)}
		}
		
		let assets = JSON.parse(data).assets;
		for(let i=0; i<assets.length; i++) {
			let asset = assets[i];
			let id = asset.token_metadata.substr(asset.token_metadata.indexOf('0x'), 66);
			let metadataParse = asset.token_metadata.split('?')[1].split('&');
			let index = '';
			let creator = '';
			let created = '';
			for(let i=0; i<metadataParse.length; i++) {
				if(metadataParse[i].indexOf('index=') > -1) index = metadataParse[i].substring('index='.length);
				if(metadataParse[i].indexOf('creator=') > -1) creator = metadataParse[i].substring('creator='.length);
				if(metadataParse[i].indexOf('created=') > -1) created = metadataParse[i].substring('created='.length);
			}
			let lastSale = null;
			if(asset.last_sale && asset.last_sale.event_type=="successful" && !asset.last_sale.asset_bundle) {
				lastSale = {
					seller: asset.last_sale.transaction.from_account.address.toLowerCase(),
					buyer: asset.last_sale.transaction.to_account.address.toLowerCase(),
					amount: Math.round(parseInt(asset.last_sale.total_price) / (Math.pow(10, asset.last_sale.payment_token.decimals - 3 ))) / 1000,
					token: asset.last_sale.payment_token.symbol,
					valueUSD: parseInt(asset.last_sale.total_price) / (Math.pow(10, asset.last_sale.payment_token.decimals)) * asset.last_sale.payment_token.usd_price,
					timestamp: (new Date(asset.last_sale.transaction.timestamp)).getTime() - (new Date()).getTimezoneOffset()*60*1000
				}
			}
			let listing = null;
			if(asset.sell_orders && asset.sell_orders[0] && asset.sell_orders[0].sale_kind==0) {
				listing = {
					seller: asset.sell_orders[0].maker.address.toLowerCase(),
					amount: Math.round(parseInt(asset.sell_orders[0].current_price) / (Math.pow(10, asset.sell_orders[0].payment_token_contract.decimals - 3 ))) / 1000,
					token: asset.sell_orders[0].payment_token_contract.symbol,
					valueUSD: parseInt(asset.sell_orders[0].current_price) / (Math.pow(10, asset.sell_orders[0].payment_token_contract.decimals)) * asset.sell_orders[0].payment_token_contract.usd_price,
					timestamp: asset.sell_orders[0].listing_time * 1000
				}
			}
			marketItems.push({
				id: id,
				index: parseInt(index, 16),
				name: asset.name,
				image: asset.image_original_url,
				link: asset.permalink,
				owner: asset.owner.address.toLowerCase(),
				creator: creator.toLowerCase(),
				created: parseInt(created, 16) * 1000,
				lastSale: lastSale,
				listing: listing
			});
		}
		
		if(assets.length < maxMarketSearch) break;
		offset += maxMarketSearch;
	}
	
	//sort items and run calculations
	marketItems.sort(function(a, b) {
		return a.index - b.index;
	});
	
	return marketItems;
}

// Utils
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export
module.exports = {
    getSaleListings: getSaleListings
}
