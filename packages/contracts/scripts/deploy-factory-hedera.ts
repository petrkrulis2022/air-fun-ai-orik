import { ethers } from "hardhat";
import {
  Client,
  AccountId,
  PrivateKey,
  ContractCreateFlow,
  ContractFunctionParameters,
} from "@hashgraph/sdk";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

/**
 * Deploy MemecoinFactory on Hedera testnet
 * Note: Hedera uses smart contracts similar to Ethereum, so we can deploy Solidity contracts
 */
async function deployMemecoinFactoryHedera() {
  // Validate environment variables
  if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
    throw new Error("Missing Hedera credentials in .env file");
  }

  const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  const privateKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);

  // Create Hedera testnet client
  const client = Client.forTestnet();
  client.setOperator(accountId, privateKey);

  console.log("Deploying MemecoinFactory on Hedera testnet...");
  console.log("Account ID:", accountId.toString());

  // Get USDC token ID for Hedera testnet
  // Note: You'll need to create or use an existing USDC-equivalent token on Hedera
  const usdcTokenId = process.env.HEDERA_USDC_TOKEN_ID;
  if (!usdcTokenId) {
    throw new Error("HEDERA_USDC_TOKEN_ID not set in .env file");
  }

  // Platform wallet address (Hedera account ID)
  const platformWallet = process.env.HEDERA_PLATFORM_WALLET || accountId.toString();

  console.log("USDC Token ID:", usdcTokenId);
  console.log("Platform Wallet:", platformWallet);

  // Read compiled contract bytecode
  const factoryArtifact = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../artifacts/contracts/MemecoinFactory.sol/MemecoinFactory.json"),
      "utf8"
    )
  );

  const factoryBytecode = factoryArtifact.bytecode;

  // Convert USDC token ID to Solidity address format (0.0.X -> 0x...)
  // Hedera uses a special address format for HTS tokens
  const usdcAddress = `0x${Buffer.from(usdcTokenId.replace(/\./g, "")).toString("hex").padStart(40, "0")}`;
  const platformWalletAddress = `0x${Buffer.from(platformWallet.replace(/\./g, "")).toString("hex").padStart(40, "0")}`;

  console.log("\nDeploying contract...");
  console.log("This may take a few moments...");

  try {
    // Deploy contract using ContractCreateFlow
    const contractCreate = new ContractCreateFlow()
      .setGas(1000000) // Adjust gas as needed
      .setBytecode(factoryBytecode)
      .setConstructorParameters(
        new ContractFunctionParameters().addAddress(usdcAddress).addAddress(platformWalletAddress)
      );

    const contractCreateSubmit = await contractCreate.execute(client);
    const contractCreateReceipt = await contractCreateSubmit.getReceipt(client);
    const contractId = contractCreateReceipt.contractId;

    console.log("✅ MemecoinFactory deployed on Hedera!");
    console.log("Contract ID:", contractId?.toString());
    console.log("\nAdd this to your .env file:");
    console.log(`HEDERA_MEMECOIN_FACTORY_ID=${contractId?.toString()}`);
  } catch (error: any) {
    console.error("Deployment failed:", error.message);
    if (error.status) {
      console.error("Status:", error.status.toString());
    }
    throw error;
  } finally {
    client.close();
  }
}

deployMemecoinFactoryHedera()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying MemecoinFactory:", error);
    process.exit(1);
  });
