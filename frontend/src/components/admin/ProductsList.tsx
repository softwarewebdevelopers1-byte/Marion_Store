import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { productService, subscribe } from "../../services/productService";
import type { Product } from "../../types";
import { formatPrice, formatDate } from "../../utils/format";
import {
  EmptyState,
  Icons,
  Modal,
  stockStatus,
  useToast,
} from "../../components/ui";

export default function ProductsList() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  useEffect(() => {
    let alive = true;
    const load = () =>
      productService.listAdmin().then((p) => alive && setProducts(p));
    load();
    const unsub = subscribe(load);
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const filtered = useMemo(() => {
    if (!products) return null;
    const q = query.trim().toLowerCase();
    return q
      ? products.filter((p) =>
          `${p.name} ${p.category}`.toLowerCase().includes(q),
        )
      : products;
  }, [products, query]);

  async function toggleVisibility(p: Product) {
    try {
      await productService.patchVisibility(p.id, !p.isActive);
      push(
        p.isActive
          ? "Product hidden from storefront."
          : "Product is now visible.",
        "success",
      );
    } catch {
      push("Could not update visibility.", "error");
    }
  }

  async function remove() {
    if (!confirm) return;
    setBusy(true);
    try {
      await productService.remove(confirm.id);
      push("Product deleted.", "success");
      setConfirm(null);
    } catch {
      push("Could not delete product.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Products</h1>
          <p className="small" style={{ margin: 0 }}>
            {products ? `${products.length} total` : "Loading…"}
          </p>
        </div>
        <Link to="/admin/products/new" className="btn btn-primary">
          <Icons.Plus size={16} /> Add product
        </Link>
      </div>

      <div className="toolbar">
        <div className="search">
          <Icons.Search size={18} />
          <input
            className="input"
            type="search"
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {!filtered ? (
        <div className="skeleton" style={{ height: 320 }} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={
            products && products.length === 0
              ? "No products have been added yet."
              : "No matching products"
          }
          message={
            products && products.length === 0
              ? "Create your first product to get started."
              : "Try a different search term."
          }
          action={
            <Link className="btn btn-primary" to="/admin/products/new">
              <Icons.Plus size={16} /> Add product
            </Link>
          }
        />
      ) : (
        <div className="card table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Visibility</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
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
                        <div>
                          <div className="bold">{p.name}</div>
                          <div className="tiny muted">{p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Category">{p.category}</td>
                    <td data-label="Price">{formatPrice(p.price)}</td>
                    <td data-label="Stock">{p.stockQuantity}</td>
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
                    <td data-label="Visibility">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => toggleVisibility(p)}
                        title={
                          p.isActive
                            ? "Hide from storefront"
                            : "Show on storefront"
                        }
                      >
                        {p.isActive ? (
                          <>
                            <Icons.Eye size={14} /> Visible
                          </>
                        ) : (
                          <>
                            <Icons.EyeOff size={14} /> Hidden
                          </>
                        )}
                      </button>
                    </td>
                    <td data-label="Updated" className="small muted">
                      {formatDate(p.updatedAt)}
                    </td>
                    <td>
                      <div className="row gap-2">
                        <Link
                          className="btn btn-ghost btn-sm"
                          to={`/admin/products/${p.id}`}
                        >
                          <Icons.Edit size={14} /> Edit
                        </Link>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setConfirm(p)}
                          aria-label={`Delete ${p.name}`}
                        >
                          <Icons.Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Delete product?"
        footer={
          <>
            <button
              className="btn btn-ghost"
              onClick={() => setConfirm(null)}
              disabled={busy}
            >
              Cancel
            </button>
            <button className="btn btn-danger" onClick={remove} disabled={busy}>
              {busy ? "Deleting…" : "Delete product"}
            </button>
          </>
        }
      >
        <p>
          <strong>{confirm?.name}</strong> will be permanently removed from the
          store. This action cannot be undone.
        </p>
        <p className="small muted" style={{ margin: 0 }}>
          Tip: if you only want to take it off the storefront temporarily, use{" "}
          <em>Hide</em> instead.
        </p>
      </Modal>
    </>
  );
}
