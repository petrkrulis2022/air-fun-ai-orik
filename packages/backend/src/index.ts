import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import streamingRoutes from "./routes/streaming.routes.js";
import { mediaServerService } from "./services/media-server.service.js";
import { realtimeService } from "./services/realtime.service.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/auth", authRoutes);
app.use("/streams", streamingRoutes);

// Initialize media server and start HTTP server
async function startServer() {
  try {
    // Initialize mediasoup workers
    await mediaServerService.initialize(2);
    console.log("Media server initialized");

    // Initialize Socket.io server
    realtimeService.initialize(httpServer);
    console.log("Real-time communication service initialized");

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

export default app;
