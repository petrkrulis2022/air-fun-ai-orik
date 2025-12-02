/**
 * Blockchain Configuration
 * Sets up Hedera SDK client and ethers.js provider for Base Sepolia
 * Requirements: 23 (Multi-chain token deployment)
 */

import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// Chain types
export type ChainType = "hedera" | "base";

// Hedera Configuration
export interface HederaConfig {
  accountId: string;
  privateKey: string;
  network: "testnet" | "mainnet";
}

// Base Sepolia Configuration
export interface BaseConfig {
  privateKey: string;
  rpcUrl: string;
  chainId: number;
}

// Contract addresses (loaded from environment)
export interface ContractAddresses {
  hedera: {
    airToken?: string;
    memecoinFactory?: string;
    liquidityPoolFactory?: string;
    usdc?: string;
  };
  base: {
    airToken?: string;
    memecoinFactory?: string;
    liquidityPoolFactory?: string;
    usdc?: string;
  };
}

/**
 * Get Hedera configuration from environment
 */
export function getHederaConfig(): HederaConfig {
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;

  if (!accountId || !privateKey) {
    throw new Error(
      "Missing Hedera configuration: HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY required"
    );
  }

  return {
    accountId,
    privateKey,
    network: "testnet",
  };
}

/**
 * Get Base Sepolia configuration from environment
 */
export function getBaseConfig(): BaseConfig {
  const privateKey = process.env.BASE_SEPOLIA_PRIVATE_KEY;
  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

  if (!privateKey) {
    throw new Error("Missing Base configuration: BASE_SEPOLIA_PRIVATE_KEY required");
  }

  return {
    privateKey,
    rpcUrl,
    chainId: 84532, // Base Sepolia chain ID
  };
}

/**
 * Get contract addresses from environment
 */
export function getContractAddresses(): ContractAddresses {
  return {
    hedera: {
      airToken: process.env.HEDERA_AIR_TOKEN_ADDRESS,
      memecoinFactory: process.env.HEDERA_MEMECOIN_FACTORY_ADDRESS,
      liquidityPoolFactory: process.env.HEDERA_LIQUIDITY_POOL_FACTORY_ADDRESS,
      usdc: process.env.HEDERA_USDC_ADDRESS,
    },
    base: {
      airToken: process.env.BASE_AIR_TOKEN_ADDRESS,
      memecoinFactory: process.env.BASE_MEMECOIN_FACTORY_ADDRESS,
      liquidityPoolFactory: process.env.BASE_LIQUIDITY_POOL_FACTORY_ADDRESS,
      usdc: process.env.BASE_USDC_ADDRESS,
    },
  };
}

/**
 * Create Hedera client for testnet
 */
export function createHederaClient(): Client {
  const config = getHederaConfig();

  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(config.accountId),
    PrivateKey.fromString(config.privateKey)
  );

  return client;
}

/**
 * Create ethers.js provider and wallet for Base Sepolia
 */
export function createBaseProvider(): {
  provider: ethers.JsonRpcProvider;
  wallet: ethers.Wallet;
} {
  const config = getBaseConfig();

  const provider = new ethers.JsonRpcProvider(config.rpcUrl, {
    chainId: config.chainId,
    name: "base-sepolia",
  });

  const wallet = new ethers.Wallet(config.privateKey, provider);

  return { provider, wallet };
}

/**
 * Validate blockchain configuration
 */
export function validateBlockchainConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check Hedera config
  try {
    getHederaConfig();
  } catch (error) {
    errors.push(`Hedera: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  // Check Base config
  try {
    getBaseConfig();
  } catch (error) {
    errors.push(`Base: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  // Check contract addresses
  const addresses = getContractAddresses();
  if (!addresses.hedera.memecoinFactory) {
    errors.push("Missing Hedera memecoin factory address");
  }
  if (!addresses.base.memecoinFactory) {
    errors.push("Missing Base memecoin factory address");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
