// Bonding Curve Service Types and Interfaces

import { ChainType } from "./auth.types.js";

export interface PriceQuote {
  tokenAmount: number;
  usdcCost: number;
  pricePerToken: number;
  priceImpact: number; // % change
  slippage: number; // 0.5% default
  estimatedGas: number;
}

export interface PurchaseRequest {
  tokenId: string;
  buyerId: string;
  amount: number; // Tokens to buy
  maxSlippage: number; // e.g., 0.5 for 0.5%
  chain: ChainType;
}

export interface Purchase {
  id: string;
  tokenId: string;
  buyerId: string;
  amount: number; // Tokens purchased
  price: number; // USDC per token at time of purchase
  totalSpent: number; // Total USDC spent
  fees: {
    creatorFee: number; // 98%
    platformFee: number; // 2%
  };
  txHash: string;
  timestamp: number;
}

export interface FeeDistribution {
  purchaseId: string;
  creatorAmount: number; // 98% of total
  platformAmount: number; // 2% of total
  creatorTxHash: string;
  platformTxHash: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Fee distribution constants
export const CREATOR_FEE_PERCENTAGE = 0.98; // 98%
export const PLATFORM_FEE_PERCENTAGE = 0.02; // 2%
export const MINIMUM_PURCHASE_USDC = 1; // $1 minimum
export const DEFAULT_SLIPPAGE = 0.005; // 0.5%
