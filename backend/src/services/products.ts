import { Types, type QueryFilter } from "mongoose";
import { ProductModel, type ProductDocument } from "../models/Product.js";
import { InventoryMovementModel } from "../models/InventoryMovement.js";
import type { Product, Category, StockStatus } from "../types/product.js";
import type { Paginated } from "../types/paginated.js";
import type { ProductInputSchema } from "../schemas/index.js";
import AppError from "../appError.js";
import { slugify, escapeRegex } from "../utils/slug.js";
import { recordMovement } from "./inventory.js";
import { recomputeSellerStats, findStoreSellerId } from "./stats.js";
import { deleteImages } from "./storage.service.js";

export interface PatchStockResponse {
  productId: string;
  stockQuantity: number;
  isAvailable: boolean;
}

export interface InventorySummary {
  total: number;
  inStock: Product[];
  low: Product[];
  out: Product[];
  hidden: Product[];
  value: number;
}

function toProduct(doc: ProductDocument): Product {
  return doc.toJSON() as unknown as Product;
}

const asObjectId = (id: string) => new Types.ObjectId(id);

let storeSellerIdCache: string | null | undefined;

export async function resolveStoreSellerId(): Promise<string | null> {
  if (storeSellerIdCache !== undefined) return storeSellerIdCache;
  const id = await findStoreSellerId();
  storeSellerIdCache = id ? id.toString() : null;
  return storeSellerIdCache;
}

export function invalidateStoreCache(): void {
  storeSellerIdCache = undefined;
}

async function slugExists(
  sellerId: string | Types.ObjectId,
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const filter: Record<string, unknown> = {
    sellerId: new Types.ObjectId(sellerId),
    slug,
  };
  if (excludeId) {
    filter._id = { $ne: asObjectId(excludeId) };
  }
  const doc = await ProductModel.findOne(filter)
    .select("_id")
    .lean()
    .exec();
  return !!doc;
}

async function generateUniqueSlug(
  name: string,
  sellerId: string | Types.ObjectId,
  excludeId?: string,
): Promise<string> {
  const root = slugify(name) || "product";
  if (!(await slugExists(sellerId, root, excludeId))) return root;
  let i = 2;
  while (await slugExists(sellerId, `${root}-${i}`, excludeId)) i += 1;
  return `${root}-${i}`;
}

function stockStatusOf(qty: number, threshold: number): StockStatus {
  if (qty <= 0) return "out-of-stock";
  if (qty <= threshold) return "low-stock";
  return "in-stock";
}

export interface ListPublicQuery {
  search?: string;
  category?: Category | "all";
  minPrice?: number;
  maxPrice?: number;
  availability?: "all" | "in-stock" | "out-of-stock" | "low-stock";
  sort?: string;
  page?: number;
  size?: number;
}

export async function listPublic(query: ListPublicQuery): Promise<Paginated<Product>> {
  const sellerId = await resolveStoreSellerId();
  if (!sellerId) {
    return { items: [], total: 0, page: 1, size: query.size ?? 12 };
  }

  const page = Math.max(1, query.page ?? 1);
  const size = Math.min(Math.max(1, query.size ?? 12), 60);
  const search = (query.search ?? "").trim();
  const availability = query.availability ?? "all";

  const filter: Record<string, unknown> = {
    sellerId: asObjectId(sellerId),
    isActive: true,
  };

  if (query.category && query.category !== "all") {
    filter.category = query.category;
  }
  if (query.minPrice !== undefined && query.maxPrice !== undefined) {
    filter.price = { $gte: query.minPrice, $lte: query.maxPrice };
  } else if (query.minPrice !== undefined) {
    filter.price = { $gte: query.minPrice };
  } else if (query.maxPrice !== undefined) {
    filter.price = { $lte: query.maxPrice };
  }

  if (availability === "in-stock") {
    filter.stockQuantity = { $gt: 0 };
  } else if (availability === "out-of-stock") {
    filter.stockQuantity = { $lte: 0 };
  } else if (availability === "low-stock") {
    filter.$expr = {
      $and: [
        { $gt: ["$stockQuantity", 0] },
        { $lte: ["$stockQuantity", "$lowStockThreshold"] },
      ],
    };
  }

  if (search) {
    filter.$or = [
      { name: { $regex: escapeRegex(search), $options: "i" } },
      { description: { $regex: escapeRegex(search), $options: "i" } },
      { category: { $regex: escapeRegex(search), $options: "i" } },
    ];
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    "price-asc": { price: 1 },
    "price-desc": { price: -1 },
    "name-asc": { name: 1 },
    "name-desc": { name: -1 },
    availability: { stockQuantity: -1 },
    popular: { unitsSold: -1 },
  };
  const sortField: Record<string, 1 | -1> =
    query.sort && query.sort !== "relevance"
      ? sortMap[query.sort] ?? { createdAt: -1 }
      : { createdAt: -1 };

  const [items, total] = await Promise.all([
    ProductModel.find(filter as unknown as QueryFilter<ProductDocument>)
      .sort(sortField)
      .skip((page - 1) * size)
      .limit(size)
      .exec(),
    ProductModel.countDocuments(filter as unknown as QueryFilter<ProductDocument>).exec(),
  ]);

  return {
    items: items.map((d) => toProduct(d)),
    total,
    page,
    size,
  };
}

export async function getBySlugOrId(slugOrId: string): Promise<Product | null> {
  const sellerId = await resolveStoreSellerId();
  const filter: Record<string, unknown> = { isActive: true };
  if (sellerId) filter.sellerId = asObjectId(sellerId);
  let doc: ProductDocument | null = null;
  if (/^[0-9a-fA-F]{24}$/.test(slugOrId)) {
    doc = await ProductModel.findOne({ ...filter, _id: slugOrId }).exec();
  }
  if (!doc) {
    doc = await ProductModel.findOne({ ...filter, slug: slugOrId }).exec();
  }
  return doc ? toProduct(doc) : null;
}

export async function featured(limit = 8): Promise<Product[]> {
  const sellerId = await resolveStoreSellerId();
  const filter: Record<string, unknown> = {
    isActive: true,
    isFeatured: true,
    stockQuantity: { $gt: 0 },
  };
  if (sellerId) filter.sellerId = asObjectId(sellerId);
  const docs = await ProductModel.find(
    filter as unknown as QueryFilter<ProductDocument>,
  )
    .sort({ unitsSold: -1, createdAt: -1 })
    .limit(Math.max(1, Math.min(limit, 50)))
    .exec();
  return docs.map((d) => toProduct(d));
}

export async function categoriesInUse(): Promise<string[]> {
  const sellerId = await resolveStoreSellerId();
  const filter: Record<string, unknown> = { isActive: true };
  if (sellerId) filter.sellerId = asObjectId(sellerId);
  const docs = await ProductModel.find(
    filter as unknown as QueryFilter<ProductDocument>,
  )
    .select("category -_id")
    .lean()
    .exec();
  return Array.from(
    new Set(docs.map((d) => d.category).filter((c): c is Category => typeof c === "string")),
  );
}

export async function listAdmin(sellerId: string): Promise<Product[]> {
  const docs = await ProductModel.find({ sellerId: asObjectId(sellerId) })
    .sort({ updatedAt: -1 })
    .exec();
  return docs.map((d) => toProduct(d));
}

export async function getById(sellerId: string, id: string): Promise<Product | null> {
  const doc = await ProductModel.findOne({
    _id: id,
    sellerId: asObjectId(sellerId),
  }).exec();
  return doc ? toProduct(doc) : null;
}

export async function create(
  sellerId: string,
  input: ProductInputSchema,
): Promise<Product> {
  const slug = await generateUniqueSlug(input.name, sellerId);
  const doc = await ProductModel.create({
    sellerId: asObjectId(sellerId),
    slug,
    name: input.name,
    description: input.description,
    price: input.price,
    compareAtPrice: input.compareAtPrice ?? null,
    images: input.images,
    imageKeys: input.images.map(() => ""),
    category: input.category,
    stockQuantity: input.stockQuantity,
    lowStockThreshold: input.lowStockThreshold,
    isFeatured: input.isFeatured ?? false,
    isActive: input.isActive ?? true,
    unitsSold: 0,
    views: 0,
  });
  await recordMovement({
    sellerId: doc.sellerId,
    productId: doc._id,
    type: "PRODUCT_ADDED",
    before: 0,
    after: input.stockQuantity,
    delta: input.stockQuantity,
    reason: "product created",
  });
  await recomputeSellerStats(sellerId);
  return toProduct(doc);
}

export async function update(
  sellerId: string,
  id: string,
  input: ProductInputSchema,
): Promise<Product> {
  const doc = await ProductModel.findOne({
    _id: id,
    sellerId: asObjectId(sellerId),
  })
    .select("+imageKeys")
    .exec();
  if (!doc) throw new AppError(404, "Product not found", "NOT_FOUND");

  const oldKeys = doc.imageKeys ?? [];
  const oldImages = doc.images;
  const newImages = input.images;

  // Determine keys for images that are still present (by URL)
  const urlToKey = new Map<string, string>();
  for (let i = 0; i < oldImages.length; i++) {
    urlToKey.set(oldImages[i]!, oldKeys[i] ?? "");
  }

  // Collect keys for images being removed
  const removedKeys: string[] = [];
  for (const oldUrl of oldImages) {
    if (!newImages.includes(oldUrl)) {
      const k = urlToKey.get(oldUrl) ?? "";
      if (k) removedKeys.push(k);
    }
  }

  // Delete orphaned R2 objects (best-effort, but treat as fatal if R2 is configured)
  if (removedKeys.length > 0) {
    try {
      await deleteImages(removedKeys);
    } catch (err) {
      throw new AppError(
        502,
        `Failed to delete orphaned images: ${(err as Error).message}`,
        "STORAGE_DELETE_FAILED",
      );
    }
  }

  const newKeys = newImages.map((u) => urlToKey.get(u) ?? "");

  if (doc.name !== input.name) {
    doc.slug = await generateUniqueSlug(input.name, sellerId, doc._id.toString());
  }
  doc.name = input.name;
  doc.description = input.description;
  doc.price = input.price;
  doc.compareAtPrice = input.compareAtPrice ?? null;
  doc.images = newImages;
  doc.imageKeys = newKeys;
  doc.category = input.category;
  doc.stockQuantity = input.stockQuantity;
  doc.lowStockThreshold = input.lowStockThreshold;
  doc.isFeatured = input.isFeatured;
  doc.isActive = input.isActive;
  await doc.save();
  return toProduct(doc);
}

export async function remove(sellerId: string, id: string): Promise<void> {
  const doc = await ProductModel.findOne({
    _id: id,
    sellerId: asObjectId(sellerId),
  })
    .select("+imageKeys")
    .exec();
  if (!doc) throw new AppError(404, "Product not found", "NOT_FOUND");

  const keys = (doc.imageKeys ?? []).filter((k) => Boolean(k));
  if (keys.length > 0) {
    try {
      await deleteImages(keys);
    } catch (err) {
      throw new AppError(
        502,
        `Failed to delete images from storage: ${(err as Error).message}`,
        "STORAGE_DELETE_FAILED",
      );
    }
  }

  await ProductModel.deleteOne({ _id: id, sellerId: asObjectId(sellerId) }).exec();
  await recomputeSellerStats(sellerId);
  invalidateStoreCache();
}

export async function patchStock(
  sellerId: string,
  id: string,
  quantity: number,
  reason?: string,
): Promise<PatchStockResponse> {
  const doc = await ProductModel.findOne({
    _id: id,
    sellerId: asObjectId(sellerId),
  }).exec();
  if (!doc) throw new AppError(404, "Product not found", "NOT_FOUND");
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new AppError(400, "quantity must be a non-negative integer", "VALIDATION_ERROR");
  }
  const before = doc.stockQuantity;
  const delta = quantity - before;
  doc.stockQuantity = quantity;
  await doc.save();
  await recordMovement({
    sellerId: doc.sellerId,
    productId: doc._id,
    type: delta > 0 ? "RESTOCKED" : "ADJUSTMENT",
    before,
    after: quantity,
    delta,
    reason: reason ?? "stock adjustment",
  });
  await recomputeSellerStats(sellerId);
  return {
    productId: doc._id.toString(),
    stockQuantity: doc.stockQuantity,
    isAvailable: doc.stockQuantity > 0,
  };
}

export async function patchAvailability(
  sellerId: string,
  id: string,
  isAvailable: boolean,
): Promise<Product> {
  const doc = await ProductModel.findOne({
    _id: id,
    sellerId: asObjectId(sellerId),
  }).exec();
  if (!doc) throw new AppError(404, "Product not found", "NOT_FOUND");
  const before = doc.stockQuantity;
  if (isAvailable && doc.stockQuantity === 0) {
    doc.stockQuantity = 10;
  } else if (!isAvailable) {
    doc.stockQuantity = 0;
  }
  await doc.save();
  const delta = doc.stockQuantity - before;
  if (delta !== 0) {
    await recordMovement({
      sellerId: doc.sellerId,
      productId: doc._id,
      type: delta > 0 ? "RESTOCKED" : "ADJUSTMENT",
      before,
      after: doc.stockQuantity,
      delta,
      reason: `availability set to ${isAvailable ? "available" : "out of stock"}`,
    });
  }
  await recomputeSellerStats(sellerId);
  return toProduct(doc);
}

export async function patchVisibility(
  sellerId: string,
  id: string,
  isActive: boolean,
): Promise<Product> {
  const doc = await ProductModel.findOne({
    _id: id,
    sellerId: asObjectId(sellerId),
  }).exec();
  if (!doc) throw new AppError(404, "Product not found", "NOT_FOUND");
  doc.isActive = isActive;
  await doc.save();
  await recomputeSellerStats(sellerId);
  return toProduct(doc);
}

export async function inventoryHistory(
  sellerId: string,
  productId: string,
): Promise<unknown[]> {
  const docs = await InventoryMovementModel.find({
    sellerId: asObjectId(sellerId),
    productId: asObjectId(productId),
  })
    .sort({ createdAt: -1 })
    .exec();
  return docs.map((d) => d.toJSON());
}

export async function inventorySummary(sellerId: string): Promise<InventorySummary> {
  const docs = await ProductModel.find({ sellerId: asObjectId(sellerId) }).exec();
  const inStock: Product[] = [];
  const low: Product[] = [];
  const out: Product[] = [];
  const hidden: Product[] = [];
  let value = 0;
  for (const doc of docs) {
    const p = toProduct(doc);
    value += p.price * p.stockQuantity;
    if (!p.isActive) {
      hidden.push(p);
      continue;
    }
    const status = stockStatusOf(p.stockQuantity, p.lowStockThreshold);
    if (status === "out-of-stock") out.push(p);
    else if (status === "low-stock") low.push(p);
    else inStock.push(p);
  }
  return { total: docs.length, inStock, low, out, hidden, value };
}

export async function lowStockProducts(sellerId: string): Promise<Product[]> {
  const docs = await ProductModel.find({
    sellerId: asObjectId(sellerId),
    isActive: true,
    $expr: {
      $and: [
        { $gt: ["$stockQuantity", 0] },
        { $lte: ["$stockQuantity", "$lowStockThreshold"] },
      ],
    },
  }).exec();
  return docs.map((d) => toProduct(d));
}

export async function outOfStockProducts(sellerId: string): Promise<Product[]> {
  const docs = await ProductModel.find({
    sellerId: asObjectId(sellerId),
    isActive: true,
    stockQuantity: { $lte: 0 },
  }).exec();
  return docs.map((d) => toProduct(d));
}
