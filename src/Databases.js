'use strict';
const path = require('path');
const ItemDatabase = require(path.join(__dirname, '..', 'src', 'ItemDatabase'));
const PlayerDatabase = require(path.join(__dirname, '..', 'src', 'PlayerDatabase'));
const RoomDatabase = require(path.join(__dirname, '..', 'src', 'RoomDatabase'));
const StoreDatabase = require(path.join(__dirname, '..', 'src', 'StoreDatabase'));
const AuctionDatabase = require(path.join(__dirname, '..', 'src', 'AuctionDatabase'));
const QuestDatabase = require(path.join(__dirname, '..', 'src', 'QuestDatabase'));
const AreaDatabase = require(path.join(__dirname, '..', 'src', 'AreaDatabase'));
const HelpDatabase = require(path.join(__dirname, '..', 'src', 'HelpDatabase'));
const SocialDatabase = require(path.join(__dirname, '..', 'src', 'SocialDatabase'));
const { EnemyTemplateDatabase, EnemyDatabase} =
  require(path.join(__dirname, '..', 'src', 'EnemyDatabase'));

const itemDb = new ItemDatabase();
const playerDb = new PlayerDatabase();
const roomDb = new RoomDatabase();
const storeDb = new StoreDatabase();
const enemyTpDb = new EnemyTemplateDatabase();
const enemyDb = new EnemyDatabase();
const auctionDb = new AuctionDatabase();
const questDb = new QuestDatabase();
const areaDb = new AreaDatabase();
const helpDb = new HelpDatabase();
const socialDb = new SocialDatabase();

const loadDatabases = () => {
  itemDb.load();
  playerDb.load(itemDb);
  roomDb.loadTemplates();
  roomDb.loadData(itemDb);
  storeDb.load(itemDb);
  enemyTpDb.load();
  enemyDb.load(enemyTpDb, roomDb);
  auctionDb.load();
  questDb.load();
  areaDb.load();
  helpDb.load();
  socialDb.load();
};

const saveDatabases = () => {
  playerDb.save();
  roomDb.saveData();
  enemyDb.save();
  enemyTpDb.save();
  itemDb.saveData();
  auctionDb.save();
  questDb.save();
  areaDb.saveData();
  helpDb.save();
  storeDb.save();
}

loadDatabases();

module.exports = { itemDb, playerDb, roomDb,
                   storeDb, enemyTpDb, enemyDb,
                   loadDatabases, saveDatabases,
                   auctionDb, questDb, areaDb,
                   helpDb, socialDb };
