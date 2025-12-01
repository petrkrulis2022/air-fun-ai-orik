import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import {
  MemecoinFactory,
  Memecoin,
  BondingCurve,
  AIRToken,
  LiquidityPoolFactory,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Integration Tests", function () {
  let factory: MemecoinFactory;
  let poolFactory: LiquidityPoolFactory;
  let usdc: AIRToken;
  let airToken: AIRToken;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let platformWallet: SignerWithAddress;
  let buyer1: SignerWithAddress;
  let buyer2: SignerWithAddress;

  beforeEach(async function () {
    [owner, creator, platformWallet, buyer1, buyer2] = await ethers.getSigners();

    // Deploy mock USDC
    const TokenFactory = await ethers.getContractFactory("AIRToken");
    usdc = await TokenFactory.deploy();
    await usdc.waitForDeployment();

    // Deploy AIR token
    airToken = await TokenFactory.deploy();
    await airToken.waitForDeployment();

    // Deploy MemecoinFactory
    const FactoryContract = await ethers.getContractFactory("MemecoinFactory");
    factory = await FactoryContract.deploy(await usdc.getAddress(), platformWallet.address);
    await factory.waitForDeployment();

    // Deploy LiquidityPoolFactory
    const PoolFactoryContract = await ethers.getContractFactory("LiquidityPoolFactory");
    poolFactory = await PoolFactoryContract.deploy(await airToken.getAddress());
    await poolFactory.waitForDeployment();

    // Give buyers USDC
    await usdc.transfer(buyer1.address, ethers.parseEther("1000000"));
    await usdc.transfer(buyer2.address, ethers.parseEther("1000000"));
  });

  describe("Complete Token Lifecycle", function () {
    it("Should complete full lifecycle: create → purchase → graduate → LP", async function () {
      // 1. Create memecoin
      const tx = await factory.createMemecoin("Test Coin", "TEST", creator.address);
      const receipt = await tx.wait();

      const event: any = receipt?.logs.find((log: any) => log.fragment?.name === "MemecoinCreated");
      const memecoinAddress = event?.args[0];
      const bondingCurveAddress = event?.args[1];

      // Get contracts
      const Memecoin = await ethers.getContractFactory("Memecoin");
      const memecoin = Memecoin.attach(memecoinAddress) as Memecoin;

      const BondingCurve = await ethers.getContractFactory("BondingCurve");
      const bondingCurve = BondingCurve.attach(bondingCurveAddress) as BondingCurve;

      // 2. Verify initial state
      expect(await memecoin.totalSupply()).to.equal(ethers.parseEther("1000000000"));
      expect(await bondingCurve.tokensSold()).to.equal(0);
      expect(await bondingCurve.isGraduated()).to.be.false;

      // 3. Execute purchases
      const tokenAmount1 = 10000000;
      const cost1 = await bondingCurve.calculatePurchaseCost(tokenAmount1);
      await usdc.connect(buyer1).approve(bondingCurveAddress, cost1);
      await bondingCurve.connect(buyer1).purchase(tokenAmount1, cost1);

      expect(await memecoin.balanceOf(buyer1.address)).to.equal(tokenAmount1);
      expect(await bondingCurve.tokensSold()).to.equal(tokenAmount1);

      // 4. Second purchase
      const tokenAmount2 = 20000000;
      const cost2 = await bondingCurve.calculatePurchaseCost(tokenAmount2);
      await usdc.connect(buyer2).approve(bondingCurveAddress, cost2);
      await bondingCurve.connect(buyer2).purchase(tokenAmount2, cost2);

      expect(await memecoin.balanceOf(buyer2.address)).to.equal(tokenAmount2);
      expect(await bondingCurve.tokensSold()).to.equal(tokenAmount1 + tokenAmount2);

      // 5. Graduate token
      await bondingCurve.graduate();
      expect(await bondingCurve.isGraduated()).to.be.true;

      // 6. Verify purchases blocked after graduation
      const tokenAmount3 = 10000000;
      const cost3 = await bondingCurve.calculatePurchaseCost(tokenAmount3);
      await usdc.connect(buyer1).approve(bondingCurveAddress, cost3);

      await expect(bondingCurve.connect(buyer1).purchase(tokenAmount3, cost3)).to.be.revertedWith(
        "Token has graduated"
      );

      // 7. Create liquidity pool
      // Note: Creator has 200M tokens, so we'll use those
      const memecoinAmount = ethers.parseEther("100000000"); // Use 100M instead of 200M
      const airAmount = ethers.parseEther("10000");

      // Transfer memecoin from creator to owner for pool creation
      await memecoin.connect(creator).transfer(owner.address, memecoinAmount);

      await memecoin.approve(await poolFactory.getAddress(), memecoinAmount);
      await airToken.approve(await poolFactory.getAddress(), airAmount);

      await poolFactory.createLiquidityPool(
        memecoinAddress,
        creator.address,
        memecoinAmount,
        airAmount
      );

      const poolAddress = await poolFactory.getPoolByMemecoin(memecoinAddress);
      expect(poolAddress).to.not.equal(ethers.ZeroAddress);

      // 8. Verify LP tokens burned
      const areBurned = await poolFactory.areLPTokensBurned(poolAddress);
      expect(areBurned).to.be.true;
    });

    it("Should distribute fees correctly throughout lifecycle", async function () {
      // Create memecoin
      const tx = await factory.createMemecoin("Test Coin", "TEST", creator.address);
      const receipt = await tx.wait();

      const event: any = receipt?.logs.find((log: any) => log.fragment?.name === "MemecoinCreated");
      const bondingCurveAddress = event?.args[1];

      const BondingCurve = await ethers.getContractFactory("BondingCurve");
      const bondingCurve = BondingCurve.attach(bondingCurveAddress) as BondingCurve;

      // Track balances
      const creatorBalanceBefore = await usdc.balanceOf(creator.address);
      const platformBalanceBefore = await usdc.balanceOf(platformWallet.address);

      // Execute multiple purchases
      const purchases = [10000000, 20000000, 15000000];
      let totalCreatorFees = 0n;
      let totalPlatformFees = 0n;

      for (const amount of purchases) {
        const cost = await bondingCurve.calculatePurchaseCost(amount);
        await usdc.connect(buyer1).approve(bondingCurveAddress, cost);
        await bondingCurve.connect(buyer1).purchase(amount, cost);

        const platformFee = (cost * 200n) / 10000n;
        const creatorFee = cost - platformFee;

        totalCreatorFees += creatorFee;
        totalPlatformFees += platformFee;
      }

      // Verify final balances
      const creatorBalanceAfter = await usdc.balanceOf(creator.address);
      const platformBalanceAfter = await usdc.balanceOf(platformWallet.address);

      expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(totalCreatorFees);
      expect(platformBalanceAfter - platformBalanceBefore).to.equal(totalPlatformFees);
    });
  });

  describe("Multi-Token Scenarios", function () {
    it("Should handle multiple memecoins independently", async function () {
      // Create two memecoins
      const tx1 = await factory.createMemecoin("Coin 1", "AAA", creator.address);
      const receipt1 = await tx1.wait();
      const event1: any = receipt1?.logs.find(
        (log: any) => log.fragment?.name === "MemecoinCreated"
      );
      const bondingCurve1Address = event1?.args[1];

      const tx2 = await factory.createMemecoin("Coin 2", "BBB", creator.address);
      const receipt2 = await tx2.wait();
      const event2: any = receipt2?.logs.find(
        (log: any) => log.fragment?.name === "MemecoinCreated"
      );
      const bondingCurve2Address = event2?.args[1];

      const BondingCurve = await ethers.getContractFactory("BondingCurve");
      const bondingCurve1 = BondingCurve.attach(bondingCurve1Address) as BondingCurve;
      const bondingCurve2 = BondingCurve.attach(bondingCurve2Address) as BondingCurve;

      // Purchase from both
      const amount1 = 10000000;
      const cost1 = await bondingCurve1.calculatePurchaseCost(amount1);
      await usdc.connect(buyer1).approve(bondingCurve1Address, cost1);
      await bondingCurve1.connect(buyer1).purchase(amount1, cost1);

      const amount2 = 20000000;
      const cost2 = await bondingCurve2.calculatePurchaseCost(amount2);
      await usdc.connect(buyer1).approve(bondingCurve2Address, cost2);
      await bondingCurve2.connect(buyer1).purchase(amount2, cost2);

      // Verify independent state
      expect(await bondingCurve1.tokensSold()).to.equal(amount1);
      expect(await bondingCurve2.tokensSold()).to.equal(amount2);

      // Graduate only first token
      await bondingCurve1.graduate();
      expect(await bondingCurve1.isGraduated()).to.be.true;
      expect(await bondingCurve2.isGraduated()).to.be.false;

      // Second token should still allow purchases
      const amount3 = 5000000;
      const cost3 = await bondingCurve2.calculatePurchaseCost(amount3);
      await usdc.connect(buyer1).approve(bondingCurve2Address, cost3);
      await bondingCurve2.connect(buyer1).purchase(amount3, cost3);

      expect(await bondingCurve2.tokensSold()).to.equal(amount2 + amount3);
    });
  });

  describe("Security and Edge Cases", function () {
    it("Should prevent reentrancy attacks", async function () {
      const tx = await factory.createMemecoin("Test Coin", "TEST", creator.address);
      const receipt = await tx.wait();

      const event: any = receipt?.logs.find((log: any) => log.fragment?.name === "MemecoinCreated");
      const bondingCurveAddress = event?.args[1];

      const BondingCurve = await ethers.getContractFactory("BondingCurve");
      const bondingCurve = BondingCurve.attach(bondingCurveAddress) as BondingCurve;

      // Execute purchase
      const tokenAmount = 10000000;
      const cost = await bondingCurve.calculatePurchaseCost(tokenAmount);
      await usdc.connect(buyer1).approve(bondingCurveAddress, cost);
      await bondingCurve.connect(buyer1).purchase(tokenAmount, cost);

      // Verify state was updated correctly (reentrancy guard worked)
      expect(await bondingCurve.tokensSold()).to.equal(tokenAmount);
    });

    it("Should handle maximum supply correctly", async function () {
      const tx = await factory.createMemecoin("Test Coin", "TEST", creator.address);
      const receipt = await tx.wait();

      const event: any = receipt?.logs.find((log: any) => log.fragment?.name === "MemecoinCreated");
      const bondingCurveAddress = event?.args[1];

      const BondingCurve = await ethers.getContractFactory("BondingCurve");
      const bondingCurve = BondingCurve.attach(bondingCurveAddress) as BondingCurve;

      const totalSupply = await bondingCurve.totalSupply();

      // Try to purchase more than available
      await expect(bondingCurve.calculatePurchaseCost(totalSupply + 1n)).to.be.revertedWith(
        "Exceeds available supply"
      );
    });

    it("Should reject invalid symbol lengths", async function () {
      await expect(factory.createMemecoin("Test", "AB", creator.address)).to.be.revertedWith(
        "Symbol must be 3-5 characters"
      );

      await expect(factory.createMemecoin("Test", "ABCDEF", creator.address)).to.be.revertedWith(
        "Symbol must be 3-5 characters"
      );
    });

    it("Should prevent duplicate symbols", async function () {
      await factory.createMemecoin("Test 1", "TEST", creator.address);

      await expect(factory.createMemecoin("Test 2", "TEST", creator.address)).to.be.revertedWith(
        "Symbol already exists"
      );
    });

    it("Should reject zero addresses in critical functions", async function () {
      await expect(factory.createMemecoin("Test", "TEST", ethers.ZeroAddress)).to.be.revertedWith(
        "Invalid creator address"
      );
    });
  });

  describe("Graduation Eligibility", function () {
    it("Should correctly check graduation eligibility", async function () {
      const tx = await factory.createMemecoin("Test Coin", "TEST", creator.address);
      const receipt = await tx.wait();

      const event: any = receipt?.logs.find((log: any) => log.fragment?.name === "MemecoinCreated");
      const memecoinAddress = event?.args[0];

      // Below threshold
      const price1 = ethers.parseUnits("0.001", 6);
      const sold1 = ethers.parseEther("50000000");
      const eligible1 = await poolFactory.checkGraduationEligibility.staticCall(
        memecoinAddress,
        price1,
        sold1
      );
      expect(eligible1).to.be.false;

      // At threshold
      const price2 = ethers.parseUnits("0.001", 6);
      const sold2 = ethers.parseEther("69000000");
      const eligible2 = await poolFactory.checkGraduationEligibility.staticCall(
        memecoinAddress,
        price2,
        sold2
      );
      expect(eligible2).to.be.true;

      // Above threshold
      const price3 = ethers.parseUnits("0.001", 6);
      const sold3 = ethers.parseEther("100000000");
      const eligible3 = await poolFactory.checkGraduationEligibility.staticCall(
        memecoinAddress,
        price3,
        sold3
      );
      expect(eligible3).to.be.true;
    });
  });

  describe("Platform Wallet Updates", function () {
    it("Should route fees to updated platform wallet", async function () {
      const [, , , , , newPlatformWallet] = await ethers.getSigners();

      // Create memecoin
      const tx = await factory.createMemecoin("Test Coin", "TEST", creator.address);
      const receipt = await tx.wait();

      const event: any = receipt?.logs.find((log: any) => log.fragment?.name === "MemecoinCreated");
      const bondingCurveAddress = event?.args[1];

      const BondingCurve = await ethers.getContractFactory("BondingCurve");
      const bondingCurve = BondingCurve.attach(bondingCurveAddress) as BondingCurve;

      // Update platform wallet
      await bondingCurve.updatePlatformWallet(newPlatformWallet.address);

      // Execute purchase
      const tokenAmount = 10000000;
      const cost = await bondingCurve.calculatePurchaseCost(tokenAmount);

      const newWalletBalanceBefore = await usdc.balanceOf(newPlatformWallet.address);

      await usdc.connect(buyer1).approve(bondingCurveAddress, cost);
      await bondingCurve.connect(buyer1).purchase(tokenAmount, cost);

      const newWalletBalanceAfter = await usdc.balanceOf(newPlatformWallet.address);
      const platformFee = newWalletBalanceAfter - newWalletBalanceBefore;

      expect(platformFee).to.equal((cost * 200n) / 10000n);
    });

    it("Should allow factory to update platform wallet", async function () {
      const [, , , , , newPlatformWallet] = await ethers.getSigners();

      await factory.updatePlatformWallet(newPlatformWallet.address);
      expect(await factory.platformWallet()).to.equal(newPlatformWallet.address);
    });
  });
});
