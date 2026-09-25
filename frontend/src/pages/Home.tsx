import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productService } from "../services";
import type { Product } from "../types";
import { ProductCard } from "../components/ProductCard";
import { Icons, ProductSkeleton, EmptyState } from "../components/ui";
import { storeConfig } from "../config/store";
import { formatPrice } from "../utils/format";

export default function Home() {
  const [featured, setFeatured] = useState<Product[] | null>(null);
  const [latest, setLatest] = useState<Product[] | null>(null);
  const [lowStock, setLowStock] = useState<Product[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [f, l] = await Promise.all([
        productService.featured(8),
        productService.listPublic({
          search: "",
          category: "all",
          availability: "all",
          sort: "newest",
          page: 1,
          size: 8,
        }),
      ]);
      if (!alive) return;
      setFeatured(f);
      setLatest(l.items);
      setLowStock(f.filter((p) => p.stockQuantity <= p.lowStockThreshold));
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="hero-eyebrow">
              <Icons.Star size={14} /> Trusted by local shoppers
            </span>
            <h1>Quality products, delivered across {storeConfig.country}.</h1>
            <p style={{ fontSize: "1.0625rem", maxWidth: 520 }}>
              {storeConfig.description}
            </p>
            <div className="hero-cta">
              <Link to="/products" className="btn btn-primary">
                Shop all products <Icons.Arrow size={16} />
              </Link>
              <a
                className="btn btn-accent"
                href={buildHeroWhatsApp()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icons.Whats size={16} /> Chat with us
              </a>
            </div>
            <div
              className="row gap-4 wrap small muted"
              style={{ marginTop: 24 }}
            >
              <span className="row gap-2">
                <Icons.Check size={14} /> Fast delivery
              </span>
              <span className="row gap-2">
                <Icons.Check size={14} /> Secure enquiries
              </span>
              <span className="row gap-2">
                <Icons.Check size={14} /> {storeConfig.supportHours}
              </span>
            </div>
          </div>
          <div className="hero-image">
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80"
              alt="Curated products on display"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      <div className="container" style={{ paddingBottom: 40 }}>
        {/* ---------- Categories ---------- */}
        <section style={{ paddingTop: 24 }}>
          <div className="row between" style={{ marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>Shop by category</h2>
            <Link to="/products" className="small bold">
              View all →
            </Link>
          </div>
          <div className="chip-row">
            {[
              "Shoes",
              "Electronics",
              "Fashion",
              "Accessories",
              "Home",
              "Beauty",
            ].map((c) => (
              <Link
                key={c}
                to={`/products?category=${encodeURIComponent(c)}`}
                className="chip"
              >
                {c}
              </Link>
            ))}
          </div>
        </section>

        {/* ---------- Featured ---------- */}
        <section style={{ paddingTop: 36 }}>
          <div className="row between" style={{ marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0 }}>Featured products</h2>
              <p className="small" style={{ margin: 0 }}>
                Hand-picked by our team
              </p>
            </div>
            <Link to="/products?sort=popular" className="small bold">
              View all →
            </Link>
          </div>
          {featured === null ? (
            <div className="product-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <EmptyState
              title="No featured products yet"
              message="Check back soon."
            />
          ) : (
            <div className="product-grid">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* ---------- Low-stock highlight ---------- */}
        {lowStock.length > 0 && (
          <section style={{ paddingTop: 36 }}>
            <div className="row between" style={{ marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0 }}>Almost gone</h2>
                <p className="small" style={{ margin: 0 }}>
                  Limited stock — grab them before they sell out
                </p>
              </div>
            </div>
            <div className="product-grid">
              {lowStock.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* ---------- Latest ---------- */}
        <section style={{ paddingTop: 36 }}>
          <div className="row between" style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>New arrivals</h2>
            <Link to="/products?sort=newest" className="small bold">
              View all →
            </Link>
          </div>
          {latest === null ? (
            <div className="product-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="product-grid">
              {latest.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* ---------- Trust ---------- */}
        <section style={{ paddingTop: 48 }}>
          <div
            className="card card-pad"
            style={{
              display: "grid",
              gap: 20,
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            }}
          >
            {[
              {
                icon: <Icons.Trend size={22} />,
                title: "Best prices",
                text: `Fair ${storeConfig.currency} pricing with no hidden fees.`,
              },
              {
                icon: <Icons.Box size={22} />,
                title: "Real inventory",
                text: "Live stock counts so you always know availability.",
              },
              {
                icon: <Icons.Whats size={22} />,
                title: "Direct support",
                text: "Message the seller directly on WhatsApp.",
              },
            ].map((f) => (
              <div key={f.title} className="stack gap-2">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    display: "grid",
                    placeItems: "center",
                    background: "var(--surface-2)",
                    color: "var(--text)",
                  }}
                >
                  {f.icon}
                </div>
                <strong>{f.title}</strong>
                <span className="small muted">{f.text}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function buildHeroWhatsApp() {
  const text = encodeURIComponent(
    `Hello ${storeConfig.sellerName}, I'd like to know more about your store.`,
  );
  return `https://wa.me/${storeConfig.whatsappNumber}?text=${text}`;
}

/* re-export formatPrice so tree-shaking keeps it referenced */
void formatPrice;
