const hre = require("hardhat");

async function main() {
  console.log("Deploying SimpleContract...");
  
  const SimpleContract = await hre.ethers.getContractFactory("SimpleContract");
  const simpleContract = await SimpleContract.deploy();
  
  await simpleContract.deployed();
  
  console.log("SimpleContract deployed to:", simpleContract.address);
  
  // Set initial value
  const tx = await simpleContract.setValue(42);
  await tx.wait();
  
  console.log("Initial value set to 42");
  console.log("Current value:", await simpleContract.getValue());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 