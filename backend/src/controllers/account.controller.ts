import type { Request, Response } from "express";
import { SellerModel, hashPassword } from "../models/Seller.js";
import { logAudit } from "../models/SellerAuditLog.js";
import { invalidateStoreCache } from "../services/products.js";
import { uploadImage, deleteImage } from "../services/storage.service.js";
import AppError from "../appError.js";
import type { AccountUpdateBody } from "../schemas/account.schema.js";
import { FORBIDDEN_ACCOUNT_FIELDS } from "../schemas/account.schema.js";
import type { SellerStore } from "../types/seller.js";

function flattenChangedPaths(obj: unknown, prefix = ""): string[] {
  const paths: string[] = [];
  if (!obj || typeof obj !== "object") return paths;
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (key === "logoKey" || key === "bannerKey") continue;
    if (val && typeof val === "object" && !Array.isArray(val)) {
      paths.push(...flattenChangedPaths(val, path));
    } else {
      paths.push(path);
    }
  }
  return paths;
}

export async function getAccount(req: Request, res: Response): Promise<void> {
  const seller = await SellerModel.findById(req.seller!.id)
    .select("+passwordChangedAt")
    .exec();
  if (!seller) {
    throw new AppError(404, "Seller not found", "NOT_FOUND");
  }
  res.json(seller.toAdminJSON());
}

export async function updateAccount(req: Request, res: Response): Promise<void> {
  const body = req.validated!.body as AccountUpdateBody;
  const patch = body as Record<string, unknown>;

  for (const key of Object.keys(patch)) {
    if (FORBIDDEN_ACCOUNT_FIELDS.has(key)) {
      throw new AppError(
        400,
        `Field '${key}' is not allowed`,
        "VALIDATION_ERROR",
      );
    }
  }

  const storePatch = patch.store as Record<string, unknown> | undefined;
  const payoutPatch = patch.payout as Record<string, unknown> | undefined;
  const businessPatch = patch.business as Record<string, unknown> | undefined;
  const socialPatch = storePatch?.social as Record<string, unknown> | undefined;

  if (storePatch) {
    if (storePatch.logoUrl || storePatch.logoKey) {
      throw new AppError(
        400,
        "logoUrl and logoKey cannot be set via this endpoint",
        "VALIDATION_ERROR",
      );
    }
    if (storePatch.bannerUrl || storePatch.bannerKey) {
      throw new AppError(
        400,
        "bannerUrl and bannerKey cannot be set via this endpoint",
        "VALIDATION_ERROR",
      );
    }
  }

  if (socialPatch) {
    for (const key of Object.keys(socialPatch)) {
      if (FORBIDDEN_ACCOUNT_FIELDS.has(key)) {
        throw new AppError(
          400,
          `Field 'store.social.${key}' is not allowed`,
          "VALIDATION_ERROR",
        );
      }
    }
  }

  if (businessPatch) {
    for (const key of Object.keys(businessPatch)) {
      if (FORBIDDEN_ACCOUNT_FIELDS.has(key)) {
        throw new AppError(
          400,
          `Field 'business.${key}' is not allowed`,
          "VALIDATION_ERROR",
        );
      }
    }
  }

  if (payoutPatch) {
    for (const key of Object.keys(payoutPatch)) {
      if (FORBIDDEN_ACCOUNT_FIELDS.has(key)) {
        throw new AppError(
          400,
          `Field 'payout.${key}' is not allowed`,
          "VALIDATION_ERROR",
        );
      }
    }
    if ("accountNumber" in payoutPatch || "account" in payoutPatch) {
      throw new AppError(
        400,
        "accountNumber/account must be updated via the dedicated payout endpoint",
        "VALIDATION_ERROR",
      );
    }
  }

  const changedPaths = flattenChangedPaths(patch);

  const seller = await SellerModel.findById(req.seller!.id).exec();
  if (!seller) {
    throw new AppError(404, "Seller not found", "NOT_FOUND");
  }

  let requiresReverification = false;

  if (patch.email && patch.email !== seller.email) {
    requiresReverification = true;
  }
  if (patch.phone && patch.phone !== seller.phone) {
    requiresReverification = true;
  }

  if (storePatch?.slug) {
    const existing = await SellerModel.findOne({
      _id: { $ne: seller._id },
      "store.slug": storePatch.slug,
    }).exec();
    if (existing) {
      throw new AppError(409, "Store slug is already taken", "SLUG_TAKEN");
    }
  }

  let needsStoreSync = false;
  if (storePatch) {
    const store = seller.store ?? {};
    for (const [key, val] of Object.entries(storePatch)) {
      if (key === "social") continue;
      (store as unknown as Record<string, unknown>)[key] = val;
    }
    if (socialPatch) {
      store.social = {
        ...(store.social ?? { whatsapp: "" }),
        ...(socialPatch as Record<string, unknown>),
      } as typeof store.social;
    }
    seller.store = store;
    needsStoreSync = true;
  }

  if (patch.address) {
    seller.address = {
      ...(seller.address ?? {}),
      ...(patch.address as Record<string, unknown>),
    } as typeof seller.address;
  }
  if (patch.business) {
    seller.business = {
      ...(seller.business ?? {}),
      ...(patch.business as Record<string, unknown>),
    } as typeof seller.business;
  }
  if (payoutPatch) {
    seller.payout = {
      ...(seller.payout ?? {}),
      ...payoutPatch,
    } as typeof seller.payout;
  }
  if (patch.settings) {
    seller.settings = {
      ...seller.settings,
      ...(patch.settings as Record<string, unknown>),
    } as typeof seller.settings;
  }

  if (patch.displayName) seller.displayName = patch.displayName as string;
  if (patch.email) seller.email = patch.email as string;
  if (patch.phone) seller.phone = patch.phone as string;

  try {
    await seller.save();
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code: number }).code === 11000) {
      const dup = err as { keyValue?: Record<string, unknown> };
      const field = dup.keyValue ? Object.keys(dup.keyValue)[0] : "field";
      throw new AppError(409, `Duplicate value for ${field}`, "DUPLICATE_KEY");
    }
    throw err;
  }

  if (needsStoreSync) {
    invalidateStoreCache();
  }

  const idStr = seller._id.toString();
  await logAudit(idStr, idStr, "SELLER_UPDATED", changedPaths);

  const result = seller.toAdminJSON() as unknown as Record<string, unknown>;
  result.requiresReverification = requiresReverification;
  res.json(result);
}

export async function changePassword(
  req: Request,
  res: Response,
): Promise<void> {
  const { currentPassword, newPassword } = req.validated!.body as {
    currentPassword: string;
    newPassword: string;
  };

  const seller = await SellerModel.findById(req.seller!.id)
    .select("+passwordHash")
    .exec();
  if (!seller) {
    throw new AppError(404, "Seller not found", "NOT_FOUND");
  }

  const valid = await seller.comparePassword(currentPassword);
  if (!valid) {
    throw new AppError(401, "Current password is incorrect", "INVALID_CURRENT_PASSWORD");
  }

  seller.passwordHash = await hashPassword(newPassword);
  seller.passwordChangedAt = new Date();
  seller.refreshTokenHash = null;
  await seller.save();

  const idStr = seller._id.toString();
  await logAudit(idStr, idStr, "PASSWORD_CHANGED", ["passwordHash"]);

  res.status(204).send();
}

export async function updatePayout(
  req: Request,
  res: Response,
): Promise<void> {
  const { accountRef } = req.validated!.body as { accountRef: string };

  const seller = await SellerModel.findById(req.seller!.id).exec();
  if (!seller) {
    throw new AppError(404, "Seller not found", "NOT_FOUND");
  }

  const payout = seller.payout ?? { provider: "MPESA" as const };
  payout.isVerified = false;
  payout.accountRef = accountRef;
  seller.payout = payout as typeof seller.payout;
  await seller.save();

  const idStr = seller._id.toString();
  await logAudit(idStr, idStr, "PAYOUT_UPDATED", ["payout.accountRef"]);

  res.json(seller.toAdminJSON());
}

export async function uploadLogo(req: Request, res: Response): Promise<void> {
  const sellerId = req.seller!.id;
  const file = req.file;

  if (!file) {
    throw new AppError(400, "No logo file provided", "VALIDATION_ERROR");
  }
  const stored = await uploadImage(file, {
    sellerId,
    keyPrefix: `sellers/${sellerId}/branding`,
  });

  const seller = await SellerModel.findById(sellerId)
    .select("+store.logoKey +store.bannerKey")
    .exec();
  if (!seller) {
    throw new AppError(404, "Seller not found", "NOT_FOUND");
  }

  if (seller.store?.logoKey) {
    try {
      await deleteImage(seller.store.logoKey);
    } catch {
    }
  }

  seller.store = seller.store ?? ({} as unknown as SellerStore);
  (seller.store as unknown as Record<string, unknown>).logoUrl = stored.url;
  (seller.store as unknown as Record<string, unknown>).logoKey = stored.key;
  await seller.save();

  invalidateStoreCache();
  res.json(seller.toAdminJSON());
}

export async function uploadBanner(req: Request, res: Response): Promise<void> {
  const sellerId = req.seller!.id;
  const file = req.file;

  if (!file) {
    throw new AppError(400, "No banner file provided", "VALIDATION_ERROR");
  }
  const stored = await uploadImage(file, {
    sellerId,
    keyPrefix: `sellers/${sellerId}/branding`,
  });

  const seller = await SellerModel.findById(sellerId)
    .select("+store.logoKey +store.bannerKey")
    .exec();
  if (!seller) {
    throw new AppError(404, "Seller not found", "NOT_FOUND");
  }

  if (seller.store?.bannerKey) {
    try {
      await deleteImage(seller.store.bannerKey);
    } catch {
    }
  }

  seller.store = seller.store ?? ({} as unknown as SellerStore);
  (seller.store as unknown as Record<string, unknown>).bannerUrl = stored.url;
  (seller.store as unknown as Record<string, unknown>).bannerKey = stored.key;
  await seller.save();

  invalidateStoreCache();
  res.json(seller.toAdminJSON());
}

export async function deleteLogo(req: Request, res: Response): Promise<void> {
  const seller = await SellerModel.findById(req.seller!.id)
    .select("+store.logoKey")
    .exec();
  if (!seller) {
    throw new AppError(404, "Seller not found", "NOT_FOUND");
  }

  const key = seller.store?.logoKey;
  if (key) {
    try {
      await deleteImage(key);
    } catch {
    }
  }

  seller.store = seller.store ?? ({} as unknown as SellerStore);
  const storeRecord = seller.store as unknown as Record<string, unknown>;
  storeRecord.logoUrl = undefined;
  storeRecord.logoKey = undefined;
  await seller.save();

  invalidateStoreCache();

  const idStr = seller._id.toString();
  await logAudit(idStr, idStr, "LOGO_REMOVED", ["store.logoUrl"]);
  res.json(seller.toAdminJSON());
}

export async function deleteBanner(req: Request, res: Response): Promise<void> {
  const seller = await SellerModel.findById(req.seller!.id)
    .select("+store.bannerKey")
    .exec();
  if (!seller) {
    throw new AppError(404, "Seller not found", "NOT_FOUND");
  }

  const key = seller.store?.bannerKey;
  if (key) {
    try {
      await deleteImage(key);
    } catch {
    }
  }

  seller.store = seller.store ?? ({} as unknown as SellerStore);
  const storeRecord = seller.store as unknown as Record<string, unknown>;
  storeRecord.bannerUrl = undefined;
  storeRecord.bannerKey = undefined;
  await seller.save();

  invalidateStoreCache();

  const idStr = seller._id.toString();
  await logAudit(idStr, idStr, "BANNER_REMOVED", ["store.bannerUrl"]);
  res.json(seller.toAdminJSON());
}
