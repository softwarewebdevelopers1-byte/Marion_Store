import { Link } from "react-router-dom";
import type { Product } from "../types";
import { formatPrice } from "../utils/format";
import { buildWhatsAppLink } from "../utils/whatsapp";
import { Icons, StockBadge, stockStatus } from "./ui";

export function ProductCard({ product }: { product: Product }) {
  const out = stockStatus(product) === "out-of-stock";
  return (
    <article className="card product-card">
      <Link
        to={`/products/${product.slug}`}
        aria-label={`View ${product.name}`}
      >
        <div className="product-card__media">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.name} loading="lazy" />
          ) : (
            <div
              className="row"
              style={{
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
              }}
            >
              <Icons.Box size={32} />
            </div>
          )}
          {out && <span className="badge badge-danger">Out of stock</span>}
          {!out &&
            product.compareAtPrice &&
            product.compareAtPrice > product.price && (
              <span
                className="badge badge-info"
                style={{ left: "auto", right: 10 }}
              >
                Sale
              </span>
            )}
        </div>
      </Link>
      <div className="product-card__body">
        <span className="product-card__meta">{product.category}</span>
        <Link to={`/products/${product.slug}`} className="product-card__name">
          {product.name}
        </Link>
        <div>
          <span className="product-card__price">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="product-card__compare">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 4 }}>
          <StockBadge product={product} />
        </div>
      </div>
      <div className="product-card__actions">
        <Link className="btn btn-ghost btn-sm" to={`/products/${product.slug}`}>
          Details
        </Link>
        <a
          className={`btn btn-sm ${out ? "btn-ghost" : "btn-accent"}`}
          href={buildWhatsAppLink(product)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icons.Whats size={16} />
          <span className="hide-mobile">
            {out ? "Ask availability" : "WhatsApp"}
          </span>
          <span className="show-mobile">Chat</span>
        </a>
      </div>
    </article>
  );
}
