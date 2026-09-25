import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireActiveSeller } from "../middleware/requireSeller.js";
import { upload } from "../middleware/upload.js";
import {
  accountUpdateSchema,
  changePasswordSchema,
  payoutAccountSchema,
} from "../schemas/account.schema.js";
import {
  getAccount,
  updateAccount,
  changePassword,
  updatePayout,
  uploadLogo,
  uploadBanner,
  deleteLogo,
  deleteBanner,
} from "../controllers/account.controller.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(getAccount),
);

router.patch(
  "/",
  requireAuth,
  validate({ body: accountUpdateSchema }),
  asyncHandler(updateAccount),
);

router.post(
  "/password",
  requireAuth,
  validate({ body: changePasswordSchema }),
  asyncHandler(changePassword),
);

router.put(
  "/payout",
  requireAuth,
  validate({ body: payoutAccountSchema }),
  asyncHandler(updatePayout),
);

router.post(
  "/logo",
  requireAuth,
  requireActiveSeller,
  upload.single("image"),
  asyncHandler(uploadLogo),
);

router.delete(
  "/logo",
  requireAuth,
  requireActiveSeller,
  asyncHandler(deleteLogo),
);

router.post(
  "/banner",
  requireAuth,
  requireActiveSeller,
  upload.single("image"),
  asyncHandler(uploadBanner),
);

router.delete(
  "/banner",
  requireAuth,
  requireActiveSeller,
  asyncHandler(deleteBanner),
);

export default router;
