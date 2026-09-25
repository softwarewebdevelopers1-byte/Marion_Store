import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireActiveSeller } from "../middleware/requireSeller.js";
import { upload } from "../middleware/upload.js";
import { z } from "zod";
import {
  uploadProductImages,
  deleteProductImage,
  reorderProductImages,
} from "../controllers/image.controller.js";

const router = Router({ mergeParams: true });

const reorderSchema = z.object({
  orderedKeys: z.array(z.string().min(1)),
});

router.post(
  "/:id/images",
  requireAuth,
  requireActiveSeller,
  upload.array("images", 8),
  asyncHandler(uploadProductImages),
);

router.delete(
  "/:id/images/:key",
  requireAuth,
  requireActiveSeller,
  asyncHandler(deleteProductImage),
);

router.patch(
  "/:id/images/reorder",
  requireAuth,
  requireActiveSeller,
  validate({ body: reorderSchema }),
  asyncHandler(reorderProductImages),
);

export default router;
