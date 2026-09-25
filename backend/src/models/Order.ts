import {
  Schema,
  model,
  type Model,
  type Document,
  type Types,
} from "mongoose";
import type {
  OrderStatus,
  PaymentStatus,
} from "../types/order.js";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "../types/order.js";
import type { OrderItem as OrderItemType } from "../types/order.js";

export interface OrderItemDoc {
  productId: Types.ObjectId;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderDocument extends Document {
  sellerId: Types.ObjectId;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  items: OrderItemDoc[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paidAt: Date | null;
  payment: { method: string };
  updatedAt: Date;
  createdAt: Date;
}

const orderItemSchema = new Schema<OrderItemDoc>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: (v: number) => Number.isInteger(v) && v > 0, message: "quantity must be a positive integer" },
    },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const OrderSchema = new Schema<OrderDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    orderNumber: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true, index: true },
    customerEmail: { type: String, default: null, trim: true, lowercase: true },
    items: { type: [orderItemSchema], required: true, validate: { validator: (v: OrderItemDoc[]) => v.length > 0, message: "order must contain at least one item" } },
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "UNPAID" as PaymentStatus },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: "PENDING" as OrderStatus },
    paidAt: { type: Date, default: null },
    payment: {
      method: { type: Schema.Types.Mixed, default: "MANUAL" },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: any) {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.sellerId;
        delete ret.payment;
        const items: OrderItemType[] = (ret.items || []).map((it: OrderItemDoc) => ({
          productId: it.productId ? it.productId.toString() : "",
          productName: it.productName,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        }));
        ret.items = items;
      },
    },
  },
);

OrderSchema.index({ sellerId: 1, createdAt: -1 });
OrderSchema.index({ sellerId: 1, orderStatus: 1 });

export const OrderModel: Model<OrderDocument> = model<OrderDocument>(
  "Order",
  OrderSchema,
);

export const CounterModel = model<{ _id: string; seq: number }>(
  "Counter",
  new Schema<{ _id: string; seq: number }>({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0, min: 0 },
  }),
);
