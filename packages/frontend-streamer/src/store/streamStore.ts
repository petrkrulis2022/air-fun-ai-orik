import { create } from "zustand";
import type { StreamRecord, BondingCurveState, DeployedAgent } from "../types";

interface StreamState {
  currentStream: StreamRecord | null;
  bondingCurveState: BondingCurveState | null;
  deployedAgents: DeployedAgent[];
  viewerCount: number;

  setCurrentStream: (stream: StreamRecord | null) => void;
  setBondingCurveState: (state: BondingCurveState | null) => void;
  setDeployedAgents: (agents: DeployedAgent[]) => void;
  addDeployedAgent: (agent: DeployedAgent) => void;
  updateDeployedAgent: (agentId: string, updates: Partial<DeployedAgent>) => void;
  removeDeployedAgent: (agentId: string) => void;
  setViewerCount: (count: number) => void;
  updateBondingCurve: (updates: Partial<BondingCurveState>) => void;
}

export const useStreamStore = create<StreamState>((set) => ({
  currentStream: null,
  bondingCurveState: null,
  deployedAgents: [],
  viewerCount: 0,

  setCurrentStream: (stream) => set({ currentStream: stream }),

  setBondingCurveState: (state) => set({ bondingCurveState: state }),

  setDeployedAgents: (agents) => set({ deployedAgents: agents }),

  addDeployedAgent: (agent) =>
    set((state) => ({
      deployedAgents: [...state.deployedAgents, agent],
    })),

  updateDeployedAgent: (agentId, updates) =>
    set((state) => ({
      deployedAgents: state.deployedAgents.map((agent) =>
        agent.id === agentId ? { ...agent, ...updates } : agent
      ),
    })),

  removeDeployedAgent: (agentId) =>
    set((state) => ({
      deployedAgents: state.deployedAgents.filter((agent) => agent.id !== agentId),
    })),

  setViewerCount: (count) => set({ viewerCount: count }),

  updateBondingCurve: (updates) =>
    set((state) => ({
      bondingCurveState: state.bondingCurveState
        ? { ...state.bondingCurveState, ...updates }
        : null,
    })),
}));
