import {
  Client,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  PrivateKey,
  AccountId,
} from "@hashgraph/sdk";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Deploy AIR token on Hedera testnet using HTS (Hedera Token Service)
 */
async function deployAIRTokenHedera() {
  // Validate environment variables
  if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
    throw new Error("Missing Hedera credentials in .env file");
  }

  const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  const privateKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);

  // Create Hedera testnet client
  const client = Client.forTestnet();
  client.setOperator(accountId, privateKey);

  console.log("Deploying AIR token on Hedera testnet...");
  console.log("Account ID:", accountId.toString());

  // Create AIR token with HTS
  const tokenCreateTx = await new TokenCreateTransaction()
    .setTokenName("AIR Token")
    .setTokenSymbol("AIR")
    .setDecimals(8) // HTS standard decimals
    .setInitialSupply(1_000_000_000_00000000) // 1 billion tokens with 8 decimals
    .setTokenType(TokenType.FungibleCommon)
    .setSupplyType(TokenSupplyType.Infinite) // Allow minting for liquidity pools
    .setTreasuryAccountId(accountId)
    .setAdminKey(privateKey.publicKey)
    .setSupplyKey(privateKey.publicKey)
    .freezeWith(client);

  const tokenCreateSign = await tokenCreateTx.sign(privateKey);
  const tokenCreateSubmit = await tokenCreateSign.execute(client);
  const tokenCreateReceipt = await tokenCreateSubmit.getReceipt(client);
  const tokenId = tokenCreateReceipt.tokenId;

  console.log("✅ AIR token deployed on Hedera!");
  console.log("Token ID:", tokenId?.toString());
  console.log("\nAdd this to your .env file:");
  console.log(`HEDERA_AIR_TOKEN_ID=${tokenId?.toString()}`);

  client.close();
}

deployAIRTokenHedera()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying AIR token:", error);
    process.exit(1);
  });
