import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Deploy LiquidityPoolFactory on Hedera testnet using JSON-RPC relay
 */
async function deployLiquidityPoolFactoryHederaRPC() {
  console.log("Deploying LiquidityPoolFactory on Hedera testnet via JSON-RPC...");

  // Connect to Hedera testnet JSON-RPC relay
  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api", {
    chainId: 296,
    name: "hedera-testnet",
  });
  const wallet = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY!, provider);

  console.log("Deploying with account:", wallet.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await provider.getBalance(wallet.address)),
    "HBAR"
  );

  // Get AIR token address for Hedera testnet
  let airTokenAddress = process.env.HEDERA_AIR_TOKEN_ADDRESS;

  if (!airTokenAddress) {
    throw new Error(
      "HEDERA_AIR_TOKEN_ADDRESS not set in .env file. Please deploy AIR token first."
    );
  }

  // Convert Hedera token ID (0.0.X) to EVM address if needed
  if (airTokenAddress.startsWith("0.0.")) {
    const tokenNum = airTokenAddress.split(".")[2];
    airTokenAddress = "0x" + parseInt(tokenNum).toString(16).padStart(40, "0");
    console.log("Converted Hedera Token ID to EVM address");
  }

  console.log("AIR Token Address:", airTokenAddress);

  // Deploy LiquidityPoolFactory
  const LiquidityPoolFactory = await ethers.getContractFactory("LiquidityPoolFactory", wallet);
  const factory = await LiquidityPoolFactory.deploy(airTokenAddress, {
    gasLimit: 3000000,
  });
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();

  console.log("✅ LiquidityPoolFactory deployed on Hedera testnet!");
  console.log("Contract address:", factoryAddress);
  console.log("Graduation threshold: $69,000 USDC");
  console.log("\nAdd this to your .env file:");
  console.log(`HEDERA_LIQUIDITY_POOL_FACTORY_ADDRESS=${factoryAddress}`);
  console.log("\nView on HashScan:");
  console.log(`https://hashscan.io/testnet/contract/${factoryAddress}`);
}

deployLiquidityPoolFactoryHederaRPC()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying LiquidityPoolFactory:", error);
    process.exit(1);
  });
