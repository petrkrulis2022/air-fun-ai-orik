// Cache Service
// Centralized caching layer for bonding curve states, active streams, and token metadata
// Implements Requirements 11, 21

import { getRedisClient } from "../config/redis.js";
import { BondingCurveState } from "../types/bonding-curve.types.js";
import { Stream } from "../types/stream.types.js";
import { Memecoin } from "../types/token.types.js";

/**
 * Cache Service
 * Provides centralized caching with configurable TTLs
 */
export class CacheService {
  // Cache TTLs (in seconds)
  private readonly BONDING_CURVE_TTL = 1; // 1 second (Requirement 11, 21)
  private readonly ACTIVE_STREAMS_TTL = 5; // 5 seconds
  private readonly TOKEN_METADATA_TTL = 300; // 5 minutes
  private readonly GRADUATION_PROGRESS_TTL = 5; // 5 seconds
  private readonly PRICE_QUOTE_TTL = 1; // 1 second

  /**
   * Cache bonding curve state with 1-second TTL
   * @param tokenId - Token identifier
   * @param state - Bonding curve state
   */
  async cacheBondingCurveState(tokenId: string, state: BondingCurveState): Promise<void> {
    try {
      const redis = await getRedisClient();
      const key = this.getBondingCurveKey(tokenId);
      await redis.setEx(key, this.BONDING_CURVE_TTL, JSON.stringify(state));
    } catch (error) {
      console.error(`Error caching bonding curve state for token ${tokenId}:`, error);
      // Don't throw - caching failures should not break the application
    }
  }

  /**
   * Get bonding curve state from cache
   * @param tokenId - Token identifier
   * @returns Bonding curve state or null if not cached
   */
  async getBondingCurveState(tokenId: string): Promise<BondingCurveState | null> {
    try {
      const redis = await getRedisClient();
      const key = this.getBondingCurveKey(tokenId);
      const cached = await redis.get(key);

      if (cached) {
        return JSON.parse(cached) as BondingCurveState;
      }

      return null;
    } catch (error) {
      console.error(`Error getting bonding curve state from cache for token ${tokenId}:`, error);
      return null;
    }
  }

  /**
   * Invalidate bonding curve state cache
   * @param tokenId - Token identifier
   */
  async invalidateBondingCurveState(tokenId: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      const key = this.getBondingCurveKey(tokenId);
      await redis.del(key);
    } catch (error) {
      console.error(`Error invalidating bonding curve state for token ${tokenId}:`, error);
    }
  }

  /**
   * Cache active streams list with 5-second TTL
   * @param streams - List of active streams
   * @param filterKey - Optional filter key for different cached lists
   */
  async cacheActiveStreams(streams: Stream[], filterKey: string = "default"): Promise<void> {
    try {
      const redis = await getRedisClient();
      const key = this.getActiveStreamsKey(filterKey);
      await redis.setEx(key, this.ACTIVE_STREAMS_TTL, JSON.stringify(streams));
    } catch (error) {
      console.error(`Error caching active streams:`, error);
    }
  }

  /**
   * Get active streams from cache
   * @param filterKey - Optional filter key for different cached lists
   * @returns List of active streams or null if not cached
   */
  async getActiveStreams(filterKey: string = "default"): Promise<Stream[] | null> {
    try {
      const redis = await getRedisClient();
      const key = this.getActiveStreamsKey(filterKey);
      const cached = await redis.get(key);

      if (cached) {
        return JSON.parse(cached) as Stream[];
      }

      return null;
    } catch (error) {
      console.error(`Error getting active streams from cache:`, error);
      return null;
    }
  }

  /**
   * Invalidate active streams cache
   * @param filterKey - Optional filter key, or "all" to clear all stream caches
   */
  async invalidateActiveStreams(filterKey: string = "default"): Promise<void> {
    try {
      const redis = await getRedisClient();

      if (filterKey === "all") {
        // Clear all active stream caches
        const keys = await redis.keys("active_streams:*");
        if (keys.length > 0) {
          await redis.del(keys);
        }
      } else {
        const key = this.getActiveStreamsKey(filterKey);
        await redis.del(key);
      }
    } catch (error) {
      console.error(`Error invalidating active streams cache:`, error);
    }
  }

  /**
   * Cache token metadata with 5-minute TTL
   * @param tokenId - Token identifier
   * @param metadata - Token metadata
   */
  async cacheTokenMetadata(tokenId: string, metadata: Partial<Memecoin>): Promise<void> {
    try {
      const redis = await getRedisClient();
      const key = this.getTokenMetadataKey(tokenId);
      await redis.setEx(key, this.TOKEN_METADATA_TTL, JSON.stringify(metadata));
    } catch (error) {
      console.error(`Error caching token metadata for token ${tokenId}:`, error);
    }
  }

  /**
   * Get token metadata from cache
   * @param tokenId - Token identifier
   * @returns Token metadata or null if not cached
   */
  async getTokenMetadata(tokenId: string): Promise<Partial<Memecoin> | null> {
    try {
      const redis = await getRedisClient();
      const key = this.getTokenMetadataKey(tokenId);
      const cached = await redis.get(key);

      if (cached) {
        return JSON.parse(cached) as Partial<Memecoin>;
      }

      return null;
    } catch (error) {
      console.error(`Error getting token metadata from cache for token ${tokenId}:`, error);
      return null;
    }
  }

  /**
   * Invalidate token metadata cache
   * @param tokenId - Token identifier
   */
  async invalidateTokenMetadata(tokenId: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      const key = this.getTokenMetadataKey(tokenId);
      await redis.del(key);
    } catch (error) {
      console.error(`Error invalidating token metadata for token ${tokenId}:`, error);
    }
  }

  /**
   * Cache graduation progress with 5-second TTL
   * @param tokenId - Token identifier
   * @param progress - Graduation progress percentage (0-100)
   */
  async cacheGraduationProgress(tokenId: string, progress: number): Promise<void> {
    try {
      const redis = await getRedisClient();
      const key = this.getGraduationProgressKey(tokenId);
      await redis.setEx(key, this.GRADUATION_PROGRESS_TTL, progress.toString());
    } catch (error) {
      console.error(`Error caching graduation progress for token ${tokenId}:`, error);
    }
  }

  /**
   * Get graduation progress from cache
   * @param tokenId - Token identifier
   * @returns Graduation progress or null if not cached
   */
  async getGraduationProgress(tokenId: string): Promise<number | null> {
    try {
      const redis = await getRedisClient();
      const key = this.getGraduationProgressKey(tokenId);
      const cached = await redis.get(key);

      if (cached) {
        return parseFloat(cached);
      }

      return null;
    } catch (error) {
      console.error(`Error getting graduation progress from cache for token ${tokenId}:`, error);
      return null;
    }
  }

  /**
   * Cache price quote with 1-second TTL
   * @param tokenId - Token identifier
   * @param amount - Token amount
   * @param quote - Price quote
   */
  async cachePriceQuote(tokenId: string, amount: number, quote: any): Promise<void> {
    try {
      const redis = await getRedisClient();
      const key = this.getPriceQuoteKey(tokenId, amount);
      await redis.setEx(key, this.PRICE_QUOTE_TTL, JSON.stringify(quote));
    } catch (error) {
      console.error(`Error caching price quote for token ${tokenId}:`, error);
    }
  }

  /**
   * Get price quote from cache
   * @param tokenId - Token identifier
   * @param amount - Token amount
   * @returns Price quote or null if not cached
   */
  async getPriceQuote(tokenId: string, amount: number): Promise<any | null> {
    try {
      const redis = await getRedisClient();
      const key = this.getPriceQuoteKey(tokenId, amount);
      const cached = await redis.get(key);

      if (cached) {
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      console.error(`Error getting price quote from cache for token ${tokenId}:`, error);
      return null;
    }
  }

  /**
   * Batch invalidate multiple cache keys
   * @param keys - Array of cache keys to invalidate
   */
  async batchInvalidate(keys: string[]): Promise<void> {
    try {
      if (keys.length === 0) return;

      const redis = await getRedisClient();
      await redis.del(keys);
    } catch (error) {
      console.error(`Error batch invalidating cache keys:`, error);
    }
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    bondingCurveKeys: number;
    streamKeys: number;
    tokenMetadataKeys: number;
  }> {
    try {
      const redis = await getRedisClient();

      const allKeys = await redis.keys("*");
      const bondingCurveKeys = await redis.keys("bonding_curve:*");
      const streamKeys = await redis.keys("active_streams:*");
      const tokenMetadataKeys = await redis.keys("token_metadata:*");

      return {
        totalKeys: allKeys.length,
        bondingCurveKeys: bondingCurveKeys.length,
        streamKeys: streamKeys.length,
        tokenMetadataKeys: tokenMetadataKeys.length,
      };
    } catch (error) {
      console.error(`Error getting cache stats:`, error);
      return {
        totalKeys: 0,
        bondingCurveKeys: 0,
        streamKeys: 0,
        tokenMetadataKeys: 0,
      };
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async clearAll(): Promise<void> {
    try {
      const redis = await getRedisClient();
      await redis.flushDb();
      console.log("All cache cleared");
    } catch (error) {
      console.error(`Error clearing all cache:`, error);
    }
  }

  // Private helper methods for generating cache keys

  private getBondingCurveKey(tokenId: string): string {
    return `bonding_curve:${tokenId}`;
  }

  private getActiveStreamsKey(filterKey: string): string {
    return `active_streams:${filterKey}`;
  }

  private getTokenMetadataKey(tokenId: string): string {
    return `token_metadata:${tokenId}`;
  }

  private getGraduationProgressKey(tokenId: string): string {
    return `graduation_progress:${tokenId}`;
  }

  private getPriceQuoteKey(tokenId: string, amount: number): string {
    return `price_quote:${tokenId}:${amount}`;
  }
}

export default new CacheService();
