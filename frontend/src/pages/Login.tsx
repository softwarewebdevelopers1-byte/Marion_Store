import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { storeConfig } from "../config/store";
import { Icons } from "../components/ui";
import { HttpError } from "../services/http";

interface LocationState {
  from?: string;
}

export default function Login() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? "/admin";
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authed") {
      void navigate(from, { replace: true });
    }
  }, [status, navigate, from]);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const clearError = () => setError(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      void navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.status === 401) {
          setError("Invalid email or password.");
        } else if (err.status === 403) {
          setError("Your seller account is not active. Contact support.");
        } else {
          setError(err.message || "Something went wrong. Please try again.");
        }
      } else if (err instanceof TypeError) {
        setError(
          "Cannot reach the server. Check your connection and try again.",
        );
      } else {
        setError(
          err instanceof Error ? err.message : "Something went wrong. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="login-page"
      style={
        {
          "--login-card-max": "420px",
        } as React.CSSProperties
      }
    >
      <div className="login-card">
        <div className="login-head">
          <img
            src={storeConfig.logo}
            alt=""
            width={48}
            height={48}
            style={{ borderRadius: 12, objectFit: "cover" }}
          />
          <h1 style={{ margin: 0 }}>{storeConfig.name}</h1>
          <p className="small muted" style={{ margin: 0, maxWidth: 320, textAlign: "center" }}>
            Access your seller dashboard to manage products and inventory.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="stack gap-3" noValidate>
          <div className="field">
            <label className="label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError();
              }}
              placeholder="you@example.com"
              disabled={submitting}
              ref={emailRef}
              required
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="login-password">
              Password
            </label>
            <div className="input-group">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="input"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
                placeholder="Your password"
                disabled={submitting}
                required
              />
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowPassword((s) => !s)}
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={submitting}
              >
                {showPassword ? (
                  <Icons.EyeOff size={18} />
                ) : (
                  <Icons.Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="field-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="login-footer">
          <a href="/" className="small muted">
            ← Not a seller? Return to the storefront
          </a>
        </div>
      </div>
    </div>
  );
}
