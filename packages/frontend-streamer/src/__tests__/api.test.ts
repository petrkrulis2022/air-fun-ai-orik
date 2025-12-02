import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, ApiError } from "../utils/api";

// Mock fetch globally
global.fetch = vi.fn();

describe("API Utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should make GET request successfully", async () => {
    const mockData = { id: "1", name: "Test" };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await api.get("/test");
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/test"),
      expect.objectContaining({ method: "GET" })
    );
  });

  it("should make POST request with data", async () => {
    const mockData = { success: true };
    const postData = { name: "Test" };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await api.post("/test", postData);
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/test"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(postData),
      })
    );
  });

  it("should throw ApiError on failed request", async () => {
    const errorMessage = "Not found";
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: errorMessage }),
    });

    await expect(api.get("/test")).rejects.toThrow(ApiError);
  });

  it("should include authorization header when token is present", async () => {
    const mockData = { success: true };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    // Mock auth store to return a token
    vi.mock("../store/authStore", () => ({
      useAuthStore: {
        getState: () => ({ accessToken: "test-token" }),
      },
    }));

    await api.get("/test");

    const fetchCall = (global.fetch as any).mock.calls[0];
    const headers = fetchCall[1].headers;
    expect(headers["Authorization"]).toBeDefined();
  });
});
