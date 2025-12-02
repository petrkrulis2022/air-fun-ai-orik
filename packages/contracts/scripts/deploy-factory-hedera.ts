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
  // Try to parse as ECDSA key (most common for Hedera)
  const privateKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY);

  // Create Hedera testnet client
  const client = Client.forTestnet();
  client.setOperator(accountId, privateKey);

  console.log("Deploying MemecoinFactory on Hedera testnet...");
  console.log("Account ID:", accountId.toString());

  // Get USDh token address for Hedera testnet
  // USDh is a custom stablecoin deployed on Hedera testnet
  const usdhAddress =
    process.env.HEDERA_USDH_ADDRESS || "0x00000000000000000000000000000000006e24c7";

  // Platform wallet address (Hedera account ID)
  const platformWallet = process.env.HEDERA_PLATFORM_WALLET || accountId.toString();

  console.log("USDh Token Address:", usdhAddress);
  console.log("Platform Wallet:", platformWallet);

  // Read compiled contract bytecode
  const factoryArtifact = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../artifacts/contracts/MemecoinFactory.sol/MemecoinFactory.json"),
      "utf8"
    )
  );

  const factoryBytecode = factoryArtifact.bytecode;

  // Convert platform wallet (Hedera account ID) to Solidity address format
  const platformWalletAddress = `0x${Buffer.from(platformWallet.replace(/\./g, "")).toString("hex").padStart(40, "0")}`;

  console.log("\nDeploying contract...");
  console.log("This may take a few moments...");

  try {
    // Deploy contract using ContractCreateFlow
    const contractCreate = new ContractCreateFlow()
      .setGas(3000000) // Increased gas for factory contract
      .setBytecode(factoryBytecode)
      .setConstructorParameters(
        new ContractFunctionParameters().addAddress(usdhAddress).addAddress(platformWalletAddress)
      );

    console.log("Executing contract deployment transaction...");
    const contractCreateSubmit = await contractCreate.execute(client);
    console.log("Waiting for receipt...");
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
