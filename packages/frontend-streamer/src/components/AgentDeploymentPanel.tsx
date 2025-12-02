import { useState, useEffect } from "react";
import { agentService } from "../services/agentService";
import type { AgentTemplate, DeployedAgent } from "../types";

interface AgentDeploymentPanelProps {
  streamId: string;
  onAgentDeployed: (agent: DeployedAgent) => void;
}

export default function AgentDeploymentPanel({
  streamId,
  onAgentDeployed,
}: AgentDeploymentPanelProps) {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [agentName, setAgentName] = useState("");
  const [defaultPurchaseAmount, setDefaultPurchaseAmount] = useState(1000);
  const [quickBuyEnabled, setQuickBuyEnabled] = useState(true);
  const [position, setPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await agentService.getTemplates();
        setTemplates(data);
        if (data.length > 0) {
          setSelectedTemplate(data[0]);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load templates");
      }
    };

    loadTemplates();
  }, []);

  const handleDeploy = async () => {
    if (!selectedTemplate) {
      setError("Please select a template");
      return;
    }

    if (!agentName.trim()) {
      setError("Please enter an agent name");
      return;
    }

    setIsDeploying(true);
    setError(null);

    try {
      const agent = await agentService.deployAgent(streamId, {
        name: agentName.trim(),
        templateId: selectedTemplate.id,
        position,
        defaultPurchaseAmount,
        quickBuyEnabled,
      });

      onAgentDeployed(agent);

      // Reset form
      setAgentName("");
      setDefaultPurchaseAmount(1000);
      setPosition([0, 0, 0]);
    } catch (err: any) {
      setError(err.message || "Failed to deploy agent");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Deploy AI Agent</h3>

      <div className="space-y-4">
        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Agent Template</label>
          <div className="grid grid-cols-2 gap-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  selectedTemplate?.id === template.id
                    ? "border-purple-500 bg-purple-900 bg-opacity-30"
                    : "border-gray-600 bg-gray-700 hover:border-gray-500"
                }`}
              >
                <p className="font-semibold text-sm">{template.name}</p>
                <p className="text-xs text-gray-400">{template.type}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Agent Name */}
        <div>
          <label htmlFor="agentName" className="block text-sm font-medium text-gray-300 mb-2">
            Agent Name
          </label>
          <input
            id="agentName"
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
            placeholder="e.g., Buy Button 1"
          />
        </div>

        {/* Default Purchase Amount */}
        <div>
          <label htmlFor="purchaseAmount" className="block text-sm font-medium text-gray-300 mb-2">
            Default Purchase Amount (tokens)
          </label>
          <input
            id="purchaseAmount"
            type="number"
            value={defaultPurchaseAmount}
            onChange={(e) => setDefaultPurchaseAmount(Number(e.target.value))}
            min={1}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Position (X, Y, Z)</label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              value={position[0]}
              onChange={(e) => setPosition([Number(e.target.value), position[1], position[2]])}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="X"
              step={0.5}
            />
            <input
              type="number"
              value={position[1]}
              onChange={(e) => setPosition([position[0], Number(e.target.value), position[2]])}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="Y"
              step={0.5}
            />
            <input
              type="number"
              value={position[2]}
              onChange={(e) => setPosition([position[0], position[1], Number(e.target.value)])}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="Z"
              step={0.5}
            />
          </div>
        </div>

        {/* Quick Buy Toggle */}
        <div className="flex items-center">
          <input
            id="quickBuy"
            type="checkbox"
            checked={quickBuyEnabled}
            onChange={(e) => setQuickBuyEnabled(e.target.checked)}
            className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
          />
          <label htmlFor="quickBuy" className="ml-2 text-sm text-gray-300">
            Enable one-click quick buy
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleDeploy}
          disabled={isDeploying || !selectedTemplate}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg font-semibold transition-colors"
        >
          {isDeploying ? "Deploying..." : "Deploy Agent"}
        </button>
      </div>
    </div>
  );
}
