const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs');
const jsonfile = require('jsonfile');

const { itemDb, enemyTpDb } =
  require(path.join(__dirname, '..', 'src', 'Databases'));

const { RoomType, Direction }
  = require(path.join(__dirname, '..', 'src', 'Attributes'));

const Room = require(path.join(__dirname, '..', 'src', 'Room'));
const Player = require(path.join(__dirname, '..', 'src', 'Player'));
const { Enemy } = require(path.join(__dirname, '..', 'src', 'Enemy'));

describe("Room", () => {

  let room;
  beforeEach(() => {
    room = new Room();
  });

  it("should properly intialize", () => {
    expect(room.id).to.equal(0);
    expect(room.name).to.equal("UNDEFINED");
    expect(room.type).to.equal(RoomType.PLAINROOM);
    expect(room.data).to.equal(0);
    expect(room.description).to.equal("UNDEFINED");

    expect(room.rooms[Direction.NORTH]).to.equal(0);
    expect(room.rooms[Direction.EAST]).to.equal(0);
    expect(room.rooms[Direction.SOUTH]).to.equal(0);
    expect(room.rooms[Direction.WEST]).to.equal(0);

    expect(room.spawnWhich).to.equal(0);
    expect(room.maxEnemies).to.equal(0);

    expect(room.items).to.be.an('array').that.is.empty;
    expect(room.money).to.equal(0);

    expect(room.players).to.be.an('array').that.is.empty;
    expect(room.enemies).to.be.an('array').that.is.empty;
  });

  it("should properly add/remove players", () => {
    const p = new Player();
    expect(room.players.length).to.equal(0);
    room.addPlayer(p);
    expect(room.players.length).to.equal(1);
    expect(room.players[0]).to.equal(p);
    room.removePlayer(p);
    expect(room.players.length).to.equal(0);
  });

  it("should properly add/remove items", () => {
    const knife = itemDb.findByNameFull("Short Sword");
    const armor = itemDb.findByNameFull("Chainmail Armor");
    expect(room.items.length).to.equal(0);
    room.addItem(knife);
    expect(room.items.length).to.equal(1);
    expect(room.items[0]).to.equal(knife);
    room.removeItem(knife);
    expect(room.items.length).to.equal(0);

    for (let i = 0; i < 32; i++) {
      room.addItem(knife);
    }
    expect(room.items.length).to.equal(32);
    room.addItem(armor);
    expect(room.items.length).to.equal(32);
    expect(room.items[31]).to.equal(armor);
  });

  it("should properly find items", () => {
    const knife = itemDb.findByNameFull("Rusty knife");
    const armor = itemDb.findByNameFull("Chainmail Armor");
    expect(room.findItem("knife")).to.equal(0);
    room.addItem(knife);
    expect(room.findItem("knife")).to.equal(knife);
    expect(room.findItem("Chainmail Armor")).to.equal(0);
    room.addItem(armor);
    expect(room.findItem("Chainmail Armor")).to.equal(armor);
  });

  it("should properly add/remove enemies", () => {
    const e = new Enemy();
    expect(room.enemies.length).to.equal(0);
    room.addEnemy(e);
    expect(room.enemies.length).to.equal(1);
    expect(room.enemies[0]).to.equal(e);
    room.removeEnemy(e);
    expect(room.enemies.length).to.equal(0);
  });

  it("should properly find enemies", () => {
    const bandit = new Enemy();
    bandit.loadTemplate(enemyTpDb.findByNameFull("Bandit"));
    const gangLeader = new Enemy();
    gangLeader.loadTemplate(enemyTpDb.findByNameFull("Gang Leader"));
    expect(room.findEnemy("Bandit")).to.equal(0);
    room.addEnemy(bandit);
    expect(room.findEnemy("Bandit")).to.equal(bandit);
    expect(room.findEnemy("Gang Leader")).to.equal(0);
    room.addEnemy(gangLeader);
    expect(room.findEnemy("Gang Leader")).to.equal(gangLeader);
  });

  it("should properly load template", () => {
    const templateObject = {
      "ID": "1",
      "NAME": "Test Room",
      "DESCRIPTION": "This is just a test room.",
      "TYPE": "PLAINROOM",
      "DATA": "1",
      "NORTH": "2",
      "EAST": "25",
      "SOUTH": "4",
      "WEST": "5",
      "ENEMY": "9",
      "MAXENEMIES": "3"
    };

    room.loadTemplate(templateObject);
    expect(room.id).to.equal(1);
    expect(room.name).to.equal("Test Room");
    expect(room.description).to.
      equal("This is just a test room.");
    expect(room.type).to.equal(RoomType.PLAINROOM);
    expect(room.data).to.equal(1);

    expect(room.rooms[Direction.NORTH]).to.equal(2);
    expect(room.rooms[Direction.EAST]).to.equal(25);
    expect(room.rooms[Direction.SOUTH]).to.equal(4);
    expect(room.rooms[Direction.WEST]).to.equal(5);

    expect(room.spawnWhich).to.equal(9);
    expect(room.maxEnemies).to.equal(3);
  });

  it("should proplery load data", () => {
    const dataObject = {
      "ROOMID": 123456,
      "ITEMS": "42 69 71",
      "MONEY": 456
    };
    room.loadData(dataObject, itemDb);
    expect(room.items[0].name).to.equal("Dagger");
    expect(room.items[1].name).to.equal("Rapier");
    expect(room.items[2].name).to.equal("Cutlass");
    expect(room.money).to.equal(456);

    expect(room.serialize()).to.include(dataObject);
  });


});
