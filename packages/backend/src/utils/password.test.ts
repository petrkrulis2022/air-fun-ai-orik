import { describe, it, expect } from "vitest";
import bcrypt from "bcrypt";

describe("Password Hashing and Comparison", () => {
  it("should hash password correctly", async () => {
    const password = "testPassword123!";
    const hash = await bcrypt.hash(password, 10);

    expect(hash).toBeTruthy();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(0);
  });

  it("should verify correct password", async () => {
    const password = "mySecurePassword456";
    const hash = await bcrypt.hash(password, 10);

    const isValid = await bcrypt.compare(password, hash);

    expect(isValid).toBe(true);
  });

  it("should reject incorrect password", async () => {
    const password = "correctPassword";
    const wrongPassword = "wrongPassword";
    const hash = await bcrypt.hash(password, 10);

    const isValid = await bcrypt.compare(wrongPassword, hash);

    expect(isValid).toBe(false);
  });

  it("should generate different hashes for same password", async () => {
    const password = "samePassword123";
    const hash1 = await bcrypt.hash(password, 10);
    const hash2 = await bcrypt.hash(password, 10);

    // Hashes should be different due to salt
    expect(hash1).not.toBe(hash2);

    // But both should verify correctly
    expect(await bcrypt.compare(password, hash1)).toBe(true);
    expect(await bcrypt.compare(password, hash2)).toBe(true);
  });

  it("should handle empty password", async () => {
    const password = "";
    const hash = await bcrypt.hash(password, 10);

    const isValid = await bcrypt.compare(password, hash);

    expect(isValid).toBe(true);
  });

  it("should handle special characters in password", async () => {
    const password = "p@ssw0rd!#$%^&*()";
    const hash = await bcrypt.hash(password, 10);

    const isValid = await bcrypt.compare(password, hash);

    expect(isValid).toBe(true);
  });
});
