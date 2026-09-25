import type { Request, Response } from "express";
import { Types } from "mongoose";
import { ProductModel } from "../models/Product.js";
import { uploadImage, deleteImage, deleteImages } from "../services/storage.service.js";
import { invalidateStoreCache } from "../services/products.js";
import AppError from "../appError.js";

const asObjectId = (id: string) => new Types.ObjectId(id);

export async function uploadProductImages(
  req: Request,
  res: Response,
): Promise<void> {
  const sellerId = req.seller!.id;
  const productId = req.params.id as string;
  const files = (req.files as Express.Multer.File[]) ?? [];

  if (files.length === 0) {
    throw new AppError(400, "No image files provided", "VALIDATION_ERROR");
  }
  if (files.length > 8) {
    throw new AppError(
      409,
      "Too many images. Maximum is 8.",
      "TOO_MANY_IMAGES",
    );
  }

  const product = await ProductModel.findOne({
    _id: productId,
    sellerId: asObjectId(sellerId),
  })
    .select("+imageKeys")
    .exec();

  if (!product) {
    throw new AppError(404, "Product not found", "NOT_FOUND");
  }

  if (product.images.length + files.length > 8) {
    throw new AppError(
      409,
      "Uploading these images would exceed the 8-image limit.",
      "TOO_MANY_IMAGES",
    );
  }

  const uploaded: { key: string; url: string }[] = [];

  try {
    for (const file of files) {
      const stored = await uploadImage(file, { sellerId, productId: product._id.toString() });
      uploaded.push({ key: stored.key, url: stored.url });
    }

    product.addImages(uploaded);
    await product.save();
  } catch (err) {
    const uploadedKeys = uploaded.map((u) => u.key).filter(Boolean);
    if (uploadedKeys.length > 0) {
      try {
        await deleteImages(uploadedKeys);
      } catch (cleanupErr) {
        console.error("R2 cleanup after failed upload:", (cleanupErr as Error).message);
      }
    }
    throw err;
  }

  invalidateStoreCache();
  res.json(product.toJSON());
}

export async function deleteProductImage(
  req: Request,
  res: Response,
): Promise<void> {
  const sellerId = req.seller!.id;
  const productId = req.params.id as string;
  const { key } = req.params as unknown as { key: string };

  const product = await ProductModel.findOne({
    _id: productId,
    sellerId: asObjectId(sellerId),
  })
    .select("+imageKeys")
    .exec();

  if (!product) {
    throw new AppError(404, "Product not found", "NOT_FOUND");
  }

  const idx = product.imageKeys.indexOf(key);
  if (idx === -1) {
    throw new AppError(404, "Image key not found", "NOT_FOUND");
  }

  const removedKey = product.removeImageAt(idx);

  try {
    await deleteImage(removedKey);
  } catch (err) {
    throw new AppError(
      502,
      `Failed to delete image from storage: ${(err as Error).message}`,
      "STORAGE_DELETE_FAILED",
    );
  }

  await product.save();
  invalidateStoreCache();
  res.json(product.toJSON());
}

export async function reorderProductImages(
  req: Request,
  res: Response,
): Promise<void> {
  const sellerId = req.seller!.id;
  const productId = req.params.id as string;
  const { orderedKeys } = req.validated!.body as { orderedKeys: string[] };

  const product = await ProductModel.findOne({
    _id: productId,
    sellerId: asObjectId(sellerId),
  })
    .select("+imageKeys")
    .exec();

  if (!product) {
    throw new AppError(404, "Product not found", "NOT_FOUND");
  }

  if (orderedKeys.length !== product.images.length) {
    throw new AppError(400, "Reordered list length does not match", "INVALID_PERMUTATION");
  }

  const keyToImage = new Map<string, string>();
  for (let i = 0; i < product.imageKeys.length; i++) {
    const k = product.imageKeys[i] ?? "";
    if (k) keyToImage.set(k, product.images[i]!);
  }

  const seen = new Set<string>();
  for (const key of orderedKeys) {
    if (!keyToImage.has(key)) {
      throw new AppError(400, `Key not found in current image keys: ${key}`, "INVALID_PERMUTATION");
    }
    if (seen.has(key)) {
      throw new AppError(400, `Duplicate key in reorder: ${key}`, "INVALID_PERMUTATION");
    }
    seen.add(key);
  }

  product.images = orderedKeys.map((k) => keyToImage.get(k) ?? "");
  product.imageKeys = [...orderedKeys];

  await product.save();
  invalidateStoreCache();
  res.json(product.toJSON());
}
