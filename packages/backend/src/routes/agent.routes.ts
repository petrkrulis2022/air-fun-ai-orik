import { Router, Request, Response } from "express";
import aiAgentService from "../services/ai-agent.service.js";
import { AgentConfig } from "../types/agent.types.js";
import { validateRequiredFields, isPositiveNumber } from "../middleware/validation.middleware.js";

const router = Router();

/**
 * GET /agents/templates
 * List all agent templates
 */
router.get("/templates", async (req: Request, res: Response) => {
  try {
    const templates = await aiAgentService.listAgentTemplates();
    res.json(templates);
  } catch (error: any) {
    console.error("Error listing agent templates:", error);
    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to list agent templates",
      details: error.message,
      retryable: true,
    });
  }
});

/**
 * GET /agents/templates/:id
 * Get template details by ID
 */
router.get("/templates/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await aiAgentService.getAgentTemplate(id);
    res.json(template);
  } catch (error: any) {
    console.error("Error getting agent template:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        code: "TEMPLATE_NOT_FOUND",
        message: error.message,
        retryable: false,
      });
    }

    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to get agent template",
      details: error.message,
      retryable: true,
    });
  }
});

/**
 * POST /agents/deploy
 * Deploy an agent to a stream
 */
router.post("/deploy", async (req: Request, res: Response) => {
  try {
    const { streamId, config } = req.body;

    if (!streamId || !config) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Missing required fields: streamId, config",
        retryable: false,
      });
    }

    // Validate config fields
    if (
      !config.name ||
      !config.templateId ||
      !config.position ||
      !Array.isArray(config.position) ||
      config.position.length !== 3
    ) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid agent config: name, templateId, and position [x, y, z] are required",
        retryable: false,
      });
    }

    if (
      config.defaultPurchaseAmount !== undefined &&
      !isPositiveNumber(config.defaultPurchaseAmount)
    ) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "defaultPurchaseAmount must be a positive number",
        retryable: false,
      });
    }

    const agentConfig: AgentConfig = {
      name: config.name,
      templateId: config.templateId,
      position: config.position as [number, number, number],
      defaultPurchaseAmount: config.defaultPurchaseAmount || 100,
      quickBuyEnabled: config.quickBuyEnabled !== undefined ? config.quickBuyEnabled : true,
      challenge: config.challenge,
    };

    const deployedAgent = await aiAgentService.deployAgent(streamId, agentConfig);

    res.status(201).json(deployedAgent);
  } catch (error: any) {
    console.error("Error deploying agent:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        code: "RESOURCE_NOT_FOUND",
        message: error.message,
        retryable: false,
      });
    }

    if (error.message.includes("non-live stream")) {
      return res.status(400).json({
        code: "STREAM_NOT_LIVE",
        message: error.message,
        retryable: false,
      });
    }

    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to deploy agent",
      details: error.message,
      retryable: true,
    });
  }
});

/**
 * GET /agents/:id
 * Get agent details by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agent = await aiAgentService.getAgent(id);
    res.json(agent);
  } catch (error: any) {
    console.error("Error getting agent:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        code: "AGENT_NOT_FOUND",
        message: error.message,
        retryable: false,
      });
    }

    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to get agent",
      details: error.message,
      retryable: true,
    });
  }
});

/**
 * GET /agents/stream/:streamId
 * Get all agents for a stream
 */
router.get("/stream/:streamId", async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    const agents = await aiAgentService.getStreamAgents(streamId);
    res.json(agents);
  } catch (error: any) {
    console.error("Error getting stream agents:", error);
    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to get stream agents",
      details: error.message,
      retryable: true,
    });
  }
});

/**
 * PUT /agents/:id/position
 * Update agent position in 3D space
 */
router.put("/:id/position", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { position } = req.body;

    if (!position || !Array.isArray(position) || position.length !== 3) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid position: must be an array of 3 numbers [x, y, z]",
        retryable: false,
      });
    }

    await aiAgentService.updateAgentPosition(id, position as [number, number, number]);

    res.json({
      success: true,
      message: "Agent position updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating agent position:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        code: "AGENT_NOT_FOUND",
        message: error.message,
        retryable: false,
      });
    }

    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to update agent position",
      details: error.message,
      retryable: true,
    });
  }
});

/**
 * DELETE /agents/:id
 * Remove an agent from a stream
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await aiAgentService.removeAgent(id);

    res.json({
      success: true,
      message: "Agent removed successfully",
    });
  } catch (error: any) {
    console.error("Error removing agent:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        code: "AGENT_NOT_FOUND",
        message: error.message,
        retryable: false,
      });
    }

    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to remove agent",
      details: error.message,
      retryable: true,
    });
  }
});

/**
 * POST /agents/:id/click
 * Track agent click
 */
router.post("/:id/click", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Missing required field: userId",
        retryable: false,
      });
    }

    await aiAgentService.trackAgentClick(id, userId);

    res.json({
      success: true,
      message: "Agent click tracked successfully",
    });
  } catch (error: any) {
    console.error("Error tracking agent click:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        code: "AGENT_NOT_FOUND",
        message: error.message,
        retryable: false,
      });
    }

    if (error.message.includes("non-active agent")) {
      return res.status(400).json({
        code: "AGENT_NOT_ACTIVE",
        message: error.message,
        retryable: false,
      });
    }

    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to track agent click",
      details: error.message,
      retryable: true,
    });
  }
});

/**
 * GET /agents/:id/stats
 * Get agent statistics
 */
router.get("/:id/stats", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const stats = await aiAgentService.getAgentStats(id);

    res.json(stats);
  } catch (error: any) {
    console.error("Error getting agent stats:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        code: "AGENT_NOT_FOUND",
        message: error.message,
        retryable: false,
      });
    }

    res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to get agent stats",
      details: error.message,
      retryable: true,
    });
  }
});

export default router;
