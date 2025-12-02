import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { authService } from "../services/authService";
import { useAuthStore } from "../store/authStore";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function WalletConnectModal({
  isOpen,
  onClose,
  onSuccess,
}: WalletConnectModalProps) {
  const { connectMetaMask, connectHashio, isConnecting, error } = useWallet();
  const { setAuth } = useAuthStore();
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleMetaMaskConnect = async () => {
    try {
      setAuthError(null);
      const { address, signature } = await connectMetaMask();
      const session = await authService.connectWallet("metamask", signature, address);
      setAuth(session);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setAuthError(err.message || "Failed to authenticate");
    }
  };

  const handleHashioConnect = async () => {
    try {
      setAuthError(null);
      const { address, signature } = await connectHashio();
      const session = await authService.connectWallet("hashio", signature, address);
      setAuth(session);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setAuthError(err.message || "Failed to authenticate");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Connect Wallet</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleMetaMaskConnect}
            disabled={isConnecting}
            className="w-full p-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 rounded-lg flex items-center justify-center gap-3 transition-colors"
          >
            <span className="text-lg font-semibold">
              {isConnecting ? "Connecting..." : "MetaMask"}
            </span>
          </button>

          <button
            onClick={handleHashioConnect}
            disabled={isConnecting}
            className="w-full p-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg flex items-center justify-center gap-3 transition-colors"
          >
            <span className="text-lg font-semibold">
              {isConnecting ? "Connecting..." : "Hashio"}
            </span>
          </button>
        </div>

        {(error || authError) && (
          <div className="mt-4 p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded text-red-200 text-sm">
            {error || authError}
          </div>
        )}

        <p className="mt-6 text-sm text-gray-400 text-center">
          By connecting your wallet, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
