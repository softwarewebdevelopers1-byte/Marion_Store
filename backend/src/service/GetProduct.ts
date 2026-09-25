import ProductModel from "../model/Products.model.js";
import ApiResponse from "../response/SystemRes.js";
import type IApiResponse from "../types/apiResponse.js";
import type { Product } from "../types/Products.js";

export default async function GetAllProducts(
  page: number,
  limit: number,
): Promise<IApiResponse<Product[]>> {
  const products = await ProductModel.find()
    .skip((page - 1) * limit)
    .limit(limit);

  return ApiResponse(undefined, undefined, undefined, products);
}
