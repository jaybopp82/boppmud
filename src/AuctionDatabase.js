'use strict';

const path = require('path');
const jsonfile = require('jsonfile');

const EntityDatabase = require('./EntityDatabase');
const AuctionItem = require('./AuctionItem');

const file = path.join(__dirname, '..', 'data', 'auction.json');

class AuctionDatabase extends EntityDatabase {

	constructor() {
		super();
	}

	load() {
		this.map.clear();
		const dataArray = jsonfile.readFileSync(file);
		dataArray.forEach(dataObject => {
			const item = new AuctionItem();
			item.load(dataObject);
			this.add(item);
		});
	}

	save()  {
		const itemArray = [];
		for (let item of this.map.values()) {
			itemArray.push(item.serialize())
		}
		jsonfile.writeFileSync(file, itemArray, {spaces: 2});
	}
	
	delete(auc) {
		this.map.delete(auc.id);
	}

}

module.exports = AuctionDatabase;
