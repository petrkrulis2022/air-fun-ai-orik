// Portfolio page showing owned tokens and purchase history

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Purchase, Token } from "../types";
import { purchaseService } from "../services/purchaseService";
import { apiService } from "../services/api";
import { API_ENDPOINTS } from "../config/api";

interface TokenHolding {
  token: Token;
  amount: number;
  averagePrice: number;
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

export function PortfolioPage() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [holdings, setHoldings] = useState<TokenHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"holdings" | "history">("holdings");

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch purchase history
      const purchaseHistory = await purchaseService.getUserPurchaseHistory("viewer-1"); // TODO: Get from auth
      setPurchases(purchaseHistory);

      // Calculate holdings
      const tokenMap = new Map<string, { purchases: Purchase[]; token?: Token }>();

      for (const purchase of purchaseHistory) {
        if (!tokenMap.has(purchase.tokenId)) {
          tokenMap.set(purchase.tokenId, { purchases: [] });
        }
        tokenMap.get(purchase.tokenId)!.purchases.push(purchase);
      }

      // Fetch current token data for each holding
      const holdingsData: TokenHolding[] = [];

      for (const [tokenId, data] of tokenMap.entries()) {
        try {
          const token = await apiService.get<Token>(API_ENDPOINTS.TOKEN_BY_ID(tokenId));

          const totalAmount = data.purchases.reduce((sum, p) => sum + p.amount, 0);
          const totalInvested = data.purchases.reduce((sum, p) => sum + p.totalSpent, 0);
          const averagePrice = totalInvested / totalAmount;
          const currentValue = totalAmount * token.currentPrice;
          const profitLoss = currentValue - totalInvested;
          const profitLossPercent = (profitLoss / totalInvested) * 100;

          holdingsData.push({
            token,
            amount: totalAmount,
            averagePrice,
            totalInvested,
            currentValue,
            profitLoss,
            profitLossPercent,
          });
        } catch (err) {
          console.error(`Failed to fetch token ${tokenId}:`, err);
        }
      }

      setHoldings(holdingsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  };

  const totalPortfolioValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalInvested = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
  const totalProfitLoss = totalPortfolioValue - totalInvested;
  const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-white">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate("/")}
            className="text-purple-400 hover:text-purple-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Streams
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Portfolio</h1>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">Total Value</p>
            <p className="text-3xl font-bold text-white">${totalPortfolioValue.toFixed(2)}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">Total Invested</p>
            <p className="text-3xl font-bold text-white">${totalInvested.toFixed(2)}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">Profit/Loss</p>
            <p
              className={`text-3xl font-bold ${totalProfitLoss >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              {totalProfitLoss >= 0 ? "+" : ""}${totalProfitLoss.toFixed(2)}
            </p>
            <p className={`text-sm ${totalProfitLoss >= 0 ? "text-green-400" : "text-red-400"}`}>
              {totalProfitLoss >= 0 ? "+" : ""}
              {totalProfitLossPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("holdings")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "holdings"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Holdings ({holdings.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "history"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            History ({purchases.length})
          </button>
        </div>

        {/* Holdings Tab */}
        {activeTab === "holdings" && (
          <div className="space-y-4">
            {holdings.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <p className="text-gray-400 mb-4">You don't own any tokens yet</p>
                <button
                  onClick={() => navigate("/")}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Browse Streams
                </button>
              </div>
            ) : (
              holdings.map((holding) => (
                <div key={holding.token.id} className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{holding.token.name}</h3>
                      <p className="text-purple-400 font-mono">{holding.token.symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        ${holding.currentValue.toFixed(2)}
                      </p>
                      <p
                        className={`text-sm font-semibold ${holding.profitLoss >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {holding.profitLoss >= 0 ? "+" : ""}${holding.profitLoss.toFixed(2)} (
                        {holding.profitLoss >= 0 ? "+" : ""}
                        {holding.profitLossPercent.toFixed(2)}%)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 mb-1">Amount</p>
                      <p className="text-white font-semibold">{holding.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Avg Price</p>
                      <p className="text-white font-semibold">${holding.averagePrice.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Current Price</p>
                      <p className="text-white font-semibold">
                        ${holding.token.currentPrice.toFixed(6)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Market Cap</p>
                      <p className="text-white font-semibold">
                        ${(holding.token.marketCap / 1000).toFixed(1)}k
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            {purchases.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">No purchase history</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Token
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Tx Hash
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {purchases.map((purchase) => (
                      <tr key={purchase.id} className="hover:bg-gray-750">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(purchase.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-mono">
                          {purchase.tokenId.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {purchase.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          ${purchase.price.toFixed(6)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">
                          ${purchase.totalSpent.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a
                            href={`https://hashscan.io/testnet/transaction/${purchase.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300"
                          >
                            {purchase.txHash.substring(0, 10)}...
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-4 mt-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
