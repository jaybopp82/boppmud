const { expect } = require('chai');
const path = require('path');

const { ItemType } = require(path.join(__dirname, '..', 'src', 'Attributes'));
const { itemDb } = require(path.join(__dirname, '..', 'src', 'Databases'));

describe("ItemDatabase", () => {

  it("should properly load all items from file", () => {
    expect(itemDb.size()).to.equal(72);
  });

  it("should find item based on id", () => {
    const item = itemDb.findById(46);
    expect(item.name).to.equal("Leather Armor");
    expect(item.type).to.equal(ItemType.ARMOR);
  });

  it("should find full-match of item's name", () => {
    const item = itemDb.findByNameFull("Rapier");
    expect(item.name).to.equal("Rapier");
    expect(item.type).to.equal(ItemType.WEAPON);
  });

  it("should find partial-match of item's name", () => {
    const item = itemDb.findByNamePartial("Power");
    expect(item.name).to.equal("Chainmail Armor of Power");
    expect(item.type).to.equal(ItemType.ARMOR);
  });

});
