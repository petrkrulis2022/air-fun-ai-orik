import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { WalletInfoDisplay } from "../components/WalletInfoDisplay";

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black text-white">
      {/* Header with Wallet Info */}
      {isAuthenticated && (
        <div className="absolute top-4 right-4">
          <WalletInfoDisplay />
        </div>
      )}

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            air.fun
          </h1>
          <p className="text-2xl text-gray-300 mb-8">Stream. Create. Earn.</p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            The decentralized livestreaming platform where your content creates value. Start
            streaming and automatically launch your own memecoin.
          </p>
        </div>

        <div className="flex justify-center gap-4">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-lg transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => navigate("/stream/create")}
                className="px-8 py-4 bg-pink-600 hover:bg-pink-700 rounded-lg font-semibold text-lg transition-colors"
              >
                Start Streaming
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-lg transition-colors"
            >
              Get Started
            </button>
          )}
        </div>

        {isAuthenticated && user && (
          <div className="mt-12 text-center">
            <p className="text-gray-400">
              Welcome back, <span className="text-purple-400 font-semibold">{user.username}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
