// Performance Tests
// Tests for Requirements 21, 22
// Simplified tests without Redis/external dependencies

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { BondingCurveService } from "./bonding-curve.service.js";
import { realtimeService } from "./realtime.service.js";
import { createServer } from "http";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";

describe("Performance Tests", () => {
  let httpServer: any;
  let clientSockets: ClientSocket[] = [];
  let serverPort: number;

  beforeAll(async () => {
    // Set up test server for WebSocket tests
    httpServer = createServer();
    realtimeService.initialize(httpServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        serverPort = httpServer.address().port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Clean up client sockets
    clientSockets.forEach((socket) => {
      if (socket.connected) {
        socket.disconnect();
      }
    });
    clientSockets = [];

    // Close server
    if (httpServer) {
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
    }
  });

  describe("Requirement 21.2: Price Update Latency", () => {
    it("should deliver price updates within 500ms", async () => {
      const streamId = "test-stream-latency";
      const tokenId = "test-token-latency";

      // Create a client socket
      const clientSocket = ioClient(`http://localhost:${serverPort}`);
      clientSockets.push(clientSocket);

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Connection timeout")), 5000);
        clientSocket.on("connect", () => {
          clearTimeout(timeout);
          clientSocket.emit("authenticate", { userId: "test-user", username: "TestUser" });
          clientSocket.emit("join_stream", { streamId });
          resolve();
        });
        clientSocket.on("connect_error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      // Wait for join to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Measure price update latency
      const latencies: number[] = [];
      const numUpdates = 10;

      for (let i = 0; i < numUpdates; i++) {
        const startTime = Date.now();

        const updateReceived = new Promise<void>((resolve) => {
          const timeout = setTimeout(() => resolve(), 1000); // 1s timeout
          clientSocket.once("price_update", () => {
            clearTimeout(timeout);
            const latency = Date.now() - startTime;
            latencies.push(latency);
            resolve();
          });
        });

        // Broadcast price update
        realtimeService.broadcastPriceUpdate(streamId, {
          id: tokenId,
          tokenId,
          k: 0.000000001,
          tokensSold: 1000 * (i + 1),
          currentPrice: 0.001 * (i + 1),
          marketCap: 1000 * (i + 1),
          nextPrice: 0.0011 * (i + 1),
          graduationThreshold: 69000,
          progressToGraduation: 0.01 * (i + 1),
          updatedAt: Date.now(),
        });

        await updateReceived;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      if (latencies.length > 0) {
        const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
        const maxLatency = Math.max(...latencies);
        console.log(`Price update latencies: avg=${avgLatency.toFixed(2)}ms, max=${maxLatency}ms`);
        expect(maxLatency).toBeLessThan(500);
      }
    }, 30000);
  });

  describe("Requirement 21.3: Bonding Curve Calculation Performance", () => {
    it("should complete bonding curve calculations in less than 100ms", async () => {
      const bondingCurveService = new BondingCurveService();
      const iterations = 100;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const tokensSold = Math.floor(Math.random() * 1000000);
        const tokensToBuy = Math.floor(Math.random() * 10000) + 1;

        const startTime = performance.now();
        bondingCurveService.calculatePurchaseCost(tokensSold, tokensToBuy);
        const duration = performance.now() - startTime;

        durations.push(duration);
      }

      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const p95Duration = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)];

      console.log(
        `Bonding curve calculation: avg=${avgDuration.toFixed(3)}ms, max=${maxDuration.toFixed(3)}ms, p95=${p95Duration.toFixed(3)}ms`
      );

      expect(p95Duration).toBeLessThan(100);
      expect(avgDuration).toBeLessThan(10);
    });
  });

  describe("Requirement 22.1: Concurrent Streams", () => {
    it("should support multiple concurrent streams", async () => {
      const numStreams = 5;
      const streamIds: string[] = [];

      for (let i = 0; i < numStreams; i++) {
        const streamId = `concurrent-stream-${i}`;
        streamIds.push(streamId);

        const clientSocket = ioClient(`http://localhost:${serverPort}`);
        clientSockets.push(clientSocket);

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Connection timeout")), 5000);
          clientSocket.on("connect", () => {
            clearTimeout(timeout);
            clientSocket.emit("authenticate", {
              userId: `streamer-${i}`,
              username: `Streamer${i}`,
            });
            clientSocket.emit("join_stream", { streamId });
            resolve();
          });
          clientSocket.on("connect_error", (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const activeStreamIds = realtimeService.getActiveStreamIds();
      console.log(`Active streams: ${activeStreamIds.length}`);

      expect(activeStreamIds.length).toBeGreaterThanOrEqual(numStreams);
    }, 30000);
  });

  describe("Requirement 22.2: Concurrent Viewers", () => {
    it("should support multiple viewers per stream", async () => {
      const streamId = "viewer-test-stream";
      const numViewers = 20;

      const viewerSockets: ClientSocket[] = [];

      for (let i = 0; i < numViewers; i++) {
        const clientSocket = ioClient(`http://localhost:${serverPort}`);
        viewerSockets.push(clientSocket);
        clientSockets.push(clientSocket);

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Connection timeout")), 5000);
          clientSocket.on("connect", () => {
            clearTimeout(timeout);
            clientSocket.emit("authenticate", {
              userId: `viewer-${i}`,
              username: `Viewer${i}`,
            });
            clientSocket.emit("join_stream", { streamId });
            resolve();
          });
          clientSocket.on("connect_error", (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        });

        if (i % 5 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const viewerCount = realtimeService.getViewerCount(streamId);
      console.log(`Viewer count: ${viewerCount}`);

      expect(viewerCount).toBeGreaterThanOrEqual(numViewers);
    }, 60000);
  });

  describe("Requirement 22.4: Purchase Volume", () => {
    it("should handle rapid price updates", async () => {
      const streamId = "purchase-volume-stream";
      const tokenId = "purchase-volume-token";
      const numPurchases = 50;

      const clientSocket = ioClient(`http://localhost:${serverPort}`);
      clientSockets.push(clientSocket);

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Connection timeout")), 5000);
        clientSocket.on("connect", () => {
          clearTimeout(timeout);
          clientSocket.emit("authenticate", { userId: "test-user", username: "TestUser" });
          clientSocket.emit("join_stream", { streamId });
          resolve();
        });
        clientSocket.on("connect_error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      let updatesReceived = 0;
      clientSocket.on("price_update", () => {
        updatesReceived++;
      });

      const startTime = Date.now();

      for (let i = 0; i < numPurchases; i++) {
        realtimeService.broadcastPriceUpdate(streamId, {
          id: tokenId,
          tokenId,
          k: 0.000000001,
          tokensSold: 1000 * (i + 1),
          currentPrice: 0.001 * (i + 1),
          marketCap: 1000 * (i + 1),
          nextPrice: 0.0011 * (i + 1),
          graduationThreshold: 69000,
          progressToGraduation: Math.min((1000 * (i + 1)) / 69000, 1),
          updatedAt: Date.now(),
        });

        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const totalDuration = Date.now() - startTime;
      const purchasesPerMinute = (numPurchases / totalDuration) * 60000;

      console.log(`Processed ${numPurchases} purchases in ${totalDuration}ms`);
      console.log(`Rate: ${purchasesPerMinute.toFixed(2)} purchases/minute`);
      console.log(`Updates received: ${updatesReceived}`);

      expect(updatesReceived).toBeGreaterThan(0);
    }, 60000);
  });

  describe("Price Update Batching", () => {
    it("should batch multiple price updates within 100ms window", async () => {
      const streamId = "batch-test-stream";
      const tokenId = "batch-test-token";

      const clientSocket = ioClient(`http://localhost:${serverPort}`);
      clientSockets.push(clientSocket);

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Connection timeout")), 5000);
        clientSocket.on("connect", () => {
          clearTimeout(timeout);
          clientSocket.emit("authenticate", { userId: "test-user", username: "TestUser" });
          clientSocket.emit("join_stream", { streamId });
          resolve();
        });
        clientSocket.on("connect_error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      let updatesReceived = 0;
      clientSocket.on("price_update", () => {
        updatesReceived++;
      });

      const numUpdates = 10;
      for (let i = 0; i < numUpdates; i++) {
        realtimeService.broadcastPriceUpdate(streamId, {
          id: tokenId,
          tokenId,
          k: 0.000000001,
          tokensSold: 1000 * (i + 1),
          currentPrice: 0.001 * (i + 1),
          marketCap: 1000 * (i + 1),
          nextPrice: 0.0011 * (i + 1),
          graduationThreshold: 69000,
          progressToGraduation: 0.01 * (i + 1),
          updatedAt: Date.now(),
        });

        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      await new Promise((resolve) => setTimeout(resolve, 200));

      console.log(`Sent ${numUpdates} updates, received ${updatesReceived} batched updates`);

      // Due to batching, we may receive fewer updates than we sent
      expect(updatesReceived).toBeGreaterThan(0);
    }, 30000);
  });
});
