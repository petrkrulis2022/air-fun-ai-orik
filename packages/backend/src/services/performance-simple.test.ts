// Simplified Performance Tests for Task 15.4
// Tests bonding curve calculation performance without Redis dependency

import { describe, it, expect } from "vitest";
import { BondingCurveService } from "./bonding-curve.service.js";

describe("Performance Tests - Bonding Curve Calculations", () => {
  describe("Bonding Curve Calculation Performance", () => {
    it("should complete purchase cost calculations in less than 100ms (p95)", () => {
      const bondingCurveService = new BondingCurveService();
      const iterations = 100;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const tokensSold = Math.floor(Math.random() * 1000000);
        const tokensToBuy = Math.floor(Math.random() * 10000) + 1;

        const startTime = performance.now();
        bondingCurveService.calculatePurchaseCost(tokensSold, tokensToBuy);
        const duration = performance.now() - startTime;

        durations.push(duration);
      }

      const p95Duration = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)];
      expect(p95Duration).toBeLessThan(100);
    });

    it("should complete price calculations in less than 50ms (p95)", () => {
      const bondingCurveService = new BondingCurveService();
      const iterations = 100;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const tokensSold = Math.floor(Math.random() * 1000000);

        const startTime = performance.now();
        bondingCurveService.calculatePrice(tokensSold);
        const duration = performance.now() - startTime;

        durations.push(duration);
      }

      const p95Duration = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)];
      expect(p95Duration).toBeLessThan(50);
    });
  });
});
