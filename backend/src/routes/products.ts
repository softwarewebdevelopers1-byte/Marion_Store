import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  productInputSchema,
  patchStockSchema,
  patchAvailabilitySchema,
  patchVisibilitySchema,
  publicProductsQuerySchema,
} from "../schemas/index.js";
import type { ProductInputSchema } from "../schemas/index.js";
import {
  listPublic,
  getBySlugOrId,
  featured,
  categoriesInUse,
  listAdmin,
  getById,
  create,
  update,
  remove,
  patchStock,
  patchAvailability,
  patchVisibility,
  inventoryHistory,
  inventorySummary,
  lowStockProducts,
  outOfStockProducts,
} from "../services/products.js";
import type { ListPublicQuery } from "../services/products.js";

const router = Router();

router.get(
  "/",
  validate({ query: publicProductsQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.validated!.query as unknown as ListPublicQuery;
    const result = await listPublic(query);
    res.json(result);
  }),
);

router.get("/featured", asyncHandler(async (_req, res) => {
  const items = await featured();
  res.json({ items });
}));

router.get("/categories", asyncHandler(async (_req, res) => {
  const items = await categoriesInUse();
  res.json({ items });
}));

router.get("/:slugOrId", asyncHandler(async (req, res) => {
  const product = await getBySlugOrId(req.params.slugOrId as string);
  if (!product) {
    res.status(404).json({ message: "Product not found", code: "NOT_FOUND" });
    return;
  }
  res.json(product);
}));

router.get(
  "/admin/all",
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await listAdmin(req.seller!.id);
    res.json({ items });
  }),
);

router.get(
  "/admin/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const product = await getById(req.seller!.id, req.params.id as string);
    if (!product) {
      res.status(404).json({ message: "Product not found", code: "NOT_FOUND" });
      return;
    }
    res.json(product);
  }),
);

router.post(
  "/admin",
  requireAuth,
  validate({ body: productInputSchema }),
  asyncHandler(async (req, res) => {
    const input = req.validated!.body as ProductInputSchema;
    const product = await create(req.seller!.id, input);
    res.status(201).json(product);
  }),
);

router.put(
  "/admin/:id",
  requireAuth,
  validate({ body: productInputSchema }),
  asyncHandler(async (req, res) => {
    const input = req.validated!.body as ProductInputSchema;
    try {
      const product = await update(req.seller!.id, req.params.id as string, input);
      res.json(product);
    } catch (err) {
      if (err instanceof Error && err.message === "Product not found") {
        res.status(404).json({ message: "Product not found", code: "NOT_FOUND" });
        return;
      }
      throw err;
    }
  }),
);

router.delete(
  "/admin/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    try {
      await remove(req.seller!.id, req.params.id as string);
      res.status(204).send();
    } catch (err) {
      if (err instanceof Error && err.message === "Product not found") {
        res.status(404).json({ message: "Product not found", code: "NOT_FOUND" });
        return;
      }
      throw err;
    }
  }),
);

router.patch(
  "/admin/:id/stock",
  requireAuth,
  validate({ body: patchStockSchema }),
  asyncHandler(async (req, res) => {
    const { quantity, reason } = req.validated!.body as { quantity: number; reason?: string };
    const result = await patchStock(req.seller!.id, req.params.id as string, quantity, reason);
    res.json(result);
  }),
);

router.patch(
  "/admin/:id/availability",
  requireAuth,
  validate({ body: patchAvailabilitySchema }),
  asyncHandler(async (req, res) => {
    const { isAvailable } = req.validated!.body as { isAvailable: boolean };
    const product = await patchAvailability(req.seller!.id, req.params.id as string, isAvailable);
    res.json(product);
  }),
);

router.patch(
  "/admin/:id/visibility",
  requireAuth,
  validate({ body: patchVisibilitySchema }),
  asyncHandler(async (req, res) => {
    const { isActive } = req.validated!.body as { isActive: boolean };
    const product = await patchVisibility(req.seller!.id, req.params.id as string, isActive);
    res.json(product);
  }),
);

router.get(
  "/admin/:id/inventory",
  requireAuth,
  asyncHandler(async (req, res) => {
    const history = await inventoryHistory(req.seller!.id, req.params.id as string);
    res.json({ items: history });
  }),
);

router.get(
  "/admin/inventory/summary",
  requireAuth,
  asyncHandler(async (req, res) => {
    const summary = await inventorySummary(req.seller!.id);
    res.json(summary);
  }),
);

router.get(
  "/admin/inventory/low-stock",
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await lowStockProducts(req.seller!.id);
    res.json({ items });
  }),
);

router.get(
  "/admin/inventory/out-of-stock",
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await outOfStockProducts(req.seller!.id);
    res.json({ items });
  }),
);

export default router;
