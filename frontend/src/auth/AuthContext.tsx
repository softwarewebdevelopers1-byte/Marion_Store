import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import type { HttpError } from "../services/http";
import { useToast } from "../components/ui";

export type SellerRole = "SELLER" | "ADMIN";
export type SellerStatus =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "CLOSED";

export interface SellerStore {
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  themeColor?: string;
  currency: string;
  supportHours?: string;
  social?: { whatsapp?: string };
}

export interface PublicSeller {
  id: string;
  displayName: string;
  email: string;
  role: SellerRole;
  status: SellerStatus;
  store: SellerStore;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  seller: PublicSeller | null;
}

export type AuthStatus = "idle" | "loading" | "authed" | "unauthed";

interface AuthContextValue {
  seller: PublicSeller | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
}

const STORAGE_KEYS = {
  accessToken: "mp.accessToken",
  refreshToken: "mp.refreshToken",
  seller: "mp.seller",
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export { useAuthContext as useAuth };

function readTokens(): AuthState {
  const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
  const sellerRaw = localStorage.getItem(STORAGE_KEYS.seller);
  let seller: PublicSeller | null = null;
  if (sellerRaw) {
    try {
      seller = JSON.parse(sellerRaw) as PublicSeller;
    } catch {
      seller = null;
    }
  }
  return { accessToken, refreshToken, seller };
}

function persistTokens(accessToken: string | null, refreshToken: string | null): void {
  if (accessToken) {
    localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  } else {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  } else {
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function fetchMe(
  accessToken: string,
  signal?: AbortSignal,
): Promise<{ seller: PublicSeller }> {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  });
  if (!res.ok) {
    const err = new Error(
      res.status === 401 ? "Session expired" : "Unable to verify session",
    ) as HttpError;
    (err as { status: number }).status = res.status;
    throw err;
  }
  return res.json();
}

async function fetchLogin(
  email: string,
  password: string,
  signal?: AbortSignal,
): Promise<{ seller: { id: string; role: string; status: string }; tokens: Tokens }> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    signal,
  });
  if (!res.ok) {
    let body: { message?: string; code?: string } = {};
    try {
      body = (await res.json()) as { message?: string; code?: string };
    } catch {
      // body not JSON
    }
    const err = new Error(body.message ?? "Login failed") as HttpError;
    (err as { status: number }).status = res.status;
    (err as { code?: string }).code = body.code;
    throw err;
  }
  return res.json();
}

async function fetchRefreshToken(
  refreshToken: string,
  signal?: AbortSignal,
): Promise<{ tokens: Tokens }> {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    signal,
  });
  if (!res.ok) {
    throw new Error("Refresh failed");
  }
  return res.json();
}

async function fetchLogout(
  accessToken: string,
  signal?: AbortSignal,
): Promise<void> {
  await fetch(`${BASE_URL}/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  }).catch(() => {});
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { push } = useToast();
  const [seller, setSeller] = useState<PublicSeller | null>(
    readTokens().seller,
  );
  const [tokens, setTokens] = useState<{
    accessToken: string | null;
    refreshToken: string | null;
  }>({
    accessToken: null,
    refreshToken: null,
  });
  const [status, setStatus] = useState<AuthStatus>("idle");

  useEffect(() => {
    const { accessToken, refreshToken, seller: cachedSeller } = readTokens();

    if (!accessToken || !refreshToken) {
      setSeller(null);
      setTokens({ accessToken: null, refreshToken: null });
      setStatus("unauthed");
      return;
    }

    setTokens({ accessToken, refreshToken });
    setSeller(cachedSeller);
    setStatus("loading");

    let cancelled = false;
    void cachedSeller;

    fetchMe(accessToken)
      .then((result) => {
        if (cancelled) return;
        const sellerData = result.seller;
        setSeller(sellerData);
        localStorage.setItem(STORAGE_KEYS.seller, JSON.stringify(sellerData));
        setStatus("authed");
      })
      .catch(async (err) => {
        if (cancelled) return;
        const httpErr = err as { status?: number };
        if (httpErr.status === 401) {
          try {
            const newTokens = await fetchRefreshToken(refreshToken);
            persistTokens(
              newTokens.tokens.accessToken,
              newTokens.tokens.refreshToken,
            );
            setTokens({
              accessToken: newTokens.tokens.accessToken,
              refreshToken: newTokens.tokens.refreshToken,
            });
            const result = await fetchMe(newTokens.tokens.accessToken);
            setSeller(result.seller);
            localStorage.setItem(
              STORAGE_KEYS.seller,
              JSON.stringify(result.seller),
            );
            setStatus("authed");
          } catch {
            persistTokens(null, null);
            localStorage.removeItem(STORAGE_KEYS.seller);
            setSeller(null);
            setTokens({ accessToken: null, refreshToken: null });
            setStatus("unauthed");
          }
        } else {
          persistTokens(null, null);
          localStorage.removeItem(STORAGE_KEYS.seller);
          setSeller(null);
          setTokens({ accessToken: null, refreshToken: null });
          setStatus("unauthed");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onExpired = () => {
      persistTokens(null, null);
      localStorage.removeItem(STORAGE_KEYS.seller);
      setSeller(null);
      setTokens({ accessToken: null, refreshToken: null });
      setStatus("unauthed");
      push("Session expired. Please sign in again.", "error");
      void navigate("/login", { replace: true });
    };
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, [navigate, push]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let { setAuthHooks, resetAuthHooks } = {
      setAuthHooks: null as null | ((g: () => string | null, r: () => Promise<string | null>) => void),
      resetAuthHooks: null as null | (() => void),
    };
    import("../services/http")
      .then((mod) => {
        setAuthHooks = mod.setAuthHooks;
        resetAuthHooks = mod.resetAuthHooks;
        if (setAuthHooks) {
          setAuthHooks(
            () => tokens.accessToken,
            async () => {
              if (!tokens.refreshToken) {
                return null;
              }
              try {
                const result = await fetchRefreshToken(tokens.refreshToken);
                persistTokens(
                  result.tokens.accessToken,
                  result.tokens.refreshToken,
                );
                setTokens({
                  accessToken: result.tokens.accessToken,
                  refreshToken: result.tokens.refreshToken,
                });
                return result.tokens.accessToken;
              } catch {
                persistTokens(null, null);
                localStorage.removeItem(STORAGE_KEYS.seller);
                setSeller(null);
                setTokens({ accessToken: null, refreshToken: null });
                setStatus("unauthed");
                return null;
              }
            },
          );
        }
      });
    return () => {
      if (resetAuthHooks) resetAuthHooks();
    };
  }, [tokens.accessToken, tokens.refreshToken]);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const result = await fetchLogin(email, password);
      persistTokens(
        result.tokens.accessToken,
        result.tokens.refreshToken,
      );
      setTokens({
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      });

      // Fetch full seller profile via /me
      try {
        const meResult = await fetchMe(result.tokens.accessToken);
        const fullSeller = meResult.seller;
        setSeller(fullSeller);
        localStorage.setItem(STORAGE_KEYS.seller, JSON.stringify(fullSeller));
      } catch {
        // If /me fails, use minimal seller from login response
        const minimalSeller: PublicSeller = {
          id: result.seller.id,
          displayName: "",
          email: "",
          role: result.seller.role as SellerRole,
          status: result.seller.status as SellerStatus,
          store: {
            slug: "",
            name: "",
            currency: "KES",
          },
        };
        setSeller(minimalSeller);
        localStorage.setItem(STORAGE_KEYS.seller, JSON.stringify(minimalSeller));
      }

      setStatus("authed");
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    const token = tokens.accessToken;
    persistTokens(null, null);
    localStorage.removeItem(STORAGE_KEYS.seller);
    setSeller(null);
    setTokens({ accessToken: null, refreshToken: null });
    setStatus("unauthed");

    if (token) {
      await fetchLogout(token).catch(() => {});
    }
  }, [tokens.accessToken]);

  const refresh = useCallback(async (): Promise<string | null> => {
    if (!tokens.refreshToken) {
      persistTokens(null, null);
      localStorage.removeItem(STORAGE_KEYS.seller);
      setSeller(null);
      setTokens({ accessToken: null, refreshToken: null });
      setStatus("unauthed");
      return null;
    }
    try {
      const result = await fetchRefreshToken(tokens.refreshToken);
      persistTokens(
        result.tokens.accessToken,
        result.tokens.refreshToken,
      );
      setTokens({
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      });
      return result.tokens.accessToken;
    } catch {
      persistTokens(null, null);
      localStorage.removeItem(STORAGE_KEYS.seller);
      setSeller(null);
      setTokens({ accessToken: null, refreshToken: null });
      setStatus("unauthed");
      return null;
    }
  }, [tokens.refreshToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      seller,
      status,
      login,
      logout,
      refresh,
    }),
    [seller, status, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
