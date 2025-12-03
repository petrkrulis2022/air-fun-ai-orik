import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useAuthStore } from "../store/authStore";
import { apiService } from "../services/api";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const { connectMetaMask, connectHashio, isConnecting, error: walletError } = useWallet();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleMetaMaskConnect = async () => {
    try {
      setError(null);
      const { address, signature } = await connectMetaMask();

      // Authenticate with backend
      const response = await apiService.post("/auth/wallet/connect", {
        walletType: "metamask",
        address,
        signature,
      });

      setAuth(response.data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    }
  };

  const handleHashioConnect = async () => {
    try {
      setError(null);
      const { address, signature } = await connectHashio();

      // Authenticate with backend
      const response = await apiService.post("/auth/wallet/connect", {
        walletType: "hashio",
        address,
        signature,
      });

      setAuth(response.data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Connect Wallet</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleMetaMaskConnect}
            disabled={isConnecting}
            className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {isConnecting ? "Connecting..." : "MetaMask"}
          </button>

          <button
            onClick={handleHashioConnect}
            disabled={isConnecting}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {isConnecting ? "Connecting..." : "Hashio"}
          </button>

          {(error || walletError) && (
            <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error || walletError}</p>
            </div>
          )}

          <p className="text-gray-400 text-sm text-center mt-4">
            By connecting your wallet, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}
