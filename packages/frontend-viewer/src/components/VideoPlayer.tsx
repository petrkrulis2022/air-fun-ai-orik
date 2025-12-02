// Video player component for WebRTC streams

import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  videoTrack: MediaStreamTrack | null;
  audioTrack: MediaStreamTrack | null;
  isConnected: boolean;
  error: string | null;
  onReconnect: () => void;
}

export function VideoPlayer({
  videoTrack,
  audioTrack,
  isConnected,
  error,
  onReconnect,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const stream = new MediaStream();
    if (videoTrack) stream.addTrack(videoTrack);
    if (audioTrack) stream.addTrack(audioTrack);

    videoRef.current.srcObject = stream;
    videoRef.current.play().catch((err) => {
      console.error("Failed to play video:", err);
    });

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [videoTrack, audioTrack]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video ref={videoRef} className="w-full h-full" autoPlay playsInline muted={false} />

      {/* Loading overlay */}
      {!isConnected && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-white">Connecting to stream...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center max-w-md px-4">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={onReconnect}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Reconnect
            </button>
          </div>
        </div>
      )}

      {/* Live indicator */}
      {isConnected && (
        <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          LIVE
        </div>
      )}
    </div>
  );
}
