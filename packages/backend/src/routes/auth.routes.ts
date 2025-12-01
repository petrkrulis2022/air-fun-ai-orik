import { Router, Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import { WalletType, ChainType } from "../types/auth.types.js";

const router = Router();

/**
 * POST /auth/wallet/connect
 * Web3 wallet authentication
 */
router.post("/wallet/connect", async (req: Request, res: Response) => {
  try {
    const { walletType, address, signature, message, chain } = req.body;

    if (!walletType || !address || !signature || !message || !chain) {
      return res.status(400).json({
        code: "AUTH_001",
        message: "Missing required fields",
        retryable: false,
      });
    }

    const session = await authService.connectWallet(
      walletType as WalletType,
      address,
      signature,
      message,
      chain as ChainType
    );

    res.json(session);
  } catch (error: any) {
    console.error("Wallet connect error:", error);
    res.status(401).json({
      code: "AUTH_INVALID_SIGNATURE",
      message: error.message || "Invalid wallet signature",
      retryable: false,
    });
  }
});

/**
 * POST /auth/email/register
 * Email registration
 */
router.post("/email/register", async (req: Request, res: Response) => {
  try {
    const { email, password, username, role } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({
        code: "AUTH_002",
        message: "Missing required fields",
        retryable: false,
      });
    }

    const session = await authService.registerEmail(email, password, username, role);

    res.json(session);
  } catch (error: any) {
    console.error("Email register error:", error);
    res.status(400).json({
      code: "AUTH_003",
      message: error.message || "Registration failed",
      retryable: false,
    });
  }
});

/**
 * POST /auth/email/login
 * Email login
 */
router.post("/email/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        code: "AUTH_004",
        message: "Missing required fields",
        retryable: false,
      });
    }

    const session = await authService.loginEmail(email, password);

    res.json(session);
  } catch (error: any) {
    console.error("Email login error:", error);
    res.status(401).json({
      code: "AUTH_005",
      message: error.message || "Invalid credentials",
      retryable: false,
    });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        code: "AUTH_006",
        message: "Missing refresh token",
        retryable: false,
      });
    }

    const session = await authService.refreshSession(refreshToken);

    res.json(session);
  } catch (error: any) {
    console.error("Token refresh error:", error);
    res.status(401).json({
      code: "AUTH_SESSION_EXPIRED",
      message: error.message || "Invalid or expired refresh token",
      retryable: false,
    });
  }
});

/**
 * POST /auth/logout
 * Logout and invalidate session
 */
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.invalidateSession(refreshToken);
    }

    res.json({ message: "Logged out successfully" });
  } catch (error: any) {
    console.error("Logout error:", error);
    res.status(500).json({
      code: "AUTH_007",
      message: "Logout failed",
      retryable: true,
    });
  }
});

/**
 * POST /auth/wallet/link
 * Link additional wallet to user account
 */
router.post("/wallet/link", async (req: Request, res: Response) => {
  try {
    const { userId, walletAddress, chain } = req.body;

    if (!userId || !walletAddress || !chain) {
      return res.status(400).json({
        code: "AUTH_008",
        message: "Missing required fields",
        retryable: false,
      });
    }

    await authService.linkWallet(userId, walletAddress, chain as ChainType);

    res.json({ message: "Wallet linked successfully" });
  } catch (error: any) {
    console.error("Link wallet error:", error);
    res.status(400).json({
      code: "AUTH_009",
      message: error.message || "Failed to link wallet",
      retryable: false,
    });
  }
});

/**
 * GET /auth/wallets/balances
 * Get wallet balances for user
 */
router.get("/wallets/balances", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        code: "AUTH_010",
        message: "Missing or invalid userId",
        retryable: false,
      });
    }

    const balances = await authService.getWalletBalances(userId);

    res.json(balances);
  } catch (error: any) {
    console.error("Get balances error:", error);
    res.status(500).json({
      code: "AUTH_011",
      message: "Failed to fetch balances",
      retryable: true,
    });
  }
});

export default router;
