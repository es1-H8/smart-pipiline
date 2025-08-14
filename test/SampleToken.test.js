const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SampleToken", function () {
  let sampleToken;
  let owner;
  let user1;
  let user2;
  let addrs;

  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1 million tokens
  const MAX_SUPPLY = ethers.parseEther("10000000"); // 10 million tokens

  beforeEach(async function () {
    [owner, user1, user2, ...addrs] = await ethers.getSigners();
    
    const SampleToken = await ethers.getContractFactory("SampleToken");
    sampleToken = await SampleToken.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await sampleToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await sampleToken.balanceOf(owner.address);
      expect(await sampleToken.totalSupply()).to.equal(ownerBalance);
      expect(ownerBalance).to.equal(INITIAL_SUPPLY);
    });

    it("Should set the correct token name and symbol", async function () {
      expect(await sampleToken.name()).to.equal("SampleToken");
      expect(await sampleToken.symbol()).to.equal("SMPL");
    });

    it("Should set the correct initial supply", async function () {
      expect(await sampleToken.INITIAL_SUPPLY()).to.equal(INITIAL_SUPPLY);
    });

    it("Should set the correct max supply", async function () {
      expect(await sampleToken.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
    });
  });

  describe("Basic ERC20 Functions", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("1000");
      
      await sampleToken.transfer(user1.address, transferAmount);
      expect(await sampleToken.balanceOf(user1.address)).to.equal(transferAmount);
      
      await sampleToken.transfer(user2.address, transferAmount);
      expect(await sampleToken.balanceOf(user2.address)).to.equal(transferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await sampleToken.balanceOf(owner.address);
      
      await expect(
        sampleToken.connect(user1).transfer(owner.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
      
      expect(await sampleToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await sampleToken.balanceOf(owner.address);
      const transferAmount = ethers.parseEther("1000");

      await sampleToken.transfer(user1.address, transferAmount);
      expect(await sampleToken.balanceOf(owner.address)).to.equal(initialOwnerBalance - transferAmount);
      expect(await sampleToken.balanceOf(user1.address)).to.equal(transferAmount);
    });

    it("Should emit Transfer events", async function () {
      const transferAmount = ethers.parseEther("1000");
      
      await expect(sampleToken.transfer(user1.address, transferAmount))
        .to.emit(sampleToken, "Transfer")
        .withArgs(owner.address, user1.address, transferAmount);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      const initialSupply = await sampleToken.totalSupply();
      
      await sampleToken.mint(user1.address, mintAmount);
      
      expect(await sampleToken.totalSupply()).to.equal(initialSupply + mintAmount);
      expect(await sampleToken.balanceOf(user1.address)).to.equal(mintAmount);
    });

    it("Should emit TokensMinted event", async function () {
      const mintAmount = ethers.parseEther("1000");
      
      await expect(sampleToken.mint(user1.address, mintAmount))
        .to.emit(sampleToken, "TokensMinted")
        .withArgs(user1.address, mintAmount);
    });

    it("Should fail if non-owner tries to mint", async function () {
      const mintAmount = ethers.parseEther("1000");
      
      await expect(
        sampleToken.connect(user1).mint(user2.address, mintAmount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail if minting would exceed max supply", async function () {
      const currentSupply = await sampleToken.totalSupply();
      const remainingSupply = MAX_SUPPLY - currentSupply;
      const exceedAmount = remainingSupply + ethers.parseEther("1");
      
      await expect(
        sampleToken.mint(user1.address, exceedAmount)
      ).to.be.revertedWith("Exceeds max supply");
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      // Transfer some tokens to user1 for testing
      await sampleToken.transfer(user1.address, ethers.parseEther("1000"));
    });

    it("Should allow users to burn their own tokens", async function () {
      const burnAmount = ethers.parseEther("100");
      const initialBalance = await sampleToken.balanceOf(user1.address);
      const initialSupply = await sampleToken.totalSupply();
      
      await sampleToken.connect(user1).burn(burnAmount);
      
      expect(await sampleToken.balanceOf(user1.address)).to.equal(initialBalance - burnAmount);
      expect(await sampleToken.totalSupply()).to.equal(initialSupply - burnAmount);
    });

    it("Should emit TokensBurned event", async function () {
      const burnAmount = ethers.parseEther("100");
      
      await expect(sampleToken.connect(user1).burn(burnAmount))
        .to.emit(sampleToken, "TokensBurned")
        .withArgs(user1.address, burnAmount);
    });

    it("Should fail if user tries to burn more than they have", async function () {
      const userBalance = await sampleToken.balanceOf(user1.address);
      const burnAmount = userBalance + ethers.parseEther("1");
      
      await expect(
        sampleToken.connect(user1).burn(burnAmount)
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });

    it("Should allow burning with allowance", async function () {
      const burnAmount = ethers.parseEther("100");
      const initialBalance = await sampleToken.balanceOf(user1.address);
      const initialSupply = await sampleToken.totalSupply();
      
      await sampleToken.connect(user1).approve(owner.address, burnAmount);
      await sampleToken.burnFrom(user1.address, burnAmount);
      
      expect(await sampleToken.balanceOf(user1.address)).to.equal(initialBalance - burnAmount);
      expect(await sampleToken.totalSupply()).to.equal(initialSupply - burnAmount);
    });
  });

  describe("Pausing", function () {
    it("Should allow owner to pause the contract", async function () {
      await sampleToken.pause();
      expect(await sampleToken.paused()).to.be.true;
    });

    it("Should emit ContractPaused event", async function () {
      await expect(sampleToken.pause())
        .to.emit(sampleToken, "ContractPaused")
        .withArgs(owner.address);
    });

    it("Should allow owner to unpause the contract", async function () {
      await sampleToken.pause();
      await sampleToken.unpause();
      expect(await sampleToken.paused()).to.be.false;
    });

    it("Should emit ContractUnpaused event", async function () {
      await sampleToken.pause();
      await expect(sampleToken.unpause())
        .to.emit(sampleToken, "ContractUnpaused")
        .withArgs(owner.address);
    });

    it("Should fail if non-owner tries to pause", async function () {
      await expect(
        sampleToken.connect(user1).pause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail if non-owner tries to unpause", async function () {
      await sampleToken.pause();
      await expect(
        sampleToken.connect(user1).unpause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should prevent transfers when paused", async function () {
      await sampleToken.pause();
      
      await expect(
        sampleToken.transfer(user1.address, ethers.parseEther("100"))
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should prevent minting when paused", async function () {
      await sampleToken.pause();
      
      await expect(
        sampleToken.mint(user1.address, ethers.parseEther("100"))
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should prevent burning when paused", async function () {
      await sampleToken.transfer(user1.address, ethers.parseEther("100"));
      await sampleToken.pause();
      
      await expect(
        sampleToken.connect(user1).burn(ethers.parseEther("50"))
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("View Functions", function () {
    it("Should return correct total supply", async function () {
      expect(await sampleToken.getTotalSupply()).to.equal(await sampleToken.totalSupply());
    });

    it("Should return correct user balance", async function () {
      const transferAmount = ethers.parseEther("1000");
      await sampleToken.transfer(user1.address, transferAmount);
      
      expect(await sampleToken.getBalance(user1.address)).to.equal(transferAmount);
    });

    it("Should return correct pause status", async function () {
      expect(await sampleToken.isPaused()).to.be.false;
      
      await sampleToken.pause();
      expect(await sampleToken.isPaused()).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero amount transfers", async function () {
      const initialBalance = await sampleToken.balanceOf(owner.address);
      
      await sampleToken.transfer(user1.address, 0);
      
      expect(await sampleToken.balanceOf(owner.address)).to.equal(initialBalance);
      expect(await sampleToken.balanceOf(user1.address)).to.equal(0);
    });

    it("Should handle minting to zero address", async function () {
      const mintAmount = ethers.parseEther("100");
      const initialSupply = await sampleToken.totalSupply();
      
      await sampleToken.mint(ethers.ZeroAddress, mintAmount);
      
      expect(await sampleToken.totalSupply()).to.equal(initialSupply + mintAmount);
      expect(await sampleToken.balanceOf(ethers.ZeroAddress)).to.equal(mintAmount);
    });

    it("Should handle burning from zero address", async function () {
      const burnAmount = ethers.parseEther("100");
      
      // This should fail as zero address has no balance
      await expect(
        sampleToken.burnFrom(ethers.ZeroAddress, burnAmount)
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });
  });

  describe("Gas Optimization", function () {
    it("Should use reasonable gas for basic operations", async function () {
      const transferTx = await sampleToken.transfer(user1.address, ethers.parseEther("100"));
      const receipt = await transferTx.wait();
      
      // Gas should be reasonable (less than 100k for simple transfer)
      expect(receipt.gasUsed).to.be.lessThan(100000);
    });
  });
}); 