// Notification toast for purchase and graduation announcements

import type { PurchaseNotification, GraduationNotification } from "../types";

interface NotificationToastProps {
  notifications: Array<PurchaseNotification | GraduationNotification>;
}

function isPurchaseNotification(
  notification: PurchaseNotification | GraduationNotification
): notification is PurchaseNotification {
  return "buyerId" in notification;
}

export function NotificationToast({ notifications }: NotificationToastProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-40 space-y-2 max-w-sm">
      {notifications.map((notification, index) => {
        if (isPurchaseNotification(notification)) {
          const isLarge = notification.price * notification.amount > 100;

          return (
            <div
              key={index}
              className={`bg-gray-800 border rounded-lg p-4 shadow-lg animate-slide-in ${
                isLarge ? "border-yellow-500" : "border-purple-500"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`text-2xl ${isLarge ? "animate-bounce" : ""}`}>
                  {isLarge ? "🐋" : "💰"}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">
                    {notification.buyerUsername} bought tokens!
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {notification.amount.toLocaleString()} tokens for $
                    {(notification.price * notification.amount).toFixed(2)}
                  </p>
                  <p className="text-purple-400 text-xs mt-1">
                    New market cap: ${(notification.newMarketCap / 1000).toFixed(1)}k
                  </p>
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div
              key={index}
              className="bg-gradient-to-r from-purple-900 to-pink-900 border border-purple-500 rounded-lg p-4 shadow-lg animate-slide-in"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl animate-bounce">🎉</div>
                <div className="flex-1">
                  <p className="text-white font-bold text-lg">Token Graduated!</p>
                  <p className="text-gray-200 text-sm mt-1">
                    {notification.tokenSymbol} reached $
                    {(notification.finalMarketCap / 1000).toFixed(1)}k
                  </p>
                  <p className="text-purple-300 text-xs mt-1">Liquidity pool created 🚀</p>
                </div>
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}
