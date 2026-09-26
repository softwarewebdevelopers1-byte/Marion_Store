export type Category =
  | "Shoes"
  | "Fashion"
  | "Electronics"
  | "Accessories"
  | "Home"
  | "Beauty"
  | "Other";

export const CATEGORIES: Category[] = [
  "Shoes",
  "Fashion",
  "Electronics",
  "Accessories",
  "Home",
  "Beauty",
  "Other",
];

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  imageKeys?: string[];
  category: Category;
  stockQuantity: number;
  lowStockThreshold: number;
  isAvailable: boolean;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  unitsSold?: number;
}

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export type InventoryMovementType =
  "PRODUCT_ADDED" | "SALE" | "ADJUSTMENT" | "DAMAGED" | "RESTOCKED";

export interface InventoryMovement {
  id: string;
  productId: string;
  type: InventoryMovementType;
  delta: number;
  note?: string;
  createdAt: string;
}

export type OrderStatus =
  "PENDING" | "CONFIRMED" | "PROCESSING" | "READY" | "COMPLETED" | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED" | "FAILED";

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  search: string;
  category: Category | "all";
  minPrice?: number;
  maxPrice?: number;
  availability: "all" | "in-stock" | "out-of-stock" | "low-stock";
  sort: SortOption;
  page: number;
  size: number;
}

export type SortOption =
  | "relevance"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc"
  | "availability"
  | "popular";

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category: Category;
  stockQuantity: number;
  lowStockThreshold: number;
  isFeatured: boolean;
  isActive: boolean;
}

export type SellerRole = "SELLER" | "ADMIN";
export type SellerStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "CLOSED";
export type PayoutProvider = "MPESA" | "BANK" | "STRIPE" | "NONE";

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

export interface SellerSocial {
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  x?: string;
}

export interface FullSellerStore {
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  themeColor?: string;
  currency: string;
  supportHours?: string;
  social?: SellerSocial;
}

export interface SellerAddress {
  line1?: string;
  line2?: string;
  city?: string;
  county?: string;
  country?: string;
  postalCode?: string;
}

export interface SellerBusiness {
  legalName?: string;
  regNumber?: string;
  taxPin?: string;
  isVerified?: boolean;
}

export interface SellerPayout {
  provider: PayoutProvider;
  accountRef?: string;
  bankName?: string;
  isVerified?: boolean;
}

export interface SellerSettings {
  defaultLowStockThreshold: number;
  autoHideOutOfStock: boolean;
  notifyLowStock: boolean;
  notifyNewInquiry: boolean;
}

export interface FullSeller {
  id: string;
  email: string;
  phone: string;
  displayName: string;
  role: SellerRole;
  status: SellerStatus;
  store: FullSellerStore;
  stats?: SellerStats;
  address?: SellerAddress;
  business?: SellerBusiness;
  payout?: SellerPayout;
  settings: SellerSettings;
  createdAt: string;
  updatedAt: string;
  requiresReverification?: boolean;
}

export type AccountUpdateBody = Partial<{
  displayName: string;
  phone: string;
  email: string;
  store: Partial<Omit<FullSellerStore, "logoUrl" | "bannerUrl">> & {
    social?: Partial<SellerSocial>;
  };
  address: Partial<SellerAddress>;
  business: Partial<SellerBusiness>;
  payout: Partial<Omit<SellerPayout, "isVerified">>;
  settings: Partial<SellerSettings>;
}>;

export interface FieldErrors {
  [field: string]: string;
}
