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
  return /^\d{10,15}$/.test(v);
}

export function maskAccountRef(ref: string | undefined): string | undefined {
  if (!ref) return undefined;
  if (ref.length <= 4) return "*".repeat(ref.length);
  return ref.slice(0, 2) + "*".repeat(ref.length - 4) + ref.slice(-2);
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
    instagram: { type: String, trim: true },
    facebook: { type: String, trim: true },
    tiktok: { type: String, trim: true },
    x: { type: String, trim: true },
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
    logoKey: { type: String, select: false },
    bannerUrl: { type: String },
    bannerKey: { type: String, select: false },
    themeColor: { type: String, default: "#0f172a" },
    currency: { type: String, default: "KES", uppercase: true, maxlength: 3 },
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
    line1: { type: String, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, trim: true },
    county: { type: String, trim: true },
    country: { type: String, trim: true, default: "Kenya" },
    postalCode: { type: String, trim: true },
  },
  { _id: false },
);

const payoutSchema = new Schema<SellerPayout & Document>(
  {
    method: { type: String },
    payeeName: { type: String, trim: true },
    account: { type: String, trim: true, select: false },
    provider: {
      type: String,
      enum: ["MPESA", "BANK", "STRIPE", "NONE"],
      default: "NONE",
    },
    accountRef: { type: String, trim: true },
    bankName: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
  },
  { _id: false },
);

const businessSchema = new Schema<SellerBusiness & Document>(
  {
    name: { type: String, trim: true },
    registration: { type: String, trim: true },
    taxId: { type: String, trim: true },
    legalName: { type: String, trim: true },
    regNumber: { type: String, trim: true },
    taxPin: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
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
  passwordChangedAt: Date | null;
  emailVerifiedAt: Date | null;
  store: SellerStore;
  settings: SellerSettings;
  stats: SellerStats;
  address?: SellerAddress;
  payout?: SellerPayout;
  business?: SellerBusiness;
  comparePassword(pw: string): Promise<boolean>;
  toPublicJSON(): PublicSeller;
  toAdminJSON(): SellerAdminJSON;
  isActive: boolean;
  storeName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SellerAdminJSON {
  id: string;
  email: string;
  phone: string;
  displayName: string;
  role: string;
  status: string;
  store: SellerStore;
  address?: SellerAddress;
  business?: SellerBusiness;
  payout?: SellerPayout;
  settings: SellerSettings;
  createdAt: string;
  updatedAt: string;
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
    passwordChangedAt: { type: Date, default: null },
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
        delete ret.passwordChangedAt;
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

SellerSchema.methods.toAdminJSON = function (
  this: SellerDocument,
): SellerAdminJSON {
  const store = this.store;
  const payout = this.payout;
  return {
    id: this._id.toString(),
    email: this.email,
    phone: this.phone,
    displayName: this.displayName,
    role: this.role,
    status: this.status,
    store: {
      slug: store?.slug ?? "",
      name: store?.name ?? "",
      tagline: store?.tagline,
      description: store?.description,
      logoUrl: store?.logoUrl,
      bannerUrl: store?.bannerUrl,
      themeColor: store?.themeColor ?? "#0f172a",
      currency: store?.currency ?? "KES",
      supportHours: store?.supportHours,
      social: store?.social ?? { whatsapp: "" },
    },
    address: this.address,
    business: this.business,
    payout: payout
      ? {
          provider: payout.provider,
          accountRef: maskAccountRef(payout.accountRef),
          bankName: payout.bankName,
          isVerified: payout.isVerified,
        }
      : undefined,
    settings: {
      defaultLowStockThreshold: this.settings?.defaultLowStockThreshold ?? 5,
      autoHideOutOfStock: this.settings?.autoHideOutOfStock ?? false,
      notifyLowStock: this.settings?.notifyLowStock ?? false,
      notifyNewInquiry: this.settings?.notifyNewInquiry ?? false,
    },
    createdAt: this.createdAt?.toISOString(),
    updatedAt: this.updatedAt?.toISOString(),
  };
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
