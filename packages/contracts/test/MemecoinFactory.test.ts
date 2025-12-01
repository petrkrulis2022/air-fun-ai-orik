import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { MemecoinFactory, Memecoin, BondingCurve, AIRToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MemecoinFactory", function () {
  let factory: MemecoinFactory;
  let usdc: AIRToken; // Using AIRToken as mock USDC for testing
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let platformWallet: SignerWithAddress;

  beforeEach(async function () {
    [owner, creator, platformWallet] = await ethers.getSigners();

    // Deploy mock USDC token
    const USDCFactory = await ethers.getContractFactory("AIRToken");
    usdc = await USDCFactory.deploy();
    await usdc.waitForDeployment();

    // Deploy MemecoinFactory
    const FactoryContract = await ethers.getContractFactory("MemecoinFactory");
    factory = await FactoryContract.deploy(await usdc.getAddress(), platformWallet.address);
    await factory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct USDC address", async function () {
      expect(await factory.usdcAddress()).to.equal(await usdc.getAddress());
    });

    it("Should set the correct platform wallet", async function () {
      expect(await factory.platformWallet()).to.equal(platformWallet.address);
    });

    it("Should set the correct bonding curve constant", async function () {
      expect(await factory.BONDING_CURVE_K()).to.equal(1);
    });

    it("Should set the correct bonding curve supply", async function () {
      const expectedSupply = ethers.parseEther("800000000"); // 800 million
      expect(await factory.BONDING_CURVE_SUPPLY()).to.equal(expectedSupply);
    });
  });

  describe("Memecoin Creation", function () {
    it("Should create a new memecoin with bonding curve", async function () {
      const name = "Test Streamer Coin";
      const symbol = "TEST";

      const tx = await factory.createMemecoin(name, symbol, creator.address);
      const receipt = await tx.wait();

      // Check event emission
      const event = receipt?.logs.find((log: any) => log.fragment?.name === "MemecoinCreated");
      expect(event).to.not.be.undefined;
    });

    it("Should deploy memecoin with 1 billion total supply", async function () {
      const name = "Test Streamer Coin";
      const symbol = "TEST";

      const tx = await factory.createMemecoin(name, symbol, creator.address);
      const receipt = await tx.wait();

      // Get memecoin address from event
      const event: any = receipt?.logs.find((log: any) => log.fragment?.name === "MemecoinCreated");
      const memecoinAddress = event?.args[0];

      // Get memecoin contract
      const Memecoin = await ethers.getContractFactory("Memecoin");
      const memecoin = Memecoin.attach(memecoinAddress) as Memecoin;

      // Check total supply
      const expectedSupply = ethers.parseEther("1000000000"); // 1 billion
      expect(await memecoin.TOTAL_SUPPLY()).to.equal(expectedSupply);
    });

    it("Should allocate 800 million tokens to bonding curve", async function () {
      const name = "Test Streamer Coin";
      const symbol = "TEST";

      const tx = await factory.createMemecoin(name, symbol, creator.address);
      const receipt = await tx.wait();

      // Get addresses from event
      const event: any = receipt?.logs.find((log: any) => log.fragment?.name === "MemecoinCreated");
      const memecoinAddress = event?.args[0];
      const bondingCurveAddress = event?.args[1];

      // Get contracts
      const Memecoin = await ethers.getContractFactory("Memecoin");
      const memecoin = Memecoin.attach(memecoinAddress) as Memecoin;

      // Check bonding curve balance
      const expectedBondingCurveSupply = ethers.parseEther("800000000"); // 800 million
      const bondingCurveBalance = await memecoin.balanceOf(bondingCurveAddress);
      expect(bondingCurveBalance).to.equal(expectedBondingCurveSupply);
    });

    it("Should allocate 200 million tokens to creator", async function () {
      const name = "Test Streamer Coin";
      const symbol = "TEST";

      const tx = await factory.createMemecoin(name, symbol, creator.address);
      const receipt = await tx.wait();

      // Get memecoin address from event
      const event: any = receipt?.logs.find((log: any) => log.fragment?.name === "MemecoinCreated");
      const memecoinAddress = event?.args[0];

      // Get memecoin contract
      const Memecoin = await ethers.getContractFactory("Memecoin");
      const memecoin = Memecoin.attach(memecoinAddress) as Memecoin;

      // Check creator balance
      const expectedCreatorSupply = ethers.parseEther("200000000"); // 200 million
      const creatorBalance = await memecoin.balanceOf(creator.address);
      expect(creatorBalance).to.equal(expectedCreatorSupply);
    });

    it("Should reject symbol shorter than 3 characters", async function () {
      const name = "Test Coin";
      const symbol = "AB";

      await expect(factory.createMemecoin(name, symbol, creator.address)).to.be.revertedWith(
        "Symbol must be 3-5 characters"
      );
    });

    it("Should reject symbol longer than 5 characters", async function () {
      const name = "Test Coin";
      const symbol = "ABCDEF";

      await expect(factory.createMemecoin(name, symbol, creator.address)).to.be.revertedWith(
        "Symbol must be 3-5 characters"
      );
    });

    it("Should reject duplicate symbols", async function () {
      const name = "Test Coin";
      const symbol = "TEST";

      // Create first memecoin
      await factory.createMemecoin(name, symbol, creator.address);

      // Try to create second with same symbol
      await expect(factory.createMemecoin(name, symbol, creator.address)).to.be.revertedWith(
        "Symbol already exists"
      );
    });

    it("Should reject zero address for creator", async function () {
      const name = "Test Coin";
      const symbol = "TEST";

      await expect(factory.createMemecoin(name, symbol, ethers.ZeroAddress)).to.be.revertedWith(
        "Invalid creator address"
      );
    });
  });

  describe("Tracking", function () {
    it("Should track memecoins by creator", async function () {
      await factory.createMemecoin("Coin 1", "AAA", creator.address);
      await factory.createMemecoin("Coin 2", "BBB", creator.address);

      const creatorMemecoins = await factory.getCreatorMemecoins(creator.address);
      expect(creatorMemecoins.length).to.equal(2);
      expect(creatorMemecoins[0].symbol).to.equal("AAA");
      expect(creatorMemecoins[1].symbol).to.equal("BBB");
    });

    it("Should track memecoins by symbol", async function () {
      const tx = await factory.createMemecoin("Test Coin", "TEST", creator.address);
      const receipt = await tx.wait();

      const event: any = receipt?.logs.find((log: any) => log.fragment?.name === "MemecoinCreated");
      const memecoinAddress = event?.args[0];

      const trackedAddress = await factory.getMemecoinBySymbol("TEST");
      expect(trackedAddress).to.equal(memecoinAddress);
    });

    it("Should track total memecoins created", async function () {
      expect(await factory.getTotalMemecoins()).to.equal(0);

      await factory.createMemecoin("Coin 1", "AAA", creator.address);
      expect(await factory.getTotalMemecoins()).to.equal(1);

      await factory.createMemecoin("Coin 2", "BBB", creator.address);
      expect(await factory.getTotalMemecoins()).to.equal(2);
    });
  });

  describe("Platform Wallet Management", function () {
    it("Should allow owner to update platform wallet", async function () {
      const [, , , newWallet] = await ethers.getSigners();

      await factory.updatePlatformWallet(newWallet.address);
      expect(await factory.platformWallet()).to.equal(newWallet.address);
    });

    it("Should reject zero address for platform wallet", async function () {
      await expect(factory.updatePlatformWallet(ethers.ZeroAddress)).to.be.revertedWith(
        "Invalid address"
      );
    });

    it("Should reject non-owner updating platform wallet", async function () {
      const [, , , newWallet] = await ethers.getSigners();

      await expect(
        factory.connect(creator).updatePlatformWallet(newWallet.address)
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });
  });
});
