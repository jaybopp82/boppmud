'use strict';

const Util = require('./Util');
const { helpDb } = require('./Databases');
const ConnectionHandler = require('./ConnectionHandler');
const DB = require('./Databases');
const { PlayerRank } = require('./Attributes');

const { cc } = require('./Telnet');

let tempRoom; // keeps track of the room player was in before editing
let helpfile; // keeps track of the item being edited

//Game Handler class
class Hedit extends ConnectionHandler {

	constructor(connection, player, help) {
		super(connection);
		this.player = player;
		helpfile = help;
	}

	enter() {
		const p = this.player;
		tempRoom = p.room;
		this.connection.sendMessage(this.getMsg());
		if (isNaN(tempRoom)) tempRoom.removePlayer(p);
	}

	handle(data) {
		const p = this.player;
		const removeWord = Util.removeWord;
		var help = helpfile;
		
		//Quit
		if (data.toLowerCase() === "quit" || data.toLowerCase() === "q") {
			DB.saveDatabases();
			p.room = tempRoom;
			this.connection.removeHandler();
			return;
		}
		
		const n = parseInt(data);
		const text = removeWord(data, 0).trim();
		
		//Edit Keywords
		if (n == 1) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 1 New Keywords</red></bold>");
			}
			else {
				help.keywords = text;
				this.connection.sendMessage("<bold><green>Keywords updated!</green></bold>");
			}
		}
		//Edit Description
		if (n == 2) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 2 Help Text</red></bold>");
			}
			else {
				help.description = text;
				this.connection.sendMessage("<bold><green>Help text updated!</green></bold>");
			}
		}
		//Edit Min Rank
		if (n == 3) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 3 New Min Rank</red></bold>");
			}
			else if (text.trim() == "?") {
				var msg = "<yellow><bold>Current Ranks:";
				PlayerRank.enums.forEach(type => {
					msg = msg + "\r\n(" + type + ") - " + type.key;
				});
				this.connection.sendMessage(msg);
			}
			else if (isNaN(text)) {
				this.connection.sendMessage("<bold><red>Usage: 3 New Min Rank NUMBER</red></bold>");
			}
			else {
				help.minRank = PlayerRank.get(parseInt(text));
				this.connection.sendMessage("<bold><green>Rank updated!</green></bold>");
			}
		}
		//Reprint menu
		if (data.toLowerCase() === "") {
			this.connection.sendMessage(this.getMsg());
		}
	}
	
	getMsg() {
		
		var help = helpfile;
		
		var msg = "<bold><white>You are editing help: <yellow>" + help.keywords + " [ID: " + help.id + "]</yellow>\r\n" + 
		"\r\n" + 
		"<white>1) Keys : <magenta>" + help.keywords + "</magenta>\r\n" + 
		"<white>2) Desc : \r\n" +
		"--------------------------------------------------------------------------------\r\n" + 
		"<magenta>" + help.description + "</magenta><white>\r\n" +
		"--------------------------------------------------------------------------------\r\n" + 
		"<white>3) Rank : <magenta>" + help.minRank.toString() + " <cyan>(Use '3 ?' for a list of ranks)</cyan>\r\n" +  
		"\r\n" + 
		"<white>Type a number to edit value, or (q)uit to leave and save changes: \r\n</bold>";
		
		return msg;
	}

	hungup() {
		const p = this.player;
		playerDb.logout(p.id);
	}

}

module.exports = Hedit;
