import mongoose, { model, Model, Schema } from "mongoose";
import ProductStatus from "../enums/ProductStatus.js";
import type { Product } from "../types/Products.js";

const ProductsSchema = new Schema<Product>({
  ProductName: {
    type: String,
    required: true,
  },
  ProductDetails: {
    type: String,
    required: true,
  },
  Quantity: {
    type: Number,
    default: 0,
  },
  Cost: {
    type: Number,
    default: 0,
  },
  Status: {
    type: String,
    enum: Object.values(ProductStatus),
    default: ProductStatus.IN_STOCK,
  },
  CreatedAt: { type: Date, default: new Date() },
  DeletedAt: Date,
  ModifiedAt: Date,
});

const ProductModel =
  (mongoose.models.users as Model<Product>) ||
  model<Product>("users", ProductsSchema);

export default ProductModel;
