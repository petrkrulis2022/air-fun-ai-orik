import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import streamingRoutes from "./routes/streaming.routes.js";
import tokenRoutes from "./routes/token.routes.js";
import purchaseRoutes from "./routes/purchase.routes.js";
import agentRoutes from "./routes/agent.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import { mediaServerService } from "./services/media-server.service.js";
import { realtimeService } from "./services/realtime.service.js";
import { apiLimiter, authLimiter } from "./middleware/rate-limit.middleware.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.middleware.js";
import { sanitizeInput } from "./middleware/validation.middleware.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Input sanitization
app.use(sanitizeInput);

// Health check endpoint (no rate limiting)
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Apply rate limiting to all API routes
app.use("/api", apiLimiter);

// Routes with specific rate limiting
app.use("/auth", authLimiter, authRoutes);
app.use("/streams", streamingRoutes);
app.use("/tokens", tokenRoutes);
app.use("/purchases", purchaseRoutes);
app.use("/agents", agentRoutes);
app.use("/analytics", analyticsRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

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
