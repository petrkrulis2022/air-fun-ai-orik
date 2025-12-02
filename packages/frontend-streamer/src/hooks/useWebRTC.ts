import { useState, useRef, useCallback } from "react";

export function useWebRTC() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const initializeMedia = useCallback(async (quality: "720p" | "1080p") => {
    try {
      setError(null);

      const constraints: MediaStreamConstraints = {
        video: {
          width: quality === "1080p" ? 1920 : 1280,
          height: quality === "1080p" ? 1080 : 720,
          frameRate: 30,
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsInitialized(true);
      return stream;
    } catch (err: any) {
      const errorMessage =
        err.name === "NotAllowedError"
          ? "Camera and microphone access denied"
          : "Failed to access media devices";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const stopMedia = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsInitialized(false);
  }, [localStream]);

  return {
    isInitialized,
    localStream,
    videoRef,
    error,
    initializeMedia,
    stopMedia,
  };
}
