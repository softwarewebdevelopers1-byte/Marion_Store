import { Schema, model, type Model, type Document, type Types } from "mongoose";

export type AuditAction =
  | "SELLER_UPDATED"
  | "PASSWORD_CHANGED"
  | "PAYOUT_UPDATED"
  | "LOGO_REMOVED"
  | "BANNER_REMOVED";

export interface SellerAuditEntry extends Document {
  sellerId: Types.ObjectId;
  actorId: Types.ObjectId;
  action: AuditAction;
  changedFields: string[];
  createdAt: Date;
}

const SellerAuditLogSchema = new Schema<SellerAuditEntry>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    action: { type: String, enum: ["SELLER_UPDATED", "PASSWORD_CHANGED", "PAYOUT_UPDATED", "LOGO_REMOVED", "BANNER_REMOVED"], required: true },
    changedFields: { type: [String], required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

SellerAuditLogSchema.index({ sellerId: 1, createdAt: -1 });

export const SellerAuditLogModel: Model<SellerAuditEntry> = model<SellerAuditEntry>(
  "SellerAuditLog",
  SellerAuditLogSchema,
);

export async function logAudit(
  sellerId: string | Types.ObjectId,
  actorId: string | Types.ObjectId,
  action: AuditAction,
  changedFields: string[],
): Promise<void> {
  await SellerAuditLogModel.create({
    sellerId,
    actorId,
    action,
    changedFields,
  });
}
