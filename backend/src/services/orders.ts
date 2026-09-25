import { Types } from "mongoose";
import { OrderModel } from "../models/Order.js";
import { ProductModel } from "../models/Product.js";
import type { Order, OrderStatus, PaymentStatus, CreateOrderInput } from "../types/order.js";
import AppError from "../appError.js";
import { recordMovement } from "./inventory.js";
import { generateOrderNumber, recomputeSellerStats } from "./stats.js";
import { resolveStoreSellerId } from "./products.js";

function toOrderDoc(doc: any): Order {
  return doc.toJSON() as unknown as Order;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const sellerId = await resolveStoreSellerId();
  if (!sellerId) {
    throw new AppError(500, "No active store found", "STORE_ERROR");
  }

  const productIds = input.items.map((i) => i.productId);
  const products = await ProductModel.find({
    _id: { $in: productIds },
    sellerId: new Types.ObjectId(sellerId),
    isActive: true,
  }).exec();

  const productMap = new Map<string, typeof products[number]>();
  for (const p of products) {
    productMap.set(p._id.toString(), p);
  }

  for (const item of input.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new AppError(400, `Product not found: ${item.productId}`, "NOT_FOUND");
    }
    if (product.stockQuantity < item.quantity) {
      throw new AppError(
        400,
        `Insufficient stock for ${product.name}`,
        "INSUFFICIENT_STOCK",
      );
    }
  }

  const orderItems = input.items.map((item) => {
    const product = productMap.get(item.productId)!;
    return {
      productId: product._id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
    };
  });

  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const shipping = 0;
  const total = subtotal + shipping;

  const orderNumber = await generateOrderNumber();

  const orderDoc = await OrderModel.create({
    sellerId: new Types.ObjectId(sellerId),
    orderNumber,
    customerName: input.customer.name,
    customerPhone: input.customer.phone,
    customerEmail: input.customer.email ?? null,
    items: orderItems,
    subtotal,
    shipping,
    total,
    paymentStatus: "UNPAID" as PaymentStatus,
    orderStatus: "PENDING" as OrderStatus,
  });

  for (const item of input.items) {
    const product = productMap.get(item.productId)!;
    const before = product.stockQuantity;
    const after = before - item.quantity;
    product.stockQuantity = after;
    await product.save();
    await recordMovement({
      sellerId: product.sellerId,
      productId: product._id,
      type: "SALE",
      before,
      after,
      delta: -item.quantity,
      reason: `Order ${orderNumber}`,
    });
  }

  await recomputeSellerStats(sellerId);

  return toOrderDoc(orderDoc);
}

export async function listOrders(sellerId: string): Promise<Order[]> {
  const docs = await OrderModel.find({
    sellerId: new Types.ObjectId(sellerId),
  })
    .sort({ createdAt: -1 })
    .exec();
  return docs.map((d) => d.toJSON() as unknown as Order);
}

export async function getOrder(
  sellerId: string,
  id: string,
): Promise<Order> {
  const doc = await OrderModel.findOne({
    _id: id,
    sellerId: new Types.ObjectId(sellerId),
  }).exec();
  if (!doc) throw new AppError(404, "Order not found", "NOT_FOUND");
  return doc.toJSON() as unknown as Order;
}

export async function updateOrderStatus(
  sellerId: string,
  id: string,
  orderStatus: OrderStatus,
  paymentStatus?: PaymentStatus,
): Promise<Order> {
  const update: Record<string, unknown> = { orderStatus };
  if (paymentStatus !== undefined) {
    update.paymentStatus = paymentStatus;
  }
  if (orderStatus === "COMPLETED" && paymentStatus === "PAID") {
    update.paidAt = new Date();
  }

  const doc = await OrderModel.findOneAndUpdate(
    { _id: id, sellerId: new Types.ObjectId(sellerId) },
    update,
    { new: true, runValidators: true },
  ).exec();
  if (!doc) throw new AppError(404, "Order not found", "NOT_FOUND");
  await recomputeSellerStats(sellerId);
  return doc.toJSON() as unknown as Order;
}
