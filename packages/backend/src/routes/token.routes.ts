import { Router, Request, Response } from "express";
import tokenFactoryService from "../services/token-factory.service.js";
import { CreateMemecoinRequest, UpdateTokenMetadataRequest } from "../types/token.types.js";

const router = Router();

/**
 * GET /tokens/:id
 * Get token details by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const memecoin = await tokenFactoryService.getMemecoin(id);

    if (!memecoin) {
      return res.status(404).json({
        code: "TOKEN_NOT_FOUND",
        message: "Token not found",
      });
    }

    res.json(memecoin);
  } catch (error: any) {
    console.error("Error fetching token:", error);
    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to fetch token",
      details: error.message,
    });
  }
});

/**
 * GET /tokens/stream/:streamId
 * Get token by stream ID
 */
router.get("/stream/:streamId", async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;

    const memecoin = await tokenFactoryService.getMemecoinByStream(streamId);

    if (!memecoin) {
      return res.status(404).json({
        code: "TOKEN_NOT_FOUND",
        message: "Token not found for this stream",
      });
    }

    res.json(memecoin);
  } catch (error: any) {
    console.error("Error fetching token by stream:", error);
    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to fetch token",
      details: error.message,
    });
  }
});

/**
 * PUT /tokens/:id/metadata
 * Update token metadata
 */
router.put("/:id/metadata", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const metadata = req.body;

    // Validate token exists
    const memecoin = await tokenFactoryService.getMemecoin(id);
    if (!memecoin) {
      return res.status(404).json({
        code: "TOKEN_NOT_FOUND",
        message: "Token not found",
      });
    }

    const request: UpdateTokenMetadataRequest = {
      tokenId: id,
      metadata,
    };

    await tokenFactoryService.updateTokenMetadata(request);

    res.json({
      success: true,
      message: "Token metadata updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating token metadata:", error);
    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to update token metadata",
      details: error.message,
    });
  }
});

/**
 * POST /tokens/:id/graduate
 * Trigger token graduation
 */
router.post("/:id/graduate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check eligibility
    const isEligible = await tokenFactoryService.checkGraduationEligibility(id);

    if (!isEligible) {
      return res.status(400).json({
        code: "GRADUATION_NOT_ELIGIBLE",
        message: "Token is not eligible for graduation",
      });
    }

    const result = await tokenFactoryService.graduateToken(id);

    res.json(result);
  } catch (error: any) {
    console.error("Error graduating token:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        code: "TOKEN_NOT_FOUND",
        message: error.message,
      });
    }

    if (error.message.includes("already graduated")) {
      return res.status(400).json({
        code: "TOKEN_ALREADY_GRADUATED",
        message: error.message,
      });
    }

    if (error.message.includes("below graduation threshold")) {
      return res.status(400).json({
        code: "GRADUATION_THRESHOLD_NOT_MET",
        message: error.message,
      });
    }

    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to graduate token",
      details: error.message,
    });
  }
});

/**
 * GET /tokens/:id/eligibility
 * Check graduation eligibility
 */
router.get("/:id/eligibility", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const isEligible = await tokenFactoryService.checkGraduationEligibility(id);

    res.json({
      tokenId: id,
      isEligible,
    });
  } catch (error: any) {
    console.error("Error checking graduation eligibility:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        code: "TOKEN_NOT_FOUND",
        message: error.message,
      });
    }

    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to check graduation eligibility",
      details: error.message,
    });
  }
});

/**
 * POST /tokens/create
 * Create a new memecoin (typically called internally when stream starts)
 */
router.post("/create", async (req: Request, res: Response) => {
  try {
    const { streamerId, streamerName, streamId } = req.body;

    if (!streamerId || !streamerName || !streamId) {
      return res.status(400).json({
        code: "INVALID_REQUEST",
        message: "Missing required fields: streamerId, streamerName, streamId",
      });
    }

    const request: CreateMemecoinRequest = {
      streamerId,
      streamerName,
      streamId,
    };

    const result = await tokenFactoryService.createMemecoin(request);

    res.status(201).json(result);
  } catch (error: any) {
    console.error("Error creating memecoin:", error);
    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to create memecoin",
      details: error.message,
    });
  }
});

export default router;
