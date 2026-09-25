import * as mockProducts from "./productService";
import * as apiProducts from "./apiProductService";

const useReal = import.meta.env.VITE_USE_REAL_API === "true";

export const productService = useReal
  ? apiProducts.productService
  : mockProducts.productService;

export const subscribe = useReal
  ? apiProducts.subscribe
  : mockProducts.subscribe;

export type ProductService = typeof productService;
