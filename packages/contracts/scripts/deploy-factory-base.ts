import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Deploy MemecoinFactory on Base Sepolia
 */
async function deployMemecoinFactoryBase() {
  console.log("Deploying MemecoinFactory on Base Sepolia...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // Get USDC address for Base Sepolia (testnet)
  // Base Sepolia USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
  const usdcAddress = process.env.BASE_USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

  // Platform wallet address
  const platformWallet = process.env.PLATFORM_WALLET_ADDRESS || deployer.address;

  console.log("USDC Address:", usdcAddress);
  console.log("Platform Wallet:", platformWallet);

  // Deploy MemecoinFactory
  const MemecoinFactory = await ethers.getContractFactory("MemecoinFactory");
  const factory = await MemecoinFactory.deploy(usdcAddress, platformWallet);
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();

  console.log("✅ MemecoinFactory deployed on Base Sepolia!");
  console.log("Contract address:", factoryAddress);
  console.log("\nAdd this to your .env file:");
  console.log(`BASE_MEMECOIN_FACTORY_ADDRESS=${factoryAddress}`);

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
        constructorArguments: [usdcAddress, platformWallet],
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

deployMemecoinFactoryBase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying MemecoinFactory:", error);
    process.exit(1);
  });
