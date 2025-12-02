import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Deploy MemecoinFactory on Hedera testnet using JSON-RPC relay
 * This is an alternative to using Hedera SDK
 */
async function deployMemecoinFactoryHederaRPC() {
  console.log("Deploying MemecoinFactory on Hedera testnet via JSON-RPC...");

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

  // Get USDh token address for Hedera testnet
  const usdhAddress =
    process.env.HEDERA_USDH_ADDRESS || "0x00000000000000000000000000000000006e24c7";

  // Platform wallet address
  const platformWallet = process.env.PLATFORM_WALLET_ADDRESS || wallet.address;

  console.log("USDh Token Address:", usdhAddress);
  console.log("Platform Wallet:", platformWallet);

  // Deploy MemecoinFactory
  const MemecoinFactory = await ethers.getContractFactory("MemecoinFactory", wallet);
  const factory = await MemecoinFactory.deploy(usdhAddress, platformWallet, {
    gasLimit: 3000000,
  });
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();

  console.log("✅ MemecoinFactory deployed on Hedera testnet!");
  console.log("Contract address:", factoryAddress);
  console.log("\nAdd this to your .env file:");
  console.log(`HEDERA_MEMECOIN_FACTORY_ADDRESS=${factoryAddress}`);
  console.log("\nView on HashScan:");
  console.log(`https://hashscan.io/testnet/contract/${factoryAddress}`);
}

deployMemecoinFactoryHederaRPC()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying MemecoinFactory:", error);
    process.exit(1);
  });
