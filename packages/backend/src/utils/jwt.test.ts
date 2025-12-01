import { describe, it, expect, beforeAll } from "vitest";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  calculateExpirationTime,
} from "./jwt.js";

// Set up test environment
beforeAll(() => {
  process.env.JWT_SECRET = "test_jwt_secret_key";
  process.env.JWT_REFRESH_SECRET = "test_jwt_refresh_secret_key";
});

describe("JWT Utils - Token Generation and Validation", () => {
  describe("Access Token", () => {
    it("should generate valid access token", () => {
      const userId = "test-user-123";
      const role = "streamer";

      const token = generateAccessToken(userId, role);

      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
    });

    it("should verify valid access token", () => {
      const userId = "test-user-456";
      const role = "viewer";

      const token = generateAccessToken(userId, role);
      const payload = verifyAccessToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(userId);
      expect(payload?.role).toBe(role);
      expect(payload?.type).toBe("access");
    });

    it("should reject invalid access token", () => {
      const invalidToken = "invalid.token.here";
      const payload = verifyAccessToken(invalidToken);

      expect(payload).toBeNull();
    });

    it("should reject refresh token as access token", () => {
      const userId = "test-user-789";
      const role = "streamer";

      const refreshToken = generateRefreshToken(userId, role);
      const payload = verifyAccessToken(refreshToken);

      // Should return null because type is "refresh", not "access"
      expect(payload).toBeNull();
    });
  });

  describe("Refresh Token", () => {
    it("should generate valid refresh token", () => {
      const userId = "test-user-123";
      const role = "viewer";

      const token = generateRefreshToken(userId, role);

      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
    });

    it("should verify valid refresh token", () => {
      const userId = "test-user-456";
      const role = "streamer";

      const token = generateRefreshToken(userId, role);
      const payload = verifyRefreshToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(userId);
      expect(payload?.role).toBe(role);
      expect(payload?.type).toBe("refresh");
    });

    it("should reject invalid refresh token", () => {
      const invalidToken = "invalid.refresh.token";
      const payload = verifyRefreshToken(invalidToken);

      expect(payload).toBeNull();
    });

    it("should reject access token as refresh token", () => {
      const userId = "test-user-789";
      const role = "viewer";

      const accessToken = generateAccessToken(userId, role);
      const payload = verifyRefreshToken(accessToken);

      // Should return null because type is "access", not "refresh"
      expect(payload).toBeNull();
    });
  });

  describe("Expiration Time Calculation", () => {
    it("should calculate expiration for seconds", () => {
      const now = Date.now();
      const expiresAt = calculateExpirationTime("30s");

      expect(expiresAt).toBeGreaterThan(now);
      expect(expiresAt).toBeLessThanOrEqual(now + 31000); // 30s + 1s buffer
    });

    it("should calculate expiration for minutes", () => {
      const now = Date.now();
      const expiresAt = calculateExpirationTime("5m");

      expect(expiresAt).toBeGreaterThan(now);
      expect(expiresAt).toBeLessThanOrEqual(now + 5 * 60 * 1000 + 1000);
    });

    it("should calculate expiration for hours", () => {
      const now = Date.now();
      const expiresAt = calculateExpirationTime("1h");

      expect(expiresAt).toBeGreaterThan(now);
      expect(expiresAt).toBeLessThanOrEqual(now + 60 * 60 * 1000 + 1000);
    });

    it("should calculate expiration for days", () => {
      const now = Date.now();
      const expiresAt = calculateExpirationTime("7d");

      expect(expiresAt).toBeGreaterThan(now);
      expect(expiresAt).toBeLessThanOrEqual(now + 7 * 24 * 60 * 60 * 1000 + 1000);
    });

    it("should throw error for invalid format", () => {
      expect(() => calculateExpirationTime("invalid")).toThrow();
    });
  });
});
