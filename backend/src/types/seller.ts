export type Role = "SELLER" | "ADMIN";
export type SellerStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "CLOSED";

export interface SellerSocial {
  whatsapp: string;
}

export interface SellerStore {
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
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
  city?: string;
  county?: string;
  country?: string;
}

export interface SellerPayout {
  method?: string;
  payeeName?: string;
  account?: string;
}

export interface SellerBusiness {
  name?: string;
  registration?: string;
  taxId?: string;
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
