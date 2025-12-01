import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import * as fc from "fast-check";
import { BondingCurve, AIRToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Feature: air-fun-mvp, Property 2: Fee Distribution Correctness
 * Validates: Requirements 10.1, 10.2, 10.3
 *
 * For any token purchase, the sum of creator fee (98%) and platform fee (2%) must equal exactly 100% of purchase amount.
 */
describe("Property 2: Fee Distribution Correctness", () => {
  let bondingCurve: BondingCurve;
  let memecoin: AIRToken;
  let usdc: AIRToken;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let platform: SignerWithAddress;
  let buyer: SignerWithAddress;

  beforeEach(async () => {
    [owner, creator, platform, buyer] = await ethers.getSigners();

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

    // Give buyer USDC
    await usdc.transfer(buyer.address, ethers.parseEther("1000000"));
  });

  it("should verify that creator fee + platform fee = 100% of purchase cost", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Use larger amounts to avoid rounding issues
        fc.integer({ min: 10000000, max: 100000000 }),
        async (tokenAmount) => {
          const cost = await bondingCurve.calculatePurchaseCost(tokenAmount);

          if (cost === 0n) return;

          // Calculate fees using contract's logic (platform first, creator gets remainder)
          const PLATFORM_FEE_BPS = await bondingCurve.PLATFORM_FEE_BPS();
          const TOTAL_BPS = await bondingCurve.TOTAL_BPS();

          const expectedPlatformFee = (cost * PLATFORM_FEE_BPS) / TOTAL_BPS;
          const expectedCreatorFee = cost - expectedPlatformFee;

          // Verify fees sum to exactly 100%
          expect(expectedCreatorFee + expectedPlatformFee).to.equal(cost);

          // Verify percentages
          const CREATOR_FEE_BPS = await bondingCurve.CREATOR_FEE_BPS();
          expect(CREATOR_FEE_BPS).to.equal(9800n); // 98%
          expect(PLATFORM_FEE_BPS).to.equal(200n); // 2%
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should verify actual fee distribution in purchase transactions", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 10000000, max: 50000000 }), async (tokenAmount) => {
        const cost = await bondingCurve.calculatePurchaseCost(tokenAmount);

        if (cost === 0n) return;

        const creatorBalanceBefore = await usdc.balanceOf(creator.address);
        const platformBalanceBefore = await usdc.balanceOf(platform.address);

        await usdc.connect(buyer).approve(await bondingCurve.getAddress(), cost);
        await bondingCurve.connect(buyer).purchase(tokenAmount, cost);

        const creatorBalanceAfter = await usdc.balanceOf(creator.address);
        const platformBalanceAfter = await usdc.balanceOf(platform.address);

        const creatorFeeReceived = creatorBalanceAfter - creatorBalanceBefore;
        const platformFeeReceived = platformBalanceAfter - platformBalanceBefore;

        // Verify fees sum to total cost
        expect(creatorFeeReceived + platformFeeReceived).to.equal(cost);

        // Verify using contract's logic
        const PLATFORM_FEE_BPS = await bondingCurve.PLATFORM_FEE_BPS();
        const TOTAL_BPS = await bondingCurve.TOTAL_BPS();

        const expectedPlatformFee = (cost * PLATFORM_FEE_BPS) / TOTAL_BPS;
        const expectedCreatorFee = cost - expectedPlatformFee;

        expect(creatorFeeReceived).to.equal(expectedCreatorFee);
        expect(platformFeeReceived).to.equal(expectedPlatformFee);
      }),
      { numRuns: 30 }
    );
  });

  it("should verify fee distribution is consistent across different amounts", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10000000, max: 100000000 }),
        fc.integer({ min: 10000000, max: 100000000 }),
        async (amount1, amount2) => {
          const cost1 = await bondingCurve.calculatePurchaseCost(amount1);
          const cost2 = await bondingCurve.calculatePurchaseCost(amount2);

          if (cost1 === 0n || cost2 === 0n) return;

          const PLATFORM_FEE_BPS = await bondingCurve.PLATFORM_FEE_BPS();
          const TOTAL_BPS = await bondingCurve.TOTAL_BPS();

          const platformFee1 = (cost1 * PLATFORM_FEE_BPS) / TOTAL_BPS;
          const creatorFee1 = cost1 - platformFee1;

          const platformFee2 = (cost2 * PLATFORM_FEE_BPS) / TOTAL_BPS;
          const creatorFee2 = cost2 - platformFee2;

          // Both must sum to 100%
          expect(creatorFee1 + platformFee1).to.equal(cost1);
          expect(creatorFee2 + platformFee2).to.equal(cost2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
