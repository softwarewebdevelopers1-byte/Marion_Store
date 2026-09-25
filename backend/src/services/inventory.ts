import { type ClientSession, type Types } from "mongoose";
import { InventoryMovementModel } from "../models/InventoryMovement.js";
import type { InventoryMovementType } from "../types/inventoryMovement.js";

export interface RecordMovementArgs {
  sellerId: Types.ObjectId;
  productId: Types.ObjectId;
  type: InventoryMovementType;
  before: number;
  after: number;
  delta: number;
  reason: string;
  session?: ClientSession;
}

export async function recordMovement(args: RecordMovementArgs): Promise<void> {
  const doc = {
    sellerId: args.sellerId,
    productId: args.productId,
    type: args.type,
    before: args.before,
    after: args.after,
    delta: args.delta,
    reason: args.reason,
  };
  const opts: { session?: ClientSession } = {};
  if (args.session) opts.session = args.session;
  await InventoryMovementModel.create([doc], opts);
}

export async function inventoryHistory(
  sellerId: Types.ObjectId,
  productId: Types.ObjectId,
): Promise<unknown[]> {
  const docs = await InventoryMovementModel.find({
    sellerId,
    productId,
  })
    .sort({ createdAt: -1 })
    .exec();
  return docs.map((d) => d.toJSON());
}
