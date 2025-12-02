import rateLimit from "express-rate-limit";

/**
 * Rate limiter for general API requests
 * 100 requests per minute per user
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests, please try again later",
    retryable: true,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for authentication endpoints
 * 10 attempts per minute per IP
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    code: "AUTH_RATE_LIMIT_EXCEEDED",
    message: "Too many authentication attempts, please try again later",
    retryable: true,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});
