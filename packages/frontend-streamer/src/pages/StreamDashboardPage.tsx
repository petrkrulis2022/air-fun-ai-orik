import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStreamStore } from "../store/streamStore";
import { useAuthStore } from "../store/authStore";
import { useWebSocket } from "../hooks/useWebSocket";
import { streamService } from "../services/streamService";
import { tokenService } from "../services/tokenService";
import BondingCurveChart from "../components/BondingCurveChart";
import PurchaseFeed from "../components/PurchaseFeed";
import {
  BlockchainDeploymentModal,
  DeploymentInfo,
  DeploymentStep,
} from "../components/BlockchainDeploymentModal";

export default function StreamDashboardPage() {
  const { id: streamId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentStream,
    bondingCurveState,
    viewerCount,
    setCurrentStream,
    setBondingCurveState,
    setViewerCount,
    updateBondingCurve,
  } = useStreamStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isEnding, setIsEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showDeploymentModal, setShowDeploymentModal] = useState(true);
  const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { isConnected, subscribe, unsubscribe } = useWebSocket(streamId || null);

  // Initialize camera for local preview
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
        setCameraError("Could not access camera");
      }
    };

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!streamId) return;

    const loadStreamData = async () => {
      try {
        setIsLoading(true);
        const stream = await streamService.getStreamStatus(streamId);
        setCurrentStream(stream);

        if (stream.tokenId) {
          const tokenData = await tokenService.getTokenByStream(streamId);
          setBondingCurveState(tokenData.bondingCurveState);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load stream data");
      } finally {
        setIsLoading(false);
      }
    };

    loadStreamData();
  }, [streamId, setCurrentStream, setBondingCurveState]);

  // Poll for token symbol if it's still being created
  useEffect(() => {
    if (!streamId || currentStream?.tokenSymbol) return;

    const pollInterval = setInterval(async () => {
      try {
        const stream = await streamService.getStreamStatus(streamId);
        if (stream.tokenSymbol) {
          setCurrentStream(stream);
          if (stream.tokenId) {
            const tokenData = await tokenService.getTokenByStream(streamId);
            setBondingCurveState(tokenData.bondingCurveState);
          }
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error("Error polling stream status:", err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [streamId, currentStream?.tokenSymbol, setCurrentStream, setBondingCurveState]);

  useEffect(() => {
    if (!isConnected) return;

    const handleViewerUpdate = (data: { count: number }) => {
      setViewerCount(data.count);
    };

    const handlePriceUpdate = (data: any) => {
      updateBondingCurve({
        currentPrice: data.currentPrice,
        nextPrice: data.nextPrice,
        marketCap: data.marketCap,
        tokensSold: data.tokensSold,
        progressToGraduation: data.progressToGraduation,
      });
    };

    const handleDeploymentStatus = (data: any) => {
      console.log("Deployment status update:", data);

      setDeploymentInfo((prev) => {
        // Initialize deployment info if not set
        if (!prev) {
          const chain = data.chain || "base";
          const newInfo: DeploymentInfo = {
            streamId: streamId || "",
            tokenName: currentStream?.title ? `${currentStream.title} Coin` : "Token",
            tokenSymbol: "",
            chain: chain,
            chainId: data.chainId || 84532,
            steps: [],
          };
          return updateDeploymentSteps(newInfo, data);
        }
        return updateDeploymentSteps(prev, data);
      });

      // Show modal if not already showing
      setShowDeploymentModal(true);
    };

    subscribe("viewer-count", handleViewerUpdate);
    subscribe("price-update", handlePriceUpdate);
    subscribe("deployment_status", handleDeploymentStatus);

    return () => {
      unsubscribe("viewer-count", handleViewerUpdate);
      unsubscribe("price-update", handlePriceUpdate);
      unsubscribe("deployment_status", handleDeploymentStatus);
    };
  }, [
    isConnected,
    subscribe,
    unsubscribe,
    setViewerCount,
    updateBondingCurve,
    streamId,
    currentStream?.title,
  ]);

  // Helper function to update deployment steps
  const updateDeploymentSteps = (info: DeploymentInfo, data: any): DeploymentInfo => {
    const stepMap: Record<string, string> = {
      generating_symbol: "Generating Token Symbol",
      connecting_factory: "Connecting to Factory Contract",
      deploying_contract: "Deploying Smart Contract",
      sending_transaction: "Sending Transaction",
      confirming_transaction: "Confirming Transaction",
      parsing_events: "Processing Contract Events",
      memecoin_deployed: "Memecoin Contract Deployed",
      bonding_curve_deployed: "Bonding Curve Deployed",
      tokens_allocated: "Creator Tokens Allocated",
      saving_database: "Saving to Database",
      deployment_complete: "Deployment Complete",
    };

    const existingStepIndex = info.steps.findIndex((s) => s.id === data.step);
    const newStep: DeploymentStep = {
      id: data.step,
      label: stepMap[data.step] || data.step,
      status: data.status,
      details: data.details,
      txHash: data.txHash,
      address: data.address,
      blockNumber: data.blockNumber,
      timestamp: data.timestamp,
    };

    let newSteps: DeploymentStep[];
    if (existingStepIndex >= 0) {
      newSteps = [...info.steps];
      newSteps[existingStepIndex] = newStep;
    } else {
      newSteps = [...info.steps, newStep];
    }

    // Extract token symbol from details if present
    let tokenSymbol = info.tokenSymbol;
    if (data.step === "generating_symbol" && data.status === "completed" && data.details) {
      const match = data.details.match(/\$(\w+)/);
      if (match) {
        tokenSymbol = match[1];
      }
    }

    // Extract contract addresses
    let memecoinAddress = info.memecoinAddress;
    let bondingCurveAddress = info.bondingCurveAddress;
    let creatorAddress = info.creatorAddress;

    if (data.step === "memecoin_deployed" && data.address) {
      memecoinAddress = data.address;
    }
    if (data.step === "bonding_curve_deployed" && data.address) {
      bondingCurveAddress = data.address;
    }
    if (data.step === "tokens_allocated" && data.address) {
      creatorAddress = data.address;
    }

    return {
      ...info,
      tokenSymbol,
      memecoinAddress,
      bondingCurveAddress,
      creatorAddress,
      creatorTokens: data.step === "tokens_allocated" ? "200,000,000" : info.creatorTokens,
      steps: newSteps,
    };
  };

  const handleEndStream = async () => {
    if (!streamId || !window.confirm("Are you sure you want to end this stream?")) {
      return;
    }

    setIsEnding(true);
    try {
      const response = await streamService.endStream(streamId);
      navigate("/dashboard", {
        state: { summary: response.summary },
      });
    } catch (err: any) {
      setError(err.message || "Failed to end stream");
      setIsEnding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Loading stream...</p>
        </div>
      </div>
    );
  }

  if (error || !currentStream) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Stream not found"}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{currentStream.title}</h1>
            <div className="flex items-center gap-4 text-gray-400">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                LIVE
              </span>
              <span>{currentStream.category}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/stream/${streamId}/agents`)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
            >
              Manage Agents
            </button>
            <button
              onClick={handleEndStream}
              disabled={isEnding}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg font-semibold transition-colors"
            >
              {isEnding ? "Ending..." : "End Stream"}
            </button>
          </div>
        </div>

        {/* Live Camera Preview */}
        <div className="mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Your Live Preview</h3>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {cameraError ? (
                <div className="absolute inset-0 flex items-center justify-center text-red-400">
                  {cameraError}
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full text-sm">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                LIVE
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Viewers</h3>
            <p className="text-3xl font-bold text-purple-400">{viewerCount}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Token Symbol</h3>
            <p className="text-3xl font-bold text-pink-400">
              {currentStream.tokenSymbol || "Creating..."}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Market Cap</h3>
            <p className="text-3xl font-bold text-green-400">
              ${bondingCurveState?.marketCap.toFixed(2) || "0.00"}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Total Earnings</h3>
            <p className="text-3xl font-bold text-yellow-400">
              ${currentStream.totalEarnings.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Graduation Progress */}
        {bondingCurveState && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Graduation Progress</h3>
              <span className="text-sm text-gray-400">
                {(bondingCurveState.progressToGraduation * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${bondingCurveState.progressToGraduation * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              ${bondingCurveState.marketCap.toFixed(2)} / $
              {bondingCurveState.graduationThreshold.toFixed(2)}
            </p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {bondingCurveState && <BondingCurveChart bondingCurveState={bondingCurveState} />}
          {streamId && <PurchaseFeed streamId={streamId} />}
        </div>

        {/* Connection Status */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            WebSocket:{" "}
            {isConnected ? (
              <span className="text-green-400">Connected</span>
            ) : (
              <span className="text-red-400">Disconnected</span>
            )}
          </p>
        </div>
      </div>

      {/* Blockchain Deployment Modal */}
      <BlockchainDeploymentModal
        isOpen={showDeploymentModal}
        onClose={() => setShowDeploymentModal(false)}
        deploymentInfo={deploymentInfo}
      />

      {/* Button to reopen deployment modal */}
      {deploymentInfo && !showDeploymentModal && (
        <button
          onClick={() => setShowDeploymentModal(true)}
          className="fixed bottom-4 right-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg flex items-center gap-2 z-40"
        >
          <span>⛓️</span> View Blockchain Details
        </button>
      )}
    </div>
  );
}
