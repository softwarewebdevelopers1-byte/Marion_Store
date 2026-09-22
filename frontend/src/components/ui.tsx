import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Product, StockStatus } from "../types";

/* ---------- Icons (inline, no dependency) ---------- */
type IconProps = { size?: number; className?: string };
const base = (p: IconProps) => ({
  width: p.size ?? 20,
  height: p.size ?? 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: p.className,
  "aria-hidden": true,
});

export const Icons = {
  Search: (p: IconProps) => (
    <svg {...base(p)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  Cart: (p: IconProps) => (
    <svg {...base(p)}>
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path d="M2 3h2l2.4 12.4A2 2 0 0 0 8.4 17H19a2 2 0 0 0 2-1.6L22 7H5" />
    </svg>
  ),
  Whats: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.2-5.6A8.5 8.5 0 1 1 21 11.5Z" />
    </svg>
  ),
  Menu: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  ),
  X: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  Plus: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Minus: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M5 12h14" />
    </svg>
  ),
  Edit: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  Trash: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
    </svg>
  ),
  Grid: (p: IconProps) => (
    <svg {...base(p)}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Box: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M21 8v8a2 2 0 0 1-1 1.7l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.7l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8Z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </svg>
  ),
  Alert: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  ),
  Filter: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M22 3H2l8 9.5V19l4 2v-8.5Z" />
    </svg>
  ),
  Eye: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M17.9 17.9A10.4 10.4 0 0 1 12 19c-6.5 0-10-7-10-7a17 17 0 0 1 4.2-5.2M9.9 4.2A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2 2.8M1 1l22 22" />
    </svg>
  ),
  Check: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  Arrow: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
  Trend: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="m22 7-8.5 8.5-5-5L2 17" />
      <path d="M16 7h6v6" />
    </svg>
  ),
  Star: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="m12 2 3.1 6.3 7 1-5 4.9 1.2 6.9L12 17.8 5.7 21l1.2-6.8-5-4.9 7-1Z" />
    </svg>
  ),
};

/* ---------- Stock status helper ---------- */
export function stockStatus(
  p: Pick<Product, "stockQuantity" | "lowStockThreshold">,
): StockStatus {
  if (p.stockQuantity <= 0) return "out-of-stock";
  if (p.stockQuantity <= p.lowStockThreshold) return "low-stock";
  return "in-stock";
}

export function StockBadge({ product }: { product: Product }) {
  const status = stockStatus(product);
  if (status === "out-of-stock") {
    return <span className="badge badge-danger">Out of stock</span>;
  }
  if (status === "low-stock") {
    return (
      <span className="badge badge-warn">
        Only {product.stockQuantity} left
      </span>
    );
  }
  return (
    <span className="badge badge-success">
      {product.stockQuantity} available
    </span>
  );
}

/* ---------- Modal ---------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  labelledBy = "modal-title",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  labelledBy?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h3 id={labelledBy} style={{ margin: 0 }}>
            {title}
          </h3>
          <button
            className="btn-icon"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icons.X size={18} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- States ---------- */
export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="state">
      <div className="state__icon">
        <Icons.Box size={24} />
      </div>
      <h3 style={{ margin: 0 }}>{title}</h3>
      {message && <p style={{ maxWidth: 400 }}>{message}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state">
      <div
        className="state__icon"
        style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
      >
        <Icons.Alert size={24} />
      </div>
      <h3 style={{ margin: 0 }}>Something went wrong</h3>
      <p style={{ maxWidth: 400 }}>{message}</p>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div className="card product-card" aria-hidden="true">
      <div
        className="product-card__media skeleton"
        style={{ borderRadius: 0 }}
      />
      <div className="product-card__body">
        <div className="skeleton" style={{ height: 14, width: "80%" }} />
        <div className="skeleton" style={{ height: 14, width: "50%" }} />
        <div
          className="skeleton"
          style={{ height: 18, width: "40%", marginTop: 6 }}
        />
      </div>
    </div>
  );
}

/* ---------- Toasts ---------- */
type Toast = {
  id: string;
  message: string;
  kind: "info" | "success" | "error";
};
const ToastCtx = createContext<{
  push: (m: string, k?: Toast["kind"]) => void;
}>({ push: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, kind: Toast["kind"] = "info") => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  const value = useMemo(() => ({ push }), [push]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.kind}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* ---------- Quantity stepper ---------- */
export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 9999,
  label = "Quantity",
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label?: string;
}) {
  const set = (n: number) =>
    onChange(Math.max(min, Math.min(max, Math.floor(n))));
  return (
    <div className="row gap-2" role="group" aria-label={label}>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => set(value - 1)}
        disabled={value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
      >
        <Icons.Minus size={16} />
      </button>
      <input
        className="input"
        style={{ width: 72, textAlign: "center" }}
        type="number"
        value={value}
        min={min}
        max={max}
        aria-label={label}
        onChange={(e) => set(Number(e.target.value))}
      />
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => set(value + 1)}
        disabled={value >= max}
        aria-label={`Increase ${label.toLowerCase()}`}
      >
        <Icons.Plus size={16} />
      </button>
    </div>
  );
}
