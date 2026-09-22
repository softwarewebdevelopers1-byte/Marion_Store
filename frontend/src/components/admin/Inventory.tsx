import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { productService } from "../../services/productService";
import type { Product } from "../../types";
import { formatPrice } from "../../utils/format";
import {
  EmptyState,
  Icons,
  Modal,
  QuantityStepper,
  stockStatus,
  useToast,
} from "../../components/ui";

type Tab = "all" | "low" | "out";

export default function Inventory() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [draft, setDraft] = useState(0);
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  useEffect(() => {
    let alive = true;
    const load = () =>
      productService.listAdmin().then((p) => alive && setProducts(p));
    load();
    const unsub = productService.subscribe(load);
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const grouped = useMemo(() => {
    if (!products) return null;
    const low = products.filter(
      (p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold,
    );
    const out = products.filter((p) => p.stockQuantity <= 0);
    return { all: products, low, out };
  }, [products]);

  function openAdjust(p: Product) {
    setEditing(p);
    setDraft(p.stockQuantity);
  }

  async function saveAdjust() {
    if (!editing) return;
    setBusy(true);
    try {
      const wasZero = editing.stockQuantity <= 0;
      await productService.patchStock(editing.id, draft);
      const nowZero = draft <= 0;
      if (wasZero && !nowZero)
        push("Product restored — back in stock.", "success");
      else if (!wasZero && nowZero)
        push("Product marked as out of stock.", "success");
      else push("Stock updated successfully.", "success");
      setEditing(null);
    } catch {
      push("Could not update stock.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleAvailability(p: Product) {
    try {
      const out = p.stockQuantity <= 0;
      if (out) {
        await productService.patchAvailability(p.id, true);
        push("Product restored (set to 10 units).", "success");
      } else {
        await productService.patchAvailability(p.id, false);
        push("Product marked as out of stock.", "success");
      }
    } catch {
      push("Could not update availability.", "error");
    }
  }

  if (!grouped) return <div className="skeleton" style={{ height: 320 }} />;

  const list = grouped[tab === "all" ? "all" : tab === "low" ? "low" : "out"];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Inventory</h1>
          <p className="small" style={{ margin: 0 }}>
            Adjust stock levels, mark items out of stock, and restore products.
          </p>
        </div>
      </div>

      {/* Alerts summary */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <button
          className="stat"
          style={{
            textAlign: "left",
            cursor: "pointer",
            border: tab === "low" ? "2px solid var(--warn)" : undefined,
          }}
          onClick={() => setTab("low")}
        >
          <div className="stat__label">Low stock</div>
          <div className="stat__value" style={{ color: "#92400e" }}>
            {grouped.low.length}
          </div>
          <div className="stat__hint">Products at or below threshold</div>
        </button>
        <button
          className="stat"
          style={{
            textAlign: "left",
            cursor: "pointer",
            border: tab === "out" ? "2px solid var(--danger)" : undefined,
          }}
          onClick={() => setTab("out")}
        >
          <div className="stat__label">Out of stock</div>
          <div className="stat__value" style={{ color: "#991b1b" }}>
            {grouped.out.length}
          </div>
          <div className="stat__hint">Products customers can’t buy</div>
        </button>
      </div>

      {/* Tabs */}
      <div className="chip-row" style={{ marginBottom: 16 }}>
        <button
          className={`chip ${tab === "all" ? "active" : ""}`}
          onClick={() => setTab("all")}
        >
          All ({grouped.all.length})
        </button>
        <button
          className={`chip ${tab === "low" ? "active" : ""}`}
          onClick={() => setTab("low")}
        >
          Low stock ({grouped.low.length})
        </button>
        <button
          className={`chip ${tab === "out" ? "active" : ""}`}
          onClick={() => setTab("out")}
        >
          Out of stock ({grouped.out.length})
        </button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title={
            tab === "all"
              ? "No products yet"
              : tab === "low"
                ? "No low-stock products"
                : "No out-of-stock products"
          }
          message={
            tab === "all"
              ? "Add products to start managing inventory."
              : "Inventory levels look healthy in this category."
          }
          action={
            tab === "all" ? (
              <Link className="btn btn-primary" to="/admin/products/new">
                <Icons.Plus size={16} /> Add product
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="card table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Threshold</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const status = stockStatus(p);
                return (
                  <tr key={p.id}>
                    <td data-label="Product">
                      <div className="row gap-2">
                        <img
                          src={p.images[0]}
                          alt=""
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            objectFit: "cover",
                          }}
                        />
                        <span className="bold">{p.name}</span>
                      </div>
                    </td>
                    <td data-label="Price">{formatPrice(p.price)}</td>
                    <td data-label="Stock" className="bold">
                      {p.stockQuantity}
                    </td>
                    <td data-label="Threshold" className="muted">
                      {p.lowStockThreshold}
                    </td>
                    <td data-label="Status">
                      {status === "out-of-stock" && (
                        <span className="badge badge-danger">Out of stock</span>
                      )}
                      {status === "low-stock" && (
                        <span className="badge badge-warn">Low stock</span>
                      )}
                      {status === "in-stock" && (
                        <span className="badge badge-success">In stock</span>
                      )}
                    </td>
                    <td>
                      <div className="row gap-2 wrap">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openAdjust(p)}
                        >
                          Adjust stock
                        </button>
                        {p.stockQuantity <= 0 ? (
                          <button
                            className="btn btn-accent btn-sm"
                            onClick={() => toggleAvailability(p)}
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => toggleAvailability(p)}
                          >
                            Mark out of stock
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust stock modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Adjust stock — ${editing.name}` : "Adjust stock"}
        footer={
          <>
            <button
              className="btn btn-ghost"
              onClick={() => setEditing(null)}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={saveAdjust}
              disabled={busy}
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        {editing && (
          <>
            <p className="small muted">
              Current stock: <strong>{editing.stockQuantity}</strong>. Setting
              this to 0 will automatically mark the product as{" "}
              <strong>out of stock</strong>.
            </p>
            <div className="field">
              <span className="label">New quantity</span>
              <QuantityStepper value={draft} min={0} onChange={setDraft} />
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
