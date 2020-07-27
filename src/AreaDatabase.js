'use strict';

const path = require('path');
const jsonfile = require('jsonfile');

const EntityDatabase = require('./EntityDatabase');
const Area = require('./Area');

const fileMap = path.join(__dirname, '..', 'data', 'areas.json');

class AreaDatabase extends EntityDatabase {

	constructor() {
		super();
	}

	load() {
		this.map.clear();
		const dataArray = jsonfile.readFileSync(fileMap);
		dataArray.forEach(dataObject => {
			const area = new Area();
			area.load(dataObject);
			this.add(area);
		});
	}

	saveData()  {
		const areaArray = [];
		for (let area of this.map.values()) {
			areaArray.push(area.serialize())
		}
		jsonfile.writeFileSync(fileMap, areaArray, {spaces: 2});
	}

}

module.exports = AreaDatabase;
