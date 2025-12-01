// AI Agent Service
import { supabase } from "../config/supabase.js";
import { getRedisClient } from "../config/redis.js";
import {
  AgentTemplate,
  AgentConfig,
  DeployedAgent,
  AgentStats,
  AgentStatus,
  ChallengeConfig,
} from "../types/agent.types.js";

/**
 * AI Agent Service
 * Handles agent templates, deployment, click tracking, and purchase attribution
 */
export class AIAgentService {
  /**
   * List all available agent templates
   */
  async listAgentTemplates(): Promise<AgentTemplate[]> {
    const { data, error } = await supabase
      .from("agent_templates")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch agent templates: ${error.message}`);
    }

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      modelUrl: row.model_url,
      defaultColor: row.default_color,
    }));
  }

  /**
   * Get a specific agent template by ID
   */
  async getAgentTemplate(templateId: string): Promise<AgentTemplate> {
    const { data, error } = await supabase
      .from("agent_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (error || !data) {
      throw new Error(`Agent template not found: ${templateId}`);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      modelUrl: data.model_url,
      defaultColor: data.default_color,
    };
  }

  /**
   * Deploy an agent to a stream
   * Creates agent record and deployment record
   */
  async deployAgent(streamId: string, config: AgentConfig): Promise<DeployedAgent> {
    // Validate template exists
    await this.getAgentTemplate(config.templateId);

    // Validate stream exists and is live
    const { data: streamData, error: streamError } = await supabase
      .from("streams")
      .select("status")
      .eq("id", streamId)
      .single();

    if (streamError || !streamData) {
      throw new Error(`Stream not found: ${streamId}`);
    }

    if (streamData.status !== "live") {
      throw new Error(`Cannot deploy agent to non-live stream: ${streamId}`);
    }

    // Create agent record
    const { data: agentData, error: agentError } = await supabase
      .from("agents")
      .insert({
        stream_id: streamId,
        template_id: config.templateId,
        name: config.name,
        position_x: config.position[0],
        position_y: config.position[1],
        position_z: config.position[2],
        default_purchase_amount: config.defaultPurchaseAmount,
        quick_buy_enabled: config.quickBuyEnabled,
        challenge_config: config.challenge ? JSON.stringify(config.challenge) : null,
        status: "active",
      })
      .select()
      .single();

    if (agentError || !agentData) {
      throw new Error(`Failed to deploy agent: ${agentError?.message}`);
    }

    // Create deployment record
    const { error: deploymentError } = await supabase.from("agent_deployments").insert({
      agent_id: agentData.id,
      stream_id: streamId,
      status: "active",
    });

    if (deploymentError) {
      // Rollback agent creation
      await supabase.from("agents").delete().eq("id", agentData.id);
      throw new Error(`Failed to create deployment record: ${deploymentError.message}`);
    }

    const deployedAgent: DeployedAgent = {
      id: agentData.id,
      streamId: agentData.stream_id,
      templateId: agentData.template_id,
      name: agentData.name,
      position: [agentData.position_x, agentData.position_y, agentData.position_z],
      defaultPurchaseAmount: parseFloat(agentData.default_purchase_amount),
      quickBuyEnabled: agentData.quick_buy_enabled,
      status: agentData.status as AgentStatus,
      totalClicks: 0,
      totalPurchases: 0,
      totalVolume: 0,
      deployedAt: agentData.deployed_at,
    };

    // Cache agent in Redis for fast lookup
    const redis = getRedisClient();
    await redis.setex(
      `agent:${agentData.id}`,
      3600, // 1 hour TTL
      JSON.stringify(deployedAgent)
    );

    return deployedAgent;
  }

  /**
   * Update agent position in 3D space
   * Broadcasts update to all viewers via WebSocket (handled by caller)
   */
  async updateAgentPosition(agentId: string, position: [number, number, number]): Promise<void> {
    const { error } = await supabase
      .from("agents")
      .update({
        position_x: position[0],
        position_y: position[1],
        position_z: position[2],
      })
      .eq("id", agentId);

    if (error) {
      throw new Error(`Failed to update agent position: ${error.message}`);
    }

    // Update cache
    const redis = getRedisClient();
    const cachedAgent = await redis.get(`agent:${agentId}`);
    if (cachedAgent) {
      const agent = JSON.parse(cachedAgent);
      agent.position = position;
      await redis.setex(`agent:${agentId}`, 3600, JSON.stringify(agent));
    }
  }

  /**
   * Remove an agent from a stream
   * Sets status to removed and records removal timestamp
   */
  async removeAgent(agentId: string): Promise<void> {
    const now = Date.now();

    // Update agent status
    const { error: agentError } = await supabase
      .from("agents")
      .update({
        status: "removed",
        removed_at: now,
      })
      .eq("id", agentId);

    if (agentError) {
      throw new Error(`Failed to remove agent: ${agentError.message}`);
    }

    // Update deployment status
    const { error: deploymentError } = await supabase
      .from("agent_deployments")
      .update({
        status: "removed",
        removed_at: now,
      })
      .eq("agent_id", agentId)
      .eq("status", "active");

    if (deploymentError) {
      throw new Error(`Failed to update deployment status: ${deploymentError.message}`);
    }

    // Remove from cache
    const redis = getRedisClient();
    await redis.del(`agent:${agentId}`);
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<DeployedAgent> {
    // Try cache first
    const redis = getRedisClient();
    const cachedAgent = await redis.get(`agent:${agentId}`);
    if (cachedAgent) {
      return JSON.parse(cachedAgent);
    }

    // Fetch from database
    const { data, error } = await supabase.from("agents").select("*").eq("id", agentId).single();

    if (error || !data) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Get stats
    const stats = await this.getAgentStats(agentId);

    const agent: DeployedAgent = {
      id: data.id,
      streamId: data.stream_id,
      templateId: data.template_id,
      name: data.name,
      position: [data.position_x, data.position_y, data.position_z],
      defaultPurchaseAmount: parseFloat(data.default_purchase_amount),
      quickBuyEnabled: data.quick_buy_enabled,
      status: data.status as AgentStatus,
      totalClicks: stats.totalClicks,
      totalPurchases: stats.totalPurchases,
      totalVolume: stats.totalVolume,
      deployedAt: data.deployed_at,
      removedAt: data.removed_at,
    };

    // Cache it
    await redis.setex(`agent:${agentId}`, 3600, JSON.stringify(agent));

    return agent;
  }

  /**
   * Get all agents for a stream
   */
  async getStreamAgents(streamId: string): Promise<DeployedAgent[]> {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("stream_id", streamId)
      .in("status", ["active", "paused"]);

    if (error) {
      throw new Error(`Failed to fetch stream agents: ${error.message}`);
    }

    // Get stats for each agent
    const agents = await Promise.all(
      data.map(async (row) => {
        const stats = await this.getAgentStats(row.id);
        return {
          id: row.id,
          streamId: row.stream_id,
          templateId: row.template_id,
          name: row.name,
          position: [row.position_x, row.position_y, row.position_z] as [number, number, number],
          defaultPurchaseAmount: parseFloat(row.default_purchase_amount),
          quickBuyEnabled: row.quick_buy_enabled,
          status: row.status as AgentStatus,
          totalClicks: stats.totalClicks,
          totalPurchases: stats.totalPurchases,
          totalVolume: stats.totalVolume,
          deployedAt: row.deployed_at,
          removedAt: row.removed_at,
        };
      })
    );

    return agents;
  }

  /**
   * Track agent click
   * Records click and increments counter
   */
  async trackAgentClick(agentId: string, userId: string): Promise<void> {
    // Get agent to validate it exists and get stream_id
    const { data: agentData, error: agentError } = await supabase
      .from("agents")
      .select("stream_id, status")
      .eq("id", agentId)
      .single();

    if (agentError || !agentData) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    if (agentData.status !== "active") {
      throw new Error(`Cannot track click on non-active agent: ${agentId}`);
    }

    // Record click
    const { error: clickError } = await supabase.from("agent_clicks").insert({
      agent_id: agentId,
      user_id: userId,
      stream_id: agentData.stream_id,
    });

    if (clickError) {
      throw new Error(`Failed to track agent click: ${clickError.message}`);
    }

    // Increment user's agent click count
    const { error: userError } = await supabase.rpc("increment", {
      table_name: "users",
      row_id: userId,
      column_name: "agent_click_count",
    });

    // Increment stream's agent click count
    await supabase.rpc("increment", {
      table_name: "streams",
      row_id: agentData.stream_id,
      column_name: "agent_click_count",
    });

    // Update deployment stats
    await this.updateDeploymentStats(agentId);
  }

  /**
   * Record purchase attribution to agent
   * Links purchase to agent and updates statistics
   */
  async recordPurchase(
    agentId: string,
    userId: string,
    tokenAmount: number,
    usdcAmount: number
  ): Promise<void> {
    // Get agent to validate and get stream_id
    const { data: agentData, error: agentError } = await supabase
      .from("agents")
      .select("stream_id")
      .eq("id", agentId)
      .single();

    if (agentError || !agentData) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Record purchase attribution
    const { error: purchaseError } = await supabase.from("agent_purchases").insert({
      agent_id: agentId,
      user_id: userId,
      stream_id: agentData.stream_id,
      token_amount: tokenAmount,
      usdc_amount: usdcAmount,
    });

    if (purchaseError) {
      throw new Error(`Failed to record agent purchase: ${purchaseError.message}`);
    }

    // Update deployment stats
    await this.updateDeploymentStats(agentId);
  }

  /**
   * Get agent statistics
   * Calculates clicks, purchases, volume, conversion rate, and average purchase size
   */
  async getAgentStats(agentId: string): Promise<AgentStats> {
    // Get click count
    const { count: clickCount, error: clickError } = await supabase
      .from("agent_clicks")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", agentId);

    if (clickError) {
      throw new Error(`Failed to get click count: ${clickError.message}`);
    }

    // Get purchase stats
    const { data: purchaseData, error: purchaseError } = await supabase
      .from("agent_purchases")
      .select("token_amount, usdc_amount")
      .eq("agent_id", agentId);

    if (purchaseError) {
      throw new Error(`Failed to get purchase stats: ${purchaseError.message}`);
    }

    const totalClicks = clickCount || 0;
    const totalPurchases = purchaseData?.length || 0;
    const totalVolume = purchaseData?.reduce((sum, p) => sum + parseFloat(p.usdc_amount), 0) || 0;

    const conversionRate = totalClicks > 0 ? totalPurchases / totalClicks : 0;
    const averagePurchaseSize = totalPurchases > 0 ? totalVolume / totalPurchases : 0;

    return {
      totalClicks,
      totalPurchases,
      totalVolume,
      conversionRate,
      averagePurchaseSize,
    };
  }

  /**
   * Update deployment statistics
   * Recalculates and updates deployment record with latest stats
   */
  private async updateDeploymentStats(agentId: string): Promise<void> {
    const stats = await this.getAgentStats(agentId);

    const { error } = await supabase
      .from("agent_deployments")
      .update({
        total_clicks: stats.totalClicks,
        total_purchases: stats.totalPurchases,
        total_volume: stats.totalVolume,
        conversion_rate: stats.conversionRate,
      })
      .eq("agent_id", agentId)
      .eq("status", "active");

    if (error) {
      console.error(`Failed to update deployment stats: ${error.message}`);
    }
  }
}

// Export singleton instance
const aiAgentService = new AIAgentService();
export default aiAgentService;
