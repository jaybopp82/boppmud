'use strict';

const path = require('path');
const jsonfile = require('jsonfile');

const EntityDatabase = require('./EntityDatabase');
const Item = require('./Item');

const file = path.join(__dirname, '..', 'data', 'items.json');

class ItemDatabase extends EntityDatabase {

	constructor() {
		super();
	}

	deleteFromRoom(item, player) {
		player.room.removeItem(item);
	}

	load() {
		this.map.clear();
		const dataArray = jsonfile.readFileSync(file);
		dataArray.forEach(dataObject => {
			const item = new Item();
			item.load(dataObject);
			this.add(item);
		});
	}

	saveData()  {
		const itemArray = [];
		for (let item of this.map.values()) {
			itemArray.push(item.serialize())
		}
		jsonfile.writeFileSync(file, itemArray, {spaces: 2});
	}
	
	getRandomItem() {
		return this.map.get(Math.floor(Math.random() * this.size())+1);
	}

}

module.exports = ItemDatabase;
