import { Types, type ClientSession } from "mongoose";
import { ProductModel } from "../models/Product.js";
import { OrderModel, CounterModel } from "../models/Order.js";
import { SellerModel } from "../models/Seller.js";

export async function generateOrderNumber(
  session?: ClientSession,
): Promise<string> {
  const year = new Date().getFullYear();
  const key = `orderNumber:${year}`;
  const options: { upsert: boolean; new: boolean; session?: ClientSession } = {
    upsert: true,
    new: true,
  };
  if (session) options.session = session;
  const counter = await CounterModel.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { ...options, fields: { seq: 1, _id: 0 } },
  ).exec();
  const seq = counter?.seq ?? 1;
  return `KS-${year}-${String(seq).padStart(4, "0")}`;
}

export async function recomputeSellerStats(
  sellerId: string | Types.ObjectId,
  session?: ClientSession,
): Promise<void> {
  const sid = new Types.ObjectId(sellerId);
  const match = { sellerId: sid };
  const productsAgg = await ProductModel.aggregate(
    [
      { $match: match },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalUnitsSold: { $sum: "$unitsSold" },
          lowStockItems: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ["$stockQuantity", 0] },
                    { $lte: ["$stockQuantity", "$lowStockThreshold"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          outOfStockItems: {
            $sum: { $cond: [{ $lte: ["$stockQuantity", 0] }, 1, 0] },
          },
        },
      },
    ],
    { session },
  ).exec();

  const ordersAgg = await OrderModel.aggregate(
    [
      { $match: match },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "COMPLETED"] }, "$total", 0],
            },
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "PENDING"] }, 1, 0] },
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "COMPLETED"] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "CANCELLED"] }, 1, 0] },
          },
        },
      },
    ],
    { session },
  ).exec();

  const p = (productsAgg[0] ?? {}) as {
    totalProducts: number;
    totalUnitsSold: number;
    lowStockItems: number;
    outOfStockItems: number;
  };
  const o = (ordersAgg[0] ?? {}) as {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
  };

  await SellerModel.updateOne(
    { _id: sid },
    {
      $set: {
        "stats.totalProducts": Number(p.totalProducts) || 0,
        "stats.totalOrders": Number(o.totalOrders) || 0,
        "stats.totalRevenue": Number(o.totalRevenue) || 0,
        "stats.totalUnitsSold": Number(p.totalUnitsSold) || 0,
        "stats.lowStockItems": Number(p.lowStockItems) || 0,
        "stats.outOfStockItems": Number(p.outOfStockItems) || 0,
        "stats.pendingOrders": Number(o.pendingOrders) || 0,
        "stats.completedOrders": Number(o.completedOrders) || 0,
        "stats.cancelledOrders": Number(o.cancelledOrders) || 0,
      },
    },
    { session: session ?? undefined, upsert: false },
  ).exec();
}

export async function findStoreSellerId(): Promise<Types.ObjectId | null> {
  const seller = await SellerModel.findOne({
    status: "ACTIVE",
    role: "SELLER",
  })
    .select("_id")
    .lean()
    .exec();
  return seller ? seller._id : null;
}
