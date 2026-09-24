import type ProductStatus from "../enums/ProductStatus.js";

export interface Product {
  ProductName: string;
  ProductDetails: string;
  Quantity: number;
  Cost: number;
  Status: ProductStatus;
  CreatedAt: Date;
  DeletedAt?: string;
  ModifiedAt?: string;
}
