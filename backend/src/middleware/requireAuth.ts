import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { SellerModel } from "../models/Seller.js";
import AppError from "../appError.js";
import { verifyAccess } from "../services/tokens.js";
import type { AuthenticatedSeller } from "../types/auth.js";
import { asyncHandler } from "./asyncHandler.js";

const BEARER = "Bearer ";

export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith(BEARER)) {
      throw new AppError(401, "Missing or invalid Authorization header", "UNAUTHORIZED");
    }
    const token = header.slice(BEARER.length);
    let payload: jwt.JwtPayload;
    try {
      payload = verifyAccess(token) as unknown as jwt.JwtPayload;
    } catch {
      throw new AppError(401, "Invalid or expired access token", "UNAUTHORIZED");
    }
    if (payload.type !== "access") {
      throw new AppError(401, "Invalid token type", "UNAUTHORIZED");
    }
    const seller = await SellerModel.findById(payload.sub)
      .lean()
      .select("role status")
      .exec();
    if (!seller) {
      throw new AppError(401, "Seller not found", "UNAUTHORIZED");
    }
    req.seller = {
      id: seller._id.toString(),
      role: seller.role as AuthenticatedSeller["role"],
      status: seller.status as AuthenticatedSeller["status"],
    };
    return next();
  },
);
