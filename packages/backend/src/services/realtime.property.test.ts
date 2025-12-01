// Property-Based Tests for Real-Time Communication Service
// Feature: air-fun-mvp

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer, createServer } from "http";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";
import { realtimeService } from "./realtime.service.js";
import { ChatMessage } from "../types/realtime.types.js";

describe("Real-Time Communication Service - Property Tests", () => {
  let httpServer: HTTPServer;
  let serverPort: number;
  let clients: ClientSocket[] = [];

  beforeEach(async () => {
    // Create HTTP server and initialize realtime service
    httpServer = createServer();
    realtimeService.initialize(httpServer);

    // Start server on random port
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const address = httpServer.address();
        if (address && typeof address === "object") {
          serverPort = address.port;
        }
        resolve();
      });
    });
  });

  afterEach(async () => {
    // Disconnect all clients
    for (const client of clients) {
      if (client.connected) {
        client.disconnect();
      }
    }
    clients = [];

    // Close server
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  /**
   * Property 9: Chat Message Ordering
   * Feature: air-fun-mvp, Property 9: Chat Message Ordering
   * Validates: Requirements 13.1, 13.2
   *
   * For any stream, chat messages must be delivered to all viewers
   * in the same order they were sent (FIFO).
   */
  it("Property 9: Chat messages are delivered in FIFO order to all viewers", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 3, maxLength: 10 }),
        fc.integer({ min: 2, max: 5 }), // Number of viewers
        async (messages, viewerCount) => {
          const streamId = `stream_${Date.now()}_${Math.random()}`;
          const senderId = `sender_${Date.now()}`;
          const senderName = "TestSender";

          // Create sender client
          const sender = ioClient(`http://localhost:${serverPort}`, {
            transports: ["websocket"],
          });
          clients.push(sender);

          // Create viewer clients
          const viewers: ClientSocket[] = [];
          for (let i = 0; i < viewerCount; i++) {
            const viewer = ioClient(`http://localhost:${serverPort}`, {
              transports: ["websocket"],
            });
            clients.push(viewer);
            viewers.push(viewer);
          }

          // Wait for all connections
          await Promise.all([
            new Promise<void>((resolve) => sender.on("connect", () => resolve())),
            ...viewers.map((v) => new Promise<void>((resolve) => v.on("connect", () => resolve()))),
          ]);

          // Authenticate all clients
          sender.emit("authenticate", { userId: senderId, username: senderName });
          await new Promise<void>((resolve) => sender.on("authenticated", () => resolve()));

          for (let i = 0; i < viewers.length; i++) {
            const viewerId = `viewer_${i}`;
            const viewerName = `Viewer${i}`;
            viewers[i].emit("authenticate", { userId: viewerId, username: viewerName });
            await new Promise<void>((resolve) => viewers[i].on("authenticated", () => resolve()));
          }

          // Join stream room
          sender.emit("join_stream", { streamId });
          await new Promise<void>((resolve) => sender.on("joined_stream", () => resolve()));

          for (const viewer of viewers) {
            viewer.emit("join_stream", { streamId });
            await new Promise<void>((resolve) => viewer.on("joined_stream", () => resolve()));
          }

          // Track received messages for each viewer
          const receivedMessages: Map<number, string[]> = new Map();
          viewers.forEach((_, index) => receivedMessages.set(index, []));

          // Set up message listeners for all viewers
          viewers.forEach((viewer, index) => {
            viewer.on("chat_message", (msg: ChatMessage) => {
              receivedMessages.get(index)!.push(msg.message);
            });
          });

          // Send messages in sequence
          for (const message of messages) {
            sender.emit("chat_message", {
              streamId,
              userId: senderId,
              username: senderName,
              message,
            });
            // Small delay to ensure ordering
            await new Promise((resolve) => setTimeout(resolve, 10));
          }

          // Wait for all messages to be received
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Verify all viewers received messages in the same order
          const firstViewerMessages = receivedMessages.get(0)!;

          // Check that all viewers received the same messages in the same order
          for (let i = 1; i < viewerCount; i++) {
            const viewerMessages = receivedMessages.get(i)!;
            expect(viewerMessages).toEqual(firstViewerMessages);
          }

          // Verify messages are in the order they were sent
          expect(firstViewerMessages).toEqual(messages);
        }
      ),
      { numRuns: 100, timeout: 30000 }
    );
  }, 60000);
});
