// Streaming Routes
import express, { Request, Response } from "express";
import streamingService from "../services/streaming.service.js";
import { mediaServerService } from "../services/media-server.service.js";

const router = express.Router();

/**
 * POST /streams/start
 * Start a new livestream
 */
router.post("/start", async (req: Request, res: Response) => {
  try {
    const { streamerId, config } = req.body;

    if (!streamerId || !config) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await streamingService.startStream({
      streamerId,
      config,
    });

    res.json(result);
  } catch (error: any) {
    console.error("Error starting stream:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /streams/:id/end
 * End a livestream
 */
router.post("/:id/end", async (req: Request, res: Response) => {
  try {
    const { id: streamId } = req.params;

    const result = await streamingService.endStream({ streamId });

    res.json(result);
  } catch (error: any) {
    console.error("Error ending stream:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /streams/:id/status
 * Get stream status
 */
router.get("/:id/status", async (req: Request, res: Response) => {
  try {
    const { id: streamId } = req.params;

    const stream = await streamingService.getStreamStatus(streamId);

    if (!stream) {
      return res.status(404).json({ error: "Stream not found" });
    }

    res.json(stream);
  } catch (error: any) {
    console.error("Error getting stream status:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /streams/active
 * List active streams with filters
 */
router.get("/active", async (req: Request, res: Response) => {
  try {
    const filters = {
      category: req.query.category as string | undefined,
      minViewers: req.query.minViewers ? parseInt(req.query.minViewers as string) : undefined,
      minMarketCap: req.query.minMarketCap
        ? parseFloat(req.query.minMarketCap as string)
        : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const streams = await streamingService.listActiveStreams(filters);

    res.json(streams);
  } catch (error: any) {
    console.error("Error listing active streams:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /streams/search
 * Search streams by query
 */
router.get("/search", async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;

    if (!query) {
      return res.status(400).json({ error: "Missing search query" });
    }

    const streams = await streamingService.searchStreams(query);

    res.json(streams);
  } catch (error: any) {
    console.error("Error searching streams:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /streams/hot
 * Get hot streams ordered by viewers and market cap
 */
router.get("/hot", async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const streams = await streamingService.getHotStreams(limit);

    res.json(streams);
  } catch (error: any) {
    console.error("Error getting hot streams:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /streams/:id/transport/producer
 * Create producer transport for streamer
 */
router.post("/:id/transport/producer", async (req: Request, res: Response) => {
  try {
    const { id: streamId } = req.params;

    const transportOptions = await streamingService.createProducerTransport(streamId);

    res.json(transportOptions);
  } catch (error: any) {
    console.error("Error creating producer transport:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /streams/:id/transport/consumer
 * Create consumer transport for viewer
 */
router.post("/:id/transport/consumer", async (req: Request, res: Response) => {
  try {
    const { id: streamId } = req.params;
    const { viewerId } = req.body;

    if (!viewerId) {
      return res.status(400).json({ error: "Missing viewerId" });
    }

    const transportOptions = await streamingService.createConsumerTransport(streamId, viewerId);

    res.json(transportOptions);
  } catch (error: any) {
    console.error("Error creating consumer transport:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /streams/transport/:transportId/connect
 * Connect transport with DTLS parameters
 */
router.post("/transport/:transportId/connect", async (req: Request, res: Response) => {
  try {
    const { transportId } = req.params;
    const { dtlsParameters } = req.body;

    if (!dtlsParameters) {
      return res.status(400).json({ error: "Missing dtlsParameters" });
    }

    await streamingService.connectTransport(transportId, dtlsParameters);

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error connecting transport:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /streams/transport/:transportId/produce
 * Produce media (audio/video)
 */
router.post("/transport/:transportId/produce", async (req: Request, res: Response) => {
  try {
    const { transportId } = req.params;
    const { kind, rtpParameters } = req.body;

    if (!kind || !rtpParameters) {
      return res.status(400).json({ error: "Missing kind or rtpParameters" });
    }

    const producerId = await streamingService.produceMedia(transportId, kind, rtpParameters);

    res.json({ producerId });
  } catch (error: any) {
    console.error("Error producing media:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /streams/:id/transport/:transportId/consume
 * Consume media for viewer
 */
router.post("/:id/transport/:transportId/consume", async (req: Request, res: Response) => {
  try {
    const { id: streamId, transportId } = req.params;
    const { producerId, rtpCapabilities } = req.body;

    if (!producerId || !rtpCapabilities) {
      return res.status(400).json({ error: "Missing producerId or rtpCapabilities" });
    }

    const consumerOptions = await streamingService.consumeMedia(
      streamId,
      transportId,
      producerId,
      rtpCapabilities
    );

    res.json(consumerOptions);
  } catch (error: any) {
    console.error("Error consuming media:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /streams/:id/rtp-capabilities
 * Get router RTP capabilities
 */
router.get("/:id/rtp-capabilities", async (req: Request, res: Response) => {
  try {
    const { id: streamId } = req.params;

    const rtpCapabilities = streamingService.getRouterRtpCapabilities(streamId);

    if (!rtpCapabilities) {
      return res.status(404).json({ error: "Router not found for stream" });
    }

    res.json({ rtpCapabilities });
  } catch (error: any) {
    console.error("Error getting RTP capabilities:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
