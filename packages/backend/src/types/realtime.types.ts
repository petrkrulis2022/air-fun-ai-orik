// Real-Time Communication Service Types and Interfaces

import { BondingCurveState } from "./token.types.js";
import { Purchase } from "./bonding-curve.types.js";

export interface ChatMessage {
  id: string;
  streamId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  mentions: string[];
}

export interface PurchaseNotification {
  tokenId: string;
  buyerId: string;
  buyerUsername: string;
  amount: number;
  price: number;
  newMarketCap: number;
  isLargePurchase: boolean; // >$100
}

export interface GraduationNotification {
  tokenId: string;
  tokenSymbol: string;
  finalMarketCap: number;
  liquidityPoolAddress: string;
}

export interface PriceUpdatePayload {
  tokenId: string;
  currentPrice: number;
  nextPrice: number;
  marketCap: number;
  graduationProgress: number; // 0-100
  timestamp: number;
}

export interface ConnectionInfo {
  userId: string;
  username: string;
  socketId: string;
  connectedAt: number;
}

export interface RoomInfo {
  streamId: string;
  connections: Map<string, ConnectionInfo>;
}

export interface EventLog {
  id: string;
  streamId: string;
  eventType: "chat" | "purchase" | "price_update" | "graduation";
  payload: any;
  timestamp: number;
}

// Constants
export const LARGE_PURCHASE_THRESHOLD = 100; // $100 in USDC
export const PRICE_UPDATE_LATENCY_MS = 500;
export const MESSAGE_DELIVERY_LATENCY_MS = 1000;
