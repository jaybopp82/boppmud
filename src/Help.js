'use strict';

const Entity = require('./Entity');
const { PlayerRank } = require('./Attributes');

class Help extends Entity {

	constructor() {
		super();
		this.keywords = "";
		this.description = "";
		this.minRank = PlayerRank.PLAYER;
	}

	load(dataObject) {
		this.id = parseInt(dataObject["ID"]);
		this.keywords = dataObject["KEYWORDS"];
		this.description = dataObject["DESCRIPTION"];
		this.minRank = PlayerRank.get(dataObject["MINRANK"]);
	}

	serialize() {
		return {
			"ID": this.id,
			"KEYWORDS": this.keywords,
			"DESCRIPTION": this.description,
			"MINRANK": this.minRank.toString()
		};
	}

}

module.exports = Help;
