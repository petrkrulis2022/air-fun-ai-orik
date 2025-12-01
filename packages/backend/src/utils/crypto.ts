import { ethers } from "ethers";

/**
 * Verify wallet signature using EIP-191 standard
 * @param address - Wallet address that signed the message
 * @param signature - Signature to verify
 * @param message - Original message that was signed
 * @returns true if signature is valid, false otherwise
 */
export function verifyWalletSignature(
  address: string,
  signature: string,
  message: string
): boolean {
  try {
    // Recover the address from the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    // Compare addresses (case-insensitive)
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error("Error verifying wallet signature:", error);
    return false;
  }
}

/**
 * Generate a challenge message for wallet authentication
 * @param address - Wallet address
 * @returns Challenge message to be signed
 */
export function generateChallengeMessage(address: string): string {
  const timestamp = Date.now();
  return `Sign this message to authenticate with air.fun\n\nAddress: ${address}\nTimestamp: ${timestamp}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
}
