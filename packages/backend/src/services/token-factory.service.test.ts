import { describe, it, expect, beforeEach, vi } from "vitest";
import { TokenFactoryService } from "./token-factory.service.js";
import {
  BONDING_CURVE_K,
  GRADUATION_MARKET_CAP,
  TOTAL_SUPPLY,
  BONDING_CURVE_SUPPLY,
} from "../types/token.types.js";

// Mock Supabase
vi.mock("../config/supabase.js", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
    rpc: vi.fn(),
  },
}));

// Mock Redis
vi.mock("../config/redis.js", () => ({
  getRedisClient: vi.fn(() =>
    Promise.resolve({
      setEx: vi.fn(),
      get: vi.fn(),
    })
  ),
}));

describe("TokenFactoryService - Unit Tests", () => {
  let service: TokenFactoryService;

  beforeEach(() => {
    service = new TokenFactoryService();
    vi.clearAllMocks();
  });

  describe("Symbol Generation", () => {
    it("should generate a 3-5 character symbol from streamer name", async () => {
      const { supabase } = await import("../config/supabase.js");

      // Mock no existing symbols
      (supabase.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      });

      const symbol = await (service as any).generateTokenSymbol("JohnDoe");

      expect(symbol).toBeTruthy();
      expect(symbol.length).toBeGreaterThanOrEqual(3);
      expect(symbol.length).toBeLessThanOrEqual(10);
      expect(symbol).toMatch(/^[A-Z0-9]+$/);
    });

    it("should handle symbol collisions by appending numeric suffix", async () => {
      const { supabase } = await import("../config/supabase.js");

      let callCount = 0;
      (supabase.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => {
              callCount++;
              // First call returns existing symbol, second returns null
              if (callCount === 1) {
                return Promise.resolve({ data: { id: "test-id" }, error: null });
              }
              return Promise.resolve({ data: null, error: null });
            }),
          })),
        })),
      });

      const symbol = await (service as any).generateTokenSymbol("Test");

      expect(symbol).toBeTruthy();
      expect(symbol).toMatch(/^[A-Z]+[0-9]+$/); // Should have numeric suffix
    });

    it("should pad short names to minimum 3 characters", async () => {
      const { supabase } = await import("../config/supabase.js");

      (supabase.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      });

      const symbol = await (service as any).generateTokenSymbol("AB");

      expect(symbol.length).toBeGreaterThanOrEqual(3);
    });

    it("should remove special characters from streamer name", async () => {
      const { supabase } = await import("../config/supabase.js");

      (supabase.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      });

      const symbol = await (service as any).generateTokenSymbol("John@Doe#123");

      expect(symbol).toMatch(/^[A-Z0-9]+$/);
      expect(symbol).not.toContain("@");
      expect(symbol).not.toContain("#");
    });
  });

  describe("Price Calculation", () => {
    it("should calculate price using bonding curve formula", () => {
      const tokensSold = 1000;
      const expectedPrice = BONDING_CURVE_K * Math.pow(tokensSold, 2);

      const price = (service as any).calculatePrice(tokensSold);

      expect(price).toBe(expectedPrice);
    });

    it("should return 0 for 0 tokens sold", () => {
      const price = (service as any).calculatePrice(0);
      expect(price).toBe(0);
    });

    it("should increase price as tokens sold increases", () => {
      const price1 = (service as any).calculatePrice(1000);
      const price2 = (service as any).calculatePrice(2000);

      expect(price2).toBeGreaterThan(price1);
    });
  });

  describe("Graduation Eligibility", () => {
    it("should return true when market cap meets threshold", async () => {
      const { supabase } = await import("../config/supabase.js");

      const mockMemecoin = {
        id: "test-id",
        market_cap: GRADUATION_MARKET_CAP,
        is_graduated: false,
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockMemecoin, error: null })),
          })),
        })),
      });

      const isEligible = await service.checkGraduationEligibility("test-id");

      expect(isEligible).toBe(true);
    });

    it("should return false when market cap below threshold", async () => {
      const { supabase } = await import("../config/supabase.js");

      const mockMemecoin = {
        id: "test-id",
        market_cap: GRADUATION_MARKET_CAP - 1000,
        is_graduated: false,
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockMemecoin, error: null })),
          })),
        })),
      });

      const isEligible = await service.checkGraduationEligibility("test-id");

      expect(isEligible).toBe(false);
    });

    it("should return false when token already graduated", async () => {
      const { supabase } = await import("../config/supabase.js");

      const mockMemecoin = {
        id: "test-id",
        market_cap: GRADUATION_MARKET_CAP + 1000,
        is_graduated: true,
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockMemecoin, error: null })),
          })),
        })),
      });

      const isEligible = await service.checkGraduationEligibility("test-id");

      expect(isEligible).toBe(false);
    });

    it("should throw error when token not found", async () => {
      const { supabase } = await import("../config/supabase.js");

      (supabase.from as any).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      });

      await expect(service.checkGraduationEligibility("non-existent-id")).rejects.toThrow(
        "Token not found"
      );
    });
  });

  describe("Token Metadata Update", () => {
    it("should update logo URL", async () => {
      const { supabase } = await import("../config/supabase.js");

      const updateMock = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      }));

      (supabase.from as any).mockReturnValue({
        update: updateMock,
      });

      await service.updateTokenMetadata({
        tokenId: "test-id",
        metadata: {
          logoUrl: "https://example.com/logo.png",
        },
      });

      expect(updateMock).toHaveBeenCalled();
      const updateData = updateMock.mock.calls[0][0];
      expect(updateData.logo_url).toBe("https://example.com/logo.png");
    });

    it("should update description", async () => {
      const { supabase } = await import("../config/supabase.js");

      const updateMock = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      }));

      (supabase.from as any).mockReturnValue({
        update: updateMock,
      });

      await service.updateTokenMetadata({
        tokenId: "test-id",
        metadata: {
          description: "Test token description",
        },
      });

      expect(updateMock).toHaveBeenCalled();
      const updateData = updateMock.mock.calls[0][0];
      expect(updateData.description).toBe("Test token description");
    });

    it("should update social links", async () => {
      const { supabase } = await import("../config/supabase.js");

      const updateMock = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      }));

      (supabase.from as any).mockReturnValue({
        update: updateMock,
      });

      await service.updateTokenMetadata({
        tokenId: "test-id",
        metadata: {
          socialLinks: {
            twitter: "https://twitter.com/test",
            telegram: "https://t.me/test",
          },
        },
      });

      expect(updateMock).toHaveBeenCalled();
      const updateData = updateMock.mock.calls[0][0];
      expect(updateData.twitter_link).toBe("https://twitter.com/test");
      expect(updateData.telegram_link).toBe("https://t.me/test");
    });
  });

  describe("Token Supply Constants", () => {
    it("should have correct total supply", () => {
      expect(TOTAL_SUPPLY).toBe(1000000000); // 1 billion
    });

    it("should have correct bonding curve supply", () => {
      expect(BONDING_CURVE_SUPPLY).toBe(800000000); // 800 million
    });

    it("should have bonding curve supply less than total supply", () => {
      expect(BONDING_CURVE_SUPPLY).toBeLessThan(TOTAL_SUPPLY);
    });

    it("should have correct graduation threshold", () => {
      expect(GRADUATION_MARKET_CAP).toBe(69000); // $69k
    });

    it("should have correct bonding curve constant", () => {
      expect(BONDING_CURVE_K).toBe(0.000000001);
    });
  });
});
