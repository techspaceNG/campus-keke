import rateLimit from 'express-rate-limit';

// Standard rate limiter for all general API routes
export const standardRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again after 15 minutes.',
    },
  },
});

// Stricter limiter for authentication endpoints (prevent brute-force logins)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    error: {
      message: 'Too many login or registration attempts. Please try again after 15 minutes.',
    },
  },
});

// Rate limiter for ticket verification to protect Ticket IDs against enumeration
export const ticketValidationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 scan/validation attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    error: {
      message: 'Scan frequency limit exceeded. Please wait a few seconds before scanning again.',
    },
  },
});
