import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { storeConfig } from "../config/store";
import { Icons } from "./ui";

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <a href="#main" className="sr-only">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container">
          <Link
            to="/"
            className="brand"
            aria-label={`${storeConfig.name} home`}
          >
            <img src={storeConfig.logo} alt="" />
            <span>{storeConfig.name}</span>
          </Link>

          <nav className="nav-links hide-mobile" aria-label="Main navigation">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/products">Products</NavLink>
          </nav>

          <div className="grow" />

          <Link
            to="/products"
            className="btn-icon hide-mobile"
            aria-label="Search products"
          >
            <Icons.Search size={18} />
          </Link>
          <Link to="/admin" className="btn btn-ghost btn-sm hide-mobile">
            Seller
          </Link>

          <button
            type="button"
            className="btn-icon show-mobile"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <Icons.Menu size={20} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <>
          <div
            className="drawer-backdrop"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            className="drawer"
            id="mobile-menu"
            role="dialog"
            aria-label="Menu"
          >
            <div className="row between" style={{ marginBottom: 16 }}>
              <strong>Menu</strong>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <Icons.X size={18} />
              </button>
            </div>
            <nav className="stack gap-2" aria-label="Mobile navigation">
              <NavLink
                to="/"
                end
                onClick={() => setMenuOpen(false)}
                className="admin-side__link"
                style={{ color: "var(--text)" }}
              >
                <Icons.Grid size={18} /> Home
              </NavLink>
              <NavLink
                to="/products"
                onClick={() => setMenuOpen(false)}
                className="admin-side__link"
                style={{ color: "var(--text)" }}
              >
                <Icons.Box size={18} /> Products
              </NavLink>
              <NavLink
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="admin-side__link"
                style={{ color: "var(--text)" }}
              >
                <Icons.Trend size={18} /> Seller dashboard
              </NavLink>
            </nav>
          </aside>
        </>
      )}

      <main id="main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container">
          <div
            style={{
              display: "grid",
              gap: 24,
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            }}
          >
            <div>
              <div
                className="row gap-2 bold"
                style={{ color: "var(--text)", marginBottom: 8 }}
              >
                <img src={storeConfig.logo} alt="" width={24} height={24} />
                {storeConfig.name}
              </div>
              <p className="small">{storeConfig.description}</p>
            </div>
            <div>
              <strong style={{ color: "var(--text)" }}>Shop</strong>
              <ul
                style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}
                className="stack gap-2"
              >
                <li>
                  <Link to="/products">All products</Link>
                </li>
                <li>
                  <Link to="/products?sort=newest">New arrivals</Link>
                </li>
                <li>
                  <Link to="/products?sort=popular">Popular</Link>
                </li>
              </ul>
            </div>
            <div>
              <strong style={{ color: "var(--text)" }}>Support</strong>
              <ul
                style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}
                className="stack gap-2"
              >
                <li>{storeConfig.supportHours}</li>
                <li>{storeConfig.country} delivery</li>
                <li>
                  <Link to="/admin">Seller dashboard</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="divider" />
          <div className="row between wrap gap-2">
            <span className="tiny">
              © {new Date().getFullYear()} {storeConfig.name}. All rights
              reserved.
            </span>
            <span className="tiny">Prices in {storeConfig.currency}</span>
          </div>
        </div>
      </footer>
    </>
  );
}
