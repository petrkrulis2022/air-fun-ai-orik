import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../store/authStore";
import { useStreamStore } from "../store/streamStore";
import type { AuthSession, User, StreamRecord, DeployedAgent } from "../types";

describe("Integration: Streamer Flow", () => {
  beforeEach(() => {
    // Reset all stores
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });

    useStreamStore.setState({
      currentStream: null,
      bondingCurveState: null,
      deployedAgents: [],
      viewerCount: 0,
    });
  });

  it("should complete full streamer workflow: auth -> stream -> agents", () => {
    // Step 1: Authenticate
    const mockUser: User = {
      id: "user-1",
      role: "streamer",
      username: "teststreamer",
      createdAt: Date.now(),
      totalEarnings: 0,
      totalTokensCreated: 0,
    };

    const mockSession: AuthSession = {
      accessToken: "mock-token",
      refreshToken: "mock-refresh",
      user: mockUser,
      expiresAt: Date.now() + 3600000,
    };

    const { setAuth } = useAuthStore.getState();
    setAuth(mockSession);

    const authState = useAuthStore.getState();
    expect(authState.isAuthenticated).toBe(true);
    expect(authState.user?.role).toBe("streamer");

    // Step 2: Create stream
    const mockStream: StreamRecord = {
      id: "stream-1",
      streamerId: mockUser.id,
      title: "My First Stream",
      category: "Gaming",
      thumbnailUrl: "https://example.com/thumb.jpg",
      startedAt: Date.now(),
      status: "live",
      tokenSymbol: "$TEST",
      tokenMarketCap: 0,
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

    const streamState = useStreamStore.getState();
    expect(streamState.currentStream).toBeDefined();
    expect(streamState.currentStream?.tokenSymbol).toBe("$TEST");

    // Step 3: Deploy agents
    const mockAgent: DeployedAgent = {
      id: "agent-1",
      streamId: mockStream.id,
      templateId: "template-1",
      name: "Buy Button 1",
      position: [0, 1, 0],
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

    const finalStreamState = useStreamStore.getState();
    expect(finalStreamState.deployedAgents).toHaveLength(1);
    expect(finalStreamState.deployedAgents[0].name).toBe("Buy Button 1");

    // Step 4: Simulate earnings update
    const { updateUser } = useAuthStore.getState();
    updateUser({ totalEarnings: 50.25, totalTokensCreated: 1 });

    const finalAuthState = useAuthStore.getState();
    expect(finalAuthState.user?.totalEarnings).toBe(50.25);
    expect(finalAuthState.user?.totalTokensCreated).toBe(1);
  });

  it("should handle multiple agents deployment", () => {
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

    const { setCurrentStream, addDeployedAgent } = useStreamStore.getState();
    setCurrentStream(mockStream);

    // Deploy multiple agents
    const agents: DeployedAgent[] = [
      {
        id: "agent-1",
        streamId: mockStream.id,
        templateId: "template-1",
        name: "Buy Button 1",
        position: [0, 1, 0],
        defaultPurchaseAmount: 1000,
        quickBuyEnabled: true,
        status: "active",
        totalClicks: 0,
        totalPurchases: 0,
        totalVolume: 0,
        deployedAt: Date.now(),
      },
      {
        id: "agent-2",
        streamId: mockStream.id,
        templateId: "template-2",
        name: "Challenge Giver",
        position: [2, 1, 0],
        defaultPurchaseAmount: 500,
        quickBuyEnabled: false,
        status: "active",
        totalClicks: 0,
        totalPurchases: 0,
        totalVolume: 0,
        deployedAt: Date.now(),
      },
    ];

    agents.forEach((agent) => addDeployedAgent(agent));

    const state = useStreamStore.getState();
    expect(state.deployedAgents).toHaveLength(2);
    expect(state.deployedAgents.map((a) => a.name)).toContain("Buy Button 1");
    expect(state.deployedAgents.map((a) => a.name)).toContain("Challenge Giver");
  });

  it("should track agent performance metrics", () => {
    const mockAgent: DeployedAgent = {
      id: "agent-1",
      streamId: "stream-1",
      templateId: "template-1",
      name: "Buy Button 1",
      position: [0, 1, 0],
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

    // Simulate clicks and purchases
    updateDeployedAgent("agent-1", {
      totalClicks: 10,
      totalPurchases: 3,
      totalVolume: 150.5,
    });

    const state = useStreamStore.getState();
    const agent = state.deployedAgents[0];
    expect(agent.totalClicks).toBe(10);
    expect(agent.totalPurchases).toBe(3);
    expect(agent.totalVolume).toBe(150.5);

    // Calculate conversion rate
    const conversionRate = agent.totalPurchases / agent.totalClicks;
    expect(conversionRate).toBe(0.3); // 30% conversion
  });
});
