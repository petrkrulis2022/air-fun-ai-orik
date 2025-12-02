// Purchase modal for buying tokens

import { useState, useEffect } from "react";
import type { Token, DeployedAgent, PriceQuote } from "../types";
import { purchaseService } from "../services/purchaseService";
import { BondingCurveChart } from "./BondingCurveChart";

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token;
  agent: DeployedAgent | null;
  onPurchaseComplete: () => void;
}

const BONDING_CURVE_K = 0.000000001;

export function PurchaseModal({
  isOpen,
  onClose,
  token,
  agent,
  onPurchaseComplete,
}: PurchaseModalProps) {
  const [amount, setAmount] = useState(agent?.config.defaultPurchaseAmount || 1000);
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chain, setChain] = useState<"hedera" | "base">("hedera");

  // Fetch price quote when amount changes
  useEffect(() => {
    if (!isOpen || amount <= 0) return;

    const fetchQuote = async () => {
      try {
        setLoading(true);
        setError(null);
        const quoteData = await purchaseService.getPriceQuote(token.id, amount);
        setQuote(quoteData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch quote");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchQuote, 300); // Debounce
    return () => clearTimeout(timer);
  }, [amount, token.id, isOpen]);

  const handlePurchase = async () => {
    if (!quote || purchasing) return;

    try {
      setPurchasing(true);
      setError(null);

      await purchaseService.executePurchase(
        token.id,
        "viewer-1", // TODO: Get from auth store
        amount,
        0.5, // 0.5% max slippage
        chain
      );

      onPurchaseComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setPurchasing(false);
    }
  };

  const handleQuickBuy = async () => {
    if (!agent?.config.quickBuyEnabled) return;
    setAmount(agent.config.defaultPurchaseAmount);
    // Wait for quote to update, then purchase
    setTimeout(handlePurchase, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Buy {token.symbol}</h2>
            {agent && <p className="text-gray-400 text-sm mt-1">via {agent.name}</p>}
          </div>
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Bonding Curve Chart */}
          <div>
            <h3 className="text-white font-semibold mb-3">Bonding Curve</h3>
            <div className="bg-gray-900 rounded-lg p-4">
              <BondingCurveChart
                currentSupply={token.tokensSold}
                maxSupply={token.bondingCurveSupply}
                currentPrice={token.currentPrice}
                k={BONDING_CURVE_K}
              />
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-white font-semibold mb-2">Amount (tokens)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
              min="1"
              step="100"
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Chain Selection */}
          <div>
            <label className="block text-white font-semibold mb-2">Blockchain</label>
            <div className="flex gap-3">
              <button
                onClick={() => setChain("hedera")}
                className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
                  chain === "hedera"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Hedera
              </button>
              <button
                onClick={() => setChain("base")}
                className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
                  chain === "base"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Base
              </button>
            </div>
          </div>

          {/* Price Quote */}
          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          )}

          {quote && !loading && (
            <div className="bg-gray-900 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Price per token</span>
                <span className="text-white font-mono">${quote.pricePerToken.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total cost</span>
                <span className="text-white font-bold">${quote.usdcCost.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Price impact</span>
                <span
                  className={`font-semibold ${quote.priceImpact > 5 ? "text-red-400" : "text-green-400"}`}
                >
                  {quote.priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max slippage</span>
                <span className="text-white">{quote.slippage}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Est. gas</span>
                <span className="text-gray-400">${quote.estimatedGas.toFixed(4)}</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-3">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {agent?.config.quickBuyEnabled && (
              <button
                onClick={handleQuickBuy}
                disabled={purchasing || loading}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Quick Buy
              </button>
            )}
            <button
              onClick={handlePurchase}
              disabled={purchasing || loading || !quote || amount <= 0}
              className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {purchasing ? "Processing..." : "Buy Tokens"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
