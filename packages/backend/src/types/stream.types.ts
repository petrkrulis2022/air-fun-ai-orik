// Streaming Service Types and Interfaces

export type StreamStatus = "live" | "ended";
export type StreamQuality = "720p" | "1080p";

export interface Stream {
  id: string;
  streamerId: string;
  streamerName: string;
  title: string;
  category: string;
  thumbnailUrl: string;
  viewerCount: number;
  tokenSymbol?: string; // e.g., "$KIRO"
  tokenMarketCap?: number;
  startedAt: number;
  status: StreamStatus;
}

export interface StreamRecord {
  id: string;
  streamerId: string;
  title: string;
  category: string;
  thumbnailUrl: string;
  startedAt: number;
  endedAt?: number;
  status: StreamStatus;

  // Associated Token
  tokenId?: string;
  tokenSymbol?: string;
  tokenMarketCap?: number;

  // Metrics
  peakViewerCount: number;
  totalViewers: number;
  totalTokensSold: number;
  totalVolume: number;
  totalEarnings: number;
  agentClickCount: number;

  // Configuration
  quality: StreamQuality;
  enableChat: boolean;
}

export interface StreamSummary {
  totalViewers: number;
  peakViewers: number;
  totalEarnings: number;
  totalTokensSold: number;
  duration: number;
  topBuyers: Buyer[];
}

export interface Buyer {
  userId: string;
  username: string;
  totalPurchased: number;
  totalSpent: number;
}

export interface StreamConfig {
  title: string;
  category: string;
  quality: StreamQuality;
  enableChat: boolean;
  chainId?: number; // The blockchain network the streamer is connected to (84532=Base Sepolia, 296=Hedera Testnet)
}

export interface StreamFilters {
  category?: string;
  minViewers?: number;
  minMarketCap?: number;
  limit?: number;
  offset?: number;
}

export interface TransportOptions {
  id: string;
  iceParameters: any;
  iceCandidates: any[];
  dtlsParameters: any;
  sctpParameters?: any;
}

export interface ConsumerOptions {
  id: string;
  producerId: string;
  kind: "audio" | "video";
  rtpParameters: any;
}

export interface CreateStreamRequest {
  streamerId: string;
  config: StreamConfig;
}

export interface CreateStreamResponse {
  stream: StreamRecord;
  transportOptions: TransportOptions;
}

export interface EndStreamRequest {
  streamId: string;
}

export interface EndStreamResponse {
  summary: StreamSummary;
}
