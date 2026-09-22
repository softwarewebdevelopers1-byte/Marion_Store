import { mockProducts } from "../data/mockProducts";
import type {
  Product,
  ProductFilters,
  Paginated,
  ProductInput,
  SortOption,
} from "../types";
import { slugify, uniqueSlug } from "../utils/format";

/**
 * In-memory store standing in for the backend.
 * The public API of this module mirrors the future REST endpoints exactly,
 * so swapping the implementation later is a drop-in change.
 */
let products: Product[] = [...mockProducts];

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

function matchesFilters(p: Product, f: ProductFilters): boolean {
  if (f.category !== "all" && p.category !== f.category) return false;
  if (f.minPrice !== undefined && p.price < f.minPrice) return false;
  if (f.maxPrice !== undefined && p.price > f.maxPrice) return false;

  switch (f.availability) {
    case "in-stock":
      if (p.stockQuantity <= 0) return false;
      break;
    case "out-of-stock":
      if (p.stockQuantity > 0) return false;
      break;
    case "low-stock":
      if (p.stockQuantity <= 0 || p.stockQuantity > p.lowStockThreshold)
        return false;
      break;
  }

  if (f.search.trim()) {
    const q = f.search.toLowerCase();
    const hay = `${p.name} ${p.description} ${p.category}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function sortProducts(list: Product[], sort: SortOption): Product[] {
  const copy = [...list];
  switch (sort) {
    case "newest":
      return copy.sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      );
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "name-asc":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return copy.sort((a, b) => b.name.localeCompare(a.name));
    case "availability":
      return copy.sort((a, b) => b.stockQuantity - a.stockQuantity);
    case "popular":
      return copy.sort((a, b) => (b.unitsSold ?? 0) - (a.unitsSold ?? 0));
    case "relevance":
    default:
      return copy;
  }
}

export const productService = {
  /** GET /api/products (public — only active products) */
  async listPublic(filters: ProductFilters): Promise<Paginated<Product>> {
    await delay();
    const visible = products.filter((p) => p.isActive);
    const filtered = visible.filter((p) => matchesFilters(p, filters));
    const sorted = sortProducts(filtered, filters.sort);
    const start = (filters.page - 1) * filters.size;
    return {
      items: sorted.slice(start, start + filters.size),
      total: sorted.length,
      page: filters.page,
      size: filters.size,
    };
  },

  /** GET /api/products/{slug} */
  async getBySlug(slug: string): Promise<Product | null> {
    await delay();
    return products.find((p) => p.slug === slug && p.isActive) ?? null;
  },

  /** GET /api/products/{id} — used by admin, includes hidden products */
  async getById(id: string): Promise<Product | null> {
    await delay();
    return products.find((p) => p.id === id) ?? null;
  },

  /** GET /api/products/featured */
  async featured(limit = 4): Promise<Product[]> {
    await delay();
    return products
      .filter((p) => p.isActive && p.isFeatured && p.stockQuantity > 0)
      .slice(0, limit);
  },

  /** Related products: same category, different id, in stock first. */
  async related(product: Product, limit = 4): Promise<Product[]> {
    await delay();
    return products
      .filter((p) => p.isActive && p.id !== product.id)
      .sort((a, b) => {
        const sameCatA = a.category === product.category ? 1 : 0;
        const sameCatB = b.category === product.category ? 1 : 0;
        if (sameCatA !== sameCatB) return sameCatB - sameCatA;
        return (
          Math.abs(a.price - product.price) - Math.abs(b.price - product.price)
        );
      })
      .slice(0, limit);
  },

  /** GET /api/admin/products — all products, hidden included */
  async listAdmin(): Promise<Product[]> {
    await delay();
    return [...products].sort(
      (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt),
    );
  },

  /** POST /api/admin/products */
  async create(input: ProductInput): Promise<Product> {
    await delay();
    const now = new Date().toISOString();
    const slug = uniqueSlug(
      input.name,
      products.map((p) => p.slug),
    );
    const product: Product = {
      id: `p_${crypto.randomUUID().slice(0, 8)}`,
      slug,
      ...input,
      isAvailable: input.stockQuantity > 0,
      createdAt: now,
      updatedAt: now,
      unitsSold: 0,
    };
    products = [product, ...products];
    emit();
    return product;
  },

  /** PUT /api/admin/products/{id} */
  async update(id: string, input: ProductInput): Promise<Product> {
    await delay();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found");
    const existing = products[idx];
    const slug =
      existing.name === input.name
        ? existing.slug
        : uniqueSlug(
            input.name,
            products.filter((p) => p.id !== id).map((p) => p.slug),
          );
    const updated: Product = {
      ...existing,
      ...input,
      slug,
      isAvailable: input.stockQuantity > 0,
      updatedAt: new Date().toISOString(),
    };
    products = products.map((p) => (p.id === id ? updated : p));
    emit();
    return updated;
  },

  /** DELETE /api/admin/products/{id} */
  async remove(id: string): Promise<void> {
    await delay();
    products = products.filter((p) => p.id !== id);
    emit();
  },

  /** PATCH /api/admin/products/{id}/stock */
  async patchStock(id: string, quantity: number): Promise<Product> {
    await delay();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found");
    const q = Math.max(0, Math.floor(quantity));
    const updated: Product = {
      ...products[idx],
      stockQuantity: q,
      isAvailable: q > 0,
      updatedAt: new Date().toISOString(),
    };
    products = products.map((p) => (p.id === id ? updated : p));
    emit();
    return updated;
  },

  /** PATCH /api/admin/products/{id}/availability */
  async patchAvailability(id: string, isAvailable: boolean): Promise<Product> {
    // In this demo, "mark out of stock" zeroes inventory; "restore" sets to a default.
    return this.patchStock(id, isAvailable ? 10 : 0);
  },

  /** PATCH /api/admin/products/{id}/visibility */
  async patchVisibility(id: string, isActive: boolean): Promise<Product> {
    await delay();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found");
    const updated: Product = {
      ...products[idx],
      isActive,
      updatedAt: new Date().toISOString(),
    };
    products = products.map((p) => (p.id === id ? updated : p));
    emit();
    return updated;
  },

  /** Derived helpers — no network. */
  categoriesInUse(): string[] {
    return Array.from(
      new Set(products.filter((p) => p.isActive).map((p) => p.category)),
    );
  },

  /** GET /api/admin/inventory — summary for the dashboard. */
  async inventorySummary() {
    await delay();
    const active = products.filter((p) => p.isActive);
    const inStock = active.filter((p) => p.stockQuantity > 0);
    const low = active.filter(
      (p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold,
    );
    const out = active.filter((p) => p.stockQuantity <= 0);
    const hidden = products.filter((p) => !p.isActive);
    const value = products.reduce(
      (sum, p) => sum + p.price * p.stockQuantity,
      0,
    );
    return { total: products.length, inStock, low, out, hidden, value };
  },
};

export type ProductService = typeof productService;
