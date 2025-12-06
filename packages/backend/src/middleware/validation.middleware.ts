import { Request, Response, NextFunction } from "express";

/**
 * Sanitize string input to prevent injection attacks
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== "string") return input;

  // Remove potential SQL injection characters
  let sanitized = input.replace(/[';]/g, "").replace(/--/g, "");

  // Remove potential XSS characters
  sanitized = sanitized
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");

  return sanitized.trim();
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = (obj: any): any => {
  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj !== null && typeof obj === "object") {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Middleware to sanitize request body
 * Skip sanitization for WebRTC transport endpoints that need raw data
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Skip sanitization for WebRTC transport routes which need raw technical data
  // These routes handle RTP parameters with mime types like "video/VP8"
  if (req.path.includes("/transport/") || req.path.includes("/rtp-capabilities")) {
    return next();
  }

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Validate required fields in request body
 */
export const validateRequiredFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields = fields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: `Missing required fields: ${missingFields.join(", ")}`,
        retryable: false,
      });
    }

    next();
  };
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate wallet address format
 */
export const isValidWalletAddress = (address: string, chain: string): boolean => {
  if (chain === "hedera") {
    // Hedera account ID format: 0.0.xxxxx
    return /^0\.0\.\d+$/.test(address);
  } else if (chain === "base") {
    // Ethereum address format: 0x followed by 40 hex characters
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
  return false;
};

/**
 * Validate positive number
 */
export const isPositiveNumber = (value: any): boolean => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};
