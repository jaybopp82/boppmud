'use strict';

const Util = require('./Util');
const { playerDb, roomDb, enemyDb, enemyTpDb, itemDb } = require('./Databases');
const ConnectionHandler = require('./ConnectionHandler');
const Player = require('./Player');
const DB = require('./Databases');
const { Attribute, ItemType, EnemyFlags } = require('./Attributes');

const { cc } = require('./Telnet');

let tempRoom; // keeps track of the room player was in before editing
let num; // keeps track of the item being edited

//Game Handler class
class Eedit extends ConnectionHandler {

	constructor(connection, player, number) {
		super(connection);
		this.player = player;
		num = parseInt(number);
	}

	enter() {
		const p = this.player;
		tempRoom = p.room;
		this.connection.sendMessage(this.getMsg(enemyTpDb.findById(num)));
		if (isNaN(tempRoom)) tempRoom.removePlayer(p);
	}

	handle(data) {
		const p = this.player;
		const removeWord = Util.removeWord;
		let enemy = enemyTpDb.findById(num);
		
		//Quit
		if (data.toLowerCase() === "quit" || data.toLowerCase() === "q") {
			DB.saveDatabases();
			p.room = tempRoom;
			this.connection.removeHandler();
			return;
		}
		
		const n = parseInt(data);
		const text = removeWord(data, 0);
		const text2 = removeWord(text, 0);
		
		//Edit Name
		if (n == 1) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 1 New Enemy Name</red></bold>");
			}
			else {
				enemy.name = text;
				this.connection.sendMessage("<bold><green>Enemy name updated!</green></bold>");
			}
		}
		//Edit Description
		if (n == 2) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 2 New Enemy Description</red></bold>");
			}
			else {
				enemy.description = text;
				this.connection.sendMessage("<bold><green>Enemy description updated!</green></bold>");
			}
		}
		//Edit Hit Points
		if (n == 3) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 2 New Hit Points</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 2 New Hit Points</red></bold>");
				}
				else {
					enemy.hitPoints = text;
					this.connection.sendMessage("<bold><green>Hit points updated!</green></bold>");
				}
			}
		}
		//Edit Accuracy
		if (n == 4) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 3 New Accuracy</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 3 New Accuracy</red></bold>");
				}
				else {
					enemy.accuracy = text;
					this.connection.sendMessage("<bold><green>Accuracy updated!</green></bold>");
				}
			}
		}
		//Edit Dodging
		if (n == 5) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 4 New Dodging</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 4 New Dodging</red></bold>");
				}
				else {
					enemy.dodging = text;
					this.connection.sendMessage("<bold><green>Dodging updated!</green></bold>");
				}
			}
		}
		//Edit Strike Damage
		if (n == 6) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 5 New Strike Damage</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 5 New Strike Damage</red></bold>");
				}
				else {
					enemy.strikeDamage = text;
					this.connection.sendMessage("<bold><green>Strike Damage updated!</green></bold>");
				}
			}
		}
		//Edit Damage Absorb
		if (n == 7) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 6 New Damage Absorb</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 6 New Damage Absorb</red></bold>");
				}
				else {
					enemy.damageAbsorb = text;
					this.connection.sendMessage("<bold><green>Damage Absorb updated!</green></bold>");
				}
			}
		}
		//Edit Experience
		if (n == 8) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 7 New Experience</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 7 New Experience</red></bold>");
				}
				else {
					enemy.experience = text;
					this.connection.sendMessage("<bold><green>Experience updated!</green></bold>");
				}
			}
		}
		//Edit Weapon
		if (n == 9) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 8 New Weapon ID</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 8 New Weapon ID</red></bold>");
				}
				else if (parseInt(text) == 0) {
					enemy.weapon = text;
					this.connection.sendMessage("<bold><green>Weapon updated!</green></bold>");
				}
				else {
					var weap = itemDb.findById(parseInt(text));
					if (!weap) {
						this.connection.sendMessage("<bold><red>Not a valid item ID</red></bold>");
					}
					else if (weap.type != ItemType.WEAPON) {
						this.connection.sendMessage("<bold><red>" + weap.name + " is not a weapon type item</red></bold>");
					}
					else {
						enemy.weapon = text;
						this.connection.sendMessage("<bold><green>Weapon updated!</green></bold>");
					}
				}
			}
		}
		//Edit Money Min
		if (n == 10) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 9 New Money Min</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 9 New Money Min</red></bold>");
				}
				else {
					enemy.moneyMin = text;
					this.connection.sendMessage("<bold><green>Money Min updated!</green></bold>");
				}
			}
		}
		//Edit Money Max
		if (n == 11) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 10 New Money Max</red></bold>");
			}
			else {
				if (isNaN(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Usage: 10 New Money Max</red></bold>");
				}
				else {
					enemy.moneyMax = text;
					this.connection.sendMessage("<bold><green>Money Max updated!</green></bold>");
				}
			}
		}
		//Edit Loot
		if (n >= 12 && n <= 17) {
			if (n == 17) {
				if (enemy.loot.length == 0) {
					this.connection.sendMessage("<bold><red>No loot to delete.</red></bold>");
				}
				else {
					enemy.loot.length = enemy.loot.length-1;
					this.connection.sendMessage("<bold><green>Loot deleted.</green></bold>");
				}
			}
			else if (!text || text == ""|| !text2 || text2 == "") {
				this.connection.sendMessage("<bold><red>Type the option number, followed by the Item ID and drop chance.</red></bold>");
			}
			else {
				if (isNaN(parseInt(text)) || isNaN(parseInt(text2))) {
					this.connection.sendMessage("<bold><red>Type the option number, followed by the Item ID and drop chance.</red></bold>");
				}
				else if (enemy.loot.length >= 5) {
					this.connection.sendMessage("<bold><red>Max loot items is 5 at this time. Delete one first.</red></bold>");
				}
				else if (text2 < 1 || text2 > 100) {
					this.connection.sendMessage("<bold><red>Chance must be between 1 and 100.</red></bold>");
				}
				else if (!itemDb.findById(parseInt(text))) {
					this.connection.sendMessage("<bold><red>No such item exists.</red></bold>");
				}
				else {
					var newItem = {itemId: parseInt(text), chance: parseInt(text2)};
					enemy.loot.push(newItem);
					this.connection.sendMessage("<bold><green>Loot item added!</green></bold>");
				}
			}
		}
		//Edit Enemy Flags
		if (n == 18) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 18 Enemy Flag to Toggle</red></bold>");
			}
			else if (text.trim() == "?") {
				var msg = "<yellow><bold>Current enemy flags:";
				var flags = EnemyFlags;
				flags.sort();
				flags.forEach(flag => {
					msg = msg + "\r\n" + flag;
				});
				this.connection.sendMessage(msg);
			}
			else if (text.trim().toUpperCase() == "CLEAR") {
				enemy.flags = [];
				this.connection.sendMessage("<bold><green>Enemy flags cleared!</green></bold>");
			}
			else {
				if (EnemyFlags.indexOf(text.toUpperCase()) == -1) {
					this.connection.sendMessage("<bold><red>Enemy flag not found! (Use 18 ? for list of existing flags)</red></bold>");
				}
				else {
					if (enemy.flags.indexOf(text.toUpperCase()) == -1) {
						enemy.flags.push(text.toUpperCase());
						enemy.flags.sort();
						this.connection.sendMessage("<bold><green>Enemy flag added!</green></bold>");
					}
					else {
						enemy.flags.splice(enemy.flags.indexOf(text.toUpperCase()), 1);
						enemy.flags.sort();
						this.connection.sendMessage("<bold><green>Enemy flag removed!</green></bold>");
					}
				}
			}
		}
		//Reprint menu
		if (data.toLowerCase() === "") {
			this.connection.sendMessage(this.getMsg(enemy));
		}
	}
	
	getMsg(enemy) {
		var weapName = "None";
		var itemId = "";
		var chance = "";
		var loot = enemy.loot;
		
		if (enemy.weapon != 0) {
			weapName = itemDb.findById(parseInt(enemy.weapon)).name
		}
		
		var msg = "<bold><white>You are editing enemy: <yellow>" + enemy.name + " [ID: " + enemy.id + "]</yellow>\r\n" + 
		"\r\n" + 
		"<white>1 ) Name    : <magenta>" + enemy.name + "</magenta>\r\n" + 
		"<white>2 ) Desc    : \r\n" +
		"--------------------------------------------------------------------------------\r\n" + 
		"<magenta>" + enemy.description + "</magenta><white>\r\n" +
		"--------------------------------------------------------------------------------\r\n" +
		"<white>3 ) Hit Pnts: <magenta>" + enemy.hitPoints + "</magenta>\r\n" +
		"<white>4 ) Accuracy: <magenta>" + enemy.accuracy + "</magenta>\r\n" +
		"<white>5 ) Dodging : <magenta>" + enemy.dodging + "</magenta>\r\n" +
		"<white>6 ) StrikDmg: <magenta>" + enemy.strikeDamage + "</magenta>\r\n" +
		"<white>7 ) DmgAbsrb: <magenta>" + enemy.damageAbsorb + "</magenta>\r\n" +
		"<white>8 ) Exprince: <magenta>" + enemy.experience + "</magenta>\r\n" +
		"<white>9 ) Weapon  : <magenta>" + enemy.weapon + " <cyan>(" + weapName + ")</cyan>\r\n" +
		"<white>10) MoneyMin: <magenta>" + enemy.moneyMin + "</magenta>\r\n" +
		"<white>11) MoneyMax: <magenta>" + enemy.moneyMax + "</magenta>\r\n" +
		"<white>--------------------------------------------------------------------------------\r\n";
		if (loot.length >= 1) {
			itemId = parseInt(loot[0].itemId);
			chance = parseInt(loot[0].chance);
			weapName = itemDb.findById(parseInt(itemId)).name;
			msg = msg + "<white>12) Loot 1  : <magenta>" + itemId + " <cyan>(" + weapName + ")</cyan>\r\n";
			msg = msg + "<white>    Chance  : <magenta>" + chance + "%</magenta>\r\n";
		}
		else {
			msg = msg + "<white>12) Add Loot: <cyan>(Syntax: 12 Item-ID Chance)</cyan>\r\n";
		}
		if (loot.length >= 2) {
			itemId = parseInt(loot[1].itemId);
			chance = parseInt(loot[1].chance);
			weapName = itemDb.findById(parseInt(itemId)).name;
			msg = msg + "<white>13) Loot 2  : <magenta>" + itemId + " <cyan>(" + weapName + ")</cyan>\r\n";
			msg = msg + "<white>    Chance  : <magenta>" + chance + "%</magenta>\r\n";
		}
		else {
			msg = msg + "<white>13) Add Loot: <cyan>(Syntax: 13 Item-ID Chance)</cyan>\r\n";
		}
		if (loot.length >= 3) {
			itemId = parseInt(loot[2].itemId);
			chance = parseInt(loot[2].chance);
			weapName = itemDb.findById(parseInt(itemId)).name;
			msg = msg + "<white>14) Loot 3  : <magenta>" + itemId + " <cyan>(" + weapName + ")</cyan>\r\n";
			msg = msg + "<white>    Chance  : <magenta>" + chance + "%</magenta>\r\n";
		}
		else {
			msg = msg + "<white>14) Add Loot: <cyan>(Syntax: 14 Item-ID Chance)</cyan>\r\n";
		}
		if (loot.length >= 4) {
			itemId = parseInt(loot[3].itemId);
			chance = parseInt(loot[3].chance);
			weapName = itemDb.findById(parseInt(itemId)).name;
			msg = msg + "<white>15) Loot 4  : <magenta>" + itemId + " <cyan>(" + weapName + ")</cyan>\r\n";
			msg = msg + "<white>    Chance  : <magenta>" + chance + "%</magenta>\r\n";
		}
		else {
			msg = msg + "<white>15) Add Loot: <cyan>(Syntax: 15 Item-ID Chance)</cyan>\r\n";
		}
		if (loot.length >= 5) {
			itemId = parseInt(loot[4].itemId);
			chance = parseInt(loot[4].chance);
			weapName = itemDb.findById(parseInt(itemId)).name;
			msg = msg + "<white>16) Loot 5  : <magenta>" + itemId + " <cyan>(" + weapName + ")</cyan>\r\n";
			msg = msg + "<white>    Chance  : <magenta>" + chance + "%</magenta>\r\n";
		}
		else {
			msg = msg + "<white>16) Add Loot: <cyan>(Syntax: 16 Item-ID Chance)</cyan>\r\n";
		}
		msg = msg + "<white>17) Del Loot: <cyan>(Bottom loot item will be deleted)</cyan>\r\n";
		msg = msg + "--------------------------------------------------------------------------------\r\n" + 
			"<white>18) Flags   : <magenta>" + enemy.flags + " <cyan>(Use '18 ?' for a list of all flags, or 'clear')</cyan>\r\n" +
		"\r\n" + 
		"<white>Type a number to edit value, or (q)uit to leave and save changes: \r\n</bold>";
		
		return msg;
	}

	hungup() {
		const p = this.player;
		playerDb.logout(p.id);
	}

}

module.exports = Eedit;
