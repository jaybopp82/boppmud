'use strict';

const Entity = require('./Entity');

class Quest extends Entity {

	constructor() {
		super();
		this.enemyId = 0;
		this.killed = false;
		this.points = 0;
	}

	load(dataObject) {
		this.id = parseInt(dataObject["ID"]);
		this.enemyId = parseInt(dataObject["ENEMYID"]);
		this.points = parseInt(dataObject["POINTS"]);
		this.killed = dataObject["KILLED"];
	}

	serialize() {
		return {
			"ID": this.id,
			"ENEMYID": this.enemyId,
			"KILLED": this.killed,
			"POINTS": this.points
		};
	}

}

module.exports = Quest;
