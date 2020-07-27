'use strict';

const Util = require('./Util');
const { areaDb } = require('./Databases');
const ConnectionHandler = require('./ConnectionHandler');
const DB = require('./Databases');
const { AreaFlags } = require('./Attributes');

const { cc } = require('./Telnet');

let tempRoom; // keeps track of the room player was in before editing
let num; // keeps track of the area being edited

//Game Handler class
class Aedit extends ConnectionHandler {

	constructor(connection, player, number) {
		super(connection);
		this.player = player;
		num = parseInt(number);
	}

	enter() {
		const p = this.player;
		tempRoom = p.room;
		this.connection.sendMessage(this.getMsg(areaDb.findById(parseInt(num))));
		if (isNaN(tempRoom)) tempRoom.removePlayer(p);
	}

	handle(data) {
		const p = this.player;
		const removeWord = Util.removeWord;
		let area = areaDb.findById(parseInt(num));
		
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
				this.connection.sendMessage("<bold><red>Usage: 1 New Area Name</red></bold>");
			}
			else {
				area.name = text;
				this.connection.sendMessage("<bold><green>Area name updated!</green></bold>");
			}
		}
		//Edit Min Level
		if (n == 2) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 2 New Recomended Min Level</red></bold>");
			}
			else if (isNaN(text)) {
				this.connection.sendMessage("<bold><red>Usage: 2 New Recomended Min Level</red></bold>");
			}
			else {
				area.minLevel = parseInt(text);
				this.connection.sendMessage("<bold><green>Recomended Min Level updated!</green></bold>");
			}
		}
		//Edit Min Level
		if (n == 3) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 3 New Recomended Max Level</red></bold>");
			}
			else if (isNaN(text)) {
				this.connection.sendMessage("<bold><red>Usage: 3 New Recomended Min Level</red></bold>");
			}
			else {
				area.maxLevel = parseInt(text);
				this.connection.sendMessage("<bold><green>Recomended Max Level updated!</green></bold>");
			}
		}
		//Edit Area Flags
		if (n == 4) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 4 Area Flag to Toggle</red></bold>");
			}
			else if (text.trim() == "?") {
				var msg = "<yellow><bold>Current area flags:";
				var flags = AreaFlags;
				flags.sort();
				flags.forEach(flag => {
					msg = msg + "\r\n" + flag;
				});
				this.connection.sendMessage(msg);
			}
			else if (text.trim().toUpperCase() == "CLEAR") {
				area.flags = [];
				this.connection.sendMessage("<bold><green>Area flags cleared!</green></bold>");
			}
			else {
				if (AreaFlags.indexOf(text.toUpperCase()) == -1) {
					this.connection.sendMessage("<bold><red>Area flag not found! (Use 4 ? for list of existing flags)</red></bold>");
				}
				else {
					if (area.flags.indexOf(text.toUpperCase()) == -1) {
						area.flags.push(text.toUpperCase());
						area.flags.sort();
						this.connection.sendMessage("<bold><green>Area flag added!</green></bold>");
					}
					else {
						area.flags.splice(area.flags.indexOf(text.toUpperCase()), 1);
						area.flags.sort();
						this.connection.sendMessage("<bold><green>Area flag removed!</green></bold>");
					}
				}
			}
		}
		//Edit Level Lock
		if (n == 5) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 5 New Level Lock Value</red></bold>");
			}
			else if (isNaN(text)) {
				this.connection.sendMessage("<bold><red>Usage: 5 New Level Lock Value</red></bold>");
			}
			else {
				area.levelLock = parseInt(text);
				this.connection.sendMessage("<bold><green>Level Lock updated!</green></bold>");
			}
		}
		//Reprint menu
		if (data.toLowerCase() === "") {
			this.connection.sendMessage(this.getMsg(area));
		}
	}
	
	getMsg(area) {
		
		var msg = "<bold><white>You are editing area: <yellow>" + area.name + " [ID: " + area.id + "]</yellow>\r\n" + 
		"\r\n" + 
		"<white>1) Name   : <magenta>" + area.name + "</magenta>\r\n" + 
		"<white>2) MinLvl : <magenta>" + area.minLevel + " </magenta>\r\n" +  
		"<white>3) MaxLvl : <magenta>" + area.maxLevel + " </magenta>\r\n" +
		"<white>4) Flags  : <magenta>" + area.flags + " <cyan>(Use '4 ?' for a list of all flags, or 'clear')</cyan>\r\n" +
		"<white>5) LvlLock: <magenta>" + area.levelLock + " </magenta>\r\n" +
		"\r\n" + 
		"<white>Type a number to edit value, or (q)uit to leave and save changes: \r\n</bold>";
		
		return msg;
	}

	hungup() {
		const p = this.player;
		playerDb.logout(p.id);
	}

}

module.exports = Aedit;
