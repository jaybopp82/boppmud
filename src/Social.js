'use strict';

const Entity = require('./Entity');

class Social extends Entity {

	constructor() {
		super();
		this.name = "";
		this.roomMsg = "";
	}

	load(dataObject) {
		this.id = parseInt(dataObject["ID"]);
		this.name = dataObject["NAME"];
		this.roomMsg = dataObject["ROOMMSG"];
	}

	serialize() {
		return {
			"ID": this.id,
			"NAME": this.name,
			"ROOMMSG": this.roomMsg
		};
	}

}

module.exports = Social;
