import { describe, it, expect } from "vitest";
import { BondingCurveService } from "../bonding-curve.service";

/**
 * Performance Tests - Task 15.4
 * Requirements: 21, 22
 * Simplified tests focusing on bonding curve calculations without external dependencies
 */

describe("Performance Tests", () => {
  const bondingCurveService = new BondingCurveService();

  it("calculates bonding curve prices quickly", async () => {
    const iterations = 100;
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      bondingCurveService.calculatePrice(i * 1000);
      latencies.push(performance.now() - start);
    }

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p95 = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];

    console.log(
      `Bonding curve price calculation: avg=${avgLatency.toFixed(3)}ms, p95=${p95.toFixed(3)}ms`
    );

    expect(avgLatency).toBeLessThan(100); // Req 21.3: < 100ms
    expect(p95).toBeLessThan(100);
  });

  it("calculates purchase costs efficiently", async () => {
    const iterations = 100;
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const tokensSold = Math.floor(Math.random() * 1000000);
      const tokensToBuy = Math.floor(Math.random() * 10000) + 1;

      const start = performance.now();
      bondingCurveService.calculatePurchaseCost(tokensSold, tokensToBuy);
      latencies.push(performance.now() - start);
    }

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p95 = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];

    console.log(
      `Purchase cost calculation: avg=${avgLatency.toFixed(3)}ms, p95=${p95.toFixed(3)}ms`
    );

    expect(avgLatency).toBeLessThan(100);
    expect(p95).toBeLessThan(100);
  });

  it("handles high volume of price calculations", async () => {
    const numCalculations = 1000;
    const startTime = performance.now();

    for (let i = 0; i < numCalculations; i++) {
      bondingCurveService.calculatePrice(i * 100);
    }

    const totalDuration = performance.now() - startTime;
    const opsPerSecond = (numCalculations / totalDuration) * 1000;

    console.log(
      `High volume test: ${numCalculations} calculations in ${totalDuration.toFixed(2)}ms`
    );
    console.log(`Throughput: ${opsPerSecond.toFixed(2)} ops/second`);

    // Should handle at least 1000 ops/second
    expect(opsPerSecond).toBeGreaterThan(1000);
  });
});
