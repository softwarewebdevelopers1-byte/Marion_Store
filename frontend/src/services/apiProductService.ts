import { http, HttpError } from "./http";
import type {
  Product,
  ProductFilters,
  ProductInput,
  Paginated,
} from "../types";

function toProduct(raw: Record<string, unknown>): Product {
  return raw as unknown as Product;
}

async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const raw = await http<Record<string, unknown>>(
      `/products/admin/${id}`,
    );
    return toProduct(raw);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) return null;
    throw err;
  }
}

export const productService = {
  async listPublic(filters: ProductFilters): Promise<Paginated<Product>> {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.category && filters.category !== "all")
      params.set("category", filters.category);
    if (filters.minPrice !== undefined)
      params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice !== undefined)
      params.set("maxPrice", String(filters.maxPrice));
    if (filters.availability) params.set("availability", filters.availability);
    if (filters.sort && filters.sort !== "relevance")
      params.set("sort", filters.sort);
    params.set("page", String(filters.page));
    params.set("size", String(filters.size));

    const data = await http<Paginated<Product>>(`/products?${params}`);
    return data;
  },

  async getBySlug(slug: string): Promise<Product | null> {
    try {
      const raw = await http<Record<string, unknown>>(`/products/${slug}`);
      return toProduct(raw);
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) return null;
      throw err;
    }
  },

  async getById(id: string): Promise<Product | null> {
    return fetchProduct(id);
  },

  async featured(limit = 4): Promise<Product[]> {
    const data = await http<{ items: Product[] }>(`/products/featured`);
    return data.items.slice(0, limit);
  },

  async related(product: Product, limit = 4): Promise<Product[]> {
    return productService.listPublic({
      search: "",
      category: product.category,
      availability: "all",
      sort: "relevance",
      page: 1,
      size: limit + 1,
    }).then((res) =>
      res.items.filter((p) => p.id !== product.id).slice(0, limit),
    );
  },

  async listAdmin(): Promise<Product[]> {
    const data = await http<{ items: Product[] }>(
      `/products/admin/all`,
    );
    return data.items;
  },

  async create(input: ProductInput): Promise<Product> {
    const raw = await http<Record<string, unknown>>(
      `/products/admin`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
    return toProduct(raw);
  },

  async update(id: string, input: ProductInput): Promise<Product> {
    const raw = await http<Record<string, unknown>>(
      `/products/admin/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(input),
      },
    );
    return toProduct(raw);
  },

  async remove(id: string): Promise<void> {
    await http<void>(`/products/admin/${id}`, { method: "DELETE" });
  },

  async patchStock(id: string, quantity: number): Promise<Product> {
    await http<{ productId: string; stockQuantity: number; isAvailable: boolean }>(
      `/products/admin/${id}/stock`,
      {
        method: "PATCH",
        body: JSON.stringify({ quantity, reason: "stock adjustment" }),
      },
    );
    const product = await fetchProduct(id);
    if (!product) throw new Error("Product not found after stock update");
    return product;
  },

  async patchAvailability(
    id: string,
    isAvailable: boolean,
  ): Promise<Product> {
    const raw = await http<Record<string, unknown>>(
      `/products/admin/${id}/availability`,
      {
        method: "PATCH",
        body: JSON.stringify({ isAvailable }),
      },
    );
    return toProduct(raw);
  },

  async patchVisibility(id: string, isActive: boolean): Promise<Product> {
    const raw = await http<Record<string, unknown>>(
      `/products/admin/${id}/visibility`,
      {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      },
    );
    return toProduct(raw);
  },

  async categoriesInUse(): Promise<string[]> {
    const data = await http<{ items: string[] }>(`/products/categories`);
    return data.items;
  },

  async inventorySummary() {
    const data = await http<{
      total: number;
      inStock: Product[];
      low: Product[];
      out: Product[];
      hidden: Product[];
      value: number;
    }>(`/products/admin/inventory/summary`);
    return data;
  },

  async uploadImages(productId: string, files: FileList): Promise<string[]> {
    const form = new FormData();
    for (let i = 0; i < files.length; i++) {
      form.append("images", files[i]);
    }
    const raw = await http<{ images: string[]; imageKeys: string[] }>(
      `/admin/products/${productId}/images`,
      {
        method: "POST",
        body: form,
      },
    );
    return raw.images;
  },

  async removeImage(productId: string, key: string): Promise<void> {
    await http(
      `/admin/products/${productId}/images/${key}`,
      { method: "DELETE" },
    );
  },

  async reorderImages(
    productId: string,
    orderedKeys: string[],
  ): Promise<void> {
    await http(
      `/admin/products/${productId}/images/reorder`,
      {
        method: "PATCH",
        body: JSON.stringify({ orderedKeys }),
      },
    );
  },
};

export function subscribe(fn: () => void): () => void {
  void fn;
  // No-op: the API has no WebSocket or server-sent events channel.
  // Pages refetch on navigation; for real-time updates, callers
  // can use the returned unsubscribe to wire up polling if needed.
  return () => {};
}
