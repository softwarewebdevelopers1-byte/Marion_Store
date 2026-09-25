import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { SellerModel } from "../models/Seller.js";
import type { PublicSeller } from "../types/seller.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const seller = await SellerModel.findOne({
      status: "ACTIVE",
      role: "SELLER",
    })
      .select("store")
      .lean()
      .exec();

    if (!seller) {
      res.status(404).json({ message: "No active store found", code: "STORE_NOT_FOUND" });
      return;
    }

    const store = seller.store;
    const publicSeller: PublicSeller = {
      slug: store?.slug ?? "marion-store",
      name: store?.name ?? "Marion Store",
      sellerName: store?.name ?? "Marion Store",
      tagline: store?.tagline ?? undefined,
      description: store?.description ?? undefined,
      logo: store?.logoUrl ?? "/favicon.svg",
      banner: store?.bannerUrl ?? "",
      themeColor: store?.themeColor ?? "#0f172a",
      currency: store?.currency ?? "KES",
      supportHours: store?.supportHours ?? "",
      whatsappNumber: store?.social?.whatsapp ?? "",
    };

    res.json(publicSeller);
  }),
);

export default router;
