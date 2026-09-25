import type { NextFunction, Request, Response } from "express";
import AppError from "../appError.js";

export const requireSeller = (
  _req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const role = _req.seller?.role;
  if (!role) {
    throw new AppError(401, "Authentication required", "UNAUTHORIZED");
  }
  if (role !== "SELLER" && role !== "ADMIN") {
    throw new AppError(403, "Insufficient role", "FORBIDDEN");
  }
  next();
};

export const requireActiveSeller = (
  _req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!_req.seller) {
    throw new AppError(401, "Authentication required", "UNAUTHORIZED");
  }
  if (_req.seller.status !== "ACTIVE") {
    throw new AppError(403, "Seller account is not active", "FORBIDDEN");
  }
  next();
};
