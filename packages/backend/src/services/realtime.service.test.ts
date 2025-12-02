// Unit Tests for Real-Time Communication Service
// Tests connection management, room management, message broadcasting, price updates, and event replay

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Server as HTTPServer, createServer } from "http";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";
import { realtimeService } from "./realtime.service.js";
import { Purchase } from "../types/bonding-curve.types.js";
import { GraduationNotification, ChatMessage } from "../types/realtime.types.js";
import { BondingCurveState } from "../types/token.types.js";

describe("Real-Time Communication Service - Purchase Notifications", () => {
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

  it("should broadcast purchase notification with all required fields", async () => {
    const streamId = `stream_${Date.now()}`;
    const tokenId = `token_${Date.now()}`;

    // Create viewer client
    const viewer = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(viewer);

    // Wait for connection
    await new Promise<void>((resolve) => {
      viewer.once("connect", () => resolve());
    });

    // Authenticate viewer
    await new Promise<void>((resolve) => {
      viewer.once("authenticated", () => resolve());
      viewer.emit("authenticate", { userId: "viewer1", username: "TestViewer" });
    });

    // Join stream room
    await new Promise<void>((resolve) => {
      viewer.once("joined_stream", () => resolve());
      viewer.emit("join_stream", { streamId });
    });

    // Set up listener for purchase notification
    const notificationPromise = new Promise<any>((resolve) => {
      viewer.once("purchase_notification", (notification) => {
        resolve(notification);
      });
    });

    // Create mock purchase
    const purchase: Purchase = {
      id: "purchase_123",
      tokenId,
      buyerId: "buyer1",
      amount: 1000,
      price: 0.05,
      totalSpent: 50,
      fees: {
        creatorFee: 49,
        platformFee: 1,
      },
      txHash: "0xabc123",
      timestamp: Date.now(),
    };

    // Broadcast purchase notification
    realtimeService.broadcastPurchaseNotification(streamId, purchase, "TestBuyer", 5000);

    // Wait for notification
    const notification = await notificationPromise;

    // Verify all required fields are present
    expect(notification).toBeDefined();
    expect(notification.tokenId).toBe(tokenId);
    expect(notification.buyerId).toBe("buyer1");
    expect(notification.buyerUsername).toBe("TestBuyer");
    expect(notification.amount).toBe(1000);
    expect(notification.price).toBe(0.05);
    expect(notification.newMarketCap).toBe(5000);
    expect(notification.isLargePurchase).toBe(false); // $50 < $100
  });

  it("should highlight large purchases over $100", async () => {
    const streamId = `stream_${Date.now()}`;
    const tokenId = `token_${Date.now()}`;

    // Create viewer client
    const viewer = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(viewer);

    // Wait for connection
    await new Promise<void>((resolve) => {
      viewer.once("connect", () => resolve());
    });

    // Authenticate viewer
    await new Promise<void>((resolve) => {
      viewer.once("authenticated", () => resolve());
      viewer.emit("authenticate", { userId: "viewer1", username: "TestViewer" });
    });

    // Join stream room
    await new Promise<void>((resolve) => {
      viewer.once("joined_stream", () => resolve());
      viewer.emit("join_stream", { streamId });
    });

    // Set up listener for purchase notification
    const notificationPromise = new Promise<any>((resolve) => {
      viewer.once("purchase_notification", (notification) => {
        resolve(notification);
      });
    });

    // Create mock large purchase
    const purchase: Purchase = {
      id: "purchase_456",
      tokenId,
      buyerId: "whale1",
      amount: 5000,
      price: 0.05,
      totalSpent: 150, // $150 > $100
      fees: {
        creatorFee: 147,
        platformFee: 3,
      },
      txHash: "0xdef456",
      timestamp: Date.now(),
    };

    // Broadcast purchase notification
    realtimeService.broadcastPurchaseNotification(streamId, purchase, "WhaleUser", 15000);

    // Wait for notification
    const notification = await notificationPromise;

    // Verify large purchase is highlighted
    expect(notification.isLargePurchase).toBe(true);
    expect(notification.buyerUsername).toBe("WhaleUser");
    expect(notification.totalSpent).toBeUndefined(); // Should not expose total spent
  });

  it("should deliver purchase notification within 1 second", async () => {
    const streamId = `stream_${Date.now()}`;
    const tokenId = `token_${Date.now()}`;

    // Create viewer client
    const viewer = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(viewer);

    // Wait for connection
    await new Promise<void>((resolve) => {
      viewer.once("connect", () => resolve());
    });

    // Authenticate viewer
    await new Promise<void>((resolve) => {
      viewer.once("authenticated", () => resolve());
      viewer.emit("authenticate", { userId: "viewer1", username: "TestViewer" });
    });

    // Join stream room
    await new Promise<void>((resolve) => {
      viewer.once("joined_stream", () => resolve());
      viewer.emit("join_stream", { streamId });
    });

    // Track timing
    const broadcastTime = Date.now();
    let receiveTime = 0;

    // Set up listener for purchase notification
    const notificationPromise = new Promise<void>((resolve) => {
      viewer.once("purchase_notification", () => {
        receiveTime = Date.now();
        resolve();
      });
    });

    // Create mock purchase
    const purchase: Purchase = {
      id: "purchase_789",
      tokenId,
      buyerId: "buyer2",
      amount: 500,
      price: 0.03,
      totalSpent: 15,
      fees: {
        creatorFee: 14.7,
        platformFee: 0.3,
      },
      txHash: "0xghi789",
      timestamp: Date.now(),
    };

    // Broadcast purchase notification
    realtimeService.broadcastPurchaseNotification(streamId, purchase, "FastBuyer", 2000);

    // Wait for notification
    await notificationPromise;

    // Verify delivery time is within 1 second (1000ms)
    const latency = receiveTime - broadcastTime;
    expect(latency).toBeLessThanOrEqual(1000);
  });

  it("should broadcast to all viewers in the stream", async () => {
    const streamId = `stream_${Date.now()}`;
    const tokenId = `token_${Date.now()}`;
    const viewerCount = 3;

    // Create multiple viewer clients
    const viewers: ClientSocket[] = [];
    for (let i = 0; i < viewerCount; i++) {
      const viewer = ioClient(`http://localhost:${serverPort}`, {
        transports: ["websocket"],
        reconnection: false,
      });
      clients.push(viewer);
      viewers.push(viewer);

      // Wait for connection
      await new Promise<void>((resolve) => {
        viewer.once("connect", () => resolve());
      });

      // Authenticate viewer
      await new Promise<void>((resolve) => {
        viewer.once("authenticated", () => resolve());
        viewer.emit("authenticate", { userId: `viewer${i}`, username: `Viewer${i}` });
      });

      // Join stream room
      await new Promise<void>((resolve) => {
        viewer.once("joined_stream", () => resolve());
        viewer.emit("join_stream", { streamId });
      });
    }

    // Set up listeners for all viewers
    const notificationPromises = viewers.map(
      (viewer) =>
        new Promise<any>((resolve) => {
          viewer.once("purchase_notification", (notification) => {
            resolve(notification);
          });
        })
    );

    // Create mock purchase
    const purchase: Purchase = {
      id: "purchase_multi",
      tokenId,
      buyerId: "buyer3",
      amount: 2000,
      price: 0.04,
      totalSpent: 80,
      fees: {
        creatorFee: 78.4,
        platformFee: 1.6,
      },
      txHash: "0xjkl012",
      timestamp: Date.now(),
    };

    // Broadcast purchase notification
    realtimeService.broadcastPurchaseNotification(streamId, purchase, "MultiBuyer", 8000);

    // Wait for all notifications
    const notifications = await Promise.all(notificationPromises);

    // Verify all viewers received the notification
    expect(notifications).toHaveLength(viewerCount);
    notifications.forEach((notification) => {
      expect(notification.tokenId).toBe(tokenId);
      expect(notification.buyerUsername).toBe("MultiBuyer");
      expect(notification.amount).toBe(2000);
    });
  });
});

describe("Real-Time Communication Service - Graduation Announcements", () => {
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

  it("should broadcast graduation announcement with all required fields", async () => {
    const streamId = `stream_${Date.now()}`;
    const tokenId = `token_${Date.now()}`;

    // Create viewer client
    const viewer = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(viewer);

    // Wait for connection
    await new Promise<void>((resolve) => {
      viewer.once("connect", () => resolve());
    });

    // Authenticate viewer
    await new Promise<void>((resolve) => {
      viewer.once("authenticated", () => resolve());
      viewer.emit("authenticate", { userId: "viewer1", username: "TestViewer" });
    });

    // Join stream room
    await new Promise<void>((resolve) => {
      viewer.once("joined_stream", () => resolve());
      viewer.emit("join_stream", { streamId });
    });

    // Set up listener for graduation announcement
    const announcementPromise = new Promise<GraduationNotification>((resolve) => {
      viewer.once("graduation_announcement", (announcement) => {
        resolve(announcement);
      });
    });

    // Create mock graduation notification
    const graduation: GraduationNotification = {
      tokenId,
      tokenSymbol: "$KIRO",
      finalMarketCap: 69000,
      liquidityPoolAddress: "0x1234567890abcdef1234567890abcdef12345678",
    };

    // Broadcast graduation announcement
    realtimeService.broadcastGraduationAnnouncement(streamId, graduation);

    // Wait for announcement
    const announcement = await announcementPromise;

    // Verify all required fields are present
    expect(announcement).toBeDefined();
    expect(announcement.tokenId).toBe(tokenId);
    expect(announcement.tokenSymbol).toBe("$KIRO");
    expect(announcement.finalMarketCap).toBe(69000);
    expect(announcement.liquidityPoolAddress).toBe("0x1234567890abcdef1234567890abcdef12345678");
  });

  it("should broadcast graduation announcement to all viewers in the stream", async () => {
    const streamId = `stream_${Date.now()}`;
    const tokenId = `token_${Date.now()}`;
    const viewerCount = 3;

    // Create multiple viewer clients
    const viewers: ClientSocket[] = [];
    for (let i = 0; i < viewerCount; i++) {
      const viewer = ioClient(`http://localhost:${serverPort}`, {
        transports: ["websocket"],
        reconnection: false,
      });
      clients.push(viewer);
      viewers.push(viewer);

      // Wait for connection
      await new Promise<void>((resolve) => {
        viewer.once("connect", () => resolve());
      });

      // Authenticate viewer
      await new Promise<void>((resolve) => {
        viewer.once("authenticated", () => resolve());
        viewer.emit("authenticate", { userId: `viewer${i}`, username: `Viewer${i}` });
      });

      // Join stream room
      await new Promise<void>((resolve) => {
        viewer.once("joined_stream", () => resolve());
        viewer.emit("join_stream", { streamId });
      });
    }

    // Set up listeners for all viewers
    const announcementPromises = viewers.map(
      (viewer) =>
        new Promise<GraduationNotification>((resolve) => {
          viewer.once("graduation_announcement", (announcement) => {
            resolve(announcement);
          });
        })
    );

    // Create mock graduation notification
    const graduation: GraduationNotification = {
      tokenId,
      tokenSymbol: "$STREAM",
      finalMarketCap: 75000,
      liquidityPoolAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    };

    // Broadcast graduation announcement
    realtimeService.broadcastGraduationAnnouncement(streamId, graduation);

    // Wait for all announcements
    const announcements = await Promise.all(announcementPromises);

    // Verify all viewers received the announcement
    expect(announcements).toHaveLength(viewerCount);
    announcements.forEach((announcement) => {
      expect(announcement.tokenId).toBe(tokenId);
      expect(announcement.tokenSymbol).toBe("$STREAM");
      expect(announcement.finalMarketCap).toBe(75000);
      expect(announcement.liquidityPoolAddress).toBe("0xabcdef1234567890abcdef1234567890abcdef12");
    });
  });

  it("should include graduation announcement in event log for replay", async () => {
    const streamId = `stream_${Date.now()}`;
    const tokenId = `token_${Date.now()}`;

    // Create first viewer client
    const viewer1 = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(viewer1);

    // Wait for connection
    await new Promise<void>((resolve) => {
      viewer1.once("connect", () => resolve());
    });

    // Authenticate viewer
    await new Promise<void>((resolve) => {
      viewer1.once("authenticated", () => resolve());
      viewer1.emit("authenticate", { userId: "viewer1", username: "Viewer1" });
    });

    // Join stream room
    await new Promise<void>((resolve) => {
      viewer1.once("joined_stream", () => resolve());
      viewer1.emit("join_stream", { streamId });
    });

    // Create mock graduation notification
    const graduation: GraduationNotification = {
      tokenId,
      tokenSymbol: "$REPLAY",
      finalMarketCap: 69500,
      liquidityPoolAddress: "0xfedcba0987654321fedcba0987654321fedcba09",
    };

    // Broadcast graduation announcement
    realtimeService.broadcastGraduationAnnouncement(streamId, graduation);

    // Wait a bit for event to be logged
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Create second viewer client that will request replay
    const viewer2 = ioClient(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    clients.push(viewer2);

    // Wait for connection
    await new Promise<void>((resolve) => {
      viewer2.once("connect", () => resolve());
    });

    // Authenticate viewer
    await new Promise<void>((resolve) => {
      viewer2.once("authenticated", () => resolve());
      viewer2.emit("authenticate", { userId: "viewer2", username: "Viewer2" });
    });

    // Join stream room
    await new Promise<void>((resolve) => {
      viewer2.once("joined_stream", () => resolve());
      viewer2.emit("join_stream", { streamId });
    });

    // Set up listener for replayed graduation announcement
    const replayPromise = new Promise<GraduationNotification>((resolve) => {
      viewer2.once("graduation_announcement", (announcement) => {
        resolve(announcement);
      });
    });

    // Request replay from beginning (empty lastEventId)
    viewer2.emit("reconnect_with_replay", { streamId, lastEventId: "" });

    // Wait for replayed announcement
    const replayedAnnouncement = await replayPromise;

    // Verify replayed announcement matches original
    expect(replayedAnnouncement.tokenId).toBe(tokenId);
    expect(replayedAnnouncement.tokenSymbol).toBe("$REPLAY");
    expect(replayedAnnouncement.finalMarketCap).toBe(69500);
    expect(replayedAnnouncement.liquidityPoolAddress).toBe(
      "0xfedcba0987654321fedcba0987654321fedcba09"
    );
  });
});
