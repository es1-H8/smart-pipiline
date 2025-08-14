const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TimelockWallet", function () {
  let timelockWallet;
  let owner;
  let user1;
  let user2;
  let addrs;

  const MIN_LOCK_TIME = 3600; // 1 hour
  const MAX_LOCK_TIME = 365 * 24 * 3600; // 365 days
  const DEPOSIT_AMOUNT = ethers.parseEther("10");
  const WITHDRAWAL_AMOUNT = ethers.parseEther("5");

  beforeEach(async function () {
    [owner, user1, user2, ...addrs] = await ethers.getSigners();
    
    const TimelockWallet = await ethers.getContractFactory("TimelockWallet");
    timelockWallet = await TimelockWallet.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await timelockWallet.owner()).to.equal(owner.address);
    });

    it("Should start with zero balance", async function () {
      expect(await timelockWallet.getContractBalance()).to.equal(0);
    });

    it("Should not be paused initially", async function () {
      expect(await timelockWallet.isPaused()).to.be.false;
    });

    it("Should have correct constants", async function () {
      expect(await timelockWallet.MIN_LOCK_TIME()).to.equal(MIN_LOCK_TIME);
      expect(await timelockWallet.MAX_LOCK_TIME()).to.equal(MAX_LOCK_TIME);
    });
  });

  describe("Deposits", function () {
    it("Should accept ETH deposits", async function () {
      await timelockWallet.connect(user1).deposit({ value: DEPOSIT_AMOUNT });
      
      expect(await timelockWallet.getUserBalance(user1.address)).to.equal(DEPOSIT_AMOUNT);
      expect(await timelockWallet.getContractBalance()).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should emit Deposit event", async function () {
      await expect(timelockWallet.connect(user1).deposit({ value: DEPOSIT_AMOUNT }))
        .to.emit(timelockWallet, "Deposit")
        .withArgs(user1.address, DEPOSIT_AMOUNT);
    });

    it("Should fail if deposit amount is zero", async function () {
      await expect(
        timelockWallet.connect(user1).deposit({ value: 0 })
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should fail if contract is paused", async function () {
      await timelockWallet.pause();
      
      await expect(
        timelockWallet.connect(user1).deposit({ value: DEPOSIT_AMOUNT })
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should handle multiple deposits from same user", async function () {
      const secondDeposit = ethers.parseEther("5");
      
      await timelockWallet.connect(user1).deposit({ value: DEPOSIT_AMOUNT });
      await timelockWallet.connect(user1).deposit({ value: secondDeposit });
      
      expect(await timelockWallet.getUserBalance(user1.address)).to.equal(DEPOSIT_AMOUNT + secondDeposit);
    });

    it("Should handle deposits from multiple users", async function () {
      await timelockWallet.connect(user1).deposit({ value: DEPOSIT_AMOUNT });
      await timelockWallet.connect(user2).deposit({ value: DEPOSIT_AMOUNT });
      
      expect(await timelockWallet.getUserBalance(user1.address)).to.equal(DEPOSIT_AMOUNT);
      expect(await timelockWallet.getUserBalance(user2.address)).to.equal(DEPOSIT_AMOUNT);
      expect(await timelockWallet.getContractBalance()).to.equal(DEPOSIT_AMOUNT * 2n);
    });
  });

  describe("Withdrawal Requests", function () {
    beforeEach(async function () {
      await timelockWallet.connect(user1).deposit({ value: DEPOSIT_AMOUNT });
    });

    it("Should create withdrawal request", async function () {
      const lockTime = MIN_LOCK_TIME;
      
      await timelockWallet.connect(user1).requestWithdrawal(WITHDRAWAL_AMOUNT, lockTime);
      
      const requestCount = await timelockWallet.getWithdrawalRequestCount(user1.address);
      expect(requestCount).to.equal(1);
      
      const [amount, unlockTime, executed, cancelled] = await timelockWallet.getWithdrawalRequest(user1.address, 0);
      expect(amount).to.equal(WITHDRAWAL_AMOUNT);
      expect(unlockTime).to.be.greaterThan(await time.latest());
      expect(executed).to.be.false;
      expect(cancelled).to.be.false;
    });

    it("Should emit WithdrawalRequested event", async function () {
      const lockTime = MIN_LOCK_TIME;
      
      await expect(timelockWallet.connect(user1).requestWithdrawal(WITHDRAWAL_AMOUNT, lockTime))
        .to.emit(timelockWallet, "WithdrawalRequested")
        .withArgs(user1.address, WITHDRAWAL_AMOUNT, await time.latest() + lockTime, 0);
    });

    it("Should fail if amount is zero", async function () {
      const lockTime = MIN_LOCK_TIME;
      
      await expect(
        timelockWallet.connect(user1).requestWithdrawal(0, lockTime)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should fail if insufficient balance", async function () {
      const lockTime = MIN_LOCK_TIME;
      const exceedAmount = DEPOSIT_AMOUNT + ethers.parseEther("1");
      
      await expect(
        timelockWallet.connect(user1).requestWithdrawal(exceedAmount, lockTime)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should fail if lock time too short", async function () {
      const shortLockTime = MIN_LOCK_TIME - 1;
      
      await expect(
        timelockWallet.connect(user1).requestWithdrawal(WITHDRAWAL_AMOUNT, shortLockTime)
      ).to.be.revertedWith("Lock time too short");
    });

    it("Should fail if lock time too long", async function () {
      const longLockTime = MAX_LOCK_TIME + 1;
      
      await expect(
        timelockWallet.connect(user1).requestWithdrawal(WITHDRAWAL_AMOUNT, longLockTime)
      ).to.be.revertedWith("Lock time too long");
    });

    it("Should fail if contract is paused", async function () {
      await timelockWallet.pause();
      const lockTime = MIN_LOCK_TIME;
      
      await expect(
        timelockWallet.connect(user1).requestWithdrawal(WITHDRAWAL_AMOUNT, lockTime)
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should reduce user balance when request is made", async function () {
      const lockTime = MIN_LOCK_TIME;
      const initialBalance = await timelockWallet.getUserBalance(user1.address);
      
      await timelockWallet.connect(user1).requestWithdrawal(WITHDRAWAL_AMOUNT, lockTime);
      
      expect(await timelockWallet.getUserBalance(user1.address)).to.equal(initialBalance - WITHDRAWAL_AMOUNT);
    });
  });

  describe("Withdrawal Execution", function () {
    beforeEach(async function () {
      await timelockWallet.connect(user1).deposit({ value: DEPOSIT_AMOUNT });
      await timelockWallet.connect(user1).requestWithdrawal(WITHDRAWAL_AMOUNT, MIN_LOCK_TIME);
    });

    it("Should execute withdrawal after lock time", async function () {
      await time.increase(MIN_LOCK_TIME + 1);
      
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      await timelockWallet.connect(user1).executeWithdrawal(0);
      
      const [amount, unlockTime, executed, cancelled] = await timelockWallet.getWithdrawalRequest(user1.address, 0);
      expect(executed).to.be.true;
      
      // Check that ETH was transferred back
      const finalBalance = await ethers.provider.getBalance(user1.address);
      expect(finalBalance).to.be.greaterThan(initialBalance);
    });

    it("Should emit WithdrawalExecuted event", async function () {
      await time.increase(MIN_LOCK_TIME + 1);
      
      await expect(timelockWallet.connect(user1).executeWithdrawal(0))
        .to.emit(timelockWallet, "WithdrawalExecuted")
        .withArgs(user1.address, WITHDRAWAL_AMOUNT, 0);
    });

    it("Should fail if lock time not reached", async function () {
      await expect(
        timelockWallet.connect(user1).executeWithdrawal(0)
      ).to.be.revertedWith("Lock time not reached");
    });

    it("Should fail if request already executed", async function () {
      await time.increase(MIN_LOCK_TIME + 1);
      await timelockWallet.connect(user1).executeWithdrawal(0);
      
      await expect(
        timelockWallet.connect(user1).executeWithdrawal(0)
      ).to.be.revertedWith("Request already executed");
    });

    it("Should fail if request was cancelled", async function () {
      await timelockWallet.connect(user1).cancelWithdrawal(0);
      
      await expect(
        timelockWallet.connect(user1).executeWithdrawal(0)
      ).to.be.revertedWith("Request was cancelled");
    });

    it("Should fail if invalid request ID", async function () {
      await expect(
        timelockWallet.connect(user1).executeWithdrawal(999)
      ).to.be.revertedWith("Invalid request ID");
    });

    it("Should fail if contract is paused", async function () {
      await time.increase(MIN_LOCK_TIME + 1);
      await timelockWallet.pause();
      
      await expect(
        timelockWallet.connect(user1).executeWithdrawal(0)
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Withdrawal Cancellation", function () {
    beforeEach(async function () {
      await timelockWallet.connect(user1).deposit({ value: DEPOSIT_AMOUNT });
      await timelockWallet.connect(user1).requestWithdrawal(WITHDRAWAL_AMOUNT, MIN_LOCK_TIME);
    });

    it("Should cancel withdrawal request", async function () {
      await timelockWallet.connect(user1).cancelWithdrawal(0);
      
      const [amount, unlockTime, executed, cancelled] = await timelockWallet.getWithdrawalRequest(user1.address, 0);
      expect(cancelled).to.be.true;
    });

    it("Should emit WithdrawalCancelled event", async function () {
      await expect(timelockWallet.connect(user1).cancelWithdrawal(0))
        .to.emit(timelockWallet, "WithdrawalCancelled")
        .withArgs(user1.address, 0);
    });

    it("Should restore user balance when cancelled", async function () {
      const balanceBeforeRequest = await timelockWallet.getUserBalance(user1.address);
      
      await timelockWallet.connect(user1).cancelWithdrawal(0);
      
      expect(await timelockWallet.getUserBalance(user1.address)).to.equal(balanceBeforeRequest + WITHDRAWAL_AMOUNT);
    });

    it("Should fail if request already executed", async function () {
      await time.increase(MIN_LOCK_TIME + 1);
      await timelockWallet.connect(user1).executeWithdrawal(0);
      
      await expect(
        timelockWallet.connect(user1).cancelWithdrawal(0)
      ).to.be.revertedWith("Request already executed");
    });

    it("Should fail if request already cancelled", async function () {
      await timelockWallet.connect(user1).cancelWithdrawal(0);
      
      await expect(
        timelockWallet.connect(user1).cancelWithdrawal(0)
      ).to.be.revertedWith("Request already cancelled");
    });

    it("Should fail if lock time already reached", async function () {
      await time.increase(MIN_LOCK_TIME + 1);
      
      await expect(
        timelockWallet.connect(user1).cancelWithdrawal(0)
      ).to.be.revertedWith("Lock time already reached");
    });

    it("Should fail if invalid request ID", async function () {
      await expect(
        timelockWallet.connect(user1).cancelWithdrawal(999)
      ).to.be.revertedWith("Invalid request ID");
    });

    it("Should fail if contract is paused", async function () {
      await timelockWallet.pause();
      
      await expect(
        timelockWallet.connect(user1).cancelWithdrawal(0)
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Emergency Functions", function () {
    beforeEach(async function () {
      await timelockWallet.connect(user1).deposit({ value: DEPOSIT_AMOUNT });
    });

    it("Should allow owner to pause contract", async function () {
      await timelockWallet.pause();
      expect(await timelockWallet.isPaused()).to.be.true;
    });

    it("Should allow owner to unpause contract", async function () {
      await timelockWallet.pause();
      await timelockWallet.unpause();
      expect(await timelockWallet.isPaused()).to.be.false;
    });

    it("Should fail if non-owner tries to pause", async function () {
      await expect(
        timelockWallet.connect(user1).pause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail if non-owner tries to unpause", async function () {
      await timelockWallet.pause();
      await expect(
        timelockWallet.connect(user1).unpause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow emergency withdrawal when paused", async function () {
      await timelockWallet.pause();
      
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
      await timelockWallet.emergencyWithdrawal(DEPOSIT_AMOUNT);
      
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
      expect(finalOwnerBalance).to.be.greaterThan(initialOwnerBalance);
    });

    it("Should emit EmergencyWithdrawal event", async function () {
      await timelockWallet.pause();
      
      await expect(timelockWallet.emergencyWithdrawal(DEPOSIT_AMOUNT))
        .to.emit(timelockWallet, "EmergencyWithdrawal")
        .withArgs(owner.address, DEPOSIT_AMOUNT);
    });

    it("Should fail emergency withdrawal if not paused", async function () {
      await expect(
        timelockWallet.emergencyWithdrawal(DEPOSIT_AMOUNT)
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should fail emergency withdrawal if not owner", async function () {
      await timelockWallet.pause();
      
      await expect(
        timelockWallet.connect(user1).emergencyWithdrawal(DEPOSIT_AMOUNT)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail emergency withdrawal if amount exceeds balance", async function () {
      await timelockWallet.pause();
      
      await expect(
        timelockWallet.emergencyWithdrawal(DEPOSIT_AMOUNT + ethers.parseEther("1"))
      ).to.be.revertedWith("Insufficient contract balance");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await timelockWallet.connect(user1).deposit({ value: DEPOSIT_AMOUNT });
      await timelockWallet.connect(user1).requestWithdrawal(WITHDRAWAL_AMOUNT, MIN_LOCK_TIME);
    });

    it("Should return correct withdrawal request count", async function () {
      expect(await timelockWallet.getWithdrawalRequestCount(user1.address)).to.equal(1);
    });

    it("Should return correct user balance", async function () {
      expect(await timelockWallet.getUserBalance(user1.address)).to.equal(DEPOSIT_AMOUNT - WITHDRAWAL_AMOUNT);
    });

    it("Should return correct contract balance", async function () {
      expect(await timelockWallet.getContractBalance()).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should return correct withdrawal request details", async function () {
      const [amount, unlockTime, executed, cancelled] = await timelockWallet.getWithdrawalRequest(user1.address, 0);
      expect(amount).to.equal(WITHDRAWAL_AMOUNT);
      expect(executed).to.be.false;
      expect(cancelled).to.be.false;
    });

    it("Should fail for invalid request ID", async function () {
      await expect(
        timelockWallet.getWithdrawalRequest(user1.address, 999)
      ).to.be.revertedWith("Invalid request ID");
    });
  });

  describe("Receive Function", function () {
    it("Should accept ETH via receive function", async function () {
      await user1.sendTransaction({
        to: timelockWallet.address,
        value: DEPOSIT_AMOUNT
      });
      
      expect(await timelockWallet.getUserBalance(user1.address)).to.equal(DEPOSIT_AMOUNT);
    });
  });

  describe("Gas Optimization", function () {
    it("Should use reasonable gas for basic operations", async function () {
      const depositTx = await timelockWallet.connect(user1).deposit({ value: DEPOSIT_AMOUNT });
      const receipt = await depositTx.wait();
      
      // Gas should be reasonable (less than 100k for simple deposit)
      expect(receipt.gasUsed).to.be.lessThan(100000);
    });
  });
}); 