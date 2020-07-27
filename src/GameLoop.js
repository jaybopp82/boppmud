'use strict';

const jsonfile = require('jsonfile');
const path = require('path');

const { Attribute } = require('./Attributes');
const AuctionItem = require('./AuctionItem');
const Item = require('./Item');
const Player = require('./Player');

const Util = require('./Util');
const DB = require('./Databases');
const Game = require('./Game');
const { enemyDb, itemDb } =
	require('./Databases');

const timer = Game.getTimer();
const seconds = Util.seconds;
const minutes = Util.minutes;

const DBSAVETIME = minutes( 15 );
const ROUNDTIME  = seconds( 1 );
const AUCTIME    = minutes( 1 );
const REGENTIME  = minutes( 5 );
const HEALTIME   = seconds( 5 );
const RANDOMAUCTIME = minutes( 360 ); //6 hours
const NEXTQUEST  = minutes( 60 );
const MOBWANDER = minutes( 1 );

const file = path.join(__dirname, '..', 'data', 'gamedata.json');

class GameLoop {
	constructor() {
		this.loadDatabases();
	}

	load() {
		const isEmpty = (obj) => {
			return Object.keys(obj).length === 0 && obj.constructor === Object;
		};
		const dataObject = jsonfile.readFileSync(file);
		if (!isEmpty(dataObject)) {
			const gameTime = parseInt(dataObject["GAMETIME"]);
			timer.reset(gameTime);
			this.saveDbTime = parseInt(dataObject["SAVEDATABASES"]);
			this.nextRound = parseInt(dataObject["NEXTROUND"]);
			this.nextRegen = parseInt(dataObject["NEXTREGEN"]);
			this.nextHeal = parseInt(dataObject["NEXTHEAL"]);
			this.aucTime = parseInt(dataObject["AUCTIME"]);
			this.randomAucTime = parseInt(dataObject["RANDOMAUCTIME"]);
			this.nextQuest = parseInt(dataObject["NEXTQUEST"]);
			this.mobWander = parseInt(dataObject["MOBWANDER"]);
		} else {
			timer.reset();
			this.saveDbTime = DBSAVETIME;
			this.nextRound = ROUNDTIME;
			this.nextRegen = REGENTIME;
			this.nextHeal = HEALTIME;
			this.aucTime = AUCTIME;
			this.randomAucTime = RANDOMAUCTIME;
			this.nextQuest = NEXTQUEST;
			this.mobWander = MOBWANDER;
		}
		Game.setIsRunning(true);
	}

	save() {
		const dataObject = {
				"GAMETIME": Game.getTimer().getMS(),
				"SAVEDATABASES": this.saveDbTime,
				"NEXTROUND": this.nextRound,
				"NEXTREGEN": this.nextRegen,
				"NEXTHEAL": this.nextHeal,
				"AUCTIME": this.aucTime,
				"RANDOMAUCTIME": this.randomAucTime,
				"NEXTQUEST": this.nextQuest,
				"MOBWANDER": this.mobWander
		}
		jsonfile.writeFileSync(file, dataObject, {spaces: 2});
	}

	loadDatabases() {
		this.load();
		DB.loadDatabases();
	}

	saveDatabases() {
		this.save();
		DB.saveDatabases();
	}

	loop() {
		if (timer.getMS() >= this.nextRound) {
			this.performRound();
			this.nextRound += ROUNDTIME;
		}
		if (timer.getMS() >= this.nextRegen) {
			this.performRegen();
			this.nextRegen = timer.getMS() + REGENTIME;
		}
		if (timer.getMS() >= this.nextHeal) {
			this.performHeal();
			this.nextHeal = timer.getMS() + HEALTIME;
		}
		if (timer.getMS() >= this.saveDbTime) {
			this.saveDatabases();
			this.saveDbTime = timer.getMS() + DBSAVETIME;
		}
		if (timer.getMS() >= this.aucTime) {
			this.endAuctions();
			this.aucTime = timer.getMS() + AUCTIME;
		}
		if (timer.getMS() >= this.randomAucTime) {
			this.startRandomAuction();
			this.randomAucTime = timer.getMS() + RANDOMAUCTIME;
		}
		if (timer.getMS() >= this.nextQuest) {
			this.startNextQuest();
			this.nextQuest = timer.getMS() + NEXTQUEST;
		}
		if (timer.getMS() >= this.mobWander) {
			this.makeMobsWander();
			this.mobWander = timer.getMS() + MOBWANDER;
		}
	}

	makeMobsWander() {
		for (let room of DB.roomDb.map.values()) {
			if (room.enemies.length >= 1) {
				room.enemies.forEach(enemy => {
					Game.enemyWander(enemy);
				})
			}
		}
	}

	startNextQuest() {
		Game.beginNextQuest();
	}

	startRandomAuction() {
		Game.auctionRandomItem();
	}

	endAuctions() {
		const now = timer.getMS();
		for (let auc of DB.auctionDb.map.values()) {
			if (((parseInt(auc.dateStarted) + 86400000) - Date.now()) <= 0) {
				Game.endAuction(auc);
			}
		}
	}

	performRound() {
		const now = timer.getMS();
		for(let enemy of DB.enemyDb.map.values()) {
			if (now >= enemy.nextAttackTime &&
					enemy.room.players.length > 0) {
				Game.enemyAttack(enemy);
			}
		}
	}

	performRegen() {
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
	}

	performHeal() {
		for (let p of DB.playerDb.map.values()) {
			if (p.active) {
				p.addHitPoints(p.GetAttr(Attribute.HPREGEN));
				//p.printStatbar();
			}
		}
	}

}

module.exports = GameLoop;
