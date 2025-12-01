// Streaming Service
import { supabase } from "../config/supabase.js";
import { getRedisClient } from "../config/redis.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  Stream,
  StreamRecord,
  StreamSummary,
  StreamConfig,
  StreamFilters,
  TransportOptions,
  ConsumerOptions,
  CreateStreamRequest,
  CreateStreamResponse,
  EndStreamRequest,
  EndStreamResponse,
  Buyer,
} from "../types/stream.types.js";
import { mediaServerService } from "./media-server.service.js";
import tokenFactoryService from "./token-factory.service.js";
import { types as mediasoupTypes } from "mediasoup";

/**
 * Streaming Service
 * Handles livestream lifecycle, WebRTC connections, and stream discovery
 */
export class StreamingService {
  private s3Client: S3Client;
  private activeViewers: Map<string, Set<string>> = new Map(); // streamId -> Set<userId>

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }

  /**
   * Start a new livestream
   * Creates stream record, router, producer transport, and triggers memecoin creation
   */
  async startStream(request: CreateStreamRequest): Promise<CreateStreamResponse> {
    const { streamerId, config } = request;

    // Get streamer info
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("username")
      .eq("id", streamerId)
      .single();

    if (userError || !userData) {
      throw new Error("Streamer not found");
    }

    const streamerName = userData.username;

    // Create stream record
    const { data: streamData, error: streamError } = await supabase
      .from("streams")
      .insert({
        streamer_id: streamerId,
        title: config.title,
        category: config.category,
        quality: config.quality,
        enable_chat: config.enableChat,
        status: "live",
      })
      .select()
      .single();

    if (streamError || !streamData) {
      throw new Error(`Failed to create stream: ${streamError?.message}`);
    }

    const streamId = streamData.id;

    // Create WebRTC router for this stream
    await mediaServerService.createRouter(streamId);

    // Create producer transport for streamer
    const { params: transportParams } = await mediaServerService.createWebRtcTransport(
      streamId,
      true
    );

    // Trigger automatic memecoin creation (async, don't block stream start)
    this.createMemecoinForStream(streamId, streamerId, streamerName).catch((error) => {
      console.error(`Failed to create memecoin for stream ${streamId}:`, error);
    });

    // Generate thumbnail (async, don't block stream start)
    this.generateThumbnail(streamId).catch((error) => {
      console.error(`Failed to generate thumbnail for stream ${streamId}:`, error);
    });

    // Initialize viewer tracking
    this.activeViewers.set(streamId, new Set());

    // Cache stream in Redis for quick discovery
    const redis = await getRedisClient();
    await redis.setEx(
      `stream:${streamId}`,
      300, // 5 minute TTL
      JSON.stringify({
        id: streamId,
        streamerId,
        streamerName,
        title: config.title,
        category: config.category,
        status: "live",
      })
    );

    const streamRecord: StreamRecord = {
      id: streamData.id,
      streamerId: streamData.streamer_id,
      title: streamData.title,
      category: streamData.category,
      thumbnailUrl: streamData.thumbnail_url || "",
      startedAt: streamData.started_at,
      endedAt: streamData.ended_at,
      status: streamData.status,
      tokenId: streamData.token_id,
      tokenSymbol: streamData.token_symbol,
      tokenMarketCap: streamData.token_market_cap
        ? parseFloat(streamData.token_market_cap)
        : undefined,
      peakViewerCount: streamData.peak_viewer_count,
      totalViewers: streamData.total_viewers,
      totalTokensSold: parseFloat(streamData.total_tokens_sold),
      totalVolume: parseFloat(streamData.total_volume),
      totalEarnings: parseFloat(streamData.total_earnings),
      agentClickCount: streamData.agent_click_count,
      quality: streamData.quality,
      enableChat: streamData.enable_chat,
    };

    return {
      stream: streamRecord,
      transportOptions: {
        id: transportParams.id,
        iceParameters: transportParams.iceParameters,
        iceCandidates: transportParams.iceCandidates,
        dtlsParameters: transportParams.dtlsParameters,
      },
    };
  }

  /**
   * Create memecoin for stream (called automatically on stream start)
   */
  private async createMemecoinForStream(
    streamId: string,
    streamerId: string,
    streamerName: string
  ): Promise<void> {
    try {
      const result = await tokenFactoryService.createMemecoin({
        streamerId,
        streamerName,
        streamId,
      });

      // Update stream with token info
      await supabase
        .from("streams")
        .update({
          token_id: result.memecoin.id,
          token_symbol: result.memecoin.symbol,
          token_market_cap: result.memecoin.marketCap,
        })
        .eq("id", streamId);

      console.log(`Memecoin ${result.memecoin.symbol} created for stream ${streamId}`);
    } catch (error) {
      console.error("Failed to create memecoin:", error);
      throw error;
    }
  }

  /**
   * Generate and upload thumbnail to S3
   */
  private async generateThumbnail(streamId: string): Promise<void> {
    try {
      // TODO: Implement actual thumbnail generation from video frame
      // For now, use a placeholder
      const placeholderImage = Buffer.from("placeholder-thumbnail");

      const key = `thumbnails/${streamId}.jpg`;
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME || "air-fun-thumbnails",
          Key: key,
          Body: placeholderImage,
          ContentType: "image/jpeg",
        })
      );

      const thumbnailUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;

      // Update stream with thumbnail URL
      await supabase.from("streams").update({ thumbnail_url: thumbnailUrl }).eq("id", streamId);

      console.log(`Thumbnail generated for stream ${streamId}`);
    } catch (error) {
      console.error("Failed to generate thumbnail:", error);
    }
  }

  /**
   * End a livestream
   * Closes WebRTC connections and generates stream summary
   */
  async endStream(request: EndStreamRequest): Promise<EndStreamResponse> {
    const { streamId } = request;

    // Get stream data
    const { data: streamData, error: streamError } = await supabase
      .from("streams")
      .select("*")
      .eq("id", streamId)
      .single();

    if (streamError || !streamData) {
      throw new Error("Stream not found");
    }

    if (streamData.status === "ended") {
      throw new Error("Stream already ended");
    }

    const endedAt = Date.now();
    const duration = Math.floor((endedAt - streamData.started_at) / 1000); // seconds

    // Get top buyers from purchases (placeholder - will be implemented with purchase service)
    const topBuyers: Buyer[] = [];

    // Update stream status
    await supabase
      .from("streams")
      .update({
        status: "ended",
        ended_at: endedAt,
      })
      .eq("id", streamId);

    // Close WebRTC router and all connections
    await mediaServerService.closeStream(streamId);

    // Remove from active viewers
    this.activeViewers.delete(streamId);

    // Remove from Redis cache
    const redis = await getRedisClient();
    await redis.del(`stream:${streamId}`);

    const summary: StreamSummary = {
      totalViewers: streamData.total_viewers,
      peakViewers: streamData.peak_viewer_count,
      totalEarnings: parseFloat(streamData.total_earnings),
      totalTokensSold: parseFloat(streamData.total_tokens_sold),
      duration,
      topBuyers,
    };

    return { summary };
  }

  /**
   * Get stream status
   */
  async getStreamStatus(streamId: string): Promise<StreamRecord | null> {
    const { data, error } = await supabase.from("streams").select("*").eq("id", streamId).single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      streamerId: data.streamer_id,
      title: data.title,
      category: data.category,
      thumbnailUrl: data.thumbnail_url || "",
      startedAt: data.started_at,
      endedAt: data.ended_at,
      status: data.status,
      tokenId: data.token_id,
      tokenSymbol: data.token_symbol,
      tokenMarketCap: data.token_market_cap ? parseFloat(data.token_market_cap) : undefined,
      peakViewerCount: data.peak_viewer_count,
      totalViewers: data.total_viewers,
      totalTokensSold: parseFloat(data.total_tokens_sold),
      totalVolume: parseFloat(data.total_volume),
      totalEarnings: parseFloat(data.total_earnings),
      agentClickCount: data.agent_click_count,
      quality: data.quality,
      enableChat: data.enable_chat,
    };
  }

  /**
   * List active streams with filters
   */
  async listActiveStreams(filters: StreamFilters = {}): Promise<Stream[]> {
    let query = supabase.from("streams").select("*, users!inner(username)").eq("status", "live");

    if (filters.category) {
      query = query.eq("category", filters.category);
    }

    if (filters.minViewers) {
      query = query.gte("peak_viewer_count", filters.minViewers);
    }

    if (filters.minMarketCap) {
      query = query.gte("token_market_cap", filters.minMarketCap);
    }

    query = query.order("started_at", { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list streams: ${error.message}`);
    }

    return (data || []).map((stream: any) => ({
      id: stream.id,
      streamerId: stream.streamer_id,
      streamerName: stream.users.username,
      title: stream.title,
      category: stream.category,
      thumbnailUrl: stream.thumbnail_url || "",
      viewerCount: this.getViewerCount(stream.id),
      tokenSymbol: stream.token_symbol,
      tokenMarketCap: stream.token_market_cap ? parseFloat(stream.token_market_cap) : undefined,
      startedAt: stream.started_at,
      status: stream.status,
    }));
  }

  /**
   * Search streams by query
   */
  async searchStreams(query: string): Promise<Stream[]> {
    const { data, error } = await supabase
      .from("streams")
      .select("*, users!inner(username)")
      .eq("status", "live")
      .or(`title.ilike.%${query}%,category.ilike.%${query}%`)
      .order("started_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to search streams: ${error.message}`);
    }

    return (data || []).map((stream: any) => ({
      id: stream.id,
      streamerId: stream.streamer_id,
      streamerName: stream.users.username,
      title: stream.title,
      category: stream.category,
      thumbnailUrl: stream.thumbnail_url || "",
      viewerCount: this.getViewerCount(stream.id),
      tokenSymbol: stream.token_symbol,
      tokenMarketCap: stream.token_market_cap ? parseFloat(stream.token_market_cap) : undefined,
      startedAt: stream.started_at,
      status: stream.status,
    }));
  }

  /**
   * Get hot streams ordered by viewers and market cap
   */
  async getHotStreams(limit: number = 10): Promise<Stream[]> {
    const { data, error } = await supabase
      .from("streams")
      .select("*, users!inner(username)")
      .eq("status", "live")
      .order("peak_viewer_count", { ascending: false })
      .order("token_market_cap", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get hot streams: ${error.message}`);
    }

    return (data || []).map((stream: any) => ({
      id: stream.id,
      streamerId: stream.streamer_id,
      streamerName: stream.users.username,
      title: stream.title,
      category: stream.category,
      thumbnailUrl: stream.thumbnail_url || "",
      viewerCount: this.getViewerCount(stream.id),
      tokenSymbol: stream.token_symbol,
      tokenMarketCap: stream.token_market_cap ? parseFloat(stream.token_market_cap) : undefined,
      startedAt: stream.started_at,
      status: stream.status,
    }));
  }

  /**
   * Create producer transport for streamer
   */
  async createProducerTransport(streamId: string): Promise<TransportOptions> {
    const { params } = await mediaServerService.createWebRtcTransport(streamId, true);
    return {
      id: params.id,
      iceParameters: params.iceParameters,
      iceCandidates: params.iceCandidates,
      dtlsParameters: params.dtlsParameters,
    };
  }

  /**
   * Create consumer transport for viewer
   */
  async createConsumerTransport(streamId: string, viewerId: string): Promise<TransportOptions> {
    const { params } = await mediaServerService.createWebRtcTransport(streamId, false);

    // Track viewer
    this.addViewer(streamId, viewerId);

    return {
      id: params.id,
      iceParameters: params.iceParameters,
      iceCandidates: params.iceCandidates,
      dtlsParameters: params.dtlsParameters,
    };
  }

  /**
   * Connect transport with DTLS parameters
   */
  async connectTransport(
    transportId: string,
    dtlsParameters: mediasoupTypes.DtlsParameters
  ): Promise<void> {
    await mediaServerService.connectTransport(transportId, dtlsParameters);
  }

  /**
   * Produce media (audio/video)
   */
  async produceMedia(
    transportId: string,
    kind: "audio" | "video",
    rtpParameters: mediasoupTypes.RtpParameters
  ): Promise<string> {
    return await mediaServerService.produce(transportId, kind, rtpParameters);
  }

  /**
   * Consume media for viewer
   */
  async consumeMedia(
    streamId: string,
    transportId: string,
    producerId: string,
    rtpCapabilities: mediasoupTypes.RtpCapabilities
  ): Promise<ConsumerOptions> {
    const consumer = await mediaServerService.consume(
      streamId,
      transportId,
      producerId,
      rtpCapabilities
    );

    return {
      id: consumer.id,
      producerId: consumer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    };
  }

  /**
   * Get router RTP capabilities
   */
  getRouterRtpCapabilities(streamId: string): mediasoupTypes.RtpCapabilities | undefined {
    return mediaServerService.getRouterRtpCapabilities(streamId);
  }

  /**
   * Add viewer to stream
   */
  private addViewer(streamId: string, viewerId: string): void {
    if (!this.activeViewers.has(streamId)) {
      this.activeViewers.set(streamId, new Set());
    }
    this.activeViewers.get(streamId)!.add(viewerId);

    // Update viewer count in database (async)
    this.updateViewerCount(streamId).catch((error) => {
      console.error(`Failed to update viewer count for stream ${streamId}:`, error);
    });
  }

  /**
   * Remove viewer from stream
   */
  removeViewer(streamId: string, viewerId: string): void {
    const viewers = this.activeViewers.get(streamId);
    if (viewers) {
      viewers.delete(viewerId);

      // Update viewer count in database (async)
      this.updateViewerCount(streamId).catch((error) => {
        console.error(`Failed to update viewer count for stream ${streamId}:`, error);
      });
    }
  }

  /**
   * Get current viewer count
   */
  private getViewerCount(streamId: string): number {
    return this.activeViewers.get(streamId)?.size || 0;
  }

  /**
   * Update viewer count in database
   */
  private async updateViewerCount(streamId: string): Promise<void> {
    const currentCount = this.getViewerCount(streamId);

    const { data: streamData } = await supabase
      .from("streams")
      .select("peak_viewer_count, total_viewers")
      .eq("id", streamId)
      .single();

    if (streamData) {
      const updates: any = {};

      // Update peak viewer count if current is higher
      if (currentCount > streamData.peak_viewer_count) {
        updates.peak_viewer_count = currentCount;
      }

      // Increment total viewers (unique viewers over stream lifetime)
      // This is a simplified approach - in production, track unique viewers properly
      if (currentCount > streamData.total_viewers) {
        updates.total_viewers = currentCount;
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from("streams").update(updates).eq("id", streamId);
      }
    }
  }
}

export default new StreamingService();
