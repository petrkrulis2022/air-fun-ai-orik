import { useState } from "react";
import { useNavigate } from "react-router-dom";
import WalletConnectModal from "../components/WalletConnectModal";
import EmailAuthForm from "../components/EmailAuthForm";

export default function AuthPage() {
  const navigate = useNavigate();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [authMethod, setAuthMethod] = useState<"wallet" | "email" | null>(null);

  const handleAuthSuccess = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black text-white flex items-center justify-center">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Welcome to air.fun
          </h1>
          <p className="text-xl text-gray-300">Choose your authentication method to get started</p>
        </div>

        {!authMethod ? (
          <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
            <button
              onClick={() => setShowWalletModal(true)}
              className="w-full p-6 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <h3 className="text-xl font-semibold mb-2">Connect Wallet</h3>
              <p className="text-sm text-gray-300">Use MetaMask or Hashio to connect</p>
            </button>

            <div className="flex items-center gap-4 w-full">
              <div className="flex-1 h-px bg-gray-700"></div>
              <span className="text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-700"></div>
            </div>

            <button
              onClick={() => setAuthMethod("email")}
              className="w-full p-6 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <h3 className="text-xl font-semibold mb-2">Email & Password</h3>
              <p className="text-sm text-gray-300">Traditional authentication method</p>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <EmailAuthForm onSuccess={handleAuthSuccess} />
            <button
              onClick={() => setAuthMethod(null)}
              className="mt-4 text-gray-400 hover:text-white transition-colors"
            >
              ← Back to options
            </button>
          </div>
        )}

        <WalletConnectModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    </div>
  );
}
