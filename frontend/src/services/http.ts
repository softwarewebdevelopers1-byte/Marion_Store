import { storeConfig } from "../config/store";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export class HttpError extends Error {
  status: number;
  code?: string;
  fields?: Record<string, string>;

  constructor(
    status: number,
    message: string,
    code?: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

let tokenGetter: (() => string | null) | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;

export function setAuthHooks(
  get: () => string | null,
  refresh: () => Promise<string | null>,
): void {
  tokenGetter = get;
  refreshHandler = refresh;
}

export function resetAuthHooks(): void {
  tokenGetter = null;
  refreshHandler = null;
}

function isAuthPath(path: string): boolean {
  return (
    path.includes("/auth/login") || path.includes("/auth/refresh")
  );
}

async function httpInternal<T>(
  path: string,
  init?: RequestInit,
  retried = false,
): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const token = tokenGetter ? tokenGetter() : null;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (init?.headers) {
    const callerHeaders = init.headers;
    if (callerHeaders instanceof Headers) {
      callerHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(callerHeaders)) {
      for (const [key, value] of callerHeaders) {
        headers[key] = value;
      }
    } else {
      Object.assign(headers, callerHeaders);
    }
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: init?.method ?? "GET",
      body: init?.body,
      headers,
      signal: init?.signal,
      credentials: init?.credentials ?? "same-origin",
      redirect: init?.redirect ?? "follow",
      mode: init?.mode ?? "cors",
    });
  } catch {
    throw new HttpError(
      0,
      "Cannot reach the server. Check your connection and try again.",
      "NETWORK_ERROR",
    );
  }

  if (res.ok) {
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  let errBody: {
    message?: string;
    code?: string;
    fields?: Record<string, string>;
  } = {};
  try {
    const text = await res.text();
    if (text) {
      errBody = JSON.parse(text);
    }
  } catch {
    // response body is not JSON
  }

  if (
    res.status === 401 &&
    refreshHandler &&
    !retried &&
    !isAuthPath(path)
  ) {
    const newToken = await refreshHandler();
    if (newToken) {
      return httpInternal<T>(path, init, true);
    }
    window.dispatchEvent(new CustomEvent("auth:expired"));
    throw new HttpError(401, "Session expired", "SESSION_EXPIRED");
  }

  const message = errBody.message ?? res.statusText ?? `HTTP ${res.status}`;
  throw new HttpError(res.status, message, errBody.code, errBody.fields);
}

export async function http<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  return httpInternal<T>(path, init, false);
}

void storeConfig;
