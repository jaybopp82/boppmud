'use strict';

const path = require('path');
const jsonfile = require('jsonfile');

const EntityDatabase = require('./EntityDatabase');
const Quest = require('./Quest');

const file = path.join(__dirname, '..', 'data', 'quest.json');

class QuestDatabase extends EntityDatabase {

	constructor() {
		super();
	}

	load() {
		this.map.clear();
		const dataArray = jsonfile.readFileSync(file);
		dataArray.forEach(dataObject => {
			const quest = new Quest();
			quest.load(dataObject);
			this.add(quest);
		});
	}

	save()  {
		const questArray = [];
		for (let quest of this.map.values()) {
			questArray.push(quest.serialize())
		}
		jsonfile.writeFileSync(file, questArray, {spaces: 2});
	}
	
	delete(quest) {
		this.map.delete(quest.id);
	}
	
	getQuest() {
		return this.map.get(1);
	}

}

module.exports = QuestDatabase;
