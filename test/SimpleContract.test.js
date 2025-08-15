const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleContract", function () {
  let SimpleContract;
  let simpleContract;
  let owner;

  beforeEach(async function () {
    SimpleContract = await ethers.getContractFactory("SimpleContract");
    [owner] = await ethers.getSigners();
    simpleContract = await SimpleContract.deploy();
    await simpleContract.deployed();
  });

  describe("Deployment", function () {
    it("Should set initial value to 0", async function () {
      expect(await simpleContract.getValue()).to.equal(0);
    });
  });

  describe("Value Management", function () {
    it("Should allow setting value", async function () {
      await simpleContract.setValue(42);
      expect(await simpleContract.getValue()).to.equal(42);
    });

    it("Should allow changing value", async function () {
      await simpleContract.setValue(100);
      expect(await simpleContract.getValue()).to.equal(100);
    });
  });
}); 