'use strict';

const Util = require('./Util');
const { playerDb, roomDb, enemyDb, itemDb } = require('./Databases');
const ConnectionHandler = require('./ConnectionHandler');
const Player = require('./Player');
const DB = require('./Databases');
const { Attribute, ItemType, ItemFlags, WearLocs } = require('./Attributes');

const { cc } = require('./Telnet');

let tempRoom; // keeps track of the room player was in before editing
let num; // keeps track of the item being edited

//Game Handler class
class Iedit extends ConnectionHandler {

	constructor(connection, player, number) {
		super(connection);
		this.player = player;
		num = parseInt(number);
	}

	enter() {
		const p = this.player;
		tempRoom = p.room;
		this.connection.sendMessage(this.getMsg(itemDb.findById(num)));
		if (isNaN(tempRoom)) tempRoom.removePlayer(p);
	}

	handle(data) {
		const p = this.player;
		const removeWord = Util.removeWord;
		let item = itemDb.findById(num);
		
		//Quit
		if (data.toLowerCase() === "quit" || data.toLowerCase() === "q") {
			DB.saveDatabases();
			p.room = tempRoom;
			this.connection.removeHandler();
			return;
		}
		
		const n = parseInt(data);
		const text = removeWord(data, 0);
		
		//Edit Name
		if (n == 1) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 1 New Item Name</red></bold>");
			}
			else {
				item.name = text;
				this.connection.sendMessage("<bold><green>Item name updated!</green></bold>");
			}
		}
		//Edit Type
		if (n == 2) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 3 New Item Type</red></bold>");
			}
			else if (text.trim() == "?") {
				var msg = "<yellow><bold>Current item types:";
				ItemType.enums.forEach(type => {
					msg = msg + "\r\n(" + type + ") - " + type.key;
				});
				this.connection.sendMessage(msg);
			}
			else {
				if (ItemType.get(parseInt(text))) {
					item.type = ItemType.get(parseInt(text));
					this.connection.sendMessage("<bold><green>Item type updated!</green></bold>");
				}
				else {
					this.connection.sendMessage("<bold><red>Type '2 ?' for a list of item types</red></bold>");
				}
			}
		}
		//Edit Min Heal
		if (n == 3) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 3 New Min Heal</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 3 New Min Heal</red></bold>");
				}
				else {
					item.min = text;
					this.connection.sendMessage("<bold><green>Min heal updated!</green></bold>");
				}
			}
		}
		//Edit Max Heal
		if (n == 4) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 4 New Max Heal</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 4 New Max Heal</red></bold>");
				}
				else {
					item.max = text;
					this.connection.sendMessage("<bold><green>Max heal updated!</green></bold>");
				}
			}
		}
		//Edit Speed
		if (n == 5) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 5 New Speed Value</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 5 New Speed Value</red></bold>");
				}
				else {
					item.speed = text;
					this.connection.sendMessage("<bold><green>Speed updated!</green></bold>");
				}
			}
		}
		//Edit Price
		if (n == 6) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 6 New Price Value</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 6 New Price Value</red></bold>");
				}
				else {
					item.price = text;
					this.connection.sendMessage("<bold><green>Price updated!</green></bold>");
				}
			}
		}
		//Edit Strength
		if (n == 7) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 7 New Strength Value</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 7 New Strength Value</red></bold>");
				}
				else {
					item.attributes[Attribute.STRENGTH] = parseInt(text);
					this.connection.sendMessage("<bold><green>Strength updated!</green></bold>");
				}
			}
		}
		//Edit Health
		if (n == 8) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 8 New Health Value</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 8 New Health Value</red></bold>");
				}
				else {
					item.attributes[Attribute.HEALTH] = parseInt(text);
					this.connection.sendMessage("<bold><green>Health updated!</green></bold>");
				}
			}
		}
		//Edit Agility
		if (n == 9) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 9 New Agility Value</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 9 New Agility Value</red></bold>");
				}
				else {
					item.attributes[Attribute.AGILITY] = parseInt(text);
					this.connection.sendMessage("<bold><green>Agility updated!</green></bold>");
				}
			}
		}
		//Edit Max HP
		if (n == 10) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 10 New Max HP Value</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 10 New Max HP Value</red></bold>");
				}
				else {
					item.attributes[Attribute.MAXHITPOINTS] = parseInt(text);
					this.connection.sendMessage("<bold><green>Max HP updated!</green></bold>");
				}
			}
		}
		//Edit Accuracy
		if (n == 11) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 11 New Accuracy Value</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 11 New Accuracy Value</red></bold>");
				}
				else {
					item.attributes[Attribute.ACCURACY] = parseInt(text);
					this.connection.sendMessage("<bold><green>Accuracy updated!</green></bold>");
				}
			}
		}
		//Edit Dodging
		if (n == 12) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 12 New Dodging Value</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 12 New Dodging Value</red></bold>");
				}
				else {
					item.attributes[Attribute.DODGING] = parseInt(text);
					this.connection.sendMessage("<bold><green>Dodging updated!</green></bold>");
				}
			}
		}
		//Edit Strike Damage
		if (n == 13) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 13 New Strike Damage Value</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 13 New Strike Damage Value</red></bold>");
				}
				else {
					item.attributes[Attribute.STRIKEDAMAGE] = parseInt(text);
					this.connection.sendMessage("<bold><green>Strike Damage updated!</green></bold>");
				}
			}
		}
		//Edit Damage Absorb
		if (n == 14) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 14 New Damage Absorb Value</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 14 New Damage Absorb Value</red></bold>");
				}
				else {
					item.attributes[Attribute.DAMAGEABSORB] = parseInt(text);
					this.connection.sendMessage("<bold><green>Damage Absorb updated!</green></bold>");
				}
			}
		}
		//Edit HP Regen
		if (n == 15) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 15 New HP Regen Value</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 15 New HP Regen Value</red></bold>");
				}
				else {
					item.attributes[Attribute.HPREGEN] = parseInt(text);
					this.connection.sendMessage("<bold><green>HP Regen updated!</green></bold>");
				}
			}
		}
		//Edit Item Flags
		if (n == 16) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 16 Item Flag to Toggle</red></bold>");
			}
			else if (text.trim() == "?") {
				var msg = "<yellow><bold>Current item flags:";
				var flags = ItemFlags;
				flags.sort();
				flags.forEach(flag => {
					msg = msg + "\r\n" + flag;
				});
				this.connection.sendMessage(msg);
			}
			else if (text.trim().toUpperCase() == "CLEAR") {
				item.flags = [];
				this.connection.sendMessage("<bold><green>Item flags cleared!</green></bold>");
			}
			else {
				if (ItemFlags.indexOf(text.toUpperCase()) == -1) {
					this.connection.sendMessage("<bold><red>Item flag not found! (Use 16 ? for list of existing flags)</red></bold>");
				}
				else {
					if (item.flags.indexOf(text.toUpperCase()) == -1) {
						item.flags.push(text.toUpperCase());
						item.flags.sort();
						this.connection.sendMessage("<bold><green>Item flag added!</green></bold>");
					}
					else {
						item.flags.splice(item.flags.indexOf(text.toUpperCase()), 1);
						item.flags.sort();
						this.connection.sendMessage("<bold><green>Item flag removed!</green></bold>");
					}
				}
			}
		}
		//Edit Min Level
		if (n == 17) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 17 New Min Level</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 17 New Min Level</red></bold>");
				}
				else {
					item.minLevel = parseInt(text);
					this.connection.sendMessage("<bold><green>Min level updated!</green></bold>");
				}
			}
		}
		//Edit Wear Locs
		if (n == 18) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 18 Wear Location to Toggle</red></bold>");
			}
			else if (text.trim() == "?") {
				var msg = "<yellow><bold>Current wear locations:";
				var flags = WearLocs;
				flags.sort();
				flags.forEach(flag => {
					msg = msg + "\r\n" + flag;
				});
				this.connection.sendMessage(msg);
			}
			else if (text.trim().toUpperCase() == "CLEAR") {
				item.wearLocs = [];
				this.connection.sendMessage("<bold><green>Wear locations cleared!</green></bold>");
			}
			else {
				if (WearLocs.indexOf(text.toUpperCase()) == -1) {
					this.connection.sendMessage("<bold><red>Wear location not found! (Use 18 ? for list)</red></bold>");
				}
				else {
					if (item.wearLocs.indexOf(text.toUpperCase()) == -1) {
						item.wearLocs.push(text.toUpperCase());
						item.wearLocs.sort();
						this.connection.sendMessage("<bold><green>Wear location added!</green></bold>");
					}
					else {
						item.wearLocs.splice(item.wearLocs.indexOf(text.toUpperCase()), 1);
						item.wearLocs.sort();
						this.connection.sendMessage("<bold><green>Wear location removed!</green></bold>");
					}
				}
			}
		}
		//Reprint menu
		if (data.toLowerCase() === "") {
			this.connection.sendMessage(this.getMsg(item));
		}
	}
	
	getMsg(item) {
		const attr = item.attributes;
		
		var msg = "<bold><white>You are editing item: <yellow>" + item.name + " [ID: " + item.id + "]</yellow>\r\n" + 
		"\r\n" + 
		"<white>1 ) Name    : <magenta>" + item.name + "</magenta>\r\n" + 
		"<white>2 ) Type    : <magenta>" + item.type.key + " <cyan>(Use '2 ?' for a list of item types)</cyan>\r\n" +  
		"<white>3 ) Min Heal: <magenta>" + item.min + "</magenta>\r\n" +
		"<white>4 ) Max Heal: <magenta>" + item.max + "</magenta>\r\n" +
		"<white>5 ) Speed   : <magenta>" + item.speed + "</magenta>\r\n" +
		"<white>6 ) Price   : <magenta>" + item.price + "</magenta>\r\n" +
		"<white>7 ) Strength: <magenta>" + attr[Attribute.STRENGTH] + "</magenta>\r\n" +
		"<white>8 ) Health  : <magenta>" + attr[Attribute.HEALTH] + "</magenta>\r\n" +
		"<white>9 ) Agility : <magenta>" + attr[Attribute.AGILITY] + "</magenta>\r\n" +
		"<white>10) Max HP  : <magenta>" + attr[Attribute.MAXHITPOINTS] + "</magenta>\r\n" +
		"<white>11) Accuracy: <magenta>" + attr[Attribute.ACCURACY] + "</magenta>\r\n" +
		"<white>12) Dodging : <magenta>" + attr[Attribute.DODGING] + "</magenta>\r\n" +
		"<white>13) StrikDmg: <magenta>" + attr[Attribute.STRIKEDAMAGE] + "</magenta>\r\n" +
		"<white>14) DmgAbsrb: <magenta>" + attr[Attribute.DAMAGEABSORB] + "</magenta>\r\n" +
		"<white>15) HP Regen: <magenta>" + attr[Attribute.HPREGEN] + "</magenta>\r\n" +
		"<white>16) Flags   : <magenta>" + item.flags + " <cyan>(Use '10 ?' for a list of all flags, or 'clear')</cyan>\r\n" +
		"<white>17) MinLevel: <magenta>" + item.minLevel + "</magenta>\r\n" +
		"<white>18) WearLocs: <magenta>" + item.wearLocs + " <cyan>(Use '18 ?' for a list, or 'clear')</cyan>\r\n" +

		"\r\n" + 
		"<white>Type a number to edit value, or (q)uit to leave and save changes: \r\n</bold>";
		
		return msg;
	}

	hungup() {
		const p = this.player;
		playerDb.logout(p.id);
	}

}

module.exports = Iedit;
