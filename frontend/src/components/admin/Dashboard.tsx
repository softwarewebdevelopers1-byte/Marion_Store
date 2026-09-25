import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productService, subscribe } from "../../services";
import type { Product } from "../../types";
import { formatPrice } from "../../utils/format";
import { Icons, StockBadge } from "../../components/ui";

type Summary = Awaited<ReturnType<typeof productService.inventorySummary>>;

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      productService.inventorySummary().then((s) => alive && setSummary(s));
    load();
    const unsub = subscribe(load);
    return () => {
      alive = false;
      if (typeof unsub === "function") unsub();
    };
  }, []);

  if (!summary) {
    return (
      <div className="stats-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 100 }} />
        ))}
      </div>
    );
  }

  const attention = [
    ...summary.out.map((p) => ({ p, kind: "Out of stock" as const })),
    ...summary.low.map((p) => ({ p, kind: "Low stock" as const })),
    ...summary.hidden.map((p) => ({ p, kind: "Hidden" as const })),
  ].slice(0, 6);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="small" style={{ margin: 0 }}>
            Overview of your store inventory and activity.
          </p>
        </div>
        <Link to="/admin/products/new" className="btn btn-primary">
          <Icons.Plus size={16} /> Add product
        </Link>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        <Stat
          label="Total products"
          value={String(summary.total)}
          hint={`Stock value ${formatPrice(summary.value)}`}
        />
        <Stat
          label="In stock"
          value={String(summary.inStock.length)}
          hint="Ready to sell"
          accent="#166534"
        />
        <Stat
          label="Low stock"
          value={String(summary.low.length)}
          hint="At or below threshold"
          accent="#92400e"
        />
        <Stat
          label="Out of stock"
          value={String(summary.out.length)}
          hint="Needs restocking"
          accent="#991b1b"
        />
      </div>

      <div className="divider" style={{ margin: "28px 0" }} />

      {/* Demo sales block (clearly labelled) */}
      <section style={{ marginBottom: 32 }}>
        <div className="row between" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: "1.125rem" }}>Sales snapshot</h2>
          <span className="badge badge-info">Demo data</span>
        </div>
        <div className="stats-grid">
          <Stat
            label="Today's sales"
            value={formatPrice(18500)}
            hint="Demo — not persisted"
          />
          <Stat label="Orders" value="12" hint="Demo" />
          <Stat label="Pending" value="3" hint="Demo" />
          <Stat label="Completed" value="9" hint="Demo" />
        </div>
        <p className="tiny muted" style={{ marginTop: 8 }}>
          Sales figures are placeholder values. The order & payment backend is
          not yet connected.
        </p>
      </section>

      <div className="divider" style={{ margin: "28px 0" }} />

      {/* Needs attention */}
      <section>
        <div className="row between" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: "1.125rem" }}>Needs attention</h2>
          <Link to="/admin/inventory" className="small bold">
            Manage inventory →
          </Link>
        </div>
        {attention.length === 0 ? (
          <div className="card card-pad small muted">
            <Icons.Check size={16} /> Everything looks healthy. No products need
            attention.
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Status</th>
                    <th>Stock</th>
                    <th>Price</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {attention.map(({ p, kind }) => (
                    <tr key={p.id}>
                      <td data-label="Product">
                        <div className="row gap-2">
                          <img
                            src={p.images[0]}
                            alt=""
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              objectFit: "cover",
                            }}
                          />
                          <span className="bold">{p.name}</span>
                        </div>
                      </td>
                      <td data-label="Status">
                        <span
                          className={`badge ${
                            kind === "Out of stock"
                              ? "badge-danger"
                              : kind === "Low stock"
                                ? "badge-warn"
                                : "badge-neutral"
                          }`}
                        >
                          {kind}
                        </span>
                      </td>
                      <td data-label="Stock">{p.stockQuantity}</td>
                      <td data-label="Price">{formatPrice(p.price)}</td>
                      <td>
                        <Link
                          className="btn btn-ghost btn-sm"
                          to={`/admin/products/${p.id}`}
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="stat">
      <div className="stat__label">{label}</div>
      <div
        className="stat__value"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
      {hint && <div className="stat__hint">{hint}</div>}
    </div>
  );
}

/* re-export to keep imports honest */
void StockBadge;
void (null as unknown as Product);
