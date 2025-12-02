import { api } from "../utils/api";
import { API_ENDPOINTS } from "../config/api";
import type { AgentTemplate, AgentConfig, DeployedAgent, AgentStats } from "../types";

export const agentService = {
  async getTemplates(): Promise<AgentTemplate[]> {
    return api.get(API_ENDPOINTS.AGENTS_TEMPLATES);
  },

  async getTemplate(templateId: string): Promise<AgentTemplate> {
    return api.get(API_ENDPOINTS.AGENTS_TEMPLATE(templateId));
  },

  async deployAgent(streamId: string, config: AgentConfig): Promise<DeployedAgent> {
    return api.post(API_ENDPOINTS.AGENTS_DEPLOY, {
      streamId,
      ...config,
    });
  },

  async updateAgentPosition(agentId: string, position: [number, number, number]): Promise<void> {
    return api.put(API_ENDPOINTS.AGENTS_UPDATE_POSITION(agentId), {
      position,
    });
  },

  async removeAgent(agentId: string): Promise<void> {
    return api.delete(API_ENDPOINTS.AGENTS_REMOVE(agentId));
  },

  async getAgentStats(agentId: string): Promise<AgentStats> {
    return api.get(API_ENDPOINTS.AGENTS_STATS(agentId));
  },
};
