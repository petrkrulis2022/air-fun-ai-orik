// Additional Unit Tests for Real-Time Communication Service
// Tests connection management, room management, chat messages, price updates, and event replay

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Server as HTTPServer, createServer } from "http";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";
import { realtimeService } from "./realtime.service.js";
import { BondingCurveState } from "../types/token.types.js";

describe("Real-Time Communication Service - Connection Management", () => {
  let httpServer: HTTPServer;
  let serverPort: number;
  let clients: ClientSocket[] = [];

  beforeEach(async () => {
    httpServer = createServer();
    realtimeService.initialize(httpServer);

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
    for (const client of clients) {
      if (client.connected) {
        client.disconnect();
      }
    }
    clients = [];

    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  it("should authenticate client with valid credentials", async () => {
    const client = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(client);

    await new Promise<void>((resolve) => {
      client.once("connect", () => resolve());
    });

    const authPromise = new Promise<any>((resolve) => {
      client.once("authenticated", (data) => resolve(data));
    });

    client.emit("authenticate", { userId: "user123", username: "TestUser" });

    const authResponse = await authPromise;
    expect(authResponse.success).toBe(true);
    expect(authResponse.userId).toBe("user123");
    expect(authResponse.username).toBe("TestUser");
  });

  it("should handle disconnection and cleanup", async () => {
    const streamId = `stream_${Date.now()}`;
    const client = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(client);

    await new Promise<void>((resolve) => {
      client.once("connect", () => resolve());
    });

    await new Promise<void>((resolve) => {
      client.once("authenticated", () => resolve());
      client.emit("authenticate", { userId: "user456", username: "DisconnectUser" });
    });

    await new Promise<void>((resolve) => {
      client.once("joined_stream", () => resolve());
      client.emit("join_stream", { streamId });
    });

    const initialCount = realtimeService.getViewerCount(streamId);
    expect(initialCount).toBe(1);

    client.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 100));

    const finalCount = realtimeService.getViewerCount(streamId);
    expect(finalCount).toBe(0);
  });
});

describe("Real-Time Communication Service - Room Management", () => {
  let httpServer: HTTPServer;
  let serverPort: number;
  let clients: ClientSocket[] = [];

  beforeEach(async () => {
    httpServer = createServer();
    realtimeService.initialize(httpServer);

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
    for (const client of clients) {
      if (client.connected) {
        client.disconnect();
      }
    }
    clients = [];

    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  it("should allow client to join stream room", async () => {
    const streamId = `stream_${Date.now()}`;
    const client = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(client);

    await new Promise<void>((resolve) => {
      client.once("connect", () => resolve());
    });

    await new Promise<void>((resolve) => {
      client.once("authenticated", () => resolve());
      client.emit("authenticate", { userId: "user789", username: "RoomUser" });
    });

    const joinPromise = new Promise<any>((resolve) => {
      client.once("joined_stream", (data) => resolve(data));
    });

    client.emit("join_stream", { streamId });

    const joinResponse = await joinPromise;
    expect(joinResponse.streamId).toBe(streamId);
    expect(joinResponse.viewerCount).toBe(1);
  });

  it("should broadcast viewer count updates when users join", async () => {
    const streamId = `stream_${Date.now()}`;

    const client1 = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(client1);

    await new Promise<void>((resolve) => {
      client1.once("connect", () => resolve());
    });

    await new Promise<void>((resolve) => {
      client1.once("authenticated", () => resolve());
      client1.emit("authenticate", { userId: "user1", username: "User1" });
    });

    await new Promise<void>((resolve) => {
      client1.once("joined_stream", () => resolve());
      client1.emit("join_stream", { streamId });
    });

    const updatePromise = new Promise<any>((resolve) => {
      client1.once("viewer_count_update", (data) => resolve(data));
    });

    const client2 = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(client2);

    await new Promise<void>((resolve) => {
      client2.once("connect", () => resolve());
    });

    await new Promise<void>((resolve) => {
      client2.once("authenticated", () => resolve());
      client2.emit("authenticate", { userId: "user2", username: "User2" });
    });

    client2.emit("join_stream", { streamId });

    const update = await updatePromise;
    expect(update.streamId).toBe(streamId);
    expect(update.viewerCount).toBe(2);
  });

  it("should allow client to leave stream room", async () => {
    const streamId = `stream_${Date.now()}`;
    const client = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(client);

    await new Promise<void>((resolve) => {
      client.once("connect", () => resolve());
    });

    await new Promise<void>((resolve) => {
      client.once("authenticated", () => resolve());
      client.emit("authenticate", { userId: "user101", username: "LeaveUser" });
    });

    await new Promise<void>((resolve) => {
      client.once("joined_stream", () => resolve());
      client.emit("join_stream", { streamId });
    });

    const leavePromise = new Promise<any>((resolve) => {
      client.once("left_stream", (data) => resolve(data));
    });

    client.emit("leave_stream", { streamId });

    const leaveResponse = await leavePromise;
    expect(leaveResponse.streamId).toBe(streamId);
  });

  it("should track viewer count accurately", async () => {
    const streamId = `stream_${Date.now()}`;
    const viewerCount = 3;

    for (let i = 0; i < viewerCount; i++) {
      const client = ioClient(`http://localhost:${serverPort}`, {
        transports: ["websocket"],
        reconnection: false,
      });
      clients.push(client);

      await new Promise<void>((resolve) => {
        client.once("connect", () => resolve());
      });

      await new Promise<void>((resolve) => {
        client.once("authenticated", () => resolve());
        client.emit("authenticate", { userId: `user${i}`, username: `User${i}` });
      });

      await new Promise<void>((resolve) => {
        client.once("joined_stream", () => resolve());
        client.emit("join_stream", { streamId });
      });
    }

    const count = realtimeService.getViewerCount(streamId);
    expect(count).toBe(viewerCount);
  });
});

describe("Real-Time Communication Service - Chat Messages", () => {
  let httpServer: HTTPServer;
  let serverPort: number;
  let clients: ClientSocket[] = [];

  beforeEach(async () => {
    httpServer = createServer();
    realtimeService.initialize(httpServer);

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
    for (const client of clients) {
      if (client.connected) {
        client.disconnect();
      }
    }
    clients = [];

    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  it("should broadcast chat message to all viewers in stream", async () => {
    const streamId = `stream_${Date.now()}`;
    const viewerCount = 3;
    const viewers: ClientSocket[] = [];

    for (let i = 0; i < viewerCount; i++) {
      const viewer = ioClient(`http://localhost:${serverPort}`, {
        transports: ["websocket"],
        reconnection: false,
      });
      clients.push(viewer);
      viewers.push(viewer);

      await new Promise<void>((resolve) => {
        viewer.once("connect", () => resolve());
      });

      await new Promise<void>((resolve) => {
        viewer.once("authenticated", () => resolve());
        viewer.emit("authenticate", { userId: `viewer${i}`, username: `Viewer${i}` });
      });

      await new Promise<void>((resolve) => {
        viewer.once("joined_stream", () => resolve());
        viewer.emit("join_stream", { streamId });
      });
    }

    const messagePromises = viewers.map(
      (viewer) =>
        new Promise<any>((resolve) => {
          viewer.once("chat_message", (message) => resolve(message));
        })
    );

    viewers[0].emit("chat_message", {
      streamId,
      message: "Hello everyone!",
    });

    const messages = await Promise.all(messagePromises);

    expect(messages).toHaveLength(viewerCount);
    messages.forEach((msg) => {
      expect(msg.message).toBe("Hello everyone!");
      expect(msg.username).toBe("Viewer0");
      expect(msg.streamId).toBe(streamId);
      expect(msg.timestamp).toBeDefined();
    });
  });

  it("should parse @mentions in chat messages", async () => {
    const streamId = `stream_${Date.now()}`;
    const client = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(client);

    await new Promise<void>((resolve) => {
      client.once("connect", () => resolve());
    });

    await new Promise<void>((resolve) => {
      client.once("authenticated", () => resolve());
      client.emit("authenticate", { userId: "user1", username: "MentionUser" });
    });

    await new Promise<void>((resolve) => {
      client.once("joined_stream", () => resolve());
      client.emit("join_stream", { streamId });
    });

    const messagePromise = new Promise<any>((resolve) => {
      client.once("chat_message", (message) => resolve(message));
    });

    client.emit("chat_message", {
      streamId,
      message: "Hey @Alice and @Bob, check this out!",
    });

    const message = await messagePromise;
    expect(message.mentions).toContain("Alice");
    expect(message.mentions).toContain("Bob");
    expect(message.mentions).toHaveLength(2);
  });

  it("should deliver chat messages within 1 second", async () => {
    const streamId = `stream_${Date.now()}`;
    const client = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(client);

    await new Promise<void>((resolve) => {
      client.once("connect", () => resolve());
    });

    await new Promise<void>((resolve) => {
      client.once("authenticated", () => resolve());
      client.emit("authenticate", { userId: "user1", username: "SpeedUser" });
    });

    await new Promise<void>((resolve) => {
      client.once("joined_stream", () => resolve());
      client.emit("join_stream", { streamId });
    });

    const sendTime = Date.now();
    let receiveTime = 0;

    const messagePromise = new Promise<void>((resolve) => {
      client.once("chat_message", () => {
        receiveTime = Date.now();
        resolve();
      });
    });

    client.emit("chat_message", {
      streamId,
      message: "Fast message!",
    });

    await messagePromise;

    const latency = receiveTime - sendTime;
    expect(latency).toBeLessThanOrEqual(1000);
  });

  it("should include message ID and timestamp", async () => {
    const streamId = `stream_${Date.now()}`;
    const client = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(client);

    await new Promise<void>((resolve) => {
      client.once("connect", () => resolve());
    });

    await new Promise<void>((resolve) => {
      client.once("authenticated", () => resolve());
      client.emit("authenticate", { userId: "user1", username: "IDUser" });
    });

    await new Promise<void>((resolve) => {
      client.once("joined_stream", () => resolve());
      client.emit("join_stream", { streamId });
    });

    const messagePromise = new Promise<any>((resolve) => {
      client.once("chat_message", (message) => resolve(message));
    });

    client.emit("chat_message", {
      streamId,
      message: "Test message",
    });

    const message = await messagePromise;
    expect(message.id).toBeDefined();
    expect(message.timestamp).toBeDefined();
    expect(typeof message.id).toBe("string");
    expect(typeof message.timestamp).toBe("number");
  });
});

describe("Real-Time Communication Service - Price Updates", () => {
  let httpServer: HTTPServer;
  let serverPort: number;
  let clients: ClientSocket[] = [];

  beforeEach(async () => {
    httpServer = createServer();
    realtimeService.initialize(httpServer);

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
    for (const client of clients) {
      if (client.connected) {
        client.disconnect();
      }
    }
    clients = [];

    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  it("should broadcast price update with all required fields", async () => {
    const streamId = `stream_${Date.now()}`;
    const tokenId = `token_${Date.now()}`;

    const client = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(client);

    await new Promise<void>((resolve) => {
      client.once("connect", () => resolve());
    });

    await new Promise<void>((resolve) => {
      client.once("authenticated", () => resolve());
      client.emit("authenticate", { userId: "viewer1", username: "PriceViewer" });
    });

    await new Promise<void>((resolve) => {
      client.once("joined_stream", () => resolve());
      client.emit("join_stream", { streamId });
    });

    const priceUpdatePromise = new Promise<any>((resolve) => {
      client.once("price_update", (update) => resolve(update));
    });

    const priceState: BondingCurveState = {
      tokenId,
      k: 0.000000001,
      tokensSold: 100000,
      currentPrice: 0.01,
      marketCap: 1000,
      nextPrice: 0.011,
      graduationThreshold: 69000,
      progressToGraduation: 0.0145,
      updatedAt: Date.now(),
    };

    realtimeService.broadcastPriceUpdate(streamId, priceState);

    const update = await priceUpdatePromise;
    expect(update.tokenId).toBe(tokenId);
    expect(update.currentPrice).toBe(0.01);
    expect(update.nextPrice).toBe(0.011);
    expect(update.marketCap).toBe(1000);
    expect(update.graduationProgress).toBeCloseTo(1.45, 2);
    expect(update.timestamp).toBeDefined();
  });

  it("should deliver price updates within 500ms", async () => {
    const streamId = `stream_${Date.now()}`;
    const tokenId = `token_${Date.now()}`;

    const client = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(client);

    await new Promise<void>((resolve) => {
      client.once("connect", () => resolve());
    });

    await new Promise<void>((resolve) => {
      client.once("authenticated", () => resolve());
      client.emit("authenticate", { userId: "viewer1", username: "FastViewer" });
    });

    await new Promise<void>((resolve) => {
      client.once("joined_stream", () => resolve());
      client.emit("join_stream", { streamId });
    });

    const broadcastTime = Date.now();
    let receiveTime = 0;

    const priceUpdatePromise = new Promise<void>((resolve) => {
      client.once("price_update", () => {
        receiveTime = Date.now();
        resolve();
      });
    });

    const priceState: BondingCurveState = {
      tokenId,
      k: 0.000000001,
      tokensSold: 200000,
      currentPrice: 0.04,
      marketCap: 8000,
      nextPrice: 0.041,
      graduationThreshold: 69000,
      progressToGraduation: 0.116,
      updatedAt: Date.now(),
    };

    realtimeService.broadcastPriceUpdate(streamId, priceState);

    await priceUpdatePromise;

    const latency = receiveTime - broadcastTime;
    expect(latency).toBeLessThanOrEqual(500);
  });

  it("should broadcast price updates to all viewers in stream", async () => {
    const streamId = `stream_${Date.now()}`;
    const tokenId = `token_${Date.now()}`;
    const viewerCount = 3;
    const viewers: ClientSocket[] = [];

    for (let i = 0; i < viewerCount; i++) {
      const viewer = ioClient(`http://localhost:${serverPort}`, {
        transports: ["websocket"],
        reconnection: false,
      });
      clients.push(viewer);
      viewers.push(viewer);

      await new Promise<void>((resolve) => {
        viewer.once("connect", () => resolve());
      });

      await new Promise<void>((resolve) => {
        viewer.once("authenticated", () => resolve());
        viewer.emit("authenticate", { userId: `viewer${i}`, username: `Viewer${i}` });
      });

      await new Promise<void>((resolve) => {
        viewer.once("joined_stream", () => resolve());
        viewer.emit("join_stream", { streamId });
      });
    }

    const updatePromises = viewers.map(
      (viewer) =>
        new Promise<any>((resolve) => {
          viewer.once("price_update", (update) => resolve(update));
        })
    );

    const priceState: BondingCurveState = {
      tokenId,
      k: 0.000000001,
      tokensSold: 500000,
      currentPrice: 0.25,
      marketCap: 125000,
      nextPrice: 0.251,
      graduationThreshold: 69000,
      progressToGraduation: 1.81,
      updatedAt: Date.now(),
    };

    realtimeService.broadcastPriceUpdate(streamId, priceState);

    const updates = await Promise.all(updatePromises);

    expect(updates).toHaveLength(viewerCount);
    updates.forEach((update) => {
      expect(update.tokenId).toBe(tokenId);
      expect(update.currentPrice).toBe(0.25);
      expect(update.marketCap).toBe(125000);
    });
  });
});

describe("Real-Time Communication Service - Event Replay", () => {
  let httpServer: HTTPServer;
  let serverPort: number;
  let clients: ClientSocket[] = [];

  beforeEach(async () => {
    httpServer = createServer();
    realtimeService.initialize(httpServer);

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
    for (const client of clients) {
      if (client.connected) {
        client.disconnect();
      }
    }
    clients = [];

    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  it("should replay missed chat messages", async () => {
    const streamId = `stream_${Date.now()}`;

    const client1 = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(client1);

    await new Promise<void>((resolve) => {
      client1.once("connect", () => resolve());
    });

    await new Promise<void>((resolve) => {
      client1.once("authenticated", () => resolve());
      client1.emit("authenticate", { userId: "user1", username: "User1" });
    });

    await new Promise<void>((resolve) => {
      client1.once("joined_stream", () => resolve());
      client1.emit("join_stream", { streamId });
    });

    const messages = ["First message", "Second message", "Third message"];
    for (const msg of messages) {
      client1.emit("chat_message", { streamId, message: msg });
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    const client2 = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(client2);

    await new Promise<void>((resolve) => {
      client2.once("connect", () => resolve());
    });

    await new Promise<void>((resolve) => {
      client2.once("authenticated", () => resolve());
      client2.emit("authenticate", { userId: "user2", username: "User2" });
    });

    await new Promise<void>((resolve) => {
      client2.once("joined_stream", () => resolve());
      client2.emit("join_stream", { streamId });
    });

    const replayedMessages: any[] = [];
    client2.on("chat_message", (msg) => {
      replayedMessages.push(msg);
    });

    const replayCompletePromise = new Promise<any>((resolve) => {
      client2.once("replay_complete", (data) => resolve(data));
    });

    client2.emit("reconnect_with_replay", { streamId, lastEventId: "" });

    const replayComplete = await replayCompletePromise;
    expect(replayComplete.eventsReplayed).toBe(3);
    expect(replayedMessages).toHaveLength(3);
    expect(replayedMessages[0].message).toBe("First message");
    expect(replayedMessages[1].message).toBe("Second message");
    expect(replayedMessages[2].message).toBe("Third message");
  });

  it("should replay only events after lastEventId", async () => {
    const streamId = `stream_${Date.now()}`;

    const client1 = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(client1);

    await new Promise<void>((resolve) => {
      client1.once("connect", () => resolve());
    });

    await new Promise<void>((resolve) => {
      client1.once("authenticated", () => resolve());
      client1.emit("authenticate", { userId: "user1", username: "User1" });
    });

    await new Promise<void>((resolve) => {
      client1.once("joined_stream", () => resolve());
      client1.emit("join_stream", { streamId });
    });

    const receivedMessages: any[] = [];
    client1.on("chat_message", (msg) => {
      receivedMessages.push(msg);
    });

    client1.emit("chat_message", { streamId, message: "Message 1" });
    await new Promise((resolve) => setTimeout(resolve, 50));
    client1.emit("chat_message", { streamId, message: "Message 2" });
    await new Promise((resolve) => setTimeout(resolve, 50));

    const lastEventId = receivedMessages[0].eventId;

    client1.emit("chat_message", { streamId, message: "Message 3" });
    await new Promise((resolve) => setTimeout(resolve, 100));

    const client2 = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(client2);

    await new Promise<void>((resolve) => {
      client2.once("connect", () => resolve());
    });

    await new Promise<void>((resolve) => {
      client2.once("authenticated", () => resolve());
      client2.emit("authenticate", { userId: "user2", username: "User2" });
    });

    await new Promise<void>((resolve) => {
      client2.once("joined_stream", () => resolve());
      client2.emit("join_stream", { streamId });
    });

    const replayedMessages: any[] = [];
    client2.on("chat_message", (msg) => {
      replayedMessages.push(msg);
    });

    const replayCompletePromise = new Promise<any>((resolve) => {
      client2.once("replay_complete", (data) => resolve(data));
    });

    client2.emit("reconnect_with_replay", { streamId, lastEventId });

    const replayComplete = await replayCompletePromise;
    expect(replayComplete.eventsReplayed).toBe(2);
    expect(replayedMessages).toHaveLength(2);
    expect(replayedMessages[0].message).toBe("Message 2");
    expect(replayedMessages[1].message).toBe("Message 3");
  });

  it("should replay mixed event types in correct order", async () => {
    const streamId = `stream_${Date.now()}`;
    const tokenId = `token_${Date.now()}`;

    const client1 = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(client1);

    await new Promise<void>((resolve) => {
      client1.once("connect", () => resolve());
    });

    await new Promise<void>((resolve) => {
      client1.once("authenticated", () => resolve());
      client1.emit("authenticate", { userId: "user1", username: "User1" });
    });

    await new Promise<void>((resolve) => {
      client1.once("joined_stream", () => resolve());
      client1.emit("join_stream", { streamId });
    });

    client1.emit("chat_message", { streamId, message: "Chat 1" });
    await new Promise((resolve) => setTimeout(resolve, 50));

    const priceState: BondingCurveState = {
      tokenId,
      k: 0.000000001,
      tokensSold: 100000,
      currentPrice: 0.01,
      marketCap: 1000,
      nextPrice: 0.011,
      graduationThreshold: 69000,
      progressToGraduation: 0.0145,
      updatedAt: Date.now(),
    };
    realtimeService.broadcastPriceUpdate(streamId, priceState);
    await new Promise((resolve) => setTimeout(resolve, 50));

    client1.emit("chat_message", { streamId, message: "Chat 2" });
    await new Promise((resolve) => setTimeout(resolve, 100));

    const client2 = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(client2);

    await new Promise<void>((resolve) => {
      client2.once("connect", () => resolve());
    });

    await new Promise<void>((resolve) => {
      client2.once("authenticated", () => resolve());
      client2.emit("authenticate", { userId: "user2", username: "User2" });
    });

    await new Promise<void>((resolve) => {
      client2.once("joined_stream", () => resolve());
      client2.emit("join_stream", { streamId });
    });

    const replayedEvents: any[] = [];
    client2.on("chat_message", (msg) => {
      replayedEvents.push({ type: "chat", data: msg });
    });
    client2.on("price_update", (update) => {
      replayedEvents.push({ type: "price", data: update });
    });

    const replayCompletePromise = new Promise<any>((resolve) => {
      client2.once("replay_complete", (data) => resolve(data));
    });

    client2.emit("reconnect_with_replay", { streamId, lastEventId: "" });

    await replayCompletePromise;

    expect(replayedEvents).toHaveLength(3);
    expect(replayedEvents[0].type).toBe("chat");
    expect(replayedEvents[0].data.message).toBe("Chat 1");
    expect(replayedEvents[1].type).toBe("price");
    expect(replayedEvents[1].data.currentPrice).toBe(0.01);
    expect(replayedEvents[2].type).toBe("chat");
    expect(replayedEvents[2].data.message).toBe("Chat 2");
  });

  it("should handle replay when no events exist", async () => {
    const streamId = `stream_${Date.now()}`;

    const client = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(client);

    await new Promise<void>((resolve) => {
      client.once("connect", () => resolve());
    });

    await new Promise<void>((resolve) => {
      client.once("authenticated", () => resolve());
      client.emit("authenticate", { userId: "user1", username: "User1" });
    });

    await new Promise<void>((resolve) => {
      client.once("joined_stream", () => resolve());
      client.emit("join_stream", { streamId });
    });

    const replayCompletePromise = new Promise<any>((resolve) => {
      client.once("replay_complete", (data) => resolve(data));
    });

    client.emit("reconnect_with_replay", { streamId, lastEventId: "" });

    const replayComplete = await replayCompletePromise;
    expect(replayComplete.eventsReplayed).toBe(0);
    expect(replayComplete.message).toContain("No events to replay");
  });
});
