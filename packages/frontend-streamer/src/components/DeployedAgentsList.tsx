import { useState, useEffect } from "react";
import { agentService } from "../services/agentService";
import type { DeployedAgent, AgentStats } from "../types";

interface DeployedAgentsListProps {
  agents: DeployedAgent[];
  onAgentRemove: (agentId: string) => void;
  onAgentSelect: (agent: DeployedAgent) => void;
  selectedAgentId: string | null;
}

export default function DeployedAgentsList({
  agents,
  onAgentRemove,
  onAgentSelect,
  selectedAgentId,
}: DeployedAgentsListProps) {
  const [agentStats, setAgentStats] = useState<Record<string, AgentStats>>({});

  useEffect(() => {
    const loadStats = async () => {
      const stats: Record<string, AgentStats> = {};
      for (const agent of agents) {
        try {
          const agentStat = await agentService.getAgentStats(agent.id);
          stats[agent.id] = agentStat;
        } catch (err) {
          // Ignore errors for individual agents
        }
      }
      setAgentStats(stats);
    };

    if (agents.length > 0) {
      loadStats();
    }
  }, [agents]);

  const handleRemove = async (agentId: string) => {
    if (window.confirm("Are you sure you want to remove this agent?")) {
      try {
        await agentService.removeAgent(agentId);
        onAgentRemove(agentId);
      } catch (err) {
        console.error("Failed to remove agent:", err);
      }
    }
  };

  if (agents.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Deployed Agents</h3>
        <p className="text-gray-400 text-center py-8">No agents deployed yet</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Deployed Agents ({agents.length})</h3>
      <div className="space-y-3">
        {agents.map((agent) => {
          const stats = agentStats[agent.id];
          const isSelected = agent.id === selectedAgentId;

          return (
            <div
              key={agent.id}
              onClick={() => onAgentSelect(agent)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                isSelected
                  ? "border-purple-500 bg-purple-900 bg-opacity-30"
                  : "border-gray-700 bg-gray-700 hover:border-gray-600"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-white">{agent.name}</h4>
                  <p className="text-xs text-gray-400">Position: [{agent.position.join(", ")}]</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(agent.id);
                  }}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {stats && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-400">Clicks</p>
                    <p className="font-semibold">{stats.totalClicks}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Purchases</p>
                    <p className="font-semibold text-green-400">{stats.totalPurchases}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Volume</p>
                    <p className="font-semibold">${stats.totalVolume.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Conversion</p>
                    <p className="font-semibold text-purple-400">
                      {(stats.conversionRate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
