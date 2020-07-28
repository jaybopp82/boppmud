'use strict';

const path = require('path');
const jsonfile = require('jsonfile');
const EntityDatabase = require('./EntityDatabase');
const Store = require('./Store');

const file = path.join(__dirname, '..', 'data', 'stores.json');

class StoreDatabase extends EntityDatabase {

  constructor() {
    super();
  }

  load(itemDb) {
    this.map.clear();
    const dataArray = jsonfile.readFileSync(file);
    dataArray.forEach(dataObject => {
      const store = new Store();
      store.load(dataObject, itemDb);
      this.add(store);
    });
  }
  
  save()  {
		const dataArray = [];
		for (let store of this.map.values()) {
			dataArray.push(store.serialize())
		}
		jsonfile.writeFileSync(file, dataArray, {spaces: 2});
	}

}

module.exports = StoreDatabase;
