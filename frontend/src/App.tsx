import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import AdminLayout from "./components/admin/AdminLayout";
import { ToastProvider } from "./components/ui";

const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Dashboard = lazy(() => import("./components/admin/Dashboard"));
const ProductsList = lazy(() => import("./components/admin/ProductsList"));
const ProductEditor = lazy(() => import("./components/admin/ProductEditor"));
const Inventory = lazy(() => import("./components/admin/Inventory"));
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

export default function App() {
  return (
    <ToastProvider>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductsList />} />
            <Route path="products/:id" element={<ProductEditor />} />
            <Route path="inventory" element={<Inventory />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ToastProvider>
  );
}
