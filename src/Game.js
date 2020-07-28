'use strict';

const Util = require('./Util');
const { itemDb, playerDb, roomDb, storeDb, enemyTpDb, enemyDb, auctionDb, questDb, areaDb, helpDb } =
	require('./Databases');
const DB = require('./Databases');
const ConnectionHandler = require('./ConnectionHandler');
const { Attribute, PlayerRank, ItemType, Direction, RoomType, QuestPerks } =
	require('./Attributes');
const Player = require('./Player');
const Train = require('./Train');
const Redit = require('./Redit');
const Iedit = require('./Iedit');
const Eedit = require('./Eedit');
const Aedit = require('./Aedit');
const Hedit = require('./Hedit');
const { cc } = require('./Telnet');
const Room = require('./Room');
const Area = require('./Area');
const Help = require('./Help');
const { EnemyTemplate, Enemy } = require('./Enemy');
const Item = require('./Item');
const AuctionItem = require('./AuctionItem');
const path = require('path');
const jsonfile = require('jsonfile');
const enemyFileMap = path.join(__dirname, '..', 'data', 'enemies.json');

const tostring = Util.tostring;
const tostringChopped = Util.tostringChopped;
const random = Util.randomInt;

let isRunning = false;
let isAutoAttackOn = true;

const timer = Util.createTimer().init();

//Game Handler class
class Game extends ConnectionHandler {

	static isRunning() {
		return isRunning;
	}
	
	static isAutoAttackOn() {
		return isAutoAttackOn;
	}

	static getTimer() {
		return timer;
	}

	static setIsRunning(bool) {
		isRunning = bool;
	}

	constructor(connection, player) {
		super(connection);
		this.player = player;
	}

	enter() {
		this.lastCommand = "";

		const p = this.player;
		p.active = true;
		p.loggedIn = true;
		p.nextAttackTime = 0;
		// p.room is initially a room id when Player object
		// first initialized -- so converting to actual
		// room object here
		if (!isNaN(p.room)) p.room = roomDb.findById(p.room);
		p.room.addPlayer(p);

		Game.sendGame("<bold><green>" + p.name +
		" has entered the realm.</green></bold>");

		if (p.newbie) this.goToTrain();
		else p.sendString(Game.printRoom(p.room, p));
	}

	handle(data) {
		const parseWord = Util.parseWord;
		const removeWord = Util.removeWord;
		const p = this.player;

		// check if the player wants to repeat a command
		if (data === '/') data = this.lastcommand || 'look';
		else this.lastcommand = data; // if not, record the command.

		// get the first word and lowercase it.
		const firstWord = parseWord(data, 0).toLowerCase();

		// ------------------------------------------------------------------------
		//  REGULAR access commands
		// ------------------------------------------------------------------------

		if (firstWord === "chat" || firstWord === ':') {
			const text = removeWord(data, 0);
			Game.sendGame(
			`<white><bold>${p.name} chats: ${text}</bold></white>`);
			return;
		}

		if (firstWord === "experience" || firstWord === "exp") {
			p.sendString(this.printExperience());
			return;
		}

		if (firstWord === "inventory" || firstWord === "inv" || firstWord === "i") {
			p.sendString(this.printInventory());
			return;
		}

		if (firstWord === "quit") {
			p.room.removePlayer(p);
			this.connection.close();
			Game.logoutMessage(p.name + " has left the realm.");
			return;
		}

		if (firstWord === "remove") {
			this.removeItem(parseWord(data, 1));
			return;
		}

		if (firstWord === "stats" || firstWord === "st") {
			p.sendString(this.printStats());
			return;
		}

		if (firstWord === "time") {
			const msg = "<bold><cyan>" +
			"The current system time is: " +
			Util.timeStamp() + " on " +
			Util.dateStamp() + "\r\n" +
			"The system has been up for: " +
			Util.upTime() + "</cyan></bold>";
			p.sendString(msg);
			return;
		}

		if (firstWord === "use") {
			this.useItem(removeWord(data, 0));
			return;
		}

		if (firstWord === "whisper") {
			// get the players name
			const name = parseWord(data, 1);
			const message = removeWord(removeWord(data, 0), 0);
			this.whisper(message, name);
			return;
		}

		if (firstWord === "who") {
			p.sendString(Game.whoList(
					parseWord(data, 1).toLowerCase()));
			return;
		}

		if (firstWord === "look" || firstWord === "l") {
			const name = parseWord(data, 1);
			if (name) {
				p.sendString(Game.lookAt(p, name));
				return;
			}
			p.sendString(Game.printRoom(p.room, p));
			return;
		}

		if (firstWord === "north" || firstWord === "n") {
			this.move(Direction.NORTH, false);
			return;
		}

		if (firstWord === "east" || firstWord === "e") {
			this.move(Direction.EAST, false);
			return;
		}

		if (firstWord === "south" || firstWord === "s") {
			this.move(Direction.SOUTH, false);
			return;
		}

		if (firstWord === "west" || firstWord === "w") {
			this.move(Direction.WEST, false);
			return;
		}
		
		if (firstWord === "up" || firstWord === "u") {
			this.move(Direction.UP, false);
			return;
		}
		
		if (firstWord === "down" || firstWord === "d") {
			this.move(Direction.DOWN, false);
			return;
		}

		if (firstWord === "get" || firstWord === "take") {
			const arg = parseWord(data, 1);
			if (arg && arg == "all") {
				this.getAllItems(p, p.room);
				return;
			}
			this.getItem(removeWord(data, 0));
			return;
		}

		if (firstWord === "drop") {
			const arg = parseWord(data, 1);
			if (arg && arg == "all") {
				this.dropAllItems(p);
				return;
			}
			this.dropItem(removeWord(data, 0));
			return;
		}
		
		if (firstWord === "destroy") {
			this.destroyItem(removeWord(data, 0));
			return;
		}

		if (firstWord === "train") {
			if (p.room.type !== RoomType.TRAININGROOM) {
				p.sendString("<red><bold>You cannot train here!</bold></red>");
				return;
			}
			if (p.train()) {
				p.sendString("<green><bold>You are now level " +
						p.level + "</bold></green>");
			} else {
				p.sendString("<red><bold>You don't have enough " +
				"experience to train!</bold></red>");
			}
			return;
		}

		if (firstWord === "editstats") {
			if (p.room.type !== RoomType.TRAININGROOM) {
				p.sendString("<red><bold>You cannot edit your stats here!</bold></red>");
				return;
			}
			this.goToTrain();
			return;
		}

		if (firstWord === "list") {
			if (p.room.type !== RoomType.STORE) {
				p.sendString("<red><bold>You're not in a store!</bold></red>");
				return;
			}
			p.sendString(Game.storeList(p.room.data));
			return;
		}

		if (firstWord === "buy") {
			if (p.room.type !== RoomType.STORE) {
				p.sendString("<red><bold>You're not in a store!</bold></red>");
				return;
			}
			this.buy(removeWord(data, 0));
			return;
		}

		if (firstWord === "sell") {
			if (p.room.type !== RoomType.STORE) {
				p.sendString("<red><bold>You're not in a store!</bold></red>");
				return;
			}
			this.sell(removeWord(data, 0));
			return;
		}

		if (firstWord === "attack" || firstWord === "a") {
			if (Game.isAutoAttackOn()) {
				p.sendString("<red><bold>Auto-attack is currently turned on!</bold></red>");
				return;
			}
			this.playerAttack(removeWord(data, 0));
			return;
		}

		if (firstWord === "say") {
			const text = removeWord(data, 0);
			Game.sendRoom("<green><bold>" + p.name + " says: " + text + "</bold></green>", p.room);
			return;
		}

		if (firstWord === "ex" || firstWord === "exit" || firstWord === "exits") {
			var north = "", south = "", east = "", west = "", up = "", down = "", msg = "";

			if (parseInt(p.room.rooms[Direction.NORTH]) != 0) {
				north = roomDb.findById(parseInt(p.room.rooms[Direction.NORTH])).name
				if (p.rank >= PlayerRank.ADMIN) {
					north = north + " [" + roomDb.findById(parseInt(p.room.rooms[Direction.NORTH])).id + "]";
				}
			}
			else {
				north = "---";
			}
			if (parseInt(p.room.rooms[Direction.EAST]) != 0) {
				east = roomDb.findById(parseInt(p.room.rooms[Direction.EAST])).name
				if (p.rank >= PlayerRank.ADMIN) {
					east = east + " [" + roomDb.findById(parseInt(p.room.rooms[Direction.EAST])).id + "]";
				}
			}
			else {
				east = "---";
			}
			if (parseInt(p.room.rooms[Direction.SOUTH]) != 0) {
				south = roomDb.findById(parseInt(p.room.rooms[Direction.SOUTH])).name
				if (p.rank >= PlayerRank.ADMIN) {
					south = south + " [" + roomDb.findById(parseInt(p.room.rooms[Direction.SOUTH])).id + "]";
				}
			}
			else {
				south = "---";
			}
			if (parseInt(p.room.rooms[Direction.WEST]) != 0) {
				west = roomDb.findById(parseInt(p.room.rooms[Direction.WEST])).name
				if (p.rank >= PlayerRank.ADMIN) {
					west = west + " [" + roomDb.findById(parseInt(p.room.rooms[Direction.WEST])).id + "]";
				}
			}
			else {
				west = "---";
			}
			if (parseInt(p.room.rooms[Direction.UP]) != 0) {
				up = roomDb.findById(parseInt(p.room.rooms[Direction.UP])).name
				if (p.rank >= PlayerRank.ADMIN) {
					up = up + " [" + roomDb.findById(parseInt(p.room.rooms[Direction.UP])).id + "]";
				}
			}
			else {
				up = "---";
			}
			if (parseInt(p.room.rooms[Direction.DOWN]) != 0) {
				down = roomDb.findById(parseInt(p.room.rooms[Direction.DOWN])).name
				if (p.rank >= PlayerRank.ADMIN) {
					down = down + " [" + roomDb.findById(parseInt(p.room.rooms[Direction.DOWN])).id + "]";
				}
			}
			else {
				down = "---";
			}

			msg = "<bold><yellow>Current exits:</yellow>\r\n" + 
			"<white>North: <green>" + north + "</green>\r\n" + 
			"<white>East : <green>" + east + "</green>\r\n" +
			"<white>South: <green>" + south + "</green>\r\n" +
			"<white>West : <green>" + west + "</green>\r\n" +
			"<white>Up   : <green>" + up + "</green>\r\n" +
			"<white>Down : <green>" + down + "</green></bold>\r\n";

			p.sendString(msg);
			return;
		}

		if (firstWord == "map") {
			var msg = '';
			var oRoom = p.room  
			var Chunks = [];
			var lv1 = [];
			function num2dir(n){
				var dir;
				if(n==0)dir = Direction.NORTH;
				if(n==1)dir = Direction.EAST;
				if(n==2)dir = Direction.SOUTH;
				if(n==3)dir = Direction.WEST;
				return dir;
			}
			function wordWrap(str, width, spaceReplacer) {
				if (str.length>width) {
					var p=width
					for (;p>0 && str[p]!='';p--) {
					}
					if (p>0) {
						var left = str.substring(0, p);
						var right = str.substring(p+1);
						return left + spaceReplacer + wordWrap(right, width, spaceReplacer);
					}
				}
				return str;
			}
			var padEnd = (string, chars, filler)=>{
				if (isNaN(chars))return null;
				var str = string.substr(0, chars);
				filler = filler.substr(0, 1);
				if (str.length >= chars)return str;
				var a = str.split('');
				var left = chars-a.length;
				for (var i=0; i<left; i++){
					a.push(filler);
				};
				return a.join('');
			}
			for (var i=0;i<4; i++){
				var dir = num2dir(i);
				if (oRoom.rooms[dir]){
					lv1.push({dir: dir, room: roomDb.findById(oRoom.rooms[dir])});
				}else{lv1.push({dir: dir, room: false})}

			}  
			function makeChunk(room, x, y, current){
				var chunk = {x: x, y: y};
				var lines = [];
				function doIt(){
					var name = wordWrap(room.name, 9, '\n').split('\n');
					var color1, color2;
					if(!name[0]){name = ['', '', '']};
					if(!name[1]){name.push('');name.push('')};
					if(!name[2]){name.push('')};
					var roomSpace = " ";
					if (current){
						color1 = '<bold><cyan>';
						color2 = '</cyan></bold>';
						roomSpace = '<bold><cyan>@</cyan></bold>'
					}
					lines.push(`<black>.</black>${room.rooms[Direction.NORTH] ? '<black>.</black>#<black>.</black>' : '<black>...</black>'}<black>.</black>`)
					lines.push('<black>.</black>+-+<black>.</black>');

					var dW = '<black>.</black>';
					var dE = '<black>.</black>';
					if (room.rooms[Direction.WEST]!=0) {dW='#'};
					if (room.rooms[Direction.EAST]!=0) {dE='#'};
					lines.push(dW+'|'+roomSpace+'|'+dE);
					lines.push('<black>.</black>+-+<black>.</black>');
					lines.push(`<black>.</black>${room.rooms[Direction.SOUTH] ? '<black>.</black>#<black>.</black>' : '<black>...</black>'}<black>.</black>`)
				}
				function dont(){
					for (var i=0;i<7;i++){
						lines.push('<black>.....</black>')
					}
				}
				if(room){doIt()}else{dont()}
				chunk.lines = lines;
				return chunk;
			}
			var lv2 = {};
			Chunks.push(makeChunk(oRoom, 3, 3, true));
			lv1.forEach((room)=>{
				if (room.room){
					if(room.dir.key == 'NORTH'){
						Chunks.push(makeChunk(room.room, 3, 2, false));
						lv2[room.room.id] = [];
						for (var i=0;i<4; i++){
							var dir = num2dir(i);
							if (room.room.rooms[dir]){
								if (!room.room.key || room.room.key == {} || room.room.key == -1){
									lv2[room.room.id].push({oDir: room.dir.key, dir: dir, room: roomDb.findById(room.room.rooms[dir])});
								}
							}else{lv2[room.room.id].push({dir: dir, room: false})}
						}
					}
					if(room.dir.key == 'SOUTH'){
						Chunks.push(makeChunk(room.room, 3, 4, false));
						lv2[room.room.id] = [];
						for (var i=0;i<4; i++){
							var dir = num2dir(i);
							if (room.room.rooms[dir]){
								if (!room.room.key || room.room.key == {} || room.room.key == -1){
									lv2[room.room.id].push({oDir: room.dir.key, dir: dir, room: roomDb.findById(room.room.rooms[dir])});
								}
							}else{lv2[room.room.id].push({dir: dir, room: false})}
						}
					}
					if(room.dir.key == 'WEST'){
						Chunks.push(makeChunk(room.room, 2, 3, false));
						lv2[room.room.id] = [];
						for (var i=0;i<4; i++){
							var dir = num2dir(i);
							if (room.room.rooms[dir]){
								if (!room.room.key || room.room.key == {} || room.room.key == -1){
									lv2[room.room.id].push({oDir: room.dir.key, dir: dir, room: roomDb.findById(room.room.rooms[dir])});
								}
							}else{lv2[room.room.id].push({dir: dir, room: false})}
						}
					}
					if(room.dir.key == 'EAST'){
						Chunks.push(makeChunk(room.room, 4, 3, false));
						lv2[room.room.id] = [];
						for (var i=0;i<4; i++){
							var dir = num2dir(i);
							if (room.room.rooms[dir]){
								if (!room.room.key || room.room.key == {} || room.room.key == -1){
									lv2[room.room.id].push({oDir: room.dir.key, dir: dir, room: roomDb.findById(room.room.rooms[dir])});
								}
							}else{lv2[room.room.id].push({dir: dir, room: false})}
						}
					}
				}
			})
			for (var key in lv2){
				var arr = lv2[key];
				arr.forEach((room)=>{
					if (room.oDir == 'NORTH'){
						if (room.dir.key == 'NORTH'){
							Chunks.push(makeChunk(room.room, 3, 1, false));
						}
						if (room.dir.key == 'EAST'){
							Chunks.push(makeChunk(room.room, 4, 2, false));
						}
						if (room.dir.key == 'WEST'){
							Chunks.push(makeChunk(room.room, 2, 2, false));
						}
					}
					if (room.oDir == 'SOUTH'){
						if (room.dir.key == 'SOUTH'){
							Chunks.push(makeChunk(room.room, 3, 5, false));
						}
						if (room.dir.key == 'EAST'){
							Chunks.push(makeChunk(room.room, 4, 4, false));
						}
						if (room.dir.key == 'WEST'){
							Chunks.push(makeChunk(room.room, 2, 4, false));
						}
					}
					if (room.oDir == 'EAST'){
						if (room.dir.key == 'EAST'){
							Chunks.push(makeChunk(room.room, 5, 3, false));
						}
						if (room.dir.key == 'SOUTH'){
							Chunks.push(makeChunk(room.room, 4, 4, false));
						}
						if (room.dir.key == 'NORTH'){
							Chunks.push(makeChunk(room.room, 4, 2, false));
						}
					}
					if (room.oDir == 'WEST'){
						if (room.dir.key == 'WEST'){
							Chunks.push(makeChunk(room.room, 1, 3, false));
						}
						if (room.dir.key == 'SOUTH'){
							Chunks.push(makeChunk(room.room, 2, 4, false));
						}
						if (room.dir.key == 'NORTH'){
							Chunks.push(makeChunk(room.room, 2, 2, false));
						}
					}
				});
			}
			var chk = {};
			Chunks.forEach((chunk)=>{
				chk[[chunk.x, chunk.y]] = chunk;
			});
			for (var x=1; x<6; x++){
				for (var y=1; y<6; y++){
					if (!chk[[x, y]]){
						chk[[x, y]] = makeChunk(false, x, y, false);
					}
				}
			}
			var lines = [];

			for (var y=1; y<5; y++){
				for (var l=0; l<5; l++){
					var a = `${chk[[1, y]].lines[l]}${chk[[2, y]].lines[l]}${chk[[3, y]].lines[l]}${chk[[4, y]].lines[l]}${chk[[5, y]].lines[l]}`;
					lines.push(a);
				}
			}
			p.sendString(lines.join('\n'));
			return;
		}
		
		if (firstWord == "auction" || firstWord == "auc") {
			var arg = parseWord(data, 1);
			var bid = parseWord(data, 2);
			var count = 0;
			for (let item of auctionDb.map.values()) {
				if (item.seller == p.name) {
					count++;
				}
			}
			if (p.room.flags.indexOf('AUCTION') == -1) {
				p.sendString("<red><bold>" + p.room.name + " is not equipped to handle auctions.</bold></red>");
			}
			else if (!arg) {
				p.sendString(Game.auctionList(p));
				return;
			}
			else if (count >= 5) {
				p.sendString("<red><bold>You can only have 5 auctions going at once!</bold></red>");
				return;
			}
			else {
				const itemIndex = p.getItemIndex(arg);
				if (itemIndex === -1) {
					p.sendString("<red><bold>You don't have that!</bold></red>");
					return;
				}
				
				if (bid) {
					if (isNaN(parseInt(bid))) {
						p.sendString("<red><bold>Syntax: auction <item> [minimum bid]</bold></red>");
						return;
					}
					else {
						if (parseInt(bid) > 1000000) {
							p.sendString("<red><bold>The max bid amount is 1,000,000.</bold></red>");
							return;
						}
						if (parseInt(bid) < 100) {
							p.sendString("<red><bold>The min bid amount is 100.</bold></red>");
							return;
						}
					}
				}
				
				const item = p.getItemByIndex(itemIndex);
				if (item.hasFlag("NOAUC")) {
					p.sendString("<red><bold>" + item.name + " cannot be auctioned.</bold></red>");
					return;
				}
				
				var auc = new AuctionItem();
				auc.itemId = item.id;
				auc.seller = p.name;
				if (bid) {
					auc.currentBid = parseInt(bid);
				}
				auctionDb.add(auc);
				p.destroyItem(itemIndex);
				DB.saveDatabases();
				Game.sendGame("<yellow><bold>AUCTION: " + p.name + " is selling " + item.name + " for $" + auc.currentBid + ".</bold></yellow>");
			}
			return;
		}
		
		if (firstWord == "bid") {
			var aucId = parseWord(data, 1);
			var amount = parseWord(data, 2);
			
			if (isNaN(parseInt(aucId)) || isNaN(parseInt(amount))) {
				p.sendString("<red><bold>Syntax: bid <id> <amount></bold></red>");
				return;
			}
			
			var aucItem = auctionDb.findById(parseInt(aucId));
			if (!aucItem) {
				p.sendString("<red><bold>That auction ID does not exist!</bold></red>");
				return;
			}
			if (parseInt(amount) <= parseInt(aucItem.currentBid)) {
				p.sendString("<red><bold>You must bid higher than the current bid!</bold></red>");
				return;
			}
			if (p.money < parseInt(amount)) {
				p.sendString("<red><bold>You don't have that much money!</bold></red>");
				return;
			}
			if (parseInt(amount) > 1000000) {
				p.sendString("<red><bold>The max bid amount is 1,000,000.</bold></red>");
				return;
			}
			
			p.money = p.money - parseInt(amount);
			if (aucItem.bidder != "") {
				const prevBidder = playerDb.findByPlayerName(aucItem.bidder);
				prevBidder.money = prevBidder.money + parseInt(aucItem.currentBid);
				if (aucItem.bidder != aucItem.seller) {
					if (prevBidder.loggedIn) {
						prevBidder.sendString("<yellow><bold>AUCTION: You have been outbid on auction #" + aucId + " by " + p.name + ".\r\n" + 
								"AUCTION: Your bid of $" + aucItem.currentBid + " has been refunded.</bold></yellow>");
					}
				}
			}
			
			aucItem.currentBid = parseInt(amount);
			aucItem.bidder = p.name;
			DB.saveDatabases();
			p.sendString("<green><bold>You have bid $" + amount + " on auction #" + aucId + ".</bold></green>");
			return;
		}
		
		if (firstWord == "quest") {
			var arg = parseWord(data, 1);
			var arg2 = parseWord(data, 2);
			var quest = questDb.getQuest();
			var enemy = enemyDb.findById(quest.enemyId);
			
			if (arg.toUpperCase() == "RESET" && p.rank >= PlayerRank.GOD) {
				Game.sendGame("<red><bold>QUEST: " + p.name + " has reset the current target.</bold></red>");
				Game.beginNextQuest();
				return;
			}
			else if (arg.toUpperCase() == "PERKS") {
				var msg = "<cyan><bold>The following quest perks are available for purchase:</cyan><yellow>\r\n";
				var flags = QuestPerks;
				flags.sort();
				flags.forEach(flag => {
					msg = msg + "\r\n" + flag;
					if (p.questPerks.indexOf(flag) != -1) {
						msg = msg + " </yellow>(owned)<yellow>";
					}
				});
				msg += "\r\n\r\n</yellow><cyan>For more information, type \"help PERKNAME\".";
				msg += "\r\nTo purchase a perk for 1,000 quest points, type \"quest buy PERKNAME\".</cyan></bold>";
				p.sendString(msg);
				return;
			}
			else if (arg.toUpperCase() == "BUY") {
				if (!arg2 || arg2.trim() == "") {
					p.sendString("<red><bold>Syntax: quest buy PERKNAME (Type 'quest perks' for a list).</bold></red>");
					return;
				}
				if (QuestPerks.indexOf(arg2.toUpperCase()) == -1) {
					p.sendString("<red><bold>Perk not found. Type 'quest perks' for a list.</bold></red>");
					return;
				}
				if (p.questPoints < 1000) {
					p.sendString("<red><bold>You don't have enough quest points! Each costs 1,000.</bold></red>");
					return;
				}
				if (p.questPerks.indexOf(arg2.toUpperCase()) != -1) {
					p.sendString("<red><bold>You already own this perk!</bold></red>");
					return;
				}
				if (arg2.toUpperCase() == "SEELOOTCHANCE" && p.questPerks.indexOf("SEELOOT") == -1) {
					p.sendString("<red><bold>You must own the SEELOOT perk before buying SEELOOTCHANCE.</bold></red>");
					return;
				}
				p.questPoints = parseInt(p.questPoints) - 1000;
				p.questPerks.push(arg2.toUpperCase());
				DB.saveDatabases();
				p.sendString("<yellow><bold>You've purchased the " + arg2.toUpperCase() + " perk! Congratulations!</bold></yellow>");
				return;
			}
			
			if (quest.killed) {
				p.sendString("<red><bold>There is no quest running. Another will begin shortly.</bold></red>");
				return;
			}
			
			const area = areaDb.findById(parseInt(enemy.room.area));
			p.sendString("<red><bold>The current target is: </red>" + enemy.name + "<red>, located at </red>" + enemy.room.name + "<red>,\r\n" +
					"In the area </red>" +  area.name + "<red>. It is worth </red>" + quest.points + "<red> quest points!</bold></red>");
			return;
		}
		
		if (firstWord == "flee") {
			var arg = parseWord(data, 1).toLowerCase();
			if (!p.fighting) {
				p.sendString("<red><bold>You're not fighting!</bold></red>");
				return;
			}
			if (!arg) {
				p.sendString("<red><bold>Syntax: flee [direction]</bold></red>");
				return;
			}
			if (arg != 'east' && arg != 'west' && arg != 'south' && arg != 'north') {
				p.sendString("<red><bold>That's not a valid direction!</bold></red>");
				return;
			}
			p.fighting = false;
			const exp = Math.floor(p.experience / 10);
			p.experience -= parseInt(exp);
			p.sendString("<red><bold>You flee from combat and lose </red>" + exp + "<red> experience!</bold></red>");
			this.move(arg.toUpperCase(), true);
			return;
		}
		
		if (firstWord == "where") {
			var area = areaDb.findById(parseInt(p.room.area));
			var count = 0;
			var msg = "<cyan><bold>Players currently in </cyan>" + area.name + "<cyan>:\r\n";
			for (let player of playerDb.map.values()) {
				if (parseInt(player.room.area) == parseInt(p.room.area)) {
					count++;
					msg += "</cyan>" + count + ") <cyan>" + tostringChopped(player.name, 10) + " - " + player.room.name + "\r\n";
				}
			}
			msg += "</cyan><yellow>Total players: </yellow>" + count + "</bold>";
			p.sendString(msg);
			return;
		}
		
		if (firstWord == "area") {
			var arg = parseWord(data, 1);
			var msg;
			
			if (!arg) {
				msg = "<cyan><bold>List of all the current areas in the world:</cyan><yellow>";
				for (let area of areaDb.map.values()) {
					msg += "\r\n" + area.id + " - " + area.name;
				}
				msg += "</bold></yellow>";
				msg += "\r\n<cyan><bold>Use syntax </cyan>area [id]<cyan> to view more information about an area.</bold></cyan>";
				p.sendString(msg);
				return;
			}
			else if (isNaN(arg)) {
				p.sendString("<red><bold>Usage: area [area id]</bold></red>");
				return;
			}
			
			var area = areaDb.findById(parseInt(arg));
			if (!area) {
				p.sendString("<red><bold>Usage: area [area id]</bold></red>");
				return;
			}
			
			msg = "<cyan><bold>Information for " + area.name + ":</cyan>\r\n";
			msg += "Recommended level range: <yellow>" + area.minLevel + "-" + area.maxLevel + "</yellow>\r\n";
			msg += "Minimum level required: <yellow>" + area.levelLock + "</yellow>\r\n";
			msg += "Total number of mobs killed: <yellow>" + area.mobDeaths + "</yellow>\r\n";
			msg += "Total number of players killed: <yellow>" + area.playerDeaths + "</yellow></bold>";
			p.sendString(msg);
			return;
		}
		
		if (firstWord == "help") {
			var arg = parseWord(data, 1);
			if (arg) {
				arg = arg.toLowerCase();
			}
			else {
				var msg;
				msg = "<cyan><bold>The following helpfiles are available:</cyan>";
				for (let help of helpDb.map.values()) {
					if (help.minRank.toString() == "PLAYER") {
						msg += "\r\n" + help.keywords;
					}
				}
				if (p.rank >= PlayerRank.ADMIN) {
					msg += "\r\n<cyan>The following admin helpfiles are available:</cyan>";
					for (let help of helpDb.map.values()) {
						if (help.minRank.toString() == "ADMIN") {
							msg += "\r\n" + help.keywords;
						}
					}
				}
				msg += "</bold>";
				p.sendString(msg);
				return;
			}
			
			for (let help of helpDb.map.values()) {
				if (help.keywords.includes(arg)) {
					if (p.rank >= PlayerRank.get(help.minRank)) {
						var text = help.description.split("<newline>").join("\r\n");
						msg = "<cyan><bold>Helpfile for </cyan>" + arg + "<cyan>:</cyan>\r\n";
						msg += "<yellow>" + text + "</bold></yellow>";
						p.sendString(msg);
						return;
					}
					else {
						p.sendString("<red><bold>This is a restricted helpfile.</bold></red>");
						return;
					}
				}
			}
			p.sendString("<red><bold>Helpfile not found.</bold></red>");
			return;
		}

		// ------------------------------------------------------------------------
		//  GOD access commands
		// ------------------------------------------------------------------------
		
		if (firstWord === "kick" && p.rank >= PlayerRank.GOD) {
			const targetName = parseWord(data, 1);
			if (targetName === '') {
				p.sendString("<red><bold>Usage: kick <name></bold></red>");
				return;
			}

			// find a player to kick
			const target = playerDb.findLoggedIn(targetName);
			if (!target) {
				p.sendString("<red><bold>Player could not be found.</bold></red>");
				return;
			}

			if (target.rank > p.rank) {
				p.sendString("<red><bold>You can't kick that player!</bold></red>");
				return;
			}

			target.connection.close();
			Game.logoutMessage(target.name +
					" has been kicked by " + p.name + "!!!");
			return;
		}

		// ------------------------------------------------------------------------
		//  ADMIN access commands
		// ------------------------------------------------------------------------
		
		if (firstWord === "giveqp" && p.rank >= PlayerRank.ADMIN) {
			var playerName = parseWord(data, 1);
			var points = parseWord(data, 2);
			
			if (!playerName || !points || isNaN(points)) {
				p.sendString("<red><bold>Usage: giveqp [player] [amount]</bold></red>");
				return;
			}
			
			const player = playerDb.findActive(playerName);
			if (!player) {
				p.sendString("<red><bold>Player not found.</bold></red>");
				return;
			}
			
			player.questPoints += parseInt(points);
			p.sendString("<green><bold>You give " + player.name + " " + points + " quest points.</bold></green>");
			player.sendString("<green><bold>" + p.name + " rewards you with </green>" + points + "<green> quest points!</bold></green>");
			return;
		}
		
		if (firstWord === "pset" && p.rank >= PlayerRank.ADMIN) {
			var playerName = parseWord(data, 1);
			var stat = parseWord(data, 2);
			var value = parseWord(data, 3);
			
			if (!playerName || !stat || !value || isNaN(value)) {
				p.sendString("<red><bold>Usage: set [player] [stat] [value]</bold></red>");
				return;
			}
			
			const player = playerDb.findActive(playerName);
			if (!player) {
				p.sendString("<red><bold>Player not found.</bold></red>");
				return;
			}
			
			if (stat.toLowerCase() == "qp") {
				player.questPoints = parseInt(value);
				p.sendString("<green><bold>Player quest points updated.</bold></green>");
				return;
			}
			if (stat.toLowerCase() == "exp") {
				player.experience = parseInt(value);
				p.sendString("<green><bold>Player experience updated.</bold></green>");
				return;
			}
			if (stat.toLowerCase() == "level") {
				player.level = parseInt(value);
				p.sendString("<green><bold>Player level updated.</bold></green>");
				return;
			}
			if (stat.toLowerCase() == "money") {
				player.money = parseInt(value);
				p.sendString("<green><bold>Player money updated.</bold></green>");
				return;
			}
			if (stat.toLowerCase() == "statpoints") {
				player.statPoints = parseInt(value);
				p.sendString("<green><bold>Player stat points updated.</bold></green>");
				return;
			}
			else {
				p.sendString("<red><bold>Valid stats: qp, exp, level, money, statpoints</bold></red>");
				return;
			}
			
			return;
		}
		
		if (firstWord === "spawn" && p.rank >= PlayerRank.ADMIN) {
			for (let room of DB.roomDb.map.values()) {
				//Enemies
				if (room.spawnWhich !== 0) {
					if (enemyDb.getCountByEnemyId(parseInt(room.spawnWhich)) < room.maxEnemies) {
						const template = DB.enemyTpDb.findById(room.spawnWhich);
						const enemy = DB.enemyDb.create(template, room);
						Game.sendRoom("<red><bold>" + enemy.name +
								" enters the room!</bold></red>", room);
					}
				}
				//Items
				if (room.spawnItem != 0) {
					var found = false;
					room.items.forEach(item => {
						if (item.id == room.spawnItem) {
							found = true;
						}
					});
					if (!found) {
						var item = itemDb.findById(parseInt(room.spawnItem));
						room.addItem(item);
					}
				}
			}
			DB.saveDatabases();
			p.sendString("<green><bold>Spawn complete.</bold></green>");
			return;
		}
		
		if (firstWord === "slay" && p.rank >= PlayerRank.ADMIN) {
			var enemyName = parseWord(data, 1);
			const enemy = p.room.findEnemy(enemyName);

			if (enemy === 0) {
				p.sendString("<red><bold>You don't see that here!</bold></red>");
			}
			else {
				Game.enemyKilled(enemy, p);
			}
			
			return;
		}
		
		if (firstWord === "purge" && p.rank >= PlayerRank.ADMIN) {
			var arg = parseWord(data, 1);
			if (arg) {
				p.sendString("<red><bold>Type 'purge' with no arguments to clear everything in the room.</bold></red>");
				return;
			}
			var msg = "<yellow><bold>Purging all enemies and items in the room.\r\n</bold></yellow>";
			p.room.enemies.forEach(enemy => {
				msg = msg + "<cyan><bold>Enemy " + enemy.name + " purged!</bold></cyan>\r\n";
				enemyDb.delete(enemy);
			});
			p.room.items.forEach(item => {
				msg = msg + "<magenta><bold>Item " + item.name + " purged!</bold></magenta>\r\n";
				itemDb.deleteFromRoom(item, p);
			});
			msg = msg + "<yellow><bold>Done!</bold></yellow>";
			p.sendString(msg);
			return;
		}
		
		if (firstWord === "iload" && p.rank >= PlayerRank.ADMIN) {
			var num = parseWord(data, 1);
			if (isNaN(parseInt(num))) {
				p.sendString("<red><bold>Usage: iload <item ID></bold></red>");
			}
			else if (!itemDb.findById(parseInt(num))) {
				p.sendString("<red><bold>No such item exists.</bold></red>");
			}
			else {
				var item = itemDb.findById(parseInt(num));
				if (item.type == ItemType.VANITY) {
					p.room.addItem(item);
					p.sendString("<yellow><bold>" + item.name + " loaded in the room.</bold></yellow>");
				}
				else {
					p.inventory[p.items] = item;
					p.items++;
					p.sendString("<yellow><bold>" + item.name + " loaded.</bold></yellow>");
				}
			}
			return;
		}
		
		if (firstWord === "eload" && p.rank >= PlayerRank.ADMIN) {
			var num = parseWord(data, 1);
			if (isNaN(parseInt(num))) {
				p.sendString("<red><bold>Usage: eload <enemy ID></bold></red>");
			}
			else if (!enemyTpDb.findById(parseInt(num))) {
				p.sendString("<red><bold>No such enemy exists.</bold></red>");
			}
			else {
				const template = enemyTpDb.findById(parseInt(num));
				const enemy = enemyDb.create(template, p.room);
				p.sendString("<yellow><bold>" + enemy.name + " loaded.</bold></yellow>");
			}
			return;
		}

		if (firstWord === "elist" && p.rank >= PlayerRank.ADMIN) {
			var msg = "<cyan><bold>Current list of all enemies:</cyan>\r\n";
			const dataArray = jsonfile.readFileSync(enemyFileMap);

			dataArray.forEach(dataObject => {
				msg = msg + "<white>" + tostring(parseInt(dataObject["ID"]), 3) + 
				"- <yellow>" + dataObject["NAME"] + "\r\n";
			});

			msg = msg + "</bold></yellow>";
			p.sendString(msg);
			return;
		}

		if (firstWord === "rlist" && p.rank >= PlayerRank.ADMIN) {
			var arg = parseWord(data, 1);
			var msg;
			if (arg) {
				if (arg.toLowerCase() == "here") {
					var count = 0;
					var area = areaDb.findById(parseInt(p.room.area))
					msg = "<cyan><bold>Current list of all rooms in this area:</cyan>\r\n";
					for (let room of roomDb.map.values()) {
						if (parseInt(room.area) == area.id) {
							count++;
							msg = msg + "<white>" + tostring(room.id, 3) + "- <yellow>" + room.name + "\r\n";
						}
					}
					msg = msg + "<cyan>Count: " + count + "</bold></cyan>";
				}
			}
			else {
				msg = "<cyan><bold>Current list of all rooms:</cyan>\r\n";
				var count = 0;
				for (let room of roomDb.map.values()) {
					count++;
					msg = msg + "<white>" + tostring(room.id, 3) + "- <yellow>" + room.name + "\r\n";
				}
				msg = msg + "<cyan>Count: " + count + "</bold></cyan>";
			}
			p.sendString(msg);
			return;
		}

		if (firstWord === "ilist" && p.rank >= PlayerRank.ADMIN) {
			var msg = "<cyan><bold>Current list of all items:</cyan>\r\n";
			var type = "";
				for (let item of itemDb.map.values()) {
					switch(item.type) {
					case ItemType.WEAPON:
						type = "Weapon";
						break;
					case ItemType.ARMOR:
						type = "Armor";
						break;
					case ItemType.HEALING:
						type = "Healing";
						break;
					case ItemType.VANITY:
						type = "Vanity";
						break;
					}
					msg = msg + "<white>" + tostring(item.id, 3) + "- <yellow>" + tostringChopped(item.name, 25) + 
					" <white>- " + tostring(type, 8) + "\r\n";
				}
			msg = msg + "</bold></yellow>";
			p.sendString(msg);
			return;
		}

		if (firstWord === "redit" && p.rank >= PlayerRank.ADMIN) {
			if (parseWord(data, 1) == "create") {
				const previous = p.room;
				var room = new Room();
				room.name = "New Room";
				room.description = "This room needs a description!";
				room.type = 0;
				room.data = 0;
				Direction.enums.forEach(dir => {
					room[dir] = 0;
				});
				room.spawnWhich = 0;
				room.maxEnemies = 0;
				room.area = parseInt(p.room.area);
				roomDb.add(room);
				DB.saveDatabases();
				previous.removePlayer(p);
				p.room = room;
				room.addPlayer(p);
				p.sendString(Game.printRoom(p.room, p));
			}
			else {
				this.beginRedit();
			}
			return;
		}
		
		if (firstWord === "aedit" && p.rank >= PlayerRank.ADMIN) {
			const num = parseWord(data, 1);
			if (parseWord(data, 1) == "create") {
				var area = new Area();
				area.name = "New Area";
				area.minLevel = 0;
				area.maxLevel = 0;
				area.flags = [];
				areaDb.add(area);
				DB.saveDatabases();
				p.sendString("<yellow><bold>New area created, ID: " + area.id + "</bold></yellow>");
			}
			else if (!num) {
				this.beginAedit(parseInt(p.room.area));
			}
			else if (isNaN(num)) {
				p.sendString("<red><bold>Usage: iedit <item ID/create></bold></red>");
			}
			else if (!areaDb.findById(parseInt(num))) {
				p.sendString("<red><bold>No such area exists.</bold></red>");
			}
			else {
				this.beginAedit(num);
			}
			return;
		}
		
		if (firstWord === "hedit" && p.rank >= PlayerRank.ADMIN) {
			const num = parseWord(data, 1);
			if (parseWord(data, 1) == "create") {
				var help = new Help();
				help.keywords = "newhelp";
				help.description = "This is a new helpfile.";
				help.minRank = PlayerRank.PLAYER;
				helpDb.add(help);
				DB.saveDatabases();
				p.sendString("<yellow><bold>New helpfile created, ID: " + help.id + "</bold></yellow>");
				return;
			}
			else if (parseWord(data, 1) == "list") {
				var msg = "<cyan><bold>Current list of help files:</bold></cyan>";
				for (let help of helpDb.map.values()) {
					msg += "\r\n" + help.id + " - " + help.keywords;
				}
				msg += "</bold>";
				p.sendString(msg);
				return;
			}
			else if (!num) {
				p.sendString("<red><bold>Usage: hedit <keyword></bold></red>");
				return;
			}

			var found = false;
			var helpfile;
			for (let help of helpDb.map.values()) {
				if (help.keywords.includes(num.toLowerCase())) {
					found = true;
					helpfile = help;
				}
			}
			
			if (!found) {
				p.sendString("<red><bold>Helpfile not found.</bold></red>");
				return;
			}
			
			this.beginHedit(helpfile);
			return;
		}
		
		if (firstWord === "iedit" && p.rank >= PlayerRank.ADMIN) {
			const num = parseWord(data, 1);
			if (parseWord(data, 1) == "create") {
				var item = new Item();
				item.name = "New Item";
				Attribute.enums.forEach(attr => {
					item.attributes[attr] = 0;
				});
				itemDb.add(item);
				DB.saveDatabases();
				p.sendString("<yellow><bold>New item created, ID: " + item.id + "</bold></yellow>");
			}
			else if (isNaN(num)) {
				p.sendString("<red><bold>Usage: iedit <item ID/create></bold></red>");
			}
			else if (!itemDb.findById(parseInt(num))) {
				p.sendString("<red><bold>No such item exists.</bold></red>");
			}
			else {
				this.beginIedit(num);
			}
			return;
		}
		
		if (firstWord === "eedit" && p.rank >= PlayerRank.ADMIN) {
			const num = parseWord(data, 1);
			if (parseWord(data, 1) == "create") {
				var enemyTp = enemyTpDb.create();
				DB.saveDatabases();
				p.sendString("<yellow><bold>New enemy created, ID: " + enemyTp.id + "</bold></yellow>");
			}
			else if (isNaN(num)) {
				p.sendString("<red><bold>Usage: eedit <enemy ID/create></bold></red>");
			}
			else if (!enemyTpDb.findById(parseInt(num))) {
				p.sendString("<red><bold>No such enemy exists.</bold></red>");
			}
			else {
				this.beginEedit(num);
			}
			return;
		}

		if (firstWord === "rgoto" && p.rank >= PlayerRank.ADMIN) {
			const previous = p.room;
			const roomId = parseWord(data, 1);
			const next = roomDb.findById(parseInt(roomId));

			if (roomId === '' || !next || next === '') {
				p.sendString("<red><bold>Usage: rgoto <room ID></bold></red>");
			}
			else {			
				previous.removePlayer(p);
				Game.sendRoom("<yellow><bold>" + p.name + " disappears in a cloud of smoke!</bold></yellow>", previous);
				Game.sendRoom("<yellow><bold>" + p.name + " appears in a cloud of smoke!</bold></yellow>", next);

				p.room = next;
				next.addPlayer(p);
				p.sendString(Game.printRoom(next, p));
			}
			return;
		}

		if (firstWord === "announce" && p.rank >= PlayerRank.ADMIN) {
			Game.announce(removeWord(data, 0));
			return;
		}

		if (firstWord === "changerank" && p.rank >= PlayerRank.ADMIN) {
			const name = parseWord(data, 1);
			let rank = parseWord(data, 2);

			if (name === '' || rank === '') {
				p.sendString("<red><bold>Usage: changerank <name> <rank></bold></red>");
				return;
			}

			// find the player to change rank
			const target = playerDb.findByNameFull(name);
			if (!target) {
				p.sendString("<red><bold>Error: Could not find user " +
						name + "</bold></red>");
				return;
			}

			rank = PlayerRank.get(rank.toUpperCase());
			if (!rank) {
				p.sendString("<red><bold>Invalid rank!</bold></red>");
				return;
			}

			target.rank = rank;
			Game.sendGame("<green><bold>" + target.name +
					"'s rank has been changed to: " + target.rank.toString());
			return;
		}

		if (firstWord === "reload" && p.rank >= PlayerRank.ADMIN) {
			const db = parseWord(data, 1);

			if (db === '') {
				p.sendString("<red><bold>Usage: reload <db></bold></red>");
				return;
			}

			if (db === "items") {
				itemDb.load();
				p.sendString("<bold><cyan>Item Database Reloaded!</cyan></bold>");
			} else if (db === 'rooms') {
				roomDb.loadTemplates();
				p.sendString("<bold><cyan>Room Database Reloaded!</cyan></bold>");
			} else if (db === 'stores') {
				storeDb.load(itemDb);
				p.sendString("<bold><cyan>Store Database Reloaded!</cyan></bold>");
			} else if (db === 'enemies') {
				enemyTpDb.load();
				p.sendString("<bold><cyan>Enemy Database Reloaded!</cyan></bold>");
			} else {
				p.sendString("<bold><red>Invalid Database Name!</red></bold>");
			}
			return;
		}

		if (firstWord === "shutdown" && p.rank >= PlayerRank.ADMIN) {
			Game.announce("SYSTEM IS SHUTTING DOWN");
			Game.setIsRunning(false);
			return;
		}
		
		// ------------------------------------------------------------------------
		//  Command not recognized
		// ------------------------------------------------------------------------
		if (firstWord.trim() != "") {
			p.sendString("<bold><red>Invalid command. Type 'help' for a list of commands.</red></bold>");
		}
		else {
			p.printStatbar();
		}
		
	}

	leave() {
		const p = this.player;
		// deactivate player
		p.active = false;
		// log out the player from the database if the connection has been closed
		if (this.connection.isClosed) {
			playerDb.logout(p.id);
			if (isNaN(p.room)) p.room.removePlayer(p);
		}
	}

	// ------------------------------------------------------------------------
	//  This notifies the handler that a connection has unexpectedly hung up.
	// ------------------------------------------------------------------------
	hungup() {
		const p = this.player;
		Game.logoutMessage(`${p.name} has suddenly disappeared from the realm.`);
	}

	goToTrain() {
		const conn = this.connection;
		const p = this.player;
		Game.logoutMessage(p.name + " leaves to edit stats");
		conn.addHandler(new Train(conn, p));
	}

	beginRedit() {
		const conn = this.connection;
		const p = this.player;
		conn.addHandler(new Redit(conn, p));
	}
	
	beginAedit(num) {
		const conn = this.connection;
		const p = this.player;
		conn.addHandler(new Aedit(conn, p, num));
	}
	
	beginHedit(helpfile) {
		const conn = this.connection;
		const p = this.player;
		conn.addHandler(new Hedit(conn, p, helpfile));
	}
	
	beginIedit(num) {
		const conn = this.connection;
		const p = this.player;
		conn.addHandler(new Iedit(conn, p, num));
	}
	
	beginEedit(num) {
		const conn = this.connection;
		const p = this.player;
		conn.addHandler(new Eedit(conn, p, num));
	}

	useItem(name) {
		const p = this.player;
		const index = p.getItemIndex(name);

		if (index === -1) {
			p.sendString("<red><bold>Could not find that item!</bold></red>");
			return false;
		}

		const item = p.inventory[index];
		
		if (item.minLevel > p.level) {
			p.sendString("<red><bold>This item is too powerful for you to use.</bold></red>");
			return false;
		}

		switch(item.type) {
		case ItemType.WEAPON:
			p.useWeapon(index);
			Game.sendRoom("<green><bold>" + p.name + " arms a " +
					item.name + "</bold></green>", p.room);
			return true;
		case ItemType.ARMOR:
			p.useArmor(index);
			Game.sendRoom("<green><bold>" + p.name + " puts on a " +
					item.name + "</bold></green>", p.room);
			return true;
		case ItemType.HEALING:
			const min = item.min;
			const max = item.max;
			p.addBonuses(item);
			p.addHitPoints(random(min, max));
			p.dropItem(index);
			p.printStatbar();
			return true;
		case ItemType.VANITY:
			p.sendString("<red><bold>You cannot use that item.</bold></red>");
			return false;
		}

		return false;
	}

	removeItem(typeName) {
		const p = this.player;

		typeName = typeName.toLowerCase();

		if (typeName === "weapon" && p.Weapon() !== 0) {
			p.removeWeapon();
			return true;
		}

		if (typeName === "armor" && p.Armor() !== 0) {
			p.removeArmor();
			return true;
		}

		p.sendString("<red><bold>Could not Remove item!</bold></red>");
		return false;
	}

	move(dir, fighting) {
		const p = this.player;
		
		if (p.fighting && !fighting) {
			p.sendString("<red><bold>Not while you're fighting! Try fleeing instead.</bold></red>");
			return;
		}
		
		const next = roomDb.findById(p.room.rooms[dir]);
		const previous = p.room;

		if (!next) {
			Game.sendRoom("<red>" + p.name + " bumps into the wall to the " +
					dir.key + "!!!</red>", p.room);
			return;
		}
		
		const area = areaDb.findById(parseInt(next.area));
		if (p.level < parseInt(area.levelLock)) {
			p.sendString("<red><bold>You must be level </red>" + area.levelLock + "<red> to enter this area.</bold></red>");
			return;
		}

		previous.removePlayer(p);

		if (!fighting) {
			Game.sendRoom("<green>"  + p.name + " leaves to the " +
					dir.key + ".</green>", previous);
			Game.sendRoom("<green>"  + p.name + " enters from the " +
					this._oppositeDirection(dir) + ".</green>", next);
			p.sendString("<green>You walk " + dir.key + ".</green>");
		}

		p.room = next;
		next.addPlayer(p);

		p.sendString(Game.printRoom(next, p));
	}

	_oppositeDirection(dir) {
		switch (dir) {
		case Direction.NORTH:
			return Direction.SOUTH.key;
		case Direction.EAST:
			return Direction.WEST.key;
		case Direction.SOUTH:
			return Direction.NORTH.key;
		case Direction.WEST:
			return Direction.EAST.key;
		case Direction.UP:
			return Direction.DOWN.key;
		case Direction.DOWN:
			return Direction.UP.key;
		default:
			return false;
		}
	}
	
	getAllItems(p, room) {
		room.items.forEach(i => {
			if (i.type == ItemType.VANITY) {
				p.sendString("<red><bold>You cannot take this item.</bold></red>");
				return;
			}
			
			if (i.hasFlag("NOTAKE")) {
				p.sendString("<red><bold>You cannot take this item.</bold></red>");
				return;
			}

			if (!p.pickUpItem(i)) {
				p.sendString("<red><bold>You can't carry that much!</bold></red>");
				return;
			}
			
			room.removeItem(i);
			Game.sendRoom("<cyan><bold>" + p.name + " picks up " +
					i.name + ".</bold></cyan>", room);
		});
	}

	getItem(item) {
		const p = this.player;

		if (item[0] === '$') {
			// clear off the '$', and convert the result into a number.
			const money = parseInt(item.substr(1, item.length - 1));
			if (!isNaN(money)) { // if valid money amount
				// make sure there's enough money in the room
				if (money > p.room.money) {
					p.sendString("<red><bold>There isn't that much here!</bold></red>");
				} else {
					p.money += money;
					p.room.money -= money;
					Game.sendRoom("<cyan><bold>" + p.name + " picks up $" +
							money + ".</bold></cyan>", p.room);
				}
				return;
			}
		}

		const i = p.room.findItem(item);

		if (!i) {
			p.sendString("<red><bold>You don't see that here!</bold></red>");
			return;
		}
		
		if (i.type == ItemType.VANITY) {
			p.sendString("<red><bold>You cannot take this item.</bold></red>");
			return;
		}
		
		if (i.hasFlag("NOTAKE")) {
			p.sendString("<red><bold>You cannot take this item.</bold></red>");
			return;
		}

		if (!p.pickUpItem(i)) {
			p.sendString("<red><bold>You can't carry that much!</bold></red>");
			return;
		}

		p.room.removeItem(i);
		Game.sendRoom("<cyan><bold>" + p.name + " picks up " +
				i.name + ".</bold></cyan>", p.room);
	}
	
	dropAllItems(p) {
		var count = 0;
		p.inventory.forEach((i) => {
			this.dropItem(i.name);
			count++;
		});
		if (count==0) {
			p.sendString("<red><bold>You don't have anything to drop!</bold></red>");
		}
	}

	dropItem(item) {
		const p = this.player;

		if (item[0] === '$') {
			// clear off the '$', and convert the result into a number.
			const money = parseInt(item.substr(1, item.length - 1));
			if (!isNaN(money)) { // if valid money amount
				// make sure there's enough money in the room
				if (money > p.money) {
					p.sendString("<red><bold>You don't have that much!</bold></red>");
				} else {
					p.money -= money;
					p.room.money += money;
					Game.sendRoom("<cyan><bold>" + p.name + " drops $" +
							money + ".</bold></cyan>", p.room);
				}
				return;
			}
		}

		const i = p.getItemIndex(item);

		if (i === -1) {
			p.sendString("<red><bold>You don't have that!</bold></red>");
			return;
		}

		Game.sendRoom("<cyan><bold>" + p.name + " drops " +
				p.inventory[i].name + ".</bold></cyan>", p.room);
		p.room.addItem(p.inventory[i]);
		p.dropItem(i);
	}
	
	destroyItem(item) {
		const p = this.player;

		const i = p.getItemIndex(item);

		if (i === -1) {
			p.sendString("<red><bold>You don't have that!</bold></red>");
			return;
		}

		Game.sendRoom("<cyan><bold>" + p.name + " destroys " +
				p.inventory[i].name + "!</bold></cyan>", p.room);
		p.destroyItem(i);
	}

	buy(itemName) {
		const p = this.player;
		const s = storeDb.findById(p.room.data);
		if (!s) return false;
		const i = s.findItem(itemName);

		if (i === 0) {
			p.sendString("<red><bold>Sorry, we don't have that item!</bold></red>");
			return;
		}
		if (p.money < i.price) {
			p.sendString("<red><bold>Sorry, but you can't afford that!</bold></red>");
			return;
		}
		if (!p.pickUpItem(i)) {
			p.sendString("<red><bold>Sorry, but you can't carry that much!</bold></red>");
			return;
		}

		p.money -= i.price;
		Game.sendRoom("<cyan><bold>" + p.name + " buys a " +
				i.name +"</bold></cyan>", p.room);
	}

	sell(itemName) {
		const p = this.player;
		const s = storeDb.findById(p.room.data);
		if (!s) return false;
		const index = p.getItemIndex(itemName);

		if (index === -1) {
			p.sendString("<red><bold>Sorry, you don't have that!</bold></red>");
			return;
		}
		const i = p.inventory[index];
		if (!s.findItem(i.name)) {
			p.sendString("<red><bold>Sorry, we don't want that item!</bold></red>");
		}
		p.dropItem(index);
		p.money += i.price;
		Game.sendRoom("<cyan><bold>" + p.name + " sells a " +
				i.name + "</bold></cyan>", p.room);
	}

	playerAttack(enemyName) {
		const p = this.player;
		const now = timer.getMS();

		if (now < p.nextAttackTime) {
			p.sendString("<red><bold>You can't attack yet!</bold></red>");
			return;
		}

		const enemy = p.room.findEnemy(enemyName);

		if (enemy === 0) {
			p.sendString("<red><bold>You don't see that here!</bold></red>");
			return;
		}
		
		if (enemy.tp.hasFlag("NOATTACK")) {
			p.sendString("<red><bold>You cannot attack this enemy.</bold></red>");
			return;
		}
		
		p.fighting = true;

		const seconds = Util.seconds;
		const weapon = p.Weapon();

		let damage;
		if (weapon === 0) {
			damage = random(1, 3);
			p.nextAttackTime = now + seconds(1);
		} else {
			damage = random(weapon.min, weapon.max);
			p.nextAttackTime = now + seconds(weapon.speed);
		}

		const attr = p.GetAttr.bind(p);
		const A = Attribute;
		const e = enemy.tp;

		if (random(0,99) >= attr(A.ACCURACY) - e.dodging) {
			Game.sendRoom("<white>" + p.name + " swings at " + e.name +
					" but misses!</white>", p.room);
			return;
		}

		damage += attr(A.STRIKEDAMAGE);
		damage -= e.damageAbsorb;

		if (damage < 1) damage = 1;

		enemy.hitPoints -= damage;

		Game.sendRoom("<red>" + p.name + " hits " + e.name + " for " +
				damage + " damage!</red>", p.room);

		if (enemy.hitPoints <= 0) {
			p.fighting = false;
			Game.enemyKilled(enemy, p);
		}
	}
	
	static playerAutoAttack(enemy, p) {
		const now = timer.getMS();

		if (enemy.tp.hasFlag("NOATTACK")) {
			p.sendString("<red><bold>You cannot attack this enemy.</bold></red>");
			return;
		}
		
		p.fighting = true;

		const seconds = Util.seconds;
		const weapon = p.Weapon();

		let damage;
		if (weapon === 0) {
			damage = random(1, 3);
			p.nextAttackTime = now + seconds(1);
		} else {
			damage = random(weapon.min, weapon.max);
			p.nextAttackTime = now + seconds(weapon.speed);
		}

		const attr = p.GetAttr.bind(p);
		const A = Attribute;
		const e = enemy.tp;

		if (random(0,99) >= attr(A.ACCURACY) - e.dodging) {
			Game.sendRoom("<yellow>" + p.name + " swings at " + e.name +
					" but misses!</yellow>", p.room);
			return;
		}

		damage += attr(A.STRIKEDAMAGE);
		damage -= e.damageAbsorb;

		if (damage < 1) damage = 1;

		enemy.hitPoints -= damage;

		Game.sendRoom("<red>" + p.name + " hits " + e.name + " for </red>" +
				damage + "<red> damage!</red>", p.room);

		if (enemy.hitPoints <= 0) {
			p.fighting = false;
			Game.enemyKilled(enemy, p);
		}
	}

	static enemyAttack(enemy) {
		const e = enemy.tp;
		const room = enemy.room;
		const now = timer.getMS();
		const seconds = Util.seconds;

		const p = room.players[random(0, room.players.length - 1)];
		
		if (p.rank >= PlayerRank.ADMIN || e.hasFlag("NOATTACK")) {
			return;
		}
		p.fighting = true;

		let damage;
		if (e.weapon === 0) {
			damage = random(1, 3);
			enemy.nextAttackTime = now + seconds(1);
		} else {
			const weapon = (isNaN(e.weapon) ? e.weapon : itemDb.findById(e.weapon));
			damage = random(weapon.min, weapon.max);
			enemy.nextAttackTime = now + seconds(weapon.speed);
		}

		const attr = p.GetAttr.bind(p);
		const A = Attribute;

		if (random(0,99) >= e.accuracy - attr(A.DODGING)) {
			Game.sendRoomNoPrompt("<yellow>" + e.name + " swings at " + p.name +
					" but misses!</yellow>", enemy.room);
			if (Game.isAutoAttackOn()) {
				this.playerAutoAttack(enemy, p);
			}
			return;
		}

		damage += e.strikeDamage;
		damage -= attr(A.DAMAGEABSORB);

		if (damage < 1) damage = 1;

		p.addHitPoints(-damage);

		Game.sendRoomNoPrompt("<red>" + e.name + " hits " + p.name + " for </red>" +
				damage + "<red> damage!</red>", enemy.room);

		if (p.hitPoints <= 0) {
			p.fighting = false;
			Game.playerKilled(p);
		}
		else {
			if (Game.isAutoAttackOn()) {
				this.playerAutoAttack(enemy, p);
			}
		}
		
	}

	static playerKilled(player) {
		const p = player;

		Game.sendRoomNoPrompt("<red><bold>" + p.name +
				" has died!</bold></red>", p.room);
		// drop the money
		const money = Math.floor(p.money / 10);
		if (money > 0) {
			p.room.money += parseInt(money);
			p.money -= money;
			Game.sendRoomNoPrompt("<cyan>$" + money +
					" drops to the ground.</cyan>", p.room);
		}

		// drop an item
		if (p.items > 0) {
			const index = random(0, p.items - 1);
			const item = p.inventory[index];
			p.room.addItem(item);
			p.dropItem(index);
			Game.sendRoomNoPrompt("<cyan>" + item.name + " drops to the ground." +
					"</cyan>", p.room);
		}

		// subtract 10% experience
		const exp = Math.floor(p.experience / 10);
		p.experience -= parseInt(exp);

		// remove the player from the room and transport him to room 1.
		p.room.removePlayer(p);
		p.room = roomDb.findById(1);
		p.room.addPlayer(p);
		
		//death counter
		p.deaths = p.deaths + 1;
		
		//area death counter
		var area = areaDb.findById(parseInt(p.room.area));
		area.playerDeaths = area.playerDeaths + 1; 

		// set the hitpoints to 70%
		p.setHitPoints(Math.floor(p.GetAttr(Attribute.MAXHITPOINTS) * 0.7));

		p.sendStringNoPrompt("<white><bold>You have died, " +
				"but have been ressurected in " +
				p.room.name + "</bold></white>");

		p.sendStringNoPrompt("<red><bold>You have lost " +
				exp + " experience!</bold></red>");

		Game.sendRoom("<white><bold>" + p.name +
				" appears out of nowhere!!</bold></white>", p.room);
	}

	static enemyKilled(enemy, player) {
		const e = enemy.tp;
		const p = player;

		Game.sendRoomNoPrompt("<cyan><bold>" + e.name +
				" has died!</bold></cyan>", enemy.room);

		// drop the money
		const money = random(e.moneyMin, e.moneyMax);
		if (money > 0) {
			enemy.room.money += parseInt(money);
			Game.sendRoomNoPrompt("<cyan>$" + money + " drops to the ground." +
					"</cyan>", enemy.room);
		}

		// drop all the items
		e.loot.forEach(loot => {
			if (random(0,99) < loot.chance) {
				const item = itemDb.findById(loot.itemId);
				enemy.room.addItem(item);
				Game.sendRoomNoPrompt("<cyan>" + item.name + " drops to the ground." +
						"</cyan>", enemy.room);
			}
		});
		
		// kill counter
		p.kills = p.kills + 1;
		
		//area death counter
		var area = areaDb.findById(parseInt(p.room.area));
		area.mobDeaths = area.mobDeaths + 1;

		// add experience to the player who killed it
		
		if (p.questPerks.indexOf("EXTRAEXP") != -1) {
			var extraExp = Math.ceil(parseInt(e.experience) / 10);
			p.experience += parseInt(e.experience);
			p.experience += parseInt(extraExp);
			p.sendString("<cyan><bold>You gain " + e.experience +
			"+" + extraExp + " experience.</bold></cyan>");
		} 
		else {
			p.experience += parseInt(e.experience);
			p.sendString("<cyan><bold>You gain " + e.experience +
			" experience.</bold></cyan>");
		}
		
		
		
		// check quest
		var quest = questDb.getQuest();
		if (enemy.id == quest.enemyId) {
			quest.killed = true;
			DB.saveDatabases();
			p.questPoints = p.questPoints +  quest.points;
			p.questKills = p.questKills + 1; 
			Game.sendGame("<red><bold>QUEST: " + p.name + " has killed the target! Quest is now over.</bold></red>");
		}

		// remove the enemy from the game
		enemyDb.delete(enemy);
	}

	static sendGlobal(msg) {
		Game._sendToPlayers(msg, 'loggedIn');
	}

	static sendGame(msg) {
		Game._sendToPlayers(msg, 'active');
	}

	static sendRoom(text, room) {
		room.players.forEach(player => {
			player.sendString(text);
		});
	}
	
	static sendRoomNoPrompt(text, room) {
		room.players.forEach(player => {
			player.sendStringNoPrompt(text);
		});
	}

	static _sendToPlayers(msg, filter) {
		for (let key of playerDb.map.keys()) {
			const player = playerDb.map.get(key);
			if (player[filter]) player.sendString(msg);
		}
	}

	static logoutMessage(reason) {
		Game.sendGame("<red><bold>" + reason + "</bold></red>");
	}

	static announce(announcement) {
		Game.sendGlobal("<cyan><bold>" + announcement + "</bold></cyan>");
	}

	whisper(msg, playerName) {
		const player = playerDb.findActive(playerName);
		if (!player) {
			this.player.sendString(
			"<red><bold>Player not found.</bold></red>");
		} else {
			player.sendString(
					"<yellow>" + this.player.name +
					" whispers to you: </yellow>" + msg);
			this.player.sendString(
					"<yellow>You whisper to " + player.name +
					": </yellow>" + msg);
		}
	}

	static whoList(mode) {
		let str = "<white><bold>" +
		"--------------------------------------------------------------------------------\r\n" +
		" Name             | Level     | Activity | Rank\r\n" +
		"--------------------------------------------------------------------------------\r\n";

		if (mode === 'all') {
			str += Game._who(() => true);
		} else {
			str += Game._who((player) => player.loggedIn);
		}

		str +=
			"--------------------------------------------------------------------------------" +
			"</bold></white>";

		return str;
	}

	static _who(filterFn) {
		let str = "";
		for (let key of playerDb.map.keys()) {
			const player = playerDb.map.get(key);
			if (filterFn(player)) {
				const p = player;
				str += " " + tostring(p.name, 17) + "| ";
				str += tostring(p.level.toString(), 10) + "| ";

				if (p.active && p.loggedIn && p.fighting) str += "<red>Fighting</red>";
				else if (p.active) str += "<green>Online  </green>";
				else if (p.loggedIn) str += "<yellow>Inactive</yellow>";
				else str += "<red>Offline </red>";

				str += " | ";
				let rankColor = "";
				switch(p.rank) {
				case PlayerRank.PLAYER: rankColor = "white";   break;
				case PlayerRank.GOD:     rankColor = "yellow";  break;
				case PlayerRank.ADMIN:   rankColor = "green";   break;
				}
				str += "<" + rankColor + ">" + p.rank.toString() +
				"</" + rankColor + ">\r\n";
			}
		}
		return str;
	}

	static printHelp() {
		const help = "<white><bold>" +
		"--------------------------------- Command List ---------------------------------\r\n" +
		" /                          - Repeats your last command exactly.\r\n" +
		" chat <mesg>                - Sends message to everyone in the game\r\n" +
		" say <mesg>                 - Sends message to everyone in the room\r\n" +
		" experience                 - Shows your experience statistics\r\n" +
		" help                       - Shows this menu\r\n" +
		" inventory                  - Shows a list of your items\r\n" +
		" quit                       - Allows you to leave the realm.\r\n" +
		" remove <'weapon'/'armor'>  - removes your weapon or armor\r\n" +
		" stats                      - Shows all of your statistics\r\n" +
		" time                       - shows the current system time.\r\n" +
		" use <item>                 - use an item in your inventory\r\n" +
		" whisper <who> <msg>        - Sends message to one person\r\n" +
		" who                        - Shows a list of everyone online\r\n" +
		" who all                    - Shows a list of everyone\r\n" +
		" look                       - Shows you the contents of a room\r\n" +
		" where                      - Shows you the players in your area\r\n" +
		" area [id]                  - Shows you the list of all areas\r\n" +
		" north/east/south/west      - Moves in a direction\r\n" +
		" exits                      - Shows all exits in current room\r\n" +
		" get/drop <item>            - Picks up or drops an item on the ground\r\n" +
		" destroy <item>             - Gets rid of an item from your inventory\r\n" +
		" train                      - Train to the next level (TR)\r\n" +
		" editstats                  - Edit your statistics (TR)\r\n" +
		" list                       - Lists items in a store (ST)\r\n" +
		" buy/sell <item>            - Buy or Sell an item in a store (ST)\r\n" +
		" auction [item] [min bid]   - View or auction an item\r\n" +
		" bid <id> <amount>          - Bid on an auction item\r\n" +
		" flee <direction>           - Flee from combat\r\n" +
		" quest                      - View the current quest information\r\n</bold></white>";

		const admin = "<green><bold>" +
		"-------------------------------- Admin Commands --------------------------------\r\n" +
		" ahelp                      - View all admin commands\r\n";

		const end =
			"--------------------------------------------------------------------------------</bold></green>";

		return help + admin + end;
	}

	static printAdminHelp() {
		const help = "<yellow><bold>" + 
		"--------------------------------- God Commands ---------------------------------\r\n" +
		" kick <who>                 - kicks a user from the realm\r\n" +
		"</bold></yellow>";

		const admin = "<green><bold>" +
		"-------------------------------- Admin Commands --------------------------------\r\n" +
		" announce <msg>             - Makes a global system announcement\r\n" +
		" changerank <who> <rank>    - Changes the rank of a player\r\n" +
		" reload <db>                - Reloads the requested database\r\n" +
		" shutdown                   - Shuts the server down\r\n" +
		" slay <name>                - Instantly kill an enemy!\r\n" +
		" purge                      - Removes all mobs and items from a room\r\n" +
		" rgoto <room id>            - Go to a certain room\r\n" +
		" ilist                      - List all items in the game\r\n" +
		" elist                      - List all enemies in the game\r\n" +
		" rlist [here]               - List all rooms in the game, or current area\r\n" +
		" redit [create]             - Edit current room or create a room\r\n" +
		" iedit [create/id]          - Edit item or create another\r\n" +
		" eedit [create/id]          - Edit enemy or create another\r\n" +
		" aedit [create/id]          - Edit area or create another\r\n" +
		" hedit [create/keyword/list]- Edit helpfile or create another\r\n" +
		" iload <id>                 - Loads an item into your inventory\r\n" +
		" eload <id>                 - Loads an enemy into the current room\r\n" +
		" quest reset                - Begins a new quest\r\n" +
		" spawn                      - Forces a gamewide enemy respawn\r\n" +
		" pset <player> <stat> <val> - Modify a player's stats\r\n" +
		" giveqp <player> <val>      - Reward a player with quest points\r\n" +
		"</bold></green>";

		const end =
			"--------------------------------------------------------------------------------";

		return help + admin + end;
	}

	static storeList(storeId) {
		const s = storeDb.findById(storeId);
		if (!s) return false;
		let output = "<white><bold>" +
		"--------------------------------------------------------------------------------\r\n";
		output += " Welcome to " + s.name + "!\r\n";
		output += "--------------------------------------------------------------------------------\r\n";
		output += " Item                           | Price\r\n";
		output += "--------------------------------------------------------------------------------\r\n";

		s.items.forEach(item => {
			output += " " + tostring(item.name, 31) + "| ";
			output += tostring(item.price) + "\r\n";
		});
		output += "--------------------------------------------------------------------------------\r\n" +
		"</bold></white>";
		return output;
	}
	
	static enemyWander(enemy) {
		if (random(1,100) > 10) {
			return;
		}
		if (enemy.tp.hasFlag("NOWANDER")) {
			return;
		}
		
		var currRoom = enemy.room;
		var exits = [];
		var dirs = [];
		var exit = 0;
		var dir;
		
		Direction.enums.forEach(dir => {
			if (currRoom.rooms[dir] !== 0) {
				var possibleRoom = roomDb.findById(parseInt(currRoom.rooms[dir]));
				if (!possibleRoom.hasFlag("NOENEMY")) {
					exits.push(currRoom.rooms[dir]);
					dirs.push(dir);
				}
			}
		});
		
		if (exits.length == 0) {
			return;
		}
		
		var num = random(0,exits.length-1);
		var exit = exits[num];
		var dir = dirs[num];
		var oppDir;
		
		switch (dir) {
		case Direction.NORTH: {
			oppDir = Direction.SOUTH.key;
			break;
		}
		case Direction.EAST: {
			oppDir = Direction.WEST.key;
			break;
		}
		case Direction.SOUTH: {
			oppDir = Direction.NORTH.key;
			break;
		}
		case Direction.WEST: {
			oppDir = Direction.EAST.key;
			break;
		}
		case Direction.UP: {
			oppDir = Direction.DOWN.key;
			break;
		}
		case Direction.DOWN: {
			oppDir = Direction.UP.key;
			break;
		}
		default:
		}
		
		var newRoom = roomDb.findById(parseInt(exit));
		
		Game.sendRoomNoPrompt("<green>"  + enemy.name + " leaves to the " +
				dir.key + ".</green>", currRoom);
		Game.sendRoomNoPrompt("<green>"  + enemy.name + " enters from the " +
				oppDir + ".</green>", newRoom);
		
		currRoom.removeEnemy(enemy);
		newRoom.addEnemy(enemy);
		return;
	}
	
	static beginNextQuest() { 
		var quest = questDb.getQuest();
		var newEnemy = enemyDb.getRandomEnemy();
		var points = Math.floor(Math.random() * 9) + 2;
		
		while (!newEnemy) {
			newEnemy = enemyDb.getRandomEnemy();
		}
		while (newEnemy.tp.hasFlag("NOQUEST")) {
			newEnemy = enemyDb.getRandomEnemy();
		}
		
		quest.enemyId = newEnemy.id;
		quest.points = parseInt(points);
		quest.killed = false;
		
		Game.sendGame("<red><bold>QUEST: The new target is: " + newEnemy.name + ", worth " + points + " points!</bold></red>");
		DB.saveDatabases();
		return;
	}
	
	static auctionRandomItem() {
		var item = itemDb.getRandomItem();
		while (item.type == ItemType.VANITY || item.hasFlag("NOAUC") || item.hasFlag("NOAUTOAUC")) {
			item = itemDb.getRandomItem();
		}
		
		var auc = new AuctionItem();
		auc.itemId = item.id;
		auc.seller = "House";
		auctionDb.add(auc);
		DB.saveDatabases();
		Game.sendGame("<yellow><bold>AUCTION: Today's special auction is: " + item.name + "!</bold></yellow>");
		return;
	}
	
	static endAuction(auc) {
		const item = itemDb.findById(parseInt(auc.itemId));
		const player = playerDb.findByPlayerName(auc.bidder);
		const seller = playerDb.findByPlayerName(auc.seller);
		
		if (!player) {
			auctionDb.delete(auc);
			DB.saveDatabases();
			Game.sendGame("<yellow><bold>AUCTION: Sale for " + item.name + " has ended without a bid.</bold></yellow>");
			return;
		}
		
		player.inventory[player.items] = item;
		player.items++;
		
		if (seller) {
			seller.money = seller.money + parseInt(auc.currentBid);
		}
		
		auctionDb.delete(auc);
		DB.saveDatabases();
		Game.sendGame("<yellow><bold>AUCTION: " + item.name + " has sold to " + player.name + " for $" + auc.currentBid + ".</bold></yellow>");
		return;
	}
	
	static auctionList(player) {
		var aucItem, endsIn;
		var numItems = auctionDb.size();
		let output = "<white><bold>";
		output += "Welcome to <yellow>" + player.room.name + "</yellow>!\r\n";
		if (numItems == 0) {
			output += "Our inventory is running low today.\r\n";
			output += "Please come back at a later time.\r\n";
			return output;
		}
		else {
			output += "There are " + numItems + " items for sale today.\r\n";
		}
		output += "----------------------------------------------------------------------------------\r\n";
		output += "<cyan>ID   | Item                    | Bid         | Seller    | Bidder    | Ends In\r\n</cyan>";
		output += "----------------------------------------------------------------------------------\r\n";
		
		for (let item of auctionDb.map.values()) {
			endsIn = parseInt(item.dateStarted) + 86400000;
			aucItem = itemDb.findById(parseInt(item.itemId));
			output += " " + tostringChopped(item.id, 5) + "| ";
			output += tostringChopped(aucItem.name, 24) + "| ";
			output += "<yellow>" + tostringChopped(item.currentBid, 12) + "</yellow>| ";
			output += tostringChopped(item.seller, 10) + "| ";
			output += tostringChopped(item.bidder, 10) + "| ";
			output += "<cyan>" + msToTime(endsIn - Date.now()) + "</cyan>";
		}

		output += "\r\n----------------------------------------------------------------------------------" +
		"</bold></white>";
		return output;
	}

	printExperience() {
		const p = this.player;
		return "<white><bold>" +
		"Level:         " + p.level + "\r\n" +
		"Experience:    " + p.experience + "/" +
		p.needForLevel(p.level + 1) + " (" +
		Math.round(100 * p.experience / p.needForLevel(p.level + 1)) +
		"%)</bold></white>";
	}

	printStats() {
		const p = this.player;
		const attr = p.GetAttr.bind(p);
		const str = "<white><bold>" +
		"---------------------------------- Your Stats ----------------------------------\r\n" +
		" Name:          " + p.name + "\r\n" +
		" Rank:          " + p.rank.toString() + "\r\n" +
		" HP/Max:        " + p.hitPoints + "/" + attr(Attribute.MAXHITPOINTS) +
		"  (" + Math.round(100 * p.hitPoints / attr(Attribute.MAXHITPOINTS)) + "%)\r\n" +
		this.printExperience() + "\r\n" +
		" Strength:      " + tostring(attr(Attribute.STRENGTH), 16) +
		" Accuracy:      " + tostring(attr(Attribute.ACCURACY)) + "\r\n" +
		" Health:        " + tostring(attr(Attribute.HEALTH), 16) +
		" Dodging:       " + tostring(attr(Attribute.DODGING)) + "\r\n" +
		" Agility:       " + tostring(attr(Attribute.AGILITY), 16) +
		" Strike Damage: " + tostring(attr(Attribute.STRIKEDAMAGE)) + "\r\n" +
		" Stat Points:   " + tostring(p.statPoints, 16) +
		" Damage Absorb: " + tostring(attr(Attribute.DAMAGEABSORB)) + "\r\n" +
		"--------------------------------------------------------------------------------" +
		" Deaths:        " + tostring(p.deaths, 16) +
		" Kills:         " + tostring(p.kills) + "\r\n" +
		" Quest Points:  " + tostring(p.questPoints, 16) +
		" Quest Kills:   " + tostring(p.questKills) + "\r\n" +
		"--------------------------------------------------------------------------------" +
		"</bold></white>";
		return str;
	}

	printInventory() {
		const p = this.player;

		let itemList = "<white><bold>" +
		"-------------------------------- Your Inventory --------------------------------\r\n" +
		" Items:  ";

		// Inventory
		p.inventory.forEach((item) => {
			itemList += item.name + ", ";
		});

		// chop off the extraneous comma, and add a newline.
		itemList = itemList.slice(0, -2);
		itemList += "\r\n";

		// Weapon/Armor
		itemList += " Weapon: ";
		if (p.Weapon() === 0) itemList += "NONE!";
		else itemList += p.Weapon().name;

		itemList += "\r\n Armor:  ";
		if (p.Armor() === 0) itemList += "NONE!";
		else itemList += p.Armor().name;

		// Money
		itemList += "\r\n Money:  $" + p.money;
		
		// Quest Points
		itemList += "\r\n Quest:  " + p.questPoints + " Points";
		
		itemList +=
			"\r\n--------------------------------------------------------------------------------" +
			"</bold></white>";

		return itemList;
	}
	
	static lookAt(p, name) {
		const enemy = p.room.findEnemy(name);
		const tp = enemy.tp;

		if (enemy === 0) {
			return "<red><bold>You don't see that here!</bold></red>";
		}
		
		var msg = tp.description + "\r\n";
		
		if (tp.loot.length > 0 && p.questPerks.indexOf("SEELOOT") != -1) {
			msg = msg + "\r\n<cyan>" + enemy.name + " has been seen before with the following items:</cyan>\r\n";
			tp.loot.forEach(loot => {
				msg = msg + "<yellow>" + itemDb.findById(parseInt(loot.itemId)).name + "</yellow>";
				if (p.questPerks.indexOf("SEELOOTCHANCE") != -1) {
					msg = msg + "</yellow> (" + loot.chance + "% chance)<yellow>\r\n";
				}
				else {
					msg = msg + "\r\n";
				}
			});
		}

		return msg;
	}

	static printRoom(room, p) {
		var lines = "";
		var numExits = 0;
		for (var i=0;i<room.name.length;i++) {
			lines = lines + "-";
		}

		let desc = 
			`<bold><white>${lines}\r\n${room.name} [${room.id}]\r\n${lines}</white></bold>\r\n` +
			`<bold><magenta>${room.description}</magenta></bold>\r\n` +
			"<bold><green>  [Exits]: ";

		Direction.enums.forEach(dir => {
			if (room.rooms[dir] !== 0) {
				desc += dir.key + " ";
				numExits++;
			}
		});
		if (numExits == 0) {
			desc += "None!";
		}
		desc += "</green></bold>\r\n";

		// ---------------------------------
		// ITEMS
		// ---------------------------------
		let temp = "<bold><yellow>  [Items]: ";
		let count = 0;
		if (room.money > 0) {
			temp += "$" + room.money + ", ";
			count++;
		}

		room.items.forEach(item => {
			temp += item.name + ", ";
			count++;
		});

		if (count > 0) {
			temp = temp.substr(0, temp.length - 2);
			desc += temp + "</yellow></bold>\r\n";
		}

		// ---------------------------------
		// PEOPLE
		// ---------------------------------
		temp = "<bold><cyan> [People]: ";
		count = 0;

		room.players.forEach(player => {
			temp += player.name + ", ";
			count++;
		});

		if (count > 0) {
			temp = temp.substr(0, temp.length - 2);
			desc += temp + "</cyan></bold>\r\n";
		}

		// ---------------------------------
		// ENEMIES
		// ---------------------------------
		temp = "<bold><red>[Enemies]: ";
		count = 0;

		room.enemies.forEach(enemy => {
			temp += enemy.name;
			if (enemy.tp.hasFlag("NOATTACK")) {
				temp += " </red>(Friendly)<red>, ";
			}
			else if (questDb.getQuest().enemyId == enemy.id && questDb.getQuest().killed == false
					&& p.questPerks.indexOf("SEEQUESTTARGET") != -1) {
				temp += " </red>(Quest!)<red>, ";
			}
			else {
				temp += ", ";
			}
			count++;
		});

		if (count > 0) {
			temp = temp.substr(0, temp.length - 2);
			desc += temp + "</red></bold>\r\n";
		}

		return desc;
	}
	
}

function msToTime(duration) {
	  var milliseconds = parseInt((duration % 1000) / 100),
	    seconds = Math.floor((duration / 1000) % 60),
	    minutes = Math.floor((duration / (1000 * 60)) % 60),
	    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

	  hours = (hours < 10) ? "0" + hours : hours;
	  minutes = (minutes < 10) ? "0" + minutes : minutes;
	  seconds = (seconds < 10) ? "0" + seconds : seconds;

	  return hours + "h:" + minutes + "m:" + seconds + "s";
}

module.exports = Game;
