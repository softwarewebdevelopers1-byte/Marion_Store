export type Role = "SELLER" | "ADMIN";
export type SellerStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "CLOSED";

export interface SellerSocial {
  whatsapp: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  x?: string;
}

export interface SellerStore {
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  logoKey?: string;
  bannerUrl?: string;
  bannerKey?: string;
  themeColor?: string;
  currency: string;
  supportHours?: string;
  social: SellerSocial;
}

export interface SellerSettings {
  defaultLowStockThreshold: number;
  autoHideOutOfStock?: boolean;
  notifyLowStock?: boolean;
  notifyNewInquiry?: boolean;
}

export interface SellerStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalUnitsSold: number;
  lowStockItems: number;
  outOfStockItems: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

export interface SellerAddress {
  line1?: string;
  line2?: string;
  city?: string;
  county?: string;
  country?: string;
  postalCode?: string;
}

export interface SellerPayout {
  method?: string;
  payeeName?: string;
  account?: string;
  provider?: "MPESA" | "BANK" | "STRIPE" | "NONE";
  accountRef?: string;
  bankName?: string;
  isVerified?: boolean;
}

export interface SellerBusiness {
  name?: string;
  registration?: string;
  taxId?: string;
  legalName?: string;
  regNumber?: string;
  taxPin?: string;
  isVerified?: boolean;
}

export interface Seller {
  id: string;
  email: string;
  phone: string;
  displayName: string;
  role: Role;
  status: SellerStatus;
  passwordHash: string;
  refreshTokenHash?: string | null;
  emailVerifiedAt?: string | null;
  store: SellerStore;
  settings: SellerSettings;
  stats: SellerStats;
  address?: SellerAddress;
  payout?: SellerPayout;
  business?: SellerBusiness;
  createdAt: string;
  updatedAt: string;
}

export interface PublicSeller {
  slug: string;
  name: string;
  sellerName: string;
  tagline?: string;
  description?: string;
  logo: string;
  banner: string;
  themeColor: string;
  currency: string;
  supportHours: string;
  whatsappNumber: string;
}
