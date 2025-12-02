// Type definitions for viewer frontend

export interface Stream {
  id: string;
  streamerId: string;
  streamerName: string;
  title: string;
  category: string;
  thumbnailUrl: string;
  viewerCount: number;
  tokenSymbol?: string;
  tokenMarketCap?: number;
  startedAt: number;
  status: "live" | "ended";
}

export interface StreamFilters {
  category?: string;
  minViewers?: number;
  hasToken?: boolean;
}

export interface Token {
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
  contractAddress: string;
  chain: "hedera" | "base";
  createdAt: string;
}

export interface PriceQuote {
  tokenAmount: number;
  usdcCost: number;
  pricePerToken: number;
  priceImpact: number;
  slippage: number;
  estimatedGas: number;
}

export interface Purchase {
  id: string;
  tokenId: string;
  buyerId: string;
  amount: number;
  price: number;
  totalSpent: number;
  fees: {
    creatorFee: number;
    platformFee: number;
  };
  txHash: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  streamId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  mentions: string[];
}

export interface BondingCurveState {
  currentPrice: number;
  nextPrice: number;
  marketCap: number;
  liquidityDepth: number;
  tokensRemaining: number;
  graduationProgress: number;
}

export interface DeployedAgent {
  id: string;
  streamId: string;
  templateId: string;
  name: string;
  position: [number, number, number];
  status: "active" | "paused";
  totalClicks: number;
  totalPurchases: number;
  totalVolume: number;
  deployedAt: number;
  config: {
    defaultPurchaseAmount: number;
    quickBuyEnabled: boolean;
  };
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  type: "buy_button" | "challenge_giver" | "predictor" | "leaderboard";
  modelUrl: string;
  defaultColor: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  role: "streamer" | "viewer";
  avatarUrl?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresAt: number;
}

export interface PurchaseNotification {
  tokenId: string;
  buyerId: string;
  buyerUsername: string;
  amount: number;
  price: number;
  newMarketCap: number;
}

export interface GraduationNotification {
  tokenId: string;
  tokenSymbol: string;
  finalMarketCap: number;
  liquidityPoolAddress: string;
}
