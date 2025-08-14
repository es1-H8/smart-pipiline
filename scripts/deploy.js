const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting smart contract deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying contracts with account: ${deployer.address}`);
  console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);

  try {
    // Deploy SampleToken
    console.log("\n📦 Deploying SampleToken...");
    const SampleToken = await ethers.getContractFactory("SampleToken");
    const sampleToken = await SampleToken.deploy();
    await sampleToken.waitForDeployment();
    
    const sampleTokenAddress = await sampleToken.getAddress();
    console.log(`✅ SampleToken deployed to: ${sampleTokenAddress}`);
    
    // Get token details
    const tokenName = await sampleToken.name();
    const tokenSymbol = await sampleToken.symbol();
    const totalSupply = await sampleToken.totalSupply();
    console.log(`📊 Token: ${tokenName} (${tokenSymbol})`);
    console.log(`💰 Total Supply: ${ethers.formatEther(totalSupply)} tokens`);

    // Deploy TimelockWallet
    console.log("\n📦 Deploying TimelockWallet...");
    const TimelockWallet = await ethers.getContractFactory("TimelockWallet");
    const timelockWallet = await TimelockWallet.deploy();
    await timelockWallet.waitForDeployment();
    
    const timelockWalletAddress = await timelockWallet.getAddress();
    console.log(`✅ TimelockWallet deployed to: ${timelockWalletAddress}`);
    
    // Get wallet details
    const owner = await timelockWallet.owner();
    const minLockTime = await timelockWallet.MIN_LOCK_TIME();
    const maxLockTime = await timelockWallet.MAX_LOCK_TIME();
    console.log(`👑 Owner: ${owner}`);
    console.log(`⏰ Min Lock Time: ${minLockTime} seconds (${minLockTime / 3600} hours)`);
    console.log(`⏰ Max Lock Time: ${maxLockTime} seconds (${maxLockTime / (24 * 3600)} days)`);

    // Verify contracts on Etherscan (if not on local network)
    if (network.chainId !== 31337 && network.chainId !== 1337) {
      console.log("\n🔍 Waiting for contract verification...");
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      try {
        console.log("🔍 Verifying SampleToken on Etherscan...");
        await hre.run("verify:verify", {
          address: sampleTokenAddress,
          constructorArguments: [],
        });
        console.log("✅ SampleToken verified on Etherscan");
      } catch (error) {
        console.log("⚠️ SampleToken verification failed:", error.message);
      }

      try {
        console.log("🔍 Verifying TimelockWallet on Etherscan...");
        await hre.run("verify:verify", {
          address: timelockWalletAddress,
          constructorArguments: [],
        });
        console.log("✅ TimelockWallet verified on Etherscan");
      } catch (error) {
        console.log("⚠️ TimelockWallet verification failed:", error.message);
      }
    }

    // Deployment Summary
    console.log("\n🎉 Deployment Summary:");
    console.log("================================");
    console.log(`🌐 Network: ${network.name}`);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`📦 SampleToken: ${sampleTokenAddress}`);
    console.log(`📦 TimelockWallet: ${timelockWalletAddress}`);
    console.log("================================");

    // Save deployment addresses to a file for future reference
    const deploymentInfo = {
      network: network.name,
      chainId: network.chainId,
      deployer: deployer.address,
      contracts: {
        SampleToken: sampleTokenAddress,
        TimelockWallet: timelockWalletAddress
      },
      deploymentTime: new Date().toISOString()
    };

    const fs = require('fs');
    const deploymentPath = './deployment/deployment-info.json';
    
    // Ensure deployment directory exists
    if (!fs.existsSync('./deployment')) {
      fs.mkdirSync('./deployment', { recursive: true });
    }
    
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved to: ${deploymentPath}`);

    // Test basic functionality
    console.log("\n🧪 Testing basic functionality...");
    
    // Test SampleToken
    const mintAmount = ethers.parseEther("1000");
    await sampleToken.mint(deployer.address, mintAmount);
    console.log(`✅ Minted ${ethers.formatEther(mintAmount)} tokens to deployer`);
    
    // Test TimelockWallet
    const depositAmount = ethers.parseEther("1");
    await timelockWallet.deposit({ value: depositAmount });
    console.log(`✅ Deposited ${ethers.formatEther(depositAmount)} ETH to TimelockWallet`);
    
    console.log("✅ Basic functionality tests passed!");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Handle errors
main()
  .then(() => {
    console.log("\n🎉 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }); 