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

  // Store deployment status for replay when clients join late
  private deploymentStatuses: Map<string, any[]> = new Map(); // streamId -> deployment events

  // Price update batching (Requirement 11.5, 21.2)
  private priceUpdateBatches: Map<string, BondingCurveState> = new Map(); // streamId -> latest state
  private batchTimers: Map<string, NodeJS.Timeout> = new Map(); // streamId -> timer
  private readonly BATCH_INTERVAL_MS = 100; // 100ms batching interval

  /**
   * Initialize Socket.io server with HTTP server
   * Configures automatic reconnection and connection recovery
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"],
      },
      // Connection settings
      pingTimeout: 60000,
      pingInterval: 25000,

      // Automatic reconnection settings (Requirement 16.1)
      // Socket.io client will automatically attempt reconnection
      // with exponential backoff when connection is lost
      transports: ["websocket", "polling"], // Fallback to polling if websocket fails
      allowUpgrades: true, // Allow upgrading from polling to websocket

      // Connection state recovery (Requirement 16.2, 16.3, 16.4)
      connectionStateRecovery: {
        // Maximum duration for which the server will try to restore the session
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        // Whether to skip middlewares upon successful recovery
        skipMiddlewares: true,
      },
    });

    this.setupConnectionHandlers();
    console.log("Socket.io server initialized with automatic reconnection and recovery");
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

      // Handle joining stream room (support both naming conventions)
      socket.on("join_stream", (data: { streamId: string }) => {
        this.joinStreamRoom(socket, data.streamId);
      });

      // Also handle hyphenated version used by frontend
      socket.on("join-stream", (streamId: string | { streamId: string }) => {
        const id = typeof streamId === "string" ? streamId : streamId.streamId;
        this.joinStreamRoom(socket, id);
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
      socket.on("disconnect", (reason) => {
        this.handleDisconnection(socket, reason);
      });

      // Handle reconnection with event replay (Requirement 16.2, 16.3)
      socket.on("reconnect_with_replay", (data: { streamId: string; lastEventId: string }) => {
        this.reconnectClient(socket, data.streamId, data.lastEventId);
      });

      // Handle automatic reconnection (Requirement 16.1, 16.4)
      // When Socket.io automatically reconnects, restore the client's state
      if (socket.recovered) {
        console.log(`Client ${socket.id} recovered from disconnection`);
        // Client state is automatically restored by Socket.io
        // Resume normal message delivery (Requirement 16.4)
        socket.emit("connection_recovered", {
          message: "Connection restored successfully",
          timestamp: Date.now(),
        });
      }
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
   * Supports automatic reconnection (Requirement 16.1)
   */
  handleDisconnection(socket: Socket, reason: string): void {
    const userId = socket.data.userId;
    const username = socket.data.username;

    console.log(`Client disconnected: ${socket.id} (${username}) - Reason: ${reason}`);

    // For temporary disconnections, Socket.io will handle reconnection automatically
    // Only clean up if it's a permanent disconnection
    const isPermanentDisconnect =
      reason === "client namespace disconnect" || reason === "server namespace disconnect";

    if (isPermanentDisconnect) {
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
      console.log(`Permanent disconnect - cleaned up user: ${username}`);
    } else {
      console.log(`Temporary disconnect - user ${username} may reconnect automatically`);
    }
  }

  /**
   * Add client to stream room
   */
  joinStreamRoom(socket: Socket, streamId: string): void {
    // Use socket data if authenticated, otherwise use socket ID as fallback
    const userId = socket.data.userId || socket.id;
    const username = socket.data.username || `User-${socket.id.slice(0, 6)}`;

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

    // Replay deployment status if there's an ongoing deployment
    const deploymentEvents = this.getDeploymentStatus(streamId);
    if (deploymentEvents.length > 0) {
      console.log(`Replaying ${deploymentEvents.length} deployment events to ${username}`);
      for (const event of deploymentEvents) {
        socket.emit("deployment_status", event);
      }
    }

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

        // Flush any pending price updates for this stream
        const timer = this.batchTimers.get(streamId);
        if (timer) {
          clearTimeout(timer);
          this.batchTimers.delete(streamId);
        }
        this.flushPriceUpdateBatch(streamId);

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

    // Log event for replay and get event ID
    const eventId = this.logEvent(streamId, "chat", message);

    // Broadcast to all in room with event ID for client tracking
    this.io.to(streamId).emit("chat_message", { ...message, eventId });
  }

  /**
   * Broadcast price update to all viewers in stream
   * Implements batching to aggregate multiple purchases before broadcasting (Requirement 11.5, 21.2)
   * Batches updates every 100ms to reduce network overhead while maintaining sub-500ms delivery
   */
  broadcastPriceUpdate(streamId: string, priceState: BondingCurveState): void {
    if (!this.io) {
      throw new Error("Socket.io not initialized");
    }

    // Store the latest price state for this stream
    this.priceUpdateBatches.set(streamId, priceState);

    // If there's already a timer for this stream, don't create a new one
    if (this.batchTimers.has(streamId)) {
      return;
    }

    // Create a timer to flush the batch after 100ms
    const timer = setTimeout(() => {
      this.flushPriceUpdateBatch(streamId);
    }, this.BATCH_INTERVAL_MS);

    this.batchTimers.set(streamId, timer);
  }

  /**
   * Flush the batched price update for a stream
   * Sends the latest aggregated state to all viewers
   */
  private flushPriceUpdateBatch(streamId: string): void {
    if (!this.io) {
      return;
    }

    const priceState = this.priceUpdateBatches.get(streamId);
    if (!priceState) {
      return;
    }

    const payload: PriceUpdatePayload = {
      tokenId: priceState.tokenId,
      currentPrice: priceState.currentPrice,
      nextPrice: priceState.nextPrice,
      marketCap: priceState.marketCap,
      graduationProgress: priceState.progressToGraduation * 100,
      timestamp: Date.now(),
    };

    // Log event for replay and get event ID
    const eventId = this.logEvent(streamId, "price_update", payload);

    // Broadcast to all in room with event ID for client tracking
    this.io.to(streamId).emit("price_update", { ...payload, eventId });

    // Clean up
    this.priceUpdateBatches.delete(streamId);
    this.batchTimers.delete(streamId);
  }

  /**
   * Force flush all pending price update batches
   * Useful for cleanup or immediate delivery
   */
  flushAllPriceUpdateBatches(): void {
    const streamIds = Array.from(this.priceUpdateBatches.keys());
    streamIds.forEach((streamId) => {
      // Clear the timer
      const timer = this.batchTimers.get(streamId);
      if (timer) {
        clearTimeout(timer);
      }
      // Flush immediately
      this.flushPriceUpdateBatch(streamId);
    });
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

    // Log event for replay and get event ID
    const eventId = this.logEvent(streamId, "purchase", notification);

    // Broadcast to all in room with event ID for client tracking
    this.io.to(streamId).emit("purchase_notification", { ...notification, eventId });
  }

  /**
   * Broadcast graduation announcement to all viewers in stream
   */
  broadcastGraduationAnnouncement(streamId: string, graduation: GraduationNotification): void {
    if (!this.io) {
      throw new Error("Socket.io not initialized");
    }

    // Log event for replay and get event ID
    const eventId = this.logEvent(streamId, "graduation", graduation);

    // Broadcast to all in room with event ID for client tracking
    this.io.to(streamId).emit("graduation_announcement", { ...graduation, eventId });
  }

  /**
   * Broadcast blockchain deployment status update to stream
   * Used to show live token deployment progress to the streamer
   */
  broadcastDeploymentStatus(streamId: string, deploymentStatus: any): void {
    if (!this.io) {
      console.warn("Socket.io not initialized, skipping deployment broadcast");
      return;
    }

    // Store deployment status for replay when clients join late
    if (!this.deploymentStatuses.has(streamId)) {
      this.deploymentStatuses.set(streamId, []);
    }
    this.deploymentStatuses.get(streamId)!.push({
      ...deploymentStatus,
      timestamp: Date.now(),
    });

    // Clear old deployment statuses after 10 minutes
    if (
      deploymentStatus.step === "deployment_complete" ||
      deploymentStatus.step === "deployment_failed"
    ) {
      setTimeout(
        () => {
          this.deploymentStatuses.delete(streamId);
        },
        10 * 60 * 1000
      );
    }

    // Broadcast to all in room (primarily the streamer)
    this.io.to(streamId).emit("deployment_status", deploymentStatus);
    console.log(`Broadcasted deployment status to stream ${streamId}:`, deploymentStatus.step);
  }

  /**
   * Get stored deployment status for a stream (for late-joining clients)
   */
  getDeploymentStatus(streamId: string): any[] {
    return this.deploymentStatuses.get(streamId) || [];
  }

  /**
   * Reconnect client and replay missed events
   * Implements event replay from last event ID (Requirement 16.2, 16.3)
   * Resumes normal real-time message delivery (Requirement 16.4)
   */
  reconnectClient(socket: Socket, streamId: string, lastEventId: string): void {
    const username = socket.data.username || "Unknown";
    console.log(
      `Reconnecting client ${socket.id} (${username}) to stream ${streamId}, last event: ${lastEventId}`
    );

    const eventLog = this.eventLogs.get(streamId);
    if (!eventLog || eventLog.length === 0) {
      socket.emit("replay_complete", {
        eventsReplayed: 0,
        message: "No events to replay",
        timestamp: Date.now(),
      });
      console.log(`No event log found for stream ${streamId}`);
      return;
    }

    // Find events after lastEventId (Requirement 16.2)
    const lastEventIndex = eventLog.findIndex((event) => event.id === lastEventId);

    let missedEvents: EventLog[];
    if (lastEventIndex >= 0) {
      // Found the last event, replay everything after it
      missedEvents = eventLog.slice(lastEventIndex + 1);
      console.log(
        `Found last event at index ${lastEventIndex}, replaying ${missedEvents.length} events`
      );
    } else if (lastEventId === "") {
      // No last event ID provided, replay all events
      missedEvents = eventLog;
      console.log(`No last event ID provided, replaying all ${missedEvents.length} events`);
    } else {
      // Last event ID not found, might be too old
      // Replay recent events (last 100)
      missedEvents = eventLog.slice(-100);
      console.log(`Last event ID not found, replaying last ${missedEvents.length} events`);
    }

    // Replay missed events (Requirement 16.3)
    let replayedCount = 0;
    missedEvents.forEach((event) => {
      try {
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
          default:
            console.warn(`Unknown event type: ${event.eventType}`);
        }
        replayedCount++;
      } catch (error) {
        console.error(`Error replaying event ${event.id}:`, error);
      }
    });

    // Notify client that replay is complete and normal delivery resumes (Requirement 16.4)
    socket.emit("replay_complete", {
      eventsReplayed: replayedCount,
      lastEventId: missedEvents.length > 0 ? missedEvents[missedEvents.length - 1].id : lastEventId,
      message: "Event replay complete, resuming normal message delivery",
      timestamp: Date.now(),
    });

    console.log(
      `Successfully replayed ${replayedCount} events for client ${socket.id} (${username})`
    );
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
   * Returns the event ID for client tracking
   */
  private logEvent(
    streamId: string,
    eventType: "chat" | "purchase" | "price_update" | "graduation",
    payload: any
  ): string {
    const eventLog = this.eventLogs.get(streamId);

    const eventId = this.generateEventId();
    const event: EventLog = {
      id: eventId,
      streamId,
      eventType,
      payload,
      timestamp: Date.now(),
    };

    if (eventLog) {
      eventLog.push(event);

      // Keep only last 1000 events per stream
      if (eventLog.length > 1000) {
        eventLog.shift();
      }
    }

    return eventId;
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

  /**
   * Get the latest event ID for a stream
   * Useful for clients to track their position in the event log
   */
  getLatestEventId(streamId: string): string | null {
    const eventLog = this.eventLogs.get(streamId);
    if (!eventLog || eventLog.length === 0) {
      return null;
    }
    return eventLog[eventLog.length - 1].id;
  }

  /**
   * Get event log statistics for monitoring
   */
  getEventLogStats(streamId: string): {
    eventCount: number;
    oldestEventTimestamp: number | null;
    newestEventTimestamp: number | null;
  } {
    const eventLog = this.eventLogs.get(streamId);
    if (!eventLog || eventLog.length === 0) {
      return { eventCount: 0, oldestEventTimestamp: null, newestEventTimestamp: null };
    }
    return {
      eventCount: eventLog.length,
      oldestEventTimestamp: eventLog[0].timestamp,
      newestEventTimestamp: eventLog[eventLog.length - 1].timestamp,
    };
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
