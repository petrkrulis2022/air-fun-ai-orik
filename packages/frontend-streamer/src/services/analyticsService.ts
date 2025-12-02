import { api } from "../utils/api";
import { API_ENDPOINTS } from "../config/api";

export interface StreamAnalytics {
  streamId: string;
  title: string;
  startedAt: number;
  endedAt?: number;
  peakViewers: number;
  totalViewers: number;
  duration: number;
  totalTokensSold: number;
  totalEarnings: number;
  agentClickCount: number;
}

export interface TokenPerformance {
  tokenId: string;
  symbol: string;
  currentMarketCap: number;
  holderCount: number;
  transactionCount: number;
  isGraduated: boolean;
  totalVolume: number;
}

export interface StreamerDashboard {
  totalEarnings: number;
  totalStreams: number;
  totalTokensCreated: number;
  recentStreams: StreamAnalytics[];
  topTokens: TokenPerformance[];
}

export const analyticsService = {
  async getStreamerDashboard(streamerId: string): Promise<StreamerDashboard> {
    return api.get(API_ENDPOINTS.ANALYTICS_STREAMER(streamerId));
  },

  async getStreamAnalytics(streamId: string): Promise<StreamAnalytics> {
    return api.get(API_ENDPOINTS.ANALYTICS_STREAM(streamId));
  },

  async getTokenPerformance(tokenId: string): Promise<TokenPerformance> {
    return api.get(API_ENDPOINTS.ANALYTICS_TOKEN(tokenId));
  },
};
