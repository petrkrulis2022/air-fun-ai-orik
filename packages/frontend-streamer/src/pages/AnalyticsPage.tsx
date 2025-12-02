import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { analyticsService, type StreamerDashboard } from "../services/analyticsService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<StreamerDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const data = await analyticsService.getStreamerDashboard(user.id);
        setDashboard(data);
      } catch (err: any) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Failed to load analytics"}</p>
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

  // Prepare chart data
  const streamEarningsData = dashboard.recentStreams.map((stream) => ({
    name: stream.title.substring(0, 20),
    earnings: stream.totalEarnings,
    viewers: stream.peakViewers,
  }));

  const tokenPerformanceData = dashboard.topTokens.map((token) => ({
    name: token.symbol,
    value: token.currentMarketCap,
  }));

  const COLORS = ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6"];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Analytics Dashboard</h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Total Earnings</h3>
            <p className="text-3xl font-bold text-green-400">
              ${dashboard.totalEarnings.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Total Streams</h3>
            <p className="text-3xl font-bold text-purple-400">{dashboard.totalStreams}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm mb-2">Tokens Created</h3>
            <p className="text-3xl font-bold text-pink-400">{dashboard.totalTokensCreated}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Stream Earnings Chart */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Stream Earnings</h2>
            {streamEarningsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={streamEarningsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Bar dataKey="earnings" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-8">No stream data yet</p>
            )}
          </div>

          {/* Token Performance Chart */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Token Market Cap Distribution</h2>
            {tokenPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tokenPerformanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tokenPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "0.5rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-8">No token data yet</p>
            )}
          </div>
        </div>

        {/* Stream History Table */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Stream History</h2>
          {dashboard.recentStreams.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Title</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Peak Viewers</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Duration</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Tokens Sold</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentStreams.map((stream) => (
                    <tr
                      key={stream.streamId}
                      className="border-b border-gray-700 hover:bg-gray-750"
                    >
                      <td className="py-3 px-4">{stream.title}</td>
                      <td className="py-3 px-4 text-gray-400">
                        {new Date(stream.startedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">{stream.peakViewers}</td>
                      <td className="py-3 px-4 text-right">{Math.floor(stream.duration / 60)}m</td>
                      <td className="py-3 px-4 text-right">
                        {stream.totalTokensSold.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-green-400">
                        ${stream.totalEarnings.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No streams yet</p>
          )}
        </div>

        {/* Token Performance Table */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Token Performance</h2>
          {dashboard.topTokens.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Symbol</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Market Cap</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Holders</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Transactions</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Volume</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.topTokens.map((token) => (
                    <tr key={token.tokenId} className="border-b border-gray-700 hover:bg-gray-750">
                      <td className="py-3 px-4 font-semibold">{token.symbol}</td>
                      <td className="py-3 px-4 text-right">${token.currentMarketCap.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">{token.holderCount}</td>
                      <td className="py-3 px-4 text-right">{token.transactionCount}</td>
                      <td className="py-3 px-4 text-right">${token.totalVolume.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        {token.isGraduated ? (
                          <span className="px-2 py-1 bg-green-900 bg-opacity-50 text-green-400 rounded text-xs">
                            Graduated
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-purple-900 bg-opacity-50 text-purple-400 rounded text-xs">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No tokens yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
