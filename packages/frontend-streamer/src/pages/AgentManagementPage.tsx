import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStreamStore } from "../store/streamStore";
import AgentScene3D from "../components/AgentScene3D";
import AgentDeploymentPanel from "../components/AgentDeploymentPanel";
import DeployedAgentsList from "../components/DeployedAgentsList";
import type { DeployedAgent } from "../types";

export default function AgentManagementPage() {
  const { id: streamId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deployedAgents, addDeployedAgent, removeDeployedAgent } = useStreamStore();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const handleAgentDeployed = (agent: DeployedAgent) => {
    addDeployedAgent(agent);
  };

  const handleAgentRemove = (agentId: string) => {
    removeDeployedAgent(agentId);
    if (selectedAgentId === agentId) {
      setSelectedAgentId(null);
    }
  };

  const handleAgentSelect = (agent: DeployedAgent) => {
    setSelectedAgentId(agent.id);
  };

  if (!streamId) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Stream ID not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">AI Agent Management</h1>
          <button
            onClick={() => navigate(`/stream/${streamId}`)}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Back to Stream
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 3D Scene */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">3D Agent Positioning</h2>
              <AgentScene3D
                agents={deployedAgents}
                onAgentSelect={handleAgentSelect}
                selectedAgentId={selectedAgentId}
              />
              <p className="text-sm text-gray-400 mt-4">
                Click and drag to rotate • Scroll to zoom • Click agents to select
              </p>
            </div>

            <DeployedAgentsList
              agents={deployedAgents}
              onAgentRemove={handleAgentRemove}
              onAgentSelect={handleAgentSelect}
              selectedAgentId={selectedAgentId}
            />
          </div>

          {/* Deployment Panel */}
          <div>
            <AgentDeploymentPanel streamId={streamId} onAgentDeployed={handleAgentDeployed} />
          </div>
        </div>
      </div>
    </div>
  );
}
