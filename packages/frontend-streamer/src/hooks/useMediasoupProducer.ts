// Mediasoup Producer hook for publishing video/audio to server

import { useState, useRef, useCallback } from "react";
import * as mediasoupClient from "mediasoup-client";
import { api } from "../utils/api";
import { API_ENDPOINTS } from "../config/api";

interface RtpCapabilitiesResponse {
  rtpCapabilities: mediasoupClient.types.RtpCapabilities;
}

interface TransportOptions {
  id: string;
  iceParameters: mediasoupClient.types.IceParameters;
  iceCandidates: mediasoupClient.types.IceCandidate[];
  dtlsParameters: mediasoupClient.types.DtlsParameters;
}

interface ProduceResponse {
  producerId: string;
}

export function useMediasoupProducer() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoProducerId, setVideoProducerId] = useState<string | null>(null);
  const [audioProducerId, setAudioProducerId] = useState<string | null>(null);

  const deviceRef = useRef<mediasoupClient.types.Device | null>(null);
  const transportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const videoProducerRef = useRef<mediasoupClient.types.Producer | null>(null);
  const audioProducerRef = useRef<mediasoupClient.types.Producer | null>(null);

  /**
   * Publish a media stream to the server
   * @param streamId - The stream ID from the backend
   * @param localStream - The MediaStream from getUserMedia
   */
  const publish = useCallback(async (streamId: string, localStream: MediaStream) => {
    try {
      setError(null);
      console.log("Starting WebRTC publishing for stream:", streamId);

      // Step 1: Get RTP capabilities from server
      console.log("Getting RTP capabilities...");
      const capabilitiesResponse = await api.get<RtpCapabilitiesResponse>(
        API_ENDPOINTS.STREAMS_RTP_CAPABILITIES(streamId)
      );

      const rtpCapabilities = capabilitiesResponse.rtpCapabilities;
      console.log("Got RTP capabilities");

      // Step 2: Create mediasoup device and load capabilities
      const device = new mediasoupClient.Device();
      await device.load({ routerRtpCapabilities: rtpCapabilities });
      deviceRef.current = device;
      console.log("Device loaded with capabilities");

      // Step 3: Create producer transport
      console.log("Creating producer transport...");
      const transportOptions = await api.post<TransportOptions>(
        API_ENDPOINTS.STREAMS_TRANSPORT_PRODUCER(streamId),
        {}
      );
      console.log("Got transport options:", transportOptions.id);

      // Step 4: Create send transport
      const transport = device.createSendTransport(transportOptions);
      transportRef.current = transport;

      // Handle transport connect event
      transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        try {
          console.log("Transport connecting...");
          await api.post(API_ENDPOINTS.STREAMS_TRANSPORT_CONNECT(transport.id), {
            dtlsParameters,
          });
          console.log("Transport connected");
          callback();
        } catch (err) {
          console.error("Transport connect error:", err);
          errback(err as Error);
        }
      });

      // Handle transport produce event
      transport.on("produce", async ({ kind, rtpParameters }, callback, errback) => {
        try {
          console.log(`Producing ${kind}...`);
          console.log(
            `RTP Parameters codecs:`,
            rtpParameters.codecs?.map((c) => c.mimeType)
          );

          // Ensure rtpParameters is properly serializable
          const serializedRtpParams = JSON.parse(JSON.stringify(rtpParameters));

          const response = await api.post<ProduceResponse>(
            API_ENDPOINTS.STREAMS_TRANSPORT_PRODUCE(transport.id),
            { kind, rtpParameters: serializedRtpParams }
          );
          console.log(`Producer created for ${kind}:`, response.producerId);
          callback({ id: response.producerId });
        } catch (err) {
          console.error(`Produce ${kind} error:`, err);
          errback(err as Error);
        }
      });

      // Step 5: Produce video track
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        console.log("Producing video track...");
        // Note: Removed simulcast encodings as they were causing issues with consumer receiving data
        const videoProducer = await transport.produce({
          track: videoTrack,
        });
        videoProducerRef.current = videoProducer;
        setVideoProducerId(videoProducer.id);
        console.log("Video producer created:", videoProducer.id);

        videoProducer.on("transportclose", () => {
          console.log("Video producer transport closed");
          videoProducerRef.current = null;
          setVideoProducerId(null);
        });

        videoProducer.on("trackended", () => {
          console.log("Video track ended");
        });
      }

      // Step 6: Produce audio track
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        console.log("Producing audio track...");
        const audioProducer = await transport.produce({
          track: audioTrack,
        });
        audioProducerRef.current = audioProducer;
        setAudioProducerId(audioProducer.id);
        console.log("Audio producer created:", audioProducer.id);

        audioProducer.on("transportclose", () => {
          console.log("Audio producer transport closed");
          audioProducerRef.current = null;
          setAudioProducerId(null);
        });

        audioProducer.on("trackended", () => {
          console.log("Audio track ended");
        });
      }

      setIsPublishing(true);
      console.log("WebRTC publishing started successfully!");

      return {
        videoProducerId: videoProducerRef.current?.id,
        audioProducerId: audioProducerRef.current?.id,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to publish stream";
      console.error("WebRTC publish error:", err);
      setError(message);
      throw err;
    }
  }, []);

  /**
   * Stop publishing and cleanup
   */
  const stopPublishing = useCallback(() => {
    console.log("Stopping WebRTC publishing...");

    if (videoProducerRef.current) {
      videoProducerRef.current.close();
      videoProducerRef.current = null;
      setVideoProducerId(null);
    }

    if (audioProducerRef.current) {
      audioProducerRef.current.close();
      audioProducerRef.current = null;
      setAudioProducerId(null);
    }

    if (transportRef.current) {
      transportRef.current.close();
      transportRef.current = null;
    }

    deviceRef.current = null;
    setIsPublishing(false);
    setError(null);

    console.log("WebRTC publishing stopped");
  }, []);

  return {
    isPublishing,
    error,
    videoProducerId,
    audioProducerId,
    publish,
    stopPublishing,
  };
}
