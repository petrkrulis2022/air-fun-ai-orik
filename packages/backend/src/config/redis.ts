import { createClient, RedisClientType } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let redisClient: RedisClientType | null = null;
let redisAvailable = true;
let connectionAttempted = false;

export async function getRedisClient(): Promise<RedisClientType | null> {
  // If we already know Redis is unavailable, return null immediately
  if (!redisAvailable && connectionAttempted) {
    return null;
  }

  if (!redisClient) {
    connectionAttempted = true;
    try {
      redisClient = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 2000, // 2 second timeout
          reconnectStrategy: false, // Don't auto-reconnect
        },
      });

      redisClient.on("error", (err) => {
        console.error("Redis Client Error:", err);
        redisAvailable = false;
      });

      await redisClient.connect();
      console.log("Redis connected successfully");
    } catch (err) {
      console.warn("⚠️  Redis not available, caching disabled:", err);
      redisAvailable = false;
      redisClient = null;
      return null;
    }
  }

  return redisClient;
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

export function isRedisAvailable(): boolean {
  return redisAvailable;
}

export default getRedisClient;
