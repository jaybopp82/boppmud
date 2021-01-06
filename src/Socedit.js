'use strict';

const Util = require('./Util');
const { helpDb } = require('./Databases');
const ConnectionHandler = require('./ConnectionHandler');
const DB = require('./Databases');
const { PlayerRank } = require('./Attributes');

const { cc } = require('./Telnet');

let tempRoom; // keeps track of the room player was in before editing
let socials; // keeps track of the item being edited

//Game Handler class
class Socedit extends ConnectionHandler {

	constructor(connection, player, soc) {
		super(connection);
		this.player = player;
		socials = soc;
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
		var social = socials;
		
		//Quit
		if (data.toLowerCase() === "quit" || data.toLowerCase() === "q") {
			DB.saveDatabases();
			p.room = tempRoom;
			this.connection.removeHandler();
			return;
		}
		
		const n = parseInt(data);
		const text = removeWord(data, 0).trim();
		
		//Edit Name
		if (n == 1) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 1 New Name</red></bold>");
			}
			else {
				social.name = text;
				this.connection.sendMessage("<bold><green>Name updated!</green></bold>");
			}
		}
		//Edit Room Msg
		if (n == 2) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 2 Room Message</red></bold>");
			}
			else {
				social.roomMsg = text;
				this.connection.sendMessage("<bold><green>Room message updated!</green></bold>");
			}
		}
		//Reprint menu
		if (data.toLowerCase() === "") {
			this.connection.sendMessage(this.getMsg());
		}
	}
	
	getMsg() {
		
		var social = socials;
		
		var msg = "<bold><white>You are editing social: <yellow>" + social.name + " [ID: " + social.id + "]</yellow>\r\n" + 
		"\r\n" + 
		"<white>1) Name    : <magenta>" + social.name + "</magenta>\r\n" + 
		"<white>2) Room Msg: <magenta>" + social.roomMsg + "</magenta>\r\n" + 
		"\r\n" + 
		"<white>Type a number to edit value, or (q)uit to leave and save changes: \r\n</bold>";
		
		return msg;
	}

	hungup() {
		const p = this.player;
		playerDb.logout(p.id);
	}

}

module.exports = Socedit;