'use strict';

const Entity = require('./Entity');
const { Attribute, ItemType } = require('./Attributes');

class Item extends Entity {

	constructor() {
		super();
		this.type = ItemType.WEAPON;
		this.min = 0;
		this.max = 0;
		this.speed = 0;
		this.price = 0;
		this.attributes = [];
		this.flags = [];
		this.minLevel = 0;
		this.wearLocs = [];
	}

	load(dataObject) {
		this.id = parseInt(dataObject["ID"]);
		this.name = dataObject["NAME"];
		this.type = ItemType.get(dataObject["TYPE"]);
		this.min = parseInt(dataObject["MIN"]);
		this.max = parseInt(dataObject["MAX"]);
		this.speed = parseInt(dataObject["SPEED"]);
		this.price = parseInt(dataObject["PRICE"]);
		Attribute.enums.forEach(attr => {
			this.attributes[attr] = parseInt(dataObject[attr.key]);
		});
		this.flags = dataObject["FLAGS"] || [];
		this.minLevel = parseInt(dataObject["MINLEVEL"]);
		this.wearLocs = dataObject["WEARLOCS"] || [];
	}
	
	hasFlag(flag) {
		if (this.flags.indexOf(flag.toUpperCase()) == -1) {
			return false;
		}
		return true;
	}

	serialize() {
		return {
			"ID": this.id,
			"NAME": this.name,
			"TYPE": this.type,
			"MIN": parseInt(this.min),
			"MAX": parseInt(this.max),
			"SPEED": parseInt(this.speed),
			"PRICE": parseInt(this.price),
			"STRENGTH": parseInt(this.attributes[Attribute.STRENGTH]),
			"HEALTH": parseInt(this.attributes[Attribute.HEALTH]),
			"AGILITY": parseInt(this.attributes[Attribute.AGILITY]),
			"MAXHITPOINTS": parseInt(this.attributes[Attribute.MAXHITPOINTS]),
			"ACCURACY": parseInt(this.attributes[Attribute.ACCURACY]),
			"DODGING": parseInt(this.attributes[Attribute.DODGING]),
			"STRIKEDAMAGE": parseInt(this.attributes[Attribute.STRIKEDAMAGE]),
			"DAMAGEABSORB": parseInt(this.attributes[Attribute.DAMAGEABSORB]),
			"HPREGEN": parseInt(this.attributes[Attribute.HPREGEN]),
			"FLAGS": this.flags,
			"MINLEVEL": this.minLevel,
			"WEARLOCS": this.wearLocs
		};
	}

}

module.exports = Item;
