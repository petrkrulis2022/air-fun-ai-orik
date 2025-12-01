import { describe, it, expect } from "vitest";
import { verifyWalletSignature, generateChallengeMessage } from "./crypto.js";
import { ethers } from "ethers";

describe("Crypto Utils - Wallet Signature Verification", () => {
  it("should verify valid wallet signature", async () => {
    // Create a test wallet
    const wallet = ethers.Wallet.createRandom();
    const address = wallet.address;
    const message = "Test message for signing";

    // Sign the message
    const signature = await wallet.signMessage(message);

    // Verify signature
    const isValid = verifyWalletSignature(address, signature, message);

    expect(isValid).toBe(true);
  });

  it("should reject invalid signature", () => {
    const address = "0x1234567890123456789012345678901234567890";
    const signature = "0xinvalidsignature";
    const message = "Test message";

    const isValid = verifyWalletSignature(address, signature, message);

    expect(isValid).toBe(false);
  });

  it("should reject signature from different address", async () => {
    const wallet1 = ethers.Wallet.createRandom();
    const wallet2 = ethers.Wallet.createRandom();
    const message = "Test message";

    const signature = await wallet1.signMessage(message);

    // Try to verify with different address
    const isValid = verifyWalletSignature(wallet2.address, signature, message);

    expect(isValid).toBe(false);
  });

  it("should reject signature for different message", async () => {
    const wallet = ethers.Wallet.createRandom();
    const message1 = "Original message";
    const message2 = "Different message";

    const signature = await wallet.signMessage(message1);

    // Try to verify with different message
    const isValid = verifyWalletSignature(wallet.address, signature, message2);

    expect(isValid).toBe(false);
  });

  it("should generate challenge message with address and timestamp", () => {
    const address = "0x1234567890123456789012345678901234567890";
    const message = generateChallengeMessage(address);

    expect(message).toContain(address);
    expect(message).toContain("air.fun");
    expect(message).toContain("Timestamp:");
  });
});
