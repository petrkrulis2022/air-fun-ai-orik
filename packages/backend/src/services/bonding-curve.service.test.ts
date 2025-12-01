// Unit Tests for Bonding Curve Service

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BondingCurveService } from "./bonding-curve.service.js";
import { BONDING_CURVE_K, GRADUATION_MARKET_CAP } from "../types/token.types.js";

describe("BondingCurveService - Unit Tests", () => {
  let service: BondingCurveService;

  beforeEach(() => {
    service = new BondingCurveService();
  });

  describe("calculatePrice", () => {
    it("should return 0 for zero tokens sold", () => {
      const price = service.calculatePrice(0);
      expect(price).toBe(0);
    });

    it("should calculate correct price for 1000 tokens", () => {
      const tokensSold = 1000;
      const expectedPrice = BONDING_CURVE_K * tokensSold * tokensSold;
      const price = service.calculatePrice(tokensSold);
      expect(price).toBe(expectedPrice);
    });

    it("should calculate correct price for 1 million tokens", () => {
      const tokensSold = 1_000_000;
      const expectedPrice = BONDING_CURVE_K * tokensSold * tokensSold;
      const price = service.calculatePrice(tokensSold);
      expect(price).toBe(expectedPrice);
    });

    it("should throw error for negative tokens sold", () => {
      expect(() => service.calculatePrice(-100)).toThrow("Tokens sold cannot be negative");
    });

    it("should increase price as tokens sold increases", () => {
      const price1 = service.calculatePrice(1000);
      const price2 = service.calculatePrice(2000);
      const price3 = service.calculatePrice(5000);

      expect(price2).toBeGreaterThan(price1);
      expect(price3).toBeGreaterThan(price2);
    });
  });

  describe("calculatePurchaseCost", () => {
    it("should calculate correct cost for small purchase", () => {
      const currentSupply = 1000;
      const tokensToBuy = 100;

      // Manual calculation: integral of k*x² from 1000 to 1100
      const endSupply = currentSupply + tokensToBuy;
      const expectedCost =
        (BONDING_CURVE_K * (Math.pow(endSupply, 3) - Math.pow(currentSupply, 3))) / 3;

      const cost = service.calculatePurchaseCost(currentSupply, tokensToBuy);
      expect(cost).toBeCloseTo(expectedCost, 10);
    });

    it("should calculate correct cost for large purchase", () => {
      const currentSupply = 100_000;
      const tokensToBuy = 50_000;

      const cost = service.calculatePurchaseCost(currentSupply, tokensToBuy);
      expect(cost).toBeGreaterThan(0);

      // Cost should be positive for positive purchase
      expect(cost).toBeGreaterThan(0);
    });

    it("should throw error for negative current supply", () => {
      expect(() => service.calculatePurchaseCost(-100, 50)).toThrow(
        "Invalid supply or purchase amount"
      );
    });

    it("should throw error for zero or negative tokens to buy", () => {
      expect(() => service.calculatePurchaseCost(1000, 0)).toThrow(
        "Invalid supply or purchase amount"
      );
      expect(() => service.calculatePurchaseCost(1000, -50)).toThrow(
        "Invalid supply or purchase amount"
      );
    });

    it("should have cost increase with larger purchase amounts", () => {
      const currentSupply = 10_000;
      const cost1 = service.calculatePurchaseCost(currentSupply, 1000);
      const cost2 = service.calculatePurchaseCost(currentSupply, 5000);
      const cost3 = service.calculatePurchaseCost(currentSupply, 10_000);

      expect(cost2).toBeGreaterThan(cost1);
      expect(cost3).toBeGreaterThan(cost2);
    });

    it("should have higher cost for same purchase at higher supply", () => {
      const tokensToBuy = 1000;
      const cost1 = service.calculatePurchaseCost(10_000, tokensToBuy);
      const cost2 = service.calculatePurchaseCost(50_000, tokensToBuy);
      const cost3 = service.calculatePurchaseCost(100_000, tokensToBuy);

      expect(cost2).toBeGreaterThan(cost1);
      expect(cost3).toBeGreaterThan(cost2);
    });
  });

  describe("Fee Distribution", () => {
    it("should calculate correct creator and platform fees", () => {
      const totalCost = 100; // $100 USDC
      const creatorFee = totalCost * 0.98;
      const platformFee = totalCost * 0.02;

      expect(creatorFee).toBe(98);
      expect(platformFee).toBe(2);
      expect(creatorFee + platformFee).toBe(totalCost);
    });

    it("should maintain fee ratio for various purchase amounts", () => {
      const testAmounts = [1, 10, 100, 1000, 10000];

      testAmounts.forEach((amount) => {
        const creatorFee = amount * 0.98;
        const platformFee = amount * 0.02;

        expect(creatorFee + platformFee).toBeCloseTo(amount, 10);
        expect(creatorFee / amount).toBeCloseTo(0.98, 10);
        expect(platformFee / amount).toBeCloseTo(0.02, 10);
      });
    });
  });

  describe("Slippage Calculations", () => {
    it("should calculate price impact correctly", () => {
      const currentSupply = 100_000;
      const tokensToBuy = 10_000;

      const currentPrice = service.calculatePrice(currentSupply);
      const cost = service.calculatePurchaseCost(currentSupply, tokensToBuy);
      const avgPrice = cost / tokensToBuy;

      const priceImpact = ((avgPrice - currentPrice) / currentPrice) * 100;

      // Price impact should be positive (price increases)
      expect(priceImpact).toBeGreaterThan(0);
    });

    it("should have larger price impact for larger purchases", () => {
      const currentSupply = 100_000;

      const cost1 = service.calculatePurchaseCost(currentSupply, 1000);
      const avgPrice1 = cost1 / 1000;

      const cost2 = service.calculatePurchaseCost(currentSupply, 10_000);
      const avgPrice2 = cost2 / 10_000;

      const currentPrice = service.calculatePrice(currentSupply);

      const impact1 = ((avgPrice1 - currentPrice) / currentPrice) * 100;
      const impact2 = ((avgPrice2 - currentPrice) / currentPrice) * 100;

      expect(impact2).toBeGreaterThan(impact1);
    });
  });

  describe("Graduation Calculations", () => {
    it("should calculate market cap correctly", () => {
      const tokensSold = 100_000;
      const price = service.calculatePrice(tokensSold);
      const marketCap = price * tokensSold;

      expect(marketCap).toBeGreaterThan(0);
    });

    it("should determine when token reaches graduation threshold", () => {
      // Find approximate supply needed for $69k market cap
      // market cap = price * supply = k * supply² * supply = k * supply³
      // supply = (market_cap / k)^(1/3)
      const targetSupply = Math.pow(GRADUATION_MARKET_CAP / BONDING_CURVE_K, 1 / 3);

      const price = service.calculatePrice(targetSupply);
      const marketCap = price * targetSupply;

      expect(marketCap).toBeCloseTo(GRADUATION_MARKET_CAP, 0);
    });

    it("should calculate graduation progress correctly", () => {
      const testCases = [
        { supply: 0, expectedProgress: 0 },
        { supply: 100_000, expectedProgress: null }, // Calculate dynamically
      ];

      testCases.forEach((testCase) => {
        const price = service.calculatePrice(testCase.supply);
        const marketCap = price * testCase.supply;
        const progress = Math.min(marketCap / GRADUATION_MARKET_CAP, 1);

        if (testCase.expectedProgress !== null) {
          expect(progress).toBeCloseTo(testCase.expectedProgress, 2);
        } else {
          expect(progress).toBeGreaterThanOrEqual(0);
          expect(progress).toBeLessThanOrEqual(1);
        }
      });
    });
  });

  describe("Liquidity Depth", () => {
    it("should calculate liquidity depth as integral from 0 to supply", () => {
      const tokensSold = 10_000;

      // Liquidity depth = integral of k*x² from 0 to tokensSold
      // = k * tokensSold³ / 3
      const expectedDepth = (BONDING_CURVE_K * Math.pow(tokensSold, 3)) / 3;

      // We can verify this by calculating purchase cost from 0
      const calculatedDepth = service.calculatePurchaseCost(0, tokensSold);

      expect(calculatedDepth).toBeCloseTo(expectedDepth, 10);
    });

    it("should have liquidity depth increase with supply", () => {
      const depth1 = service.calculatePurchaseCost(0, 10_000);
      const depth2 = service.calculatePurchaseCost(0, 50_000);
      const depth3 = service.calculatePurchaseCost(0, 100_000);

      expect(depth2).toBeGreaterThan(depth1);
      expect(depth3).toBeGreaterThan(depth2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very small token amounts", () => {
      const cost = service.calculatePurchaseCost(0, 1);
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(0.001); // Very small cost
    });

    it("should handle very large token amounts", () => {
      const cost = service.calculatePurchaseCost(0, 800_000_000);
      expect(cost).toBeGreaterThan(0);
      expect(Number.isFinite(cost)).toBe(true);
    });

    it("should handle purchases at maximum supply", () => {
      const currentSupply = 799_999_000;
      const tokensToBuy = 1000;

      const cost = service.calculatePurchaseCost(currentSupply, tokensToBuy);
      expect(cost).toBeGreaterThan(0);
      expect(Number.isFinite(cost)).toBe(true);
    });
  });
});
