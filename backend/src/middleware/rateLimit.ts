import rateLimit from "express-rate-limit";
import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";

const rateExceeded = (message: string, code: string) =>
  (
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void => {
    res.status(429).json({ message, code });
  };

export const generalLimiter = rateLimit({
  windowMs: 60_000,
  max: config.rateLimitGeneral,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateExceeded("Too many requests", "RATE_LIMITED"),
});

export const authLimiter = rateLimit({
  windowMs: 60_000,
  max: config.rateLimitAuth,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateExceeded(
    "Too many authentication attempts, please try again later",
    "RATE_LIMITED",
  ),
});
