// WebRTC hook for consuming video streams

import { useState, useEffect, useRef, useCallback } from "react";
import { apiService } from "../services/api";
import { API_ENDPOINTS } from "../config/api";
import * as mediasoupClient from "mediasoup-client";

interface UseWebRTCOptions {
  streamId: string;
  enabled: boolean;
}

export function useWebRTC({ streamId, enabled }: UseWebRTCOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [audioTrack, setAudioTrack] = useState<MediaStreamTrack | null>(null);

  const deviceRef = useRef<mediasoupClient.types.Device | null>(null);
  const transportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const videoConsumerRef = useRef<mediasoupClient.types.Consumer | null>(null);
  const audioConsumerRef = useRef<mediasoupClient.types.Consumer | null>(null);

  const connect = useCallback(async () => {
    if (!enabled || !streamId) return;

    try {
      setError(null);

      // Get RTP capabilities
      const rtpCapabilities = await apiService.get<any>(
        API_ENDPOINTS.STREAMS_RTP_CAPABILITIES(streamId)
      );

      // Create device
      const device = new mediasoupClient.Device();
      await device.load({ routerRtpCapabilities: rtpCapabilities });
      deviceRef.current = device;

      // Create consumer transport
      const transportOptions = await apiService.post<any>(
        API_ENDPOINTS.STREAMS_TRANSPORT_CONSUMER(streamId),
        { rtpCapabilities: device.rtpCapabilities }
      );

      const transport = device.createRecvTransport(transportOptions);
      transportRef.current = transport;

      // Handle transport connection
      transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        try {
          await apiService.post(API_ENDPOINTS.STREAMS_TRANSPORT_CONNECT(transport.id), {
            dtlsParameters,
          });
          callback();
        } catch (err) {
          errback(err as Error);
        }
      });

      // Consume video
      try {
        const videoConsumerOptions = await apiService.post<any>(
          API_ENDPOINTS.STREAMS_TRANSPORT_CONSUME(streamId, transport.id),
          {
            rtpCapabilities: device.rtpCapabilities,
            kind: "video",
          }
        );

        const videoConsumer = await transport.consume(videoConsumerOptions);
        videoConsumerRef.current = videoConsumer;
        setVideoTrack(videoConsumer.track);
      } catch (err) {
        console.warn("Failed to consume video:", err);
      }

      // Consume audio
      try {
        const audioConsumerOptions = await apiService.post<any>(
          API_ENDPOINTS.STREAMS_TRANSPORT_CONSUME(streamId, transport.id),
          {
            rtpCapabilities: device.rtpCapabilities,
            kind: "audio",
          }
        );

        const audioConsumer = await transport.consume(audioConsumerOptions);
        audioConsumerRef.current = audioConsumer;
        setAudioTrack(audioConsumer.track);
      } catch (err) {
        console.warn("Failed to consume audio:", err);
      }

      setIsConnected(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect";
      setError(message);
      console.error("WebRTC connection error:", err);
    }
  }, [streamId, enabled]);

  const disconnect = useCallback(() => {
    if (videoConsumerRef.current) {
      videoConsumerRef.current.close();
      videoConsumerRef.current = null;
    }
    if (audioConsumerRef.current) {
      audioConsumerRef.current.close();
      audioConsumerRef.current = null;
    }
    if (transportRef.current) {
      transportRef.current.close();
      transportRef.current = null;
    }

    setVideoTrack(null);
    setAudioTrack(null);
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    error,
    videoTrack,
    audioTrack,
    reconnect: connect,
  };
}
