import { useWalletInfo } from "../hooks/useWalletInfo";

interface WalletInfoDisplayProps {
  className?: string;
}

export function WalletInfoDisplay({ className = "" }: WalletInfoDisplayProps) {
  const { address, chainName, isConnected } = useWalletInfo();

  if (!isConnected) {
    return null;
  }

  // Format address to show first 6 and last 4 characters
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Get chain color based on network
  const getChainColor = () => {
    if (chainName.includes("Base")) return "bg-blue-500";
    if (chainName.includes("Hedera")) return "bg-purple-500";
    return "bg-gray-500";
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Network Badge */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${getChainColor()} bg-opacity-20 border border-opacity-30 ${getChainColor().replace("bg-", "border-")}`}
      >
        <div className={`w-2 h-2 rounded-full ${getChainColor()} animate-pulse`}></div>
        <span className="text-sm font-medium text-white">{chainName}</span>
      </div>

      {/* Wallet Address */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded-full">
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
        <span className="text-sm font-mono text-gray-300">{formatAddress(address!)}</span>
      </div>
    </div>
  );
}
