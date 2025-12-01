import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Deploy LiquidityPoolFactory on Hedera testnet
 *
 * Note: This script uses ethers.js for deployment.
 * For Hedera-specific features (HTS tokens), you may need to use Hedera SDK.
 * This deployment assumes AIR token is an ERC-20 compatible token on Hedera.
 */
async function deployLiquidityPoolFactoryHedera() {
  console.log("Deploying LiquidityPoolFactory on Hedera testnet...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "HBAR"
  );

  // Get AIR token address for Hedera testnet
  const airTokenAddress = process.env.HEDERA_AIR_TOKEN_ADDRESS;

  if (!airTokenAddress) {
    throw new Error(
      "HEDERA_AIR_TOKEN_ADDRESS not set in .env file. Please deploy AIR token first."
    );
  }

  console.log("AIR Token Address:", airTokenAddress);

  // Deploy LiquidityPoolFactory
  const LiquidityPoolFactory = await ethers.getContractFactory("LiquidityPoolFactory");
  const factory = await LiquidityPoolFactory.deploy(airTokenAddress);
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();

  console.log("✅ LiquidityPoolFactory deployed on Hedera testnet!");
  console.log("Contract address:", factoryAddress);
  console.log("Graduation threshold: $69,000 USDC");
  console.log("\nAdd this to your .env file:");
  console.log(`HEDERA_LIQUIDITY_POOL_FACTORY_ADDRESS=${factoryAddress}`);

  console.log(
    "\n⚠️  Note: For Hedera-specific verification, use HashScan or Hedera Mirror Node Explorer"
  );
  console.log("HashScan Testnet:", `https://hashscan.io/testnet/contract/${factoryAddress}`);
}

deployLiquidityPoolFactoryHedera()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying LiquidityPoolFactory:", error);
    process.exit(1);
  });
