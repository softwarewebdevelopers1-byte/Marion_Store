import {
  Schema,
  model,
  type Model,
  type Document,
  type Types,
} from "mongoose";
import type {
  InventoryMovementType,
} from "../types/inventoryMovement.js";
import { INVENTORY_MOVEMENT_TYPES } from "../types/inventoryMovement.js";

type HookNext = (err?: Error | null) => void;

export interface InventoryMovementDocument extends Document {
  _id: Types.ObjectId;
  sellerId: Types.ObjectId;
  productId: Types.ObjectId;
  type: InventoryMovementType;
  before: number;
  after: number;
  delta: number;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryMovementSchema = new Schema<InventoryMovementDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    type: { type: String, enum: INVENTORY_MOVEMENT_TYPES, required: true, index: true },
    before: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: (v: number) => Number.isInteger(v), message: "integer required" },
    },
    after: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: (v: number) => Number.isInteger(v), message: "integer required" },
    },
    delta: {
      type: Number,
      required: true,
      validate: { validator: (v: number) => Number.isInteger(v), message: "integer required" },
    },
    reason: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: any) {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.sellerId;
        ret.note = ret.reason;
        delete ret.reason;
        delete ret.before;
        delete ret.after;
      },
    },
  },
);

InventoryMovementSchema.index({ productId: 1, createdAt: -1 });
InventoryMovementSchema.index({ sellerId: 1, createdAt: -1 });

(InventoryMovementSchema as any).pre(
  ["findOneAndUpdate", "updateOne", "deleteOne"],
  function (this: InventoryMovementDocument, next: HookNext) {
    return next(
      new Error(
        "Inventory movements are append-only and cannot be modified or deleted",
      ),
    );
  },
);

export const InventoryMovementModel: Model<InventoryMovementDocument> =
  model<InventoryMovementDocument>(
    "InventoryMovement",
    InventoryMovementSchema,
  );

export type { InventoryMovementType };
