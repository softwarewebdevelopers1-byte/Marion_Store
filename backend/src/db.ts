import mongoose from "mongoose";
import { logger } from "./logger.js";
import { config } from "./config.js";

let connected = false;

export async function connectDB(): Promise<void> {
  if (connected) return;
  await mongoose.connect(config.mongoUri);
  connected = true;
  logger.info("mongodb connected");
}

export async function closeDB(): Promise<void> {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
  logger.info("mongodb disconnected");
}

export async function syncIndexes(): Promise<void> {
  const models = [
    (await import("./models/Seller.js")).SellerModel,
    (await import("./models/Product.js")).ProductModel,
    (await import("./models/InventoryMovement.js")).InventoryMovementModel,
    (await import("./models/Order.js")).OrderModel,
    (await import("./models/SellerAuditLog.js")).SellerAuditLogModel,
  ];
  for (const m of models) {
    await m.syncIndexes();
  }
}
