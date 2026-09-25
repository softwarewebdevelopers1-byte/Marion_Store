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
  const index = parseInt(req.params.index as string, 10);

  const product = await ProductModel.findOne({
    _id: productId,
    sellerId: asObjectId(sellerId),
  })
    .select("+imageKeys")
    .exec();

  if (!product) {
    throw new AppError(404, "Product not found", "NOT_FOUND");
  }

  if (!Number.isInteger(index) || index < 0 || index >= product.images.length) {
    throw new AppError(400, "Invalid image index", "INVALID_INDEX");
  }

  const key = product.removeImageAt(index);

  try {
    await deleteImage(key);
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
  const { orderedUrls } = req.validated!.body as { orderedUrls: string[] };

  const product = await ProductModel.findOne({
    _id: productId,
    sellerId: asObjectId(sellerId),
  })
    .select("+imageKeys")
    .exec();

  if (!product) {
    throw new AppError(404, "Product not found", "NOT_FOUND");
  }

  if (orderedUrls.length !== product.images.length) {
    throw new AppError(400, "Reordered list length does not match", "INVALID_PERMUTATION");
  }

  const urlToKey = new Map<string, string>();
  for (let i = 0; i < product.images.length; i++) {
    const k = product.imageKeys[i] ?? "";
    urlToKey.set(product.images[i]!, k);
  }

  const seen = new Set<string>();
  for (const url of orderedUrls) {
    if (!urlToKey.has(url)) {
      throw new AppError(400, `URL not found in current images: ${url}`, "INVALID_PERMUTATION");
    }
    if (seen.has(url)) {
      throw new AppError(400, `Duplicate URL in reorder: ${url}`, "INVALID_PERMUTATION");
    }
    seen.add(url);
  }

  product.images = orderedUrls;
  product.imageKeys = orderedUrls.map((u) => urlToKey.get(u) ?? "");

  await product.save();
  invalidateStoreCache();
  res.json(product.toJSON());
}
