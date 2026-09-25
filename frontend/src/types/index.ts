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
