// Stream grid component for displaying multiple streams

import type { Stream } from "../types";
import { StreamCard } from "./StreamCard";

interface StreamGridProps {
  streams: Stream[];
  onStreamClick: (stream: Stream) => void;
  emptyMessage?: string;
}

export function StreamGrid({
  streams,
  onStreamClick,
  emptyMessage = "No streams found",
}: StreamGridProps) {
  if (streams.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {streams.map((stream) => (
        <StreamCard key={stream.id} stream={stream} onClick={onStreamClick} />
      ))}
    </div>
  );
}
