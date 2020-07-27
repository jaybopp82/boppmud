const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const { itemDb } = require(path.join(__dirname, '..', 'src', 'Databases'));
const Store = require(path.join(__dirname, '..', 'src', 'Store'));

describe("Store", () => {

  const store = new Store();

  it("should properly intialize", () => {
    expect(store.id).to.equal(0);
    expect(store.name).to.equal("UNDEFINED");
    expect(store.items).to.be.empty;
  });

  it("should properly load from dataObject", () => {
    const dataObject = {
      "ID":"1",
      "NAME":"Test Store",
      "ITEMS": "42 52"
    };

    const dagger = itemDb.findByNameFull("Dagger");
    const armor = itemDb.
      findByNameFull("Leather Armor of Regeneration")

    store.load(dataObject, itemDb);

    expect(store.id).to.equal(1);
    expect(store.name).to.equal("Test Store");
    expect(store.items).to.have.
      members([dagger, armor]);

  });

  it("should properly find items", () => {
    const knife = itemDb.findByNameFull("Rusty knife");
    const armor = itemDb.findByNameFull("Chainmail Armor");
    expect(store.findItem("knife")).to.equal(0);
    store.items.push(knife);
    expect(store.findItem("knife")).to.equal(knife);
    expect(store.findItem("Chainmail Armor")).to.equal(0);
    store.items.push(armor);
    expect(store.findItem("Chainmail Armor")).to.equal(armor);
  });

});
