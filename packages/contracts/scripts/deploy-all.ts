import * as dotenv from "dotenv";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

/**
 * Master deployment script for all contracts
 * Deploys contracts to both Hedera testnet and Base Sepolia in the correct order
 */

interface DeploymentAddresses {
  hedera: {
    airToken?: string;
    memecoinFactory?: string;
    liquidityPoolFactory?: string;
  };
  base: {
    airToken?: string;
    memecoinFactory?: string;
    liquidityPoolFactory?: string;
  };
}

const addresses: DeploymentAddresses = {
  hedera: {},
  base: {},
};

function logSection(title: string) {
  console.log("\n" + "=".repeat(60));
  console.log(title);
  console.log("=".repeat(60) + "\n");
}

function runScript(command: string, description: string) {
  logSection(description);
  try {
    execSync(command, { stdio: "inherit", cwd: path.join(__dirname, "..") });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error);
    return false;
  }
}

async function deployAll() {
  console.log("🚀 Starting deployment of all contracts to Hedera testnet and Base Sepolia");
  console.log("\nConfiguration:");
  console.log("- Base USDC:", process.env.BASE_USDC_ADDRESS);
  console.log("- Hedera USDh:", process.env.HEDERA_USDH_ADDRESS);
  console.log(
    "- Platform Wallet:",
    process.env.PLATFORM_WALLET_ADDRESS || "Using deployer address"
  );

  // Step 1: Deploy AIR token to Base Sepolia
  if (!runScript("npm run deploy:air:base", "Deploy AIR Token to Base Sepolia")) {
    console.error("\n❌ Deployment failed at Base AIR token");
    process.exit(1);
  }

  // Step 2: Deploy AIR token to Hedera
  if (!runScript("npm run deploy:air:hedera", "Deploy AIR Token to Hedera Testnet")) {
    console.error("\n❌ Deployment failed at Hedera AIR token");
    process.exit(1);
  }

  // Step 3: Deploy Memecoin Factory to Base Sepolia
  if (!runScript("npm run deploy:factory:base", "Deploy Memecoin Factory to Base Sepolia")) {
    console.error("\n❌ Deployment failed at Base Memecoin Factory");
    process.exit(1);
  }

  // Step 4: Deploy Memecoin Factory to Hedera
  if (!runScript("npm run deploy:factory:hedera", "Deploy Memecoin Factory to Hedera Testnet")) {
    console.error("\n❌ Deployment failed at Hedera Memecoin Factory");
    process.exit(1);
  }

  // Step 5: Deploy Liquidity Pool Factory to Base Sepolia
  if (
    !runScript("npm run deploy:pool-factory:base", "Deploy Liquidity Pool Factory to Base Sepolia")
  ) {
    console.error("\n❌ Deployment failed at Base Liquidity Pool Factory");
    process.exit(1);
  }

  // Step 6: Deploy Liquidity Pool Factory to Hedera
  if (
    !runScript(
      "npm run deploy:pool-factory:hedera",
      "Deploy Liquidity Pool Factory to Hedera Testnet"
    )
  ) {
    console.error("\n❌ Deployment failed at Hedera Liquidity Pool Factory");
    process.exit(1);
  }

  logSection("🎉 All Contracts Deployed Successfully!");

  console.log("\n📝 Deployment Summary:");
  console.log("\nBase Sepolia:");
  console.log("- USDC Address: 0x036CbD53842c5426634e7929541eC2318f3dCF7e");
  console.log("- Check deployment output above for contract addresses");

  console.log("\nHedera Testnet:");
  console.log("- USDh Address: 0x00000000000000000000000000000000006e24c7");
  console.log("- Check deployment output above for contract addresses");

  console.log("\n⚠️  Next Steps:");
  console.log("1. Copy the deployed contract addresses from the output above");
  console.log("2. Update packages/contracts/.env with the deployed addresses");
  console.log("3. Update packages/backend/.env with the deployed addresses");
  console.log("4. Verify contracts on block explorers if needed");
}

deployAll()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
