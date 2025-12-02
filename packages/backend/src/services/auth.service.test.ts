// Auth Service Unit Tests
// This file contains basic unit tests for auth service
// Property tests are in auth.property.test.ts

import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import fc from "fast-check";
import { generateAccessToken, verifyAccessToken } from "../utils/jwt.js";

describe("Auth Service - JWT Tests", () => {
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
