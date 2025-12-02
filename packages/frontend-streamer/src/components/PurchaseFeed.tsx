import { useEffect, useState } from "react";

interface Purchase {
  id: string;
  buyerUsername: string;
  amount: number;
  price: number;
  totalSpent: number;
  timestamp: number;
}

interface PurchaseFeedProps {
  streamId: string;
  onPurchase?: (purchase: any) => void;
}

export default function PurchaseFeed({ streamId, onPurchase }: PurchaseFeedProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    // This would be connected to WebSocket in real implementation
    // For now, just showing the UI structure
  }, [streamId]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Recent Purchases</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {purchases.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No purchases yet</p>
        ) : (
          purchases.map((purchase) => (
            <div
              key={purchase.id}
              className={`p-3 rounded-lg ${
                purchase.totalSpent > 100
                  ? "bg-yellow-900 bg-opacity-30 border border-yellow-500"
                  : "bg-gray-700"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-white">{purchase.buyerUsername}</p>
                  <p className="text-sm text-gray-400">{purchase.amount.toLocaleString()} tokens</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-400">${purchase.totalSpent.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{formatTime(purchase.timestamp)}</p>
                </div>
              </div>
              {purchase.totalSpent > 100 && (
                <p className="text-xs text-yellow-400 mt-1">🔥 Large purchase!</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
