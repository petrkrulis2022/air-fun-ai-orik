// Video player component for WebRTC streams

import { useEffect, useRef, useState } from "react";

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
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    if (videoTrack || audioTrack) {
      const stream = new MediaStream();

      if (videoTrack) {
        stream.addTrack(videoTrack);
        console.log(
          "Video track added to stream, readyState:",
          videoTrack.readyState,
          "enabled:",
          videoTrack.enabled,
          "muted:",
          videoTrack.muted
        );

        // Check if we're receiving data
        const checkVideoData = setInterval(() => {
          if (video.readyState >= 2) {
            console.log(
              "Video has enough data, dimensions:",
              video.videoWidth,
              "x",
              video.videoHeight
            );
            clearInterval(checkVideoData);
          } else {
            console.log("Video readyState:", video.readyState, "(waiting for data...)");
          }
        }, 1000);

        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkVideoData), 10000);
      }

      if (audioTrack) {
        stream.addTrack(audioTrack);
        console.log(
          "Audio track added to stream, readyState:",
          audioTrack.readyState,
          "enabled:",
          audioTrack.enabled
        );
      }

      video.srcObject = stream;

      // Log video element events for debugging
      video.onloadedmetadata = () =>
        console.log("Video: loadedmetadata, dimensions:", video.videoWidth, "x", video.videoHeight);
      video.onloadeddata = () => console.log("Video: loadeddata");
      video.oncanplay = () => console.log("Video: canplay");
      video.onplaying = () => console.log("Video: playing");
      video.onwaiting = () => console.log("Video: waiting for data");

      video.play().catch((err) => {
        console.log("Autoplay blocked, user interaction needed:", err.message);
      });
    }

    return () => {
      video.srcObject = null;
    };
  }, [videoTrack, audioTrack]);

  const handleUnmute = () => {
    setIsMuted(false);
    if (videoRef.current) {
      videoRef.current.muted = false;
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 rounded-lg">
        <div className="text-center p-8">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={onReconnect}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Connecting to stream...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[300px] bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className="absolute inset-0 w-full h-full object-contain"
      />

      {isMuted && (
        <button
          onClick={handleUnmute}
          className="absolute bottom-4 right-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
        >
          <span>��</span> Click to Unmute
        </button>
      )}
    </div>
  );
}
