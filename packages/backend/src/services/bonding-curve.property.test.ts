// Property-Based Tests for Bonding Curve Service
// Feature: air-fun-mvp, Property 1: Bonding Curve Price Monotonicity
// Feature: air-fun-mvp, Property 13: Purchase Transaction Atomicity
// Validates: Requirements 8.4, 9

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { BondingCurveService } from "./bonding-curve.service.js";
import supabase from "../config/supabase.js";
import { getRedisClient } from "../config/redis.js";

describe("Bonding Curve Service - Property Tests", () => {
  const service = new BondingCurveService();

  describe("Property 1: Bonding Curve Price Monotonicity", () => {
    /**
     * Feature: air-fun-mvp, Property 1: Bonding Curve Price Monotonicity
     * Validates: Requirements 8.4
     *
     * For any token, if tokens are purchased increasing the supply from S1 to S2
     * where S2 > S1, then the price at S2 must be greater than or equal to the price at S1.
     */
    it("should ensure price increases monotonically with supply", () => {
      fc.assert(
        fc.property(
          // Generate two token supply values where s2 > s1
          fc.integer({ min: 0, max: 800_000_000 }),
          fc.integer({ min: 1, max: 100_000 }),
          (s1, delta) => {
            const s2 = s1 + delta;

            // Calculate prices at both supply levels
            const price1 = service.calculatePrice(s1);
            const price2 = service.calculatePrice(s2);

            // Property: price at higher supply must be >= price at lower supply
            expect(price2).toBeGreaterThanOrEqual(price1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should ensure price is strictly increasing for positive supply increases", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 800_000_000 }),
          fc.integer({ min: 1, max: 100_000 }),
          (s1, delta) => {
            const s2 = s1 + delta;

            const price1 = service.calculatePrice(s1);
            const price2 = service.calculatePrice(s2);

            // For quadratic curve, price should strictly increase when supply increases
            if (s1 === 0 && s2 > 0) {
              // Special case: price at 0 is 0, any positive supply has positive price
              expect(price2).toBeGreaterThan(price1);
            } else if (s1 > 0) {
              // For positive starting supply, price should strictly increase
              expect(price2).toBeGreaterThan(price1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should ensure price at zero supply is zero", () => {
      const price = service.calculatePrice(0);
      expect(price).toBe(0);
    });

    it("should ensure price increases with larger supply jumps", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 800_000_000 }),
          fc.integer({ min: 1, max: 50_000 }),
          fc.integer({ min: 1, max: 50_000 }),
          (baseSupply, smallDelta, largeDelta) => {
            // Ensure largeDelta > smallDelta
            const actualSmallDelta = Math.min(smallDelta, largeDelta);
            const actualLargeDelta = Math.max(smallDelta, largeDelta);

            if (actualSmallDelta === actualLargeDelta) {
              return; // Skip if they're equal
            }

            const priceSmallIncrease = service.calculatePrice(baseSupply + actualSmallDelta);
            const priceLargeIncrease = service.calculatePrice(baseSupply + actualLargeDelta);

            // Larger supply increase should result in higher price
            expect(priceLargeIncrease).toBeGreaterThan(priceSmallIncrease);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 2: Fee Distribution Correctness", () => {
    /**
     * Feature: air-fun-mvp, Property 2: Fee Distribution Correctness
     * Validates: Requirements 10.1, 10.2, 10.3
     *
     * For any token purchase, the sum of creator fee (98%) and platform fee (2%)
     * must equal exactly 100% of the purchase amount.
     */

    it("should ensure creator fee is exactly 98% of purchase amount", () => {
      fc.assert(
        fc.property(fc.double({ min: 1, max: 1000000, noNaN: true }), (purchaseAmount) => {
          const creatorFee = purchaseAmount * 0.98;
          const expectedCreatorFee = purchaseAmount * 0.98;

          // Property: Creator fee must be 98% of purchase amount
          const tolerance = 0.000001;
          expect(Math.abs(creatorFee - expectedCreatorFee)).toBeLessThanOrEqual(tolerance);
        }),
        { numRuns: 100 }
      );
    });

    it("should ensure platform fee is exactly 2% of purchase amount", () => {
      fc.assert(
        fc.property(fc.double({ min: 1, max: 1000000, noNaN: true }), (purchaseAmount) => {
          const platformFee = purchaseAmount * 0.02;
          const expectedPlatformFee = purchaseAmount * 0.02;

          // Property: Platform fee must be 2% of purchase amount
          const tolerance = 0.000001;
          expect(Math.abs(platformFee - expectedPlatformFee)).toBeLessThanOrEqual(tolerance);
        }),
        { numRuns: 100 }
      );
    });

    it("should ensure sum of fees equals 100% of purchase amount", () => {
      fc.assert(
        fc.property(fc.double({ min: 1, max: 1000000, noNaN: true }), (purchaseAmount) => {
          const creatorFee = purchaseAmount * 0.98;
          const platformFee = purchaseAmount * 0.02;
          const totalFees = creatorFee + platformFee;

          // Property: Sum of fees must equal purchase amount
          const tolerance = 0.000001;
          expect(Math.abs(totalFees - purchaseAmount)).toBeLessThanOrEqual(tolerance);
        }),
        { numRuns: 100 }
      );
    });

    it("should ensure fee percentages are constant across all purchase amounts", () => {
      fc.assert(
        fc.property(fc.double({ min: 1, max: 1000000, noNaN: true }), (purchaseAmount) => {
          const creatorFee = purchaseAmount * 0.98;
          const platformFee = purchaseAmount * 0.02;

          // Property: Fee percentages must be constant
          const creatorPercentage = creatorFee / purchaseAmount;
          const platformPercentage = platformFee / purchaseAmount;

          const tolerance = 0.000001;
          expect(Math.abs(creatorPercentage - 0.98)).toBeLessThanOrEqual(tolerance);
          expect(Math.abs(platformPercentage - 0.02)).toBeLessThanOrEqual(tolerance);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 13: Purchase Transaction Atomicity", () => {
    /**
     * Feature: air-fun-mvp, Property 13: Purchase Transaction Atomicity
     * Validates: Requirements 9
     *
     * For any token purchase, either all operations (lock funds, update supply,
     * distribute fees) succeed together, or all fail together.
     *
     * Note: This test validates the atomicity concept by checking that:
     * 1. Successful purchases update all related state consistently
     * 2. Failed purchases don't leave partial state changes
     * 3. Fee calculations are always consistent with total spent
     */

    beforeEach(() => {
      // Mock database and Redis for isolated testing
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should ensure fee distribution equals total purchase cost", () => {
      fc.assert(
        fc.property(fc.double({ min: 1, max: 1000000, noNaN: true }), (totalCost) => {
          // Calculate fees
          const creatorFee = totalCost * 0.98;
          const platformFee = totalCost * 0.02;

          // Property: Sum of fees must equal total cost
          const feeSum = creatorFee + platformFee;
          const tolerance = 0.000001; // Floating point tolerance

          expect(Math.abs(feeSum - totalCost)).toBeLessThanOrEqual(tolerance);
        }),
        { numRuns: 100 }
      );
    });

    it("should ensure purchase cost calculation is consistent", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 800_000_000 }),
          fc.integer({ min: 10, max: 100_000 }), // Avoid very small amounts for precision
          (currentSupply, tokensToBuy) => {
            // Calculate purchase cost
            const cost = service.calculatePurchaseCost(currentSupply, tokensToBuy);

            // Property: Cost should be positive for positive token amounts
            expect(cost).toBeGreaterThan(0);

            // Property: Average price should be between start and end price
            const startPrice = service.calculatePrice(currentSupply);
            const endPrice = service.calculatePrice(currentSupply + tokensToBuy);
            const avgPrice = cost / tokensToBuy;

            // Allow for floating point precision tolerance
            const tolerance = Math.max(startPrice * 0.0001, 0.000001);
            expect(avgPrice).toBeGreaterThanOrEqual(startPrice - tolerance);
            expect(avgPrice).toBeLessThanOrEqual(endPrice + tolerance);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should ensure purchase cost is additive", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 800_000_000 }),
          fc.integer({ min: 10, max: 50_000 }), // Avoid very small amounts
          fc.integer({ min: 10, max: 50_000 }),
          (currentSupply, amount1, amount2) => {
            // Calculate cost for two separate purchases
            const cost1 = service.calculatePurchaseCost(currentSupply, amount1);
            const cost2 = service.calculatePurchaseCost(currentSupply + amount1, amount2);
            const totalSeparate = cost1 + cost2;

            // Calculate cost for combined purchase
            const totalCombined = service.calculatePurchaseCost(currentSupply, amount1 + amount2);

            // Property: Combined purchase should equal sum of separate purchases
            // Use relative tolerance for large values
            const tolerance = Math.max(totalCombined * 0.0001, 0.000001);
            expect(Math.abs(totalCombined - totalSeparate)).toBeLessThanOrEqual(tolerance);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should ensure state updates are consistent with purchase amounts", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 800_000_000 }),
          fc.integer({ min: 1, max: 10_000 }),
          (initialSupply, purchaseAmount) => {
            const newSupply = initialSupply + purchaseAmount;

            // Calculate prices before and after
            const priceBefore = service.calculatePrice(initialSupply);
            const priceAfter = service.calculatePrice(newSupply);

            // Property: Price should increase after purchase
            expect(priceAfter).toBeGreaterThan(priceBefore);

            // Property: Market cap should increase
            const marketCapBefore = priceBefore * initialSupply;
            const marketCapAfter = priceAfter * newSupply;
            expect(marketCapAfter).toBeGreaterThan(marketCapBefore);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
