import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStreamStore } from "../store/streamStore";
import { useAuthStore } from "../store/authStore";
import { useWebSocket } from "../hooks/useWebSocket";
import { streamService } from "../services/streamService";
import { tokenService } from "../services/tokenService";
import BondingCurveChart from "../components/BondingCurveChart";
import PurchaseFeed from "../components/PurchaseFeed";

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

  const { isConnected, subscribe, unsubscribe } = useWebSocket(streamId || null);

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

    subscribe("viewer-count", handleViewerUpdate);
    subscribe("price-update", handlePriceUpdate);

    return () => {
      unsubscribe("viewer-count", handleViewerUpdate);
      unsubscribe("price-update", handlePriceUpdate);
    };
  }, [isConnected, subscribe, unsubscribe, setViewerCount, updateBondingCurve]);

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
    </div>
  );
}
