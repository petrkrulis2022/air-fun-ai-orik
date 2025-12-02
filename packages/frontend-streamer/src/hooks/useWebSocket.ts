import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { WS_URL } from "../config/api";
import { useAuthStore } from "../store/authStore";

export function useWebSocket(streamId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!streamId || !accessToken) return;

    const socket = io(WS_URL, {
      auth: {
        token: accessToken,
      },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join-stream", streamId);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [streamId, accessToken]);

  const subscribe = (event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const unsubscribe = (event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  return {
    isConnected,
    subscribe,
    unsubscribe,
  };
}
