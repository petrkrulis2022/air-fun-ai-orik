import bcrypt from "bcrypt";
import { supabase } from "../config/supabase.js";
import {
  User,
  WalletAddress,
  AuthSession,
  SessionRecord,
  WalletType,
  ChainType,
  WalletBalance,
} from "../types/auth.types.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  calculateExpirationTime,
} from "../utils/jwt.js";
import { verifyWalletSignature } from "../utils/crypto.js";

const BCRYPT_ROUNDS = 10;

export class AuthService {
  /**
   * Connect wallet and authenticate user
   * Validates signature and creates/returns user session
   */
  async connectWallet(
    walletType: WalletType,
    address: string,
    signature: string,
    message: string,
    chain: ChainType
  ): Promise<AuthSession> {
    // Verify wallet signature using EIP-191 standard
    const isValid = verifyWalletSignature(address, signature, message);
    if (!isValid) {
      throw new Error("Invalid wallet signature");
    }

    // Check if wallet address already exists
    const { data: existingWallet } = await supabase
      .from("wallet_addresses")
      .select("*, users(*)")
      .eq("address", address)
      .eq("chain", chain)
      .single();

    let user: User;

    if (existingWallet) {
      // User exists, return existing user
      user = this.mapDbUserToUser(existingWallet.users);
    } else {
      // Create new user with wallet
      const username = `user_${address.slice(0, 8)}`;
      const now = Date.now();

      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          role: "viewer",
          username,
          created_at: now,
        })
        .select()
        .single();

      if (userError || !newUser) {
        throw new Error(`Failed to create user: ${userError?.message}`);
      }

      // Create wallet address record
      const { error: walletError } = await supabase.from("wallet_addresses").insert({
        user_id: newUser.id,
        chain,
        address,
        is_primary: true,
        verified: true,
        created_at: now,
      });

      if (walletError) {
        throw new Error(`Failed to create wallet: ${walletError.message}`);
      }

      user = this.mapDbUserToUser(newUser);
    }

    // Generate JWT tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);
    const expiresAt = calculateExpirationTime("1h");

    // Store refresh token in sessions table
    await this.createSession(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user,
      expiresAt,
    };
  }

  /**
   * Register new user with email and password
   */
  async registerEmail(
    email: string,
    password: string,
    username: string,
    role: "streamer" | "viewer" = "viewer"
  ): Promise<AuthSession> {
    // Check if email already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const now = Date.now();

    // Create user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        role,
        email,
        password_hash: passwordHash,
        username,
        created_at: now,
      })
      .select()
      .single();

    if (error || !newUser) {
      throw new Error(`Failed to create user: ${error?.message}`);
    }

    const user = this.mapDbUserToUser(newUser);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);
    const expiresAt = calculateExpirationTime("1h");

    // Store refresh token
    await this.createSession(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user,
      expiresAt,
    };
  }

  /**
   * Login with email and password
   */
  async loginEmail(email: string, password: string): Promise<AuthSession> {
    // Find user by email
    const { data: dbUser, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !dbUser) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isValid = await bcrypt.compare(password, dbUser.password_hash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    const user = this.mapDbUserToUser(dbUser);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);
    const expiresAt = calculateExpirationTime("1h");

    // Store refresh token
    await this.createSession(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user,
      expiresAt,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshSession(refreshToken: string): Promise<AuthSession> {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new Error("Invalid refresh token");
    }

    // Check if session exists and is valid
    const { data: session } = await supabase
      .from("sessions")
      .select("*")
      .eq("refresh_token", refreshToken)
      .eq("user_id", payload.userId)
      .single();

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.expires_at < Date.now()) {
      throw new Error("Session expired");
    }

    // Get user
    const { data: dbUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", payload.userId)
      .single();

    if (!dbUser) {
      throw new Error("User not found");
    }

    const user = this.mapDbUserToUser(dbUser);

    // Generate new access token
    const accessToken = generateAccessToken(user.id, user.role);
    const expiresAt = calculateExpirationTime("1h");

    // Update session last used time
    await supabase.from("sessions").update({ last_used_at: Date.now() }).eq("id", session.id);

    return {
      accessToken,
      refreshToken,
      user,
      expiresAt,
    };
  }

  /**
   * Invalidate session (logout)
   */
  async invalidateSession(refreshToken: string): Promise<void> {
    await supabase.from("sessions").delete().eq("refresh_token", refreshToken);
  }

  /**
   * Link additional wallet to existing user account
   */
  async linkWallet(userId: string, walletAddress: string, chain: ChainType): Promise<void> {
    // Check if wallet already linked to another user
    const { data: existingWallet } = await supabase
      .from("wallet_addresses")
      .select("*")
      .eq("address", walletAddress)
      .eq("chain", chain)
      .single();

    if (existingWallet && existingWallet.user_id !== userId) {
      throw new Error("Wallet already linked to another account");
    }

    if (existingWallet && existingWallet.user_id === userId) {
      // Already linked
      return;
    }

    // Link wallet
    const now = Date.now();
    const { error } = await supabase.from("wallet_addresses").insert({
      user_id: userId,
      chain,
      address: walletAddress,
      is_primary: false,
      verified: true,
      created_at: now,
    });

    if (error) {
      throw new Error(`Failed to link wallet: ${error.message}`);
    }
  }

  /**
   * Get wallet balances across all chains for a user
   */
  async getWalletBalances(userId: string): Promise<WalletBalance[]> {
    const { data: wallets } = await supabase
      .from("wallet_addresses")
      .select("*")
      .eq("user_id", userId);

    if (!wallets || wallets.length === 0) {
      return [];
    }

    // TODO: Implement actual balance fetching from blockchain
    // For now, return mock data
    return wallets.map((wallet) => ({
      chain: wallet.chain as ChainType,
      address: wallet.address,
      balance: 0,
      currency: wallet.chain === "hedera" ? "HBAR" : "ETH",
    }));
  }

  /**
   * Validate session token and return user
   */
  async validateSession(accessToken: string): Promise<User> {
    const { verifyAccessToken } = await import("../utils/jwt.js");
    const payload = verifyAccessToken(accessToken);

    if (!payload) {
      throw new Error("Invalid access token");
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", payload.userId)
      .single();

    if (!dbUser) {
      throw new Error("User not found");
    }

    return this.mapDbUserToUser(dbUser);
  }

  /**
   * Create session record in database
   */
  private async createSession(userId: string, refreshToken: string): Promise<void> {
    const now = Date.now();
    const expiresAt = calculateExpirationTime("7d");

    await supabase.from("sessions").insert({
      user_id: userId,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      created_at: now,
      last_used_at: now,
    });
  }

  /**
   * Map database user record to User type
   */
  private mapDbUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      role: dbUser.role,
      email: dbUser.email,
      username: dbUser.username,
      avatarUrl: dbUser.avatar_url,
      createdAt: dbUser.created_at,
      profileCategory: dbUser.profile_category,
      totalTokensCreated: dbUser.total_tokens_created,
      totalEarnings: dbUser.total_earnings,
      totalSpent: dbUser.total_spent,
      totalTokensBought: dbUser.total_tokens_bought,
      agentClickCount: dbUser.agent_click_count,
    };
  }
}

export const authService = new AuthService();
