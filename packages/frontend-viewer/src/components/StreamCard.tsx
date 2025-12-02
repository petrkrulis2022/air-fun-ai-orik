// Stream card component for displaying individual streams

import type { Stream } from "../types";

interface StreamCardProps {
  stream: Stream;
  onClick: (stream: Stream) => void;
}

export function StreamCard({ stream, onClick }: StreamCardProps) {
  return (
    <div
      className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all"
      onClick={() => onClick(stream)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-700">
        {stream.thumbnailUrl ? (
          <img
            src={stream.thumbnailUrl}
            alt={stream.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            No Thumbnail
          </div>
        )}

        {/* Live badge */}
        {stream.status === "live" && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
            LIVE
          </div>
        )}

        {/* Viewer count */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
          👁 {stream.viewerCount} viewers
        </div>
      </div>

      {/* Stream info */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-lg mb-1 truncate">{stream.title}</h3>

        <p className="text-gray-400 text-sm mb-2">{stream.streamerName}</p>

        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-xs">{stream.category}</span>

          {stream.tokenSymbol && (
            <div className="flex items-center gap-2">
              <span className="text-purple-400 text-xs font-mono">{stream.tokenSymbol}</span>
              {stream.tokenMarketCap && (
                <span className="text-green-400 text-xs">
                  ${(stream.tokenMarketCap / 1000).toFixed(1)}k
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
