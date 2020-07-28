'use strict';

const Util = require('./Util');
const { itemDb, storeDb } = require('./Databases');
const ConnectionHandler = require('./ConnectionHandler');
const Player = require('./Player');
const DB = require('./Databases');

const { cc } = require('./Telnet');

let tempRoom; // keeps track of the room player was in before editing
let num; // keeps track of the store being edited

//Game Handler class
class Sedit extends ConnectionHandler {

	constructor(connection, player, number) {
		super(connection);
		this.player = player;
		num = parseInt(number);
	}

	enter() {
		const p = this.player;
		tempRoom = p.room;
		this.connection.sendMessage(this.getMsg(storeDb.findById(num)));
		if (isNaN(tempRoom)) tempRoom.removePlayer(p);
	}

	handle(data) {
		const p = this.player;
		const removeWord = Util.removeWord;
		let store = storeDb.findById(num);
		
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
				this.connection.sendMessage("<bold><red>Usage: 1 New Store Name</red></bold>");
			}
			else {
				store.name = text;
				this.connection.sendMessage("<bold><green>Store name updated!</green></bold>");
			}
		}
		//Delete Item
		if (n == 2) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 2 Item ID to Delete</red></bold>");
			}
			else if (isNaN(text)) {
				this.connection.sendMessage("<bold><red>Usage: 2 Item ID to Delete</red></bold>");
			}
			else {
				var item = itemDb.findById(parseInt(text));
				const index = store.items.indexOf(item);
				if (index > -1) {
					store.items.splice(index, 1);
					this.connection.sendMessage("<bold><green>Item removed from shop!</green></bold>");
				}
				else {
					this.connection.sendMessage("<bold><red>Item is not currently being sold!</red></bold>");
				}
			}
		}
		//Add Item
		if (n == 3) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 3 Item ID to Add</red></bold>");
			}
			else if (isNaN(text)) {
				this.connection.sendMessage("<bold><red>Usage: 3 Item ID to Add</red></bold>");
			}
			else {
				var item = itemDb.findById(parseInt(text));
				if (!item) {
					this.connection.sendMessage("<bold><red>No such item ID exists!</red></bold>");
					return;
				}
				const index = store.items.indexOf(item);
				if (index > -1) {
					this.connection.sendMessage("<bold><red>This item is already being sold!</red></bold>");
				}
				else {
					store.items.push(item);
					this.connection.sendMessage("<bold><green>Item added to shop!</green></bold>");
				}
			}
		}
		//Sort Items
		if (n == 4) {
			store.items = store.items.sort(function(a, b) {
				  return a.id - b.id;
			});
			this.connection.sendMessage("<bold><green>Items sorted by ID!</green></bold>");
		}
		//Reprint menu
		if (data.toLowerCase() === "") {
			this.connection.sendMessage(this.getMsg(store));
		}
	}
	
	getMsg(store) {
				
		var msg = "<bold><white>You are editing store: <yellow>" + store.name + " [ID: " + store.id + "]</yellow>\r\n" + 
		"\r\n" + 
		"<white>1) Name: <magenta>" + store.name + "</magenta>\r\n" + 
		"--------------------------------------------------------------------------------\r\n" +
		"<white>Current Items: </white>" ;
		store.items.forEach(item => {
			msg = msg + "\r\n<white>- <cyan>" + item.id + "<magenta> (" + item.name + ")</magenta>";
		});
		msg = msg + "\r\n" +
		"<white>2) Del Item: <cyan>Syntax: 2 [ID of item to remove]</cyan>\r\n" +
		"<white>3) Add Item: <cyan>Syntax: 3 [ID of item to add]</cyan>\r\n" +
		"<white>4) Sort Items By ID</white>\r\n" +
		"\r\n" + 
		"<white>Type a number to edit value, or (q)uit to leave and save changes: \r\n</bold>";
		
		return msg;
	}

	hungup() {
		const p = this.player;
		playerDb.logout(p.id);
	}

}

module.exports = Sedit;
