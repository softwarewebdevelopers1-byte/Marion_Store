import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function FullPageSpinner({ label }: { label: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--bg)",
      }}
    >
      <div className="stack gap-3" style={{ alignItems: "center" }}>
        <div
          className="skeleton"
          style={{ width: 40, height: 40, borderRadius: "50%" }}
          aria-hidden="true"
        />
        <span className="small muted">{label}</span>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "idle" || status === "loading") {
    return <FullPageSpinner label="Checking your session…" />;
  }

  if (status === "unauthed") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <>{children}</>;
}
