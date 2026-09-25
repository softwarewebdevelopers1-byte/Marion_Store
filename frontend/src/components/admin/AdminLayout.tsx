import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useStoreConfig } from "../../config/store";
import { useAuth } from "../../auth/AuthContext";
import { Icons } from "../ui";

const nav = [
  {
    to: "/admin",
    end: true,
    label: "Dashboard",
    icon: <Icons.Grid size={18} />,
  },
  {
    to: "/admin/products",
    end: false,
    label: "Products",
    icon: <Icons.Box size={18} />,
  },
  {
    to: "/admin/inventory",
    end: false,
    label: "Inventory",
    icon: <Icons.Trend size={18} />,
  },
  {
    to: "/admin/settings",
    end: false,
    label: "Settings",
    icon: <Icons.Settings size={18} />,
  },
];

export default function AdminLayout() {
  const { logout, seller } = useAuth();
  const storeConfig = useStoreConfig();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    if (window.matchMedia("(min-width: 861px)").matches) return true;
    return localStorage.getItem("admin.sidebarOpen") === "true";
  });

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia("(min-width: 861px)").matches) {
        setSidebarOpen(true);
      } else {
        const saved = localStorage.getItem("admin.sidebarOpen");
        if (saved !== null) {
          setSidebarOpen(saved === "true");
        } else {
          setSidebarOpen(false);
        }
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggle = () => {
    const next = !sidebarOpen;
    setSidebarOpen(next);
    localStorage.setItem("admin.sidebarOpen", String(next));
  };

  return (
    <div
      className={`admin-shell ${sidebarOpen ? "is-open" : "is-collapsed"}`}
    >
      <aside className="admin-side" id="admin-sidebar">
        <Link to="/" className="brand" style={{ padding: "0 8px 16px" }}>
          <img src={storeConfig.logo} alt="" width={28} height={28} />
          <span className="hide-mobile">{storeConfig.name}</span>
        </Link>
        <div className="small muted" style={{ padding: "0 12px 12px" }}>
          Seller panel
        </div>
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={() => {
              if (window.matchMedia("(max-width: 860px)").matches) {
                setSidebarOpen(false);
              }
            }}
            className={({ isActive }) =>
              `admin-side__link ${isActive ? "active" : ""}`
            }
            title={n.label}
          >
            {n.icon}
            <span>{n.label}</span>
          </NavLink>
        ))}
        <div style={{ flex: 1 }} />
        <Link to="/" className="admin-side__link" title="View storefront">
          <Icons.Arrow size={18} />
          <span>View storefront</span>
        </Link>
      </aside>
      <main className="admin-main">
        <div className="admin-topbar">
          <button
            type="button"
            className="btn-icon"
            onClick={toggle}
            aria-label="Toggle sidebar"
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar"
          >
            {sidebarOpen ? <Icons.X size={20} /> : <Icons.Menu size={20} />}
          </button>
          <span className="small muted" style={{ flex: 1 }}>
            {seller?.displayName || storeConfig.sellerName}
          </span>
          <button
            type="button"
            className="btn-icon"
            title="Logout"
            onClick={logout}
            aria-label="Logout"
          >
            <Icons.LogOut size={18} />
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
