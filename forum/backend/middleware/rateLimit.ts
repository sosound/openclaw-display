import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: config.rateLimit.maxRequests, // 100 requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for post creation
export const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 posts per hour
  message: { error: 'Too many posts created, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for reply creation
export const replyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 replies per hour
  message: { error: 'Too many replies created, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for search
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: { error: 'Too many search requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});
