'use strict';

const path = require('path');
const jsonfile = require('jsonfile');

const EntityDatabase = require('./EntityDatabase');
const Help = require('./Help');

const file = path.join(__dirname, '..', 'data', 'help.json');

class HelpDatabase extends EntityDatabase {

	constructor() {
		super();
	}

	load() {
		this.map.clear();
		const dataArray = jsonfile.readFileSync(file);
		dataArray.forEach(dataObject => {
			const help = new Help();
			help.load(dataObject);
			this.add(help);
		});
	}

	save()  {
		const helpArray = [];
		for (let help of this.map.values()) {
			helpArray.push(help.serialize())
		}
		jsonfile.writeFileSync(file, helpArray, {spaces: 2});
	}

}

module.exports = HelpDatabase;
