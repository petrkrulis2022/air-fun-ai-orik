import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import * as fc from "fast-check";
import { LiquidityPoolFactory, AIRToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Feature: air-fun-mvp, Property 4: Graduation Threshold Consistency
 * Validates: Requirements 12.1
 *
 * For any token, graduation should occur if and only if the market cap reaches or exceeds $69,000.
 */
describe("Property 4: Graduation Threshold Consistency", () => {
  let liquidityPoolFactory: LiquidityPoolFactory;
  let airToken: AIRToken;
  let memecoin: AIRToken;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;

  const GRADUATION_THRESHOLD = 69_000n * 10n ** 6n; // $69,000 in USDC (6 decimals)

  beforeEach(async () => {
    [owner, creator] = await ethers.getSigners();

    // Deploy AIR token
    const TokenFactory = await ethers.getContractFactory("AIRToken");
    airToken = await TokenFactory.deploy();

    // Deploy memecoin
    memecoin = await TokenFactory.deploy();

    // Deploy liquidity pool factory
    const LiquidityPoolFactoryFactory = await ethers.getContractFactory("LiquidityPoolFactory");
    liquidityPoolFactory = await LiquidityPoolFactoryFactory.deploy(await airToken.getAddress());
  });

  it("should verify that graduation eligibility is true if and only if market cap >= $69,000", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random price (in USDC with 6 decimals)
        fc.bigInt({ min: 1n, max: 1000000n * 10n ** 6n }), // $0.000001 to $1,000,000
        // Generate random tokens sold (in token decimals - 18)
        fc.bigInt({ min: 1n, max: 1000000000n * 10n ** 18n }), // 1 to 1 billion tokens
        async (currentPrice, tokensSold) => {
          // Calculate market cap: (currentPrice * tokensSold) / 10^18
          const marketCap = (currentPrice * tokensSold) / 10n ** 18n;

          // Check graduation eligibility (use staticCall since it emits events)
          const isEligible = await liquidityPoolFactory.checkGraduationEligibility.staticCall(
            await memecoin.getAddress(),
            currentPrice,
            tokensSold
          );

          // Verify: eligible if and only if marketCap >= GRADUATION_THRESHOLD
          if (marketCap >= GRADUATION_THRESHOLD) {
            expect(isEligible).to.be.true;
          } else {
            expect(isEligible).to.be.false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should verify graduation threshold boundary conditions", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate values around the threshold
        fc.integer({ min: -1000, max: 1000 }),
        fc.bigInt({ min: 1n, max: 1000000000n * 10n ** 18n }),
        async (thresholdOffset, tokensSold) => {
          // Calculate price that would put us at threshold + offset
          // marketCap = (price * tokensSold) / 10^18
          // price = (marketCap * 10^18) / tokensSold
          const targetMarketCap = GRADUATION_THRESHOLD + BigInt(thresholdOffset);

          // Avoid division by zero
          if (tokensSold === 0n || targetMarketCap <= 0n) return;

          const currentPrice = (targetMarketCap * 10n ** 18n) / tokensSold;

          // Skip if price is unrealistic (too high)
          if (currentPrice > 1000000n * 10n ** 6n) return;

          const isEligible = await liquidityPoolFactory.checkGraduationEligibility.staticCall(
            await memecoin.getAddress(),
            currentPrice,
            tokensSold
          );

          // Recalculate market cap to account for rounding
          const actualMarketCap = (currentPrice * tokensSold) / 10n ** 18n;

          if (actualMarketCap >= GRADUATION_THRESHOLD) {
            expect(isEligible).to.be.true;
          } else {
            expect(isEligible).to.be.false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should verify that graduation threshold is exactly $69,000", async () => {
    // Test exact threshold value
    const tokensSold = ethers.parseEther("1000000"); // 1 million tokens
    const exactPrice = (GRADUATION_THRESHOLD * 10n ** 18n) / tokensSold;

    const isEligible = await liquidityPoolFactory.checkGraduationEligibility.staticCall(
      await memecoin.getAddress(),
      exactPrice,
      tokensSold
    );

    expect(isEligible).to.be.true;

    // Test just below threshold
    const belowPrice = exactPrice - 1n;
    const isEligibleBelow = await liquidityPoolFactory.checkGraduationEligibility.staticCall(
      await memecoin.getAddress(),
      belowPrice,
      tokensSold
    );

    // Recalculate to check if we're actually below due to rounding
    const actualMarketCapBelow = (belowPrice * tokensSold) / 10n ** 18n;
    if (actualMarketCapBelow < GRADUATION_THRESHOLD) {
      expect(isEligibleBelow).to.be.false;
    } else {
      expect(isEligibleBelow).to.be.true;
    }
  });

  it("should verify consistency across different price and supply combinations", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.bigInt({ min: 1n, max: 100000n * 10n ** 6n }), // price1
        fc.bigInt({ min: 1n, max: 100000n * 10n ** 6n }), // price2
        fc.bigInt({ min: 1000000n, max: 1000000000n * 10n ** 18n }), // tokensSold1
        fc.bigInt({ min: 1000000n, max: 1000000000n * 10n ** 18n }), // tokensSold2
        async (price1, price2, tokensSold1, tokensSold2) => {
          const marketCap1 = (price1 * tokensSold1) / 10n ** 18n;
          const marketCap2 = (price2 * tokensSold2) / 10n ** 18n;

          const isEligible1 = await liquidityPoolFactory.checkGraduationEligibility.staticCall(
            await memecoin.getAddress(),
            price1,
            tokensSold1
          );

          const isEligible2 = await liquidityPoolFactory.checkGraduationEligibility.staticCall(
            await memecoin.getAddress(),
            price2,
            tokensSold2
          );

          // Both should follow the same rule
          expect(isEligible1).to.equal(marketCap1 >= GRADUATION_THRESHOLD);
          expect(isEligible2).to.equal(marketCap2 >= GRADUATION_THRESHOLD);

          // If marketCap1 > marketCap2 and marketCap1 is eligible, then marketCap2 should not be eligible
          if (marketCap1 > marketCap2 && isEligible1) {
            if (marketCap2 < GRADUATION_THRESHOLD) {
              expect(isEligible2).to.be.false;
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should verify that market cap calculation is consistent with graduation check", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.bigInt({ min: 1n, max: 1000000n * 10n ** 6n }),
        fc.bigInt({ min: 1000000n, max: 1000000000n * 10n ** 18n }),
        async (currentPrice, tokensSold) => {
          // Calculate market cap manually
          const calculatedMarketCap = (currentPrice * tokensSold) / 10n ** 18n;

          // Check graduation eligibility
          const isEligible = await liquidityPoolFactory.checkGraduationEligibility.staticCall(
            await memecoin.getAddress(),
            currentPrice,
            tokensSold
          );

          // The eligibility should match our manual calculation
          const expectedEligibility = calculatedMarketCap >= GRADUATION_THRESHOLD;
          expect(isEligible).to.equal(expectedEligibility);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should verify that increasing market cap eventually reaches graduation", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.bigInt({ min: 1n, max: 10000n * 10n ** 6n }), // Starting price
        fc.bigInt({ min: 1000000n, max: 100000000n * 10n ** 18n }), // Starting tokens sold
        fc.integer({ min: 2, max: 10 }), // Multiplier
        async (startPrice, startTokensSold, multiplier) => {
          const startMarketCap = (startPrice * startTokensSold) / 10n ** 18n;

          // If we're already above threshold, skip
          if (startMarketCap >= GRADUATION_THRESHOLD) return;

          // Multiply price to reach above threshold
          const multipliedPrice = startPrice * BigInt(multiplier);

          // Skip if price becomes unrealistic
          if (multipliedPrice > 1000000n * 10n ** 6n) return;

          const newMarketCap = (multipliedPrice * startTokensSold) / 10n ** 18n;

          // If new market cap is above threshold, should be eligible
          if (newMarketCap >= GRADUATION_THRESHOLD) {
            const isEligible = await liquidityPoolFactory.checkGraduationEligibility.staticCall(
              await memecoin.getAddress(),
              multipliedPrice,
              startTokensSold
            );
            expect(isEligible).to.be.true;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
