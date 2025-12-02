// Stream info component displaying streamer and token details

import type { Stream, Token } from "../types";

interface StreamInfoProps {
  stream: Stream;
  token: Token | null;
}

export function StreamInfo({ stream, token }: StreamInfoProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Streamer info */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">{stream.title}</h1>
        <p className="text-gray-400 mb-4">{stream.streamerName}</p>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Category:</span>
            <span className="text-white">{stream.category}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Viewers:</span>
            <span className="text-white">{stream.viewerCount}</span>
          </div>
        </div>
      </div>

      {/* Token info */}
      {token && (
        <div className="border-t border-gray-700 pt-6">
          <h2 className="text-lg font-semibold text-white mb-4">Token Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm mb-1">Symbol</p>
              <p className="text-purple-400 font-mono font-bold">{token.symbol}</p>
            </div>

            <div>
              <p className="text-gray-500 text-sm mb-1">Market Cap</p>
              <p className="text-green-400 font-bold">${(token.marketCap / 1000).toFixed(2)}k</p>
            </div>

            <div>
              <p className="text-gray-500 text-sm mb-1">Current Price</p>
              <p className="text-white">${token.currentPrice.toFixed(6)}</p>
            </div>

            <div>
              <p className="text-gray-500 text-sm mb-1">Tokens Sold</p>
              <p className="text-white">
                {(token.tokensSold / 1000000).toFixed(2)}M /{" "}
                {(token.bondingCurveSupply / 1000000).toFixed(0)}M
              </p>
            </div>
          </div>

          {/* Graduation progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Graduation Progress</span>
              <span className="text-white">
                {((token.marketCap / token.graduationTarget) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min((token.marketCap / token.graduationTarget) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="text-gray-500 text-xs mt-1">
              ${(token.marketCap / 1000).toFixed(1)}k / $
              {(token.graduationTarget / 1000).toFixed(0)}k
            </p>
          </div>

          {token.isGraduated && (
            <div className="mt-4 bg-green-900 bg-opacity-20 border border-green-500 rounded-lg p-3">
              <p className="text-green-400 font-semibold">🎉 Token Graduated!</p>
              <p className="text-gray-400 text-sm mt-1">
                Liquidity pool created. Trading now available on DEX.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
