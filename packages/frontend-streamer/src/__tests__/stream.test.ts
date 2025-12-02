import { describe, it, expect, beforeEach } from "vitest";
import { useStreamStore } from "../store/streamStore";
import type { StreamRecord, BondingCurveState, DeployedAgent } from "../types";

describe("Stream Management Flow", () => {
  beforeEach(() => {
    // Reset store before each test
    useStreamStore.setState({
      currentStream: null,
      bondingCurveState: null,
      deployedAgents: [],
      viewerCount: 0,
    });
  });

  it("should set current stream", () => {
    const mockStream: StreamRecord = {
      id: "stream-1",
      streamerId: "user-1",
      title: "Test Stream",
      category: "Gaming",
      thumbnailUrl: "https://example.com/thumb.jpg",
      startedAt: Date.now(),
      status: "live",
      peakViewerCount: 0,
      totalViewers: 0,
      totalTokensSold: 0,
      totalVolume: 0,
      totalEarnings: 0,
      agentClickCount: 0,
      quality: "720p",
      enableChat: true,
    };

    const { setCurrentStream } = useStreamStore.getState();
    setCurrentStream(mockStream);

    const state = useStreamStore.getState();
    expect(state.currentStream).toEqual(mockStream);
  });

  it("should update bonding curve state", () => {
    const mockBondingCurve: BondingCurveState = {
      id: "bc-1",
      tokenId: "token-1",
      k: 0.000000001,
      tokensSold: 1000,
      currentPrice: 0.000001,
      marketCap: 1,
      nextPrice: 0.0000011,
      graduationThreshold: 69000,
      progressToGraduation: 0.00001,
      updatedAt: Date.now(),
    };

    const { setBondingCurveState } = useStreamStore.getState();
    setBondingCurveState(mockBondingCurve);

    const state = useStreamStore.getState();
    expect(state.bondingCurveState).toEqual(mockBondingCurve);
  });

  it("should update viewer count", () => {
    const { setViewerCount } = useStreamStore.getState();
    setViewerCount(42);

    const state = useStreamStore.getState();
    expect(state.viewerCount).toBe(42);
  });

  it("should add deployed agent", () => {
    const mockAgent: DeployedAgent = {
      id: "agent-1",
      streamId: "stream-1",
      templateId: "template-1",
      name: "Buy Button 1",
      position: [0, 0, 0],
      defaultPurchaseAmount: 1000,
      quickBuyEnabled: true,
      status: "active",
      totalClicks: 0,
      totalPurchases: 0,
      totalVolume: 0,
      deployedAt: Date.now(),
    };

    const { addDeployedAgent } = useStreamStore.getState();
    addDeployedAgent(mockAgent);

    const state = useStreamStore.getState();
    expect(state.deployedAgents).toHaveLength(1);
    expect(state.deployedAgents[0]).toEqual(mockAgent);
  });

  it("should update deployed agent", () => {
    const mockAgent: DeployedAgent = {
      id: "agent-1",
      streamId: "stream-1",
      templateId: "template-1",
      name: "Buy Button 1",
      position: [0, 0, 0],
      defaultPurchaseAmount: 1000,
      quickBuyEnabled: true,
      status: "active",
      totalClicks: 0,
      totalPurchases: 0,
      totalVolume: 0,
      deployedAt: Date.now(),
    };

    const { addDeployedAgent, updateDeployedAgent } = useStreamStore.getState();
    addDeployedAgent(mockAgent);
    updateDeployedAgent("agent-1", { totalClicks: 5, totalPurchases: 2 });

    const state = useStreamStore.getState();
    expect(state.deployedAgents[0].totalClicks).toBe(5);
    expect(state.deployedAgents[0].totalPurchases).toBe(2);
  });

  it("should remove deployed agent", () => {
    const mockAgent: DeployedAgent = {
      id: "agent-1",
      streamId: "stream-1",
      templateId: "template-1",
      name: "Buy Button 1",
      position: [0, 0, 0],
      defaultPurchaseAmount: 1000,
      quickBuyEnabled: true,
      status: "active",
      totalClicks: 0,
      totalPurchases: 0,
      totalVolume: 0,
      deployedAt: Date.now(),
    };

    const { addDeployedAgent, removeDeployedAgent } = useStreamStore.getState();
    addDeployedAgent(mockAgent);
    removeDeployedAgent("agent-1");

    const state = useStreamStore.getState();
    expect(state.deployedAgents).toHaveLength(0);
  });
});
