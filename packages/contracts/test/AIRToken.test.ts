import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { AIRToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AIRToken", function () {
  let airToken: AIRToken;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const AIRTokenFactory = await ethers.getContractFactory("AIRToken");
    airToken = await AIRTokenFactory.deploy();
    await airToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct token name", async function () {
      expect(await airToken.name()).to.equal("AIR Token");
    });

    it("Should set the correct token symbol", async function () {
      expect(await airToken.symbol()).to.equal("AIR");
    });

    it("Should mint initial supply to owner", async function () {
      const expectedSupply = ethers.parseEther("1000000000"); // 1 billion
      expect(await airToken.balanceOf(owner.address)).to.equal(expectedSupply);
    });

    it("Should set correct total supply", async function () {
      const expectedSupply = ethers.parseEther("1000000000");
      expect(await airToken.totalSupply()).to.equal(expectedSupply);
    });

    it("Should set owner correctly", async function () {
      expect(await airToken.owner()).to.equal(owner.address);
    });
  });

  describe("Token Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const amount = ethers.parseEther("1000");

      await airToken.transfer(user1.address, amount);
      expect(await airToken.balanceOf(user1.address)).to.equal(amount);
    });

    it("Should update balances after transfer", async function () {
      const amount = ethers.parseEther("1000");
      const ownerBalanceBefore = await airToken.balanceOf(owner.address);

      await airToken.transfer(user1.address, amount);

      const ownerBalanceAfter = await airToken.balanceOf(owner.address);
      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore - amount);
    });

    it("Should fail when sender has insufficient balance", async function () {
      const amount = ethers.parseEther("1000");

      await expect(
        airToken.connect(user1).transfer(user2.address, amount)
      ).to.be.revertedWithCustomError(airToken, "ERC20InsufficientBalance");
    });

    it("Should fail when transferring to zero address", async function () {
      const amount = ethers.parseEther("1000");

      await expect(airToken.transfer(ethers.ZeroAddress, amount)).to.be.revertedWithCustomError(
        airToken,
        "ERC20InvalidReceiver"
      );
    });
  });

  describe("Token Approvals", function () {
    it("Should approve tokens for spending", async function () {
      const amount = ethers.parseEther("1000");

      await airToken.approve(user1.address, amount);
      expect(await airToken.allowance(owner.address, user1.address)).to.equal(amount);
    });

    it("Should allow transferFrom with approval", async function () {
      const amount = ethers.parseEther("1000");

      await airToken.approve(user1.address, amount);
      await airToken.connect(user1).transferFrom(owner.address, user2.address, amount);

      expect(await airToken.balanceOf(user2.address)).to.equal(amount);
    });

    it("Should fail transferFrom without approval", async function () {
      const amount = ethers.parseEther("1000");

      await expect(
        airToken.connect(user1).transferFrom(owner.address, user2.address, amount)
      ).to.be.revertedWithCustomError(airToken, "ERC20InsufficientAllowance");
    });

    it("Should decrease allowance after transferFrom", async function () {
      const amount = ethers.parseEther("1000");
      const transferAmount = ethers.parseEther("500");

      await airToken.approve(user1.address, amount);
      await airToken.connect(user1).transferFrom(owner.address, user2.address, transferAmount);

      expect(await airToken.allowance(owner.address, user1.address)).to.equal(
        amount - transferAmount
      );
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const amount = ethers.parseEther("1000");
      const totalSupplyBefore = await airToken.totalSupply();

      await airToken.mint(user1.address, amount);

      expect(await airToken.balanceOf(user1.address)).to.equal(amount);
      expect(await airToken.totalSupply()).to.equal(totalSupplyBefore + amount);
    });

    it("Should reject minting by non-owner", async function () {
      const amount = ethers.parseEther("1000");

      await expect(
        airToken.connect(user1).mint(user2.address, amount)
      ).to.be.revertedWithCustomError(airToken, "OwnableUnauthorizedAccount");
    });

    it("Should reject minting to zero address", async function () {
      const amount = ethers.parseEther("1000");

      await expect(airToken.mint(ethers.ZeroAddress, amount)).to.be.revertedWithCustomError(
        airToken,
        "ERC20InvalidReceiver"
      );
    });

    it("Should emit Transfer event on mint", async function () {
      const amount = ethers.parseEther("1000");

      await expect(airToken.mint(user1.address, amount))
        .to.emit(airToken, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, amount);
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to transfer ownership", async function () {
      await airToken.transferOwnership(user1.address);
      expect(await airToken.owner()).to.equal(user1.address);
    });

    it("Should reject ownership transfer by non-owner", async function () {
      await expect(
        airToken.connect(user1).transferOwnership(user2.address)
      ).to.be.revertedWithCustomError(airToken, "OwnableUnauthorizedAccount");
    });

    it("Should reject ownership transfer to zero address", async function () {
      await expect(airToken.transferOwnership(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        airToken,
        "OwnableInvalidOwner"
      );
    });
  });

  describe("Token Supply Conservation", function () {
    it("Should maintain total supply after transfers", async function () {
      const totalSupplyBefore = await airToken.totalSupply();

      await airToken.transfer(user1.address, ethers.parseEther("1000"));
      await airToken.transfer(user2.address, ethers.parseEther("2000"));

      const totalSupplyAfter = await airToken.totalSupply();
      expect(totalSupplyAfter).to.equal(totalSupplyBefore);
    });

    it("Should maintain total supply after multiple operations", async function () {
      const totalSupplyBefore = await airToken.totalSupply();

      // Transfer
      await airToken.transfer(user1.address, ethers.parseEther("1000"));

      // Approve and transferFrom
      await airToken.approve(user1.address, ethers.parseEther("500"));
      await airToken
        .connect(user1)
        .transferFrom(owner.address, user2.address, ethers.parseEther("500"));

      const totalSupplyAfter = await airToken.totalSupply();
      expect(totalSupplyAfter).to.equal(totalSupplyBefore);
    });
  });
});
