import { NavLink, Outlet, Link } from "react-router-dom";
import { Icons } from "../ui";
import { storeConfig } from "../../config/store";

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
];

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <aside className="admin-side">
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
            className={({ isActive }) =>
              `admin-side__link ${isActive ? "active" : ""}`
            }
          >
            {n.icon}
            <span>{n.label}</span>
          </NavLink>
        ))}
        <div style={{ flex: 1 }} />
        <Link to="/" className="admin-side__link">
          <Icons.Arrow size={18} />
          <span>View storefront</span>
        </Link>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
