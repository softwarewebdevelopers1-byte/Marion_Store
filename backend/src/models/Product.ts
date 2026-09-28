import {
  Schema,
  model,
  type Model,
  type Document,
  type Types,
} from "mongoose";
import type { Product, Category, StockStatus } from "../types/product.js";
import { CATEGORIES } from "../types/product.js";

const nonNegativeInt = {
  validator: (v: number) => Number.isInteger(v) && v >= 0,
  message: "Value must be an integer greater than or equal to 0",
};

export interface ProductDocument extends Document {
  sellerId: Types.ObjectId;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  imageKeys: string[];
  category: Category;
  stockQuantity: number;
  lowStockThreshold: number;
  isFeatured: boolean;
  isActive: boolean;
  unitsSold: number;
  views: number;
  isAvailable: boolean;
  stockStatus: StockStatus;
  addImages(stored: { key: string; url: string }[]): void;
  removeImageAt(index: number): string;
  syncImagesAndKeys(updates: { url: string; key: string }[]): void;
}

const ProductSchema = new Schema<ProductDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    slug: { type: String, required: true, trim: true, lowercase: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: null, min: 0 },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => Array.isArray(v),
        message: "Images must be an array of URLs",
      },
    },
    imageKeys: {
      type: [String],
      default: [],
      select: false,
    },
    category: { type: String, enum: CATEGORIES, required: true, index: true },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      validate: nonNegativeInt,
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      required: true,
      min: 0,
      validate: nonNegativeInt,
      default: 5,
    },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    unitsSold: { type: Number, default: 0, min: 0, validate: nonNegativeInt },
    views: { type: Number, default: 0, min: 0, validate: nonNegativeInt },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: any) {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.sellerId;
        delete ret.views;
        delete ret.imageKeys;
      },
    },
  },
);

ProductSchema.index({ sellerId: 1, slug: 1 }, { unique: true });
ProductSchema.index({ sellerId: 1, isActive: 1, category: 1 });
ProductSchema.index({ sellerId: 1, isActive: 1, stockQuantity: 1 });
ProductSchema.index(
  { name: "text", description: "text", category: "text" },
  { name: "ProductTextIndex" },
);

(ProductSchema as any).pre("validate", function (this: ProductDocument) {
  if (
    this.compareAtPrice != null &&
    this.compareAtPrice <= this.price
  ) {
    throw new Error("compareAtPrice must be greater than price");
  }
});

ProductSchema.virtual("isAvailable").get(function (this: ProductDocument) {
  return (this.stockQuantity ?? 0) > 0;
});

ProductSchema.virtual("stockStatus").get(function (this: ProductDocument): StockStatus {
  const qty = this.stockQuantity ?? 0;
  if (qty <= 0) return "out-of-stock";
  if (qty <= (this.lowStockThreshold ?? 0)) return "low-stock";
  return "in-stock";
});

ProductSchema.methods.addImages = function (
  this: ProductDocument,
  stored: { key: string; url: string }[],
): void {
  for (const img of stored) {
    this.images.push(img.url);
    this.imageKeys.push(img.key);
  }
};

ProductSchema.methods.removeImageAt = function (
  this: ProductDocument,
  index: number,
): string {
  const key = this.imageKeys[index] ?? "";
  this.images.splice(index, 1);
  this.imageKeys.splice(index, 1);
  return key;
};

ProductSchema.methods.syncImagesAndKeys = function (
  this: ProductDocument,
  updates: { url: string; key: string }[],
): void {
  this.images = updates.map((u) => u.url);
  this.imageKeys = updates.map((u) => u.key);
};

export const ProductModel: Model<ProductDocument> = model<ProductDocument>(
  "Product",
  ProductSchema,
);

export type { Product, Category, StockStatus };
