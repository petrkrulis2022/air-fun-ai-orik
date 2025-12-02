import { Request, Response, NextFunction } from "express";

export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  suggestedAction?: string;
}

/**
 * Global error handling middleware
 * Catches all errors and formats them consistently
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);

  // Default error response
  const errorResponse: ErrorResponse = {
    code: err.code || "INTERNAL_ERROR",
    message: err.message || "An unexpected error occurred",
    retryable: err.retryable !== undefined ? err.retryable : true,
  };

  // Add details if available
  if (err.details) {
    errorResponse.details = err.details;
  }

  // Add suggested action if available
  if (err.suggestedAction) {
    errorResponse.suggestedAction = err.suggestedAction;
  }

  // Determine status code
  let statusCode = err.statusCode || 500;

  // Map common error codes to status codes
  if (err.code) {
    if (err.code.startsWith("AUTH_")) {
      statusCode = err.code === "AUTH_SESSION_EXPIRED" ? 401 : 400;
    } else if (err.code.startsWith("VALIDATION_")) {
      statusCode = 400;
    } else if (err.code.includes("NOT_FOUND")) {
      statusCode = 404;
    } else if (err.code.includes("RATE_LIMIT")) {
      statusCode = 429;
    }
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    code: "ROUTE_NOT_FOUND",
    message: `Route ${req.method} ${req.path} not found`,
    retryable: false,
  });
};
