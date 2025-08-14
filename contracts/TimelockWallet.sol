// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TimelockWallet
 * @dev A time-locked wallet contract for testing CI/CD pipeline
 * Features: Time-based withdrawals, emergency pause, ownership control
 */
contract TimelockWallet is ReentrancyGuard, Pausable, Ownable {
    struct WithdrawalRequest {
        uint256 amount;
        uint256 unlockTime;
        bool executed;
        bool cancelled;
    }

    mapping(address => WithdrawalRequest[]) public withdrawalRequests;
    mapping(address => uint256) public balances;
    
    uint256 public constant MIN_LOCK_TIME = 1 hours;
    uint256 public constant MAX_LOCK_TIME = 365 days;
    
    event Deposit(address indexed depositor, uint256 amount);
    event WithdrawalRequested(address indexed requester, uint256 amount, uint256 unlockTime, uint256 requestId);
    event WithdrawalExecuted(address indexed requester, uint256 amount, uint256 requestId);
    event WithdrawalCancelled(address indexed requester, uint256 requestId);
    event EmergencyWithdrawal(address indexed owner, uint256 amount);

    /**
     * @dev Constructor
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Deposit ETH to the wallet
     */
    function deposit() external payable whenNotPaused {
        require(msg.value > 0, "Amount must be greater than 0");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev Request a withdrawal with time lock
     * @param amount Amount to withdraw
     * @param lockTime Time to lock the withdrawal
     */
    function requestWithdrawal(uint256 amount, uint256 lockTime) external whenNotPaused nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        require(lockTime >= MIN_LOCK_TIME, "Lock time too short");
        require(lockTime <= MAX_LOCK_TIME, "Lock time too long");

        uint256 unlockTime = block.timestamp + lockTime;
        uint256 requestId = withdrawalRequests[msg.sender].length;

        withdrawalRequests[msg.sender].push(WithdrawalRequest({
            amount: amount,
            unlockTime: unlockTime,
            executed: false,
            cancelled: false
        }));

        balances[msg.sender] -= amount;
        emit WithdrawalRequested(msg.sender, amount, unlockTime, requestId);
    }

    /**
     * @dev Execute a withdrawal request after lock time
     * @param requestId ID of the withdrawal request
     */
    function executeWithdrawal(uint256 requestId) external whenNotPaused nonReentrant {
        require(requestId < withdrawalRequests[msg.sender].length, "Invalid request ID");
        
        WithdrawalRequest storage request = withdrawalRequests[msg.sender][requestId];
        require(!request.executed, "Request already executed");
        require(!request.cancelled, "Request was cancelled");
        require(block.timestamp >= request.unlockTime, "Lock time not reached");

        request.executed = true;
        
        (bool success, ) = msg.sender.call{value: request.amount}("");
        require(success, "Transfer failed");

        emit WithdrawalExecuted(msg.sender, request.amount, requestId);
    }

    /**
     * @dev Cancel a withdrawal request before execution
     * @param requestId ID of the withdrawal request
     */
    function cancelWithdrawal(uint256 requestId) external whenNotPaused {
        require(requestId < withdrawalRequests[msg.sender].length, "Invalid request ID");
        
        WithdrawalRequest storage request = withdrawalRequests[msg.sender][requestId];
        require(!request.executed, "Request already executed");
        require(!request.cancelled, "Request already cancelled");
        require(block.timestamp < request.unlockTime, "Lock time already reached");

        request.cancelled = true;
        balances[msg.sender] += request.amount;

        emit WithdrawalCancelled(msg.sender, requestId);
    }

    /**
     * @dev Emergency withdrawal by owner (bypasses time lock)
     * @param amount Amount to withdraw
     */
    function emergencyWithdrawal(uint256 amount) external onlyOwner whenPaused {
        require(amount <= address(this).balance, "Insufficient contract balance");
        
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Transfer failed");

        emit EmergencyWithdrawal(owner(), amount);
    }

    /**
     * @dev Pause the contract
     * Only owner can call this function
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     * Only owner can call this function
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Get withdrawal request details
     * @param user Address of the user
     * @param requestId ID of the request
     * @return amount, unlockTime, executed, cancelled
     */
    function getWithdrawalRequest(address user, uint256 requestId) 
        external 
        view 
        returns (uint256 amount, uint256 unlockTime, bool executed, bool cancelled) 
    {
        require(requestId < withdrawalRequests[user].length, "Invalid request ID");
        WithdrawalRequest storage request = withdrawalRequests[user][requestId];
        return (request.amount, request.unlockTime, request.executed, request.cancelled);
    }

    /**
     * @dev Get number of withdrawal requests for a user
     * @param user Address of the user
     * @return Number of requests
     */
    function getWithdrawalRequestCount(address user) external view returns (uint256) {
        return withdrawalRequests[user].length;
    }

    /**
     * @dev Get user's balance
     * @param user Address of the user
     * @return User's balance
     */
    function getUserBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    /**
     * @dev Get contract's total balance
     * @return Total balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Check if contract is paused
     * @return True if paused, false otherwise
     */
    function isPaused() external view returns (bool) {
        return paused();
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {
        deposit();
    }
} 