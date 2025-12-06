import { useState, useRef, useCallback, useEffect } from "react";

export function useWebRTC() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup function to stop all tracks
  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      console.log("Cleaning up previous stream...");
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log(`Stopped track: ${track.kind}`);
      });
      streamRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);

  // Attach stream to video element when both are available
  useEffect(() => {
    if (localStream && videoRef.current) {
      console.log("Attaching stream to video element");
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Also provide a function to manually attach the stream (for when video element mounts later)
  const attachToVideo = useCallback((videoElement: HTMLVideoElement | null) => {
    if (videoElement && streamRef.current) {
      console.log("Manually attaching stream to video element");
      videoElement.srcObject = streamRef.current;
    }
  }, []);

  const initializeMedia = useCallback(
    async (quality: "720p" | "1080p", retryCount = 0) => {
      const MAX_RETRIES = 3;
      const RETRY_DELAY = 500;

      try {
        setError(null);

        // Check if we already have a working stream - don't clean it up!
        if (streamRef.current) {
          const tracks = streamRef.current.getTracks();
          const allTracksLive = tracks.length > 0 && tracks.every((t) => t.readyState === "live");
          if (allTracksLive) {
            console.log("Reusing existing live stream");
            return streamRef.current;
          }
          // Only cleanup if tracks are not live
          console.log("Existing stream has dead tracks, cleaning up...");
          cleanupStream();
        }

        // Small delay to ensure previous stream is fully released
        if (retryCount > 0) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        }

        // First check if mediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("MediaDevices API not available. Please use HTTPS or localhost.");
        }

        // Check if any video devices exist
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        const audioDevices = devices.filter((d) => d.kind === "audioinput");

        console.log("Available video devices:", videoDevices.length);
        console.log("Available audio devices:", audioDevices.length);

        if (videoDevices.length === 0) {
          throw new Error("NoVideoDevice");
        }

        // Start with simpler constraints on retry
        const useSimpleConstraints = retryCount > 0;

        const constraints: MediaStreamConstraints = {
          video: useSimpleConstraints
            ? true // Simple constraint on retry
            : {
                width: { ideal: quality === "1080p" ? 1920 : 1280 },
                height: { ideal: quality === "1080p" ? 1080 : 720 },
                frameRate: { ideal: 30 },
              },
          audio:
            audioDevices.length > 0
              ? {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                }
              : false,
        };

        console.log(
          `Requesting media (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`,
          constraints
        );

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        // Store in ref for cleanup
        streamRef.current = stream;
        setLocalStream(stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setIsInitialized(true);
        console.log("Media initialized successfully!");
        return stream;
      } catch (err: any) {
        console.error("Media access error:", err.name, err.message);

        // Retry on NotReadableError (device busy)
        if (err.name === "NotReadableError" && retryCount < MAX_RETRIES) {
          console.log(
            `Retrying in ${RETRY_DELAY}ms... (attempt ${retryCount + 2}/${MAX_RETRIES + 1})`
          );
          return initializeMedia(quality, retryCount + 1);
        }

        let errorMessage: string;
        switch (err.name) {
          case "NotAllowedError":
            errorMessage =
              "Camera/microphone access denied. Please allow access in browser settings.";
            break;
          case "NotFoundError":
            errorMessage = "No camera or microphone found. Please connect a device.";
            break;
          case "NotReadableError":
            errorMessage =
              "Camera is busy. Please close other apps using the camera and try again.";
            break;
          case "OverconstrainedError":
            errorMessage =
              "Camera doesn't support the requested resolution. Try a different quality.";
            break;
          default:
            if (err.message === "NoVideoDevice") {
              errorMessage = "No camera detected. Please connect a camera and try again.";
            } else {
              errorMessage = `Failed to access media: ${err.message || err.name || "Unknown error"}`;
            }
        }

        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [cleanupStream]
  );

  const stopMedia = useCallback(() => {
    cleanupStream();
    setLocalStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsInitialized(false);
  }, [cleanupStream]);

  return {
    isInitialized,
    localStream,
    videoRef,
    error,
    initializeMedia,
    stopMedia,
    attachToVideo,
  };
}
