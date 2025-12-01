// Real-Time Communication Service
// Handles WebSocket connections, chat, price updates, and notifications

import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import {
  ChatMessage,
  PurchaseNotification,
  GraduationNotification,
  PriceUpdatePayload,
  ConnectionInfo,
  RoomInfo,
  EventLog,
  LARGE_PURCHASE_THRESHOLD,
} from "../types/realtime.types.js";
import { BondingCurveState } from "../types/token.types.js";
import { Purchase } from "../types/bonding-curve.types.js";

class RealtimeService {
  private io: SocketIOServer | null = null;
  private rooms: Map<string, RoomInfo> = new Map();
  private eventLogs: Map<string, EventLog[]> = new Map();
  private eventIdCounter = 0;

  /**
   * Initialize Socket.io server with HTTP server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"],
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupConnectionHandlers();
    console.log("Socket.io server initialized");
  }

  /**
   * Set up connection event handlers
   */
  private setupConnectionHandlers(): void {
    if (!this.io) {
      throw new Error("Socket.io not initialized");
    }

    this.io.on("connection", (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle authentication
      socket.on("authenticate", (data: { userId: string; username: string }) => {
        this.handleConnection(socket, data.userId, data.username);
      });

      // Handle joining stream room
      socket.on("join_stream", (data: { streamId: string }) => {
        this.joinStreamRoom(socket, data.streamId);
      });

      // Handle leaving stream room
      socket.on("leave_stream", (data: { streamId: string }) => {
        this.leaveStreamRoom(socket, data.streamId);
      });

      // Handle chat messages
      socket.on("chat_message", (data: Omit<ChatMessage, "id" | "timestamp" | "mentions">) => {
        this.handleChatMessage(socket, data);
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        this.handleDisconnection(socket);
      });

      // Handle reconnection with event replay
      socket.on("reconnect_with_replay", (data: { streamId: string; lastEventId: string }) => {
        this.reconnectClient(socket, data.streamId, data.lastEventId);
      });
    });
  }

  /**
   * Handle new client connection with authentication
   */
  handleConnection(socket: Socket, userId: string, username: string): void {
    const connectionInfo: ConnectionInfo = {
      userId,
      username,
      socketId: socket.id,
      connectedAt: Date.now(),
    };

    // Store connection info in socket data
    socket.data.userId = userId;
    socket.data.username = username;

    socket.emit("authenticated", { success: true, userId, username });
    console.log(`User authenticated: ${username} (${userId})`);
  }

  /**
   * Handle client disconnection and cleanup
   */
  handleDisconnection(socket: Socket): void {
    const userId = socket.data.userId;
    const username = socket.data.username;

    // Remove from all rooms
    this.rooms.forEach((roomInfo, streamId) => {
      if (roomInfo.connections.has(socket.id)) {
        roomInfo.connections.delete(socket.id);

        // Broadcast viewer count update
        this.io?.to(streamId).emit("viewer_count_update", {
          streamId,
          viewerCount: roomInfo.connections.size,
        });
      }
    });

    console.log(`Client disconnected: ${socket.id} (${username})`);
  }

  /**
   * Add client to stream room
   */
  joinStreamRoom(socket: Socket, streamId: string): void {
    const userId = socket.data.userId;
    const username = socket.data.username;

    if (!userId || !username) {
      socket.emit("error", { message: "Not authenticated" });
      return;
    }

    // Join the room
    socket.join(streamId);

    // Initialize room if it doesn't exist
    if (!this.rooms.has(streamId)) {
      this.rooms.set(streamId, {
        streamId,
        connections: new Map(),
      });
      this.eventLogs.set(streamId, []);
    }

    const roomInfo = this.rooms.get(streamId)!;
    roomInfo.connections.set(socket.id, {
      userId,
      username,
      socketId: socket.id,
      connectedAt: Date.now(),
    });

    // Notify client they joined
    socket.emit("joined_stream", {
      streamId,
      viewerCount: roomInfo.connections.size,
    });

    // Broadcast updated viewer count to all in room
    this.io?.to(streamId).emit("viewer_count_update", {
      streamId,
      viewerCount: roomInfo.connections.size,
    });

    console.log(`User ${username} joined stream ${streamId}`);
  }

  /**
   * Remove client from stream room
   */
  leaveStreamRoom(socket: Socket, streamId: string): void {
    const username = socket.data.username;

    socket.leave(streamId);

    const roomInfo = this.rooms.get(streamId);
    if (roomInfo) {
      roomInfo.connections.delete(socket.id);

      // Broadcast updated viewer count
      this.io?.to(streamId).emit("viewer_count_update", {
        streamId,
        viewerCount: roomInfo.connections.size,
      });

      // Clean up empty rooms
      if (roomInfo.connections.size === 0) {
        this.rooms.delete(streamId);
        // Keep event logs for a while for reconnection
        setTimeout(() => {
          this.eventLogs.delete(streamId);
        }, 300000); // 5 minutes
      }
    }

    socket.emit("left_stream", { streamId });
    console.log(`User ${username} left stream ${streamId}`);
  }

  /**
   * Handle and broadcast chat message
   */
  private handleChatMessage(
    socket: Socket,
    data: Omit<ChatMessage, "id" | "timestamp" | "mentions">
  ): void {
    const userId = socket.data.userId;
    const username = socket.data.username;

    if (!userId || !username) {
      socket.emit("error", { message: "Not authenticated" });
      return;
    }

    // Parse @mentions from message
    const mentions = this.parseMentions(data.message);

    const chatMessage: ChatMessage = {
      id: this.generateEventId(),
      streamId: data.streamId,
      userId,
      username,
      message: data.message,
      timestamp: Date.now(),
      mentions,
    };

    this.broadcastChatMessage(data.streamId, chatMessage);
  }

  /**
   * Broadcast chat message to all viewers in stream
   */
  broadcastChatMessage(streamId: string, message: ChatMessage): void {
    if (!this.io) {
      throw new Error("Socket.io not initialized");
    }

    // Log event for replay
    this.logEvent(streamId, "chat", message);

    // Broadcast to all in room
    this.io.to(streamId).emit("chat_message", message);
  }

  /**
   * Broadcast price update to all viewers in stream
   */
  broadcastPriceUpdate(streamId: string, priceState: BondingCurveState): void {
    if (!this.io) {
      throw new Error("Socket.io not initialized");
    }

    const payload: PriceUpdatePayload = {
      tokenId: priceState.tokenId,
      currentPrice: priceState.currentPrice,
      nextPrice: priceState.nextPrice,
      marketCap: priceState.marketCap,
      graduationProgress: priceState.progressToGraduation * 100,
      timestamp: Date.now(),
    };

    // Log event for replay
    this.logEvent(streamId, "price_update", payload);

    // Broadcast to all in room
    this.io.to(streamId).emit("price_update", payload);
  }

  /**
   * Broadcast purchase notification to all viewers in stream
   */
  broadcastPurchaseNotification(
    streamId: string,
    purchase: Purchase,
    buyerUsername: string,
    newMarketCap: number
  ): void {
    if (!this.io) {
      throw new Error("Socket.io not initialized");
    }

    const notification: PurchaseNotification = {
      tokenId: purchase.tokenId,
      buyerId: purchase.buyerId,
      buyerUsername,
      amount: purchase.amount,
      price: purchase.price,
      newMarketCap,
      isLargePurchase: purchase.totalSpent > LARGE_PURCHASE_THRESHOLD,
    };

    // Log event for replay
    this.logEvent(streamId, "purchase", notification);

    // Broadcast to all in room
    this.io.to(streamId).emit("purchase_notification", notification);
  }

  /**
   * Broadcast graduation announcement to all viewers in stream
   */
  broadcastGraduationAnnouncement(streamId: string, graduation: GraduationNotification): void {
    if (!this.io) {
      throw new Error("Socket.io not initialized");
    }

    // Log event for replay
    this.logEvent(streamId, "graduation", graduation);

    // Broadcast to all in room
    this.io.to(streamId).emit("graduation_announcement", graduation);
  }

  /**
   * Reconnect client and replay missed events
   */
  reconnectClient(socket: Socket, streamId: string, lastEventId: string): void {
    const eventLog = this.eventLogs.get(streamId);
    if (!eventLog) {
      socket.emit("replay_complete", { eventsReplayed: 0 });
      return;
    }

    // Find events after lastEventId
    const lastEventIndex = eventLog.findIndex((event) => event.id === lastEventId);
    const missedEvents = lastEventIndex >= 0 ? eventLog.slice(lastEventIndex + 1) : eventLog;

    // Replay missed events
    missedEvents.forEach((event) => {
      switch (event.eventType) {
        case "chat":
          socket.emit("chat_message", event.payload);
          break;
        case "purchase":
          socket.emit("purchase_notification", event.payload);
          break;
        case "price_update":
          socket.emit("price_update", event.payload);
          break;
        case "graduation":
          socket.emit("graduation_announcement", event.payload);
          break;
      }
    });

    socket.emit("replay_complete", { eventsReplayed: missedEvents.length });
    console.log(`Replayed ${missedEvents.length} events for client ${socket.id}`);
  }

  /**
   * Parse @mentions from message text
   */
  private parseMentions(message: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(message)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  /**
   * Log event for replay functionality
   */
  private logEvent(
    streamId: string,
    eventType: "chat" | "purchase" | "price_update" | "graduation",
    payload: any
  ): void {
    const eventLog = this.eventLogs.get(streamId);
    if (!eventLog) return;

    const event: EventLog = {
      id: this.generateEventId(),
      streamId,
      eventType,
      payload,
      timestamp: Date.now(),
    };

    eventLog.push(event);

    // Keep only last 1000 events per stream
    if (eventLog.length > 1000) {
      eventLog.shift();
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${this.eventIdCounter++}`;
  }

  /**
   * Get Socket.io server instance
   */
  getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error("Socket.io not initialized");
    }
    return this.io;
  }

  /**
   * Get viewer count for a stream
   */
  getViewerCount(streamId: string): number {
    const roomInfo = this.rooms.get(streamId);
    return roomInfo ? roomInfo.connections.size : 0;
  }

  /**
   * Get all active stream IDs
   */
  getActiveStreamIds(): string[] {
    return Array.from(this.rooms.keys());
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
