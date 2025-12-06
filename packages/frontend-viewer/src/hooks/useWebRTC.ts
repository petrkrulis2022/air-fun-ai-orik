// WebRTC hook for consuming video streams via mediasoup

import { useState, useEffect, useRef, useCallback } from "react";
import { apiService } from "../services/api";
import { API_ENDPOINTS } from "../config/api";
import * as mediasoupClient from "mediasoup-client";

interface UseWebRTCOptions {
  streamId: string;
  enabled: boolean;
}

interface RtpCapabilitiesResponse {
  rtpCapabilities: mediasoupClient.types.RtpCapabilities;
}

interface ProducersResponse {
  producerIds: string[];
}

interface TransportOptions {
  id: string;
  iceParameters: mediasoupClient.types.IceParameters;
  iceCandidates: mediasoupClient.types.IceCandidate[];
  dtlsParameters: mediasoupClient.types.DtlsParameters;
}

interface ConsumeResponse {
  id: string;
  producerId: string;
  kind: "audio" | "video";
  rtpParameters: mediasoupClient.types.RtpParameters;
}

const getViewerId = () => {
  let viewerId = sessionStorage.getItem("viewerId");
  if (!viewerId) {
    viewerId = "viewer-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem("viewerId", viewerId);
  }
  return viewerId;
};

export function useWebRTC({ streamId, enabled }: UseWebRTCOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [audioTrack, setAudioTrack] = useState<MediaStreamTrack | null>(null);

  const deviceRef = useRef<mediasoupClient.types.Device | null>(null);
  const transportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const videoConsumerRef = useRef<mediasoupClient.types.Consumer | null>(null);
  const audioConsumerRef = useRef<mediasoupClient.types.Consumer | null>(null);
  const isConnectingRef = useRef(false);
  const viewerIdRef = useRef(getViewerId());

  const connect = useCallback(async () => {
    if (!enabled || !streamId) return;

    if (isConnectingRef.current) {
      console.log("WebRTC already connecting, skipping");
      return;
    }

    if (isConnected) {
      console.log("WebRTC already connected");
      return;
    }

    isConnectingRef.current = true;
    console.log("Starting WebRTC consumer connection for stream:", streamId);

    try {
      setError(null);

      console.log("Fetching producers...");
      const producersResponse = await apiService.get<ProducersResponse>(
        API_ENDPOINTS.STREAMS_PRODUCERS(streamId)
      );

      const producerIds = producersResponse.producerIds;
      console.log("Available producers:", producerIds);

      if (producerIds.length === 0) {
        throw new Error("No producers available - streamer may not be broadcasting yet");
      }

      console.log("Getting RTP capabilities...");
      const capabilitiesResponse = await apiService.get<RtpCapabilitiesResponse>(
        API_ENDPOINTS.STREAMS_RTP_CAPABILITIES(streamId)
      );

      const rtpCapabilities = capabilitiesResponse.rtpCapabilities;
      console.log("Got RTP capabilities");

      const device = new mediasoupClient.Device();
      await device.load({ routerRtpCapabilities: rtpCapabilities });
      deviceRef.current = device;
      console.log("Device loaded");

      console.log("Creating consumer transport...");
      const transportOptions = await apiService.post<TransportOptions>(
        API_ENDPOINTS.STREAMS_TRANSPORT_CONSUMER(streamId),
        { viewerId: viewerIdRef.current }
      );
      console.log("Got transport options:", transportOptions.id);

      const transport = device.createRecvTransport(transportOptions);
      transportRef.current = transport;

      transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        try {
          console.log("Transport connecting...");
          await apiService.post(API_ENDPOINTS.STREAMS_TRANSPORT_CONNECT(transport.id), {
            dtlsParameters,
          });
          console.log("Transport connected");
          callback();
        } catch (err) {
          console.error("Transport connect error:", err);
          errback(err as Error);
        }
      });

      for (const producerId of producerIds) {
        try {
          console.log("Consuming producer " + producerId + "...");

          const consumeResponse = await apiService.post<ConsumeResponse>(
            API_ENDPOINTS.STREAMS_TRANSPORT_CONSUME(streamId, transport.id),
            {
              producerId,
              rtpCapabilities: device.rtpCapabilities,
            }
          );

          console.log("Consume response for " + producerId + ":", consumeResponse.kind);

          const consumer = await transport.consume({
            id: consumeResponse.id,
            producerId: consumeResponse.producerId,
            kind: consumeResponse.kind,
            rtpParameters: consumeResponse.rtpParameters,
          });

          console.log("Consumer created for " + consumeResponse.kind + ":", consumer.id);
          console.log("Consumer paused state:", consumer.paused);
          console.log("Consumer track:", consumer.track);
          console.log("Consumer track readyState:", consumer.track?.readyState);

          // Resume consumer on the server side - this is critical for receiving media
          await apiService.post(API_ENDPOINTS.STREAMS_CONSUMER_RESUME(consumer.id), {});
          console.log("Consumer resumed on server for " + consumeResponse.kind);

          // Also resume on client side if paused
          if (consumer.paused) {
            console.log("Consumer was paused on client, resuming...");
            await consumer.resume();
            console.log("Consumer resumed on client");
          }

          if (consumeResponse.kind === "video") {
            videoConsumerRef.current = consumer;
            setVideoTrack(consumer.track);
            console.log("Video track set");
          } else if (consumeResponse.kind === "audio") {
            audioConsumerRef.current = consumer;
            setAudioTrack(consumer.track);
            console.log("Audio track set");
          }

          consumer.on("transportclose", () => {
            console.log(consumeResponse.kind + " consumer transport closed");
          });

          consumer.on("trackended", () => {
            console.log(consumeResponse.kind + " track ended");
          });
        } catch (err) {
          console.warn("Failed to consume producer " + producerId + ":", err);
        }
      }

      setIsConnected(true);
      console.log("WebRTC consumer connection established!");
    } catch (err: any) {
      let message = "Failed to connect";
      if (err instanceof Error) {
        if (err.message.includes("No producers available")) {
          message = "Stream is not available yet. The streamer may not be broadcasting.";
        } else if (err.message.includes("404") || err.message.includes("not found")) {
          message = "Stream not found. It may have ended.";
        } else if (err.message.includes("Request failed")) {
          message = "Failed to connect to stream. Please try again.";
        } else {
          message = err.message;
        }
      }
      setError(message);
      console.error("WebRTC connection error:", err);
    } finally {
      isConnectingRef.current = false;
    }
  }, [streamId, enabled, isConnected]);

  const disconnect = useCallback(() => {
    console.log("Disconnecting WebRTC...");
    isConnectingRef.current = false;

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

    deviceRef.current = null;
    setVideoTrack(null);
    setAudioTrack(null);
    setIsConnected(false);
    setError(null);
    console.log("WebRTC disconnected");
  }, []);

  useEffect(() => {
    if (enabled && streamId) {
      const timer = setTimeout(() => {
        connect();
      }, 1000);

      return () => {
        clearTimeout(timer);
        disconnect();
      };
    }

    return () => {
      disconnect();
    };
  }, [enabled, streamId]);

  return {
    isConnected,
    error,
    videoTrack,
    audioTrack,
    reconnect: connect,
  };
}
