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

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category: Category;
  stockQuantity: number;
  lowStockThreshold: number;
  isAvailable: boolean;
  isFeatured: boolean;
  isActive: boolean;
  unitsSold: number;
  views: number;
  stockStatus: StockStatus;
  createdAt: string;
  updatedAt: string;
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
