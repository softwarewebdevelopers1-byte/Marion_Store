import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "../schemas/index.js";
import type { CreateOrderInput } from "../types/order.js";
import type { OrderStatus, PaymentStatus } from "../types/order.js";
import {
  createOrder,
  listOrders,
  getOrder,
  updateOrderStatus,
} from "../services/orders.js";

const router = Router();

router.post(
  "/",
  validate({ body: createOrderSchema }),
  asyncHandler(async (req, res) => {
    const input = req.validated!.body as CreateOrderInput;
    const order = await createOrder(input);
    res.status(201).json(order);
  }),
);

router.get(
  "/admin/all",
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await listOrders(req.seller!.id);
    res.json({ items });
  }),
);

router.get(
  "/admin/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await getOrder(req.seller!.id, req.params.id as string);
    res.json(order);
  }),
);

router.patch(
  "/admin/:id/status",
  requireAuth,
  validate({ body: updateOrderStatusSchema }),
  asyncHandler(async (req, res) => {
    const { orderStatus, paymentStatus } = req.validated!.body as {
      orderStatus: OrderStatus;
      paymentStatus?: PaymentStatus;
    };
    const order = await updateOrderStatus(
      req.seller!.id,
      req.params.id as string,
      orderStatus,
      paymentStatus,
    );
    res.json(order);
  }),
);

export default router;
