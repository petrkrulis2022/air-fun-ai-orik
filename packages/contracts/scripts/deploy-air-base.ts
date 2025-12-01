import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Deploy AIR token on Base Sepolia
 */
async function deployAIRTokenBase() {
  console.log("Deploying AIR token on Base Sepolia...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // Deploy AIR token
  const AIRToken = await ethers.getContractFactory("AIRToken");
  const airToken = await AIRToken.deploy();
  await airToken.waitForDeployment();

  const airTokenAddress = await airToken.getAddress();

  console.log("✅ AIR token deployed on Base Sepolia!");
  console.log("Contract address:", airTokenAddress);
  console.log("\nAdd this to your .env file:");
  console.log(`BASE_AIR_TOKEN_ADDRESS=${airTokenAddress}`);

  // Verify contract on Basescan (optional)
  if (process.env.BASESCAN_API_KEY) {
    console.log("\nWaiting for block confirmations...");
    await airToken.deploymentTransaction()?.wait(5);

    console.log("Verifying contract on Basescan...");
    try {
      await (
        await import("hardhat")
      ).run("verify:verify", {
        address: airTokenAddress,
        constructorArguments: [],
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

deployAIRTokenBase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying AIR token:", error);
    process.exit(1);
  });
