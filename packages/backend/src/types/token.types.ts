// Token Factory Types and Interfaces

import { ChainType } from "./auth.types.js";

export interface Memecoin {
  id: string;
  streamId: string;
  streamerId: string;

  // Token Details
  name: string; // e.g., "Streamer John Coin"
  symbol: string; // e.g., "JOHN420"
  totalSupply: number; // 1 billion
  bondingCurveSupply: number; // 800 million on curve

  // State
  currentPrice: number; // USDC per token
  marketCap: number;
  liquidityRaised: number; // USDC in bonding curve
  tokensSold: number;

  // Graduation
  graduationTarget: number; // $69,000
  isGraduated: boolean;
  liquidityPoolAddress?: string;

  // Blockchain
  hederaContractAddress?: string;
  baseContractAddress?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TokenMetadata {
  logoUrl?: string;
  description?: string;
  socialLinks?: {
    twitter?: string;
    telegram?: string;
  };
}

export interface BondingCurveState {
  id: string;
  tokenId: string;
  k: number; // Bonding curve constant
  tokensSold: number;
  currentPrice: number;
  marketCap: number;
  nextPrice: number; // For UI preview
  graduationThreshold: number; // $69,000
  progressToGraduation: number; // 0-1
  updatedAt: number;
}

export interface LiquidityPool {
  id: string;
  tokenId: string;
  chain: ChainType;
  poolAddress: string;
  tokenReserve: number;
  airReserve: number; // Paired with AIR platform token
  lpTokensBurned: boolean;
  createdAt: number;
}

export interface CreateMemecoinRequest {
  streamerId: string;
  streamerName: string;
  streamId: string;
  chainId?: number; // The blockchain network to deploy on (84532=Base Sepolia, 296=Hedera Testnet)
  streamerWalletAddress?: string; // The streamer's wallet address to receive 20% of tokens
}

export interface CreateMemecoinResponse {
  memecoin: Memecoin;
  bondingCurveState: BondingCurveState;
}

export interface UpdateTokenMetadataRequest {
  tokenId: string;
  metadata: TokenMetadata;
}

export interface GraduationResult {
  tokenId: string;
  liquidityPools: LiquidityPool[];
  finalMarketCap: number;
}

// Constants
export const BONDING_CURVE_K = 0.000000001;
export const GRADUATION_MARKET_CAP = 69000; // $69k in USDC
export const TOTAL_SUPPLY = 1000000000; // 1 billion tokens
export const BONDING_CURVE_SUPPLY = 800000000; // 800 million on curve
