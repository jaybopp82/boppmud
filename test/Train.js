const net = require('net');
const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const Connection = require(path.join(__dirname, '..', 'src', 'Connection'));
const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));
const { playerDb, roomDb } = require(path.join(__dirname, '..', 'src', 'Databases'));

const { Attribute }
  = require(path.join(__dirname, '..', 'src', 'Attributes'));
const Player = require(path.join(__dirname, '..', 'src', 'Player'));
const Train = require(path.join(__dirname, '..', 'src', 'Train'));
const { wrap } = require(path.join(__dirname, '..', 'src', 'Util'));

describe("Train", () => {
  const conn = new Connection(new net.Socket(), telnet);
  const cc = telnet.cc;

  let player, train, stub;
  beforeEach(() => {
    player = new Player();
    train = new Train(conn, player);
    stub =
      sinon.stub(conn, "sendMessage").callsFake();
  });

  afterEach(() => {
    conn.sendMessage.restore();
  });

  it("should properly print stats", () => {
    const p = player;
    const expectedMsg = "<white><bold>" +
      "--------------------------------- Your Stats ----------------------------------\r\n" +
      "</bold>" +
      "Player:           " + p.name + "\r\n" +
      "Level:            " + p.level + "\r\n" +
      "Stat Points Left: " + p.statPoints + "\r\n" +
      "1) Strength:      " + p.GetAttr(Attribute.STRENGTH) + "\r\n" +
      "2) Health:        " + p.GetAttr(Attribute.HEALTH) + "\r\n" +
      "3) Agility:       " + p.GetAttr(Attribute.AGILITY) + "\r\n" +
      "<bold>" +
      "-------------------------------------------------------------------------------\r\n" +
      "Enter 1, 2, or 3 to add a stat point, or \"quit\" to enter the realm: " +
      "</bold></white>";
    train.printStats();
    expect(stub.getCall(0).args[0]).to.equal(expectedMsg);
    train.printStats(true);
    expect(stub.getCall(1).args[0]).to.
      equal(cc('clearscreen') + expectedMsg);
  });

  it("should properly enter", () => {
    const p = player;
    const spy = sinon.spy(train, 'printStats');
    let expectedMsg =
      "<magenta><bold>Welcome to SimpleMUD, " + p.name + "!" +
      "</bold>\r\n" +
      "You must train your character with your desired stats,\r\n" +
      "before you enter the realm.</magenta>\r\n\r\n";
    expect(p.newbie).to.be.true;
    train.enter();
    expect(stub.getCall(0).args[0]).to.equal(expectedMsg);
    expect(p.newbie).to.be.false;
    expect(spy.calledOnce).to.be.true;
    train.printStats.restore();
  });

  it("should properly handle quit", () => {
    const p = player;
    const stubSavePlayer = sinon.stub(playerDb, "savePlayer").callsFake();
    const spy = sinon.spy(train, "leave");
    conn.addHandler(train);
    train.handle("quit");
    expect(stubSavePlayer.calledOnce).to.be.true;
    expect(spy.calledOnce).to.be.true;
    conn.clearHandlers();
    train.leave.restore();
    playerDb.savePlayer.restore();
  });

  it("should properly handle hungup()", () => {
    const p = player;
    const stubLogout = sinon.stub(playerDb, 'logout').callsFake();

    train.hungup();
    expect(stubLogout.calledOnce).to.be.true;

    playerDb.logout.restore();
  });

  it("should properly handle stats assignment", () => {
    const p = player;
    const attr = p.GetAttr.bind(p);
    const spy = sinon.spy(p, "addToBaseAttr");
    const strength = attr(Attribute.STRENGTH);
    const health = attr(Attribute.HEALTH);
    const agility = attr(Attribute.AGILITY);
    const statsPoints = 5;

    train.handle('invalid');
    expect(spy.calledOnce).to.be.false;

    p.statPoints = -parseInt(Math.random() * 100); /// -99 to 0
    train.handle('1');
    train.handle('2');
    train.handle('3');
    expect(spy.calledOnce).to.be.false;
    p.statPoints = statsPoints;

    train.handle('1');
    expect(spy.calledOnce).to.be.true;
    expect(attr(Attribute.STRENGTH)).to.equal(strength + 1);
    expect(p.statPoints).to.equal(statsPoints - 1);
    train.handle('2');
    expect(attr(Attribute.HEALTH)).to.equal(health + 1);
    expect(p.statPoints).to.equal(statsPoints - 2);
    train.handle('3');
    expect(attr(Attribute.AGILITY)).to.equal(agility + 1);
    expect(p.statPoints).to.equal(statsPoints - 3);
  });

});
