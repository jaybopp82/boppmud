'use strict';

const Util = require('./Util');
const { playerDb, roomDb, enemyDb, enemyTpDb, areaDb, itemDb, storeDb } = require('./Databases');
const ConnectionHandler = require('./ConnectionHandler');
const Player = require('./Player');
const DB = require('./Databases');
const { RoomType, Direction, RoomFlags } = require('./Attributes');

const { cc } = require('./Telnet');

let tempRoom; // keeps track of the room player was in before editing

//Game Handler class
class Redit extends ConnectionHandler {

	constructor(connection, player) {
		super(connection);
		this.player = player;
	}

	enter() {
		const p = this.player;
		tempRoom = p.room;
		this.connection.sendMessage(this.getMsg(tempRoom));
		if (isNaN(tempRoom)) tempRoom.removePlayer(p);
	}

	handle(data) {
		const p = this.player;
		const removeWord = Util.removeWord;
		let room = p.room;
		
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
				this.connection.sendMessage("<bold><red>Usage: 1 New Room Title</red></bold>");
			}
			else {
				room.name = text;
				this.connection.sendMessage("<bold><green>Room name updated!</green></bold>");
			}
		}
		//Edit Description
		if (n == 2) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 2 New Room Description</red></bold>");
			}
			else {
				room.description = text;
				this.connection.sendMessage("<bold><green>Room description updated!</green></bold>");
			}
		}
		//Edit Room Type
		if (n == 3) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 3 New Room Type</red></bold>");
			}
			else if (text.trim() == "?") {
				var msg = "<yellow><bold>Current room types:";
				RoomType.enums.forEach(type => {
					msg = msg + "\r\n(" + type + ") - " + type.key;
				});
				this.connection.sendMessage(msg);
			}
			else {
				if (RoomType.get(parseInt(text))) {
					room.type = RoomType.get(parseInt(text));
					this.connection.sendMessage("<bold><green>Room type updated!</green></bold>");
				}
				else {
					this.connection.sendMessage("<bold><red>Type '3 ?' for a list of room types</red></bold>");
				}
			}
		}
		//Edit North
		if (n == 4) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 4 North Exit Room ID</red></bold>");
			}
			else if (parseInt(text) == 0) {
				room.rooms[Direction.NORTH] = 0;
				this.connection.sendMessage("<bold><green>North exit deleted!</green></bold>");
			}
			else {
				if (roomDb.findById(parseInt(text))) {
					room.rooms[Direction.NORTH] = parseInt(text);
					this.connection.sendMessage("<bold><green>North exit updated!</green></bold>");
				}
				else {
					this.connection.sendMessage("<bold><red>Invalid Room ID</red></bold>");
				}
			}
		}
		//Edit East
		if (n == 5) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 5 East Exit Room ID</red></bold>");
			}
			else if (parseInt(text) == 0) {
				room.rooms[Direction.EAST] = 0;
				this.connection.sendMessage("<bold><green>East exit deleted!</green></bold>");
			}
			else {
				if (roomDb.findById(parseInt(text))) {
					room.rooms[Direction.EAST] = parseInt(text);
					this.connection.sendMessage("<bold><green>East exit updated!</green></bold>");
				}
				else {
					this.connection.sendMessage("<bold><red>Invalid Room ID</red></bold>");
				}
			}
		}
		//Edit South
		if (n == 6) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 6 South Exit Room ID</red></bold>");
			}
			else if (parseInt(text) == 0) {
				room.rooms[Direction.SOUTH] = 0;
				this.connection.sendMessage("<bold><green>South exit deleted!</green></bold>");
			}
			else {
				if (roomDb.findById(parseInt(text))) {
					room.rooms[Direction.SOUTH] = parseInt(text);
					this.connection.sendMessage("<bold><green>South exit updated!</green></bold>");
				}
				else {
					this.connection.sendMessage("<bold><red>Invalid Room ID</red></bold>");
				}
			}
		}
		//Edit West
		if (n == 7) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 7 West Exit Room ID</red></bold>");
			}
			else if (parseInt(text) == 0) {
				room.rooms[Direction.WEST] = 0;
				this.connection.sendMessage("<bold><green>West exit deleted!</green></bold>");
			}
			else {
				if (roomDb.findById(parseInt(text))) {
					room.rooms[Direction.WEST] = parseInt(text);
					this.connection.sendMessage("<bold><green>West exit updated!</green></bold>");
				}
				else {
					this.connection.sendMessage("<bold><red>Invalid Room ID</red></bold>");
				}
			}
		}
		//Edit Up
		if (n == 8) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 8 Up Exit Room ID</red></bold>");
			}
			else if (parseInt(text) == 0) {
				room.rooms[Direction.UP] = 0;
				this.connection.sendMessage("<bold><green>Up exit deleted!</green></bold>");
			}
			else {
				if (roomDb.findById(parseInt(text))) {
					room.rooms[Direction.UP] = parseInt(text);
					this.connection.sendMessage("<bold><green>Up exit updated!</green></bold>");
				}
				else {
					this.connection.sendMessage("<bold><red>Invalid Room ID</red></bold>");
				}
			}
		}
		//Edit Down
		if (n == 9) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 9 Down Exit Room ID</red></bold>");
			}
			else if (parseInt(text) == 0) {
				room.rooms[Direction.DOWN] = 0;
				this.connection.sendMessage("<bold><green>Down exit deleted!</green></bold>");
			}
			else {
				if (roomDb.findById(parseInt(text))) {
					room.rooms[Direction.DOWN] = parseInt(text);
					this.connection.sendMessage("<bold><green>Down exit updated!</green></bold>");
				}
				else {
					this.connection.sendMessage("<bold><red>Invalid Room ID</red></bold>");
				}
			}
		}
		//Edit Enemy
		if (n == 10) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 10 New Enemy ID</red></bold>");
			}
			else if (parseInt(text) == 0) {
				room.spawnWhich = 0;
				room.maxEnemies = 0;
				this.connection.sendMessage("<bold><green>Enemy deleted!</green></bold>");
			}
			else {
				if (enemyDb.findById(parseInt(text))) {
					room.spawnWhich = parseInt(text);
					if (room.maxEnemies == 0) {
						room.maxEnemies = 1;
					}
					this.connection.sendMessage("<bold><green>Enemy updated!</green></bold>");
				}
				else {
					this.connection.sendMessage("<bold><red>Invalid Enemy ID</red></bold>");
				}
			}
		}
		//Edit Max Enemy
		if (n == 11) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 11 New Number of Enemies</red></bold>");
			}
			else if (isNaN(text)) {
				this.connection.sendMessage("<bold><red>Usage: 11 New Number of Enemies</red></bold>");
			}
			else if (parseInt(text) > 8) {
				this.connection.sendMessage("<bold><red>Maximum number of enemies is 8</red></bold>");
			}
			else {
				room.maxEnemies = parseInt(text);
				this.connection.sendMessage("<bold><green>Number of enemies updated!</green></bold>");
				if (parseInt(text) == 0) {
					room.spawnWhich = 0;
				}
			}
		}
		//Edit Room Flags
		if (n == 12) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 12 Room Flag to Toggle</red></bold>");
			}
			else if (text.trim() == "?") {
				var msg = "<yellow><bold>Current room flags:";
				var flags = RoomFlags;
				flags.sort();
				flags.forEach(flag => {
					msg = msg + "\r\n" + flag;
				});
				this.connection.sendMessage(msg);
			}
			else if (text.trim().toUpperCase() == "CLEAR") {
				room.flags = [];
				this.connection.sendMessage("<bold><green>Room flags cleared!</green></bold>");
			}
			else {
				if (RoomFlags.indexOf(text.toUpperCase()) == -1) {
					this.connection.sendMessage("<bold><red>Room flag not found! (Use 12 ? for list of existing flags)</red></bold>");
				}
				else {
					if (room.flags.indexOf(text.toUpperCase()) == -1) {
						room.flags.push(text.toUpperCase());
						room.flags.sort();
						this.connection.sendMessage("<bold><green>Room flag added!</green></bold>");
					}
					else {
						room.flags.splice(room.flags.indexOf(text.toUpperCase()), 1);
						room.flags.sort();
						this.connection.sendMessage("<bold><green>Room flag removed!</green></bold>");
					}
				}
			}
		}
		//Edit Area
		if (n == 13) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 13 New Area Number</red></bold>");
			}
			else if (text.trim() == "?") {
				var msg = "<yellow><bold>Current areas:";
				for (let area of areaDb.map.values()) {
					msg = msg + "\r\n" + area.id + " (" + area.name + ")";
				}
				this.connection.sendMessage(msg);
			}
			else if (isNaN(text)) {
				this.connection.sendMessage("<bold><red>Usage: 13 New Area Number</red></bold>");
			}
			else {
				if (!areaDb.findById(parseInt(text))) {
					this.connection.sendMessage("<bold><red>Area not found! (Use 13 ? for list of existing areas)</red></bold>");
				}
				else {
					room.area = parseInt(text);
					this.connection.sendMessage("<bold><green>Room area updated!</green></bold>");
				}
			}
		}
		//Edit Item
		if (n == 14) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 14 New Item ID</red></bold>");
			}
			else if (parseInt(text) == 0) {
				room.spawnItem = 0;
				this.connection.sendMessage("<bold><green>Item deleted!</green></bold>");
			}
			else {
				if (itemDb.findById(parseInt(text))) {
					room.spawnItem = parseInt(text);
					this.connection.sendMessage("<bold><green>Item updated!</green></bold>");
				}
				else {
					this.connection.sendMessage("<bold><red>Invalid Item ID</red></bold>");
				}
			}
		}
		//Edit Store
		if (n == 15) {
			if (!text || text == "") {
				this.connection.sendMessage("<bold><red>Usage: 15 New Store ID</red></bold>");
			}
			else if (text.trim() == "?") {
				var msg = "<yellow><bold>Current stores:";
				for (let store of storeDb.map.values()) {
					msg = msg + "\r\n(" + store.id + ") - " + store.name;
				}
				this.connection.sendMessage(msg);
			}
			else {
				if (storeDb.findById(parseInt(text)) || parseInt(text) == 0) {
					room.data = parseInt(text);
					this.connection.sendMessage("<bold><green>Room store ID updated!</green></bold>");
				}
				else {
					this.connection.sendMessage("<bold><red>Type '15 ?' for a list of stores</red></bold>");
				}
			}
		}
		//Reprint menu
		if (data.toLowerCase() === "") {
			this.connection.sendMessage(this.getMsg(room));
		}
	}
	
	getMsg(tempRoom) {
		var north = "", south = "", east = "", west = "", up = "", down = "", enemy = "", item = "", storeName = "";
		
		if (parseInt(tempRoom.rooms[Direction.NORTH]) != 0) {
			north = roomDb.findById(parseInt(tempRoom.rooms[Direction.NORTH])).name
		}
		else {
			north = "none";
		}
		if (parseInt(tempRoom.rooms[Direction.EAST]) != 0) {
			east = roomDb.findById(parseInt(tempRoom.rooms[Direction.EAST])).name
		}
		else {
			east = "none";
		}
		if (parseInt(tempRoom.rooms[Direction.SOUTH]) != 0) {
			south = roomDb.findById(parseInt(tempRoom.rooms[Direction.SOUTH])).name
		}
		else {
			south = "none";
		}
		if (parseInt(tempRoom.rooms[Direction.WEST]) != 0) {
			west = roomDb.findById(parseInt(tempRoom.rooms[Direction.WEST])).name
		}
		else {
			west = "none";
		}
		if (parseInt(tempRoom.rooms[Direction.UP]) != 0) {
			up = roomDb.findById(parseInt(tempRoom.rooms[Direction.UP])).name
		}
		else {
			up = "none";
		}
		if (parseInt(tempRoom.rooms[Direction.DOWN]) != 0) {
			down = roomDb.findById(parseInt(tempRoom.rooms[Direction.DOWN])).name
		}
		else {
			down = "none";
		}
		if (enemyTpDb.findById(parseInt(tempRoom.spawnWhich))) {
			enemy = enemyTpDb.findById(parseInt(tempRoom.spawnWhich)).name
		}
		else {
			enemy = "none";
		}
		if (itemDb.findById(parseInt(tempRoom.spawnItem))) {
			item = itemDb.findById(parseInt(tempRoom.spawnItem)).name
		}
		else {
			item = "none";
		}
		
		if (tempRoom.data != 0) {
			storeName = storeDb.findById(tempRoom.data).name;
		}
		else {
			storeName = "none";
		}
		
		var areaName = areaDb.findById(parseInt(tempRoom.area)).name;
		
		var msg = "<bold><white>You are editing room: <yellow>" + tempRoom.name + " [ID: " + tempRoom.id + "]</yellow>\r\n" + 
		"\r\n" + 
		"<white>1 ) Name : <magenta>" + tempRoom.name + "</magenta>\r\n" + 
		"<white>2 ) Desc : \r\n" +
		"--------------------------------------------------------------------------------\r\n" + 
		"<magenta>" + tempRoom.description + "</magenta><white>\r\n" +
		"--------------------------------------------------------------------------------\r\n" + 
		"<white>3 ) Type : <magenta>" + tempRoom.type.key + " <cyan>(Use '3 ?' for a list of room types)</cyan>\r\n" +  
		"<white>4 ) North: <magenta>" + tempRoom.rooms[Direction.NORTH] + " <cyan>(" + north + ")</cyan>\r\n" +
		"<white>5 ) East : <magenta>" + tempRoom.rooms[Direction.EAST] + " <cyan>(" + east + ")</cyan>\r\n" +
		"<white>6 ) South: <magenta>" + tempRoom.rooms[Direction.SOUTH] + " <cyan>(" + south + ")</cyan>\r\n" +
		"<white>7 ) West : <magenta>" + tempRoom.rooms[Direction.WEST] + " <cyan>(" + west + ")</cyan>\r\n" +
		"<white>8 ) Up   : <magenta>" + tempRoom.rooms[Direction.UP] + " <cyan>(" + up + ")</cyan>\r\n" +
		"<white>9 ) Down : <magenta>" + tempRoom.rooms[Direction.DOWN] + " <cyan>(" + down + ")</cyan>\r\n" +
		"<white>10) Enemy: <magenta>" + tempRoom.spawnWhich + " <cyan>(" + enemy + ")</cyan>\r\n" + 
		"<white>11) MaxEn: <magenta>" + tempRoom.maxEnemies + "</magenta>\r\n" + 
		"<white>12) Flags: <magenta>" + tempRoom.flags + " <cyan>(Use '12 ?' for a list of all flags, or 'clear')</cyan>\r\n" +
		"<white>13) Area : <magenta>" + tempRoom.area + " (" + areaName + ") <cyan>(Use '13 ?' for a list of areas)</cyan>\r\n" +
		"<white>14) Item : <magenta>" + tempRoom.spawnItem + " <cyan>(" + item + ")</cyan>\r\n" +
		"<white>15) Store: <magenta>" + tempRoom.data + " (" + storeName + ") <cyan>(Use '15 ?' to list stores)</cyan>\r\n" +
		"\r\n" + 
		"<white>Type a number to edit value, or (q)uit to leave and save changes: \r\n</bold>";
		
		return msg;
	}

	hungup() {
		const p = this.player;
		playerDb.logout(p.id);
	}

}

module.exports = Redit;
