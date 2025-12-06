// Re-export types from backend for frontend use
export type WalletType = "metamask" | "hashio";
export type ChainType = "hedera" | "base";
export type UserRole = "streamer" | "viewer";
export type StreamStatus = "live" | "ended";
export type StreamQuality = "720p" | "1080p";
export type AgentType = "buy_button" | "challenge_giver" | "predictor" | "leaderboard";
export type AgentStatus = "active" | "paused" | "removed";

export interface User {
  id: string;
  role: UserRole;
  email?: string;
  username: string;
  avatarUrl?: string;
  createdAt: number;
  profileCategory?: string;
  totalTokensCreated?: number;
  totalEarnings?: number;
  totalSpent?: number;
  totalTokensBought?: number;
  agentClickCount?: number;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresAt: number;
}

export interface WalletAddress {
  id: string;
  userId: string;
  chain: ChainType;
  address: string;
  isPrimary: boolean;
  verified: boolean;
  createdAt: number;
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
  tokenId?: string;
  tokenSymbol?: string;
  tokenMarketCap?: number;
  peakViewerCount: number;
  totalViewers: number;
  totalTokensSold: number;
  totalVolume: number;
  totalEarnings: number;
  agentClickCount: number;
  quality: StreamQuality;
  enableChat: boolean;
}

export interface StreamConfig {
  title: string;
  category: string;
  quality: StreamQuality;
  enableChat: boolean;
  chainId?: number; // The blockchain network the streamer is connected to
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

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  modelUrl: string;
  defaultColor: string;
}

export interface AgentConfig {
  name: string;
  templateId: string;
  position: [number, number, number];
  defaultPurchaseAmount: number;
  quickBuyEnabled: boolean;
}

export interface DeployedAgent {
  id: string;
  streamId: string;
  templateId: string;
  name: string;
  position: [number, number, number];
  defaultPurchaseAmount: number;
  quickBuyEnabled: boolean;
  status: AgentStatus;
  totalClicks: number;
  totalPurchases: number;
  totalVolume: number;
  deployedAt: number;
  removedAt?: number;
}

export interface AgentStats {
  totalClicks: number;
  totalPurchases: number;
  totalVolume: number;
  conversionRate: number;
  averagePurchaseSize: number;
}

export interface Memecoin {
  id: string;
  streamId: string;
  streamerId: string;
  name: string;
  symbol: string;
  totalSupply: number;
  bondingCurveSupply: number;
  currentPrice: number;
  marketCap: number;
  liquidityRaised: number;
  tokensSold: number;
  graduationTarget: number;
  isGraduated: boolean;
  liquidityPoolAddress?: string;
  hederaContractAddress?: string;
  baseContractAddress?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BondingCurveState {
  id: string;
  tokenId: string;
  k: number;
  tokensSold: number;
  currentPrice: number;
  marketCap: number;
  nextPrice: number;
  graduationThreshold: number;
  progressToGraduation: number;
  updatedAt: number;
}

export interface TransportOptions {
  id: string;
  iceParameters: any;
  iceCandidates: any[];
  dtlsParameters: any;
  sctpParameters?: any;
}
