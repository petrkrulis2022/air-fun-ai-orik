// Auth Service Unit Tests
// This file contains unit tests for auth service
// Property tests are in auth.property.test.ts

import { describe, it, expect, beforeEach, vi } from "vitest";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { AuthService } from "./auth.service.js";
import { generateAccessToken, verifyAccessToken } from "../utils/jwt.js";
import { verifyWalletSignature } from "../utils/crypto.js";
import { supabase } from "../config/supabase.js";

// Mock dependencies
vi.mock("../config/supabase.js", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("../utils/crypto.js", () => ({
  verifyWalletSignature: vi.fn(),
}));

describe("Auth Service - Unit Tests", () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe("Wallet Signature Verification", () => {
    it("should successfully authenticate with valid wallet signature", async () => {
      const mockAddress = "0x1234567890123456789012345678901234567890";
      const mockSignature = "0xvalidsignature";
      const mockMessage = "Sign this message";
      const mockUserId = "user-123";

      // Mock signature verification
      vi.mocked(verifyWalletSignature).mockReturnValue(true);

      // Mock database responses
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            users: {
              id: mockUserId,
              role: "viewer",
              username: "testuser",
              created_at: Date.now(),
            },
          },
        }),
        insert: vi.fn().mockReturnThis(),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const result = await authService.connectWallet(
        "metamask",
        mockAddress,
        mockSignature,
        mockMessage,
        "base"
      );

      expect(verifyWalletSignature).toHaveBeenCalledWith(mockAddress, mockSignature, mockMessage);
      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result).toHaveProperty("user");
      expect(result.user.id).toBe(mockUserId);
    });

    it("should reject invalid wallet signature", async () => {
      const mockAddress = "0x1234567890123456789012345678901234567890";
      const mockSignature = "0xinvalidsignature";
      const mockMessage = "Sign this message";

      // Mock signature verification to fail
      vi.mocked(verifyWalletSignature).mockReturnValue(false);

      await expect(
        authService.connectWallet("metamask", mockAddress, mockSignature, mockMessage, "base")
      ).rejects.toThrow("Invalid wallet signature");

      expect(verifyWalletSignature).toHaveBeenCalledWith(mockAddress, mockSignature, mockMessage);
    });
  });

  describe("JWT Token Generation and Validation", () => {
    it("should generate valid access token with correct payload", () => {
      const userId = "test-user-123";
      const role = "streamer";

      const token = generateAccessToken(userId, role);
      const payload = verifyAccessToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(userId);
      expect(payload?.role).toBe(role);
      expect(payload?.type).toBe("access");
    });

    it("should generate tokens with future expiration time", () => {
      const userId = "test-user-456";
      const role = "viewer";

      const accessToken = generateAccessToken(userId, role);
      const decoded = jwt.decode(accessToken) as any;

      expect(decoded).not.toBeNull();
      expect(decoded.exp).toBeDefined();

      const now = Math.floor(Date.now() / 1000);
      expect(decoded.exp).toBeGreaterThan(now);
    });

    it("should reject invalid tokens", () => {
      const invalidToken = "invalid.token.string";
      const payload = verifyAccessToken(invalidToken);

      expect(payload).toBeNull();
    });

    it("should reject expired tokens", () => {
      // Create a token that's already expired
      const expiredToken = jwt.sign(
        { userId: "test", role: "viewer", type: "access" },
        process.env.JWT_SECRET || "default_secret_for_testing",
        { expiresIn: "-1h" } // Expired 1 hour ago
      );

      const payload = verifyAccessToken(expiredToken);
      expect(payload).toBeNull();
    });
  });

  describe("Password Hashing and Comparison", () => {
    it("should hash password correctly", async () => {
      const password = "testPassword123!";
      const hash = await bcrypt.hash(password, 10);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it("should verify correct password", async () => {
      const password = "mySecurePassword456";
      const hash = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "correctPassword";
      const wrongPassword = "wrongPassword";
      const hash = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it("should generate different hashes for same password (salt)", async () => {
      const password = "samePassword123";
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);

      // Hashes should be different due to salt
      expect(hash1).not.toBe(hash2);

      // But both should verify correctly
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });

  describe("Email Registration", () => {
    it("should successfully register new user with email", async () => {
      const mockEmail = "test@example.com";
      const mockPassword = "securePassword123";
      const mockUsername = "testuser";
      const mockUserId = "new-user-123";

      // Mock database responses
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }), // No existing user
        insert: vi.fn().mockReturnThis(),
      };

      // First call returns null (no existing user), second call returns new user
      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockSupabaseChain as any)
        .mockReturnValueOnce({
          ...mockSupabaseChain,
          single: vi.fn().mockResolvedValue({
            data: {
              id: mockUserId,
              role: "viewer",
              email: mockEmail,
              username: mockUsername,
              created_at: Date.now(),
            },
          }),
        } as any);

      const result = await authService.registerEmail(mockEmail, mockPassword, mockUsername);

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result.user.email).toBe(mockEmail);
      expect(result.user.username).toBe(mockUsername);
    });

    it("should reject registration with existing email", async () => {
      const mockEmail = "existing@example.com";
      const mockPassword = "password123";
      const mockUsername = "testuser";

      // Mock existing user
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "existing-user", email: mockEmail },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      await expect(
        authService.registerEmail(mockEmail, mockPassword, mockUsername)
      ).rejects.toThrow("Email already registered");
    });
  });

  describe("Email Login", () => {
    it("should successfully login with correct credentials", async () => {
      const mockEmail = "user@example.com";
      const mockPassword = "correctPassword";
      const mockPasswordHash = await bcrypt.hash(mockPassword, 10);
      const mockUserId = "user-123";

      // Mock database response
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockUserId,
            role: "viewer",
            email: mockEmail,
            password_hash: mockPasswordHash,
            username: "testuser",
            created_at: Date.now(),
          },
        }),
        insert: vi.fn().mockReturnThis(),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const result = await authService.loginEmail(mockEmail, mockPassword);

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result.user.email).toBe(mockEmail);
    });

    it("should reject login with incorrect password", async () => {
      const mockEmail = "user@example.com";
      const correctPassword = "correctPassword";
      const wrongPassword = "wrongPassword";
      const mockPasswordHash = await bcrypt.hash(correctPassword, 10);

      // Mock database response
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "user-123",
            email: mockEmail,
            password_hash: mockPasswordHash,
          },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      await expect(authService.loginEmail(mockEmail, wrongPassword)).rejects.toThrow(
        "Invalid email or password"
      );
    });

    it("should reject login with non-existent email", async () => {
      const mockEmail = "nonexistent@example.com";
      const mockPassword = "password123";

      // Mock database response - no user found
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      await expect(authService.loginEmail(mockEmail, mockPassword)).rejects.toThrow(
        "Invalid email or password"
      );
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limit of 10 attempts per IP per minute", async () => {
      // This test verifies the rate limit configuration
      const { authLimiter } = await import("../middleware/rate-limit.middleware.js");

      expect(authLimiter).toBeDefined();

      // Access the options from the rate limiter
      const options = (authLimiter as any).options || authLimiter;

      expect(options.windowMs).toBe(60 * 1000); // 1 minute
      expect(options.max).toBe(10); // 10 attempts
    });

    it("should have correct rate limit message", async () => {
      const { authLimiter } = await import("../middleware/rate-limit.middleware.js");

      const options = (authLimiter as any).options || authLimiter;

      expect(options.message).toEqual({
        code: "AUTH_RATE_LIMIT_EXCEEDED",
        message: "Too many authentication attempts, please try again later",
        retryable: true,
      });
    });
  });
});
