import { useState } from "react";
import { ethers } from "ethers";

export function useWallet() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectMetaMask = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];

      // Request signature for authentication
      const signer = await provider.getSigner();
      const message = `Sign this message to authenticate with air.fun\n\nAddress: ${address}\nTimestamp: ${Date.now()}`;
      const signature = await signer.signMessage(message);

      return { address, signature };
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const connectHashio = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Hashio wallet connection logic would go here
      // For now, throw an error as Hashio integration needs specific SDK
      throw new Error("Hashio wallet integration coming soon");
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  return {
    connectMetaMask,
    connectHashio,
    isConnecting,
    error,
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
