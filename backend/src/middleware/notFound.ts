import type { NextFunction, Request, Response } from "express";
import AppError from "../appError.js";

export const notFound = (
  _req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  next(new AppError(404, "Resource not found", "NOT_FOUND"));
};
