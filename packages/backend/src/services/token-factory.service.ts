import { supabase } from "../config/supabase.js";
import { getRedisClient } from "../config/redis.js";
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

/**
 * Token Factory Service
 * Handles automatic memecoin creation, metadata management, and token graduation
 */
export class TokenFactoryService {
  /**
   * Generate a unique token symbol from streamer name
   * Symbol format: 3-5 uppercase characters
   * Handles collisions by appending numeric suffix
   */
  private async generateTokenSymbol(streamerName: string): Promise<string> {
    // Extract alphanumeric characters and convert to uppercase
    const cleanName = streamerName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    // Generate base symbol (3-5 characters)
    let baseSymbol = cleanName.substring(0, 5);
    if (baseSymbol.length < 3) {
      baseSymbol = baseSymbol.padEnd(3, "X");
    }

    // Check for collisions and append numeric suffix if needed
    let symbol = baseSymbol;
    let suffix = 1;

    while (await this.symbolExists(symbol)) {
      symbol = `${baseSymbol}${suffix}`;
      suffix++;

      // Ensure symbol doesn't exceed 10 characters
      if (symbol.length > 10) {
        baseSymbol = baseSymbol.substring(0, 3);
        symbol = `${baseSymbol}${suffix}`;
      }
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
   * Deploy token contract to Hedera
   * Note: This is a placeholder. Actual implementation depends on Task 3 (Smart Contract infrastructure)
   */
  private async deployToHedera(name: string, symbol: string): Promise<string> {
    // TODO: Implement actual Hedera HTS token deployment
    // This will be implemented in Task 3 (Smart Contract infrastructure)
    console.log(`[Placeholder] Deploying ${symbol} to Hedera...`);
    return `0x${Math.random().toString(16).substring(2, 42)}`; // Mock address
  }

  /**
   * Deploy token contract to Base Sepolia
   * Note: This is a placeholder. Actual implementation depends on Task 3 (Smart Contract infrastructure)
   */
  private async deployToBase(name: string, symbol: string): Promise<string> {
    // TODO: Implement actual Base Sepolia ERC-20 deployment
    // This will be implemented in Task 3 (Smart Contract infrastructure)
    console.log(`[Placeholder] Deploying ${symbol} to Base Sepolia...`);
    return `0x${Math.random().toString(16).substring(2, 42)}`; // Mock address
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
   */
  async createMemecoin(request: CreateMemecoinRequest): Promise<CreateMemecoinResponse> {
    const { streamerId, streamerName, streamId } = request;

    // Generate unique token symbol
    const symbol = await this.generateTokenSymbol(streamerName);
    const name = `${streamerName} Coin`;

    // Deploy to both chains
    const hederaAddress = await this.deployToHedera(name, symbol);
    const baseAddress = await this.deployToBase(name, symbol);

    // Calculate initial state
    const initialTokensSold = 0;
    const initialPrice = this.calculatePrice(initialTokensSold);
    const initialMarketCap = initialPrice * initialTokensSold;

    // Create memecoin record
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
      })
      .select()
      .single();

    if (memecoinError || !memecoinData) {
      throw new Error(`Failed to create memecoin: ${memecoinError?.message}`);
    }

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

    // Cache bonding curve state in Redis
    const redis = await getRedisClient();
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
