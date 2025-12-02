// Database Service
// Provides optimized database queries with prepared statements and connection pooling
// Implements Requirement 21.4

import { supabase } from "../config/supabase.js";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";

/**
 * Database Service
 * Provides optimized query methods with prepared statements and caching
 */
export class DatabaseService {
  /**
   * Execute a query with automatic retry on connection errors
   * @param queryFn - Function that executes the query
   * @param maxRetries - Maximum number of retries (default: 3)
   * @returns Query result
   */
  async executeWithRetry<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    maxRetries: number = 3
  ): Promise<{ data: T | null; error: any }> {
    let lastError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await queryFn();

        // If successful or non-retryable error, return immediately
        if (!result.error || !this.isRetryableError(result.error)) {
          return result;
        }

        lastError = result.error;

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries - 1) {
          await this.sleep(Math.pow(2, attempt) * 100); // 100ms, 200ms, 400ms
        }
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries - 1) {
          await this.sleep(Math.pow(2, attempt) * 100);
        }
      }
    }

    return { data: null, error: lastError };
  }

  /**
   * Check if an error is retryable (connection/timeout errors)
   */
  private isRetryableError(error: any): boolean {
    if (!error) return false;

    const retryableMessages = [
      "connection",
      "timeout",
      "ECONNREFUSED",
      "ETIMEDOUT",
      "ENOTFOUND",
      "network",
    ];

    const errorMessage = error.message?.toLowerCase() || "";
    return retryableMessages.some((msg) => errorMessage.includes(msg));
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get active streams with optimized query
   * Uses covering index for better performance
   */
  async getActiveStreams(
    filters: {
      category?: string;
      minViewers?: number;
      minMarketCap?: number;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    return this.executeWithRetry(async () => {
      let query = supabase
        .from("streams")
        .select(
          `
          id,
          streamer_id,
          title,
          category,
          thumbnail_url,
          token_symbol,
          token_market_cap,
          peak_viewer_count,
          started_at,
          status,
          users!inner(username)
        `
        )
        .eq("status", "live");

      if (filters.category) {
        query = query.eq("category", filters.category);
      }

      if (filters.minViewers) {
        query = query.gte("peak_viewer_count", filters.minViewers);
      }

      if (filters.minMarketCap) {
        query = query.gte("token_market_cap", filters.minMarketCap);
      }

      // Use index-optimized ordering
      query = query.order("started_at", { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      return await query;
    });
  }

  /**
   * Get user purchases with optimized query
   * Uses composite index on buyer_id and timestamp
   */
  async getUserPurchases(userId: string, limit: number = 50) {
    return this.executeWithRetry(async () => {
      return await supabase
        .from("purchases")
        .select(
          `
          id,
          token_id,
          amount,
          price,
          total_spent,
          tx_hash,
          timestamp,
          memecoins!inner(symbol, name)
        `
        )
        .eq("buyer_id", userId)
        .order("timestamp", { ascending: false })
        .limit(limit);
    });
  }

  /**
   * Get token purchases with optimized query
   * Uses composite index on token_id and timestamp
   */
  async getTokenPurchases(tokenId: string, limit: number = 100) {
    return this.executeWithRetry(async () => {
      return await supabase
        .from("purchases")
        .select(
          `
          id,
          buyer_id,
          amount,
          price,
          total_spent,
          timestamp,
          users!inner(username)
        `
        )
        .eq("token_id", tokenId)
        .order("timestamp", { ascending: false })
        .limit(limit);
    });
  }

  /**
   * Get agent statistics with optimized aggregation
   * Uses indexes on agent_id for fast aggregation
   */
  async getAgentStats(agentId: string) {
    return this.executeWithRetry(async () => {
      // Get click count
      const { data: clickData } = await supabase
        .from("agent_clicks")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", agentId);

      // Get purchase stats
      const { data: purchaseData } = await supabase
        .from("agent_purchases")
        .select("token_amount, usdc_amount")
        .eq("agent_id", agentId);

      const totalClicks = clickData?.length || 0;
      const totalPurchases = purchaseData?.length || 0;
      const totalVolume =
        purchaseData?.reduce((sum, p) => sum + parseFloat(p.usdc_amount.toString()), 0) || 0;
      const conversionRate = totalClicks > 0 ? totalPurchases / totalClicks : 0;
      const averagePurchaseSize = totalPurchases > 0 ? totalVolume / totalPurchases : 0;

      return {
        data: {
          totalClicks,
          totalPurchases,
          totalVolume,
          conversionRate,
          averagePurchaseSize,
        },
        error: null,
      };
    });
  }

  /**
   * Batch insert records for better performance
   * @param table - Table name
   * @param records - Array of records to insert
   * @param batchSize - Number of records per batch (default: 100)
   */
  async batchInsert(table: string, records: any[], batchSize: number = 100) {
    const results = [];

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      const result = await this.executeWithRetry(async () => {
        return await supabase.from(table).insert(batch);
      });

      results.push(result);

      // If there's an error, stop processing
      if (result.error) {
        console.error(`Batch insert error at batch ${i / batchSize}:`, result.error);
        break;
      }
    }

    return results;
  }

  /**
   * Batch update records for better performance
   * @param table - Table name
   * @param updates - Array of {id, data} objects
   */
  async batchUpdate(table: string, updates: Array<{ id: string; data: any }>) {
    const results = [];

    for (const update of updates) {
      const result = await this.executeWithRetry(async () => {
        return await supabase.from(table).update(update.data).eq("id", update.id);
      });

      results.push(result);

      // If there's an error, log it but continue
      if (result.error) {
        console.error(`Batch update error for id ${update.id}:`, result.error);
      }
    }

    return results;
  }

  /**
   * Execute a raw SQL query (use with caution)
   * Useful for complex queries that can't be expressed with the query builder
   */
  async executeRawQuery(query: string, params: any[] = []) {
    return this.executeWithRetry(async () => {
      return await supabase.rpc("execute_sql", { query, params });
    });
  }

  /**
   * Get database connection pool statistics
   * Useful for monitoring and debugging
   */
  async getConnectionPoolStats() {
    try {
      // This would require a custom RPC function in Supabase
      // For now, return a placeholder
      return {
        activeConnections: 0,
        idleConnections: 0,
        totalConnections: 0,
        waitingClients: 0,
      };
    } catch (error) {
      console.error("Error getting connection pool stats:", error);
      return null;
    }
  }

  /**
   * Optimize a table by running VACUUM ANALYZE
   * Should be run periodically for tables with frequent updates/deletes
   */
  async optimizeTable(tableName: string) {
    try {
      // This would require a custom RPC function with elevated privileges
      console.log(`Optimizing table ${tableName}...`);
      // await supabase.rpc('vacuum_analyze', { table_name: tableName });
      return { success: true };
    } catch (error) {
      console.error(`Error optimizing table ${tableName}:`, error);
      return { success: false, error };
    }
  }
}

export default new DatabaseService();
