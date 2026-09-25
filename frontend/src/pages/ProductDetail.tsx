import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { productService } from "../services";
import type { Product } from "../types";
import { formatPrice, formatDate } from "../utils/format";
import { buildWhatsAppLink } from "../utils/whatsapp";
import { ProductCard } from "../components/ProductCard";
import {
  EmptyState,
  ErrorState,
  Icons,
  ProductSkeleton,
  StockBadge,
  stockStatus,
} from "../components/ui";

export default function ProductDetail() {
  const { slug = "" } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setActiveImg(0);
    productService
      .getBySlug(slug)
      .then(async (p) => {
        if (!alive) return;
        if (!p) {
          setProduct(null);
          return;
        }
        setProduct(p);
        document.title = `${p.name} — ${import.meta.env.VITE_STORE_NAME ?? "Store"}`;
        const r = await productService.related(p, 4);
        if (alive) setRelated(r);
      })
      .catch((e) => {
        if (alive) setError(e?.message ?? "Unable to load product.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="container pdp-grid" style={{ padding: "32px 16px" }}>
        <div
          className="skeleton"
          style={{ aspectRatio: "1", borderRadius: 12 }}
        />
        <div className="stack gap-3">
          <div className="skeleton" style={{ height: 32, width: "70%" }} />
          <div className="skeleton" style={{ height: 20, width: "40%" }} />
          <div className="skeleton" style={{ height: 120 }} />
        </div>
      </div>
    );
  }

  if (error)
    return (
      <div className="container">
        <ErrorState message={error} />
      </div>
    );

  if (!product) {
    return (
      <div className="container" style={{ padding: "60px 16px" }}>
        <EmptyState
          title="Product not found"
          message="This product may have been removed or is no longer available."
          action={
            <Link className="btn btn-primary" to="/products">
              Browse products
            </Link>
          }
        />
      </div>
    );
  }

  const status = stockStatus(product);
  const out = status === "out-of-stock";

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>
      <nav
        className="small muted"
        style={{ marginBottom: 16 }}
        aria-label="Breadcrumb"
      >
        <Link to="/">Home</Link> / <Link to="/products">Products</Link> /{" "}
        <Link to={`/products?category=${product.category}`}>
          {product.category}
        </Link>{" "}
        / <span className="bold">{product.name}</span>
      </nav>

      <div className="pdp-grid">
        {/* Gallery */}
        <div className="gallery">
          <div className="gallery__main">
            <img
              src={product.images[activeImg]}
              alt={`${product.name} — image ${activeImg + 1}`}
            />
          </div>
          {product.images.length > 1 && (
            <div
              className="gallery__thumbs"
              role="tablist"
              aria-label="Product images"
            >
              {product.images.map((src, i) => (
                <button
                  key={src}
                  role="tab"
                  aria-selected={i === activeImg}
                  className={`gallery__thumb ${i === activeImg ? "active" : ""}`}
                  onClick={() => setActiveImg(i)}
                  aria-label={`Show image ${i + 1}`}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="stack gap-3">
          <div>
            <span className="small muted bold">{product.category}</span>
            <h1 style={{ marginTop: 4 }}>{product.name}</h1>
          </div>

          <div className="row gap-3 wrap">
            <span style={{ fontSize: "1.75rem", fontWeight: 700 }}>
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice &&
              product.compareAtPrice > product.price && (
                <span
                  className="muted"
                  style={{
                    textDecoration: "line-through",
                    fontSize: "1.125rem",
                  }}
                >
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
          </div>

          <div className="row gap-2 wrap">
            <StockBadge product={product} />
            {!product.isActive && (
              <span className="badge badge-neutral">Hidden</span>
            )}
            {product.isFeatured && (
              <span className="badge badge-info">Featured</span>
            )}
          </div>

          {status === "low-stock" && (
            <div
              className="card card-pad"
              style={{
                background: "var(--warn-soft)",
                borderColor: "#fcd34d",
                color: "#92400e",
              }}
            >
              <strong>Only {product.stockQuantity} left in stock.</strong> Order
              soon before it sells out.
            </div>
          )}
          {out && (
            <div
              className="card card-pad"
              style={{
                background: "var(--danger-soft)",
                borderColor: "#fca5a5",
                color: "#991b1b",
              }}
            >
              <strong>Out of stock.</strong> This item is currently unavailable.
              Message us to ask when it returns.
            </div>
          )}

          <p style={{ color: "var(--text)", whiteSpace: "pre-line" }}>
            {product.description}
          </p>

          <div className="stack gap-2" style={{ marginTop: 8 }}>
            <a
              className={`btn btn-block ${out ? "btn-ghost" : "btn-accent"}`}
              href={buildWhatsAppLink(product)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: "14px 20px", fontSize: "1rem" }}
            >
              <Icons.Whats size={20} />
              {out ? "Ask about availability" : "Enquire on WhatsApp"}
            </a>
            <p
              className="tiny muted"
              style={{ textAlign: "center", margin: 0 }}
            >
              Opens WhatsApp with a pre-filled message. No payment is taken on
              this site.
            </p>
          </div>

          <div className="divider" />

          <dl
            className="small"
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "8px 16px",
              margin: 0,
            }}
          >
            <dt className="muted">Stock status</dt>
            <dd style={{ margin: 0 }}>
              {out ? "Out of stock" : `${product.stockQuantity} available`}
            </dd>
            <dt className="muted">Category</dt>
            <dd style={{ margin: 0 }}>{product.category}</dd>
            <dt className="muted">Updated</dt>
            <dd style={{ margin: 0 }}>{formatDate(product.updatedAt)}</dd>
          </dl>
        </div>
      </div>

      {/* Related */}
      <section style={{ marginTop: 60 }}>
        <h2>You may also like</h2>
        {related.length === 0 ? (
          <div className="product-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
