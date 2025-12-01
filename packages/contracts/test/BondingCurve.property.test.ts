import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import * as fc from "fast-check";
import { BondingCurve, AIRToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Feature: air-fun-mvp, Property 1: Bonding Curve Price Monotonicity
 * Validates: Requirements 8.4
 *
 * For any token, if tokens are purchased increasing the supply from S1 to S2 where S2 > S1,
 * then the price at S2 must be greater than or equal to the price at S1.
 */
describe("Property 1: Bonding Curve Price Monotonicity", () => {
  let bondingCurve: BondingCurve;
  let memecoin: AIRToken;
  let usdc: AIRToken;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let platform: SignerWithAddress;

  beforeEach(async () => {
    [owner, creator, platform] = await ethers.getSigners();

    // Deploy mock tokens
    const TokenFactory = await ethers.getContractFactory("AIRToken");
    memecoin = await TokenFactory.deploy();
    usdc = await TokenFactory.deploy();

    // Deploy bonding curve
    const BondingCurveFactory = await ethers.getContractFactory("BondingCurve");
    const totalSupply = ethers.parseEther("800000000"); // 800 million tokens

    bondingCurve = await BondingCurveFactory.deploy(
      await usdc.getAddress(),
      creator.address,
      platform.address,
      totalSupply
    );

    // Initialize with memecoin address
    await bondingCurve.initialize(await memecoin.getAddress());

    // Transfer memecoins to bonding curve
    await memecoin.transfer(await bondingCurve.getAddress(), totalSupply);
  });

  it("should verify that price increases monotonically as tokens are sold", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate two supply values where s2 > s1
        fc.integer({ min: 0, max: 1000000 }),
        fc.integer({ min: 1, max: 1000 }),
        async (s1, increment) => {
          const s2 = s1 + increment;

          // Calculate prices at both supply levels
          const price1 = await bondingCurve.calculatePrice(s1);
          const price2 = await bondingCurve.calculatePrice(s2);

          // Price at s2 must be >= price at s1 (monotonic increase)
          expect(price2).to.be.gte(price1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should verify that price strictly increases for meaningful increments", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Use realistic token amounts (millions to hundreds of millions)
        fc.integer({ min: 1000000, max: 500000000 }),
        // Use meaningful increments (at least 0.1% of sold amount)
        fc.integer({ min: 1000, max: 1000000 }),
        async (sold, increment) => {
          const price1 = await bondingCurve.calculatePrice(sold);
          const price2 = await bondingCurve.calculatePrice(sold + increment);

          // For meaningful increments, price must increase
          // Allow for cases where both might be 0 at very small scales
          if (price1 > 0) {
            expect(price2).to.be.gte(price1);
            // If increment is significant relative to sold, expect strict increase
            if (increment > sold / 1000) {
              expect(price2).to.be.gt(price1);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should verify quadratic relationship: price = k * sold²", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 100000 }), async (sold) => {
        const price = await bondingCurve.calculatePrice(sold);
        const K = await bondingCurve.K();
        const K_SCALE = await bondingCurve.K_SCALE();

        // Calculate expected price: (sold² * K) / K_SCALE
        const expectedPrice = (BigInt(sold) * BigInt(sold) * K) / K_SCALE;

        expect(price).to.equal(expectedPrice);
      }),
      { numRuns: 100 }
    );
  });
});
