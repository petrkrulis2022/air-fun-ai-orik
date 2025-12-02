import { Router, Request, Response } from "express";
import supabase from "../config/supabase.js";

const router = Router();

/**
 * GET /analytics/streamer/:id
 * Get streamer dashboard analytics
 */
router.get("/streamer/:id", async (req: Request, res: Response) => {
  try {
    const { id: streamerId } = req.params;

    // Get total earnings across all streams
    const { data: streams, error: streamsError } = await supabase
      .from("streams")
      .select("total_earnings")
      .eq("streamer_id", streamerId);

    if (streamsError) {
      throw streamsError;
    }

    const totalEarnings =
      streams?.reduce((sum, s) => sum + (parseFloat(s.total_earnings) || 0), 0) || 0;

    // Get stream count
    const { count: totalStreams, error: countError } = await supabase
      .from("streams")
      .select("*", { count: "exact", head: true })
      .eq("streamer_id", streamerId);

    if (countError) {
      throw countError;
    }

    // Get total tokens created
    const { count: totalTokens, error: tokensError } = await supabase
      .from("memecoins")
      .select("*", { count: "exact", head: true })
      .eq("streamer_id", streamerId);

    if (tokensError) {
      throw tokensError;
    }

    // Get total viewers across all streams
    const totalViewers = streams?.reduce((sum, s) => sum + (s.total_viewers || 0), 0) || 0;

    // Get recent streams (last 10)
    const { data: recentStreams, error: recentError } = await supabase
      .from("streams")
      .select("*")
      .eq("streamer_id", streamerId)
      .order("started_at", { ascending: false })
      .limit(10);

    if (recentError) {
      throw recentError;
    }

    // Get tokens created
    const { data: tokens, error: tokensDataError } = await supabase
      .from("memecoins")
      .select("*")
      .eq("streamer_id", streamerId)
      .order("created_at", { ascending: false });

    if (tokensDataError) {
      throw tokensDataError;
    }

    res.json({
      streamerId,
      totalEarnings,
      totalStreams: totalStreams || 0,
      totalTokens: totalTokens || 0,
      totalViewers,
      recentStreams: recentStreams?.map((s) => ({
        id: s.id,
        title: s.title,
        startedAt: s.started_at,
        endedAt: s.ended_at,
        status: s.status,
        peakViewers: s.peak_viewer_count,
        totalViewers: s.total_viewers,
        totalEarnings: parseFloat(s.total_earnings || "0"),
        tokenSymbol: s.token_symbol,
      })),
      tokens: tokens?.map((t) => ({
        id: t.id,
        symbol: t.symbol,
        name: t.name,
        marketCap: parseFloat(t.market_cap || "0"),
        isGraduated: t.is_graduated,
        createdAt: t.created_at,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching streamer analytics:", error);
    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to fetch streamer analytics",
      details: error.message,
      retryable: true,
    });
  }
});

/**
 * GET /analytics/streams/:id
 * Get stream analytics
 */
router.get("/streams/:id", async (req: Request, res: Response) => {
  try {
    const { id: streamId } = req.params;

    // Get stream details
    const { data: stream, error: streamError } = await supabase
      .from("streams")
      .select("*")
      .eq("id", streamId)
      .single();

    if (streamError || !stream) {
      return res.status(404).json({
        code: "STREAM_NOT_FOUND",
        message: "Stream not found",
        retryable: false,
      });
    }

    // Get token details if exists
    let tokenData = null;
    if (stream.token_id) {
      const { data: token, error: tokenError } = await supabase
        .from("memecoins")
        .select("*")
        .eq("id", stream.token_id)
        .single();

      if (!tokenError && token) {
        tokenData = {
          id: token.id,
          symbol: token.symbol,
          name: token.name,
          currentPrice: parseFloat(token.current_price || "0"),
          marketCap: parseFloat(token.market_cap || "0"),
          tokensSold: token.tokens_sold,
          holderCount: token.holder_count,
          transactionCount: token.transaction_count,
          isGraduated: token.is_graduated,
        };
      }
    }

    // Get purchases for this stream's token
    let purchases = [];
    if (stream.token_id) {
      const { data: purchaseData, error: purchaseError } = await supabase
        .from("purchases")
        .select("*, users(username)")
        .eq("token_id", stream.token_id)
        .order("timestamp", { ascending: false })
        .limit(20);

      if (!purchaseError && purchaseData) {
        purchases = purchaseData.map((p) => ({
          id: p.id,
          buyerUsername: p.users?.username || "Anonymous",
          amount: p.amount,
          totalSpent: parseFloat(p.total_spent || "0"),
          timestamp: p.timestamp,
        }));
      }
    }

    // Get agent performance for this stream
    const { data: agents, error: agentsError } = await supabase
      .from("agent_deployments")
      .select("*, agents(name, template_id)")
      .eq("stream_id", streamId);

    const agentPerformance =
      agents?.map((a) => ({
        agentId: a.agent_id,
        name: a.agents?.name || "Unknown",
        templateId: a.agents?.template_id,
        totalClicks: a.total_clicks || 0,
        totalPurchases: a.total_purchases || 0,
        totalVolume: parseFloat(a.total_volume || "0"),
        conversionRate: a.conversion_rate || 0,
      })) || [];

    res.json({
      stream: {
        id: stream.id,
        title: stream.title,
        category: stream.category,
        status: stream.status,
        startedAt: stream.started_at,
        endedAt: stream.ended_at,
        peakViewers: stream.peak_viewer_count,
        totalViewers: stream.total_viewers,
        totalEarnings: parseFloat(stream.total_earnings || "0"),
        totalTokensSold: stream.total_tokens_sold,
        totalVolume: parseFloat(stream.total_volume || "0"),
        agentClickCount: stream.agent_click_count || 0,
      },
      token: tokenData,
      recentPurchases: purchases,
      agentPerformance,
    });
  } catch (error: any) {
    console.error("Error fetching stream analytics:", error);
    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to fetch stream analytics",
      details: error.message,
      retryable: true,
    });
  }
});

/**
 * GET /analytics/tokens/:id
 * Get token performance analytics
 */
router.get("/tokens/:id", async (req: Request, res: Response) => {
  try {
    const { id: tokenId } = req.params;

    // Get token details
    const { data: token, error: tokenError } = await supabase
      .from("memecoins")
      .select("*")
      .eq("id", tokenId)
      .single();

    if (tokenError || !token) {
      return res.status(404).json({
        code: "TOKEN_NOT_FOUND",
        message: "Token not found",
        retryable: false,
      });
    }

    // Get bonding curve state
    const { data: curveState, error: curveError } = await supabase
      .from("bonding_curve_states")
      .select("*")
      .eq("token_id", tokenId)
      .single();

    // Get purchase history
    const { data: purchases, error: purchasesError } = await supabase
      .from("purchases")
      .select("*, users(username)")
      .eq("token_id", tokenId)
      .order("timestamp", { ascending: false })
      .limit(50);

    const purchaseHistory =
      purchases?.map((p) => ({
        id: p.id,
        buyerUsername: p.users?.username || "Anonymous",
        amount: p.amount,
        price: parseFloat(p.price || "0"),
        totalSpent: parseFloat(p.total_spent || "0"),
        timestamp: p.timestamp,
      })) || [];

    // Calculate price history (sample every 10 purchases)
    const priceHistory =
      purchases
        ?.filter((_, index) => index % 10 === 0)
        .map((p) => ({
          timestamp: p.timestamp,
          price: parseFloat(p.price || "0"),
        }))
        .reverse() || [];

    // Get holder count (unique buyers)
    const { data: holders, error: holdersError } = await supabase
      .from("purchases")
      .select("buyer_id")
      .eq("token_id", tokenId);

    const uniqueHolders = new Set(holders?.map((h) => h.buyer_id) || []).size;

    // Get liquidity pool info if graduated
    let liquidityPool = null;
    if (token.is_graduated) {
      const { data: pool, error: poolError } = await supabase
        .from("liquidity_pools")
        .select("*")
        .eq("token_id", tokenId)
        .single();

      if (!poolError && pool) {
        liquidityPool = {
          id: pool.id,
          poolAddress: pool.pool_address,
          tokenReserve: parseFloat(pool.token_reserve || "0"),
          airReserve: parseFloat(pool.air_reserve || "0"),
          lpTokensBurned: pool.lp_tokens_burned,
          createdAt: pool.created_at,
        };
      }
    }

    res.json({
      token: {
        id: token.id,
        symbol: token.symbol,
        name: token.name,
        streamId: token.stream_id,
        currentPrice: parseFloat(token.current_price || "0"),
        marketCap: parseFloat(token.market_cap || "0"),
        tokensSold: token.tokens_sold,
        totalSupply: token.total_supply,
        holderCount: uniqueHolders,
        transactionCount: token.transaction_count,
        totalVolume: parseFloat(token.total_volume || "0"),
        creatorEarnings: parseFloat(token.creator_earnings || "0"),
        isGraduated: token.is_graduated,
        graduatedAt: token.graduated_at,
        createdAt: token.created_at,
      },
      bondingCurve: curveState
        ? {
            currentPrice: parseFloat(curveState.current_price || "0"),
            nextPrice: parseFloat(curveState.next_price || "0"),
            progressToGraduation: curveState.progress_to_graduation,
            graduationThreshold: parseFloat(curveState.graduation_threshold || "0"),
          }
        : null,
      purchaseHistory,
      priceHistory,
      liquidityPool,
    });
  } catch (error: any) {
    console.error("Error fetching token analytics:", error);
    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to fetch token analytics",
      details: error.message,
      retryable: true,
    });
  }
});

export default router;
