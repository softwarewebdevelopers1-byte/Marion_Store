import "express-serve-static-core";
import type { AuthenticatedSeller } from "./auth.js";

declare module "express-serve-static-core" {
  interface Request {
    seller?: AuthenticatedSeller;
    validated?: {
      body?: unknown;
      query?: unknown;
      params?: unknown;
    };
  }
}
