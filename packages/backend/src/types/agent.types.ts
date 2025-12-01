// AI Agent Types for air.fun MVP

export type AgentType = "buy_button" | "challenge_giver" | "predictor" | "leaderboard";
export type AgentStatus = "active" | "paused" | "removed";

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
  defaultPurchaseAmount: number; // Default tokens to buy on click
  quickBuyEnabled: boolean; // One-click purchase
  challenge?: ChallengeConfig;
}

export interface ChallengeConfig {
  type: "click_count" | "purchase_target" | "prediction";
  goal: number;
  reward: number; // Bonus tokens
  timeLimit?: number; // seconds
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
  totalVolume: number; // USDC transacted through this agent
  deployedAt: number;
  removedAt?: number;
}

export interface AgentStats {
  totalClicks: number;
  totalPurchases: number;
  totalVolume: number;
  conversionRate: number; // purchases / clicks
  averagePurchaseSize: number;
}

export interface AgentDeploymentRecord {
  id: string;
  agentId: string;
  streamId: string;
  deployedAt: number;
  removedAt?: number;
  status: AgentStatus;
  totalClicks: number;
  totalPurchases: number;
  totalVolume: number;
  conversionRate: number;
}
