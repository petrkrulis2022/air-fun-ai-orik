import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_for_testing";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "default_refresh_secret_for_testing";

if (
  process.env.NODE_ENV === "production" &&
  (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET)
) {
  throw new Error(
    "Missing JWT configuration. Please set JWT_SECRET and JWT_REFRESH_SECRET in .env"
  );
}

const ACCESS_TOKEN_EXPIRY = "1h"; // 1 hour
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

export interface JWTPayload {
  userId: string;
  role: string;
  type: "access" | "refresh";
}

/**
 * Generate JWT access token with 1-hour expiration
 * @param userId - User ID
 * @param role - User role (streamer or viewer)
 * @returns JWT access token
 */
export function generateAccessToken(userId: string, role: string): string {
  const payload: JWTPayload = {
    userId,
    role,
    type: "access",
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

/**
 * Generate JWT refresh token with 7-day expiration
 * @param userId - User ID
 * @param role - User role (streamer or viewer)
 * @returns JWT refresh token
 */
export function generateRefreshToken(userId: string, role: string): string {
  const payload: JWTPayload = {
    userId,
    role,
    type: "refresh",
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

/**
 * Verify and decode JWT access token
 * @param token - JWT access token
 * @returns Decoded payload or null if invalid
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "string" || !decoded || typeof decoded !== "object") {
      return null;
    }
    const payload = decoded as JWTPayload;
    if (payload.type !== "access") {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Verify and decode JWT refresh token
 * @param token - JWT refresh token
 * @returns Decoded payload or null if invalid
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    if (typeof decoded === "string" || !decoded || typeof decoded !== "object") {
      return null;
    }
    const payload = decoded as JWTPayload;
    if (payload.type !== "refresh") {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Calculate token expiration timestamp
 * @param expiresIn - Expiration time string (e.g., "1h", "7d")
 * @returns Expiration timestamp in milliseconds
 */
export function calculateExpirationTime(expiresIn: string): number {
  const now = Date.now();
  const match = expiresIn.match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error(`Invalid expiration format: ${expiresIn}`);
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return now + value * multipliers[unit];
}
