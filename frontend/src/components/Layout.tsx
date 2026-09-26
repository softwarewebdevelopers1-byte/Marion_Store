import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useStoreConfig } from "../config/store";
import { Icons } from "./ui";

export default function Layout() {
  const { pathname } = useLocation();
  const storeConfig = useStoreConfig();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

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
        </div>
      </header>

      <main id="main">
        <Outlet />
      </main>

      <nav className="bottom-bar" aria-label="Mobile navigation">
        <NavLink
          to="/"
          end
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <Icons.Grid size={20} />
          <span>Home</span>
        </NavLink>
        <NavLink
          to="/products"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <Icons.Box size={20} />
          <span>Products</span>
        </NavLink>
        <NavLink
          to="/admin"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <Icons.Trend size={20} />
          <span>Seller</span>
        </NavLink>
      </nav>

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
