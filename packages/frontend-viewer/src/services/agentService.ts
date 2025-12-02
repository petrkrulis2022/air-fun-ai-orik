// Agent service for fetching agent data

import { apiService } from "./api";
import { API_ENDPOINTS } from "../config/api";
import type { DeployedAgent, AgentTemplate } from "../types";

export const agentService = {
  async getStreamAgents(streamId: string): Promise<DeployedAgent[]> {
    return apiService.get<DeployedAgent[]>(API_ENDPOINTS.AGENT_STREAM(streamId));
  },

  async getAgentTemplates(): Promise<AgentTemplate[]> {
    return apiService.get<AgentTemplate[]>(API_ENDPOINTS.AGENT_TEMPLATES);
  },

  async trackAgentClick(agentId: string, userId: string): Promise<void> {
    await apiService.post(API_ENDPOINTS.AGENT_CLICK(agentId), { userId });
  },
};
