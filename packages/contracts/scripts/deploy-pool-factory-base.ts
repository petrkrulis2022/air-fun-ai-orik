import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Deploy LiquidityPoolFactory on Base Sepolia
 */
async function deployLiquidityPoolFactoryBase() {
  console.log("Deploying LiquidityPoolFactory on Base Sepolia...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // Get AIR token address for Base Sepolia
  const airTokenAddress = process.env.BASE_AIR_TOKEN_ADDRESS;

  if (!airTokenAddress) {
    throw new Error("BASE_AIR_TOKEN_ADDRESS not set in .env file. Please deploy AIR token first.");
  }

  console.log("AIR Token Address:", airTokenAddress);

  // Deploy LiquidityPoolFactory
  const LiquidityPoolFactory = await ethers.getContractFactory("LiquidityPoolFactory");
  const factory = await LiquidityPoolFactory.deploy(airTokenAddress);
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();

  console.log("✅ LiquidityPoolFactory deployed on Base Sepolia!");
  console.log("Contract address:", factoryAddress);
  console.log("Graduation threshold: $69,000 USDC");
  console.log("\nAdd this to your .env file:");
  console.log(`BASE_LIQUIDITY_POOL_FACTORY_ADDRESS=${factoryAddress}`);

  // Verify contract on Basescan (optional)
  if (process.env.BASESCAN_API_KEY) {
    console.log("\nWaiting for block confirmations...");
    await factory.deploymentTransaction()?.wait(5);

    console.log("Verifying contract on Basescan...");
    try {
      await (
        await import("hardhat")
      ).run("verify:verify", {
        address: factoryAddress,
        constructorArguments: [airTokenAddress],
      });
      console.log("✅ Contract verified on Basescan");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("Contract already verified");
      } else {
        console.error("Verification error:", error);
      }
    }
  }
}

deployLiquidityPoolFactoryBase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying LiquidityPoolFactory:", error);
    process.exit(1);
  });
