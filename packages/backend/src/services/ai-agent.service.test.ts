import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { supabase } from "../config/supabase.js";
import aiAgentService from "./ai-agent.service.js";

/**
 * Unit tests for AI Agent Service
 * Tests agent template retrieval, deployment, positioning, click tracking, purchase attribution, and statistics
 */
describe("AI Agent Service", () => {
  let testStreamId: string;
  let testUserId: string;
  let testStreamerId: string;
  let testTemplateId: string;

  beforeAll(async () => {
    // Create test user (viewer)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        role: "viewer",
        username: "test_viewer_agent_unit",
        email: "test_agent_unit@example.com",
      })
      .select()
      .single();

    if (userError || !userData) {
      throw new Error("Failed to create test user");
    }
    testUserId = userData.id;

    // Create test streamer
    const { data: streamerData, error: streamerError } = await supabase
      .from("users")
      .insert({
        role: "streamer",
        username: "test_streamer_agent_unit",
        email: "test_streamer_agent_unit@example.com",
      })
      .select()
      .single();

    if (streamerError || !streamerData) {
      throw new Error("Failed to create test streamer");
    }
    testStreamerId = streamerData.id;

    // Create test stream
    const { data: streamData, error: streamError } = await supabase
      .from("streams")
      .insert({
        streamer_id: testStreamerId,
        title: "Test Stream for Agent Unit Tests",
        category: "Gaming",
        quality: "720p",
        status: "live",
      })
      .select()
      .single();

    if (streamError || !streamData) {
      throw new Error("Failed to create test stream");
    }
    testStreamId = streamData.id;

    // Get or create test template
    const { data: templateData, error: templateError } = await supabase
      .from("agent_templates")
      .select("id")
      .eq("type", "buy_button")
      .single();

    if (templateError || !templateData) {
      const { data: newTemplate, error: createError } = await supabase
        .from("agent_templates")
        .insert({
          name: "Test Buy Button",
          description: "Test template",
          type: "buy_button",
          model_url: "https://example.com/model.glb",
          default_color: "#00FF00",
        })
        .select()
        .single();

      if (createError || !newTemplate) {
        throw new Error("Failed to create test template");
      }
      testTemplateId = newTemplate.id;
    } else {
      testTemplateId = templateData.id;
    }
  });

  afterAll(async () => {
    // Cleanup
    if (testStreamId) {
      await supabase.from("streams").delete().eq("id", testStreamId);
    }
    if (testUserId) {
      await supabase.from("users").delete().eq("id", testUserId);
    }
    if (testStreamerId) {
      await supabase.from("users").delete().eq("id", testStreamerId);
    }
  });

  beforeEach(async () => {
    // Clean up agents from previous tests
    await supabase.from("agents").delete().eq("stream_id", testStreamId);
  });

  describe("Agent Template Retrieval", () => {
    it("should list all agent templates", async () => {
      const templates = await aiAgentService.listAgentTemplates();
      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it("should get a specific agent template by ID", async () => {
      const template = await aiAgentService.getAgentTemplate(testTemplateId);
      expect(template).toBeDefined();
      expect(template.id).toBe(testTemplateId);
      expect(template.type).toBe("buy_button");
    });

    it("should throw error for non-existent template", async () => {
      await expect(
        aiAgentService.getAgentTemplate("00000000-0000-0000-0000-000000000000")
      ).rejects.toThrow();
    });
  });

  describe("Agent Deployment", () => {
    it("should deploy an agent to a live stream", async () => {
      const agent = await aiAgentService.deployAgent(testStreamId, {
        name: "Test Agent",
        templateId: testTemplateId,
        position: [1.5, 2.0, 3.5],
        defaultPurchaseAmount: 1000,
        quickBuyEnabled: true,
      });

      expect(agent).toBeDefined();
      expect(agent.id).toBeDefined();
      expect(agent.streamId).toBe(testStreamId);
      expect(agent.templateId).toBe(testTemplateId);
      expect(agent.name).toBe("Test Agent");
      expect(agent.position).toEqual([1.5, 2.0, 3.5]);
      expect(agent.defaultPurchaseAmount).toBe(1000);
      expect(agent.quickBuyEnabled).toBe(true);
      expect(agent.status).toBe("active");
      expect(agent.totalClicks).toBe(0);
      expect(agent.totalPurchases).toBe(0);
      expect(agent.totalVolume).toBe(0);
    });

    it("should throw error when deploying to non-existent stream", async () => {
      await expect(
        aiAgentService.deployAgent("00000000-0000-0000-0000-000000000000", {
          name: "Test Agent",
          templateId: testTemplateId,
          position: [0, 0, 0],
          defaultPurchaseAmount: 1000,
          quickBuyEnabled: true,
        })
      ).rejects.toThrow();
    });

    it("should throw error when deploying with invalid template", async () => {
      await expect(
        aiAgentService.deployAgent(testStreamId, {
          name: "Test Agent",
          templateId: "00000000-0000-0000-0000-000000000000",
          position: [0, 0, 0],
          defaultPurchaseAmount: 1000,
          quickBuyEnabled: true,
        })
      ).rejects.toThrow();
    });
  });

  describe("Agent Positioning", () => {
    it("should update agent position", async () => {
      const agent = await aiAgentService.deployAgent(testStreamId, {
        name: "Test Agent",
        templateId: testTemplateId,
        position: [0, 0, 0],
        defaultPurchaseAmount: 1000,
        quickBuyEnabled: true,
      });

      await aiAgentService.updateAgentPosition(agent.id, [5, 10, 15]);

      const updatedAgent = await aiAgentService.getAgent(agent.id);
      expect(updatedAgent.position).toEqual([5, 10, 15]);
    });
  });

  describe("Agent Removal", () => {
    it("should remove an agent", async () => {
      const agent = await aiAgentService.deployAgent(testStreamId, {
        name: "Test Agent",
        templateId: testTemplateId,
        position: [0, 0, 0],
        defaultPurchaseAmount: 1000,
        quickBuyEnabled: true,
      });

      await aiAgentService.removeAgent(agent.id);

      const removedAgent = await aiAgentService.getAgent(agent.id);
      expect(removedAgent.status).toBe("removed");
      expect(removedAgent.removedAt).toBeDefined();
    });
  });

  describe("Click Tracking", () => {
    it("should track agent clicks", async () => {
      const agent = await aiAgentService.deployAgent(testStreamId, {
        name: "Test Agent",
        templateId: testTemplateId,
        position: [0, 0, 0],
        defaultPurchaseAmount: 1000,
        quickBuyEnabled: true,
      });

      await aiAgentService.trackAgentClick(agent.id, testUserId);
      await aiAgentService.trackAgentClick(agent.id, testUserId);
      await aiAgentService.trackAgentClick(agent.id, testUserId);

      const stats = await aiAgentService.getAgentStats(agent.id);
      expect(stats.totalClicks).toBe(3);
    });

    it("should throw error when tracking click on non-existent agent", async () => {
      await expect(
        aiAgentService.trackAgentClick("00000000-0000-0000-0000-000000000000", testUserId)
      ).rejects.toThrow();
    });
  });

  describe("Purchase Attribution", () => {
    it("should record purchase attribution", async () => {
      const agent = await aiAgentService.deployAgent(testStreamId, {
        name: "Test Agent",
        templateId: testTemplateId,
        position: [0, 0, 0],
        defaultPurchaseAmount: 1000,
        quickBuyEnabled: true,
      });

      await aiAgentService.recordPurchase(agent.id, testUserId, 1000, 50);
      await aiAgentService.recordPurchase(agent.id, testUserId, 2000, 100);

      const stats = await aiAgentService.getAgentStats(agent.id);
      expect(stats.totalPurchases).toBe(2);
      expect(stats.totalVolume).toBe(150);
    });

    it("should throw error when recording purchase for non-existent agent", async () => {
      await expect(
        aiAgentService.recordPurchase("00000000-0000-0000-0000-000000000000", testUserId, 1000, 50)
      ).rejects.toThrow();
    });
  });

  describe("Agent Statistics", () => {
    it("should calculate conversion rate correctly", async () => {
      const agent = await aiAgentService.deployAgent(testStreamId, {
        name: "Test Agent",
        templateId: testTemplateId,
        position: [0, 0, 0],
        defaultPurchaseAmount: 1000,
        quickBuyEnabled: true,
      });

      // Track 10 clicks
      for (let i = 0; i < 10; i++) {
        await aiAgentService.trackAgentClick(agent.id, testUserId);
      }

      // Record 3 purchases
      for (let i = 0; i < 3; i++) {
        await aiAgentService.recordPurchase(agent.id, testUserId, 1000, 50);
      }

      const stats = await aiAgentService.getAgentStats(agent.id);
      expect(stats.totalClicks).toBe(10);
      expect(stats.totalPurchases).toBe(3);
      expect(stats.conversionRate).toBeCloseTo(0.3, 2);
    });

    it("should calculate average purchase size correctly", async () => {
      const agent = await aiAgentService.deployAgent(testStreamId, {
        name: "Test Agent",
        templateId: testTemplateId,
        position: [0, 0, 0],
        defaultPurchaseAmount: 1000,
        quickBuyEnabled: true,
      });

      await aiAgentService.recordPurchase(agent.id, testUserId, 1000, 50);
      await aiAgentService.recordPurchase(agent.id, testUserId, 2000, 100);
      await aiAgentService.recordPurchase(agent.id, testUserId, 3000, 150);

      const stats = await aiAgentService.getAgentStats(agent.id);
      expect(stats.totalPurchases).toBe(3);
      expect(stats.totalVolume).toBe(300);
      expect(stats.averagePurchaseSize).toBeCloseTo(100, 2);
    });

    it("should handle zero clicks gracefully", async () => {
      const agent = await aiAgentService.deployAgent(testStreamId, {
        name: "Test Agent",
        templateId: testTemplateId,
        position: [0, 0, 0],
        defaultPurchaseAmount: 1000,
        quickBuyEnabled: true,
      });

      const stats = await aiAgentService.getAgentStats(agent.id);
      expect(stats.totalClicks).toBe(0);
      expect(stats.totalPurchases).toBe(0);
      expect(stats.conversionRate).toBe(0);
      expect(stats.averagePurchaseSize).toBe(0);
    });
  });

  describe("Stream Agents", () => {
    it("should get all agents for a stream", async () => {
      const agent1 = await aiAgentService.deployAgent(testStreamId, {
        name: "Agent 1",
        templateId: testTemplateId,
        position: [0, 0, 0],
        defaultPurchaseAmount: 1000,
        quickBuyEnabled: true,
      });

      const agent2 = await aiAgentService.deployAgent(testStreamId, {
        name: "Agent 2",
        templateId: testTemplateId,
        position: [1, 1, 1],
        defaultPurchaseAmount: 2000,
        quickBuyEnabled: false,
      });

      const agents = await aiAgentService.getStreamAgents(testStreamId);
      expect(agents.length).toBe(2);
      expect(agents.find((a) => a.id === agent1.id)).toBeDefined();
      expect(agents.find((a) => a.id === agent2.id)).toBeDefined();
    });

    it("should not include removed agents", async () => {
      const agent = await aiAgentService.deployAgent(testStreamId, {
        name: "Test Agent",
        templateId: testTemplateId,
        position: [0, 0, 0],
        defaultPurchaseAmount: 1000,
        quickBuyEnabled: true,
      });

      await aiAgentService.removeAgent(agent.id);

      const agents = await aiAgentService.getStreamAgents(testStreamId);
      expect(agents.find((a) => a.id === agent.id)).toBeUndefined();
    });
  });
});
