import { Schema, model, type Model, type Document } from "mongoose";
import bcrypt from "bcrypt";
import type {
  Role,
  SellerStatus,
  SellerStore,
  SellerSocial,
  SellerSettings,
  SellerStats,
  SellerAddress,
  SellerPayout,
  SellerBusiness,
  PublicSeller,
} from "../types/seller.js";
import { config } from "../config.js";

function digits(v: string): boolean {
  return /^\+?\d{7,15}$/.test(v);
}

const socialSchema = new Schema<SellerSocial & Document>(
  {
    whatsapp: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: digits,
        message: "WhatsApp number must contain only digits (E.164)",
      },
    },
  },
  { _id: false },
);

const storeSchema = new Schema<SellerStore & Document>(
  {
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (v: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v),
        message: "Store slug is invalid",
      },
    },
    name: { type: String, required: true, trim: true },
    tagline: { type: String, trim: true },
    description: { type: String, trim: true },
    logoUrl: { type: String },
    bannerUrl: { type: String },
    themeColor: { type: String, default: "#0f172a" },
    currency: { type: String, default: "KES", uppercase: true },
    supportHours: { type: String },
    social: socialSchema,
  },
  { _id: false },
);

const settingsSchema = new Schema<SellerSettings & Document>(
  {
    defaultLowStockThreshold: { type: Number, default: 5, min: 0 },
    autoHideOutOfStock: { type: Boolean, default: false },
    notifyLowStock: { type: Boolean, default: false },
    notifyNewInquiry: { type: Boolean, default: false },
  },
  { _id: false },
);

const statsSchema = new Schema<SellerStats & Document>(
  {
    totalProducts: { type: Number, default: 0, min: 0 },
    totalOrders: { type: Number, default: 0, min: 0 },
    totalRevenue: { type: Number, default: 0, min: 0 },
    totalUnitsSold: { type: Number, default: 0, min: 0 },
    lowStockItems: { type: Number, default: 0, min: 0 },
    outOfStockItems: { type: Number, default: 0, min: 0 },
    pendingOrders: { type: Number, default: 0, min: 0 },
    completedOrders: { type: Number, default: 0, min: 0 },
    cancelledOrders: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const addressSchema = new Schema<SellerAddress & Document>(
  {
    city: { type: String },
    county: { type: String },
    country: { type: String },
  },
  { _id: false },
);

const payoutSchema = new Schema<SellerPayout & Document>(
  {
    method: { type: String },
    payeeName: { type: String },
    account: { type: String },
  },
  { _id: false },
);

const businessSchema = new Schema<SellerBusiness & Document>(
  {
    name: { type: String },
    registration: { type: String },
    taxId: { type: String },
  },
  { _id: false },
);

export interface SellerDocument extends Document {
  email: string;
  phone: string;
  displayName: string;
  role: Role;
  status: SellerStatus;
  passwordHash: string;
  refreshTokenHash: string | null;
  emailVerifiedAt: Date | null;
  store: SellerStore;
  settings: SellerSettings;
  stats: SellerStats;
  address?: SellerAddress;
  payout?: SellerPayout;
  business?: SellerBusiness;
  comparePassword(pw: string): Promise<boolean>;
  toPublicJSON(): PublicSeller;
  isActive: boolean;
  storeName: string;
}

const SellerSchema = new Schema<SellerDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      validate: {
        validator: digits,
        message: "Phone must be E.164 digits",
      },
    },
    displayName: { type: String, required: true, trim: true },
    role: { type: String, enum: ["SELLER", "ADMIN"], default: "SELLER" as Role },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "SUSPENDED", "CLOSED"],
      default: "PENDING" as SellerStatus,
    },
    passwordHash: { type: String, select: false },
    refreshTokenHash: { type: String, select: false },
    emailVerifiedAt: { type: Date, default: null },
    store: storeSchema,
    settings: settingsSchema,
    stats: statsSchema,
    address: { type: addressSchema },
    payout: { type: payoutSchema },
    business: { type: businessSchema },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.refreshTokenHash;
      },
    },
  },
);

SellerSchema.index({ "store.slug": 1 }, { unique: true });
SellerSchema.index({ status: 1, role: 1 });

SellerSchema.virtual("isActive").get(function (this: SellerDocument) {
  return this.status === "ACTIVE";
});
SellerSchema.virtual("storeName").get(function (this: SellerDocument) {
  return this.store?.name ?? "";
});

SellerSchema.methods.comparePassword = async function (
  this: SellerDocument,
  pw: string,
): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(pw, this.passwordHash);
};

SellerSchema.methods.toPublicJSON = function (
  this: SellerDocument,
): PublicSeller {
  const store = this.store;
  return {
    slug: store?.slug ?? "",
    name: store?.name ?? "",
    sellerName: this.displayName ?? "",
    tagline: store?.tagline,
    description: store?.description,
    logo: store?.logoUrl ?? "/favicon.svg",
    banner: store?.bannerUrl ?? "",
    themeColor: store?.themeColor ?? "#0f172a",
    currency: store?.currency ?? "KES",
    supportHours: store?.supportHours ?? "",
    whatsappNumber: store?.social?.whatsapp ?? "",
  };
};

export const SellerModel: Model<SellerDocument> = model<SellerDocument>(
  "Seller",
  SellerSchema,
);

export const hashPassword = (pw: string): Promise<string> =>
  bcrypt.hash(pw, config.bcryptRounds);

export const hashRefresh = (token: string): Promise<string> =>
  bcrypt.hash(token, config.bcryptRounds);

export const compareHash = (value: string, hash: string): Promise<boolean> =>
  bcrypt.compare(value, hash);
