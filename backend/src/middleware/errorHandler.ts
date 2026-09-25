import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";
import mongoose from "mongoose";
import AppError from "../appError.js";
import { zodFields } from "./validate.js";
import { logger } from "../logger.js";
import { config } from "../config.js";

const mongooseFields = (
  err: mongoose.Error.ValidationError,
): Record<string, string> => {
  const fields: Record<string, string> = {};
  for (const [path, detail] of Object.entries(err.errors)) {
    fields[path] = detail.message;
  }
  return fields;
};

export const errorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  _next,
): void => {
  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    res.status(status).json({
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "Image exceeds the 5 MB limit."
          : err.message,
      code: err.code === "LIMIT_FILE_SIZE" ? "PAYLOAD_TOO_LARGE" : "UPLOAD_ERROR",
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
      code: err.code ?? "ERROR",
    });
    return;
  }

  if (err instanceof ZodError) {
    const passwordIssue = err.issues.some((issue) =>
      issue.message.includes("password") || issue.message.includes("Password"),
    );
    const mismatchIssue = err.issues.some(
      (issue) => issue.path.join(".") === "confirmPassword",
    );
    const isPasswordRoute = req.originalUrl.includes("/account/password");
    const code = isPasswordRoute
      ? mismatchIssue
        ? "PASSWORD_MISMATCH"
        : passwordIssue
          ? "WEAK_PASSWORD"
          : "VALIDATION_ERROR"
      : "VALIDATION_ERROR";
    res.status(400).json({
      message: "Validation failed",
      code,
      fields: zodFields(err),
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      fields: mongooseFields(err),
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      message: "Invalid identifier",
      code: "INVALID_ID",
    });
    return;
  }

  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code: unknown }).code === 11000
  ) {
    const dup = err as { keyValue?: Record<string, unknown> };
    const field =
      dup.keyValue && Object.keys(dup.keyValue).length
        ? Object.keys(dup.keyValue)[0]
        : "field";
    res.status(409).json({
      message: `Duplicate value for ${field}`,
      code: "DUPLICATE_KEY",
    });
    return;
  }

  logger.error({ err, stack: err?.stack }, "unhandled error");
  res.status(500).json({
    message: config.isProd
      ? "Internal server error"
      : err instanceof Error
        ? err.message
        : "Internal server error",
    code: "INTERNAL_ERROR",
  });
};
