import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { productService } from "../../services";
import type { Category, Product, ProductInput } from "../../types";
import { CATEGORIES } from "../../types";
import { Icons, QuantityStepper, useToast } from "../../components/ui";

const EMPTY: ProductInput = {
  name: "",
  description: "",
  price: 0,
  compareAtPrice: undefined,
  images: [],
  category: "Other",
  stockQuantity: 0,
  lowStockThreshold: 5,
  isFeatured: false,
  isActive: true,
};

export default function ProductEditor() {
  const { id } = useParams();
  const isNew = id === "new" || !id;
  const navigate = useNavigate();
  const { push } = useToast();

  const [form, setForm] = useState<ProductInput>(EMPTY);
  const [imageInput, setImageInput] = useState("");
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) {
      setForm(EMPTY);
      return;
    }
    let alive = true;
    setLoading(true);
    productService
      .getById(id!)
      .then((p) => {
        if (!alive) return;
        if (!p) {
          push("Product not found.", "error");
          navigate("/admin/products");
          return;
        }
        const {
          name,
          description,
          price,
          compareAtPrice,
          images,
          category,
          stockQuantity,
          lowStockThreshold,
          isFeatured,
          isActive,
        } = p;
        setForm({
          name,
          description,
          price,
          compareAtPrice: compareAtPrice ?? undefined,
          images,
          category,
          stockQuantity,
          lowStockThreshold,
          isFeatured,
          isActive,
        });
        setImageKeys(p.imageKeys ?? []);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, isNew, navigate, push]);

  function set<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key as string])
      setErrors((e) => ({ ...e, [key as string]: "" }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Product name is required.";
    if (!form.description.trim()) e.description = "Description is required.";
    if (!Number.isFinite(form.price) || form.price < 0)
      e.price = "Enter a valid price.";
    if (
      form.compareAtPrice !== undefined &&
      form.compareAtPrice !== null &&
      (form.compareAtPrice < 0 || form.compareAtPrice <= form.price)
    ) {
      e.compareAtPrice = "Compare-at price must be greater than the price.";
    }
    if (form.stockQuantity < 0) e.stockQuantity = "Stock cannot be negative.";
    if (form.lowStockThreshold < 0)
      e.lowStockThreshold = "Threshold cannot be negative.";
    if (form.images.length === 0) e.images = "Add at least one image URL.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function addImage() {
    const url = imageInput.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) {
      push("Enter a valid image URL (http/https).", "error");
      return;
    }
    set("images", [...form.images, url]);
    setImageInput("");
  }

  function removeImage(i: number) {
    if (!isNew) {
      const key = imageKeys[i];
      if (key) {
        productService
          .removeImage(id!, key)
          .catch(() => push("Could not remove image.", "error"));
      }
    }
    const nextKeys = [...imageKeys];
    nextKeys.splice(i, 1);
    setImageKeys(nextKeys);
    set(
      "images",
      form.images.filter((_, idx) => idx !== i),
    );
  }

  function moveImage(i: number, dir: -1 | 1) {
    const next = [...form.images];
    const nextKeys = [...imageKeys];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    [nextKeys[i], nextKeys[j]] = [nextKeys[j], nextKeys[i]];
    set("images", next);
    setImageKeys(nextKeys);
    if (!isNew && id) {
      productService
        .reorderImages(id, nextKeys)
        .catch(() => push("Could not reorder images.", "error"));
    }
  }

  async function uploadFiles(files: FileList) {
    if (!id || isNew) {
      push("Save the product first before uploading images.", "error");
      return;
    }
    const uploaded = await productService.uploadImages(id, files);
    if (uploaded) {
      set("images", [...form.images, ...uploaded]);
      push(`${uploaded.length} image(s) uploaded.`, "success");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      push("Please fix the highlighted fields.", "error");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await productService.create(form);
        push("Product created successfully.", "success");
      } else {
        await productService.update(id!, form);
        push("Product updated successfully.", "success");
      }
      navigate("/admin/products");
    } catch {
      push("Could not save product. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="skeleton" style={{ height: 400 }} />;

  return (
    <>
      <div className="page-head">
        <div>
          <Link to="/admin/products" className="small bold">
            ← Back to products
          </Link>
          <h1 style={{ marginTop: 6 }}>
            {isNew ? "Add product" : "Edit product"}
          </h1>
        </div>
        {!isNew && (
          <span className="small muted">
            Last updated {new Date().toLocaleDateString()}
          </span>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="stack gap-4"
        style={{ maxWidth: 820 }}
      >
        {/* Basics */}
        <section className="card card-pad">
          <h3>Product information</h3>
          <div className="field">
            <label className="label" htmlFor="p-name">
              Name *
            </label>
            <input
              id="p-name"
              className="input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Nike Air Max 270"
            />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>
          <div className="field">
            <label className="label" htmlFor="p-desc">
              Description *
            </label>
            <textarea
              id="p-desc"
              className="textarea"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the product, materials, sizing, etc."
            />
            {errors.description && (
              <div className="field-error">{errors.description}</div>
            )}
          </div>
          <div className="field">
            <label className="label" htmlFor="p-cat">
              Category *
            </label>
            <select
              id="p-cat"
              className="select"
              value={form.category}
              onChange={(e) => set("category", e.target.value as Category)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Pricing */}
        <section className="card card-pad">
          <h3>Pricing</h3>
          <div className="row gap-4 wrap">
            <div className="field grow" style={{ minWidth: 200 }}>
              <label className="label" htmlFor="p-price">
                Price (KES) *
              </label>
              <input
                id="p-price"
                className="input"
                type="number"
                min={0}
                step="1"
                value={form.price || ""}
                onChange={(e) => set("price", Number(e.target.value))}
              />
              {errors.price && (
                <div className="field-error">{errors.price}</div>
              )}
            </div>
            <div className="field grow" style={{ minWidth: 200 }}>
              <label className="label" htmlFor="p-cmp">
                Compare-at price (optional)
              </label>
              <input
                id="p-cmp"
                className="input"
                type="number"
                min={0}
                step="1"
                value={form.compareAtPrice ?? ""}
                onChange={(e) =>
                  set(
                    "compareAtPrice",
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
              />
              {errors.compareAtPrice && (
                <div className="field-error">{errors.compareAtPrice}</div>
              )}
            </div>
          </div>
        </section>

        {/* Inventory */}
        <section className="card card-pad">
          <h3>Inventory</h3>
          <p className="small muted">
            Stock quantity determines availability. When it reaches zero the
            product shows as
            <strong> out of stock</strong> on the storefront.
          </p>
          <div className="row gap-4 wrap">
            <div className="field">
              <span className="label">Stock quantity *</span>
              <QuantityStepper
                value={form.stockQuantity}
                min={0}
                onChange={(n) => set("stockQuantity", n)}
              />
              {errors.stockQuantity && (
                <div className="field-error">{errors.stockQuantity}</div>
              )}
            </div>
            <div className="field" style={{ minWidth: 180 }}>
              <label className="label" htmlFor="p-low">
                Low-stock threshold
              </label>
              <input
                id="p-low"
                className="input"
                type="number"
                min={0}
                step="1"
                value={form.lowStockThreshold}
                onChange={(e) =>
                  set("lowStockThreshold", Number(e.target.value))
                }
              />
              <div className="help">
                Warn when stock falls to or below this number.
              </div>
              {errors.lowStockThreshold && (
                <div className="field-error">{errors.lowStockThreshold}</div>
              )}
            </div>
          </div>
        </section>

        {/* Images */}
        <section className="card card-pad">
          <h3>Images</h3>
          <p className="small muted">
            Add image URLs or upload files. The first image is the
            cover.&nbsp;{!isNew && "Changes are saved to the backend instantly."}
          </p>
          <div className="row gap-2">
            <input
              className="input"
              placeholder="https://…"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addImage();
                }
              }}
            />
            <button type="button" className="btn btn-ghost" onClick={addImage}>
              <Icons.Plus size={16} /> Add
            </button>
          </div>
          {!isNew && (
            <div
              style={{ marginTop: 8 }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                uploadFiles(e.dataTransfer.files);
              }}
              onClick={() =>
                document.getElementById("img-upload")?.click()
              }
            >
              <label
                className={`dropzone ${dragOver ? "drag-over" : ""}`}
                htmlFor="img-upload"
              >
                <div className="dropzone-icon">
                  <Icons.Box size={24} />
                </div>
                <div className="small muted">
                  Drop image files here or click to browse
                </div>
              </label>
              <input
                id="img-upload"
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => uploadFiles(e.target.files!)}
              />
            </div>
          )}
          {errors.images && (
            <div className="field-error" style={{ marginTop: 6 }}>
              {errors.images}
            </div>
          )}

          {form.images.length > 0 && (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "16px 0 0",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 12,
              }}
            >
              {form.images.map((src, i) => (
                <li
                  key={src + i}
                  className="card"
                  style={{ overflow: "hidden" }}
                >
                  <img
                    src={src}
                    alt=""
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      objectFit: "cover",
                    }}
                  />
                  <div className="row between" style={{ padding: 6 }}>
                    <div className="row gap-2">
                      <button
                        type="button"
                        className="btn-icon"
                        disabled={i === 0}
                        onClick={() => moveImage(i, -1)}
                        aria-label="Move image up"
                        style={{ padding: 4, fontSize: 12 }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        disabled={i === form.images.length - 1}
                        onClick={() => moveImage(i, 1)}
                        aria-label="Move image down"
                        style={{ padding: 4, fontSize: 12 }}
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => removeImage(i)}
                      aria-label="Remove image"
                      style={{ padding: 4, color: "var(--danger)" }}
                    >
                      <Icons.Trash size={14} />
                    </button>
                  </div>
                  {i === 0 && (
                    <div
                      className="tiny muted"
                      style={{ textAlign: "center", paddingBottom: 6 }}
                    >
                      Main image
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Options */}
        <section className="card card-pad">
          <h3>Visibility & promotion</h3>
          <label className="row gap-2" style={{ marginBottom: 10 }}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
            />
            <span>
              <strong>Visible on storefront</strong>
              <div className="tiny muted">
                Uncheck to hide this product without deleting it.
              </div>
            </span>
          </label>
          <label className="row gap-2">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => set("isFeatured", e.target.checked)}
            />
            <span>
              <strong>Featured</strong>
              <div className="tiny muted">
                Featured products can appear in the homepage highlights.
              </div>
            </span>
          </label>
        </section>

        {/* Submit */}
        <div className="row gap-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : isNew ? "Create product" : "Save changes"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate("/admin/products")}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}

/* keep Product import referenced */
void (null as unknown as Product);
