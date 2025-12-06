import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { streamService } from "../services/streamService";

interface ActiveStream {
  id: string;
  title: string;
  category: string;
  viewerCount: number;
  tokenSymbol: string | null;
  startedAt: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeStreams, setActiveStreams] = useState<ActiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [endingStream, setEndingStream] = useState<string | null>(null);

  // Fetch user's active streams
  useEffect(() => {
    const fetchStreams = async () => {
      try {
        setLoading(true);
        const streams = await streamService.getActiveStreams();
        // Filter to only show current user's streams
        const myStreams = streams.filter((s: any) => s.streamerId === user?.id);
        setActiveStreams(myStreams);
      } catch (err) {
        console.error("Failed to fetch streams:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchStreams();
    }
  }, [user?.id]);

  const handleEndStream = async (streamId: string) => {
    if (!confirm("Are you sure you want to end this stream?")) return;

    try {
      setEndingStream(streamId);
      await streamService.endStream(streamId);
      setActiveStreams((prev) => prev.filter((s) => s.id !== streamId));
    } catch (err) {
      console.error("Failed to end stream:", err);
      alert("Failed to end stream");
    } finally {
      setEndingStream(null);
    }
  };

  const formatDuration = (startedAt: number) => {
    const seconds = Math.floor((Date.now() - startedAt) / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <button
            onClick={() => navigate("/stream/create")}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
          >
            Start New Stream
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Total Earnings</h3>
            <p className="text-3xl font-bold text-green-400">
              ${user?.totalEarnings?.toFixed(2) || "0.00"}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Tokens Created</h3>
            <p className="text-3xl font-bold text-purple-400">{user?.totalTokensCreated || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Profile</h3>
            <p className="text-lg text-gray-300">{user?.username}</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/stream/create")}
              className="p-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-left transition-colors"
            >
              <h3 className="font-semibold mb-1">Start Streaming</h3>
              <p className="text-sm text-gray-300">Go live and create your memecoin</p>
            </button>
            <button
              onClick={() => navigate("/analytics")}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors"
            >
              <h3 className="font-semibold mb-1">View Analytics</h3>
              <p className="text-sm text-gray-300">Check your performance metrics</p>
            </button>
          </div>
        </div>

        {/* Active Streams Section */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">My Active Streams</h2>
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : activeStreams.length === 0 ? (
            <p className="text-gray-400">No active streams. Start streaming to see them here!</p>
          ) : (
            <div className="space-y-4">
              {activeStreams.map((stream) => (
                <div
                  key={stream.id}
                  className="flex items-center justify-between bg-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                      <span className="text-red-400 font-semibold">LIVE</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{stream.title}</h3>
                      <p className="text-sm text-gray-400">
                        {stream.category} • {stream.viewerCount} viewers •{" "}
                        {formatDuration(stream.startedAt)}
                        {stream.tokenSymbol && ` • $${stream.tokenSymbol}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/stream/${stream.id}`)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                    >
                      View Dashboard
                    </button>
                    <button
                      onClick={() => handleEndStream(stream.id)}
                      disabled={endingStream === stream.id}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg transition-colors"
                    >
                      {endingStream === stream.id ? "Ending..." : "End Stream"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
