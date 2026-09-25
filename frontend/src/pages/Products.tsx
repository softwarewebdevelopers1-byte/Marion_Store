import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { productService } from "../services";
import type {
  Category,
  Paginated,
  Product,
  ProductFilters,
  SortOption,
} from "../types";
import { CATEGORIES } from "../types";
import { ProductCard } from "../components/ProductCard";
import {
  EmptyState,
  ErrorState,
  Icons,
  ProductSkeleton,
} from "../components/ui";

const PAGE_SIZE = 12;

function readFilters(params: URLSearchParams): ProductFilters {
  return {
    search: params.get("search") ?? "",
    category: (params.get("category") as Category) || "all",
    minPrice: params.has("minPrice")
      ? Number(params.get("minPrice"))
      : undefined,
    maxPrice: params.has("maxPrice")
      ? Number(params.get("maxPrice"))
      : undefined,
    availability:
      (params.get("availability") as ProductFilters["availability"]) || "all",
    sort: (params.get("sort") as SortOption) || "relevance",
    page: Math.max(1, Number(params.get("page") ?? 1)),
    size: PAGE_SIZE,
  };
}

export default function Products() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);
  const [data, setData] = useState<Paginated<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(filters.search);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Sync the input with the URL when the user navigates.
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  // Debounce the search input into the URL.
  useEffect(() => {
    if (searchInput === filters.search) return;
    const t = setTimeout(() => {
      patch({ search: searchInput, page: 1 });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    productService
      .listPublic(filters)
      .then((res) => {
        if (alive) setData(res);
      })
      .catch((e) => {
        if (alive) setError(e?.message ?? "Unable to load products.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [filters]);

  function patch(update: Partial<ProductFilters>) {
    const next = new URLSearchParams(params);
    Object.entries(update).forEach(([k, v]) => {
      if (
        v === undefined ||
        v === null ||
        v === "" ||
        v === "all" ||
        v === "relevance"
      ) {
        next.delete(k);
      } else {
        next.set(k, String(v));
      }
    });
    if (update.page === undefined || update.page === 1) next.delete("page");
    setParams(next, { replace: true });
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;
  const activeFiltersCount = [
    filters.category !== "all",
    filters.availability !== "all",
    filters.minPrice !== undefined || filters.maxPrice !== undefined,
  ].filter(Boolean).length;

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <div className="page-head">
        <div>
          <h1>All products</h1>
          <p className="small" style={{ margin: 0 }}>
            {data
              ? `${data.total} product${data.total === 1 ? "" : "s"}`
              : "Loading…"}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search">
          <Icons.Search size={18} />
          <input
            className="input"
            type="search"
            placeholder="Search products…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search products"
          />
        </div>
        <button className="btn btn-ghost" onClick={() => setDrawerOpen(true)}>
          <Icons.Filter size={16} /> Filters
          {activeFiltersCount > 0 && ` (${activeFiltersCount})`}
        </button>
        <select
          className="select"
          style={{ width: "auto", minWidth: 170 }}
          value={filters.sort}
          onChange={(e) =>
            patch({ sort: e.target.value as SortOption, page: 1 })
          }
          aria-label="Sort products"
        >
          <option value="relevance">Relevance</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="availability">Availability</option>
          <option value="popular">Most popular</option>
        </select>
      </div>

      {/* Category chips */}
      <div className="chip-row" style={{ marginBottom: 20 }}>
        <button
          className={`chip ${filters.category === "all" ? "active" : ""}`}
          onClick={() => patch({ category: "all", page: 1 })}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`chip ${filters.category === c ? "active" : ""}`}
            onClick={() => patch({ category: c, page: 1 })}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => setParams(new URLSearchParams(params))}
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No products found"
          message="Try adjusting your search or filters."
          action={
            <button
              className="btn btn-ghost"
              onClick={() => setParams(new URLSearchParams())}
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <>
          <div className="product-grid">
            {data.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {totalPages > 1 && (
            <nav
              className="row gap-2"
              style={{ justifyContent: "center", marginTop: 32 }}
              aria-label="Pagination"
            >
              <button
                className="btn btn-ghost btn-sm"
                disabled={filters.page <= 1}
                onClick={() => patch({ page: filters.page - 1 })}
              >
                Previous
              </button>
              <span className="small muted" style={{ padding: "6px 12px" }}>
                Page {filters.page} of {totalPages}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                disabled={filters.page >= totalPages}
                onClick={() => patch({ page: filters.page + 1 })}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <>
          <div
            className="drawer-backdrop"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="drawer" role="dialog" aria-label="Filters">
            <div className="row between" style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Filters</h3>
              <button
                className="btn-icon"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
              >
                <Icons.X size={18} />
              </button>
            </div>

            <div className="field">
              <label className="label" htmlFor="f-cat">
                Category
              </label>
              <select
                id="f-cat"
                className="select"
                value={filters.category}
                onChange={(e) =>
                  patch({
                    category: e.target.value as Category | "all",
                    page: 1,
                  })
                }
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <span className="label">Availability</span>
              <div className="stack gap-2">
                {[
                  { v: "all", l: "All products" },
                  { v: "in-stock", l: "In stock" },
                  { v: "low-stock", l: "Low stock" },
                  { v: "out-of-stock", l: "Out of stock" },
                ].map((o) => (
                  <label key={o.v} className="row gap-2">
                    <input
                      type="radio"
                      name="avail"
                      checked={filters.availability === o.v}
                      onChange={() =>
                        patch({
                          availability: o.v as ProductFilters["availability"],
                          page: 1,
                        })
                      }
                    />
                    <span>{o.l}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="field">
              <span className="label">
                Price range ({import.meta.env.VITE_STORE_NAME ? "" : ""}KES)
              </span>
              <div className="row gap-2">
                <input
                  className="input"
                  type="number"
                  placeholder="Min"
                  min={0}
                  value={filters.minPrice ?? ""}
                  onChange={(e) =>
                    patch({
                      minPrice: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                      page: 1,
                    })
                  }
                  aria-label="Minimum price"
                />
                <input
                  className="input"
                  type="number"
                  placeholder="Max"
                  min={0}
                  value={filters.maxPrice ?? ""}
                  onChange={(e) =>
                    patch({
                      maxPrice: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                      page: 1,
                    })
                  }
                  aria-label="Maximum price"
                />
              </div>
            </div>

            <div className="row gap-2" style={{ marginTop: 20 }}>
              <button
                className="btn btn-ghost btn-block"
                onClick={() => {
                  setParams(new URLSearchParams());
                  setDrawerOpen(false);
                }}
              >
                Clear all
              </button>
              <button
                className="btn btn-primary btn-block"
                onClick={() => setDrawerOpen(false)}
              >
                Show results
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
