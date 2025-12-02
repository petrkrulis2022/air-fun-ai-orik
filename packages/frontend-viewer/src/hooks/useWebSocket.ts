// WebSocket hook for real-time updates

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { WS_URL } from "../config/api";
import type {
  ChatMessage,
  BondingCurveState,
  PurchaseNotification,
  GraduationNotification,
} from "../types";

interface UseWebSocketOptions {
  streamId: string;
  enabled: boolean;
  onChatMessage?: (message: ChatMessage) => void;
  onPriceUpdate?: (state: BondingCurveState) => void;
  onPurchaseNotification?: (notification: PurchaseNotification) => void;
  onGraduationAnnouncement?: (notification: GraduationNotification) => void;
}

export function useWebSocket({
  streamId,
  enabled,
  onChatMessage,
  onPriceUpdate,
  onPurchaseNotification,
  onGraduationAnnouncement,
}: UseWebSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!enabled || !streamId) return;

    const socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("WebSocket connected");
      setIsConnected(true);

      // Join stream room
      socket.emit("join-stream", { streamId });
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
    });

    // Chat messages
    socket.on("chat-message", (message: ChatMessage) => {
      onChatMessage?.(message);
    });

    // Price updates
    socket.on("price-update", (state: BondingCurveState) => {
      onPriceUpdate?.(state);
    });

    // Purchase notifications
    socket.on("purchase-notification", (notification: PurchaseNotification) => {
      onPurchaseNotification?.(notification);
    });

    // Graduation announcements
    socket.on("graduation-announcement", (notification: GraduationNotification) => {
      onGraduationAnnouncement?.(notification);
    });

    return socket;
  }, [
    streamId,
    enabled,
    onChatMessage,
    onPriceUpdate,
    onPurchaseNotification,
    onGraduationAnnouncement,
  ]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const sendChatMessage = useCallback(
    (message: string) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("send-chat-message", {
          streamId,
          message,
        });
      }
    },
    [streamId, isConnected]
  );

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    sendChatMessage,
    reconnect: connect,
  };
}
