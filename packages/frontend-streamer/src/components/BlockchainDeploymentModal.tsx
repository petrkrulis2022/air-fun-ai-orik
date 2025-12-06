// Blockchain Deployment Modal - Shows live token deployment status

import { useState, useEffect } from "react";

export interface DeploymentStep {
  id: string;
  label: string;
  status: "pending" | "in-progress" | "completed" | "error";
  details?: string;
  txHash?: string;
  address?: string;
  blockNumber?: number;
  timestamp?: number;
}

export interface DeploymentInfo {
  streamId: string;
  tokenName: string;
  tokenSymbol: string;
  chain: "base" | "hedera";
  chainId: number;
  factoryAddress?: string;
  memecoinAddress?: string;
  bondingCurveAddress?: string;
  creatorAddress?: string;
  creatorTokens?: string;
  steps: DeploymentStep[];
}

interface BlockchainDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  deploymentInfo: DeploymentInfo | null;
}

const getExplorerUrl = (chain: "base" | "hedera", type: "tx" | "address", value: string) => {
  if (chain === "base") {
    return `https://sepolia.basescan.org/${type === "tx" ? "tx" : "address"}/${value}`;
  } else {
    return `https://hashscan.io/testnet/${type === "tx" ? "transaction" : "account"}/${value}`;
  }
};

const getChainName = (chain: "base" | "hedera") => {
  return chain === "base" ? "Base Sepolia" : "Hedera Testnet";
};

const getChainIcon = (chain: "base" | "hedera") => {
  return chain === "base" ? "🔵" : "⬡";
};

export function BlockchainDeploymentModal({
  isOpen,
  onClose,
  deploymentInfo,
}: BlockchainDeploymentModalProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, startTime]);

  if (!isOpen) return null;

  // Show loading state if no deployment info yet
  if (!deploymentInfo) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-700">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              ⛓️ Deploying Your Token
            </h2>
            <p className="text-purple-100 mt-1">Connecting to blockchain...</p>
          </div>
          <div className="p-8 flex flex-col items-center">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 border-4 border-purple-600/30 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-300 text-center">
              Setting up your memecoin on the blockchain...
            </p>
            <p className="text-gray-500 text-sm mt-2">This usually takes 30-60 seconds</p>
            <button
              onClick={onClose}
              className="mt-6 px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              Continue in background
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isDeploying = deploymentInfo.steps.some(
    (step) => step.status === "pending" || step.status === "in-progress"
  );
  const hasError = deploymentInfo.steps.some((step) => step.status === "error");
  const isComplete = deploymentInfo.steps.every((step) => step.status === "completed");

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {getChainIcon(deploymentInfo.chain)} Deploying Your Token
              </h2>
              <p className="text-purple-100 mt-1">
                {getChainName(deploymentInfo.chain)} • Chain ID: {deploymentInfo.chainId}
              </p>
            </div>
            {!isDeploying && (
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Token Info */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Token Name</p>
                <p className="text-white font-semibold">{deploymentInfo.tokenName}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Symbol</p>
                <p className="font-semibold text-pink-400">${deploymentInfo.tokenSymbol}</p>
              </div>
            </div>
          </div>

          {/* Deployment Steps */}
          <div className="space-y-4">
            {deploymentInfo.steps.map((step, index) => (
              <div
                key={step.id}
                className={`border rounded-lg p-4 transition-all ${
                  step.status === "completed"
                    ? "border-green-500/50 bg-green-500/10"
                    : step.status === "in-progress"
                      ? "border-purple-500/50 bg-purple-500/10"
                      : step.status === "error"
                        ? "border-red-500/50 bg-red-500/10"
                        : "border-gray-700 bg-gray-800/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {step.status === "completed" && (
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                    {step.status === "in-progress" && (
                      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center animate-pulse">
                        <svg
                          className="w-5 h-5 text-white animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      </div>
                    )}
                    {step.status === "error" && (
                      <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </div>
                    )}
                    {step.status === "pending" && (
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                        <span className="text-gray-400 text-sm font-bold">{index + 1}</span>
                      </div>
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold ${
                        step.status === "completed"
                          ? "text-green-400"
                          : step.status === "in-progress"
                            ? "text-purple-400"
                            : step.status === "error"
                              ? "text-red-400"
                              : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.details && <p className="text-gray-400 text-sm mt-1">{step.details}</p>}
                  </div>
                </div>

                {/* Transaction/Address Details */}
                {(step.txHash || step.address) && (
                  <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                    {step.txHash && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">TX:</span>
                        <a
                          href={getExplorerUrl(deploymentInfo.chain, "tx", step.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 font-mono truncate"
                        >
                          {step.txHash.slice(0, 10)}...{step.txHash.slice(-8)}
                        </a>
                        <button
                          onClick={() => navigator.clipboard.writeText(step.txHash!)}
                          className="text-gray-500 hover:text-gray-300"
                          title="Copy"
                        >
                          📋
                        </button>
                      </div>
                    )}
                    {step.address && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Address:</span>
                        <a
                          href={getExplorerUrl(deploymentInfo.chain, "address", step.address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-400 hover:text-green-300 font-mono truncate"
                        >
                          {step.address.slice(0, 10)}...{step.address.slice(-8)}
                        </a>
                        <button
                          onClick={() => navigator.clipboard.writeText(step.address!)}
                          className="text-gray-500 hover:text-gray-300"
                          title="Copy"
                        >
                          📋
                        </button>
                      </div>
                    )}
                    {step.blockNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Block:</span>
                        <span className="text-gray-300">#{step.blockNumber}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Deployed Contracts Summary */}
          {isComplete && deploymentInfo.memecoinAddress && (
            <div className="mt-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-500/30">
              <h3 className="text-green-400 font-semibold mb-4 flex items-center gap-2">
                ✅ Deployment Complete!
              </h3>

              {/* Quick Explorer Links */}
              <div className="flex flex-wrap gap-3 mb-4">
                <a
                  href={getExplorerUrl(
                    deploymentInfo.chain,
                    "address",
                    deploymentInfo.memecoinAddress
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  <span>🪙</span>
                  View Token on {deploymentInfo.chain === "base" ? "BaseScan" : "HashScan"}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
                {deploymentInfo.bondingCurveAddress && (
                  <a
                    href={getExplorerUrl(
                      deploymentInfo.chain,
                      "address",
                      deploymentInfo.bondingCurveAddress
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <span>📈</span>
                    View Pool on {deploymentInfo.chain === "base" ? "BaseScan" : "HashScan"}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}
              </div>

              {/* Contract Details */}
              <div className="space-y-3 text-sm">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide">
                        Token Contract
                      </p>
                      <p className="text-green-400 font-mono text-sm mt-1">
                        {deploymentInfo.memecoinAddress}
                      </p>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(deploymentInfo.memecoinAddress!)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      title="Copy address"
                    >
                      📋
                    </button>
                  </div>
                </div>
                {deploymentInfo.bondingCurveAddress && (
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">
                          Bonding Curve / Pool Contract
                        </p>
                        <p className="text-pink-400 font-mono text-sm mt-1">
                          {deploymentInfo.bondingCurveAddress}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(deploymentInfo.bondingCurveAddress!)
                        }
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        title="Copy address"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                )}
                {deploymentInfo.creatorTokens && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-gray-400 text-xs uppercase tracking-wide">
                      Your Token Allocation
                    </p>
                    <p className="text-yellow-400 font-semibold mt-1">
                      🎉 {deploymentInfo.creatorTokens} tokens (20% of supply)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="mt-6 bg-red-500/20 rounded-lg p-4 border border-red-500/30">
              <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                ❌ Deployment Error
              </h3>
              <p className="text-gray-300 text-sm">
                There was an error deploying your token. The system will use a mock deployment for
                now. You can try again later or contact support.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 bg-gray-800/50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {isDeploying ? (
                <span className="flex items-center gap-2">
                  <span className="animate-pulse">⏳</span>
                  Elapsed: {elapsedTime}s
                </span>
              ) : isComplete ? (
                <span className="text-green-400">Deployment successful!</span>
              ) : hasError ? (
                <span className="text-red-400">Deployment failed</span>
              ) : null}
            </div>
            {!isDeploying && (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
              >
                {isComplete ? "Continue to Stream" : "Close"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
