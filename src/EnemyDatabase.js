'use strict';

//This file contains the definition of
//both EnemyTemplateDatabase and
//EnemyDatabase classes

const path = require('path');
const jsonfile = require('jsonfile');

const EntityDatabase = require('./EntityDatabase');
const { EnemyTemplate, Enemy } = require('./Enemy');

const fileTemplate = path.join(__dirname, '..', 'data', 'enemies.json');
const fileData = path.join(__dirname, '..', 'data', 'enemiesdata.json');

class EnemyTemplateDatabase extends EntityDatabase {

	constructor() {
		super();
	}

	load() {
		this.map.clear();
		const dataArray = jsonfile.readFileSync(fileTemplate);
		dataArray.forEach(dataObject => {
			const template = new EnemyTemplate();
			template.load(dataObject);
			this.add(template);
		});
	}
	
	save() {
		const dataArray = [];
		for (let enemyTp of this.map.values()) {
			dataArray.push(enemyTp.serialize());
		}
		jsonfile.writeFileSync(fileTemplate, dataArray, {spaces: 2});
	}

	create() {
		const e = new EnemyTemplate();
		e.name = "New Enemy";
		e.description = "I'm an enemy!";
		this.add(e);
		return e;
	}

}

class EnemyDatabase extends EntityDatabase {

	constructor() {
		super();
	}

	create(template, room) {
		const e = new Enemy();
		e.loadTemplate(template);
		e.room = room;
		room.addEnemy(e);
		this.add(e);
		return e;
	}

	delete(enemy) {
		enemy.room.removeEnemy(enemy);
		this.map.delete(enemy.id);
	}

	load(enemyTpDb, roomDb) {
		this.map.clear();
		const dataArray = jsonfile.readFileSync(fileData);
		dataArray.forEach(dataObject => {
			const enemy = new Enemy();
			enemy.loadData(dataObject, enemyTpDb, roomDb);
			enemy.room.addEnemy(enemy);
			this.add(enemy);
		});
	}

	save() {
		const dataArray = [];
		for (let enemy of this.map.values()) {
			dataArray.push(enemy.serialize());
		}
		jsonfile.writeFileSync(fileData, dataArray, {spaces: 2});
	}
	
	getRandomEnemy() {
		return this.map.get(Math.floor(Math.random() * this.size())+1);
	}
	
	getCountByEnemyId(id) {
		var count = 0;
		for (let enemy of this.map.values()) {
			if (enemy.tp.id == parseInt(id)) {
				count++;
			}
		}
		return count;
	}

}

module.exports = { EnemyTemplateDatabase, EnemyDatabase };
