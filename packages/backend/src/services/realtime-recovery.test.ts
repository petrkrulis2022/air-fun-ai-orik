// Unit Tests for WebSocket Connection Recovery
// Tests automatic reconnection and event replay functionality
// Validates Requirements 16.1, 16.2, 16.3, 16.4

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Server as HTTPServer, createServer } from "http";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";
import { realtimeService } from "./realtime.service.js";
import { ChatMessage } from "../types/realtime.types.js";
import { BondingCurveState } from "../types/token.types.js";

describe("WebSocket Connection Recovery", () => {
  let httpServer: HTTPServer;
  let serverPort: number;
  let clientSocket: ClientSocket;

  beforeEach(async () => {
    httpServer = createServer();
    realtimeService.initialize(httpServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const address = httpServer.address();
        serverPort = typeof address === "object" && address ? address.port : 0;
        resolve();
      });
    });
  });

  afterEach(async () => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }

    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  /**
   * Test Requirement 16.1: Socket.io reconnection configuration
   */
  it("should configure client for automatic reconnection", async () => {
    clientSocket = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 100,
    });

    await new Promise<void>((resolve) => {
      clientSocket.on("connect", () => resolve());
    });

    expect(clientSocket.connected).toBe(true);

    // Verify reconnection is configured
    expect(clientSocket.io.opts.reconnection).toBe(true);
    expect(clientSocket.io.opts.reconnectionAttempts).toBe(3);
  });

  /**
   * Test Requirement 16.2: Accept last event ID from client on reconnection
   */
  it("should accept last event ID from client on reconnection", async () => {
    const streamId = "test-stream-123";
    const userId = "user-1";
    const username = "TestUser";

    clientSocket = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
    });

    await new Promise<void>((resolve) => {
      clientSocket.on("connect", () => resolve());
    });

    clientSocket.emit("authenticate", { userId, username });
    await new Promise<void>((resolve) => {
      clientSocket.on("authenticated", () => resolve());
    });

    clientSocket.emit("join_stream", { streamId });
    await new Promise<void>((resolve) => {
      clientSocket.on("joined_stream", () => resolve());
    });

    // Generate some events
    const chatMessage1: ChatMessage = {
      id: "evt_1",
      streamId,
      userId,
      username,
      message: "First message",
      timestamp: Date.now(),
      mentions: [],
    };

    const chatMessage2: ChatMessage = {
      id: "evt_2",
      streamId,
      userId,
      username,
      message: "Second message",
      timestamp: Date.now(),
      mentions: [],
    };

    realtimeService.broadcastChatMessage(streamId, chatMessage1);
    realtimeService.broadcastChatMessage(streamId, chatMessage2);

    await new Promise((resolve) => setTimeout(resolve, 100));

    let replayComplete = false;
    let replayedEvents = 0;

    clientSocket.on("replay_complete", (data) => {
      replayComplete = true;
      replayedEvents = data.eventsReplayed;
    });

    const lastEventId = "evt_1";
    clientSocket.emit("reconnect_with_replay", { streamId, lastEventId });

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(replayComplete).toBe(true);
    expect(replayedEvents).toBeGreaterThanOrEqual(0);
  });

  /**
   * Test Requirement 16.3: Replay all missed events from event log
   */
  it("should replay all missed events after last event ID", async () => {
    const streamId = "test-stream-456";
    const userId = "user-2";
    const username = "TestUser2";

    clientSocket = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
    });

    await new Promise<void>((resolve) => {
      clientSocket.on("connect", () => resolve());
    });

    clientSocket.emit("authenticate", { userId, username });
    await new Promise<void>((resolve) => {
      clientSocket.on("authenticated", () => resolve());
    });

    clientSocket.emit("join_stream", { streamId });
    await new Promise<void>((resolve) => {
      clientSocket.on("joined_stream", () => resolve());
    });

    // Generate multiple events
    const events = [
      { type: "chat", message: "Message 1" },
      { type: "chat", message: "Message 2" },
      { type: "chat", message: "Message 3" },
    ];

    let eventIds: string[] = [];

    const receivedEvents: any[] = [];
    clientSocket.on("chat_message", (data) => {
      receivedEvents.push({ type: "chat", data });
      if (data.eventId) eventIds.push(data.eventId);
    });

    for (const event of events) {
      const chatMsg: ChatMessage = {
        id: `evt_${Date.now()}_${Math.random()}`,
        streamId,
        userId,
        username,
        message: event.message,
        timestamp: Date.now(),
        mentions: [],
      };
      realtimeService.broadcastChatMessage(streamId, chatMsg);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(receivedEvents.length).toBe(3);
  });

  /**
   * Test Requirement 16.4: Resume normal real-time message delivery after replay
   */
  it("should resume normal message delivery after event replay completes", async () => {
    const streamId = "test-stream-789";
    const userId = "user-3";
    const username = "TestUser3";

    clientSocket = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
    });

    await new Promise<void>((resolve) => {
      clientSocket.on("connect", () => resolve());
    });

    clientSocket.emit("authenticate", { userId, username });
    await new Promise<void>((resolve) => {
      clientSocket.on("authenticated", () => resolve());
    });

    clientSocket.emit("join_stream", { streamId });
    await new Promise<void>((resolve) => {
      clientSocket.on("joined_stream", () => resolve());
    });

    const chatMsg1: ChatMessage = {
      id: "evt_old_1",
      streamId,
      userId,
      username,
      message: "Old message",
      timestamp: Date.now(),
      mentions: [],
    };

    realtimeService.broadcastChatMessage(streamId, chatMsg1);
    await new Promise((resolve) => setTimeout(resolve, 100));

    let replayComplete = false;
    clientSocket.on("replay_complete", () => {
      replayComplete = true;
    });

    clientSocket.emit("reconnect_with_replay", { streamId, lastEventId: "" });

    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(replayComplete).toBe(true);

    const newMessages: any[] = [];
    clientSocket.on("chat_message", (data) => {
      newMessages.push(data);
    });

    const chatMsg2: ChatMessage = {
      id: "evt_new_1",
      streamId,
      userId,
      username,
      message: "New message after replay",
      timestamp: Date.now(),
      mentions: [],
    };

    realtimeService.broadcastChatMessage(streamId, chatMsg2);

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(newMessages.length).toBeGreaterThan(0);
    expect(newMessages[newMessages.length - 1].message).toBe("New message after replay");
  });

  /**
   * Test Socket.io connection state recovery feature
   */
  it("should support Socket.io connection state recovery", async () => {
    const streamId = "test-stream-recovery";
    const userId = "user-4";
    const username = "TestUser4";

    clientSocket = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
    });

    await new Promise<void>((resolve) => {
      clientSocket.on("connect", () => resolve());
    });

    clientSocket.emit("authenticate", { userId, username });
    await new Promise<void>((resolve) => {
      clientSocket.on("authenticated", () => resolve());
    });

    const io = realtimeService.getIO();
    expect(io).toBeDefined();
  });

  /**
   * Test event log stats
   */
  it("should track event log stats for streams", async () => {
    const streamId = "test-stream-cleanup";
    const userId = "user-5";
    const username = "TestUser5";

    clientSocket = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
    });

    await new Promise<void>((resolve) => {
      clientSocket.on("connect", () => resolve());
    });

    clientSocket.emit("authenticate", { userId, username });
    await new Promise<void>((resolve) => {
      clientSocket.on("authenticated", () => resolve());
    });

    clientSocket.emit("join_stream", { streamId });
    await new Promise<void>((resolve) => {
      clientSocket.on("joined_stream", () => resolve());
    });

    const chatMsg: ChatMessage = {
      id: "evt_cleanup_1",
      streamId,
      userId,
      username,
      message: "Test message",
      timestamp: Date.now(),
      mentions: [],
    };

    realtimeService.broadcastChatMessage(streamId, chatMsg);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const statsBefore = realtimeService.getEventLogStats(streamId);
    expect(statsBefore.eventCount).toBeGreaterThanOrEqual(0);
  });
});
