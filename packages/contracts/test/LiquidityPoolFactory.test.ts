import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { LiquidityPoolFactory, AIRToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LiquidityPoolFactory", function () {
  let factory: LiquidityPoolFactory;
  let airToken: AIRToken;
  let memecoin: AIRToken; // Using AIRToken as mock memecoin for testing
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;

  beforeEach(async function () {
    [owner, creator] = await ethers.getSigners();

    // Deploy AIR token
    const AIRTokenFactory = await ethers.getContractFactory("AIRToken");
    airToken = await AIRTokenFactory.deploy();
    await airToken.waitForDeployment();

    // Deploy mock memecoin
    memecoin = await AIRTokenFactory.deploy();
    await memecoin.waitForDeployment();

    // Deploy LiquidityPoolFactory
    const FactoryContract = await ethers.getContractFactory("LiquidityPoolFactory");
    factory = await FactoryContract.deploy(await airToken.getAddress());
    await factory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct AIR token address", async function () {
      expect(await factory.airToken()).to.equal(await airToken.getAddress());
    });

    it("Should set the correct graduation threshold", async function () {
      const expectedThreshold = ethers.parseUnits("69000", 6); // $69,000 USDC
      expect(await factory.GRADUATION_THRESHOLD()).to.equal(expectedThreshold);
    });

    it("Should set the correct burn address", async function () {
      expect(await factory.BURN_ADDRESS()).to.equal("0x000000000000000000000000000000000000dEaD");
    });
  });

  describe("Graduation Eligibility", function () {
    it("Should return true when market cap >= $69,000", async function () {
      // Market cap = price * tokensSold
      // $69,000 = $0.001 * 69,000,000 tokens
      const currentPrice = ethers.parseUnits("0.001", 6); // $0.001 USDC
      const tokensSold = ethers.parseEther("69000000"); // 69 million tokens

      const eligible = await factory.checkGraduationEligibility.staticCall(
        await memecoin.getAddress(),
        currentPrice,
        tokensSold
      );

      expect(eligible).to.be.true;
    });

    it("Should return true when market cap > $69,000", async function () {
      // Market cap = $0.001 * 100,000,000 = $100,000
      const currentPrice = ethers.parseUnits("0.001", 6);
      const tokensSold = ethers.parseEther("100000000"); // 100 million tokens

      const eligible = await factory.checkGraduationEligibility.staticCall(
        await memecoin.getAddress(),
        currentPrice,
        tokensSold
      );

      expect(eligible).to.be.true;
    });

    it("Should return false when market cap < $69,000", async function () {
      // Market cap = $0.001 * 50,000,000 = $50,000
      const currentPrice = ethers.parseUnits("0.001", 6);
      const tokensSold = ethers.parseEther("50000000"); // 50 million tokens

      const eligible = await factory.checkGraduationEligibility.staticCall(
        await memecoin.getAddress(),
        currentPrice,
        tokensSold
      );

      expect(eligible).to.be.false;
    });

    it("Should emit GraduationThresholdChecked event", async function () {
      const currentPrice = ethers.parseUnits("0.001", 6);
      const tokensSold = ethers.parseEther("69000000");

      await expect(
        factory.checkGraduationEligibility(await memecoin.getAddress(), currentPrice, tokensSold)
      )
        .to.emit(factory, "GraduationThresholdChecked")
        .withArgs(await memecoin.getAddress(), ethers.parseUnits("69000", 6), true);
    });

    it("Should reject zero address for memecoin", async function () {
      const currentPrice = ethers.parseUnits("0.001", 6);
      const tokensSold = ethers.parseEther("69000000");

      await expect(
        factory.checkGraduationEligibility(ethers.ZeroAddress, currentPrice, tokensSold)
      ).to.be.revertedWith("Invalid memecoin address");
    });
  });

  describe("Liquidity Pool Creation", function () {
    beforeEach(async function () {
      // Mint tokens to owner for pool creation
      const memecoinAmount = ethers.parseEther("200000000"); // 200M tokens
      const airAmount = ethers.parseEther("10000"); // 10K AIR tokens

      // Transfer tokens to owner (they're already minted to owner in deployment)
      // Approve factory to spend tokens
      await memecoin.approve(await factory.getAddress(), memecoinAmount);
      await airToken.approve(await factory.getAddress(), airAmount);
    });

    it("Should create a liquidity pool", async function () {
      const memecoinAmount = ethers.parseEther("200000000");
      const airAmount = ethers.parseEther("10000");

      const tx = await factory.createLiquidityPool(
        await memecoin.getAddress(),
        creator.address,
        memecoinAmount,
        airAmount
      );

      const receipt = await tx.wait();

      // Check event emission
      const event = receipt?.logs.find((log: any) => log.fragment?.name === "PoolCreated");
      expect(event).to.not.be.undefined;
    });

    it("Should emit PoolCreated event with correct parameters", async function () {
      const memecoinAmount = ethers.parseEther("200000000");
      const airAmount = ethers.parseEther("10000");

      const tx = await factory.createLiquidityPool(
        await memecoin.getAddress(),
        creator.address,
        memecoinAmount,
        airAmount
      );

      const receipt = await tx.wait();
      const event: any = receipt?.logs.find((log: any) => log.fragment?.name === "PoolCreated");

      expect(event).to.not.be.undefined;
      expect(event.args[1]).to.equal(await memecoin.getAddress());
      expect(event.args[2]).to.equal(creator.address);
      expect(event.args[3]).to.equal(memecoinAmount);
      expect(event.args[4]).to.equal(airAmount);
    });

    it("Should automatically burn LP tokens", async function () {
      const memecoinAmount = ethers.parseEther("200000000");
      const airAmount = ethers.parseEther("10000");

      const tx = await factory.createLiquidityPool(
        await memecoin.getAddress(),
        creator.address,
        memecoinAmount,
        airAmount
      );

      const receipt = await tx.wait();

      // Check LPTokensBurned event
      const event = receipt?.logs.find((log: any) => log.fragment?.name === "LPTokensBurned");
      expect(event).to.not.be.undefined;
    });

    it("Should track pool by memecoin address", async function () {
      const memecoinAmount = ethers.parseEther("200000000");
      const airAmount = ethers.parseEther("10000");

      const tx = await factory.createLiquidityPool(
        await memecoin.getAddress(),
        creator.address,
        memecoinAmount,
        airAmount
      );

      await tx.wait();

      const poolAddress = await factory.getPoolByMemecoin(await memecoin.getAddress());
      expect(poolAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should increment total pools count", async function () {
      expect(await factory.getTotalPools()).to.equal(0);

      const memecoinAmount = ethers.parseEther("200000000");
      const airAmount = ethers.parseEther("10000");

      await factory.createLiquidityPool(
        await memecoin.getAddress(),
        creator.address,
        memecoinAmount,
        airAmount
      );

      expect(await factory.getTotalPools()).to.equal(1);
    });

    it("Should reject zero address for memecoin", async function () {
      const memecoinAmount = ethers.parseEther("200000000");
      const airAmount = ethers.parseEther("10000");

      await expect(
        factory.createLiquidityPool(ethers.ZeroAddress, creator.address, memecoinAmount, airAmount)
      ).to.be.revertedWith("Invalid memecoin address");
    });

    it("Should reject zero address for creator", async function () {
      const memecoinAmount = ethers.parseEther("200000000");
      const airAmount = ethers.parseEther("10000");

      await expect(
        factory.createLiquidityPool(
          await memecoin.getAddress(),
          ethers.ZeroAddress,
          memecoinAmount,
          airAmount
        )
      ).to.be.revertedWith("Invalid creator address");
    });

    it("Should reject zero memecoin amount", async function () {
      const airAmount = ethers.parseEther("10000");

      await expect(
        factory.createLiquidityPool(await memecoin.getAddress(), creator.address, 0, airAmount)
      ).to.be.revertedWith("Memecoin amount must be positive");
    });

    it("Should reject zero AIR amount", async function () {
      const memecoinAmount = ethers.parseEther("200000000");

      await expect(
        factory.createLiquidityPool(await memecoin.getAddress(), creator.address, memecoinAmount, 0)
      ).to.be.revertedWith("AIR amount must be positive");
    });

    it("Should reject duplicate pool creation", async function () {
      const memecoinAmount = ethers.parseEther("200000000");
      const airAmount = ethers.parseEther("10000");

      // Create first pool
      await factory.createLiquidityPool(
        await memecoin.getAddress(),
        creator.address,
        memecoinAmount,
        airAmount
      );

      // Approve more tokens
      await memecoin.approve(await factory.getAddress(), memecoinAmount);
      await airToken.approve(await factory.getAddress(), airAmount);

      // Try to create second pool
      await expect(
        factory.createLiquidityPool(
          await memecoin.getAddress(),
          creator.address,
          memecoinAmount,
          airAmount
        )
      ).to.be.revertedWith("Pool already exists");
    });

    it("Should reject non-owner creating pool", async function () {
      const memecoinAmount = ethers.parseEther("200000000");
      const airAmount = ethers.parseEther("10000");

      await expect(
        factory
          .connect(creator)
          .createLiquidityPool(
            await memecoin.getAddress(),
            creator.address,
            memecoinAmount,
            airAmount
          )
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });
  });

  describe("Pool Information", function () {
    beforeEach(async function () {
      // Create a pool
      const memecoinAmount = ethers.parseEther("200000000");
      const airAmount = ethers.parseEther("10000");

      await memecoin.approve(await factory.getAddress(), memecoinAmount);
      await airToken.approve(await factory.getAddress(), airAmount);

      await factory.createLiquidityPool(
        await memecoin.getAddress(),
        creator.address,
        memecoinAmount,
        airAmount
      );
    });

    it("Should return correct pool info", async function () {
      const poolAddress = await factory.getPoolByMemecoin(await memecoin.getAddress());
      const poolInfo = await factory.getPoolInfo(poolAddress);

      expect(poolInfo.poolAddress).to.equal(poolAddress);
      expect(poolInfo.memecoinAddress).to.equal(await memecoin.getAddress());
      expect(poolInfo.creator).to.equal(creator.address);
      expect(poolInfo.lpTokensBurnedFlag).to.be.true;
    });

    it("Should confirm LP tokens are burned", async function () {
      const poolAddress = await factory.getPoolByMemecoin(await memecoin.getAddress());
      const areBurned = await factory.areLPTokensBurned(poolAddress);

      expect(areBurned).to.be.true;
    });
  });
});
