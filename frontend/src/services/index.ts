import * as mockProducts from "./productService";
import * as apiProducts from "./apiProductService";
import * as mockAccount from "./accountService.mock";
import * as apiAccount from "./accountService";

const useReal = import.meta.env.VITE_USE_REAL_API === "true";

export const productService = useReal
  ? apiProducts.productService
  : mockProducts.productService;

export const subscribe = useReal
  ? apiProducts.subscribe
  : mockProducts.subscribe;

export const accountService = useReal
  ? apiAccount.accountService
  : mockAccount.accountService;

export type ProductService = typeof productService;
export type AccountService = typeof accountService;
export { isAccountError } from "./accountService";
