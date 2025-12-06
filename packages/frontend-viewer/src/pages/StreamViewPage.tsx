// Stream viewing page with video player, chat, and token info

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type {
  Stream,
  Token,
  ChatMessage,
  DeployedAgent,
  BondingCurveState,
  PurchaseNotification,
  GraduationNotification,
} from "../types";
import { streamService } from "../services/streamService";
import { agentService } from "../services/agentService";
import { apiService } from "../services/api";
import { API_ENDPOINTS } from "../config/api";
import { useWebRTC } from "../hooks/useWebRTC";
import { useWebSocket } from "../hooks/useWebSocket";
import { VideoPlayer } from "../components/VideoPlayer";
import { ChatBox } from "../components/ChatBox";
import { StreamInfo } from "../components/StreamInfo";
import { AgentScene } from "../components/AgentScene";
import { PurchaseModal } from "../components/PurchaseModal";
import { NotificationToast } from "../components/NotificationToast";

export function StreamViewPage() {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();

  const [stream, setStream] = useState<Stream | null>(null);
  const [token, setToken] = useState<Token | null>(null);
  const [agents, setAgents] = useState<DeployedAgent[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<DeployedAgent | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [bondingCurveState, setBondingCurveState] = useState<BondingCurveState | null>(null);
  const [notifications, setNotifications] = useState<
    Array<PurchaseNotification | GraduationNotification>
  >([]);

  const {
    isConnected,
    error: webrtcError,
    videoTrack,
    audioTrack,
    reconnect,
  } = useWebRTC({
    streamId: streamId || "",
    enabled: !!streamId && !!stream,
  });

  // WebSocket for real-time updates
  const { isConnected: wsConnected, sendChatMessage: wsSendMessage } = useWebSocket({
    streamId: streamId || "",
    enabled: !!streamId && !!stream,
    onChatMessage: (message) => {
      setChatMessages((prev) => [...prev, message]);
    },
    onPriceUpdate: (state) => {
      setBondingCurveState(state);
      // Update token with new price
      if (token) {
        setToken({
          ...token,
          currentPrice: state.currentPrice,
          marketCap: state.marketCap,
        });
      }
    },
    onPurchaseNotification: (notification) => {
      setNotifications((prev) => [...prev, notification]);
      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n !== notification));
      }, 5000);
    },
    onGraduationAnnouncement: (notification) => {
      setNotifications((prev) => [...prev, notification]);
      // Update token graduation status
      if (token) {
        setToken({
          ...token,
          isGraduated: true,
          liquidityPoolAddress: notification.liquidityPoolAddress,
        });
      }
    },
  });

  // Fetch stream data
  useEffect(() => {
    if (!streamId) return;

    const fetchStreamData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch stream details
        const streamData = await streamService.getStreamStatus(streamId);
        setStream(streamData);

        // Fetch token if available
        if (streamData.tokenSymbol) {
          try {
            const tokenData = await apiService.get<Token>(API_ENDPOINTS.TOKEN_BY_STREAM(streamId));
            setToken(tokenData);
          } catch (err) {
            console.warn("Failed to fetch token:", err);
          }
        }

        // Fetch deployed agents
        try {
          const agentsData = await agentService.getStreamAgents(streamId);
          setAgents(agentsData.filter((a) => a.status === "active"));
        } catch (err) {
          console.warn("Failed to fetch agents:", err);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stream");
      } finally {
        setLoading(false);
      }
    };

    fetchStreamData();
  }, [streamId]);

  // Handle sending chat messages
  const handleSendMessage = (message: string) => {
    if (wsConnected) {
      wsSendMessage(message);
    } else {
      console.warn("WebSocket not connected, cannot send message");
    }
  };

  // Handle agent click
  const handleAgentClick = async (agent: DeployedAgent) => {
    console.log("Agent clicked:", agent);
    setSelectedAgent(agent);

    // Track click
    try {
      await agentService.trackAgentClick(agent.id, "viewer-1");
    } catch (err) {
      console.error("Failed to track agent click:", err);
    }

    // Open purchase modal
    setShowPurchaseModal(true);
  };

  // Handle purchase complete
  const handlePurchaseComplete = () => {
    // Refresh token data
    if (streamId && stream?.tokenSymbol) {
      apiService
        .get<Token>(API_ENDPOINTS.TOKEN_BY_STREAM(streamId))
        .then(setToken)
        .catch(console.error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-white">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-red-400 mb-4">{error || "Stream not found"}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Back to Streams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate("/")}
            className="text-purple-400 hover:text-purple-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Streams
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - Video and Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player with 3D Agents */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <VideoPlayer
                videoTrack={videoTrack}
                audioTrack={audioTrack}
                isConnected={isConnected}
                error={webrtcError}
                onReconnect={reconnect}
              />

              {/* 3D AR Agents overlay */}
              {agents.length > 0 && <AgentScene agents={agents} onAgentClick={handleAgentClick} />}
            </div>

            {/* Stream Info */}
            <StreamInfo stream={stream} token={token} />
          </div>

          {/* Sidebar - Chat */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 h-[calc(100vh-8rem)]">
              <ChatBox messages={chatMessages} onSendMessage={handleSendMessage} disabled={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {token && (
        <PurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          token={token}
          agent={selectedAgent}
          onPurchaseComplete={handlePurchaseComplete}
        />
      )}

      {/* Notification Toasts */}
      <NotificationToast notifications={notifications} />
    </div>
  );
}
