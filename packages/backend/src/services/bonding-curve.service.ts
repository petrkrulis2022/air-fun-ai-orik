// Bonding Curve Service
// Handles token pricing, purchase validation, and fee distribution

import { getRedisClient } from "../config/redis.js";
import supabase from "../config/supabase.js";
import {
  PriceQuote,
  PurchaseRequest,
  Purchase,
  FeeDistribution,
  ValidationResult,
  CREATOR_FEE_PERCENTAGE,
  PLATFORM_FEE_PERCENTAGE,
  MINIMUM_PURCHASE_USDC,
  DEFAULT_SLIPPAGE,
} from "../types/bonding-curve.types.js";
import { BondingCurveState, BONDING_CURVE_K, GRADUATION_MARKET_CAP } from "../types/token.types.js";
import { realtimeService } from "./realtime.service.js";
import cacheService from "./cache.service.js";

export class BondingCurveService {
  /**
   * Calculate token price at a given supply using bonding curve formula
   * Formula: price = k * tokensSold²
   * @param tokensSold - Current number of tokens sold
   * @returns Price per token in USDC
   */
  calculatePrice(tokensSold: number): number {
    if (tokensSold < 0) {
      throw new Error("Tokens sold cannot be negative");
    }
    return BONDING_CURVE_K * tokensSold * tokensSold;
  }

  /**
   * Calculate the total cost to purchase tokens by integrating the bonding curve
   * Integral of (k * x²) from currentSupply to (currentSupply + tokensToBuy)
   * = k * [(currentSupply + tokensToBuy)³ - currentSupply³] / 3
   * @param currentSupply - Current tokens sold
   * @param tokensToBuy - Number of tokens to purchase
   * @returns Total USDC cost
   */
  calculatePurchaseCost(currentSupply: number, tokensToBuy: number): number {
    if (currentSupply < 0 || tokensToBuy <= 0) {
      throw new Error("Invalid supply or purchase amount");
    }

    const endSupply = currentSupply + tokensToBuy;
    const cost = (BONDING_CURVE_K * (Math.pow(endSupply, 3) - Math.pow(currentSupply, 3))) / 3;

    return cost;
  }

  /**
   * Get a price quote for purchasing tokens
   * @param tokenId - Token identifier
   * @param amount - Number of tokens to purchase
   * @returns Price quote with cost breakdown
   */
  async getPriceQuote(tokenId: string, amount: number): Promise<PriceQuote> {
    if (amount <= 0) {
      throw new Error("Purchase amount must be positive");
    }

    // Get current bonding curve state
    const state = await this.getBondingCurveState(tokenId);
    if (!state) {
      throw new Error("Token not found");
    }

    // Calculate total cost
    const usdcCost = this.calculatePurchaseCost(state.tokensSold, amount);

    // Calculate average price per token
    const pricePerToken = usdcCost / amount;

    // Calculate price impact (% change from current price to average price)
    const currentPrice = this.calculatePrice(state.tokensSold);
    const priceImpact =
      currentPrice > 0 ? ((pricePerToken - currentPrice) / currentPrice) * 100 : 0;

    // Estimate gas (placeholder - actual gas depends on chain)
    const estimatedGas = 0.01; // $0.01 USDC

    return {
      tokenAmount: amount,
      usdcCost,
      pricePerToken,
      priceImpact,
      slippage: DEFAULT_SLIPPAGE,
      estimatedGas,
    };
  }

  /**
   * Get bonding curve state from cache or database
   * @param tokenId - Token identifier
   * @returns Bonding curve state
   */
  private async getBondingCurveState(tokenId: string): Promise<BondingCurveState | null> {
    try {
      // Try to get from cache first (1-second TTL)
      const cached = await cacheService.getBondingCurveState(tokenId);
      if (cached) {
        return cached;
      }

      // If not in cache, get from database
      const { data, error } = await supabase
        .from("bonding_curve_states")
        .select("*")
        .eq("token_id", tokenId)
        .single();

      if (error || !data) {
        return null;
      }

      const state: BondingCurveState = {
        id: data.id,
        tokenId: data.token_id,
        k: data.k,
        tokensSold: data.tokens_sold,
        currentPrice: data.current_price,
        marketCap: data.market_cap,
        nextPrice: data.next_price,
        graduationThreshold: data.graduation_threshold,
        progressToGraduation: data.progress_to_graduation,
        updatedAt: data.updated_at,
      };

      // Cache for 1 second
      await cacheService.cacheBondingCurveState(tokenId, state);

      return state;
    } catch (error) {
      console.error("Error getting bonding curve state:", error);
      return null;
    }
  }

  /**
   * Validate a purchase request
   * @param tokenId - Token identifier
   * @param amount - Number of tokens to purchase
   * @param userId - User making the purchase
   * @returns Validation result
   */
  async validatePurchase(
    tokenId: string,
    amount: number,
    userId: string
  ): Promise<ValidationResult> {
    // Check minimum purchase amount
    const quote = await this.getPriceQuote(tokenId, amount);
    if (quote.usdcCost < MINIMUM_PURCHASE_USDC) {
      return {
        isValid: false,
        error: `Minimum purchase amount is $${MINIMUM_PURCHASE_USDC} USDC`,
      };
    }

    // Check if token has graduated
    const { data: token, error: tokenError } = await supabase
      .from("memecoins")
      .select("is_graduated")
      .eq("id", tokenId)
      .single();

    if (tokenError || !token) {
      return {
        isValid: false,
        error: "Token not found",
      };
    }

    if (token.is_graduated) {
      return {
        isValid: false,
        error: "Token has graduated. Please use the liquidity pool for trading.",
      };
    }

    // Note: Wallet balance verification would happen on-chain during execution
    // This is a placeholder for the validation logic

    return {
      isValid: true,
    };
  }

  /**
   * Execute a token purchase (placeholder - actual execution happens on-chain)
   * @param purchase - Purchase request
   * @returns Purchase record
   */
  async executePurchase(purchase: PurchaseRequest): Promise<Purchase> {
    // Validate purchase
    const validation = await this.validatePurchase(
      purchase.tokenId,
      purchase.amount,
      purchase.buyerId
    );

    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Get current state
    const state = await this.getBondingCurveState(purchase.tokenId);
    if (!state) {
      throw new Error("Token not found");
    }

    // Calculate costs
    const totalCost = this.calculatePurchaseCost(state.tokensSold, purchase.amount);
    const pricePerToken = totalCost / purchase.amount;

    // Check slippage
    const quote = await this.getPriceQuote(purchase.tokenId, purchase.amount);
    const slippagePercent = Math.abs(quote.pricePerToken - pricePerToken) / quote.pricePerToken;

    if (slippagePercent > purchase.maxSlippage) {
      throw new Error(
        `Slippage exceeded: ${(slippagePercent * 100).toFixed(2)}% > ${(purchase.maxSlippage * 100).toFixed(2)}%`
      );
    }

    // Calculate fees
    const creatorFee = totalCost * CREATOR_FEE_PERCENTAGE;
    const platformFee = totalCost * PLATFORM_FEE_PERCENTAGE;

    // TODO: Call smart contract to execute purchase
    // This is a placeholder - actual implementation would interact with blockchain
    const txHash = `0x${Math.random().toString(16).substring(2)}`;

    // Create purchase record
    const purchaseRecord: Purchase = {
      id: `purchase_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      tokenId: purchase.tokenId,
      buyerId: purchase.buyerId,
      amount: purchase.amount,
      price: pricePerToken,
      totalSpent: totalCost,
      fees: {
        creatorFee,
        platformFee,
      },
      txHash,
      timestamp: Date.now(),
    };

    // Get stream ID and buyer username for broadcasting
    const { data: token } = await supabase
      .from("memecoins")
      .select("stream_id")
      .eq("id", purchase.tokenId)
      .single();

    const streamId = token?.stream_id;

    // Get buyer username
    const { data: buyer } = await supabase
      .from("users")
      .select("username")
      .eq("id", purchase.buyerId)
      .single();

    const buyerUsername = buyer?.username || "Anonymous";

    // Update bonding curve state and broadcast price update
    await this.updateBondingCurveState(
      purchase.tokenId,
      state.tokensSold + purchase.amount,
      streamId
    );

    // Store purchase in database
    await supabase.from("purchases").insert({
      id: purchaseRecord.id,
      token_id: purchaseRecord.tokenId,
      buyer_id: purchaseRecord.buyerId,
      amount: purchaseRecord.amount,
      price: purchaseRecord.price,
      total_spent: purchaseRecord.totalSpent,
      creator_fee: purchaseRecord.fees.creatorFee,
      platform_fee: purchaseRecord.fees.platformFee,
      tx_hash: purchaseRecord.txHash,
      timestamp: purchaseRecord.timestamp,
    });

    // Broadcast purchase notification to all viewers in the stream
    // This ensures notifications are delivered within 1 second as per requirement 14.4
    if (streamId) {
      const newMarketCap =
        this.calculatePrice(state.tokensSold + purchase.amount) *
        (state.tokensSold + purchase.amount);
      realtimeService.broadcastPurchaseNotification(
        streamId,
        purchaseRecord,
        buyerUsername,
        newMarketCap
      );
    }

    return purchaseRecord;
  }

  /**
   * Update bonding curve state after a purchase
   * @param tokenId - Token identifier
   * @param newTokensSold - New total tokens sold
   * @param streamId - Optional stream ID for broadcasting price updates
   */
  private async updateBondingCurveState(
    tokenId: string,
    newTokensSold: number,
    streamId?: string
  ): Promise<void> {
    const currentPrice = this.calculatePrice(newTokensSold);
    const nextPrice = this.calculatePrice(newTokensSold + 1000); // Preview for next 1000 tokens
    const marketCap = currentPrice * newTokensSold;
    const progressToGraduation = Math.min(marketCap / GRADUATION_MARKET_CAP, 1);

    const updatedAt = Date.now();

    // Update database
    await supabase
      .from("bonding_curve_states")
      .update({
        tokens_sold: newTokensSold,
        current_price: currentPrice,
        market_cap: marketCap,
        next_price: nextPrice,
        progress_to_graduation: progressToGraduation,
        updated_at: updatedAt,
      })
      .eq("token_id", tokenId);

    // Invalidate cache using cache service
    await cacheService.invalidateBondingCurveState(tokenId);

    // Broadcast price update to all viewers in the stream (if streamId provided)
    // This ensures updates are delivered within 500ms as per requirement 11.5
    if (streamId) {
      const updatedState: BondingCurveState = {
        id: tokenId, // Using tokenId as id for the state
        tokenId,
        k: BONDING_CURVE_K,
        tokensSold: newTokensSold,
        currentPrice,
        marketCap,
        nextPrice,
        graduationThreshold: GRADUATION_MARKET_CAP,
        progressToGraduation,
        updatedAt,
      };

      realtimeService.broadcastPriceUpdate(streamId, updatedState);
    }
  }

  /**
   * Distribute fees from a purchase
   * @param purchaseId - Purchase identifier
   * @returns Fee distribution record
   */
  async distributeFees(purchaseId: string): Promise<FeeDistribution> {
    // Get purchase record
    const { data: purchase, error } = await supabase
      .from("purchases")
      .select("*")
      .eq("id", purchaseId)
      .single();

    if (error || !purchase) {
      throw new Error("Purchase not found");
    }

    const creatorAmount = purchase.creator_fee;
    const platformAmount = purchase.platform_fee;

    // Verify fee sum equals 100%
    const totalFees = creatorAmount + platformAmount;
    const expectedTotal = purchase.total_spent;
    const tolerance = 0.000001; // Allow for floating point precision

    if (Math.abs(totalFees - expectedTotal) > tolerance) {
      throw new Error(
        `Fee distribution error: ${creatorAmount} + ${platformAmount} != ${expectedTotal}`
      );
    }

    // TODO: Execute on-chain transfers
    // This is a placeholder - actual implementation would interact with blockchain
    const creatorTxHash = `0x${Math.random().toString(16).substring(2)}`;
    const platformTxHash = `0x${Math.random().toString(16).substring(2)}`;

    return {
      purchaseId,
      creatorAmount,
      platformAmount,
      creatorTxHash,
      platformTxHash,
    };
  }

  /**
   * Get liquidity depth (total USDC in bonding curve)
   * @param tokenId - Token identifier
   * @returns Liquidity depth in USDC
   */
  async getLiquidityDepth(tokenId: string): Promise<number> {
    const state = await this.getBondingCurveState(tokenId);
    if (!state) {
      throw new Error("Token not found");
    }

    // Liquidity depth is the integral from 0 to tokensSold
    // = k * tokensSold³ / 3
    const liquidityDepth = (BONDING_CURVE_K * Math.pow(state.tokensSold, 3)) / 3;

    return liquidityDepth;
  }

  /**
   * Calculate graduation progress percentage
   * @param tokenId - Token identifier
   * @returns Progress percentage (0-100)
   */
  async calculateGraduationProgress(tokenId: string): Promise<number> {
    const state = await this.getBondingCurveState(tokenId);
    if (!state) {
      throw new Error("Token not found");
    }

    const progress = state.progressToGraduation * 100;

    // Cache result with 5-second TTL
    await cacheService.cacheGraduationProgress(tokenId, progress);

    return progress;
  }
}

export default new BondingCurveService();
