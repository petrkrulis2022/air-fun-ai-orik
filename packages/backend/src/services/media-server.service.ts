// WebRTC Media Server Service using Mediasoup
import * as mediasoup from "mediasoup";
import { types as mediasoupTypes } from "mediasoup";

export class MediaServerService {
  private workers: mediasoupTypes.Worker[] = [];
  private routers: Map<string, mediasoupTypes.Router> = new Map();
  private transports: Map<string, mediasoupTypes.WebRtcTransport> = new Map();
  private producers: Map<string, mediasoupTypes.Producer> = new Map();
  private consumers: Map<string, mediasoupTypes.Consumer> = new Map();
  private nextWorkerIndex = 0;

  async initialize(numWorkers: number = 2): Promise<void> {
    console.log(`Initializing ${numWorkers} mediasoup workers...`);

    for (let i = 0; i < numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        logLevel: "warn",
        rtcMinPort: 10000 + i * 1000,
        rtcMaxPort: 10000 + (i + 1) * 1000 - 1,
      });

      worker.on("died", () => {
        console.error(`Mediasoup worker ${i} died, exiting...`);
        process.exit(1);
      });

      this.workers.push(worker);
      console.log(`Worker ${i} created with PID ${worker.pid}`);
    }

    console.log("Media server initialized successfully");
  }

  async createRouter(streamId: string): Promise<mediasoupTypes.Router> {
    // Use round-robin to select worker
    const worker = this.workers[this.nextWorkerIndex];
    this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;

    const router = await worker.createRouter({
      mediaCodecs: [
        {
          kind: "audio",
          mimeType: "audio/opus",
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: "video",
          mimeType: "video/VP8",
          clockRate: 90000,
          parameters: {
            "x-google-start-bitrate": 1000,
          },
        },
        {
          kind: "video",
          mimeType: "video/H264",
          clockRate: 90000,
          parameters: {
            "packetization-mode": 1,
            "profile-level-id": "42e01f",
            "level-asymmetry-allowed": 1,
          },
        },
      ],
    });

    this.routers.set(streamId, router);
    console.log(`Router created for stream ${streamId}`);
    return router;
  }

  async createWebRtcTransport(
    streamId: string,
    isProducer: boolean
  ): Promise<{
    transport: mediasoupTypes.WebRtcTransport;
    params: {
      id: string;
      iceParameters: mediasoupTypes.IceParameters;
      iceCandidates: mediasoupTypes.IceCandidate[];
      dtlsParameters: mediasoupTypes.DtlsParameters;
    };
  }> {
    const router = this.routers.get(streamId);
    if (!router) {
      throw new Error(`Router not found for stream ${streamId}`);
    }

    const transport = await router.createWebRtcTransport({
      listenIps: [
        {
          ip: process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0",
          announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP,
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });

    this.transports.set(transport.id, transport);

    return {
      transport,
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    };
  }

  async connectTransport(
    transportId: string,
    dtlsParameters: mediasoupTypes.DtlsParameters
  ): Promise<void> {
    const transport = this.transports.get(transportId);
    if (!transport) {
      throw new Error(`Transport ${transportId} not found`);
    }

    await transport.connect({ dtlsParameters });
  }

  async produce(
    transportId: string,
    kind: mediasoupTypes.MediaKind,
    rtpParameters: mediasoupTypes.RtpParameters
  ): Promise<string> {
    const transport = this.transports.get(transportId);
    if (!transport) {
      throw new Error(`Transport ${transportId} not found`);
    }

    const producer = await (transport as mediasoupTypes.WebRtcTransport).produce({
      kind,
      rtpParameters,
    });

    this.producers.set(producer.id, producer);
    console.log(`Producer created: ${producer.id} (${kind})`);

    return producer.id;
  }

  async consume(
    streamId: string,
    transportId: string,
    producerId: string,
    rtpCapabilities: mediasoupTypes.RtpCapabilities
  ): Promise<{
    id: string;
    producerId: string;
    kind: mediasoupTypes.MediaKind;
    rtpParameters: mediasoupTypes.RtpParameters;
  }> {
    const router = this.routers.get(streamId);
    if (!router) {
      throw new Error(`Router not found for stream ${streamId}`);
    }

    const transport = this.transports.get(transportId);
    if (!transport) {
      throw new Error(`Transport ${transportId} not found`);
    }

    if (
      !router.canConsume({
        producerId,
        rtpCapabilities,
      })
    ) {
      throw new Error("Cannot consume");
    }

    const consumer = await (transport as mediasoupTypes.WebRtcTransport).consume({
      producerId,
      rtpCapabilities,
      paused: false,
    });

    this.consumers.set(consumer.id, consumer);
    console.log(`Consumer created: ${consumer.id}`);

    return {
      id: consumer.id,
      producerId: consumer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    };
  }

  getRouterRtpCapabilities(streamId: string): mediasoupTypes.RtpCapabilities | undefined {
    const router = this.routers.get(streamId);
    return router?.rtpCapabilities;
  }

  async closeStream(streamId: string): Promise<void> {
    const router = this.routers.get(streamId);
    if (router) {
      router.close();
      this.routers.delete(streamId);
      console.log(`Router closed for stream ${streamId}`);
    }
  }

  async closeTransport(transportId: string): Promise<void> {
    const transport = this.transports.get(transportId);
    if (transport) {
      transport.close();
      this.transports.delete(transportId);
    }
  }

  async closeProducer(producerId: string): Promise<void> {
    const producer = this.producers.get(producerId);
    if (producer) {
      producer.close();
      this.producers.delete(producerId);
    }
  }

  async closeConsumer(consumerId: string): Promise<void> {
    const consumer = this.consumers.get(consumerId);
    if (consumer) {
      consumer.close();
      this.consumers.delete(consumerId);
    }
  }

  async resumeConsumer(consumerId: string): Promise<void> {
    const consumer = this.consumers.get(consumerId);
    if (!consumer) {
      throw new Error(`Consumer ${consumerId} not found`);
    }
    await consumer.resume();
    console.log(`Consumer resumed: ${consumerId}`);
  }

  getProducerIds(streamId: string): string[] {
    const router = this.routers.get(streamId);
    if (!router) {
      console.log(`getProducerIds: No router found for stream ${streamId}`);
      return [];
    }

    const producerIds = Array.from(this.producers.values())
      .filter((producer) => !producer.closed)
      .map((producer) => producer.id);

    console.log(
      `getProducerIds for stream ${streamId}: found ${producerIds.length} producers:`,
      producerIds
    );
    return producerIds;
  }
}

// Singleton instance
export const mediaServerService = new MediaServerService();
