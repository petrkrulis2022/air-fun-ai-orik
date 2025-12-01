import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import * as fc from "fast-check";
import { BondingCurve, Memecoin, AIRToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Feature: air-fun-mvp, Property 3: Token Supply Conservation
 * Validates: Requirements 5.3
 *
 * For any memecoin, the total supply must remain constant at 1 billion tokens,
 * and tokensSold must never exceed totalSupply.
 */
describe("Property 3: Token Supply Conservation", () => {
  let bondingCurve: BondingCurve;
  let memecoin: Memecoin;
  let usdc: AIRToken;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let platform: SignerWithAddress;
  let buyer: SignerWithAddress;

  const TOTAL_SUPPLY = ethers.parseEther("1000000000"); // 1 billion tokens
  const BONDING_CURVE_SUPPLY = ethers.parseEther("800000000"); // 800 million tokens
  const CREATOR_SUPPLY = ethers.parseEther("200000000"); // 200 million tokens

  beforeEach(async () => {
    [owner, creator, platform, buyer] = await ethers.getSigners();

    // Deploy mock USDC
    const TokenFactory = await ethers.getContractFactory("AIRToken");
    usdc = await TokenFactory.deploy();

    // Deploy bonding curve first
    const BondingCurveFactory = await ethers.getContractFactory("BondingCurve");
    bondingCurve = await BondingCurveFactory.deploy(
      await usdc.getAddress(),
      creator.address,
      platform.address,
      BONDING_CURVE_SUPPLY
    );

    // Deploy memecoin with bonding curve address
    const MemecoinFactory = await ethers.getContractFactory("Memecoin");
    memecoin = await MemecoinFactory.deploy(
      "Test Memecoin",
      "TEST",
      creator.address,
      await bondingCurve.getAddress()
    );

    // Initialize bonding curve with memecoin address
    await bondingCurve.initialize(await memecoin.getAddress());

    // Give buyer USDC
    await usdc.transfer(buyer.address, ethers.parseEther("1000000"));
  });

  it("should verify that total supply remains constant at 1 billion tokens", async () => {
    // Check initial total supply
    const totalSupply = await memecoin.totalSupply();
    expect(totalSupply).to.equal(TOTAL_SUPPLY);

    // Perform random purchases and verify total supply never changes
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1000000, max: 50000000 }), { minLength: 1, maxLength: 10 }),
        async (purchaseAmounts) => {
          // Reset state for each property test run
          const currentTotalSupply = await memecoin.totalSupply();
          expect(currentTotalSupply).to.equal(TOTAL_SUPPLY);

          // Verify total supply is constant regardless of purchases
          for (const amount of purchaseAmounts) {
            const tokensSold = await bondingCurve.tokensSold();
            const remainingSupply = await bondingCurve.getRemainingSupply();

            // Only purchase if we have enough supply
            if (tokensSold + BigInt(amount) <= BONDING_CURVE_SUPPLY) {
              const cost = await bondingCurve.calculatePurchaseCost(amount);

              if (cost > 0n) {
                await usdc.connect(buyer).approve(await bondingCurve.getAddress(), cost);
                await bondingCurve.connect(buyer).purchase(amount, cost);

                // Verify total supply hasn't changed
                const newTotalSupply = await memecoin.totalSupply();
                expect(newTotalSupply).to.equal(TOTAL_SUPPLY);
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should verify that tokensSold never exceeds totalSupply on bonding curve", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1000000, max: 100000000 }), { minLength: 1, maxLength: 20 }),
        async (purchaseAmounts) => {
          const bondingCurveTotalSupply = await bondingCurve.totalSupply();

          for (const amount of purchaseAmounts) {
            const tokensSold = await bondingCurve.tokensSold();

            // Verify tokensSold never exceeds totalSupply
            expect(tokensSold).to.be.lte(bondingCurveTotalSupply);

            // Try to purchase
            if (tokensSold + BigInt(amount) <= bondingCurveTotalSupply) {
              const cost = await bondingCurve.calculatePurchaseCost(amount);

              if (cost > 0n) {
                await usdc.connect(buyer).approve(await bondingCurve.getAddress(), cost);
                await bondingCurve.connect(buyer).purchase(amount, cost);

                // Verify tokensSold still doesn't exceed totalSupply
                const newTokensSold = await bondingCurve.tokensSold();
                expect(newTokensSold).to.be.lte(bondingCurveTotalSupply);
                expect(newTokensSold).to.equal(tokensSold + BigInt(amount));
              }
            } else {
              // Attempting to purchase more than available should revert
              const cost = await bondingCurve.calculatePurchaseCost(amount).catch(() => 0n);
              if (cost > 0n) {
                await usdc.connect(buyer).approve(await bondingCurve.getAddress(), cost);
                await expect(bondingCurve.connect(buyer).purchase(amount, cost)).to.be.revertedWith(
                  "Exceeds available supply"
                );
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should verify token distribution: bonding curve + creator = total supply", async () => {
    // Check initial distribution
    const bondingCurveBalance = await memecoin.balanceOf(await bondingCurve.getAddress());
    const creatorBalance = await memecoin.balanceOf(creator.address);
    const totalSupply = await memecoin.totalSupply();

    expect(bondingCurveBalance).to.equal(BONDING_CURVE_SUPPLY);
    expect(creatorBalance).to.equal(CREATOR_SUPPLY);
    expect(bondingCurveBalance + creatorBalance).to.equal(totalSupply);

    // Perform a single sequence of purchases and verify conservation
    const purchaseAmounts = [10000000, 20000000, 15000000];
    let totalPurchased = 0n;

    for (const amount of purchaseAmounts) {
      const tokensSold = await bondingCurve.tokensSold();

      if (tokensSold + BigInt(amount) <= BONDING_CURVE_SUPPLY) {
        const cost = await bondingCurve.calculatePurchaseCost(amount);

        if (cost > 0n) {
          await usdc.connect(buyer).approve(await bondingCurve.getAddress(), cost);
          await bondingCurve.connect(buyer).purchase(amount, cost);
          totalPurchased += BigInt(amount);

          // After each purchase, verify total supply is conserved
          const currentTotalSupply = await memecoin.totalSupply();
          expect(currentTotalSupply).to.equal(TOTAL_SUPPLY);

          // Verify all balances sum to total supply
          const currentBondingCurveBalance = await memecoin.balanceOf(
            await bondingCurve.getAddress()
          );
          const currentCreatorBalance = await memecoin.balanceOf(creator.address);
          const currentBuyerBalance = await memecoin.balanceOf(buyer.address);

          expect(currentBondingCurveBalance + currentCreatorBalance + currentBuyerBalance).to.equal(
            TOTAL_SUPPLY
          );
        }
      }
    }

    // Final verification
    const finalBondingCurveBalance = await memecoin.balanceOf(await bondingCurve.getAddress());
    const finalCreatorBalance = await memecoin.balanceOf(creator.address);
    const finalBuyerBalance = await memecoin.balanceOf(buyer.address);
    const finalTotalSupply = await memecoin.totalSupply();

    expect(finalBondingCurveBalance + finalCreatorBalance + finalBuyerBalance).to.equal(
      finalTotalSupply
    );
    expect(finalTotalSupply).to.equal(TOTAL_SUPPLY);
    expect(finalBuyerBalance).to.equal(totalPurchased);
  });

  it("should verify that attempting to exceed supply is rejected", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 1000 }), async (excessMultiplier) => {
        const remainingSupply = await bondingCurve.getRemainingSupply();

        // Try to purchase more than remaining supply
        const excessAmount = remainingSupply + BigInt(excessMultiplier);

        // calculatePurchaseCost should revert
        await expect(bondingCurve.calculatePurchaseCost(excessAmount)).to.be.revertedWith(
          "Exceeds available supply"
        );
      }),
      { numRuns: 100 }
    );
  });

  it("should verify supply conservation across multiple buyers", async () => {
    const [, , , buyer1, buyer2, buyer3] = await ethers.getSigners();

    // Give all buyers USDC
    await usdc.transfer(buyer1.address, ethers.parseEther("500000"));
    await usdc.transfer(buyer2.address, ethers.parseEther("500000"));
    await usdc.transfer(buyer3.address, ethers.parseEther("500000"));

    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            buyerIndex: fc.integer({ min: 0, max: 2 }),
            amount: fc.integer({ min: 1000000, max: 20000000 }),
          }),
          { minLength: 1, maxLength: 15 }
        ),
        async (purchases) => {
          const buyers = [buyer1, buyer2, buyer3];
          let totalPurchased = 0n;

          for (const { buyerIndex, amount } of purchases) {
            const buyer = buyers[buyerIndex];
            const tokensSold = await bondingCurve.tokensSold();

            if (tokensSold + BigInt(amount) <= BONDING_CURVE_SUPPLY) {
              const cost = await bondingCurve.calculatePurchaseCost(amount);

              if (cost > 0n) {
                await usdc.connect(buyer).approve(await bondingCurve.getAddress(), cost);
                await bondingCurve.connect(buyer).purchase(amount, cost);
                totalPurchased += BigInt(amount);
              }
            }
          }

          // Verify total supply is conserved
          const totalSupply = await memecoin.totalSupply();
          expect(totalSupply).to.equal(TOTAL_SUPPLY);

          // Verify sum of all balances equals total supply
          const bondingCurveBalance = await memecoin.balanceOf(await bondingCurve.getAddress());
          const creatorBalance = await memecoin.balanceOf(creator.address);
          const buyer1Balance = await memecoin.balanceOf(buyer1.address);
          const buyer2Balance = await memecoin.balanceOf(buyer2.address);
          const buyer3Balance = await memecoin.balanceOf(buyer3.address);

          const sumOfBalances =
            bondingCurveBalance + creatorBalance + buyer1Balance + buyer2Balance + buyer3Balance;

          expect(sumOfBalances).to.equal(TOTAL_SUPPLY);
        }
      ),
      { numRuns: 100 }
    );
  });
});
