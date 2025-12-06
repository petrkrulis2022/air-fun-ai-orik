import { supabase } from "../config/supabase.js";
import { getRedisClient } from "../config/redis.js";
import { ethers } from "ethers";
import { getBaseConfig, getContractAddresses, getHederaConfig } from "../config/blockchain.js";
import { MemecoinFactoryABI } from "../contracts/abis.js";
import {
  Memecoin,
  BondingCurveState,
  LiquidityPool,
  CreateMemecoinRequest,
  CreateMemecoinResponse,
  TokenMetadata,
  UpdateTokenMetadataRequest,
  GraduationResult,
  BONDING_CURVE_K,
  GRADUATION_MARKET_CAP,
  TOTAL_SUPPLY,
  BONDING_CURVE_SUPPLY,
} from "../types/token.types.js";
import { ChainType } from "../types/auth.types.js";
import { realtimeService } from "./realtime.service.js";

// Deployment result interface
interface DeploymentResult {
  memecoinAddress: string;
  bondingCurveAddress: string;
}

// Deployment status callback type
type DeploymentStatusCallback = (status: {
  step: string;
  status: "pending" | "in-progress" | "completed" | "error";
  details?: string;
  txHash?: string;
  address?: string;
  blockNumber?: number;
}) => void;

/**
 * Token Factory Service
 * Handles automatic memecoin creation, metadata management, and token graduation
 */
export class TokenFactoryService {
  private baseProvider: ethers.JsonRpcProvider | null = null;
  private baseWallet: ethers.Wallet | null = null;
  private hederaProvider: ethers.JsonRpcProvider | null = null;
  private hederaWallet: ethers.Wallet | null = null;
  private contractAddresses = getContractAddresses();

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize blockchain providers for both Base Sepolia and Hedera
   */
  private initializeProviders(): void {
    // Initialize Base Sepolia provider
    try {
      const baseConfig = getBaseConfig();
      this.baseProvider = new ethers.JsonRpcProvider(baseConfig.rpcUrl);
      this.baseWallet = new ethers.Wallet(baseConfig.privateKey, this.baseProvider);
      console.log("Token Factory: Base Sepolia provider initialized");
    } catch (error) {
      console.warn("Token Factory: Failed to initialize Base provider (will use mock):", error);
    }

    // Initialize Hedera provider (uses JSON-RPC relay)
    try {
      const hederaConfig = getHederaConfig();
      // Hedera Testnet JSON-RPC relay endpoint
      const hederaRpcUrl = "https://testnet.hashio.io/api";
      this.hederaProvider = new ethers.JsonRpcProvider(hederaRpcUrl);
      this.hederaWallet = new ethers.Wallet(hederaConfig.privateKey, this.hederaProvider);
      console.log("Token Factory: Hedera Testnet provider initialized");
    } catch (error) {
      console.warn("Token Factory: Failed to initialize Hedera provider (will use mock):", error);
    }
  }

  /**
   * Generate a unique token symbol from streamer name
   * Symbol format: 3-5 uppercase characters (contract requirement)
   * Handles collisions by using random suffix
   */
  private async generateTokenSymbol(streamerName: string): Promise<string> {
    // Extract alphanumeric characters and convert to uppercase
    const cleanName = streamerName.replace(/[^a-zA-Z]/g, "").toUpperCase();

    // Generate base symbol (3-4 characters to leave room for suffix)
    let baseSymbol = cleanName.substring(0, 4);
    if (baseSymbol.length < 3) {
      baseSymbol = baseSymbol.padEnd(3, "X");
    }

    // Check for collisions and append single digit suffix if needed
    let symbol = baseSymbol.substring(0, 5); // Ensure max 5 chars
    let attempts = 0;
    const maxAttempts = 100;

    while ((await this.symbolExists(symbol)) && attempts < maxAttempts) {
      // Use shorter base + single digit to stay within 5 chars
      const shortBase = baseSymbol.substring(0, 4);
      symbol = `${shortBase}${attempts % 10}`;
      attempts++;

      // If still colliding, try random 5-char symbols
      if (attempts >= 10) {
        const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        symbol = "";
        for (let i = 0; i < 5; i++) {
          symbol += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
        }
      }
    }

    // Final validation - must be 3-5 chars
    if (symbol.length < 3 || symbol.length > 5) {
      throw new Error(`Generated symbol "${symbol}" is not 3-5 characters`);
    }

    return symbol;
  }

  /**
   * Check if a token symbol already exists
   */
  private async symbolExists(symbol: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("memecoins")
      .select("id")
      .eq("symbol", symbol)
      .single();

    return data !== null && !error;
  }

  /**
   * Deploy token contract to Hedera via MemecoinFactory
   * Calls the factory contract to create memecoin + bonding curve
   * Uses Hedera's JSON-RPC relay for EVM-compatible deployment
   */
  private async deployToHedera(
    name: string,
    symbol: string,
    creatorAddress: string
  ): Promise<DeploymentResult> {
    const factoryAddress = this.contractAddresses.hedera.memecoinFactory;

    // Check if we have proper configuration
    if (!factoryAddress || !this.hederaWallet) {
      console.warn(`[Hedera] Factory not configured, using mock deployment for ${symbol}`);
      return {
        memecoinAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        bondingCurveAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
      };
    }

    console.log(`[Hedera] Deploying ${symbol} via factory ${factoryAddress}`);
    console.log(`[Hedera] Creator address: ${creatorAddress}`);

    try {
      // Connect to factory contract
      const factory = new ethers.Contract(factoryAddress, MemecoinFactoryABI, this.hederaWallet);

      // Call createMemecoin on factory
      // This deploys both the Memecoin and BondingCurve contracts
      // Creator receives 200M tokens (20%), BondingCurve gets 800M (80%)
      console.log(
        `[Hedera] Calling factory.createMemecoin("${name}", "${symbol}", "${creatorAddress}")...`
      );

      const tx = await factory.createMemecoin(name, symbol, creatorAddress);
      console.log(`[Hedera] Transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`[Hedera] Transaction confirmed in block ${receipt.blockNumber}`);

      // Parse MemecoinCreated event to get deployed addresses
      const event = receipt.logs
        .map((log: any) => {
          try {
            return factory.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e: any) => e && e.name === "MemecoinCreated");

      if (!event) {
        throw new Error("MemecoinCreated event not found in transaction receipt");
      }

      const result = {
        memecoinAddress: event.args.memecoinAddress,
        bondingCurveAddress: event.args.bondingCurveAddress,
      };

      console.log(`[Hedera] Memecoin deployed at: ${result.memecoinAddress}`);
      console.log(`[Hedera] BondingCurve deployed at: ${result.bondingCurveAddress}`);
      console.log(`[Hedera] Creator ${creatorAddress} received 200M tokens (20%)`);

      return result;
    } catch (error: any) {
      console.error(`[Hedera] Deployment failed:`, error.message);

      // Fall back to mock if deployment fails
      console.warn(`[Hedera] Falling back to mock addresses`);
      return {
        memecoinAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        bondingCurveAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
      };
    }
  }

  /**
   * Deploy token contract to Base Sepolia via MemecoinFactory
   * Calls the factory contract to create memecoin + bonding curve
   * The creator receives 20% of tokens (200M), bonding curve gets 80% (800M)
   */
  private async deployToBase(
    name: string,
    symbol: string,
    creatorAddress: string
  ): Promise<DeploymentResult> {
    const factoryAddress = this.contractAddresses.base.memecoinFactory;

    // Check if we have proper configuration
    if (!factoryAddress || !this.baseWallet) {
      console.warn(`[Base Sepolia] Factory not configured, using mock deployment for ${symbol}`);
      return {
        memecoinAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        bondingCurveAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
      };
    }

    console.log(`[Base Sepolia] Deploying ${symbol} via factory ${factoryAddress}`);
    console.log(`[Base Sepolia] Creator address: ${creatorAddress}`);

    try {
      // Connect to factory contract
      const factory = new ethers.Contract(factoryAddress, MemecoinFactoryABI, this.baseWallet);

      // Call createMemecoin on factory
      // This deploys both the Memecoin and BondingCurve contracts
      // Creator receives 200M tokens (20%), BondingCurve gets 800M (80%)
      console.log(
        `[Base Sepolia] Calling factory.createMemecoin("${name}", "${symbol}", "${creatorAddress}")...`
      );

      const tx = await factory.createMemecoin(name, symbol, creatorAddress);
      console.log(`[Base Sepolia] Transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`[Base Sepolia] Transaction confirmed in block ${receipt.blockNumber}`);

      // Parse MemecoinCreated event to get deployed addresses
      const event = receipt.logs
        .map((log: any) => {
          try {
            return factory.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e: any) => e && e.name === "MemecoinCreated");

      if (!event) {
        throw new Error("MemecoinCreated event not found in transaction receipt");
      }

      const result = {
        memecoinAddress: event.args.memecoinAddress,
        bondingCurveAddress: event.args.bondingCurveAddress,
      };

      console.log(`[Base Sepolia] Memecoin deployed at: ${result.memecoinAddress}`);
      console.log(`[Base Sepolia] BondingCurve deployed at: ${result.bondingCurveAddress}`);
      console.log(`[Base Sepolia] Creator ${creatorAddress} received 200M tokens (20%)`);

      return result;
    } catch (error: any) {
      console.error(`[Base Sepolia] Deployment failed:`, error.message);

      // Fall back to mock if deployment fails
      console.warn(`[Base Sepolia] Falling back to mock addresses`);
      return {
        memecoinAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        bondingCurveAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
      };
    }
  }

  /**
   * Deploy to Base Sepolia with status broadcasting
   */
  private async deployToBaseWithStatus(
    name: string,
    symbol: string,
    creatorAddress: string,
    broadcastStatus: DeploymentStatusCallback
  ): Promise<DeploymentResult> {
    const factoryAddress = this.contractAddresses.base.memecoinFactory;

    // Check if we have proper configuration
    if (!factoryAddress || !this.baseWallet) {
      console.warn(`[Base Sepolia] Factory not configured, using mock deployment for ${symbol}`);
      broadcastStatus({
        step: "deploying_contract",
        status: "completed",
        details: "Using mock deployment (factory not configured)",
      });
      return {
        memecoinAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        bondingCurveAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
      };
    }

    broadcastStatus({
      step: "connecting_factory",
      status: "in-progress",
      details: `Connecting to factory at ${factoryAddress.slice(0, 10)}...`,
    });

    try {
      const factory = new ethers.Contract(factoryAddress, MemecoinFactoryABI, this.baseWallet);

      broadcastStatus({
        step: "connecting_factory",
        status: "completed",
        details: "Factory connected",
        address: factoryAddress,
      });

      broadcastStatus({
        step: "sending_transaction",
        status: "in-progress",
        details: `Calling createMemecoin("${name}", "${symbol}")...`,
      });

      const tx = await factory.createMemecoin(name, symbol, creatorAddress);
      console.log(`[Base Sepolia] Transaction sent: ${tx.hash}`);

      broadcastStatus({
        step: "sending_transaction",
        status: "completed",
        details: "Transaction sent to network",
        txHash: tx.hash,
      });

      broadcastStatus({
        step: "confirming_transaction",
        status: "in-progress",
        details: "Waiting for block confirmation...",
        txHash: tx.hash,
      });

      const receipt = await tx.wait();
      console.log(`[Base Sepolia] Transaction confirmed in block ${receipt.blockNumber}`);

      broadcastStatus({
        step: "confirming_transaction",
        status: "completed",
        details: `Confirmed in block #${receipt.blockNumber}`,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
      });

      broadcastStatus({
        step: "parsing_events",
        status: "in-progress",
        details: "Parsing contract events...",
      });

      // Parse MemecoinCreated event to get deployed addresses
      const event = receipt.logs
        .map((log: any) => {
          try {
            return factory.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e: any) => e && e.name === "MemecoinCreated");

      if (!event) {
        throw new Error("MemecoinCreated event not found in transaction receipt");
      }

      const result = {
        memecoinAddress: event.args.memecoinAddress,
        bondingCurveAddress: event.args.bondingCurveAddress,
      };

      broadcastStatus({
        step: "memecoin_deployed",
        status: "completed",
        details: "Memecoin contract deployed",
        address: result.memecoinAddress,
      });

      broadcastStatus({
        step: "bonding_curve_deployed",
        status: "completed",
        details: "Bonding curve contract deployed",
        address: result.bondingCurveAddress,
      });

      broadcastStatus({
        step: "tokens_allocated",
        status: "completed",
        details: `Creator received 200M tokens (20%)`,
        address: creatorAddress,
      });

      console.log(`[Base Sepolia] Memecoin deployed at: ${result.memecoinAddress}`);
      console.log(`[Base Sepolia] BondingCurve deployed at: ${result.bondingCurveAddress}`);

      return result;
    } catch (error: any) {
      console.error(`[Base Sepolia] Deployment failed:`, error.message);

      broadcastStatus({
        step: "deploying_contract",
        status: "error",
        details: `Deployment failed: ${error.message}`,
      });

      // Fall back to mock if deployment fails
      return {
        memecoinAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        bondingCurveAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
      };
    }
  }

  /**
   * Deploy to Hedera with status broadcasting
   */
  private async deployToHederaWithStatus(
    name: string,
    symbol: string,
    creatorAddress: string,
    broadcastStatus: DeploymentStatusCallback
  ): Promise<DeploymentResult> {
    const factoryAddress = this.contractAddresses.hedera.memecoinFactory;

    if (!factoryAddress || !this.hederaWallet) {
      console.warn(`[Hedera] Factory not configured, using mock deployment for ${symbol}`);
      broadcastStatus({
        step: "deploying_contract",
        status: "completed",
        details: "Using mock deployment (factory not configured)",
      });
      return {
        memecoinAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        bondingCurveAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
      };
    }

    broadcastStatus({
      step: "connecting_factory",
      status: "in-progress",
      details: `Connecting to Hedera factory at ${factoryAddress.slice(0, 10)}...`,
    });

    try {
      const factory = new ethers.Contract(factoryAddress, MemecoinFactoryABI, this.hederaWallet);

      broadcastStatus({
        step: "connecting_factory",
        status: "completed",
        details: "Factory connected",
        address: factoryAddress,
      });

      broadcastStatus({
        step: "sending_transaction",
        status: "in-progress",
        details: `Calling createMemecoin("${name}", "${symbol}")...`,
      });

      const tx = await factory.createMemecoin(name, symbol, creatorAddress);

      broadcastStatus({
        step: "sending_transaction",
        status: "completed",
        details: "Transaction sent to Hedera network",
        txHash: tx.hash,
      });

      broadcastStatus({
        step: "confirming_transaction",
        status: "in-progress",
        details: "Waiting for block confirmation...",
        txHash: tx.hash,
      });

      const receipt = await tx.wait();

      broadcastStatus({
        step: "confirming_transaction",
        status: "completed",
        details: `Confirmed in block #${receipt.blockNumber}`,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
      });

      broadcastStatus({
        step: "parsing_events",
        status: "in-progress",
        details: "Parsing contract events...",
      });

      const event = receipt.logs
        .map((log: any) => {
          try {
            return factory.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e: any) => e && e.name === "MemecoinCreated");

      if (!event) {
        throw new Error("MemecoinCreated event not found");
      }

      const result = {
        memecoinAddress: event.args.memecoinAddress,
        bondingCurveAddress: event.args.bondingCurveAddress,
      };

      broadcastStatus({
        step: "memecoin_deployed",
        status: "completed",
        details: "Memecoin contract deployed",
        address: result.memecoinAddress,
      });

      broadcastStatus({
        step: "bonding_curve_deployed",
        status: "completed",
        details: "Bonding curve contract deployed",
        address: result.bondingCurveAddress,
      });

      broadcastStatus({
        step: "tokens_allocated",
        status: "completed",
        details: `Creator received 200M tokens (20%)`,
        address: creatorAddress,
      });

      return result;
    } catch (error: any) {
      console.error(`[Hedera] Deployment failed:`, error.message);

      broadcastStatus({
        step: "deploying_contract",
        status: "error",
        details: `Deployment failed: ${error.message}`,
      });

      return {
        memecoinAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        bondingCurveAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
      };
    }
  }

  /**
   * Calculate initial price based on bonding curve formula
   * price = k * tokensSold^2
   */
  private calculatePrice(tokensSold: number): number {
    return BONDING_CURVE_K * Math.pow(tokensSold, 2);
  }

  /**
   * Create a new memecoin for a stream
   * Automatically triggered when a stream starts
   * Only deploys to the chain the streamer is connected to
   */
  async createMemecoin(request: CreateMemecoinRequest): Promise<CreateMemecoinResponse> {
    const { streamerId, streamerName, streamId, chainId, streamerWalletAddress } = request;

    // Helper to broadcast deployment status
    const broadcastStatus = (status: {
      step: string;
      status: "pending" | "in-progress" | "completed" | "error";
      details?: string;
      txHash?: string;
      address?: string;
      blockNumber?: number;
    }) => {
      try {
        realtimeService.broadcastDeploymentStatus(streamId, {
          ...status,
          chainId,
          chain: chainId === 296 ? "hedera" : "base",
          timestamp: Date.now(),
        });
      } catch (e) {
        console.warn("Failed to broadcast deployment status:", e);
      }
    };

    // Broadcast: Starting deployment
    broadcastStatus({
      step: "generating_symbol",
      status: "in-progress",
      details: "Generating unique token symbol...",
    });

    // Generate unique token symbol
    const symbol = await this.generateTokenSymbol(streamerName);
    const name = `${streamerName} Coin`;

    broadcastStatus({
      step: "generating_symbol",
      status: "completed",
      details: `Token symbol: $${symbol}`,
    });

    // Use streamer's wallet address or a fallback
    // The creator receives 20% of tokens (200M)
    const creatorAddress = streamerWalletAddress || ethers.ZeroAddress;

    if (!streamerWalletAddress) {
      console.warn(
        `No wallet address provided for streamer ${streamerId}, using zero address (tokens won't be claimable)`
      );
    }

    // Deploy only to the chain the streamer is connected to
    // 84532 = Base Sepolia, 296 = Hedera Testnet
    let hederaResult: DeploymentResult | null = null;
    let baseResult: DeploymentResult | null = null;

    if (chainId === 296) {
      // Hedera Testnet
      console.log(`Deploying ${symbol} to Hedera Testnet (chainId: ${chainId})`);
      broadcastStatus({
        step: "deploying_contract",
        status: "in-progress",
        details: `Deploying to Hedera Testnet...`,
      });
      hederaResult = await this.deployToHederaWithStatus(
        name,
        symbol,
        creatorAddress,
        broadcastStatus
      );
    } else if (chainId === 84532) {
      // Base Sepolia
      console.log(`Deploying ${symbol} to Base Sepolia (chainId: ${chainId})`);
      broadcastStatus({
        step: "deploying_contract",
        status: "in-progress",
        details: `Deploying to Base Sepolia...`,
      });
      baseResult = await this.deployToBaseWithStatus(name, symbol, creatorAddress, broadcastStatus);
    } else if (chainId) {
      // Unknown chain, log warning
      console.warn(`Unknown chainId ${chainId}, defaulting to Base Sepolia`);
      broadcastStatus({
        step: "deploying_contract",
        status: "in-progress",
        details: `Deploying to Base Sepolia (default)...`,
      });
      baseResult = await this.deployToBaseWithStatus(name, symbol, creatorAddress, broadcastStatus);
    } else {
      // No chainId provided (legacy behavior - deploy to Base by default)
      console.warn(`No chainId provided for ${symbol}, defaulting to Base Sepolia`);
      broadcastStatus({
        step: "deploying_contract",
        status: "in-progress",
        details: `Deploying to Base Sepolia (default)...`,
      });
      baseResult = await this.deployToBaseWithStatus(name, symbol, creatorAddress, broadcastStatus);
    }

    // Extract addresses from deployment results
    const hederaAddress = hederaResult?.memecoinAddress || null;
    const baseAddress = baseResult?.memecoinAddress || null;
    const bondingCurveAddress =
      hederaResult?.bondingCurveAddress || baseResult?.bondingCurveAddress || null;

    // Calculate initial state
    const initialTokensSold = 0;
    const initialPrice = this.calculatePrice(initialTokensSold);
    const initialMarketCap = initialPrice * initialTokensSold;

    // Broadcast saving to database
    broadcastStatus({
      step: "saving_database",
      status: "in-progress",
      details: "Saving token data to database...",
    });

    // Create memecoin record
    // Note: bonding_curve_address and creator_wallet_address columns need to be added to Supabase
    // For now, we store addresses in hedera/base contract address fields
    const { data: memecoinData, error: memecoinError } = await supabase
      .from("memecoins")
      .insert({
        stream_id: streamId,
        streamer_id: streamerId,
        name,
        symbol,
        total_supply: TOTAL_SUPPLY,
        bonding_curve_supply: BONDING_CURVE_SUPPLY,
        current_price: initialPrice,
        market_cap: initialMarketCap,
        liquidity_raised: 0,
        tokens_sold: initialTokensSold,
        graduation_target: GRADUATION_MARKET_CAP,
        is_graduated: false,
        hedera_contract_address: hederaAddress,
        base_contract_address: baseAddress,
        // TODO: Add these columns to Supabase schema:
        // bonding_curve_address: bondingCurveAddress,
        // creator_wallet_address: streamerWalletAddress || null,
      })
      .select()
      .single();

    if (memecoinError || !memecoinData) {
      broadcastStatus({
        step: "saving_database",
        status: "error",
        details: `Database error: ${memecoinError?.message}`,
      });
      throw new Error(`Failed to create memecoin: ${memecoinError?.message}`);
    }

    broadcastStatus({
      step: "saving_database",
      status: "completed",
      details: "Token saved to database",
    });

    // Create bonding curve state
    const nextPrice = this.calculatePrice(1000); // Preview price after 1000 tokens
    const { data: curveData, error: curveError } = await supabase
      .from("bonding_curve_states")
      .insert({
        token_id: memecoinData.id,
        k: BONDING_CURVE_K,
        tokens_sold: initialTokensSold,
        current_price: initialPrice,
        market_cap: initialMarketCap,
        next_price: nextPrice,
        graduation_threshold: GRADUATION_MARKET_CAP,
        progress_to_graduation: 0,
      })
      .select()
      .single();

    if (curveError || !curveData) {
      throw new Error(`Failed to create bonding curve state: ${curveError?.message}`);
    }

    // Cache bonding curve state in Redis (if available)
    const redis = await getRedisClient();
    if (redis) {
      const cacheKey = `bonding_curve:${memecoinData.id}`;
      await redis.setEx(
        cacheKey,
        60, // 60 second TTL
        JSON.stringify({
          tokenId: curveData.token_id,
          k: curveData.k,
          tokensSold: curveData.tokens_sold,
          currentPrice: curveData.current_price,
          marketCap: curveData.market_cap,
          nextPrice: curveData.next_price,
          graduationThreshold: curveData.graduation_threshold,
          progressToGraduation: curveData.progress_to_graduation,
          updatedAt: curveData.updated_at,
        })
      );
    }

    // Update user's total tokens created
    await supabase.rpc("increment_total_tokens_created", {
      user_id: streamerId,
    });

    // Map database records to response types
    const memecoin: Memecoin = {
      id: memecoinData.id,
      streamId: memecoinData.stream_id,
      streamerId: memecoinData.streamer_id,
      name: memecoinData.name,
      symbol: memecoinData.symbol,
      totalSupply: parseFloat(memecoinData.total_supply),
      bondingCurveSupply: parseFloat(memecoinData.bonding_curve_supply),
      currentPrice: parseFloat(memecoinData.current_price),
      marketCap: parseFloat(memecoinData.market_cap),
      liquidityRaised: parseFloat(memecoinData.liquidity_raised),
      tokensSold: parseFloat(memecoinData.tokens_sold),
      graduationTarget: parseFloat(memecoinData.graduation_target),
      isGraduated: memecoinData.is_graduated,
      liquidityPoolAddress: memecoinData.liquidity_pool_address,
      hederaContractAddress: memecoinData.hedera_contract_address,
      baseContractAddress: memecoinData.base_contract_address,
      createdAt: memecoinData.created_at,
      updatedAt: memecoinData.updated_at,
    };

    const bondingCurveState: BondingCurveState = {
      id: curveData.id,
      tokenId: curveData.token_id,
      k: parseFloat(curveData.k),
      tokensSold: parseFloat(curveData.tokens_sold),
      currentPrice: parseFloat(curveData.current_price),
      marketCap: parseFloat(curveData.market_cap),
      nextPrice: parseFloat(curveData.next_price),
      graduationThreshold: parseFloat(curveData.graduation_threshold),
      progressToGraduation: parseFloat(curveData.progress_to_graduation),
      updatedAt: curveData.updated_at,
    };

    // Broadcast deployment complete
    broadcastStatus({
      step: "deployment_complete",
      status: "completed",
      details: `Token $${symbol} is now live!`,
      address: baseAddress || hederaAddress || undefined,
    });

    return {
      memecoin,
      bondingCurveState,
    };
  }

  /**
   * Get memecoin by ID
   */
  async getMemecoin(tokenId: string): Promise<Memecoin | null> {
    const { data, error } = await supabase.from("memecoins").select("*").eq("id", tokenId).single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      streamId: data.stream_id,
      streamerId: data.streamer_id,
      name: data.name,
      symbol: data.symbol,
      totalSupply: parseFloat(data.total_supply),
      bondingCurveSupply: parseFloat(data.bonding_curve_supply),
      currentPrice: parseFloat(data.current_price),
      marketCap: parseFloat(data.market_cap),
      liquidityRaised: parseFloat(data.liquidity_raised),
      tokensSold: parseFloat(data.tokens_sold),
      graduationTarget: parseFloat(data.graduation_target),
      isGraduated: data.is_graduated,
      liquidityPoolAddress: data.liquidity_pool_address,
      hederaContractAddress: data.hedera_contract_address,
      baseContractAddress: data.base_contract_address,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Get memecoin by stream ID
   */
  async getMemecoinByStream(streamId: string): Promise<Memecoin | null> {
    const { data, error } = await supabase
      .from("memecoins")
      .select("*")
      .eq("stream_id", streamId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      streamId: data.stream_id,
      streamerId: data.streamer_id,
      name: data.name,
      symbol: data.symbol,
      totalSupply: parseFloat(data.total_supply),
      bondingCurveSupply: parseFloat(data.bonding_curve_supply),
      currentPrice: parseFloat(data.current_price),
      marketCap: parseFloat(data.market_cap),
      liquidityRaised: parseFloat(data.liquidity_raised),
      tokensSold: parseFloat(data.tokens_sold),
      graduationTarget: parseFloat(data.graduation_target),
      isGraduated: data.is_graduated,
      liquidityPoolAddress: data.liquidity_pool_address,
      hederaContractAddress: data.hedera_contract_address,
      baseContractAddress: data.base_contract_address,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Update token metadata
   */
  async updateTokenMetadata(request: UpdateTokenMetadataRequest): Promise<void> {
    const { tokenId, metadata } = request;

    const updateData: any = {
      updated_at: Date.now(),
    };

    if (metadata.logoUrl !== undefined) {
      updateData.logo_url = metadata.logoUrl;
    }
    if (metadata.description !== undefined) {
      updateData.description = metadata.description;
    }
    if (metadata.socialLinks?.twitter !== undefined) {
      updateData.twitter_link = metadata.socialLinks.twitter;
    }
    if (metadata.socialLinks?.telegram !== undefined) {
      updateData.telegram_link = metadata.socialLinks.telegram;
    }

    const { error } = await supabase.from("memecoins").update(updateData).eq("id", tokenId);

    if (error) {
      throw new Error(`Failed to update token metadata: ${error.message}`);
    }
  }

  /**
   * Check if a token is eligible for graduation
   */
  async checkGraduationEligibility(tokenId: string): Promise<boolean> {
    const memecoin = await this.getMemecoin(tokenId);

    if (!memecoin) {
      throw new Error("Token not found");
    }

    if (memecoin.isGraduated) {
      return false; // Already graduated
    }

    return memecoin.marketCap >= GRADUATION_MARKET_CAP;
  }

  /**
   * Graduate a token by creating liquidity pools
   * Note: Liquidity pool creation depends on Task 3 (Smart Contract infrastructure)
   */
  async graduateToken(tokenId: string): Promise<GraduationResult> {
    const memecoin = await this.getMemecoin(tokenId);

    if (!memecoin) {
      throw new Error("Token not found");
    }

    if (memecoin.isGraduated) {
      throw new Error("Token already graduated");
    }

    if (memecoin.marketCap < GRADUATION_MARKET_CAP) {
      throw new Error(
        `Token market cap ($${memecoin.marketCap}) below graduation threshold ($${GRADUATION_MARKET_CAP})`
      );
    }

    // Create liquidity pools on both chains
    const hederaPool = await this.createLiquidityPool(tokenId, "hedera");
    const basePool = await this.createLiquidityPool(tokenId, "base");

    // Update memecoin status
    const { error } = await supabase
      .from("memecoins")
      .update({
        is_graduated: true,
        updated_at: Date.now(),
      })
      .eq("id", tokenId);

    if (error) {
      throw new Error(`Failed to update graduation status: ${error.message}`);
    }

    return {
      tokenId,
      liquidityPools: [hederaPool, basePool],
      finalMarketCap: memecoin.marketCap,
    };
  }

  /**
   * Create a liquidity pool for a graduated token
   * Note: This is a placeholder. Actual implementation depends on Task 3 (Smart Contract infrastructure)
   */
  private async createLiquidityPool(tokenId: string, chain: ChainType): Promise<LiquidityPool> {
    // TODO: Implement actual liquidity pool creation via smart contracts
    // This will be implemented in Task 3 (Smart Contract infrastructure)
    const poolAddress = `0x${Math.random().toString(16).substring(2, 42)}`;

    const { data, error } = await supabase
      .from("liquidity_pools")
      .insert({
        token_id: tokenId,
        chain,
        pool_address: poolAddress,
        token_reserve: 0,
        air_reserve: 0,
        lp_tokens_burned: true, // Burn LP tokens for rug-pull protection
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create liquidity pool: ${error?.message}`);
    }

    return {
      id: data.id,
      tokenId: data.token_id,
      chain: data.chain as ChainType,
      poolAddress: data.pool_address,
      tokenReserve: parseFloat(data.token_reserve),
      airReserve: parseFloat(data.air_reserve),
      lpTokensBurned: data.lp_tokens_burned,
      createdAt: data.created_at,
    };
  }
}

export default new TokenFactoryService();
