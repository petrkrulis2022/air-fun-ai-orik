import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

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
      </div>
    </div>
  );
}
