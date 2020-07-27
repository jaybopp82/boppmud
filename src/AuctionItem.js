'use strict';

const Entity = require('./Entity');

class AuctionItem extends Entity {

	constructor() {
		super();
		var d = new Date();
		this.itemId = 0;
		this.seller = 'NONE';
		this.dateStarted = d.getTime();
		this.currentBid = 100;
		this.bidder = '';
	}

	load(dataObject) {
		this.id = parseInt(dataObject["ID"]);
		this.itemId = parseInt(dataObject["ITEMID"]);
		this.seller = dataObject["SELLER"];
		this.dateStarted = parseInt(dataObject["DATESTARTED"]);
		this.currentBid = parseInt(dataObject["CURRENTBID"]);
		this.bidder = dataObject["BIDDER"];
	}

	serialize() {
		return {
			"ID": this.id,
			"ITEMID": this.itemId,
			"SELLER": this.seller,
			"DATESTARTED": this.dateStarted,
			"CURRENTBID": parseInt(this.currentBid),
			"BIDDER": this.bidder
		};
	}

}

module.exports = AuctionItem;
