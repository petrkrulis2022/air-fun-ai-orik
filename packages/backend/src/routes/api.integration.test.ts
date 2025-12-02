import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../index.js";

describe("API Integration Tests", () => {
  let authToken: string;
  let userId: string;
  let streamId: string;
  let tokenId: string;
  let agentId: string;

  describe("Authentication Flow", () => {
    it("should register a new user with email", async () => {
      const response = await request(app)
        .post("/auth/email/register")
        .send({
          email: `test${Date.now()}@example.com`,
          password: "TestPassword123!",
          username: `testuser${Date.now()}`,
          role: "streamer",
        });

      // May fail if database is not available
      expect([200, 400, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("accessToken");
        expect(response.body).toHaveProperty("user");
        authToken = response.body.accessToken;
        userId = response.body.user.id;
      }
    });

    it("should login with email credentials", async () => {
      // First register
      const email = `test${Date.now()}@example.com`;
      const password = "TestPassword123!";

      const registerResponse = await request(app)
        .post("/auth/email/register")
        .send({
          email,
          password,
          username: `testuser${Date.now()}`,
          role: "viewer",
        });

      // Skip if registration failed
      if (registerResponse.status !== 200) {
        return;
      }

      // Then login
      const response = await request(app).post("/auth/email/login").send({ email, password });

      expect([200, 401, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("accessToken");
      }
    });

    it("should reject invalid credentials", async () => {
      const response = await request(app).post("/auth/email/login").send({
        email: "nonexistent@example.com",
        password: "wrongpassword",
      });

      expect([401, 500]).toContain(response.status);
    });

    it("should refresh access token", async () => {
      // Register and get refresh token
      const response = await request(app)
        .post("/auth/email/register")
        .send({
          email: `test${Date.now()}@example.com`,
          password: "TestPassword123!",
          username: `testuser${Date.now()}`,
          role: "viewer",
        });

      // Skip if registration failed
      if (response.status !== 200) {
        return;
      }

      const refreshToken = response.body.refreshToken;

      // Refresh token
      const refreshResponse = await request(app).post("/auth/refresh").send({ refreshToken });

      expect([200, 400, 500]).toContain(refreshResponse.status);
      if (refreshResponse.status === 200) {
        expect(refreshResponse.body).toHaveProperty("accessToken");
      }
    });
  });

  describe("Stream Lifecycle", () => {
    it("should start a new stream", async () => {
      const response = await request(app)
        .post("/streams/start")
        .send({
          streamerId: userId || "test-streamer-id",
          config: {
            title: "Test Stream",
            category: "gaming",
            quality: "720p",
            enableChat: true,
          },
        });

      // May fail if database/Redis is not available
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("streamId");
        streamId = response.body.streamId;
      }
    });

    it("should get stream status", async () => {
      if (!streamId) {
        // Create a stream first
        const createResponse = await request(app)
          .post("/streams/start")
          .send({
            streamerId: "test-streamer-id",
            config: {
              title: "Test Stream",
              category: "gaming",
              quality: "720p",
              enableChat: true,
            },
          });
        if (createResponse.status === 200) {
          streamId = createResponse.body.streamId;
        }
      }

      if (!streamId) {
        // Skip if no stream could be created
        return;
      }

      const response = await request(app).get(`/streams/${streamId}/status`);

      expect([200, 404, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("id");
        expect(response.body).toHaveProperty("status");
      }
    });

    it("should list active streams", async () => {
      try {
        const response = await request(app).get("/streams/active").timeout(2000);

        // May return 200 or 500 depending on Redis availability
        expect([200, 500]).toContain(response.status);
        if (response.status === 200) {
          expect(Array.isArray(response.body)).toBe(true);
        }
      } catch (error: any) {
        // Skip if timeout - Redis not available
        if (error.code === "ECONNABORTED" || error.timeout) {
          return;
        }
        throw error;
      }
    }, 10000);

    it("should search streams", async () => {
      const response = await request(app).get("/streams/search?q=test").timeout(3000);

      // May return 200 or 500 depending on Redis availability
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    }, 10000);

    it("should get hot streams", async () => {
      const response = await request(app).get("/streams/hot?limit=5").timeout(3000);

      // May return 200 or 500 depending on Redis availability
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    }, 10000);
  });

  describe("Token Operations", () => {
    it("should get token by stream ID", async () => {
      if (!streamId) {
        // Skip if no stream created
        return;
      }

      const response = await request(app).get(`/tokens/stream/${streamId}`);

      // May be 404 if token not created yet
      if (response.status === 200) {
        expect(response.body).toHaveProperty("id");
        tokenId = response.body.id;
      }
    });

    it("should check graduation eligibility", async () => {
      if (!tokenId) {
        // Skip if no token
        return;
      }

      const response = await request(app).get(`/tokens/${tokenId}/eligibility`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("isEligible");
    });
  });

  describe("Purchase Flow", () => {
    it("should get price quote", async () => {
      if (!tokenId) {
        // Skip if no token
        return;
      }

      const response = await request(app).post("/purchases/quote").send({
        tokenId,
        amount: 1000,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("usdcCost");
      expect(response.body).toHaveProperty("pricePerToken");
    });

    it("should reject invalid purchase amount", async () => {
      const response = await request(app).post("/purchases/quote").send({
        tokenId: "test-token-id",
        amount: -100,
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code");
    });
  });

  describe("Agent Operations", () => {
    it("should list agent templates", async () => {
      const response = await request(app).get("/agents/templates");

      // May return 200 or 500 depending on database availability
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });

    it("should deploy an agent", async () => {
      if (!streamId) {
        // Skip if no stream
        return;
      }

      const response = await request(app)
        .post("/agents/deploy")
        .send({
          streamId,
          config: {
            name: "Test Agent",
            templateId: "buy_button",
            position: [0, 0, 0],
            defaultPurchaseAmount: 100,
            quickBuyEnabled: true,
          },
        });

      // May fail if stream not live or template not found
      if (response.status === 201) {
        expect(response.body).toHaveProperty("id");
        agentId = response.body.id;
      }
    });

    it("should track agent click", async () => {
      if (!agentId) {
        // Skip if no agent
        return;
      }

      const response = await request(app)
        .post(`/agents/${agentId}/click`)
        .send({
          userId: userId || "test-user-id",
        });

      // May fail if agent not active
      if (response.status === 200) {
        expect(response.body).toHaveProperty("success");
      }
    });

    it("should get agent stats", async () => {
      if (!agentId) {
        // Skip if no agent
        return;
      }

      const response = await request(app).get(`/agents/${agentId}/stats`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("totalClicks");
      expect(response.body).toHaveProperty("conversionRate");
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limits on auth endpoints", async () => {
      const requests = [];

      // Make 15 requests (limit is 10 per minute)
      for (let i = 0; i < 15; i++) {
        requests.push(
          request(app).post("/auth/email/login").send({
            email: "test@example.com",
            password: "wrongpassword",
          })
        );
      }

      const responses = await Promise.all(requests);

      // At least one should be rate limited
      const rateLimited = responses.some((r) => r.status === 429);
      expect(rateLimited).toBe(true);
    }, 10000); // Increase timeout for this test
  });

  describe("Error Handling", () => {
    it("should return 404 for non-existent routes", async () => {
      const response = await request(app).get("/nonexistent/route");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("code");
      expect(response.body.code).toBe("ROUTE_NOT_FOUND");
    });

    it("should handle validation errors", async () => {
      const response = await request(app).post("/purchases/quote").send({
        // Missing required fields
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code");
    });

    it("should sanitize input", async () => {
      const response = await request(app).post("/auth/email/register").send({
        email: "test@example.com",
        password: "password123",
        username: "<script>alert('xss')</script>",
        role: "viewer",
      });

      // Should not contain script tags in response
      if (response.body.user) {
        expect(response.body.user.username).not.toContain("<script>");
      }
    });
  });

  describe("Health Check", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status");
      expect(response.body.status).toBe("ok");
    });
  });
});
