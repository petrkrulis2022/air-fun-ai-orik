// Authentication Types and Interfaces

export type WalletType = "metamask" | "hashio";
export type ChainType = "hedera" | "base";
export type UserRole = "streamer" | "viewer";

export interface User {
  id: string;
  role: UserRole;
  email?: string;
  username: string;
  avatarUrl?: string;
  createdAt: number;

  // Streamer-specific
  profileCategory?: string;
  totalTokensCreated?: number;
  totalEarnings?: number;

  // Viewer-specific
  totalSpent?: number;
  totalTokensBought?: number;
  agentClickCount?: number;
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

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresAt: number;
}

export interface SessionRecord {
  id: string;
  userId: string;
  refreshToken: string;
  expiresAt: number;
  createdAt: number;
  lastUsedAt: number;
}

export interface WalletBalance {
  chain: ChainType;
  address: string;
  balance: number;
  currency: string;
}
