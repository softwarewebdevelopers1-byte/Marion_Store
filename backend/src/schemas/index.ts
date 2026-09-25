import { z } from "zod";
import type { Category } from "../types/product.js";

export const categoryEnum = z.enum([
  "Shoes",
  "Fashion",
  "Electronics",
  "Accessories",
  "Home",
  "Beauty",
  "Other",
]);

const imageList = z
  .array(z.string().url().or(z.string().startsWith("/")))
  .min(1, "Add at least one image URL");

export const productInputSchema = z
  .object({
    name: z.string().min(2).max(140),
    description: z.string().min(2).max(4000),
    price: z.number().min(0),
    compareAtPrice: z.number().min(0).optional(),
    images: imageList,
    category: categoryEnum,
    stockQuantity: z.number().int().nonnegative(),
    lowStockThreshold: z.number().int().nonnegative(),
    isFeatured: z.boolean(),
    isActive: z.boolean(),
  })
  .refine(
    (d) => d.compareAtPrice === undefined || d.compareAtPrice > d.price,
    {
      message: "compareAtPrice must be strictly greater than price",
      path: ["compareAtPrice"],
    },
  );

export type ProductInputSchema = z.infer<typeof productInputSchema>;

export const patchStockSchema = z.object({
  quantity: z.number().int().nonnegative(),
  reason: z.string().min(1).optional(),
});

export const patchAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export const patchVisibilitySchema = z.object({
  isActive: z.boolean(),
});

export const reorderImagesSchema = z.object({
  orderedUrls: z.array(z.string().min(1)),
});

export const publicProductsQuerySchema = z.object({
  search: z.string().optional(),
  category: categoryEnum.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  availability: z
    .enum(["all", "in-stock", "out-of-stock", "low-stock"])
    .optional(),
  sort: z
    .enum([
      "relevance",
      "newest",
      "price-asc",
      "price-desc",
      "name-asc",
      "name-desc",
      "availability",
      "popular",
    ])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(60).default(12),
});

export type PublicProductsQuery = z.infer<typeof publicProductsQuerySchema>;

export const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1),
});

export const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email().optional(),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export const updateOrderStatusSchema = z.object({
  orderStatus: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "READY",
    "COMPLETED",
    "CANCELLED",
  ]),
  paymentStatus: z.enum(["UNPAID", "PAID", "REFUNDED", "FAILED"]).optional(),
});

export type { Category };
