import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import jwt from "jsonwebtoken";
import { verifyAccessToken, generateAccessToken } from "../utils/jwt.js";

/**
 * Feature: air-fun-mvp, Property 5: Authentication Session Validity
 * Validates: Requirements 1.2, 2.3
 *
 * For any valid JWT token, the token must be verifiable and the expiration time must be in the future.
 */
describe("Property 5: Authentication Session Validity", () => {
  it("should verify that all valid JWT tokens are verifiable with future expiration", () => {
    fc.assert(
      fc.property(fc.uuid(), fc.constantFrom("streamer", "viewer"), (userId, role) => {
        const accessToken = generateAccessToken(userId, role);
        const payload = verifyAccessToken(accessToken);

        expect(payload).not.toBeNull();

        if (payload) {
          expect(payload.userId).toBe(userId);
          expect(payload.role).toBe(role);
          expect(payload.type).toBe("access");

          const decoded = jwt.decode(accessToken) as any;
          expect(decoded).not.toBeNull();

          const now = Math.floor(Date.now() / 1000);
          expect(decoded.exp).toBeGreaterThan(now);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should verify that tokens with matching userId and role can be validated", () => {
    fc.assert(
      fc.property(fc.uuid(), fc.constantFrom("streamer", "viewer"), (userId, role) => {
        const token = generateAccessToken(userId, role);
        const payload = verifyAccessToken(token);

        expect(payload).not.toBeNull();
        expect(payload?.userId).toBe(userId);
        expect(payload?.role).toBe(role);
      }),
      { numRuns: 100 }
    );
  });

  it("should verify that invalid tokens are rejected", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 10, maxLength: 200 }), (invalidToken) => {
        const payload = verifyAccessToken(invalidToken);
        expect(payload).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});
