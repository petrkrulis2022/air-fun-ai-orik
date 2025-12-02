import { Router, Request, Response } from "express";
import bondingCurveService from "../services/bonding-curve.service.js";
import { PurchaseRequest } from "../types/bonding-curve.types.js";
import { validateRequiredFields, isPositiveNumber } from "../middleware/validation.middleware.js";

const router = Router();

/**
 * POST /purchases/quote
 * Get price quote for token purchase
 */
router.post("/quote", async (req: Request, res: Response) => {
  try {
    const { tokenId, amount } = req.body;

    if (!tokenId || !amount) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Missing required fields: tokenId, amount",
        retryable: false,
      });
    }

    if (!isPositiveNumber(amount)) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Amount must be a positive number",
        retryable: false,
      });
    }

    const quote = await bondingCurveService.getPriceQuote(tokenId, Number(amount));

    res.json(quote);
  } catch (error: any) {
    console.error("Error getting price quote:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        code: "TOKEN_NOT_FOUND",
        message: error.message,
        retryable: false,
      });
    }

    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to get price quote",
      details: error.message,
      retryable: true,
    });
  }
});

/**
 * POST /purchases/execute
 * Execute token purchase
 */
router.post("/execute", async (req: Request, res: Response) => {
  try {
    const { tokenId, buyerId, amount, maxSlippage, chain } = req.body;

    if (!tokenId || !buyerId || !amount || !chain) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Missing required fields: tokenId, buyerId, amount, chain",
        retryable: false,
      });
    }

    if (!isPositiveNumber(amount)) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Amount must be a positive number",
        retryable: false,
      });
    }

    const purchaseRequest: PurchaseRequest = {
      tokenId,
      buyerId,
      amount: Number(amount),
      maxSlippage: maxSlippage !== undefined ? Number(maxSlippage) : 0.005, // Default 0.5%
      chain,
    };

    const purchase = await bondingCurveService.executePurchase(purchaseRequest);

    res.json(purchase);
  } catch (error: any) {
    console.error("Error executing purchase:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        code: "TOKEN_NOT_FOUND",
        message: error.message,
        retryable: false,
      });
    }

    if (error.message.includes("Minimum purchase")) {
      return res.status(400).json({
        code: "PURCHASE_BELOW_MINIMUM",
        message: error.message,
        retryable: false,
      });
    }

    if (error.message.includes("graduated")) {
      return res.status(400).json({
        code: "TOKEN_ALREADY_GRADUATED",
        message: error.message,
        retryable: false,
      });
    }

    if (error.message.includes("Slippage exceeded")) {
      return res.status(400).json({
        code: "PURCHASE_SLIPPAGE_EXCEEDED",
        message: error.message,
        retryable: true,
        suggestedAction: "Try again with a higher slippage tolerance",
      });
    }

    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to execute purchase",
      details: error.message,
      retryable: true,
    });
  }
});

/**
 * GET /purchases/:id
 * Get purchase details by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Query purchase from database
    const supabase = (await import("../config/supabase.js")).default;
    const { data: purchase, error } = await supabase
      .from("purchases")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !purchase) {
      return res.status(404).json({
        code: "PURCHASE_NOT_FOUND",
        message: "Purchase not found",
        retryable: false,
      });
    }

    // Format response
    const formattedPurchase = {
      id: purchase.id,
      tokenId: purchase.token_id,
      buyerId: purchase.buyer_id,
      amount: purchase.amount,
      price: purchase.price,
      totalSpent: purchase.total_spent,
      fees: {
        creatorFee: purchase.creator_fee,
        platformFee: purchase.platform_fee,
      },
      txHash: purchase.tx_hash,
      timestamp: purchase.timestamp,
    };

    res.json(formattedPurchase);
  } catch (error: any) {
    console.error("Error fetching purchase:", error);
    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to fetch purchase",
      details: error.message,
      retryable: true,
    });
  }
});

/**
 * GET /purchases/user/:userId
 * Get user purchase history
 */
router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    // Query purchases from database
    const supabase = (await import("../config/supabase.js")).default;
    const { data: purchases, error } = await supabase
      .from("purchases")
      .select("*")
      .eq("buyer_id", userId)
      .order("timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Format response
    const formattedPurchases = (purchases || []).map((purchase) => ({
      id: purchase.id,
      tokenId: purchase.token_id,
      buyerId: purchase.buyer_id,
      amount: purchase.amount,
      price: purchase.price,
      totalSpent: purchase.total_spent,
      fees: {
        creatorFee: purchase.creator_fee,
        platformFee: purchase.platform_fee,
      },
      txHash: purchase.tx_hash,
      timestamp: purchase.timestamp,
    }));

    res.json({
      purchases: formattedPurchases,
      total: formattedPurchases.length,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Error fetching user purchases:", error);
    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to fetch user purchases",
      details: error.message,
      retryable: true,
    });
  }
});

export default router;
