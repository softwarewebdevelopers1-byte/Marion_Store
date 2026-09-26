import { lazy, Suspense, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import AdminLayout from "./components/admin/AdminLayout";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { ToastProvider } from "./components/ui";
import { fetchStoreConfig } from "./config/store";

const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./components/admin/Dashboard"));
const ProductsList = lazy(() => import("./components/admin/ProductsList"));
const ProductEditor = lazy(() => import("./components/admin/ProductEditor"));
const Inventory = lazy(() => import("./components/admin/Inventory"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageFallback() {
  return (
    <div className="container" style={{ padding: 40 }}>
      <div
        className="skeleton"
        style={{ height: 40, width: 240, marginBottom: 16 }}
      />
      <div className="skeleton" style={{ height: 320 }} />
    </div>
  );
}

function ThemeLoader() {
  useEffect(() => {
    fetchStoreConfig();
  }, []);
  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <Suspense fallback={<PageFallback />}>
        <ThemeLoader />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductsList />} />
            <Route path="products/:id" element={<ProductEditor />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ToastProvider>
  );
}