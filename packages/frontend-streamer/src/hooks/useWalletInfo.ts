import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

interface WalletInfo {
  address: string | null;
  chainId: number | null;
  chainName: string;
  isConnected: boolean;
}

const CHAIN_NAMES: Record<number, string> = {
  84532: "Base Sepolia",
  296: "Hedera Testnet",
  1: "Ethereum Mainnet",
  11155111: "Sepolia",
  8453: "Base",
};

export function useWalletInfo() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    address: null,
    chainId: null,
    chainName: "Unknown Network",
    isConnected: false,
  });

  const updateWalletInfo = useCallback(async () => {
    if (!window.ethereum) {
      setWalletInfo({
        address: null,
        chainId: null,
        chainName: "No Wallet",
        isConnected: false,
      });
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length === 0) {
        setWalletInfo({
          address: null,
          chainId: null,
          chainName: "Not Connected",
          isConnected: false,
        });
        return;
      }

      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const chainName = CHAIN_NAMES[chainId] || `Chain ${chainId}`;

      setWalletInfo({
        address: accounts[0].address,
        chainId,
        chainName,
        isConnected: true,
      });
    } catch (err) {
      console.error("Failed to get wallet info:", err);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    updateWalletInfo();

    if (!window.ethereum) return;

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWalletInfo({
          address: null,
          chainId: null,
          chainName: "Not Connected",
          isConnected: false,
        });
      } else {
        updateWalletInfo();
      }
    };

    // Listen for chain changes
    const handleChainChanged = () => {
      updateWalletInfo();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [updateWalletInfo]);

  return walletInfo;
}
