'use strict';

const Entity = require('./Entity');

class Area extends Entity {
	constructor() {
		super();
		
		this.name = "A New Area";
		this.minLevel = 0;
		this.maxLevel = 0;
		this.mobDeaths = 0;
		this.playerDeaths = 0;
		this.levelLock = 0;
		this.flags = [];
		this.spawnMsg = "The area has spawned new enemies!";
	}

	load(templateObject) {
		this.id = parseInt(templateObject["ID"]);
		this.name = templateObject["NAME"];
		this.minLevel = parseInt(templateObject["MINLEVEL"]);
		this.maxLevel = parseInt(templateObject["MAXLEVEL"]);
		this.mobDeaths = parseInt(templateObject["MOBDEATHS"]);
		this.playerDeaths = parseInt(templateObject["PLAYERDEATHS"]);
		this.levelLock = parseInt(templateObject["LEVELLOCK"]);
		this.flags = templateObject["FLAGS"] || [];
		this.spawnMsg = templateObject["SPAWNMSG"];
	}

	serialize() {
		return {
			"ID": this.id,
			"NAME": this.name,
			"MINLEVEL": this.minLevel,
			"MAXLEVEL": this.maxLevel,
			"MOBDEATHS": this.mobDeaths,
			"PLAYERDEATHS": this.playerDeaths,
			"LEVELLOCK": this.levelLock,
			"FLAGS": this.flags,
			"SPAWNMSG": this.spawnMsg
		};
	}

} // end class Area

module.exports = Area;
