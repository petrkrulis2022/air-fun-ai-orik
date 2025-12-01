import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import * as fc from "fast-check";
import { supabase } from "../config/supabase.js";
import aiAgentService from "./ai-agent.service.js";

/**
 * Feature: air-fun-mvp, Property 8: Agent Click Attribution
 * Validates: Requirements 6.5
 *
 * For any purchase made through an agent, the purchase must be correctly attributed to that agent's statistics.
 */
describe("Property 8: Agent Click Attribution", () => {
  let testStreamId: string;
  let testUserId: string;
  let testTemplateId: string;

  beforeAll(async () => {
    // Create test user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        role: "viewer",
        username: "test_viewer_agent_prop",
        email: "test_agent_prop@example.com",
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
        username: "test_streamer_agent_prop",
        email: "test_streamer_agent_prop@example.com",
      })
      .select()
      .single();

    if (streamerError || !streamerData) {
      throw new Error("Failed to create test streamer");
    }

    // Create test stream
    const { data: streamData, error: streamError } = await supabase
      .from("streams")
      .insert({
        streamer_id: streamerData.id,
        title: "Test Stream for Agent Property",
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
      // Create template if it doesn't exist
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
    // Cleanup: Delete test data
    if (testStreamId) {
      await supabase.from("streams").delete().eq("id", testStreamId);
    }
    if (testUserId) {
      await supabase.from("users").delete().eq("id", testUserId);
    }
    await supabase.from("users").delete().eq("username", "test_streamer_agent_prop");
  });

  beforeEach(async () => {
    // Clean up agents from previous tests
    await supabase.from("agents").delete().eq("stream_id", testStreamId);
  });

  it("should correctly attribute purchases to agents across random purchase sequences", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            tokenAmount: fc.double({ min: 1, max: 10000 }),
            usdcAmount: fc.double({ min: 1, max: 1000 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (purchases) => {
          // Deploy an agent
          const agent = await aiAgentService.deployAgent(testStreamId, {
            name: "Test Agent",
            templateId: testTemplateId,
            position: [0, 0, 0],
            defaultPurchaseAmount: 1000,
            quickBuyEnabled: true,
          });

          // Record purchases
          for (const purchase of purchases) {
            await aiAgentService.recordPurchase(
              agent.id,
              testUserId,
              purchase.tokenAmount,
              purchase.usdcAmount
            );
          }

          // Get agent stats
          const stats = await aiAgentService.getAgentStats(agent.id);

          // Verify purchase count matches
          expect(stats.totalPurchases).toBe(purchases.length);

          // Verify total volume matches sum of all purchases
          const expectedVolume = purchases.reduce((sum, p) => sum + p.usdcAmount, 0);
          expect(Math.abs(stats.totalVolume - expectedVolume)).toBeLessThan(0.01);

          // Verify average purchase size
          const expectedAverage = expectedVolume / purchases.length;
          expect(Math.abs(stats.averagePurchaseSize - expectedAverage)).toBeLessThan(0.01);

          // Cleanup
          await aiAgentService.removeAgent(agent.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should correctly track clicks and calculate conversion rate", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          clicks: fc.integer({ min: 1, max: 20 }),
          purchases: fc.integer({ min: 0, max: 10 }),
        }),
        async ({ clicks, purchases }) => {
          // Ensure purchases don't exceed clicks
          const actualPurchases = Math.min(purchases, clicks);

          // Deploy an agent
          const agent = await aiAgentService.deployAgent(testStreamId, {
            name: "Test Agent",
            templateId: testTemplateId,
            position: [0, 0, 0],
            defaultPurchaseAmount: 1000,
            quickBuyEnabled: true,
          });

          // Track clicks
          for (let i = 0; i < clicks; i++) {
            await aiAgentService.trackAgentClick(agent.id, testUserId);
          }

          // Record purchases
          for (let i = 0; i < actualPurchases; i++) {
            await aiAgentService.recordPurchase(agent.id, testUserId, 100, 10);
          }

          // Get agent stats
          const stats = await aiAgentService.getAgentStats(agent.id);

          // Verify click count
          expect(stats.totalClicks).toBe(clicks);

          // Verify purchase count
          expect(stats.totalPurchases).toBe(actualPurchases);

          // Verify conversion rate
          const expectedConversionRate = actualPurchases / clicks;
          expect(Math.abs(stats.conversionRate - expectedConversionRate)).toBeLessThan(0.01);

          // Cleanup
          await aiAgentService.removeAgent(agent.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should maintain accurate statistics across multiple agents", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            purchases: fc.integer({ min: 1, max: 5 }),
            usdcPerPurchase: fc.double({ min: 1, max: 100 }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (agentConfigs) => {
          // Deploy multiple agents
          const agents = await Promise.all(
            agentConfigs.map((_, index) =>
              aiAgentService.deployAgent(testStreamId, {
                name: `Test Agent ${index}`,
                templateId: testTemplateId,
                position: [index, 0, 0],
                defaultPurchaseAmount: 1000,
                quickBuyEnabled: true,
              })
            )
          );

          // Record purchases for each agent
          for (let i = 0; i < agents.length; i++) {
            const config = agentConfigs[i];
            for (let j = 0; j < config.purchases; j++) {
              await aiAgentService.recordPurchase(
                agents[i].id,
                testUserId,
                100,
                config.usdcPerPurchase
              );
            }
          }

          // Verify each agent has correct stats
          for (let i = 0; i < agents.length; i++) {
            const stats = await aiAgentService.getAgentStats(agents[i].id);
            const config = agentConfigs[i];

            expect(stats.totalPurchases).toBe(config.purchases);

            const expectedVolume = config.purchases * config.usdcPerPurchase;
            expect(Math.abs(stats.totalVolume - expectedVolume)).toBeLessThan(0.01);
          }

          // Cleanup
          await Promise.all(agents.map((agent) => aiAgentService.removeAgent(agent.id)));
        }
      ),
      { numRuns: 100 }
    );
  });
});
