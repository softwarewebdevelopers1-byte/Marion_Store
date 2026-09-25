import multer from "multer";
import type { Request } from "express";
import AppError from "../appError.js";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 8,
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          415,
          "Only JPEG, PNG and WebP images are allowed",
          "UNSUPPORTED_MEDIA_TYPE",
        ),
      );
    }
  },
});
